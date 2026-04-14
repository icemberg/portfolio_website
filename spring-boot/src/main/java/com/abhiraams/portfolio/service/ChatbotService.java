package com.abhiraams.portfolio.service;

import com.abhiraams.portfolio.model.Profile;
import com.abhiraams.portfolio.repository.ProfileRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mistralai.MistralAiChatModel;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ChatbotService {

    private final ChatClient chatClient;
    private final ProfileRepository profileRepository;

    public ChatbotService(MistralAiChatModel mistralChatModel, ProfileRepository profileRepository) {
        this.chatClient = ChatClient.builder(mistralChatModel).build();
        this.profileRepository = profileRepository;
    }

    public String generateResponse(String userMessage) {
        List<Profile> profiles = profileRepository.findAll();
        if (profiles.isEmpty()) {
            return "I'm sorry, I don't have access to Abhiraam's profile data right now.";
        }

        Profile profile = profiles.get(0);

        // Build a context string from the profile
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("Name: ").append(profile.getName()).append("\n");
        contextBuilder.append("Title: ").append(profile.getTitle()).append("\n");
        contextBuilder.append("Summary: ").append(profile.getSummary()).append("\n\n");

        contextBuilder.append("EXPERIENCE: \n");
        profile.getExperiences().forEach(e -> 
            contextBuilder.append("- ").append(e.getTitle()).append(" at ").append(e.getCompany())
                    .append(" (").append(e.getDuration()).append("): ")
                    .append(e.getDescription()).append("\n")
        );

        contextBuilder.append("\nPROJECTS: \n");
        profile.getProjects().forEach(p -> 
            contextBuilder.append("- ").append(p.getTitle()).append(" [").append(p.getCategory()).append("]: ")
                    .append(p.getDescription()).append(" using ").append(p.getTechnologies()).append("\n")
        );

        contextBuilder.append("\nEDUCATION: \n");
        profile.getEducations().forEach(edu -> 
            contextBuilder.append("- ").append(edu.getDegree()).append(" from ").append(edu.getInstitution())
                    .append(" (").append(edu.getDuration()).append("), GPA: ").append(edu.getGpa()).append("\n")
        );

        contextBuilder.append("\nCERTIFICATIONS: \n");
        profile.getCertifications().forEach(c -> 
            contextBuilder.append("- ").append(c.getName()).append(" from ").append(c.getOrganization()).append("\n")
        );

        String systemPromptText = """
                You are ABHIRAAM_AI, the cognitive interface for Abhiraam S. You speak in a helpful, analytical, and professional tone.
                Your purpose is to answer questions about Abhiraam's technical architecture, project history, education, and engineering philosophies.
                Do not break character. 
                Use markdown for code snippets, bullet points, and emphasis. 
                If asked about a specific project like 'BrainBlast' or 'Kubernetes Prediction', provide detailed architecture insights based on the context.

                Here is the background context for Abhiraam S:
                {context}
                """;

        SystemPromptTemplate systemPromptTemplate = new SystemPromptTemplate(systemPromptText);
        String systemMessage = systemPromptTemplate.create(Map.of("context", contextBuilder.toString())).getContents();

        try {
            return chatClient.prompt()
                    .system(systemMessage)
                    .user(userMessage)
                    .call()
                    .content();
        } catch (Exception e) {
            // Log the exception details for troubleshooting but return a user-friendly
            // message
            log.error("Chatbot AI Error: {}", e.getMessage());
            return "I am currently experiencing some cognitive interference (System Error: 401 Unauthorized API Key). Please wait while I recalibrate my neural processors.";
        }
    }
}
