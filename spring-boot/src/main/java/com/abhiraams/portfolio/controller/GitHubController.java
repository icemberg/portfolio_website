package com.abhiraams.portfolio.controller;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.abhiraams.portfolio.service.GitHubService;
import com.abhiraams.portfolio.model.Project;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/github")
public class GitHubController {
    private final GitHubService gitHubService;

    @GetMapping("/repos")
    public ResponseEntity<List<Project>> getGitHubRepos() {
        List<Project> projects = gitHubService.getGitHubRepos();
        return ResponseEntity.ok(projects);
    }

}
