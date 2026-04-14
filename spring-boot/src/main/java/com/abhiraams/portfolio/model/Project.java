package com.abhiraams.portfolio.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String category;
    private String technologies;
    @Column(length = 2000)
    private String description;
    private String githubUrl;
    private String frontendUrl;
    private String backendUrl;
    private String demoUrl;
    
    @ElementCollection
    private List<String> bulletPoints;
}
