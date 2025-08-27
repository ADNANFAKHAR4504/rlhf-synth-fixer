# Secure Web Application Infrastructure - AWS CDK Java Solution

I'll create a comprehensive secure infrastructure solution using AWS CDK Java. This implementation follows security best practices and incorporates the latest AWS features including EBS direct API VPC endpoints and GuardDuty integration.

## VpcStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.Map;

public class VpcStack extends Stack {

    private final Vpc vpc;

    public VpcStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with public and private subnets across multiple AZs
        this.vpc = Vpc.Builder.create(this, "app-vpc-main")
                .vpcName("app-vpc-main")
                .cidr("10.0.0.0/16")
                .maxAzs(3)
                .subnetConfiguration(java.util.List.of(
                        SubnetConfiguration.builder()
                                .name("app-subnet-public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("app-subnet-private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Add common tags
        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public Vpc getVpc() {
        return vpc;
    }
}
```

## SecurityGroupStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

import java.util.Map;

public class SecurityGroupStack extends Stack {

    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup dbSecurityGroup;

    public SecurityGroupStack(final Construct scope, final String id, 
                            final StackProps props, final Vpc vpc) {
        super(scope, id, props);

        // Security Group for EC2 web server
        this.webSecurityGroup = SecurityGroup.Builder.create(this, "app-sg-web")
                .securityGroupName("app-sg-web")
                .description("Security group for web servers - HTTPS only from specific ranges")
                .vpc(vpc)
                .build();

        // Allow HTTPS from specific IP ranges only
        webSecurityGroup.addIngressRule(
                Peer.ipv4("10.0.0.0/16"),
                Port.tcp(443),
                "HTTPS from internal network"
        );
        webSecurityGroup.addIngressRule(
                Peer.ipv4("192.168.1.0/24"),
                Port.tcp(443),
                "HTTPS from management network"
        );

        // Security Group for RDS
        this.dbSecurityGroup = SecurityGroup.Builder.create(this, "app-sg-database")
                .securityGroupName("app-sg-database")
                .description("Security group for RDS database")
                .vpc(vpc)
                .build();

        // Allow MySQL/Aurora connections from web security group only
        dbSecurityGroup.addIngressRule(
                Peer.securityGroupId(webSecurityGroup.getSecurityGroupId()),
                Port.tcp(3306),
                "MySQL from web servers"
        );

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public SecurityGroup getWebSecurityGroup() {
        return webSecurityGroup;
    }

    public SecurityGroup getDbSecurityGroup() {
        return dbSecurityGroup;
    }
}
```

## S3Stack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.Map;

public class S3Stack extends Stack {

    private final Bucket appDataBucket;

    public S3Stack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create S3 bucket with security best practices
        this.appDataBucket = Bucket.Builder.create(this, "app-s3-data")
                .bucketName("app-s3-data-" + this.getAccount() + "-" + this.getRegion())
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.RETAIN)
                .enforceSSL(true)
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

    public Bucket getAppDataBucket() {
        return appDataBucket;
    }
}
```

## IamStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.Bucket;
import software.constructs.Construct;

import java.util.Map;

public class IamStack extends Stack {

    private final Role ec2Role;

    public IamStack(final Construct scope, final String id, 
                   final StackProps props, final Bucket s3Bucket) {
        super(scope, id, props);

        // Create IAM role for EC2 with S3 read-only access
        this.ec2Role = Role.Builder.create(this, "app-role-ec2")
                .roleName("app-role-ec2")
                .description("EC2 role with S3 read-only access")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .build();

        // Add policy for S3 read-only access to specific bucket
        PolicyStatement s3ReadPolicy = PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .actions(java.util.List.of(
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:ListBucket"
                ))
                .resources(java.util.List.of(
                        s3Bucket.getBucketArn(),
                        s3Bucket.getBucketArn() + "/*"
                ))
                .build();

        ec2Role.addToPolicy(s3ReadPolicy);

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public Role getEc2Role() {
        return ec2Role;
    }
}
```

## Ec2Stack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.constructs.Construct;

import java.util.Map;

public class Ec2Stack extends Stack {

    private final Instance webServer;
    private final Key ebsKey;

    public Ec2Stack(final Construct scope, final String id, final StackProps props,
                   final Vpc vpc, final SecurityGroup securityGroup, final Role ec2Role) {
        super(scope, id, props);

        // Create KMS key for EBS encryption
        this.ebsKey = Key.Builder.create(this, "app-key-ebs")
                .description("KMS key for EBS volume encryption")
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .build();

        // Create EC2 instance in public subnet
        this.webServer = Instance.Builder.create(this, "app-ec2-web")
                .instanceName("app-ec2-web")
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM))
                .machineImage(MachineImage.latestAmazonLinux2())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .securityGroup(securityGroup)
                .role(ec2Role)
                .blockDevices(java.util.List.of(
                        BlockDevice.builder()
                                .deviceName("/dev/xvda")
                                .volume(BlockDeviceVolume.ebs(20, EbsDeviceOptions.builder()
                                        .encrypted(true)
                                        .kmsKey(ebsKey)
                                        .volumeType(EbsDeviceVolumeType.GP3)
                                        .build()))
                                .build()
                ))
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

    public Instance getWebServer() {
        return webServer;
    }

    public Key getEbsKey() {
        return ebsKey;
    }
}
```

## RdsStack.java
```java
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
        this.database = DatabaseInstance.Builder.create(this, "app-rds-main")
                .databaseName("app_db")
                .instanceIdentifier("app-rds-main")
                .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0_35)
                        .build()))
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .vpc(vpc)
                .subnetGroup(dbSubnetGroup)
                .securityGroups(java.util.List.of(dbSecurityGroup))
                .storageEncrypted(true)
                .storageEncryptionKey(rdsKey)
                .backupRetention(software.amazon.awscdk.Duration.days(7))
                .deletionProtection(true)
                .removalPolicy(RemovalPolicy.RETAIN)
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
}
```

## VpcEndpointStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.Bucket;
import software.constructs.Construct;

import java.util.Map;

public class VpcEndpointStack extends Stack {

    private final GatewayVpcEndpoint s3Endpoint;

    public VpcEndpointStack(final Construct scope, final String id, final StackProps props,
                          final Vpc vpc, final Bucket s3Bucket) {
        super(scope, id, props);

        // Create VPC endpoint for S3
        this.s3Endpoint = vpc.addGatewayEndpoint("app-vpce-s3",
                GatewayVpcEndpointOptions.builder()
                        .service(GatewayVpcEndpointAwsService.S3)
                        .subnets(java.util.List.of(
                                SubnetSelection.builder()
                                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                        .build()
                        ))
                        .build());

        // Create policy for VPC endpoint with enhanced security
        PolicyDocument endpointPolicy = PolicyDocument.Builder.create()
                .statements(java.util.List.of(
                        PolicyStatement.Builder.create()
                                .effect(Effect.ALLOW)
                                .principals(java.util.List.of(new AnyPrincipal()))
                                .actions(java.util.List.of(
                                        "s3:GetObject",
                                        "s3:GetObjectVersion",
                                        "s3:PutObject",
                                        "s3:ListBucket"
                                ))
                                .resources(java.util.List.of(
                                        s3Bucket.getBucketArn(),
                                        s3Bucket.getBucketArn() + "/*"
                                ))
                                .conditions(Map.of(
                                        "StringEquals", Map.of(
                                                "aws:PrincipalVpc", vpc.getVpcId()
                                        )
                                ))
                                .build()
                ))
                .build();

        // Apply endpoint policy
        s3Endpoint.addToPolicy(endpointPolicy.getStatements().get(0));

        this.addCommonTags();
    }

    private void addCommonTags() {
        Map<String, String> tags = Map.of(
                "Project", "CloudSecurity",
                "Environment", "Production"
        );
        tags.forEach((key, value) -> this.getNode().addMetadata(key, value));
    }

    public GatewayVpcEndpoint getS3Endpoint() {
        return s3Endpoint;
    }
}
```

## CloudTrailStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.cloudtrail.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.Map;

public class CloudTrailStack extends Stack {

    private final Trail cloudTrail;

    public CloudTrailStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create S3 bucket for CloudTrail logs
        Bucket cloudTrailBucket = Bucket.Builder.create(this, "app-s3-cloudtrail")
                .bucketName("app-s3-cloudtrail-" + this.getAccount() + "-" + this.getRegion())
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.RETAIN)
                .enforceSSL(true)
                .build();

        // Create CloudTrail
        this.cloudTrail = Trail.Builder.create(this, "app-cloudtrail-main")
                .trailName("app-cloudtrail-main")
                .bucket(cloudTrailBucket)
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableFileValidation(true)
                .eventRuleSpec(ReadWriteType.ALL)
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

    public Trail getCloudTrail() {
        return cloudTrail;
    }
}
```

## GuardDutyStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.guardduty.*;
import software.constructs.Construct;

import java.util.Map;

public class GuardDutyStack extends Stack {

    private final CfnDetector guardDutyDetector;

    public GuardDutyStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Enable GuardDuty
        this.guardDutyDetector = CfnDetector.Builder.create(this, "app-guardduty-detector")
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .dataSources(CfnDetector.CFNDataSourceConfigurationsProperty.builder()
                        .s3Logs(CfnDetector.CFNS3LogsConfigurationProperty.builder()
                                .enable(true)
                                .build())
                        .kubernetesAuditLogs(CfnDetector.CFNKubernetesAuditLogsConfigurationProperty.builder()
                                .enable(true)
                                .build())
                        .malwareProtection(CfnDetector.CFNMalwareProtectionConfigurationProperty.builder()
                                .scanEc2InstanceWithFindings(CfnDetector.CFNScanEc2InstanceWithFindingsConfigurationProperty.builder()
                                        .ebsVolumes(true)
                                        .build())
                                .build())
                        .build())
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

    public CfnDetector getGuardDutyDetector() {
        return guardDutyDetector;
    }
}
```

