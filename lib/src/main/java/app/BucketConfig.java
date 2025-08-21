package app;

import java.util.Map;

/**
 * Configuration class for S3 bucket settings.
 */
public class BucketConfig {

    private static final String DEFAULT_BUCKET_PREFIX = "java-app-bucket";
    private static final String DEFAULT_ENVIRONMENT = "development";

    /**
     * Get the default bucket name.
     */
    public static String getDefaultBucketName() {
        return DEFAULT_BUCKET_PREFIX;
    }

    /**
     * Get default tags for S3 bucket.
     */
    public static Map<String, String> getDefaultTags() {
        return Map.of(
            "Environment", DEFAULT_ENVIRONMENT,
            "Project", "pulumi-java-template",
            "ManagedBy", "pulumi"
        );
    }

    /**
     * Check if bucket name is valid.
     */
    public static boolean isValidBucketName(String bucketName) {
        if (bucketName == null || bucketName.trim().isEmpty()) {
            return false;
        }
        return bucketName.matches("^[a-z0-9.-]+$") && 
               bucketName.length() >= 3 && 
               bucketName.length() <= 63;
    }

    /**
     * Get encryption algorithm.
     */
    public static String getEncryptionAlgorithm() {
        return "AES256";
    }
}