package com.example.backend.controller;

import com.example.backend.dto.AuthRequest;
import com.example.backend.dto.AuthResponse;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest authRequest) {
        if (authRequest.getUserId() == null || authRequest.getUserId().length() < 5) {
            return ResponseEntity.badRequest().body("userId must be at least 5 characters long");
        }

        if (userRepository.existsByUserId(authRequest.getUserId())) {
            return ResponseEntity.badRequest().body("userId is already taken");
        }

        User user = new User(
                authRequest.getUserId(),
                passwordEncoder.encode(authRequest.getPassword())
        );
        userRepository.save(user);

        String jwt = tokenProvider.generateToken(user.getUserId());
        return ResponseEntity.ok(new AuthResponse(jwt, user.getUserId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest authRequest) {
        User user = userRepository.findByUserId(authRequest.getUserId())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(authRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid userId or password");
        }

        String jwt = tokenProvider.generateToken(user.getUserId());
        return ResponseEntity.ok(new AuthResponse(jwt, user.getUserId()));
    }
}
