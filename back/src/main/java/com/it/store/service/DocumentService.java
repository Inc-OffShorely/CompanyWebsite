package com.it.store.service;

import com.it.store.Entity.Document;
import com.it.store.Entity.Employee;
import com.it.store.Entity.Role;
import com.it.store.Repository.DocumentRepository;
import com.it.store.Repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final Path storageRoot;

    public DocumentService(DocumentRepository documentRepository,
                           EmployeeRepository employeeRepository,
                           @Value("${documents.storage.path}") String storagePath) {
        this.documentRepository = documentRepository;
        this.employeeRepository = employeeRepository;
        this.storageRoot = Paths.get(storagePath);
    }

    private Employee currentEmployeeOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Anonymous user");
        }
        Long id = Long.parseLong(auth.getName());
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Current employee not found: " + id));
    }

    private boolean isAdmin(Employee e) {
        if (e == null || e.getRoles() == null) return false;
        return e.getRoles().stream()
                .anyMatch(r -> "admin".equalsIgnoreCase(r.getCode()));
    }

    private boolean canManageDocs(Employee e) {
        if (isAdmin(e)) return true;
        return Boolean.TRUE.equals(e.getCanManageDocuments());
    }

    public List<Document> findAll() {
        return documentRepository.findAll();
    }

    public Document uploadDocument(MultipartFile file,
                                   String title,
                                   Long categoryId) throws IOException {

        Employee current = currentEmployeeOrThrow();
        if (!canManageDocs(current)) {
            throw new AccessDeniedException("You are not allowed to manage documents");
        }

        Files.createDirectories(storageRoot);

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            originalName = "document.bin";
        }

        String storedName = UUID.randomUUID() + "_" + originalName;
        Path target = storageRoot.resolve(storedName);

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        Document doc = new Document();
        if (categoryId != null) {
            doc.setCategoryId(categoryId.shortValue());
        }
        doc.setAuthor(current);
        doc.setTitle(title);
        doc.setFilePath(target.toString());
        doc.setUploadedAt(OffsetDateTime.now());

        return documentRepository.save(doc);
    }

    public ResponseEntity<byte[]> downloadDocument(Long id) throws IOException {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));

        Path path = Paths.get(doc.getFilePath());
        if (!Files.exists(path)) {
            throw new IllegalArgumentException("File not found on disk: " + path);
        }

        byte[] bytes = Files.readAllBytes(path);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentLength(bytes.length);

        String filename = path.getFileName().toString();
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(filename, StandardCharsets.UTF_8)
                        .build()
        );

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }

    // ====== Удаление документа (только админ или can_manage_documents=true) ======
    public void deleteDocument(Long id) throws IOException {
        Employee current = currentEmployeeOrThrow();
        if (!canManageDocs(current)) {
            throw new AccessDeniedException("You are not allowed to manage documents");
        }

        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + id));

        Path path = Paths.get(doc.getFilePath());
        Files.deleteIfExists(path);

        documentRepository.delete(doc);
    }
}