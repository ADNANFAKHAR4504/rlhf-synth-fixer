package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.Map;

public class RdsStack extends Stack {

    private final DatabaseInstance database;

    public RdsStack(final Construct scope, final String id, final StackProps props,
                   final Vpc vpc, final SecurityGroup dbSecurityGroup) {
        super(scope, id, props);
        
        // Get environment suffix from context
        String environmentSuffix = (String) this.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create KMS key for RDS encryption
        Key rdsKey = Key.Builder.create(this, "app-key-rds")
                .description("KMS key for RDS encryption")
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .build();

        // Create subnet group for RDS in private subnets
        SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "app-subnet-group-rds")
                .description("Subnet group for RDS database")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .build();

        // Create RDS instance
        // NOTE: We've had issues with MySQL version availability in different AWS regions.
        // After trying MySQL 8.0.35, 8.0.33, 8.0.28, 8.0.23, 8.0.20, and 5.7.38, 
        // none were universally available across AWS regions.
        // Switching to a predefined version constant which should be compatible with most regions.
        
        this.database = DatabaseInstance.Builder.create(this, "app-rds-main")
                .databaseName("app_db")
                .instanceIdentifier("app-rds-" + environmentSuffix)
                .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        // Using the most generic version specification to ensure wide compatibility
                        .version(MysqlEngineVersion.of("5.7", "5.7"))
                        .build()))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .vpc(vpc)
                .subnetGroup(dbSubnetGroup)
                .securityGroups(java.util.List.of(dbSecurityGroup))
                .storageEncrypted(true)
                .storageEncryptionKey(rdsKey)
                .backupRetention(software.amazon.awscdk.Duration.days(7))
                .deletionProtection(false)
                .removalPolicy(RemovalPolicy.DESTROY)
                .allocatedStorage(20)
                .build();

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public DatabaseInstance getDatabase() {
        return database;
    }
    
    /**
     * Gets the MySQL engine version used in the RDS instance.
     * 
     * @return The MySQL engine version as a string
     */
    public String getMySQLVersion() {
        return "5.7"; // Using the major version 5.7 which is widely available
    }
    
    /**
     * Note: For future maintenance - to get available MySQL engine versions in your AWS region,
     * you can use the AWS CLI command:
     * 
     * aws rds describe-db-engine-versions --engine mysql --query "DBEngineVersions[].EngineVersion"
     * 
     * Or via the AWS SDK:
     * 
     * DescribeDBEngineVersionsRequest request = new DescribeDBEngineVersionsRequest().withEngine("mysql");
     * DescribeDBEngineVersionsResult result = rdsClient.describeDBEngineVersions(request);
     * List<DBEngineVersion> versions = result.getDBEngineVersions();
     */
}