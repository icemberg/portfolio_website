package com.abhiraams.portfolio.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Skill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String category;
    @Column(length = 1000)
    private String items;
}
