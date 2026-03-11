package com.it.store.Controller;

import com.it.store.api.dto.ResolveTicketRequest;
import com.it.store.api.dto.SupportTicketDto;
import com.it.store.Entity.Employee;
import com.it.store.Entity.SupportTicket;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.Repository.SupportTicketRepository;
import com.it.store.api.dto.SupportTicketUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.it.store.api.dto.CreateSupportTicketRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/support-tickets")
@RequiredArgsConstructor
public class SupportTicketController {
    public static class AddCommentRequest {
        private String comment;

        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }

    @PutMapping("/{id}/comment")
    public ResponseEntity<SupportTicketDto> addComment(
            @PathVariable("id") Long id,
            @RequestBody AddCommentRequest body
    ) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        String oldComment = ticket.getComment();
        String prefix = (oldComment == null || oldComment.isBlank()) ? "" : (oldComment + "\n\n");

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long empId = (Long) auth.getPrincipal();
        Employee emp = employeeRepository.findById(empId).orElseThrow();

        String newBlock = "[" + OffsetDateTime.now() + "] " + emp.getFullName() + ": " + body.getComment();

        ticket.setComment(prefix + newBlock);

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(toDto(saved));
    }



    private final SupportTicketRepository supportTicketRepository;
    private final EmployeeRepository employeeRepository;


    private String mapUiStatusToBackend(String uiStatus) {
        if (uiStatus == null) return null;

        switch (uiStatus) {
            case "new":
            case "assigned":
                return "accepted";
            case "in_progress":
            case "waiting":
                return "in_progress";
            case "resolved":
            case "closed":
                return "completed";
            case "rejected":
                return "rejected";
            default:
                return "accepted";
        }
    }

    // БД → UI
    private String mapBackendStatusToUi(String dbStatus) {
        if (dbStatus == null) return "new";

        switch (dbStatus) {
            case "accepted":
                return "new";
            case "in_progress":
                return "in_progress";
            case "completed":
                return "resolved";
            case "rejected":
                return "rejected";
            default:
                return "new";
        }
    }

    private String buildTicketNumber(SupportTicket ticket) {
        String datePart = ticket.getCreatedAt() != null
                ? ticket.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE)
                : "0000-00-00";
        String idPart = String.format("%03d", ticket.getId() != null ? ticket.getId() : 0);
        return "ТП-" + datePart + "-" + idPart;
    }

    private SupportTicketDto toDto(SupportTicket ticket) {
        SupportTicketDto dto = new SupportTicketDto();

        dto.setId(ticket.getId());

        dto.setTicketNumber(buildTicketNumber(ticket));

        dto.setTitle(ticket.getSubject());

        dto.setDescription(ticket.getDescription());
        dto.setCategory(ticket.getCategory());

        dto.setPriority(null);

        dto.setStatus(mapBackendStatusToUi(ticket.getStatus()));

        // ====== исполнитель заявки ======
        if (ticket.getAssignee() != null) {
            Employee assignee = ticket.getAssignee();
            dto.setAssigneeId(assignee.getId());
            dto.setAssigneeFullName(assignee.getFullName());
            dto.setAssigneePosition(assignee.getPositionTitle());
        } else {
            dto.setAssigneeId(null);
            dto.setAssigneeFullName(null);
            dto.setAssigneePosition(null);
        }

        dto.setSolution(ticket.getSolution());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setResolvedAt(ticket.getClosedAt());
        dto.setComment(ticket.getComment());

        // ====== создатель заявки ======
        Employee creator = ticket.getCreator();
        if (creator != null) {
            dto.setCreatorId(creator.getId());
            dto.setEmployeeFullName(creator.getFullName());
        }

        return dto;
    }

    // ====== Получить список всех тикетов ======

    @GetMapping
    public List<SupportTicketDto> getAllTickets() {
        List<SupportTicket> list = supportTicketRepository.findAll();
        System.out.println("Support tickets count = " + list.size());
        return list.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ====== Создать тикет (сотрудник компании) ======
    @PostMapping
    public ResponseEntity<SupportTicketDto> createTicket(@RequestBody CreateSupportTicketRequest req) {

        // Достаём текущего сотрудника из JWT
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user in context");
        }

        Object principal = auth.getPrincipal();
        if (!(principal instanceof Long)) {
            throw new IllegalStateException("Authentication principal is not employee id");
        }

        Long employeeId = (Long) principal;

        Employee creator = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + employeeId));

        SupportTicket ticket = new SupportTicket();
        ticket.setCreator(creator);
        ticket.setSubject(req.getTitle());
        ticket.setDescription(req.getDescription());

        // категория из запроса или "other" по умолчанию
        ticket.setCategory(
                (req.getCategory() != null && !req.getCategory().isBlank())
                        ? req.getCategory()
                        : "other"
        );

        ticket.setStatus("accepted");

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(toDto(saved));
    }


    // ====== Взять тикет в работу (исполнитель = текущий сотрудник) ======

    @PutMapping("/{id}/take")
    public ResponseEntity<SupportTicketDto> takeTicket(@PathVariable("id") Long id,
                                                       @RequestParam("assigneeId") Long assigneeId) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        Employee assignee = employeeRepository.findById(assigneeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + assigneeId));

        ticket.setAssignee(assignee);
        ticket.setStatus("in_progress");

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(toDto(saved));
    }

    // ====== Назначить исполнителя (админ/модер) ======

    @PutMapping("/{id}/assign")
    public ResponseEntity<SupportTicketDto> assignTicket(@PathVariable("id") Long id,
                                                         @RequestParam("assigneeId") Long assigneeId) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        Employee assignee = employeeRepository.findById(assigneeId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + assigneeId));

        ticket.setAssignee(assignee);
        ticket.setStatus("accepted");

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(toDto(saved));
    }

    // ====== Решить / закрыть тикет ======
    @PutMapping("/{id}/resolve")
    public ResponseEntity<SupportTicketDto> resolveTicket(
            @PathVariable("id") Long id,
            @RequestBody(required = false) ResolveTicketRequest body
    ) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long empId = (Long) auth.getPrincipal();
        Employee emp = employeeRepository.findById(empId).orElseThrow();

        String solution = (body != null && body.getSolution() != null)
                ? body.getSolution().trim()
                : "Решено без текста";

        String fullSolution = "[" + OffsetDateTime.now() + "] "
                + emp.getFullName()
                + ": "
                + solution;

        ticket.setSolution(fullSolution);
        ticket.setStatus("completed");
        ticket.setClosedAt(OffsetDateTime.now());

        if (ticket.getAssignee() == null) {
            ticket.setAssignee(emp);
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(toDto(saved));
    }

    // ====== Общий апдейт (редактирование админом/модером) ======

    @PutMapping("/{id}")
    public ResponseEntity<SupportTicketDto> updateTicket(
            @PathVariable("id") Long id,
            @RequestBody SupportTicketUpdateRequest req
    )
    {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        if (req.getStatus() != null) {
            ticket.setStatus(mapUiStatusToBackend(req.getStatus()));
        }

        if (req.getComment() != null) {
            ticket.setComment(req.getComment());
        }

        Long aid = req.getAssigneeId();
        System.out.println("UPDATE assigneeId = " + aid);

        if (aid != null) {
            if (aid == 0L) {
                ticket.setAssignee(null);
            } else {
                Employee assignee = employeeRepository.findById(aid)
                        .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + aid));
                ticket.setAssignee(assignee);
            }
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        return ResponseEntity.ok(toDto(saved));
    }

    // ====== Удалить тикет ======

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable("id") Long id) {
        if (!supportTicketRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        supportTicketRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
