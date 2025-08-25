package app.utils;

import com.pulumi.aws.ProviderArgs;
import java.util.Map;
import java.util.HashMap;

public class TaggingPolicy {
    private static final String PROJECT_NAME = "CloudMigration";
    
    public static Map<String, String> getDefaultTags(String environment) {
        Map<String, String> tags = new HashMap<>();
        tags.put("Project", PROJECT_NAME);
        tags.put("Environment", environment);
        tags.put("ManagedBy", "Pulumi");
        tags.put("CreatedDate", java.time.LocalDate.now().toString());
        return tags;
    }
    
    public static Map<String, String> getResourceTags(String environment, String resourceType) {
        Map<String, String> tags = new HashMap<>();
        tags.put("Project", PROJECT_NAME);
        tags.put("Environment", environment);
        tags.put("ResourceType", resourceType);
        tags.put("ManagedBy", "Pulumi");
        return tags;
    }
    
    public static Map<String, String> getResourceTags(String environment, String resourceType, String customTag, String customValue) {
        Map<String, String> baseTags = getResourceTags(environment, resourceType);
        baseTags.put(customTag, customValue);
        return baseTags;
    }
}