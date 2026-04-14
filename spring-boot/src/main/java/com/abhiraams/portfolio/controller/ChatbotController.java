package com.abhiraams.portfolio.controller;

import com.abhiraams.portfolio.service.ChatbotService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String response = chatbotService.generateResponse(request.getMessage());
        ChatResponse res = new ChatResponse();
        res.setReply(response);
        return res;
    }
}

@Data
class ChatRequest {
    private String message;
}

@Data
class ChatResponse {
    private String reply;
}
