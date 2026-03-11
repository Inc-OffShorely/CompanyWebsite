// src/main/java/com/it/store/api/DocumentController.java
package com.it.store.Controller;

import com.it.store.Entity.Employee;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.api.dto.DocumentDto;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final Path ROOT = Paths.get("C:\\meowmeow_docs");

    private final EmployeeRepository employees;

    public DocumentController(EmployeeRepository employees) {
        this.employees = employees;
    }

    private Employee getCurrentEmployeeOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Не авторизован");
        }
        Long id;
        try {
            id = (auth.getPrincipal() instanceof Long l) ? l : Long.valueOf(auth.getName());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Некорректная сессия");
        }

        return employees.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сотрудник не найден"));
    }

    private boolean canEditDocuments(Employee e) {
        boolean isAdmin = e.getRoles().stream()
                .anyMatch(r -> "admin".equalsIgnoreCase(r.getCode()));
        boolean isModerator = e.getRoles().stream()
                .anyMatch(r -> "moderator".equalsIgnoreCase(r.getCode()));
        boolean hasPermission = Boolean.TRUE.equals(e.getCanManageDocuments());

        return isAdmin || isModerator || hasPermission;
    }

    private Path safeResolve(String fileName) {
        Path target = ROOT.resolve(fileName).normalize();
        if (!target.startsWith(ROOT)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Недопустимое имя файла");
        }
        return target;
    }

    // === 1. Список документов (все сотрудники видят) ===

    @GetMapping
    public List<DocumentDto> listDocuments() throws IOException {
        if (!Files.exists(ROOT)) {
            return List.of();
        }
        try (Stream<Path> stream = Files.list(ROOT)) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(p -> {
                        try {
                            return new DocumentDto(
                                    p.getFileName().toString(),
                                    Files.size(p),
                                    Files.getLastModifiedTime(p).toInstant()
                            );
                        } catch (IOException e) {
                            return null;
                        }
                    })
                    .filter(d -> d != null)
                    .collect(Collectors.toList());
        }
    }

    // === 2. Скачивание / просмотр (все сотрудники) ===

    @GetMapping("/{name}")
    public ResponseEntity<Resource> download(@PathVariable("name") String name,
                                             @RequestParam(value = "download", defaultValue = "false") boolean download)
            throws IOException {

        Path file = safeResolve(name);
        if (!Files.exists(file) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Файл не найден");
        }

        FileSystemResource resource = new FileSystemResource(file);

        HttpHeaders headers = new HttpHeaders();
        if (download) {
            headers.setContentDisposition(
                    ContentDisposition.attachment().filename(file.getFileName().toString()).build()
            );
        } else {
            headers.setContentDisposition(
                    ContentDisposition.inline().filename(file.getFileName().toString()).build()
            );
        }

        String fileName = file.getFileName().toString();
        String lower = fileName.toLowerCase();

        String contentType;
        if (lower.endsWith(".pdf")) {
            contentType = "application/pdf";
        } else if (lower.endsWith(".docx")) {
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        headers.setContentType(MediaType.parseMediaType(contentType));

        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }

    // === 3. Загрузка нового файла (admin / moderator / canManageDocuments) ===

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) throws IOException {
        Employee emp = getCurrentEmployeeOrThrow();
        if (!canEditDocuments(emp)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав на изменение документов");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл пустой");
        }

        Files.createDirectories(ROOT);

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректное имя файла");
        }

        Path target = safeResolve(originalName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    // === 4. Обновление файла (замена содержимого) ===

    @PutMapping("/{name}")
    public ResponseEntity<?> update(@PathVariable("name") String name,
                                    @RequestParam("file") MultipartFile file) throws IOException {
        Employee emp = getCurrentEmployeeOrThrow();
        if (!canEditDocuments(emp)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав на изменение документов");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл пустой");
        }

        Files.createDirectories(ROOT);

        Path target = safeResolve(name);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok().build();
    }

    // === 5. Удаление файла ===

    @DeleteMapping("/{name}")
    public ResponseEntity<?> delete(@PathVariable("name") String name) throws IOException {
        Employee emp = getCurrentEmployeeOrThrow();
        if (!canEditDocuments(emp)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав на удаление документов");
        }

        Path target = safeResolve(name);
        if (Files.exists(target)) {
            Files.delete(target);
        }

        return ResponseEntity.noContent().build();
    }
}