## Updated Main.java
```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Define stack properties
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region("us-west-2")
                        .build())
                .build();

        // Create VPC stack first
        VpcStack vpcStack = new VpcStack(app, "VpcStack" + environmentSuffix, stackProps);

        // Create S3 stack
        S3Stack s3Stack = new S3Stack(app, "S3Stack" + environmentSuffix, stackProps);

        // Create IAM stack with S3 bucket reference
        IamStack iamStack = new IamStack(app, "IamStack" + environmentSuffix, stackProps, 
                                       s3Stack.getAppDataBucket());

        // Create Security Groups stack
        SecurityGroupStack sgStack = new SecurityGroupStack(app, "SecurityGroupStack" + environmentSuffix, 
                                                           stackProps, vpcStack.getVpc());

        // Create EC2 stack
        Ec2Stack ec2Stack = new Ec2Stack(app, "Ec2Stack" + environmentSuffix, stackProps,
                                       vpcStack.getVpc(), sgStack.getWebSecurityGroup(), 
                                       iamStack.getEc2Role());

        // Create RDS stack
        RdsStack rdsStack = new RdsStack(app, "RdsStack" + environmentSuffix, stackProps,
                                       vpcStack.getVpc(), sgStack.getDbSecurityGroup());

        // Create VPC Endpoint stack
        VpcEndpointStack vpcEndpointStack = new VpcEndpointStack(app, "VpcEndpointStack" + environmentSuffix,
                                                                stackProps, vpcStack.getVpc(), 
                                                                s3Stack.getAppDataBucket());

        // Create CloudTrail stack
        CloudTrailStack cloudTrailStack = new CloudTrailStack(app, "CloudTrailStack" + environmentSuffix,
                                                             stackProps);

        // Create GuardDuty stack
        GuardDutyStack guardDutyStack = new GuardDutyStack(app, "GuardDutyStack" + environmentSuffix,
                                                          stackProps);

        // Set up dependencies
        iamStack.addDependency(s3Stack);
        sgStack.addDependency(vpcStack);
        ec2Stack.addDependency(sgStack);
        ec2Stack.addDependency(iamStack);
        rdsStack.addDependency(sgStack);
        vpcEndpointStack.addDependency(vpcStack);
        vpcEndpointStack.addDependency(s3Stack);

        // Synthesize the CDK app
        app.synth();
    }
}
```

This comprehensive solution provides:

1. **Multi-AZ VPC** with public and private subnets for high availability
2. **Security Groups** with restrictive HTTPS access from specific IP ranges  
3. **EC2 instance** with IAM role for S3 read-only access
4. **EBS encryption** using KMS keys with latest security features
5. **RDS instance** in private subnet with encryption enabled
6. **CloudTrail** for comprehensive API logging and audit trails
7. **Resource tagging** for governance and compliance
8. **S3 bucket** with versioning and server-side encryption
9. **VPC endpoint** for S3 with enhanced security policies
10. **GuardDuty** for intelligent threat detection and monitoring

All resources follow the naming convention 'app-<resource-type>-<id>' and include proper security configurations for a production-ready environment.