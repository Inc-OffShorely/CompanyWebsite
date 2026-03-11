package com.it.store.Controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.it.store.Entity.Employee;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.api.dto.EmployeeAdminDto;
import com.it.store.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;


@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    @Autowired
    private EmployeeService employeeService;
    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeService.findAll();
    }

    @GetMapping("/support")
    public List<EmployeeShortDto> getSupportEmployees() {
        return employeeRepository.findAll().stream()
                .map(e -> new EmployeeShortDto(e.getId(), e.getFullName(), e.getPositionTitle()))
                .toList();
    }

    @GetMapping("/all")
    public List<EmployeeDto> getAllEmployeesFull() {
        return employeeRepository.findAll().stream()
                .map(e -> new EmployeeDto(
                        e.getId(),
                        e.getFullName(),
                        e.getPositionTitle()
                ))
                .toList();
    }

    public record EmployeeDto(Long id, String name, String position) {}


    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        Optional<Employee> employee = employeeService.findById(id);
        return employee.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Employee> createEmployee(@RequestBody CreateEmployeeRequest req) {
        try {
            // Валидируем пароль: ровно 8 цифр
            if (req.password() == null || !req.password().matches("\\d{8}")) {
                return ResponseEntity.badRequest().build();
            }

            Employee e = new Employee();
            e.setFullName(req.fullName());
            e.setLogin(req.login());
            e.setEmail(req.email());
            e.setPositionTitle(req.positionTitle());
            e.setContacts(req.contacts());
            e.setPassportData(req.passportData());

            if (req.birthDate() != null && !req.birthDate().isBlank()) {
                e.setBirthDate(LocalDate.parse(req.birthDate()));
            }
            if (req.hiredAt() != null && !req.hiredAt().isBlank()) {
                e.setHiredAt(LocalDateTime.parse(req.hiredAt()));
            }

            e.setPasswordHash(passwordEncoder.encode(req.password()));
            e.setHasActiveSession(false);
            e.setCanManageDocuments(false);

            Employee saved = employeeService.save(e);
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }


    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(@PathVariable Long id, @RequestBody Employee dto) {
        return employeeService.findById(id)
                .map(e -> {
                    e.setFullName(dto.getFullName());
                    e.setEmail(dto.getEmail());
                    e.setLogin(dto.getLogin());
                    e.setPassportData(dto.getPassportData());
                    e.setContacts(dto.getContacts());
                    e.setBirthDate(dto.getBirthDate());
                    e.setHiredAt(dto.getHiredAt());
                    e.setPositionTitle(dto.getPositionTitle());
                    return ResponseEntity.ok(employeeService.save(e));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/roles")
    public ResponseEntity<Employee> updateEmployeeRoles(
            @PathVariable Long id,
            @RequestBody UpdateRolesRequest request
    ) {
        if (employeeService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Employee updated = employeeService.updateRoles(id, request.roles());
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/document-permission")
    public ResponseEntity<Employee> updateDocumentPermission(
            @PathVariable Long id,
            @RequestBody UpdateDocPermissionRequest request
    ) {
        if (employeeService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Employee updated = employeeService.setCanManageDocuments(id, request.canManageDocuments());
        return ResponseEntity.ok(updated);
    }

    public record UpdateDocPermissionRequest(
            @JsonProperty("canManageDocuments")
            boolean canManageDocuments
    ) {}

    public record CreateEmployeeRequest(
            @JsonProperty("full_name")     String fullName,
            @JsonProperty("login")         String login,
            @JsonProperty("email")         String email,
            @JsonProperty("position_title") String positionTitle,
            @JsonProperty("contacts")      Map<String, String> contacts,
            @JsonProperty("birth_date")    String birthDate,
            @JsonProperty("hired_at")      String hiredAt,
            @JsonProperty("passport_data") String passportData,
            @JsonProperty("password")      String password
    ) {}


    public record UpdateRolesRequest(java.util.List<String> roles) {}

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        if (employeeService.findById(id).isPresent()) {
            employeeService.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    @Autowired
    private PasswordEncoder passwordEncoder;

    public record UpdatePasswordRequest(
            @JsonProperty("newPassword") String newPassword
    ) {}

    @PutMapping("/{id}/password")
    public ResponseEntity<?> updateEmployeePassword(
            @PathVariable Long id,
            @RequestBody UpdatePasswordRequest request
    ) {
        return employeeService.findById(id)
                .map(e -> {
                    String raw = request.newPassword();
                    // Жёсткая проверка: ровно 8 цифр
                    if (raw == null || !raw.matches("\\d{8}")) {
                        return ResponseEntity.badRequest().build();
                    }
                    e.setPasswordHash(passwordEncoder.encode(raw));
                    employeeService.save(e);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    // Простой DTO для сотрудников ТП
    public record EmployeeShortDto(
            Long id,
            String fullName,
            String positionTitle
    ) {}
}