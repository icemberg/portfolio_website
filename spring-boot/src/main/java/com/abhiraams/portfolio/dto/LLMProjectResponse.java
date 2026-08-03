package com.abhiraams.portfolio.dto;

import java.util.List;

import lombok.Data;

/**
 * Wrapper for the LLM response containing a list of LLMProject objects.
 */
@Data
public class LLMProjectResponse {
    private List<LLMProject> projects;
}
