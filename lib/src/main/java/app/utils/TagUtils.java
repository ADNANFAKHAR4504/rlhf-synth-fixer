package app.utils;
import app.config.AppConfig;

import java.util.Map;

public class TagUtils {
    public static Map<String, String> getDefaultTags() {
        return Map.of(
                "Environment", AppConfig.getDefaultEnvironment(),
                "Project", AppConfig.getProjectName(),
                "ManagedBy", "Pulumi"
        );
    }

    public static Map<String, String> getTagsWithName(String name) {
        var tags = new java.util.HashMap<>(getDefaultTags());
        tags.put("Name", name);
        return tags;
    }
}