package com.it.store.Controller;

import com.it.store.Entity.Client;
import com.it.store.Entity.Employee;
import com.it.store.Entity.ServiceRequest;
import com.it.store.Entity.ServiceType;
import com.it.store.Repository.ClientRepository;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.Repository.ServiceRequestRepository;
import com.it.store.Repository.ServiceTypeRepository;
import com.it.store.api.dto.ServiceRequestListItemDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/service-requests")
public class ServiceRequestWorkController {

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ServiceTypeRepository serviceTypeRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    // ---------- Список заявок для внутреннего портала ----------
    @GetMapping
    public List<ServiceRequestListItemDto> getAllServiceRequests() {
        List<ServiceRequest> all = serviceRequestRepository.findAll();
        return all.stream()
                .map(this::toListItemDto)
                .collect(Collectors.toList());
    }

    // ---------- Удалить заявку ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable("id") Long id) {

        if (!serviceRequestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        serviceRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Взять заявку в работу ----------
    @PutMapping("/{id}/take")
    public ResponseEntity<ServiceRequestListItemDto> takeRequest(@PathVariable("id") Long id) {
        Employee current = currentEmployeeOrThrow();

        ServiceRequest req = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена"));

        // ставим статус in_progress и назначаем на текущего сотрудника
        req.setStatus("in_progress");
        req.setAssigneeId(current.getId());

        serviceRequestRepository.save(req);
        return ResponseEntity.ok(toListItemDto(req));
    }

    // ---------- Редактирование заявки ----------
    @PutMapping("/{id}")
    public ResponseEntity<ServiceRequestListItemDto> updateRequest(
            @PathVariable("id") Long id,
            @RequestBody JsonNode payload
    ) {
        ServiceRequest req = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена"));

        Client client = clientRepository.findById(req.getClientId()).orElse(null);

        if (client != null) {
            if (payload.hasNonNull("customerName") && !payload.get("customerName").asText().isBlank()) {
                client.setFullName(payload.get("customerName").asText());
            }

            Map<String, Object> contacts = client.getContacts();
            if (contacts == null) contacts = new HashMap<>();

            if (payload.hasNonNull("phone") && !payload.get("phone").asText().isBlank()) {
                contacts.put("phone", payload.get("phone").asText());
            }
            if (payload.hasNonNull("email") && !payload.get("email").asText().isBlank()) {
                contacts.put("email", payload.get("email").asText());
            }

            client.setContacts(contacts);
            clientRepository.save(client);
        }

        if (payload.hasNonNull("serviceTypeId")) {
            req.setServiceTypeId((short) payload.get("serviceTypeId").asInt());
        }

        if (payload.has("comment")) { // можно очищать коммент тоже
            if (payload.get("comment").isNull()) req.setComment(null);
            else if (!payload.get("comment").asText().isBlank()) req.setComment(payload.get("comment").asText());
        }
        if (payload.has("size")) {
            if (payload.get("size").isNull()) req.setSize(null);
            else if (!payload.get("size").asText().isBlank()) req.setSize(payload.get("size").asText());
        }

        if (payload.has("assigneeId")) {
            if (payload.get("assigneeId").isNull()) {
                req.setAssigneeId(null);
                // при снятии возвращаем статус в "accepted" (Новая)
                req.setStatus("accepted");
            } else {
                req.setAssigneeId(payload.get("assigneeId").asLong());
                // при назначении сразу переводим в работу
                req.setStatus("in_progress");
            }
        }

        if (payload.hasNonNull("status")) {
            String st = payload.get("status").asText();
            req.setStatus(st);
            if ("completed".equals(st) && req.getCompletedAt() == null) {
                req.setCompletedAt(Instant.now());
            }
        }

        serviceRequestRepository.save(req);
        return ResponseEntity.ok(toListItemDto(req));
    }

    // ---------- Назначить сотрудника на заявку (модератор/админ) ----------
    @PutMapping("/{id}/assign")
    public ResponseEntity<ServiceRequestListItemDto> assignRequest(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Object> payload
    ) {
        // Проверка роли: только MODERATOR или ADMIN
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new AccessDeniedException("Anonymous user");
        }

        boolean isManager = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ROLE_MODERATOR".equals(a.getAuthority()));
        if (!isManager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }

        ServiceRequest req = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена"));

        Object assigneeIdObj = payload.get("assignee_id");
        if (assigneeIdObj == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assignee_id is required");
        }

        Long assigneeId;
        try {
            assigneeId = Long.valueOf(String.valueOf(assigneeIdObj));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assignee_id must be a number");
        }

        employeeRepository.findById(assigneeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee not found: " + assigneeId));

        req.setAssigneeId(assigneeId);
        req.setStatus("in_progress");

        serviceRequestRepository.save(req);

        return ResponseEntity.ok(toListItemDto(req));
    }

    // ---------- Завершить заявку ----------
    @PutMapping("/{id}/complete")
    public ResponseEntity<ServiceRequestListItemDto> completeRequest(@PathVariable("id") Long id) {
        Employee current = currentEmployeeOrThrow();

        ServiceRequest req = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Заявка не найдена"));

        if (req.getAssigneeId() != null && !req.getAssigneeId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Заявка назначена на другого сотрудника");
        }

        req.setStatus("completed");
        req.setCompletedAt(Instant.now());

        if (req.getAssigneeId() == null) {
            req.setAssigneeId(current.getId());
        }

        serviceRequestRepository.save(req);
        return ResponseEntity.ok(toListItemDto(req));
    }

    // ---------- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ----------

    private ServiceRequestListItemDto toListItemDto(ServiceRequest req) {

        Client client = clientRepository.findById(req.getClientId()).orElse(null);
        ServiceType type = serviceTypeRepository.findById(req.getServiceTypeId()).orElse(null);

        String customerName = null;
        String phone = null;
        String email = null;

        if (client != null) {
            customerName = client.getFullName();

            Map<String, Object> contacts = client.getContacts();
            if (contacts != null) {
                Object phoneObj = contacts.get("phone");
                Object emailObj = contacts.get("email");

                if (phoneObj != null) phone = phoneObj.toString();
                if (emailObj != null) email = emailObj.toString();
            }
        }

        ServiceRequestListItemDto dto = new ServiceRequestListItemDto();

        dto.setId(req.getRequestId());
        dto.setRequestCode(req.getRequestCode());
        dto.setServiceName(type != null ? type.getName() : null);
        dto.setCustomerName(customerName);
        dto.setPhone(phone);
        dto.setEmail(email);

        dto.setStatus(req.getStatus());
        dto.setSize(req.getSize());
        dto.setComment(req.getComment());
        dto.setCreatedAt(req.getCreatedAt());
        dto.setAssigneeId(req.getAssigneeId());

        dto.setServiceTypeId(req.getServiceTypeId());
        dto.setCompletedAt(req.getCompletedAt());

        if (req.getAssigneeId() != null) {
            employeeRepository.findById(req.getAssigneeId())
                    .ifPresent(emp -> dto.setAssigneeName(emp.getFullName()));
        } else {
            dto.setAssigneeName(null);
        }

        return dto;
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
}