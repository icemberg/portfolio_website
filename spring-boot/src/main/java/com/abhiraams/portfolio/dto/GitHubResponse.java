package com.abhiraams.portfolio.dto;

import java.time.OffsetDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class GitHubResponse {

    private Long id;

    private String name;

    @JsonProperty("full_name")
    private String fullName;

    private String description;

    @JsonProperty("html_url")
    private String htmlUrl;

    private String homepage;

    private String language;

    private List<String> topics;

    @JsonProperty("stargazers_count")
    private Integer stars;

    @JsonProperty("forks_count")
    private Integer forks;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    @JsonProperty("updated_at")
    private OffsetDateTime updatedAt;

    @JsonProperty("pushed_at")
    private OffsetDateTime pushedAt;

    @JsonProperty("default_branch")
    private String defaultBranch;

    private Owner owner;

    @Data
    public static class Owner {
        private String login;

        @JsonProperty("avatar_url")
        private String avatarUrl;
    }
}