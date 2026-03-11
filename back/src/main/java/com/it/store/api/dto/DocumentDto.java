package com.it.store.api.dto;

import java.time.Instant;

public record DocumentDto(
        String name,
        long size,
        Instant lastModified
) {}