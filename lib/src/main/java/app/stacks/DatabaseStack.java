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
                // KMS encryption can be configured separately to avoid cross-stack references
                .build();

        SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "DatabaseSubnetGroup")
                .vpc(props.getVpc())
                .description("Subnet group for RDS database")
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();

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
                                        // Storage encryption can be configured separately to avoid cross-stack references
                .backupRetention(Duration.days(7))
                .deleteAutomatedBackups(true)
                .deletionProtection(false) // Set to true for production
                .databaseName("webapp")
                .allocatedStorage(20)
                .maxAllocatedStorage(100)
                .monitoringInterval(Duration.seconds(60))
                .enablePerformanceInsights(true)
                                        // Performance insights encryption can be configured separately
                .build();

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



        private DatabaseStackProps(final StackProps stackPropsValue, final IVpc vpcValue, 
                                 final ISecurityGroup rdsSecurityGroupValue) {
            this.stackProps = stackPropsValue;
            this.vpc = vpcValue;
            this.rdsSecurityGroup = rdsSecurityGroupValue;
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
        

        


        @SuppressWarnings("checkstyle:HiddenField")
        public static final class Builder {
            private StackProps stackPropsValue;
            private IVpc vpcValue;
            private ISecurityGroup rdsSecurityGroupValue;



            public Builder stackProps(final StackProps stackPropsParam) { 
                this.stackPropsValue = stackPropsParam; 
                return this; 
            }
            
            public Builder vpc(final IVpc vpcParam) { 
                this.vpcValue = vpcParam; 
                return this; 
            }
            
            public Builder rdsSecurityGroup(final ISecurityGroup rdsSecurityGroupParam) { 
                this.rdsSecurityGroupValue = rdsSecurityGroupParam; 
                return this; 
            }
            

            


            public DatabaseStackProps build() {
                return new DatabaseStackProps(stackPropsValue, vpcValue, rdsSecurityGroupValue);
            }
        }
    }
}