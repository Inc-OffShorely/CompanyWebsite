package com.it.store.service;

import com.it.store.Entity.Employee;
import com.it.store.Entity.News;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.Repository.NewsRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NewsService {

    private final NewsRepository newsRepository;
    private final EmployeeRepository employeeRepository;

    public NewsService(NewsRepository newsRepository,
                       EmployeeRepository employeeRepository) {
        this.newsRepository = newsRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<News> findAll() {
        return newsRepository.findAllByOrderByPublishedAtDesc();
    }

    public Optional<News> findById(Long id) {
        return newsRepository.findById(id);
    }

    public News save(News news) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();
            Long editorId;
            if (principal instanceof Long) {
                editorId = (Long) principal;
            } else {
                editorId = Long.parseLong(principal.toString());
            }

            employeeRepository.findById(editorId).ifPresent(editor -> {
                news.setEditor(editor);
                news.setEditedAt(OffsetDateTime.now());
            });
        }

        return newsRepository.save(news);
    }

    public void deleteById(Long id) {
        newsRepository.deleteById(id);
    }

    // ----- Создание новости с подтягиванием автора из JWT -----

    public News createNews(News news) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("Нет аутентифицированного пользователя");
        }

        Object principal = auth.getPrincipal();
        Long employeeId;
        if (principal instanceof Long) {
            employeeId = (Long) principal;
        } else {
            employeeId = Long.parseLong(principal.toString());
        }

        Employee author = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Сотрудник не найден: " + employeeId));

        news.setAuthor(author);
        if (news.getPublishedAt() == null) {
            news.setPublishedAt(OffsetDateTime.now());
        }
        return newsRepository.save(news);
    }
}