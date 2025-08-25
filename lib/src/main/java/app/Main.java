package app;

import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import app.config.EnvironmentConfig;
import app.infrastructure.InfrastructureStack;
import app.migration.MigrationManager;
import app.utils.TaggingPolicy;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Get environment configuration
            String environment = ctx.config().get("environment").orElse("development");
            String region = ctx.config().get("region").orElse("us-east-1");
            
            // Validate environment
            EnvironmentConfig envConfig = new EnvironmentConfig(environment);
            
            // Create AWS provider with environment-specific configuration
            Provider awsProvider = new Provider("aws-provider", ProviderArgs.builder()
                .region(region)
                // Note: Default tags will be applied individually to resources via TaggingPolicy
                .build());
            
            // Initialize infrastructure stack
            InfrastructureStack infraStack = new InfrastructureStack(
                "cloud-migration-" + environment,
                envConfig,
                awsProvider
            );
            
            // Deploy core infrastructure
            var vpc = infraStack.createVpc();
            var securityGroups = infraStack.createSecurityGroups(vpc);
            var kmsKey = infraStack.createKmsKey();
            
            // Initialize migration manager for custom migration tasks
            MigrationManager migrationManager = new MigrationManager(
                "migration-manager-" + environment,
                envConfig,
                awsProvider
            );
            
            // Execute custom migrations
            var secretsMigration = migrationManager.migrateSecrets(kmsKey);
            
            // Export important outputs
            ctx.export("vpcId", vpc.id());
            ctx.export("kmsKeyId", kmsKey.id());
            ctx.export("environment", Output.of(environment));
            ctx.export("migrationStatus", secretsMigration.apply(status -> 
                Output.of(Map.of("secretsMigration", status))));
        });
    }
}