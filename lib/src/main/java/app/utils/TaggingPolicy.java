package app.utils;

import com.pulumi.aws.DefaultTagsArgs;
import java.util.Map;

public class TaggingPolicy {
    private static final String PROJECT_NAME = "CloudMigration";
    
    public static DefaultTagsArgs getDefaultTags(String environment) {
        return DefaultTagsArgs.builder()
            .tags(Map.of(
                "Project", PROJECT_NAME,
                "Environment", environment,
                "ManagedBy", "Pulumi",
                "CreatedDate", java.time.LocalDate.now().toString()
            ))
            .build();
    }
    
    public static Map<String, String> getResourceTags(String environment, String resourceType) {
        return Map.of(
            "Project", PROJECT_NAME,
            "Environment", environment,
            "ResourceType", resourceType,
            "ManagedBy", "Pulumi"
        );
    }
    
    public static Map<String, String> getResourceTags(String environment, String resourceType, String customTag, String customValue) {
        var baseTags = getResourceTags(environment, resourceType);
        var extendedTags = new java.util.HashMap<>(baseTags);
        extendedTags.put(customTag, customValue);
        return extendedTags;
    }
}