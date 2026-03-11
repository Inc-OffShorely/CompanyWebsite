package com.it.store.security;

import com.it.store.Entity.Employee;
import com.it.store.Repository.EmployeeRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider jwt;
    private final EmployeeRepository employees;

    public JwtAuthenticationFilter(JwtTokenProvider jwt,
                                   EmployeeRepository employees) {
        this.jwt = jwt;
        this.employees = employees;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        String path = req.getRequestURI();

        if (path.startsWith("/api/auth/login")
                || path.startsWith("/api/public/service-requests")
                || path.startsWith("/swagger")
                || path.startsWith("/v3/api-docs")
                || path.equals("/error")) {
            chain.doFilter(req, res);
            return;
        }

        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        log.info("JWT FILTER: {} {} has Authorization header", req.getMethod(), req.getRequestURI());

        String token = authHeader.substring("Bearer ".length()).trim();

        try {
            Jws<Claims> jws = jwt.parse(token);
            Claims body = jws.getBody();

            Long uid = Long.valueOf(body.getSubject());

            Optional<Employee> empOpt = employees.findById(uid);
            if (empOpt.isEmpty()) {
                log.warn("JWT FILTER: employee not found for uid={}", uid);
                chain.doFilter(req, res);
                return;
            }

            List<String> roleCodes = body.get("roles", List.class);

            Collection<GrantedAuthority> authorities = new ArrayList<>();
            if (roleCodes != null) {
                for (Object o : roleCodes) {
                    String code = o.toString();
                    String authority = "ROLE_" + code.toUpperCase();
                    authorities.add(new SimpleGrantedAuthority(authority));
                }
            }

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            uid,
                            null,
                            authorities
                    );

            SecurityContextHolder.getContext().setAuthentication(authToken);

            log.info("JWT FILTER: authenticated uid={}, roles={}", uid, roleCodes);

        } catch (Exception ex) {
            log.error("JWT FILTER: failed to parse token", ex);
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(req, res);
    }
}