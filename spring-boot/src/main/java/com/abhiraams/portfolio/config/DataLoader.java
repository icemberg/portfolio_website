package com.abhiraams.portfolio.config;

import com.abhiraams.portfolio.model.*;
import com.abhiraams.portfolio.repository.ProfileRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initDatabase(ProfileRepository profileRepository) {
        return args -> {
            profileRepository.deleteAll(); // clear for dev restart
            
            Profile profile = new Profile();
            profile.setName("ABHIRAAM S");
            profile.setTitle("Software Engineer | Java Full Stack & AI/ML");
            profile.setLocation("Bengaluru, Karnataka");
            profile.setPhone("+91 89516 77529");
            profile.setEmail("abhiraams2004@gmail.com");
            profile.setLinkedin("https://linkedin.com/in/abhiraam-s-84388125b");
            profile.setGithub("https://github.com/icemberg");
            profile.setLeetcode("https://leetcode.com/u/Abhiraam_S/");
            profile.setGfg("https://www.geeksforgeeks.org/profile/abhiraa3lgv?tab=activity");
            profile.setHackerrank("https://www.hackerrank.com/profile/abhiraams2004");
            profile.setSummary("Results-driven Software Engineer with hands-on experience building production-grade Java Spring Boot microservices, REST APIs, and full-stack applications. Proficient in Python-based machine learning, data science pipelines, and AI systems. Demonstrated ability to integrate security, caching layers, cloud deployments, and CI/CD pipelines. Strong foundation in Data Structures & Algorithms (250+ problems), Object-Oriented Design, and System Design. Seeking a software engineering or AI/ML role to drive scalable, high-impact solutions.");

            // Skills
            Skill languages = new Skill();
            languages.setCategory("Languages");
            languages.setItems("Java, Python, JavaScript, SQL, HTML5, CSS3");

            Skill backend = new Skill();
            backend.setCategory("Backend & Frameworks");
            backend.setItems("Spring Boot, Spring Security, Spring Data JPA, Hibernate, REST APIs, Microservices, Maven, Gradle");

            Skill frontend = new Skill();
            frontend.setCategory("Frontend");
            frontend.setItems("React.js, Material-UI, Bootstrap");

            Skill databases = new Skill();
            databases.setCategory("Databases");
            databases.setItems("MySQL, MongoDB, Redis Cache");

            Skill cloud = new Skill();
            cloud.setCategory("Cloud & DevOps");
            cloud.setItems("AWS (EC2, RDS), GCP, Docker, Kubernetes, CI/CD");
            
            Skill testing = new Skill();
            testing.setCategory("Testing");
            testing.setItems("JUnit 5, Mockito, TDD, Integration Testing");

            Skill ai = new Skill();
            ai.setCategory("AI / ML");
            ai.setItems("scikit-learn, NumPy, Pandas, Matplotlib, Seaborn, T5 Transformer, spaCy, HMM, Vector Embeddings, RAG");

            Skill core = new Skill();
            core.setCategory("Core CS & Tools");
            core.setItems("DSA, OOP, System Design, DBMS, OS, Agile/Scrum, Git, IntelliJ IDEA, Postman, JIRA");

            profile.setSkills(Arrays.asList(languages, backend, frontend, databases, cloud, testing, ai, core));

            // Experience
            Experience e1 = new Experience();
            e1.setTitle("Java Developer Trainee");
            e1.setCompany("HulkHire Tech");
            e1.setLocation("Hyderabad, India");
            e1.setDuration("Feb 2025 - Mar 2025");
            e1.setDescription("Architected Spring Boot microservices for Stripe payment processing, implementing full REST API lifecycle including webhook handling, idempotency, and error recovery; secured endpoints using Spring Security with JWT, OAuth2, and HmacSHA256 signature verification.");
            e1.setBulletPoints(Arrays.asList(
                "Deployed services on AWS (EC2 + RDS) with Dockerized containers and a CI/CD pipeline",
                "Engineered Redis caching layer for business rule evaluation and session management, measurably reducing database query load and improving API p95 response times",
                "Designed clean Controller-Service-Repository architecture with MySQL and Spring Data JPA"
            ));

            Experience e2 = new Experience();
            e2.setTitle("AI/ML Intern");
            e2.setCompany("VisionAstraa EV Academy");
            e2.setLocation("Bengaluru, India");
            e2.setDuration("Feb 2025 - Present");
            e2.setDescription("Designing and training machine learning models for Electric Vehicle performance optimization and predictive analytics using Python and scikit-learn.");
            e2.setBulletPoints(Arrays.asList(
                "Built end-to-end data science pipelines from data ingestion and preprocessing to model training and performance evaluation",
                "Applied feature engineering and hyperparameter tuning techniques to improve model generalization on time-series EV sensor data"
            ));

            profile.setExperiences(Arrays.asList(e1, e2));

            // Projects
            Project p1 = new Project();
            p1.setTitle("BrainBlast - Full-Stack Quiz Application");
            p1.setTechnologies("Java, Spring Boot, Spring Security, MySQL, Redis, React.js, JWT, OAuth2, Material-UI");
            p1.setDescription("Designed and built a full-stack interactive quiz platform: Spring Boot REST backend with JWT + OAuth2 auth, MySQL persistence via Spring Data JPA, Redis caching for leaderboard, and a responsive React.js admin dashboard. Implemented role-based access control (RBAC).");
            p1.setFrontendUrl("https://github.com/icemberg/Quiz_Application_Frontend");
            p1.setBackendUrl("https://github.com/icemberg/Quiz_Application_Backend");
            
            Project p2 = new Project();
            p2.setTitle("Map-Matching Algorithm - ML Research Project");
            p2.setTechnologies("Python, scikit-learn, Hidden Markov Model, Random Forest, GeoPandas, Pandas, NumPy");
            p2.setDescription("Architected a geospatial ML pipeline that fuses Hidden Markov Models with Random Forest classifiers, achieving a 15% accuracy improvement over the baseline map-matching algorithm.");
            p2.setGithubUrl("https://github.com/icemberg/Map_Matching_Algorithm_Prototype1");
            
            Project p3 = new Project();
            p3.setTitle("Web Scraping & RAG Dataset Generation Pipeline");
            p3.setTechnologies("Python, FastAPI, Playwright, spaCy, T5 Transformer, Vector Embeddings");
            p3.setDescription("Built an automated AI data pipeline that scrapes web content asynchronously via Playwright, chunks and summarizes text using a T5 transformer, and generates structured Q&A pairs for RAG training datasets at scale. Integrated vector embedding generation.");
            p3.setGithubUrl("https://github.com/icemberg/Topic-based_Summarizer_and_QA_Generator");

            Project p4 = new Project();
            p4.setTitle("Video Summarizer – AI System");
            p4.setTechnologies("Python, Phidata, Gemini LLMs, OpenAI Whisper, NLP");
            p4.setDescription("A powerful AI-driven video summarization tool that leverages Google's Gemini models with automatic failover, YouTube audio transcription, and intelligent caption detection.");
            p4.setGithubUrl("https://github.com/icemberg");
            
            Project p5 = new Project();
            p5.setTitle("Civic Quest: Rebuild the Future");
            p5.setTechnologies("React, Dashboards");
            p5.setDescription("Solves the problem of limited citizen involvement in urban decision-making. Provides a 2D dashboard for users to participate in governance, track city metrics, and make decisions that impact the environment, health, and infrastructure.");
            p5.setDemoUrl("https://comforting-daffodil-74bad1.netlify.app/");

            Project p6 = new Project();
            p6.setTitle("Database Viewer & Authentication System");
            p6.setTechnologies("Java, Swing, JDBC, Maven");
            p6.setDescription("Advanced Java Mini Projects: Full user authentication system with password hashing (WAR app on Tomcat/JBoss). Sophisticated Java-based GUI application for interactive database management utilizing Java Collections and JDBC.");
            p6.setGithubUrl("https://github.com/icemberg/Advanced_Java_Mini_Project");

            Project p7 = new Project();
            p7.setTitle("WSA HomelyHub Application");
            p7.setTechnologies("MongoDB, Express.js, React.js, Node.js");
            p7.setDescription("HomelyHub is a full-stack hotel booking web application inspired by Airbnb, with payment integration via Razorpay and cloud image storage via ImageKit.");
            p7.setDemoUrl("https://wsa-homelyhub-app.netlify.app/");

            Project p8 = new Project();
            p8.setTitle("Music Genre Classification using CNN");
            p8.setTechnologies("Python, Deep Learning, CNN, MFCC");
            p8.setDescription("Implements a Convolutional Neural Network (CNN) to classify music genres from audio files using Mel-Frequency Cepstral Coefficients (MFCCs).");
            p8.setGithubUrl("https://github.com/icemberg/ML_Mini_project");

            Project p9 = new Project();
            p9.setTitle("Crime-Management-System");
            p9.setTechnologies("PHP, MySQL, HTML, CSS");
            p9.setDescription("Web application in PHP providing crime management solutions like filing FIRs using Aadhar card, status tracking, and multitenant portal for police in-charge and headquarters.");
            p9.setGithubUrl("https://github.com/icemberg/criminal-management-system");

            Project p10 = new Project();
            p10.setTitle("AI/ML Model for Predicting & Remediating Kubernetes Issues");
            p10.setTechnologies("GNN, LSTM, XGBoost, LangChain, n8n, Apache Kafka, Prometheus, Kubernetes");
            p10.setDescription("Novel meta-learning ensemble approach for predictive autoscaling in Kubernetes clusters. Integrates GNN, LSTM, and ANN via a meta-learner to predict anomalies (e.g. DDoS, resource exhaustion). Phase II built automated remediation using LangChain, n8n, and Kafka.");
            p10.setGithubUrl("https://github.com/BIT-Mavericks/Kubernetes_cluster_anomaly_prediction");

            Project p11 = new Project();
            p11.setTitle("GPS Toll-Based System");
            p11.setTechnologies("Python, Streamlit, Twilio, GPS Datasets");
            p11.setDescription("Revolutionizes toll management using GPS technology to calculate charges based on highway/alternate path distances. Automated SMS notifications via Twilio.");
            p11.setGithubUrl("https://github.com/icemberg/Team-BIT-GEEKS_Intel-Unnati--PS-6-");

            Project p12 = new Project();
            p12.setTitle("Driver Drowsiness and Distraction Detector");
            p12.setTechnologies("Computer Vision, ML");
            p12.setDescription("Real-time computer vision system that monitors driver attention and detects drowsiness to prevent accidents.");
            p12.setGithubUrl("https://github.com/icemberg/Driver_Drowsiness_and_Distraction_Detector");

            profile.setProjects(Arrays.asList(p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12));

            // Education
            Education edu = new Education();
            edu.setDegree("Bachelor of Engineering - Computer Science");
            edu.setInstitution("Bangalore Institute of Technology (BIT)");
            edu.setLocation("Bengaluru");
            edu.setDuration("2022 - 2026 (Expected)");
            edu.setGpa("9.01 / 10");
            edu.setCoursework("Data Structures & Algorithms, OOP, DBMS, Operating Systems, Software Engineering, Machine Learning");

            profile.setEducations(Arrays.asList(edu));

            // Certifications
            Certification c1 = new Certification();
            c1.setName("Cloud Computing AWS Course");
            c1.setOrganization("Cloud Institution");
            c1.setDate("2025");
            c1.setImageUrl("/aws-cert.png");

            Certification c2 = new Certification();
            c2.setName("Artificial Intelligence and Machine Learning Training Course");
            c2.setOrganization("Infosys Springboard");
            c2.setDate("2024");
            c2.setImageUrl("/infosys-cert.png");

            Certification c3 = new Certification();
            c3.setName("Java Developer Trainee program");
            c3.setOrganization("HulkHire Tech");
            c3.setDate("2026");
            c3.setImageUrl("/javatrainee-cert.png");

            profile.setCertifications(Arrays.asList(c1, c2, c3));

            profileRepository.save(profile);
        };
    }
}
