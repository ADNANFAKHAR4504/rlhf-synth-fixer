package app.config;

import java.util.UUID;

public record Config(String projectName, String primaryRegion, String secondaryRegion, String notificationEmail) {

    public Config() {
        this("webapp", "us-east-1", "us-west-2", "devops@turing.com");
    }

    /**
     * Creates a unique resource name by appending the first 6 characters of a UUID
     * to avoid naming conflicts with existing AWS resources.
     *
     * @param baseName the base name for the resource
     * @return a unique resource name with UUID suffix
     */
    public String resourceName(final String baseName) {
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return baseName + "-" + uuid.substring(0, 6);
    }
}