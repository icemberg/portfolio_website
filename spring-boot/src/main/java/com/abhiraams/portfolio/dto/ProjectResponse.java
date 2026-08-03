package com.abhiraams.portfolio.dto;

import java.util.List;

import com.abhiraams.portfolio.model.Project;

import lombok.Data;

@Data
public class ProjectResponse {

    private List<Project> projects;

}