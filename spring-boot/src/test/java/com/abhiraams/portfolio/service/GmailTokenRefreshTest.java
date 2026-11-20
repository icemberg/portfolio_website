package com.abhiraams.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabase;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2RefreshToken;
import org.springframework.test.util.ReflectionTestUtils;

import com.abhiraams.portfolio.config.GmailConfig;
import com.sun.net.httpserver.HttpServer;

/**
 * The contact form used the stored Gmail access token as-is, so it stopped working about an
 * hour after each /login. These tests run the real GmailConfig wiring against the real token
 * table (schema.sql on H2) and a local stand-in for Google's token endpoint.
 */
class GmailTokenRefreshTest {

    private static final String OWNER = "owner-sub-123";
    private static final String GMAIL_SEND = "https://www.googleapis.com/auth/gmail.send";

    private HttpServer tokenEndpoint;
    private final List<String> tokenRequests = new CopyOnWriteArrayList<>();
    private volatile int responseStatus = 200;
    private volatile String responseBody;

    private EmbeddedDatabase database;
    private OAuth2AuthorizedClientService clientService;
    private GmailApiService gmailApiService;
    private ClientRegistration google;

    @BeforeEach
    void setUp() throws IOException {
        tokenEndpoint = HttpServer.create(new InetSocketAddress(InetAddress.getLoopbackAddress(), 0), 0);
        tokenEndpoint.createContext("/token", exchange -> {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            tokenRequests.add(URLDecoder.decode(body, StandardCharsets.UTF_8));
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(responseStatus, bytes.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(bytes);
            }
        });
        tokenEndpoint.start();

        google = ClientRegistration.withRegistrationId("google")
                .clientId("client-id")
                .clientSecret("client-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.example.test/o/oauth2/v2/auth")
                .tokenUri("http://127.0.0.1:" + tokenEndpoint.getAddress().getPort() + "/token")
                .scope("openid", GMAIL_SEND)
                .build();
        InMemoryClientRegistrationRepository registrations = new InMemoryClientRegistrationRepository(google);

        database = new EmbeddedDatabaseBuilder()
                .setType(EmbeddedDatabaseType.H2)
                .generateUniqueName(true)
                .addScript("classpath:schema.sql") // the same table production uses
                .build();

        GmailConfig config = new GmailConfig();
        clientService = config.authorizedClientService(new JdbcTemplate(database), registrations);
        OAuth2AuthorizedClientManager manager = config.authorizedClientManager(registrations, clientService);

        gmailApiService = new GmailApiService(manager);
        ReflectionTestUtils.setField(gmailApiService, "ownerPrincipal", OWNER);
    }

    @AfterEach
    void tearDown() {
        tokenEndpoint.stop(0);
        database.shutdown();
    }

    @Test
    void expiredAccessTokenIsRefreshedAndSavedWithTheSameRefreshToken() {
        storeAuthorization("access-1", Instant.now().minus(Duration.ofHours(2)), "refresh-1");
        // Google's refresh response: a new access token and NO new refresh token
        responseBody = """
                {"access_token":"access-2","token_type":"Bearer","expires_in":3599,
                 "scope":"openid https://www.googleapis.com/auth/gmail.send"}""";

        OAuth2AuthorizedClient client = gmailApiService.loadAuthorizedClient();

        assertThat(client.getAccessToken().getTokenValue()).isEqualTo("access-2");
        assertThat(tokenRequests).singleElement().satisfies(body -> assertThat(body)
                .contains("grant_type=refresh_token")
                .contains("refresh_token=refresh-1"));

        // saved back, keeping the refresh token so the *next* expiry can be refreshed too
        OAuth2AuthorizedClient stored = clientService.loadAuthorizedClient("google", OWNER);
        assertThat(stored.getAccessToken().getTokenValue()).isEqualTo("access-2");
        assertThat(stored.getAccessToken().getExpiresAt()).isAfter(Instant.now().plus(Duration.ofMinutes(55)));
        assertThat(stored.getRefreshToken()).isNotNull();
        assertThat(stored.getRefreshToken().getTokenValue()).isEqualTo("refresh-1");
    }

    @Test
    void secondExpiryIsRefreshedWithTheKeptRefreshToken() {
        storeAuthorization("access-1", Instant.now().minus(Duration.ofHours(2)), "refresh-1");
        responseBody = "{\"access_token\":\"access-2\",\"token_type\":\"Bearer\",\"expires_in\":3599}";
        gmailApiService.loadAuthorizedClient();

        // an hour later: the refreshed token has expired as well
        OAuth2AuthorizedClient afterFirstRefresh = clientService.loadAuthorizedClient("google", OWNER);
        storeAuthorization("access-2", Instant.now().minus(Duration.ofHours(2)),
                afterFirstRefresh.getRefreshToken().getTokenValue());
        responseBody = "{\"access_token\":\"access-3\",\"token_type\":\"Bearer\",\"expires_in\":3599}";

        assertThat(gmailApiService.loadAuthorizedClient().getAccessToken().getTokenValue()).isEqualTo("access-3");
        assertThat(tokenRequests).hasSize(2).last().asString().contains("refresh_token=refresh-1");
    }

    @Test
    void validAccessTokenIsUsedWithoutCallingGoogle() {
        storeAuthorization("access-1", Instant.now().minus(Duration.ofMinutes(10)), "refresh-1");

        assertThat(gmailApiService.loadAuthorizedClient().getAccessToken().getTokenValue()).isEqualTo("access-1");
        assertThat(tokenRequests).isEmpty();
    }

    @Test
    void neverAuthorizedStillAsksTheOwnerToLogIn() {
        assertThatThrownBy(() -> gmailApiService.sendEmail("me@example.test", "subject", "body"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("/login");
        assertThat(tokenRequests).isEmpty();
    }

    @Test
    void revokedRefreshTokenAsksTheOwnerToLogInAgain() {
        storeAuthorization("access-1", Instant.now().minus(Duration.ofHours(2)), "refresh-revoked");
        responseStatus = 400;
        responseBody = "{\"error\":\"invalid_grant\",\"error_description\":\"Token has been expired or revoked.\"}";

        assertThatThrownBy(() -> gmailApiService.loadAuthorizedClient())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("/login");
        // the dead authorization is cleared, so the next /login stores a fresh one
        assertThat((Object) clientService.loadAuthorizedClient("google", OWNER)).isNull();
    }

    /** Stores an authorization the way /login does: 1-hour access token + refresh token. */
    private void storeAuthorization(String accessToken, Instant issuedAt, String refreshToken) {
        OAuth2AccessToken access = new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, accessToken,
                issuedAt, issuedAt.plus(Duration.ofHours(1)), Set.of("openid", GMAIL_SEND));
        OAuth2RefreshToken refresh = new OAuth2RefreshToken(refreshToken, issuedAt);
        clientService.saveAuthorizedClient(new OAuth2AuthorizedClient(google, OWNER, access, refresh),
                new TestingAuthenticationToken(OWNER, null));
    }
}
