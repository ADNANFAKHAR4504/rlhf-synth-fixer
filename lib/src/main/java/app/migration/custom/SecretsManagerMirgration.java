package app.migration.custom;

import com.pulumi.aws.Provider;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.secretsmanager.Secret;
import com.pulumi.aws.secretsmanager.SecretArgs;
import com.pulumi.aws.secretsmanager.SecretVersion;
import com.pulumi.aws.secretsmanager.SecretVersionArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResource;
import com.pulumi.resources.ResourceArgs;
import app.config.EnvironmentConfig;
import app.utils.ResourceNaming;
import app.utils.TaggingPolicy;

import java.util.Map;

public class SecretsManagerMigration extends CustomResource {
    private final EnvironmentConfig envConfig;
    private final Provider awsProvider;
    private final Key kmsKey;
    
    public SecretsManagerMigration(String name, EnvironmentConfig envConfig, 
                                 Provider awsProvider, Key kmsKey) {
        super("custom:migration:SecretsManager", name, ResourceArgs.Empty, null);
        this.envConfig = envConfig;
        this.awsProvider = awsProvider;
        this.kmsKey = kmsKey;
    }
    
    public Output<String> migrate() {
        // Example: Migrate database credentials
        String secretName = ResourceNaming.generateResourceName(
            envConfig.getEnvironment(), "secret", "db-credentials"
        );
        
        Secret dbSecret = new Secret(secretName, SecretArgs.builder()
            .name(secretName)
            .description("Database credentials for " + envConfig.getEnvironment())
            .kmsKeyId(kmsKey.id())
            .tags(TaggingPolicy.getResourceTags(envConfig.getEnvironment(), "Secret", "Type", "Database"))
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        // Create secret version with placeholder values
        // In real implementation, you would fetch these from your existing secret store
        Map<String, String> secretValue = Map.of(
            "username", "admin",
            "password", "placeholder-" + ResourceNaming.generateRandomString(16),
            "host", envConfig.getEnvironment() + "-db.internal",
            "port", "5432",
            "database", "app_" + envConfig.getEnvironment()
        );
        
        String secretJson = convertMapToJson(secretValue);
        
        new SecretVersion(secretName + "-version", SecretVersionArgs.builder()
            .secretId(dbSecret.id())
            .secretString(secretJson)
            .build(), com.pulumi.resources.CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        return Output.of("completed");
    }
    
    private String convertMapToJson(Map<String, String> map) {
        StringBuilder json = new StringBuilder("{");
        map.forEach((key, value) -> 
            json.append("\"").append(key).append("\":\"").append(value).append("\",")
        );
        if (json.length() > 1) {
            json.setLength(json.length() - 1); // Remove last comma
        }
        json.append("}");
        return json.toString();
    }
}