package com.guoren.workflow;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan({"com.guoren.workflow.form.mapper", "com.guoren.workflow.certificate.mapper", "com.guoren.workflow.mapper"})
public class LeaveWorkflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(LeaveWorkflowApplication.class, args);
    }
}
