package app.migration.custom;

import com.pulumi.aws.Provider;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.secretsmanager.Secret;
import com.pulumi.aws.secretsmanager.SecretArgs;
import com.pulumi.aws.secretsmanager.SecretVersion;
import com.pulumi.aws.secretsmanager.SecretVersionArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;
import app.config.EnvironmentConfig;
import app.utils.ResourceNaming;
import app.utils.TaggingPolicy;

import java.util.Map;
import java.util.HashMap;

public class SecretsManagerMigration {
    private final EnvironmentConfig envConfig;
    private final Provider awsProvider;
    private final Key kmsKey;
    
    public SecretsManagerMigration(EnvironmentConfig envConfig, 
                                 Provider awsProvider, Key kmsKey) {
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
            .build(), CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        // Create secret version with placeholder values
        // In real implementation, you would fetch these from your existing secret store
        Map<String, String> secretValue = new HashMap<>();
        secretValue.put("username", "admin");
        secretValue.put("password", "placeholder-" + ResourceNaming.generateRandomString(16));
        secretValue.put("host", envConfig.getEnvironment() + "-db.internal");
        secretValue.put("port", "5432");
        secretValue.put("database", "app_" + envConfig.getEnvironment());
        
        String secretJson = convertMapToJson(secretValue);
        
        new SecretVersion(secretName + "-version", SecretVersionArgs.builder()
            .secretId(dbSecret.id())
            .secretString(secretJson)
            .build(), CustomResourceOptions.builder()
                .provider(awsProvider)
                .build());
        
        return Output.of("completed");
    }
    
    private String convertMapToJson(Map<String, String> map) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> entry : map.entrySet()) {
            if (!first) {
                json.append(",");
            }
            json.append("\"").append(entry.getKey()).append("\":\"").append(entry.getValue()).append("\"");
            first = false;
        }
        json.append("}");
        return json.toString();
    }
}