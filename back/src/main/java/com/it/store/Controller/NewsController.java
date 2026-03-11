package com.it.store.Controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.it.store.Entity.News;
import com.it.store.service.NewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.it.store.api.dto.NewsCreateRequest;
import java.time.LocalDate;
import java.time.ZoneOffset;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;
    private final ObjectMapper objectMapper;

    public NewsController(NewsService newsService, ObjectMapper objectMapper) {
        this.newsService = newsService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public List<News> getAll() {
        return newsService.findAll();
    }

    private OffsetDateTime parsePublishedAt(String s) {
        if (s == null || s.isBlank()) return null;

        if (s.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            return LocalDate.parse(s)
                    .atStartOfDay()
                    .atOffset(ZoneOffset.ofHours(3));
        }
        return OffsetDateTime.parse(s);
    }

    @GetMapping("/{id}")
    public ResponseEntity<News> getById(@PathVariable Long id) {
        Optional<News> opt = newsService.findById(id);
        return opt.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody NewsCreateRequest req) {

        if (req.title() == null || req.title().isBlank()
                || req.content() == null || req.content().isBlank()
                || req.publishedAt() == null || req.publishedAt().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ErrorBody("INVALID_REQUEST", "title, content и publishedAt обязательны"));
        }

        final OffsetDateTime publishedAt;
        try {
            publishedAt = parsePublishedAt(req.publishedAt());
            if (publishedAt == null) {
                return ResponseEntity.badRequest()
                        .body(new ErrorBody("INVALID_DATE", "publishedAt пустой/некорректный"));
            }
        } catch (DateTimeParseException ex) {
            return ResponseEntity.badRequest()
                    .body(new ErrorBody("INVALID_DATE",
                            "publishedAt должен быть YYYY-MM-DD или ISO-8601 datetime, например 2025-12-15T00:00:00+03:00"));
        }

        News news = new News();
        news.setTitle(req.title().trim());
        news.setContent(req.content());
        news.setPublishedAt(publishedAt);

        News saved = newsService.createNews(news);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody String body) {
        Optional<News> existingOpt = newsService.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        News existing = existingOpt.get();

        try {
            JsonNode root = objectMapper.readTree(body);

            if (root.has("title")) {
                existing.setTitle(root.get("title").asText());
            }
            if (root.has("content")) {
                existing.setContent(root.get("content").asText());
            }
            if (root.has("publishedAt")) {
                String publishedAtStr = root.get("publishedAt").asText();
                try {
                    if (publishedAtStr != null && publishedAtStr.length() == 10) {
                        existing.setPublishedAt(LocalDate.parse(publishedAtStr)
                                .atStartOfDay()
                                .atOffset(ZoneOffset.ofHours(3)));
                    } else {
                        try {
                            existing.setPublishedAt(parsePublishedAt(publishedAtStr));
                        } catch (DateTimeParseException ex) {
                            return ResponseEntity.badRequest()
                                    .body(new ErrorBody("INVALID_DATE",
                                            "publishedAt должен быть YYYY-MM-DD или ISO-8601 datetime, например 2025-11-14T12:00:00Z"));
                        }
                    }
                } catch (DateTimeParseException ex) {
                    return ResponseEntity.badRequest()
                            .body(new ErrorBody("INVALID_DATE",
                                    "publishedAt должен быть в формате ISO-8601, например 2025-11-14T12:00:00Z"));
                }
            }

            News updated = newsService.save(existing);
            return ResponseEntity.ok(updated);

        } catch (JsonProcessingException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorBody("INVALID_JSON", "Некорректный JSON в теле запроса"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Optional<News> existingOpt = newsService.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        newsService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    public record ErrorBody(String error, String message) {}
}
