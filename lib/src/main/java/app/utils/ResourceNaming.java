package app.utils;

import java.security.SecureRandom;

public class ResourceNaming {
    private static final SecureRandom random = new SecureRandom();
    private static final String CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
    
    public static String generateResourceName(String environment, String resourceType, String baseName) {
        String randomSuffix = generateRandomString(6);
        return String.format("cm-%s-%s-%s-%s", 
            environment.substring(0, Math.min(3, environment.length())),
            resourceType,
            baseName,
            randomSuffix
        ).toLowerCase();
    }
    
    public static String generateRandomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
        }
        return sb.toString();
    }
    
    public static String sanitizeName(String name) {
        return name.replaceAll("[^a-zA-Z0-9-]", "-")
                  .replaceAll("-+", "-")
                  .toLowerCase();
    }
}