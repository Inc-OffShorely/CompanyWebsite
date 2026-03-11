package com.it.store.Controller;

import com.it.store.Entity.Client;
import com.it.store.Entity.ServiceRequest;
import com.it.store.Entity.ServiceType;
import com.it.store.Repository.ClientRepository;
import com.it.store.Repository.ServiceRequestRepository;
import com.it.store.Repository.ServiceTypeRepository;
import com.it.store.api.dto.CreateServiceRequestDto;
import com.it.store.api.dto.ServiceRequestResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/public/service-requests")
public class ServiceRequestController {

    private final ClientRepository clientRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    public ServiceRequestController(ClientRepository clientRepository,
                                    ServiceTypeRepository serviceTypeRepository,
                                    ServiceRequestRepository serviceRequestRepository) {
        this.clientRepository = clientRepository;
        this.serviceTypeRepository = serviceTypeRepository;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    // === Создание заявки ===
    @PostMapping
    public ResponseEntity<ServiceRequestResponseDto> create(@RequestBody CreateServiceRequestDto dto) {
        if (dto == null
                || dto.getServiceName() == null
                || dto.getCustomerName() == null
                || dto.getPhone() == null
                || dto.getEmail() == null) {
            return ResponseEntity.badRequest().build();
        }

        ServiceType serviceType = serviceTypeRepository.findByName(dto.getServiceName())
                .orElseGet(() -> {
                    ServiceType st = new ServiceType();
                    st.setName(dto.getServiceName());
                    return serviceTypeRepository.save(st);
                });

        Map<String, Object> contacts = new HashMap<>();
        contacts.put("phone", dto.getPhone());
        contacts.put("email", dto.getEmail());

        Client client = new Client();
        client.setFullName(dto.getCustomerName());
        client.setContacts(contacts);
        client = clientRepository.save(client);

        // Создаем заявку
        ServiceRequest req = new ServiceRequest();
        req.setClientId(client.getClientId());
        req.setServiceTypeId(serviceType.getServiceTypeId());

        Instant now = Instant.now();
        req.setCreatedAt(now);

        String finalComment = dto.getComment();

        if (dto.getSize() != null && !dto.getSize().isBlank()) {
            req.setSize(dto.getSize());

            if (finalComment == null || finalComment.isBlank()) {
                finalComment = "Размер: " + dto.getSize();
            } else {
                finalComment = finalComment + " | Размер: " + dto.getSize();
            }
        }
        req.setComment(finalComment);

        // статус по умолчанию
        req.setStatus("accepted");

        // Генерим номер заявки
        String requestCode = generateRequestCode(serviceType, now);
        req.setRequestCode(requestCode);

        req = serviceRequestRepository.save(req);

        ServiceRequestResponseDto response = new ServiceRequestResponseDto(
                req.getRequestCode(),
                serviceType.getName(),
                client.getFullName(),
                dto.getPhone(),
                dto.getEmail(),
                req.getCreatedAt(),
                req.getStatus(),
                req.getSize()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // === Трекинг заявки по номеру ===
    @GetMapping("/{requestCode}")
    public ResponseEntity<ServiceRequestResponseDto> getByCode(@PathVariable String requestCode) {
        Optional<ServiceRequest> opt = serviceRequestRepository.findByRequestCode(requestCode);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest req = opt.get();
        Client client = clientRepository.findById(req.getClientId()).orElse(null);
        ServiceType type = serviceTypeRepository.findById(req.getServiceTypeId()).orElse(null);

        String phone = null;
        String email = null;
        if (client != null && client.getContacts() != null) {
            Map<String, Object> contacts = client.getContacts();
            phone = (String) contacts.get("phone");
            email = (String) contacts.get("email");
        }

        ServiceRequestResponseDto response = new ServiceRequestResponseDto(
                req.getRequestCode(),
                type != null ? type.getName() : null,
                client != null ? client.getFullName() : null,
                phone,
                email,
                req.getCreatedAt(),
                req.getStatus(),
                req.getSize()
        );

        return ResponseEntity.ok(response);
    }

    private String generateRequestCode(ServiceType type, Instant createdAt) {
        String serviceName = type.getName();
        String prefix;
        switch (serviceName) {
            case "Оптовая продажа":
                prefix = "ОП";
                break;
            case "Индивидуальный пошив":
                prefix = "ИП";
                break;
            case "Разработка корпоративного мерча":
                prefix = "РКМ";
                break;
            case "Консультация по стилю":
                prefix = "КС";
                break;
            default:
                prefix = "SR";
        }

        ZonedDateTime zdt = createdAt.atZone(ZoneId.systemDefault());
        int day = zdt.getDayOfMonth();
        int month = zdt.getMonthValue();
        int year = zdt.getYear();
        int rand = ThreadLocalRandom.current().nextInt(1000, 10000);

        return String.format("%s-%02d-%02d-%04d-%04d", prefix, day, month, year, rand);
    }
}