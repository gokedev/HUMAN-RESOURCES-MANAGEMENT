package com.hrsaas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HrSaasApplication {
    public static void main(String[] args) {
        SpringApplication.run(HrSaasApplication.class, args);
    }
}
