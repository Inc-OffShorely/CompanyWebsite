package com.it.store.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public record NewsCreateRequest(
        @NotBlank String title,
        @NotBlank String content,

        @JsonProperty("publishedAt")
        @JsonAlias({"published_at"})
        @NotBlank String publishedAt
) {}