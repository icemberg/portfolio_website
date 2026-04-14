package com.abhiraams.portfolio.service;

import com.abhiraams.portfolio.model.Profile;
import com.abhiraams.portfolio.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final ProfileRepository profileRepository;

    public Profile getFullProfile() {
        List<Profile> profiles = profileRepository.findAll();
        if (profiles.isEmpty()) {
            return null;
        }
        // Assuming there's only one portfolio profile in this context
        return profiles.get(0);
    }
}
