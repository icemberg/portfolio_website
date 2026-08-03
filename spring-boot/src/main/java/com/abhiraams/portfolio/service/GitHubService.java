package com.abhiraams.portfolio.service;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.mistralai.MistralAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.abhiraams.portfolio.dto.GitHubResponse;
import com.abhiraams.portfolio.dto.LLMProjectResponse;
import com.abhiraams.portfolio.model.Project;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class GitHubService {

        @Value("${github.client.url}")
        private String githubClientUrl;

        @Value("${github.client.secret}")
        private String githubClientSecret;

        private final MistralAiChatModel mistralAiChatModel;

        private final ObjectMapper objectMapper;

        private static final Pattern URL_PATTERN = Pattern.compile(
                        "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+",
                        Pattern.CASE_INSENSITIVE);

        public List<Project> getGitHubRepos() {
                try {
                        log.info("Fetching GitHub repos from: {}", githubClientUrl);

                        RestClient restClient = RestClient.builder()
                                        .baseUrl(githubClientUrl)
                                        .defaultHeader(HttpHeaders.AUTHORIZATION,
                                                        "Bearer " + githubClientSecret)
                                        .defaultHeader(HttpHeaders.ACCEPT,
                                                        "application/vnd.github+json")
                                        .defaultHeader("X-GitHub-Api-Version",
                                                        "2022-11-28")
                                        .build();

                        GitHubResponse[] githubRepos = restClient.get()
                                        .uri("/repos?type=owner&sort=pushed&direction=desc&per_page=30")
                                        .accept(MediaType.APPLICATION_JSON)
                                        .retrieve()
                                        .body(GitHubResponse[].class);

                        if (githubRepos == null || githubRepos.length == 0) {
                                log.warn("GitHub API returned null or empty repos array");
                                return List.of();
                        }

                        log.info("Fetched {} repos from GitHub", githubRepos.length);

                        // Build a REST client for fetching READMEs (base URL: api.github.com)
                        RestClient readmeClient = RestClient.builder()
                                        .baseUrl("https://api.github.com")
                                        .defaultHeader(HttpHeaders.AUTHORIZATION,
                                                        "Bearer " + githubClientSecret)
                                        .defaultHeader(HttpHeaders.ACCEPT,
                                                        "application/vnd.github+json")
                                        .defaultHeader("X-GitHub-Api-Version",
                                                        "2022-11-28")
                                        .build();

                        List<java.util.Map<String, Object>> minimalRepos = Arrays.stream(githubRepos)
                                        .map(repo -> {
                                                java.util.Map<String, Object> map = new java.util.HashMap<>();
                                                map.put("name", repo.getName());
                                                map.put("description", repo.getDescription());
                                                map.put("html_url", repo.getHtmlUrl());
                                                map.put("homepage", repo.getHomepage());
                                                map.put("language", repo.getLanguage());
                                                map.put("topics", repo.getTopics());

                                                // Fetch README and extract URLs
                                                List<String> readmeUrls = fetchReadmeUrls(readmeClient,
                                                                repo.getOwner() != null ? repo.getOwner().getLogin() : "",
                                                                repo.getName());
                                                if (!readmeUrls.isEmpty()) {
                                                        map.put("readme_urls", readmeUrls);
                                                }

                                                return map;
                                        })
                                        .toList();

                        String githubJson = objectMapper
                                        .writerWithDefaultPrettyPrinter()
                                        .writeValueAsString(minimalRepos);

                        log.info("Sending {} repos to LLM for analysis", minimalRepos.size());

                        ChatClient chatClient = ChatClient.builder(mistralAiChatModel)
                                        .defaultAdvisors(new SimpleLoggerAdvisor())
                                        .build();

                        BeanOutputConverter<LLMProjectResponse> converter = new BeanOutputConverter<>(
                                        LLMProjectResponse.class);

                        String systemPrompt = """
                                                You are an expert software engineer reviewing GitHub repositories.

                                                You will receive a JSON array of GitHub repositories.

                                                Your task:

                                                1. Analyze every repository.
                                                2. Select up to 15 repositories suitable for a software portfolio. Do not over-filter.
                                                3. Ignore forks and empty repositories, but keep interesting projects even if small.
                                                4. Generate Project objects with these fields ONLY: title, category, technologies, description, githubUrl, frontendUrl, backendUrl, demoUrl, bulletPoints.
                                                5. Do NOT include an "id" field.
                                                6. Improve the description into a professional portfolio description.
                                                7. Generate 3-6 bullet points describing the project.
                                                8. Infer technologies from the repository name, topics, language and description.
                                                9. Use html_url as githubUrl.
                                                10. For demoUrl: Use homepage if available. Otherwise, check readme_urls for
                                                   deployed links (e.g. Netlify, Vercel, Heroku, Render, Railway, GitHub Pages,
                                                   Firebase, or any custom domain that looks like a live demo).
                                                   Ignore GitHub API links, badge URLs, and documentation links.
                                                11. frontendUrl and backendUrl should be null unless clearly identifiable
                                                    from the repository structure or readme_urls.
                                                12. Category should be one of:
                                                    Full Stack
                                                    Backend
                                                    Frontend
                                                    Mobile
                                                    AI/ML
                                                    DevOps
                                                    Library

                                                Return ONLY valid JSON.

                                                %s
                                                """;

                        String response = chatClient.prompt()
                                        .system(systemPrompt + "\n" + converter.getFormat())
                                        .user(githubJson)
                                        .call()
                                        .content();
                        log.info("Mistral AI Response received, length: {}",
                                        response != null ? response.length() : 0);

                        // Sanitize LLM response - fix common JSON issues
                        if (response != null) {
                                // Fix trailing commas before closing brackets
                                response = response.replaceAll(",\\s*}", "}");
                                response = response.replaceAll(",\\s*]", "]");
                        }

                        LLMProjectResponse llmResponse = converter.convert(response);

                        // Map LLMProject DTOs to Project entities
                        List<Project> projects = llmResponse.getProjects() != null
                                        ? llmResponse.getProjects().stream()
                                                        .map(llm -> {
                                                                Project p = new Project();
                                                                p.setTitle(llm.getTitle());
                                                                p.setCategory(llm.getCategory());
                                                                p.setTechnologies(llm.getTechnologies());
                                                                p.setDescription(llm.getDescription());
                                                                p.setGithubUrl(llm.getGithubUrl());
                                                                p.setFrontendUrl(llm.getFrontendUrl());
                                                                p.setBackendUrl(llm.getBackendUrl());
                                                                p.setDemoUrl(llm.getDemoUrl());
                                                                p.setBulletPoints(llm.getBulletPoints());
                                                                return p;
                                                        })
                                                        .toList()
                                        : List.of();

                        log.info("Successfully parsed {} projects from LLM response", projects.size());

                        return projects;

                } catch (Exception e) {
                        log.error("Error fetching/processing GitHub repositories: {}", e.getMessage(), e);
                        return List.of();
                }
        }

        /**
         * Fetches the README for a repo and extracts all HTTP/HTTPS URLs from it.
         * Returns an empty list if the README is not found or cannot be parsed.
         */
        private List<String> fetchReadmeUrls(RestClient readmeClient, String owner, String repoName) {
                try {
                        String readmeJson = readmeClient.get()
                                        .uri("/repos/{owner}/{repo}/readme", owner, repoName)
                                        .retrieve()
                                        .body(String.class);

                        if (readmeJson == null) {
                                return List.of();
                        }

                        JsonNode node = objectMapper.readTree(readmeJson);
                        String content = node.has("content") ? node.get("content").asText("") : "";

                        // GitHub returns base64-encoded content with newlines
                        String decoded = new String(Base64.getMimeDecoder().decode(content));

                        // Extract all URLs from the README
                        Matcher matcher = URL_PATTERN.matcher(decoded);
                        java.util.Set<String> urls = new java.util.LinkedHashSet<>();
                        while (matcher.find()) {
                                String url = matcher.group();
                                // Filter out GitHub API URLs, badge images, and shields.io
                                if (!url.contains("api.github.com")
                                                && !url.contains("shields.io")
                                                && !url.contains("badge")
                                                && !url.contains("img.shields")
                                                && !url.contains("githubusercontent.com")) {
                                        urls.add(url);
                                }
                        }

                        return List.copyOf(urls);

                } catch (Exception e) {
                        // Silently skip repos without READMEs or on error
                        log.debug("Could not fetch README for {}/{}: {}", owner, repoName, e.getMessage());
                        return List.of();
                }
        }
}