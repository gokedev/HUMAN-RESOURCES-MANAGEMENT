package com.hrsaas.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {

    private final String code;

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
        this.code = "RESOURCE_NOT_FOUND";
    }

    public ResourceNotFoundException(String message, String code) {
        super(message, HttpStatus.NOT_FOUND);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
