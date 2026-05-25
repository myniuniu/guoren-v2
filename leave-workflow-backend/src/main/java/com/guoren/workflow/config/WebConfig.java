package com.guoren.workflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Paths;

/**
 * Web配置 - 跨域 + 静态资源映射
 */
@Configuration
public class WebConfig {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
                registry.addMapping("/uploads/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "OPTIONS");
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                File dir = Paths.get(uploadDir).toAbsolutePath().toFile();
                if (!dir.exists()) {
                    //noinspection ResultOfMethodCallIgnored
                    dir.mkdirs();
                }
                String location = "file:" + dir.getAbsolutePath() + File.separator;
                registry.addResourceHandler("/uploads/**").addResourceLocations(location);
            }
        };
    }
}
