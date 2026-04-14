package com.abhiraams.portfolio.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
public class Experience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String company;
    private String location;
    private String duration;
    
    @Column(length = 2000)
    private String description;
    
    @ElementCollection
    private List<String> bulletPoints;
}
