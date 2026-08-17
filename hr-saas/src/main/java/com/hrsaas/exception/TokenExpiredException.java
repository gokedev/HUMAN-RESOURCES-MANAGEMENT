package com.hrsaas.exception;

import org.springframework.http.HttpStatus;

public class TokenExpiredException extends ApiException {

    private final String code;

    public TokenExpiredException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
        this.code = "TOKEN_EXPIRED";
    }

    public TokenExpiredException(String message, String code) {
        super(message, HttpStatus.UNAUTHORIZED);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
