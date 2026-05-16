package com.abhiraams.portfolio.service;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailApiService {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APP_NAME = "Java portfolio Website";

    @Value("${email.owner.principal}")
    private String ownerPrincipal;

    public void sendEmail(String to, String subject, String body)
            throws IOException, GeneralSecurityException, MessagingException {
        log.info("Attempting to load authorized client for registration: google, principal: {}", ownerPrincipal);
        OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient("google", ownerPrincipal);

        if (client == null) {
            log.error(
                    "Failed to load authorized client. No token found in database for principal: {}. Please visit /login to authorize.",
                    ownerPrincipal);
            throw new IllegalStateException("Gmail not authorized. Please visit /login first.");
        }

        log.info("Successfully loaded authorized client. Proceeding to send email to {}", to);

        String accessToken = client.getAccessToken().getTokenValue();

        Credential credential = new Credential(BearerToken.authorizationHeaderAccessMethod())
                .setAccessToken(accessToken);

        final HttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
        Gmail service = new Gmail.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential)
                .setApplicationName(APP_NAME)
                .build();

        MimeMessage mimeMessage = createEmail(to, "me", subject, body);
        Message message = createMessageWithEmail(mimeMessage);

        service.users().messages().send("me", message).execute();
        log.info("Email sent successfully using Gmail API to: {}", to);
    }

    private MimeMessage createEmail(String to, String from, String subject, String bodyText) throws MessagingException {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);

        MimeMessage email = new MimeMessage(session);
        email.setFrom(new InternetAddress(from));
        email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        email.setSubject(subject);
        email.setText(bodyText);
        return email;
    }

    private Message createMessageWithEmail(MimeMessage emailContent) throws MessagingException, IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        emailContent.writeTo(buffer);
        byte[] bytes = buffer.toByteArray();
        String encodedEmail = Base64.getUrlEncoder().encodeToString(bytes);
        Message message = new Message();
        message.setRaw(encodedEmail);
        return message;
    }
}
