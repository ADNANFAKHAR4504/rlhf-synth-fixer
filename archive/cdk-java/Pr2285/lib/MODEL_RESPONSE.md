# Comprehensive AWS CDK Java Security Infrastructure

I'll create a comprehensive CDK Java stack that demonstrates enterprise-grade security best practices across EC2, S3, IAM, RDS, and other AWS services. The solution will be region-agnostic and follow the principle of least privilege throughout.

## SecurityStack.java

```java
package app;

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.cloudtrail.ReadWriteType;
import software.amazon.awscdk.services.guardduty.CfnDetector;
import software.amazon.awscdk.services.securityhub.CfnHub;
import software.amazon.awscdk.services.config.*;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class SecurityStack extends Stack {

    private final Vpc vpc;
    private final Key ecsKmsKey;
    private final Key rdsKmsKey;
    private final Key s3KmsKey;
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup appSecurityGroup;
    private final SecurityGroup dbSecurityGroup;
    private final String environmentSuffix;

    public SecurityStack(final Construct scope, final String id, final StackProps props, final String environmentSuffix) {
        super(scope, id, props);
        
        this.environmentSuffix = environmentSuffix;

        // Apply standard tags to all resources
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Owner", "Platform-Team");
        Tags.of(this).add("Project", "SecureInfrastructure");
        Tags.of(this).add("CostCenter", "Engineering");

        // Create KMS keys for different services
        this.ecsKmsKey = createKmsKey("ECS-Key", "KMS key for ECS encryption");
        this.rdsKmsKey = createKmsKey("RDS-Key", "KMS key for RDS encryption");
        this.s3KmsKey = createKmsKey("S3-Key", "KMS key for S3 encryption");

        // Create VPC with security best practices
        this.vpc = createSecureVpc();

        // Create security groups
        this.webSecurityGroup = createWebSecurityGroup();
        this.appSecurityGroup = createAppSecurityGroup();
        this.dbSecurityGroup = createDbSecurityGroup();

        // Enable security services
        enableSecurityServices();

        // Create secure S3 bucket
        createSecureS3Bucket();

        // Create secure RDS instance
        createSecureRdsInstance();

        // Create secure EC2 instances
        createSecureEc2Instances();

        // Enable CloudTrail
        enableCloudTrail();
    }

    private Key createKmsKey(String keyId, String description) {
        return Key.Builder.create(this, keyId + "-" + environmentSuffix)
                .description(description)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();
    }

    private Vpc createSecureVpc() {
        Vpc vpc = Vpc.Builder.create(this, "SecureVpc-" + environmentSuffix)
                .maxAzs(3)
                .natGateways(2)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .name("Public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Private")
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("Database")
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .build();

        // Enable VPC Flow Logs
        LogGroup flowLogGroup = LogGroup.Builder.create(this, "VpcFlowLogs-" + environmentSuffix)
                .retention(RetentionDays.ONE_MONTH)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        Role flowLogRole = Role.Builder.create(this, "FlowLogRole-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("vpc-flow-logs.amazonaws.com"))
                .managedPolicies(List.of(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/VPCFlowLogsDeliveryRolePolicy")
                ))
                .build();

        FlowLog.Builder.create(this, "VpcFlowLog-" + environmentSuffix)
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .destination(FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole))
                .trafficType(FlowLogTrafficType.ALL)
                .build();

        return vpc;
    }

    private SecurityGroup createWebSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "WebSecurityGroup-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for web tier")
                .allowAllOutbound(false)
                .build();

        // Allow HTTPS inbound
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS traffic");
        
        // Allow outbound to app tier
        sg.addEgressRule(Peer.ipv4(vpc.getVpcCidrBlock()), Port.tcp(8080), "To app tier");
        
        // Allow outbound HTTPS for updates
        sg.addEgressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS outbound");

        return sg;
    }

    private SecurityGroup createAppSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "AppSecurityGroup-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for application tier")
                .allowAllOutbound(false)
                .build();

        // Allow inbound from web tier
        sg.addIngressRule(Peer.securityGroupId(webSecurityGroup.getSecurityGroupId()), 
                         Port.tcp(8080), "From web tier");
        
        // Allow outbound to database
        sg.addEgressRule(Peer.ipv4(vpc.getVpcCidrBlock()), Port.tcp(5432), "To database");
        
        // Allow outbound HTTPS for updates
        sg.addEgressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS outbound");

        return sg;
    }

    private SecurityGroup createDbSecurityGroup() {
        SecurityGroup sg = SecurityGroup.Builder.create(this, "DbSecurityGroup-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for database tier")
                .allowAllOutbound(false)
                .build();

        // Allow inbound from app tier
        sg.addIngressRule(Peer.securityGroupId(appSecurityGroup.getSecurityGroupId()), 
                         Port.tcp(5432), "From app tier");

        return sg;
    }

    private void enableSecurityServices() {
        // Enable GuardDuty
        CfnDetector.Builder.create(this, "GuardDutyDetector-" + environmentSuffix)
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .build();

        // Enable Security Hub
        CfnHub.Builder.create(this, "SecurityHub-" + environmentSuffix)
                .build();

        // Enable Config
        ConfigurationRecorder.Builder.create(this, "ConfigRecorder-" + environmentSuffix)
                .recordingGroup(RecordingGroup.builder()
                        .allSupported(true)
                        .includeGlobalResourceTypes(true)
                        .build())
                .build();
    }

    private void createSecureS3Bucket() {
        // Create access logging bucket first
        Bucket accessLogBucket = Bucket.Builder.create(this, "AccessLogBucket-" + environmentSuffix)
                .bucketName("secure-access-logs-" + environmentSuffix.toLowerCase() + "-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(false)
                .removalPolicy(RemovalPolicy.RETAIN)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .enabled(true)
                                .expiration(Duration.days(90))
                                .build()
                ))
                .build();

        // Create main secure bucket
        Bucket secureBucket = Bucket.Builder.create(this, "SecureBucket-" + environmentSuffix)
                .bucketName("secure-data-" + environmentSuffix.toLowerCase() + "-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .serverAccessLogsBucket(accessLogBucket)
                .serverAccessLogsPrefix("access-logs/")
                .removalPolicy(RemovalPolicy.RETAIN)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .enabled(true)
                                .noncurrentVersionExpiration(Duration.days(30))
                                .build()
                ))
                .build();

        // Add bucket policy for additional security
        secureBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(List.of(new AnyPrincipal()))
                .actions(List.of("s3:*"))
                .resources(List.of(
                        secureBucket.getBucketArn(),
                        secureBucket.getBucketArn() + "/*"
                ))
                .conditions(Map.of(
                        "Bool", Map.of("aws:SecureTransport", "false")
                ))
                .build());
    }

    private void createSecureRdsInstance() {
        // Create subnet group for database
        SubnetGroup subnetGroup = SubnetGroup.Builder.create(this, "DbSubnetGroup-" + environmentSuffix)
                .description("Subnet group for RDS database")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();

        // Create parameter group
        ParameterGroup parameterGroup = ParameterGroup.Builder.create(this, "DbParameterGroup-" + environmentSuffix)
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                        .version(PostgresEngineVersion.VER_15_4)
                        .build()))
                .parameters(Map.of(
                        "ssl", "1",
                        "log_statement", "all",
                        "log_min_duration_statement", "1000"
                ))
                .build();

        // Create RDS instance with security best practices
        DatabaseInstance.Builder.create(this, "SecureDatabase-" + environmentSuffix)
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                        .version(PostgresEngineVersion.VER_15_4)
                        .build()))
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .securityGroups(List.of(dbSecurityGroup))
                .subnetGroup(subnetGroup)
                .parameterGroup(parameterGroup)
                .storageEncrypted(true)
                .storageEncryptionKey(rdsKmsKey)
                .backupRetention(Duration.days(7))
                .deletionProtection(true)
                .multiAz(false) // Set to true for production
                .autoMinorVersionUpgrade(true)
                .deleteAutomatedBackups(false)
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();
    }

    private void createSecureEc2Instances() {
        // Create IAM role for EC2 instances
        Role ec2Role = Role.Builder.create(this, "EC2Role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(List.of(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .build();

        // Create instance profile
        CfnInstanceProfile instanceProfile = CfnInstanceProfile.Builder.create(this, "EC2InstanceProfile-" + environmentSuffix)
                .roles(List.of(ec2Role.getRoleName()))
                .build();

        // User data for secure configuration
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y amazon-ssm-agent",
                "systemctl enable amazon-ssm-agent",
                "systemctl start amazon-ssm-agent"
        );

        // Create launch template with security configurations
        LaunchTemplate launchTemplate = LaunchTemplate.Builder.create(this, "SecureLaunchTemplate-" + environmentSuffix)
                .machineImage(MachineImage.latestAmazonLinux2())
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .securityGroup(appSecurityGroup)
                .userData(userData)
                .role(ec2Role)
                .blockDevices(List.of(
                        BlockDevice.builder()
                                .deviceName("/dev/xvda")
                                .volume(BlockDeviceVolume.ebs(20, EbsDeviceOptions.builder()
                                        .encrypted(true)
                                        .kmsKey(ecsKmsKey)
                                        .volumeType(EbsDeviceVolumeType.GP3)
                                        .build()))
                                .build()
                ))
                .build();

        // Create web server instance
        Instance.Builder.create(this, "WebServer-" + environmentSuffix)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .launchTemplate(launchTemplate)
                .securityGroup(webSecurityGroup)
                .build();

        // Create app server instances
        for (int i = 1; i <= 2; i++) {
            Instance.Builder.create(this, "AppServer" + i + "-" + environmentSuffix)
                    .vpc(vpc)
                    .vpcSubnets(SubnetSelection.builder()
                            .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                            .build())
                    .launchTemplate(launchTemplate)
                    .securityGroup(appSecurityGroup)
                    .build();
        }
    }

    private void enableCloudTrail() {
        // Create S3 bucket for CloudTrail logs
        Bucket cloudTrailBucket = Bucket.Builder.create(this, "CloudTrailBucket-" + environmentSuffix)
                .bucketName("cloudtrail-logs-" + environmentSuffix.toLowerCase() + "-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.RETAIN)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .enabled(true)
                                .expiration(Duration.days(2555)) // 7 years retention
                                .build()
                ))
                .build();

        // Create CloudTrail
        Trail.Builder.create(this, "CloudTrail-" + environmentSuffix)
                .bucket(cloudTrailBucket)
                .includeGlobalServiceEvents(true)
                .isLogging(true)
                .isMultiRegionTrail(true)
                .enableFileValidation(true)
                .sendToCloudWatchLogs(true)
                .readWriteType(ReadWriteType.ALL)
                .build();
    }

    // Getter methods
    public Vpc getVpc() {
        return vpc;
    }

    public Key getEcsKmsKey() {
        return ecsKmsKey;
    }

    public Key getRdsKmsKey() {
        return rdsKmsKey;
    }

    public Key getS3KmsKey() {
        return s3KmsKey;
    }
}
```

