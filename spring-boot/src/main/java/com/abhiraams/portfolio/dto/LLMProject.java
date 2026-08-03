package com.abhiraams.portfolio.dto;

import java.util.List;

import lombok.Data;

/**
 * DTO for LLM-generated project data.
 * Excludes 'id' to prevent the LLM from generating malformed ID values.
 */
@Data
public class LLMProject {
    private String title;
    private String category;
    private String technologies;
    private String description;
    private String githubUrl;
    private String frontendUrl;
    private String backendUrl;
    private String demoUrl;
    private List<String> bulletPoints;
}
