package app.migration;

import com.pulumi.aws.Provider;
import com.pulumi.aws.kms.Key;
import com.pulumi.core.Output;
import app.config.EnvironmentConfig;
import app.migration.custom.SecretsManagerMigration;

public class MigrationManager {
    private final String name;
    private final EnvironmentConfig envConfig;
    private final Provider awsProvider;
    
    public MigrationManager(String name, EnvironmentConfig envConfig, Provider awsProvider) {
        this.name = name;
        this.envConfig = envConfig;
        this.awsProvider = awsProvider;
    }
    
    public Output<String> migrateSecrets(Key kmsKey) {
        SecretsManagerMigration secretsMigration = new SecretsManagerMigration(
            envConfig,
            awsProvider,
            kmsKey
        );
        
        return secretsMigration.migrate();
    }
}