## Main.java (Updated)

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

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

        // Create the security stack
        new SecurityStack(app, "SecurityStack" + environmentSuffix, 
                StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build(), 
                environmentSuffix);

        // Synthesize the CDK app
        app.synth();
    }
}
```

## Key Security Features Implemented

**1. Encryption Everywhere**
- Customer-managed KMS keys with automatic rotation
- Encrypted EBS volumes, RDS storage, and S3 buckets
- Separate keys for different service types

**2. Network Security**
- Multi-tier VPC with public, private, and isolated subnets
- Security groups with minimal required access
- VPC Flow Logs for network monitoring
- NAT Gateways for secure outbound access

**3. Identity and Access Management**
- IAM roles following principle of least privilege
- Systems Manager Session Manager for secure EC2 access
- Instance profiles with minimal required permissions

**4. Monitoring and Compliance**
- CloudTrail with log file validation
- GuardDuty for threat detection
- Security Hub for centralized security findings
- AWS Config for compliance monitoring

**5. Data Protection**
- S3 bucket policies enforcing HTTPS
- RDS with SSL/TLS enforcement
- Automated backups with retention policies
- Access logging for audit trails

**6. High Availability**
- Multi-AZ deployment architecture
- Automated backups and retention
- Deletion protection on critical resources

This infrastructure provides a secure, scalable foundation that can be deployed across regions while maintaining consistent security posture and compliance requirements.