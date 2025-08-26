package app.stacks;

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.ISecurityGroup;
import software.amazon.awscdk.services.ec2.IVpc;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.kms.IKey;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.IDatabaseInstance;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.secretsmanager.ISecret;
import software.amazon.awscdk.services.secretsmanager.Secret;
import software.amazon.awscdk.services.secretsmanager.SecretStringGenerator;
import software.constructs.Construct;

import java.util.List;

public final class DatabaseStack extends Stack {
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
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.SMALL))
                .vpc(props.getVpc())
                .subnetGroup(dbSubnetGroup)
                .securityGroups(List.of(props.getRdsSecurityGroup()))
                .credentials(Credentials.fromSecret(databaseSecret))
                .multiAz(true)
                .storageEncrypted(true)
                .storageEncryptionKey(props.getRdsKmsKey())
                .backupRetention(Duration.days(7))
                .deleteAutomatedBackups(true)
                .deletionProtection(false) // Set to true for production
                .databaseName("webapp")
                .allocatedStorage(20)
                .maxAllocatedStorage(100)
                .monitoringInterval(Duration.seconds(60))
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

    public static final class DatabaseStackProps {
        private final StackProps stackProps;
        private final IVpc vpc;
        private final ISecurityGroup rdsSecurityGroup;
        private final IKey kmsKey;
        private final IKey rdsKmsKey;

        private DatabaseStackProps(final StackProps stackProps, final IVpc vpc, 
                                 final ISecurityGroup rdsSecurityGroup, final IKey kmsKey, 
                                 final IKey rdsKmsKey) {
            this.stackProps = stackProps;
            this.vpc = vpc;
            this.rdsSecurityGroup = rdsSecurityGroup;
            this.kmsKey = kmsKey;
            this.rdsKmsKey = rdsKmsKey;
        }

        public static Builder builder() {
            return new Builder();
        }

        public StackProps getStackProps() { 
            return stackProps; 
        }
        
        public IVpc getVpc() { 
            return vpc; 
        }
        
        public ISecurityGroup getRdsSecurityGroup() { 
            return rdsSecurityGroup; 
        }
        
        public IKey getKmsKey() { 
            return kmsKey; 
        }
        
        public IKey getRdsKmsKey() { 
            return rdsKmsKey; 
        }

        public static final class Builder {
            private StackProps stackProps;
            private IVpc vpc;
            private ISecurityGroup rdsSecurityGroup;
            private IKey kmsKey;
            private IKey rdsKmsKey;

            public Builder stackProps(final StackProps stackProps) { 
                this.stackProps = stackProps; 
                return this; 
            }
            
            public Builder vpc(final IVpc vpc) { 
                this.vpc = vpc; 
                return this; 
            }
            
            public Builder rdsSecurityGroup(final ISecurityGroup rdsSecurityGroup) { 
                this.rdsSecurityGroup = rdsSecurityGroup; 
                return this; 
            }
            
            public Builder kmsKey(final IKey kmsKey) { 
                this.kmsKey = kmsKey; 
                return this; 
            }
            
            public Builder rdsKmsKey(final IKey rdsKmsKey) { 
                this.rdsKmsKey = rdsKmsKey; 
                return this; 
            }

            public DatabaseStackProps build() {
                return new DatabaseStackProps(stackProps, vpc, rdsSecurityGroup, kmsKey, rdsKmsKey);
            }
        }
    }
}