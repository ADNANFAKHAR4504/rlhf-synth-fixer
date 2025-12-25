package app;

import java.util.List;
import java.util.Map;

import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.ec2.BlockDevice;
import software.amazon.awscdk.services.ec2.BlockDeviceVolume;
import software.amazon.awscdk.services.ec2.EbsDeviceOptions;
import software.amazon.awscdk.services.ec2.EbsDeviceVolumeType;
import software.amazon.awscdk.services.ec2.FlowLog;
import software.amazon.awscdk.services.ec2.FlowLogDestination;
import software.amazon.awscdk.services.ec2.FlowLogResourceType;
import software.amazon.awscdk.services.ec2.FlowLogTrafficType;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.iam.CfnInstanceProfile;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.kms.KeySpec;
import software.amazon.awscdk.services.kms.KeyUsage;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.ParameterGroup;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.PostgresInstanceEngineProps;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.constructs.Construct;

public class SecurityStack extends Stack {

    private final Vpc vpc;
    private final Key ecsKmsKey;
    private final Key rdsKmsKey;
    private final Key s3KmsKey;
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup appSecurityGroup;
    private final SecurityGroup dbSecurityGroup;
    private final String environmentSuffix;

    public SecurityStack(final Construct scope, final String id, final StackProps props, final String envSuffix) {
        super(scope, id, props);

        System.err.println("SecurityStack: Initializing with suffix: " + envSuffix);
        this.environmentSuffix = envSuffix;

        // Apply standard tags to all resources
        System.err.println("SecurityStack: Adding tags...");
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

        // Security services (GuardDuty, Security Hub) can be enabled separately
        // if needed for production environments

        // Create secure S3 bucket
        createSecureS3Bucket();

        // Create secure RDS instance
        createSecureRdsInstance();

        // Create secure EC2 instances
        createSecureEc2Instances();

        // Enable CloudTrail
        enableCloudTrail();

        // Outputs for deployment verification
        CfnOutput.Builder.create(this, "VpcIdOutput")
                .value(vpc.getVpcId())
                .description("VPC ID")
                .exportName("VpcId-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "S3KeyArnOutput")
                .value(s3KmsKey.getKeyArn())
                .description("S3 KMS Key ARN")
                .exportName("S3KeyArn-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "EcsKeyArnOutput")
                .value(ecsKmsKey.getKeyArn())
                .description("ECS KMS Key ARN")
                .exportName("EcsKeyArn-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "EnvironmentOutput")
                .value(environmentSuffix)
                .description("Environment Suffix")
                .exportName("Environment-" + environmentSuffix)
                .build();
    }

    private Key createKmsKey(final String keyId, final String description) {
        return Key.Builder.create(this, keyId + "-" + environmentSuffix)
                .description(description)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .keyUsage(KeyUsage.ENCRYPT_DECRYPT)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
    }

    private Vpc createSecureVpc() {
        Vpc localVpc = Vpc.Builder.create(this, "SecureVpc-" + environmentSuffix)
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
                                .build()))
                .build();

        // Enable VPC Flow Logs
        LogGroup flowLogGroup = LogGroup.Builder.create(this, "VpcFlowLogs-" + environmentSuffix)
                .retention(RetentionDays.ONE_MONTH)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        Role flowLogRole = Role.Builder.create(this, "FlowLogRole-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("vpc-flow-logs.amazonaws.com"))
                .inlinePolicies(Map.of(
                        "FlowLogsDeliveryPolicy", PolicyDocument.Builder.create()
                                .statements(List.of(
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(List.of(
                                                        "logs:CreateLogGroup",
                                                        "logs:CreateLogStream",
                                                        "logs:PutLogEvents",
                                                        "logs:DescribeLogGroups",
                                                        "logs:DescribeLogStreams"))
                                                .resources(List.of("*"))
                                                .build()))
                                .build()))
                .build();

        FlowLog.Builder.create(this, "VpcFlowLog-" + environmentSuffix)
                .resourceType(FlowLogResourceType.fromVpc(localVpc))
                .destination(FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole))
                .trafficType(FlowLogTrafficType.ALL)
                .build();

        return localVpc;
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

    private void createSecureS3Bucket() {
        // Create access logging bucket first
        Bucket accessLogBucket = Bucket.Builder.create(this, "AccessLogBucket-" + environmentSuffix)
                .bucketName("secure-access-logs-" + environmentSuffix.toLowerCase())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(false)
                .removalPolicy(RemovalPolicy.DESTROY)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .enabled(true)
                                .expiration(Duration.days(90))
                                .build()))
                .build();

        // Create main secure bucket
        Bucket secureBucket = Bucket.Builder.create(this, "SecureBucket-" + environmentSuffix)
                .bucketName("secure-data-" + environmentSuffix.toLowerCase())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .serverAccessLogsBucket(accessLogBucket)
                .serverAccessLogsPrefix("access-logs/")
                .removalPolicy(RemovalPolicy.DESTROY)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .enabled(true)
                                .noncurrentVersionExpiration(Duration.days(30))
                                .build()))
                .build();

        // Add bucket policy for additional security
        secureBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(List.of(new AnyPrincipal()))
                .actions(List.of("s3:*"))
                .resources(List.of(
                        secureBucket.getBucketArn(),
                        secureBucket.getBucketArn() + "/*"))
                .conditions(Map.of(
                        "Bool", Map.of("aws:SecureTransport", "false")))
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
                        .version(PostgresEngineVersion.VER_14_13)
                        .build()))
                .parameters(Map.of(
                        "ssl", "1",
                        "log_statement", "all",
                        "log_min_duration_statement", "1000"))
                .build();

        // Create RDS instance with security best practices
        DatabaseInstance.Builder.create(this, "SecureDatabase-" + environmentSuffix)
                .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                        .version(PostgresEngineVersion.VER_14_13)
                        .build()))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
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
                .deletionProtection(false)
                .multiAz(false) // Set to true for production
                .autoMinorVersionUpgrade(true)
                .deleteAutomatedBackups(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
    }

    private void createSecureEc2Instances() {
        // Create IAM role for EC2 instances
        Role ec2Role = Role.Builder.create(this, "EC2Role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(List.of(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
                .build();

        // Create instance profile (not directly used but required for EC2 instances)
        CfnInstanceProfile.Builder
                .create(this, "EC2InstanceProfile-" + environmentSuffix)
                .roles(List.of(ec2Role.getRoleName()))
                .build();

        // User data for secure configuration
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y amazon-ssm-agent",
                "systemctl enable amazon-ssm-agent",
                "systemctl start amazon-ssm-agent");

        // Launch template configuration is not needed as we configure directly in
        // instances

        // Create web server instance
        Instance.Builder.create(this, "WebServer-" + environmentSuffix)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .machineImage(MachineImage.latestAmazonLinux2())
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .role(ec2Role)
                .userData(userData)
                .blockDevices(List.of(
                        BlockDevice.builder()
                                .deviceName("/dev/xvda")
                                .volume(BlockDeviceVolume.ebs(20, EbsDeviceOptions.builder()
                                        .encrypted(true)
                                        .kmsKey(ecsKmsKey)
                                        .volumeType(EbsDeviceVolumeType.GP3)
                                        .build()))
                                .build()))
                .securityGroup(webSecurityGroup)
                .build();

        // Create app server instances
        for (int i = 1; i <= 2; i++) {
            Instance.Builder.create(this, "AppServer" + i + "-" + environmentSuffix)
                    .vpc(vpc)
                    .vpcSubnets(SubnetSelection.builder()
                            .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                            .build())
                    .machineImage(MachineImage.latestAmazonLinux2())
                    .instanceType(
                            software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                    .role(ec2Role)
                    .userData(userData)
                    .blockDevices(List.of(
                            BlockDevice.builder()
                                    .deviceName("/dev/xvda")
                                    .volume(BlockDeviceVolume.ebs(20, EbsDeviceOptions.builder()
                                            .encrypted(true)
                                            .kmsKey(ecsKmsKey)
                                            .volumeType(EbsDeviceVolumeType.GP3)
                                            .build()))
                                    .build()))
                    .securityGroup(appSecurityGroup)
                    .build();
        }
    }

    private void enableCloudTrail() {
        // Create S3 bucket for CloudTrail logs
        Bucket cloudTrailBucket = Bucket.Builder.create(this, "CloudTrailBucket-" + environmentSuffix)
                .bucketName("cloudtrail-logs-" + environmentSuffix.toLowerCase())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .autoDeleteObjects(true)
                .lifecycleRules(List.of(
                        LifecycleRule.builder()
                                .enabled(true)
                                .expiration(Duration.days(2555)) // 7 years retention
                                .build()))
                .build();

        // Create CloudTrail
        Trail.Builder.create(this, "CloudTrail-" + environmentSuffix)
                .bucket(cloudTrailBucket)
                .includeGlobalServiceEvents(true)
                // Logging is enabled by default
                .isMultiRegionTrail(true)
                .enableFileValidation(true)
                .sendToCloudWatchLogs(true)
                // readWriteType is configured via events selection
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