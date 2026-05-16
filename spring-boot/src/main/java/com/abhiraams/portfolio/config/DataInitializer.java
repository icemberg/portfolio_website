package com.abhiraams.portfolio.config;

import com.abhiraams.portfolio.model.*;
import com.abhiraams.portfolio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

// @Configuration // Disabled to use DataLoader exclusively
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ProfileRepository profileRepository;

    @Override
    public void run(String... args) throws Exception {
        if (profileRepository.count() > 0) {
            return; // Data already exists
        }

        Profile profile = new Profile();
        profile.setName("ABHIRAAM S");
        profile.setTitle("Software Engineer | Java Full Stack & AI/ML");
        profile.setLocation("Bengaluru, Karnataka");
        profile.setPhone("+91 89516 77529");
        profile.setEmail("abhiraams2004@gmail.com");
        profile.setLinkedin("https://linkedin.com/in/abhiraam-s"); // Pattern derived
        profile.setGithub("https://github.com/icemberg");
        profile.setSummary(
                "Results-driven Software Engineer with hands-on experience building production-grade Java Spring Boot microservices, REST APIs, and full-stack applications. Proficient in Python-based machine learning, data science pipelines, and AI systems. Demonstrated ability to integrate security (JWT, OAuth2, HmacSHA256), caching layers (Redis), cloud deployments (AWS EC2/RDS), and CI/CD pipelines. Strong foundation in Data Structures & Algorithms (250+ problems), Object-Oriented Design, and System Design. Recognized as STAR Performer for delivery excellence.");

        // Experience
        List<Experience> experiences = new ArrayList<>();

        Experience exp1 = new Experience();
        exp1.setTitle("Java Developer Trainee");
        exp1.setCompany("HulkHire Tech");
        exp1.setLocation("Hyderabad, India");
        exp1.setDuration("Feb 2026 – April 2026");
        exp1.setDescription(
                "Architected Spring Boot microservices for Stripe payment processing, implementing full REST API lifecycle including webhook handling, idempotency, and error recovery; secured endpoints using Spring Security with JWT, OAuth2, and HmacSHA256 signature verification.");
        exp1.setBulletPoints(List.of(
                "Architected Spring Boot microservices for Stripe payment processing with full REST lifecycle.",
                "Deployed on AWS (EC2 + RDS) using Docker and CI/CD for zero-downtime.",
                "Engineered Redis caching layer, reducing database query load and improving p95 response times.",
                "Achieved comprehensive test coverage using JUnit 5 and Mockito; recognized as STAR Performer."));

        Experience exp2 = new Experience();
        exp2.setTitle("AI/ML Intern");
        exp2.setCompany("VisionAstraa EV Academy");
        exp2.setLocation("Bengaluru, India");
        exp2.setDuration("Feb 2026 – May 2026");
        exp2.setDescription(
                "Designing and training machine learning models for Electric Vehicle performance optimization and predictive analytics using Python and scikit-learn.");
        exp2.setBulletPoints(List.of(
                "Designing ML models for EV performance optimization using Python and scikit-learn.",
                "Built end-to-end data science pipelines from data ingestion to evaluation using NumPy, Pandas, Matplotlib.",
                "Applied feature engineering and hyperparameter tuning to improve model generalization on time-series telemetry data."));

        experiences.add(exp1);
        experiences.add(exp2);
        profile.setExperiences(experiences);

        // Projects
        List<Project> projects = new ArrayList<>();

        Project p1 = new Project();
        p1.setTitle("BrainBlast");
        p1.setCategory("FULL_STACK");
        p1.setTechnologies("Java, Spring Boot, Spring Security, MySQL, Redis, React.js, JWT, OAuth2, Material-UI");
        p1.setDescription("Full-stack interactive quiz platform with real-time management.");
        p1.setBulletPoints(List.of(
                "Spring Boot REST backend (MVC) with JWT + OAuth2 auth and MySQL persistence via Spring Data JPA.",
                "Redis caching for leaderboard and session state, with a responsive React.js admin dashboard.",
                "Implemented role-based access control (RBAC) and connection pooling for concurrent session sustainability."));

        Project p2 = new Project();
        p2.setTitle("Map-Matching Algorithm");
        p2.setCategory("RESEARCH_AI");
        p2.setTechnologies("Python, scikit-learn, Hidden Markov Model, Random Forest, GeoPandas");
        p2.setDescription("ML research project for probabilistic path inference.");
        p2.setBulletPoints(List.of(
                "Architected geospatial ML pipeline fusing HMM with Random Forest classifiers for 15% accuracy improvement.",
                "Engineered spatial-temporal features from raw GPS traces (speed vectors, heading deltas)."));

        Project p3 = new Project();
        p3.setTitle("Video Summarizer");
        p3.setCategory("AI_SYSTEMS");
        p3.setTechnologies("Python, Phidata, Gemini LLMs, OpenAI Whisper, NLP");
        p3.setGithubUrl("https://github.com/icemberg/Video_Summarizer");
        p3.setDescription("AI video summarization platform.");
        p3.setBulletPoints(List.of(
                "Speech-to-text transcription with OpenAI Whisper and intelligent summarization via Gemini LLMs.",
                "Modular pipeline for multi-format video input and query interface for targeted content Q&A."));

        Project p4 = new Project();
        p4.setTitle("Kubernetes Anomaly Prediction");
        p4.setCategory("RESEARCH_AI");
        p4.setTechnologies("GNN, LSTM, ANN, XGBoost, LGBM, Kubernetes");
        p4.setGithubUrl("https://github.com/BIT-Mavericks/Kubernetes_cluster_anomaly_prediction");
        p4.setDescription("Predicting and remediating Kubernetes issues using ensemble meta-learning.");
        p4.setBulletPoints(List.of(
                "Integrated GNN, LSTM, and ANN via a meta-learner for pod failure and resource exhaustion prediction.",
                "Used XGBoost and LGBM for resource exhaustion analysis; implemented SMOTE for class imbalance."));

        projects.add(p1);
        projects.add(p2);
        projects.add(p3);
        projects.add(p4);
        profile.setProjects(projects);

        // Skills
        List<Skill> skills = new ArrayList<>();
        skills.add(createSkill("Languages", "Java, Python, JavaScript, SQL, HTML5, CSS3"));
        skills.add(createSkill("Backend & Frameworks",
                "Spring Boot, Spring Security, Spring Data JPA, Hibernate, REST, Microservices, Maven"));
        skills.add(
                createSkill("AI / ML", "scikit-learn, NumPy, Pandas, T5 Transformer, spaCy, Vector Embeddings, RAG"));
        skills.add(createSkill("Cloud & DevOps", "AWS (EC2, RDS), GCP, Docker, Kubernetes, CI/CD"));
        profile.setSkills(skills);

        // Education
        List<Education> education = new ArrayList<>();
        Education edu1 = new Education();
        edu1.setInstitution("Bangalore Institute of Technology (BIT)");
        edu1.setDegree("Bachelor of Engineering – Computer Science");
        edu1.setDuration("2022 – 2026 (Expected)");
        edu1.setGpa("CGPA: 9.01 / 10");
        education.add(edu1);
        profile.setEducations(education);

        // Certifications
        List<Certification> certs = new ArrayList<>();
        certs.add(createCert("Cloud Computing AWS Course", "Cloud Institution", "2025", "/aws-cert.png"));
        certs.add(createCert("ML with Python", "Coursera", "2024", null));
        certs.add(createCert("MERN Stack Development", "WSA", "2024", null));
        profile.setCertifications(certs);

        profileRepository.save(profile);
    }

    private Skill createSkill(String cat, String items) {
        Skill s = new Skill();
        s.setCategory(cat);
        s.setItems(items);
        return s;
    }

    private Certification createCert(String name, String org, String date, String imageUrl) {
        Certification c = new Certification();
        c.setName(name);
        c.setOrganization(org);
        c.setDate(date);
        c.setImageUrl(imageUrl);
        return c;
    }
}
