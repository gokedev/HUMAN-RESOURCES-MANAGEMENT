package com.hrsaas.exception;

import org.springframework.http.HttpStatus;

public class BusinessRuleViolationException extends ApiException {

    private final String code;

    public BusinessRuleViolationException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
        this.code = "BUSINESS_RULE_VIOLATION";
    }

    public BusinessRuleViolationException(String message, String code) {
        super(message, HttpStatus.BAD_REQUEST);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
