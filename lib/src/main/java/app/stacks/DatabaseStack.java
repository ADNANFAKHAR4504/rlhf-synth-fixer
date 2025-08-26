package app.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.secretsmanager.*;
import software.constructs.Construct;

import java.util.List;

public class DatabaseStack extends Stack {
    private final IDatabaseInstance database;
    private final ISecret databaseSecret;

    public DatabaseStack(final Construct scope, final String id, final DatabaseStackProps props) {
        super(scope, id, props.getStackProps());

        // Create secret for database credentials
        this.databaseSecret = Secret.Builder.create(this, "DatabaseSecret")
                .secretName("prod/webapp/database")
                .description("Database credentials for web application")
                .generateSecretString(
                        SecretStringGenerator.builder()
                                .secretStringTemplate("{\"username\": \"webapp_admin\"}")
                                .generateStringKey("password")
                                .excludeCharacters(" %+~`#$&*()|[]{}:;<>?!'/\"\\")
                                .passwordLength(32)
                                .build()
                )
                .encryptionKey(props.getKmsKey())
                .build();

        // Create subnet group for RDS
        SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .vpc(props.getVpc())
                .description("Subnet group for RDS database")
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();

        // Create RDS PostgreSQL instance
        this.database = DatabaseInstance.Builder.create(this, "WebAppDatabase")
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                        .version(PostgresEngineVersion.VER_15_4)
                        .build()))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3, software.amazon.awscdk.services.ec2.InstanceSize.SMALL))
                .vpc(props.getVpc())
                .subnetGroup(dbSubnetGroup)
                .securityGroups(List.of(props.getRdsSecurityGroup()))
                .credentials(Credentials.fromSecret(databaseSecret))
                .multiAz(true)
                .storageEncrypted(true)
                .storageEncryptionKey(props.getRdsKmsKey())
                .backupRetention(software.amazon.awscdk.Duration.days(7))
                .deleteAutomatedBackups(true)
                .deletionProtection(false) // Set to true for production
                .databaseName("webapp")
                .allocatedStorage(20)
                .maxAllocatedStorage(100)
                .monitoringInterval(software.amazon.awscdk.Duration.seconds(60))
                .enablePerformanceInsights(true)
                .performanceInsightEncryptionKey(props.getRdsKmsKey())
                .build();

        // Add tags
        Tags.of(this).add("Environment", "production");
        Tags.of(this).add("Project", "SecureWebApp");
    }

    public IDatabaseInstance getDatabase() {
        return database;
    }

    public ISecret getDatabaseSecret() {
        return databaseSecret;
    }

    public static class DatabaseStackProps {
        private final StackProps stackProps;
        private final IVpc vpc;
        private final ISecurityGroup rdsSecurityGroup;
        private final IKey kmsKey;
        private final IKey rdsKmsKey;

        private DatabaseStackProps(StackProps stackProps, IVpc vpc, ISecurityGroup rdsSecurityGroup, IKey kmsKey, IKey rdsKmsKey) {
            this.stackProps = stackProps;
            this.vpc = vpc;
            this.rdsSecurityGroup = rdsSecurityGroup;
            this.kmsKey = kmsKey;
            this.rdsKmsKey = rdsKmsKey;
        }

        public static Builder builder() {
            return new Builder();
        }

        public StackProps getStackProps() { return stackProps; }
        public IVpc getVpc() { return vpc; }
        public ISecurityGroup getRdsSecurityGroup() { return rdsSecurityGroup; }
        public IKey getKmsKey() { return kmsKey; }
        public IKey getRdsKmsKey() { return rdsKmsKey; }

        public static class Builder {
            private StackProps stackProps;
            private IVpc vpc;
            private ISecurityGroup rdsSecurityGroup;
            private IKey kmsKey;
            private IKey rdsKmsKey;

            public Builder stackProps(StackProps stackProps) { this.stackProps = stackProps; return this; }
            public Builder vpc(IVpc vpc) { this.vpc = vpc; return this; }
            public Builder rdsSecurityGroup(ISecurityGroup rdsSecurityGroup) { this.rdsSecurityGroup = rdsSecurityGroup; return this; }
            public Builder kmsKey(IKey kmsKey) { this.kmsKey = kmsKey; return this; }
            public Builder rdsKmsKey(IKey rdsKmsKey) { this.rdsKmsKey = rdsKmsKey; return this; }

            public DatabaseStackProps build() {
                return new DatabaseStackProps(stackProps, vpc, rdsSecurityGroup, kmsKey, rdsKmsKey);
            }
        }
    }
}