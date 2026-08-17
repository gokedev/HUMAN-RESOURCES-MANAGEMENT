package com.hrsaas.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            jakarta.servlet.FilterChain filterChain
    ) throws IOException, jakarta.servlet.ServletException {

        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();

        request.setAttribute("requestId", requestId);

        log.debug("[{}] {} {} from {}",
                requestId,
                request.getMethod(),
                request.getRequestURI(),
                request.getRemoteAddr());

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            if (status >= 400) {
                log.warn("[{}] {} {} completed with status {} in {}ms",
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        status,
                        duration);
            } else {
                log.debug("[{}] {} {} completed with status {} in {}ms",
                        requestId,
                        request.getMethod(),
                        request.getRequestURI(),
                        status,
                        duration);
            }
        }
    }
}
