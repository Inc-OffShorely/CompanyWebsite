package com.it.store.config;

import com.it.store.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // REST API → без сессий и без formLogin
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // ===== ПУБЛИЧНЫЕ ЭНДПОИНТЫ (главный сайт) =====
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/room-bookings/**").authenticated()
                        .requestMatchers("/api/calendar/**").authenticated()
                        // Логин и прочее, как было

                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/debug/**").permitAll()  // если у тебя есть
                        .requestMatchers(HttpMethod.DELETE, "/api/room-bookings/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/service-requests/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/service-requests/*/take").hasRole("EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/api/service-requests/*/complete").hasRole("EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/api/service-requests/*/assign").hasAnyRole("ADMIN", "MODERATOR")
                        .requestMatchers(HttpMethod.PUT, "/api/service-requests/**").hasAnyRole("ADMIN", "MODERATOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/service-requests/**").hasAnyRole("ADMIN", "MODERATOR")
                        // ===== НОВОСТИ =====
                        // читать новости могут все авторизованные сотрудники
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/news",
                                "/api/news/**"
                        ).authenticated()

                        // создавать / редактировать / удалять новости могут только админ и модератор
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/news",
                                "/api/news/**"
                        ).hasAnyRole("ADMIN", "MODERATOR")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/news/**"
                        ).hasAnyRole("ADMIN", "MODERATOR")

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/news/**"
                        ).hasAnyRole("ADMIN", "MODERATOR")
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/calendar/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/calendar/**").authenticated()

                        // ===== остальное, как у тебя было =====
                        .requestMatchers("/api/support-tickets/**").authenticated()
                        .requestMatchers("/api/employees/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}