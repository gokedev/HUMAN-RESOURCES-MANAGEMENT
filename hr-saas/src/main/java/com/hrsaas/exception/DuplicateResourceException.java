package com.hrsaas.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends ApiException {

    private final String code;

    public DuplicateResourceException(String message) {
        super(message, HttpStatus.CONFLICT);
        this.code = "DUPLICATE_RESOURCE";
    }

    public DuplicateResourceException(String message, String code) {
        super(message, HttpStatus.CONFLICT);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
