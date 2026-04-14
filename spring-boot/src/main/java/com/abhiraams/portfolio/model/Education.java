package com.abhiraams.portfolio.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Education {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String degree;
    private String institution;
    private String location;
    private String duration;
    private String gpa;
    @Column(length = 1000)
    private String coursework;
}
