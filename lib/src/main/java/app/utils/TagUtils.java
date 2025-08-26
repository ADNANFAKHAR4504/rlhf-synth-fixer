package app.utils;
import app.config.AppConfig;

import java.util.Map;

public final class TagUtils {
    
    private TagUtils() {
        // Utility class should not be instantiated
    }
    public static Map<String, String> getDefaultTags(AppConfig config) {
        return Map.of(
                "Environment", config.getDefaultEnvironment(),
                "Project", config.getProjectName(),
                "ManagedBy", "Pulumi"
        );
    }

    public static Map<String, String> getTagsWithName(String name, AppConfig config) {
        var tags = new java.util.HashMap<>(getDefaultTags(config));
        tags.put("Name", name);
        return tags;
    }
}