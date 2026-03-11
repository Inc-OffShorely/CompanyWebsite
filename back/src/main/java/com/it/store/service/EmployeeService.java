package com.it.store.service;

import com.it.store.Entity.Employee;
import com.it.store.Entity.Role;
import com.it.store.Repository.EmployeeRepository;
import com.it.store.Repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    public List<Employee> findAll() {
        return employeeRepository.findAll();
    }

    public Optional<Employee> findById(Long id) {
        return employeeRepository.findById(id);
    }

    public Employee save(Employee employee) {
        return employeeRepository.save(employee);
    }


    public void deleteById(Long id) {
        employeeRepository.deleteById(id);
    }

    @Transactional
    public Employee updateRoles(Long employeeId, List<String> rolesCodes) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Сотрудник не найден: id=" + employeeId));

        Set<Role> newRoles = new HashSet<>();

        for (String codeRaw : rolesCodes) {
            String code = codeRaw.toLowerCase();
            Role role = roleRepository.findByCode(code)
                    .orElseThrow(() -> new IllegalArgumentException("Неизвестная роль: " + code));
            newRoles.add(role);
        }
        employee.setRoles(newRoles);
        return employeeRepository.save(employee);
    }

    @Transactional
    public Employee setCanManageDocuments(Long employeeId, boolean canManage) {
        Employee e = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Сотрудник не найден: id=" + employeeId));

        employeeRepository.updateDocsPermission(employeeId, canManage);

        e.setCanManageDocuments(canManage);

        return e;
    }
}