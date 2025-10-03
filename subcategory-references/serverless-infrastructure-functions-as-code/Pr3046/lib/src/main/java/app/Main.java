package app;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.apigateway.LambdaRestApi;
import software.amazon.awscdk.services.apigateway.RestApi;
import software.amazon.awscdk.services.cloudfront.Distribution;
import software.amazon.awscdk.services.cloudfront.ViewerProtocolPolicy;
import software.amazon.awscdk.services.cloudfront.origins.S3Origin;
import software.amazon.awscdk.services.cloudtrail.Trail;
import software.amazon.awscdk.services.config.CfnConfigurationRecorder;
import software.amazon.awscdk.services.config.CfnDeliveryChannel;
import software.amazon.awscdk.services.ec2.AmazonLinuxCpuType;
import software.amazon.awscdk.services.ec2.AmazonLinuxEdition;
import software.amazon.awscdk.services.ec2.AmazonLinuxGeneration;
import software.amazon.awscdk.services.ec2.AmazonLinuxImageProps;
import software.amazon.awscdk.services.ec2.AmazonLinuxVirt;
import software.amazon.awscdk.services.ec2.FlowLog;
import software.amazon.awscdk.services.ec2.FlowLogDestination;
import software.amazon.awscdk.services.ec2.FlowLogResourceType;
import software.amazon.awscdk.services.ec2.IMachineImage;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.guardduty.CfnDetector;
import software.amazon.awscdk.services.iam.AccountRootPrincipal;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.kms.Alias;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.MariaDbEngineVersion;
import software.amazon.awscdk.services.rds.MariaDbInstanceEngineProps;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.wafv2.CfnIPSet;
import software.amazon.awscdk.services.wafv2.CfnWebACL;
import software.constructs.Construct;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;
    private final List<String> allowedIpAddresses;

    private TapStackProps(final String envSuffix, final StackProps props, final List<String> allowedIps) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
        this.allowedIpAddresses = allowedIps != null ? allowedIps : Arrays.asList("203.0.113.0/32");
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public List<String> getAllowedIpAddresses() {
        return allowedIpAddresses;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;
        private List<String> allowedIpAddresses;

        public Builder environmentSuffix(final String suffix) {
            this.environmentSuffix = suffix;
            return this;
        }

        public Builder stackProps(final StackProps props) {
            this.stackProps = props;
            return this;
        }

        public Builder allowedIpAddresses(final List<String> ips) {
            this.allowedIpAddresses = ips;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps, allowedIpAddresses);
        }
    }
}

/**
 * Security Infrastructure Stack
 * 
 * Creates comprehensive security infrastructure including KMS, IAM, GuardDuty,
 * CloudTrail, Config, and WAF components.
 */
class SecurityStack extends Stack {
    private final Key kmsKey;
    private final CfnDetector guardDutyDetector;
    private final Trail cloudTrail;
    private final CfnWebACL webAcl;
    private final LogGroup securityLogGroup;

    SecurityStack(final Construct scope, final String id, final String environmentSuffix,
            final List<String> allowedIpAddresses, final StackProps props) {
        super(scope, id, props);

        // Create KMS Key for encryption at rest
        this.kmsKey = Key.Builder.create(this, "SecurityKmsKey")
                .description("KMS key for encryption at rest - " + environmentSuffix)
                .enableKeyRotation(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .policy(PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                // Allow CloudTrail to use the KMS key
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                                        .actions(Arrays.asList(
                                                "kms:Decrypt",
                                                "kms:GenerateDataKey"))
                                        .resources(Arrays.asList("*"))
                                        .build(),
                                // Allow root account full access
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new AccountRootPrincipal()))
                                        .actions(Arrays.asList("kms:*"))
                                        .resources(Arrays.asList("*"))
                                        .build()))
                        .build())
                .build();

        Alias.Builder.create(this, "SecurityKmsKeyAlias")
                .aliasName("alias/tap-" + environmentSuffix + "-security-key")
                .targetKey(kmsKey)
                .build();

        // Create Security Log Group with 365 days retention
        this.securityLogGroup = LogGroup.Builder.create(this, "SecurityLogGroup")
                .logGroupName("/aws/security/tap-" + environmentSuffix)
                .retention(RetentionDays.ONE_YEAR)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Enable GuardDuty
        this.guardDutyDetector = CfnDetector.Builder.create(this, "GuardDutyDetector")
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .dataSources(CfnDetector.CFNDataSourceConfigurationsProperty.builder()
                        .s3Logs(CfnDetector.CFNS3LogsConfigurationProperty.builder()
                                .enable(true)
                                .build())
                        .malwareProtection(CfnDetector.CFNMalwareProtectionConfigurationProperty.builder()
                                .scanEc2InstanceWithFindings(CfnDetector.CFNScanEc2InstanceWithFindingsConfigurationProperty.builder()
                                        .ebsVolumes(true)
                                        .build())
                                .build())
                        .build())
                .build();

        // Create S3 bucket for CloudTrail logs
        Bucket cloudTrailBucket = Bucket.Builder.create(this, "CloudTrailBucket")
                .bucketName("tap-" + environmentSuffix + "-cloudtrail-logs-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add CloudTrail bucket policy
        cloudTrailBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                .actions(Arrays.asList("s3:GetBucketAcl"))
                .resources(Arrays.asList(cloudTrailBucket.getBucketArn()))
                .build());

        cloudTrailBucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.ALLOW)
                .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                .actions(Arrays.asList("s3:PutObject"))
                .resources(Arrays.asList(cloudTrailBucket.getBucketArn() + "/*"))
                .conditions(Map.of("StringEquals", 
                    Map.of("s3:x-amz-acl", "bucket-owner-full-control")))
                .build());

        // Create CloudTrail
        this.cloudTrail = Trail.Builder.create(this, "SecurityCloudTrail")
                .trailName("tap-" + environmentSuffix + "-security-trail")
                .bucket(cloudTrailBucket)
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableFileValidation(true)
                .encryptionKey(kmsKey)
                .sendToCloudWatchLogs(true)
                .cloudWatchLogGroup(securityLogGroup)
                .cloudWatchLogsRetention(RetentionDays.ONE_YEAR)
                .build();

        // Create IP Set for WAF
        CfnIPSet ipSet = CfnIPSet.Builder.create(this, "AllowedIPSet")
                .name("tap-" + environmentSuffix + "-allowed-ips")
                .scope("REGIONAL")
                .ipAddressVersion("IPV4")
                .addresses(allowedIpAddresses)
                .description("Allowed IP addresses for API access")
                .build();

        // Create WAF Web ACL
        this.webAcl = CfnWebACL.Builder.create(this, "ApiWebACL")
                .name("tap-" + environmentSuffix + "-api-waf")
                .scope("REGIONAL")
                .defaultAction(CfnWebACL.DefaultActionProperty.builder()
                        .block(CfnWebACL.BlockActionProperty.builder().build())
                        .build())
                .rules(Arrays.asList(
                        CfnWebACL.RuleProperty.builder()
                                .name("AllowSpecificIPs")
                                .priority(1)
                                .action(CfnWebACL.RuleActionProperty.builder()
                                        .allow(CfnWebACL.AllowActionProperty.builder().build())
                                        .build())
                                .statement(CfnWebACL.StatementProperty.builder()
                                        .ipSetReferenceStatement(CfnWebACL.IPSetReferenceStatementProperty.builder()
                                                .arn(ipSet.getAttrArn())
                                                .build())
                                        .build())
                                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                                        .sampledRequestsEnabled(true)
                                        .cloudWatchMetricsEnabled(true)
                                        .metricName("AllowSpecificIPs")
                                        .build())
                                .build(),
                        CfnWebACL.RuleProperty.builder()
                                .name("AWSManagedRulesCommonRuleSet")
                                .priority(2)
                                .overrideAction(CfnWebACL.OverrideActionProperty.builder()
                                        .none(Map.of())
                                        .build())
                                .statement(CfnWebACL.StatementProperty.builder()
                                        .managedRuleGroupStatement(CfnWebACL.ManagedRuleGroupStatementProperty.builder()
                                                .vendorName("AWS")
                                                .name("AWSManagedRulesCommonRuleSet")
                                                .build())
                                        .build())
                                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                                        .sampledRequestsEnabled(true)
                                        .cloudWatchMetricsEnabled(true)
                                        .metricName("CommonRuleSetMetric")
                                        .build())
                                .build()))
                .visibilityConfig(CfnWebACL.VisibilityConfigProperty.builder()
                        .sampledRequestsEnabled(true)
                        .cloudWatchMetricsEnabled(true)
                        .metricName("tap-" + environmentSuffix + "-waf")
                        .build())
                .build();

        // Setup AWS Config
        setupAwsConfig(environmentSuffix);

        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Component", "Security");
    }

    private void setupAwsConfig(final String environmentSuffix) {
        // Create S3 bucket for Config
        Bucket configBucket = Bucket.Builder.create(this, "ConfigBucket")
                .bucketName("tap-" + environmentSuffix + "-config-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create IAM role for Config
        Role configRole = Role.Builder.create(this, "ConfigRole")
                .assumedBy(ServicePrincipal.Builder.create("config.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWS_ConfigRole")))
                .inlinePolicies(Map.of("ConfigBucketPolicy", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetBucketAcl", "s3:ListBucket"))
                                        .resources(Arrays.asList(configBucket.getBucketArn()))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                                        .resources(Arrays.asList(configBucket.getBucketArn() + "/*"))
                                        .build()))
                        .build()))
                .build();

        // Config delivery channel
        CfnDeliveryChannel.Builder.create(this, "ConfigDeliveryChannel")
                .s3BucketName(configBucket.getBucketName())
                .build();

        // Config recorder
        CfnConfigurationRecorder.Builder.create(this, "ConfigRecorder")
                .roleArn(configRole.getRoleArn())
                .recordingGroup(CfnConfigurationRecorder.RecordingGroupProperty.builder()
                        .allSupported(true)
                        .includeGlobalResourceTypes(true)
                        .build())
                .build();
    }
    public void associateWafWithApi(final RestApi apiGateway) {
        software.amazon.awscdk.services.wafv2.CfnWebACLAssociation wafAssociation = 
            software.amazon.awscdk.services.wafv2.CfnWebACLAssociation.Builder.create(this, "ApiWafAssociation")
                    .resourceArn("arn:aws:apigateway:" + this.getRegion() + "::/restapis/" + apiGateway.getRestApiId() + "/stages/prod")
                    .webAclArn(webAcl.getAttrArn())
                    .build();
        wafAssociation.addDependsOn(webAcl);
    }


    public Key getKmsKey() {
        return kmsKey;
    }

    public CfnWebACL getWebAcl() {
        return webAcl;
    }

    public Trail getCloudTrail() {
        return cloudTrail;
    }

}

/**
 * VPC Infrastructure Stack with enhanced security
 */
class InfrastructureStack extends Stack {
    private final Vpc vpc;
    private final Instance ec2Instance;
    private final Instance bastionHost;
    private final SecurityGroup sshSecurityGroup;
    private final SecurityGroup bastionSecurityGroup;
    private final SecurityGroup rdsSecurityGroup;
    private final DatabaseInstance rdsInstance;
    private final SubnetGroup dbSubnetGroup;

    InfrastructureStack(final Construct scope, final String id, final String environmentSuffix,
            final List<String> allowedIpAddresses, final Key kmsKey, final StackProps props) {
        super(scope, id, props);

        this.vpc = createVpcWithSubnets(environmentSuffix);
        setupVpcFlowLogs(environmentSuffix);
        this.bastionSecurityGroup = createBastionSecurityGroup(environmentSuffix, allowedIpAddresses);
        this.sshSecurityGroup = createSshSecurityGroup(environmentSuffix);
        this.rdsSecurityGroup = createRdsSecurityGroup(environmentSuffix);
        
        Role ec2Role = createEc2Role(environmentSuffix);
        IMachineImage amazonLinuxAmi = getAmazonLinuxAmi();
        this.bastionHost = createBastionHost(environmentSuffix, ec2Role, amazonLinuxAmi, kmsKey);
        this.ec2Instance = createWebServerInstance(environmentSuffix, ec2Role, amazonLinuxAmi, kmsKey);
        
        this.dbSubnetGroup = createDbSubnetGroup();
        this.rdsInstance = createRdsInstance(environmentSuffix, kmsKey);
        
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Component", "Infrastructure");
    }

    private Vpc createVpcWithSubnets(final String environmentSuffix) {
        return Vpc.Builder.create(this, "MainVpc")
                .vpcName("tap-" + environmentSuffix + "-vpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .enableDnsSupport(true)
                .enableDnsHostnames(true)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PUBLIC)
                                .name("PublicSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .name("PrivateSubnet")
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .name("DatabaseSubnet")
                                .cidrMask(28)
                                .build()))
                .natGateways(1)
                .build();
    }

    private void setupVpcFlowLogs(final String environmentSuffix) {
        LogGroup vpcFlowLogGroup = LogGroup.Builder.create(this, "VpcFlowLogGroup")
                .logGroupName("/aws/vpc/flowlogs-" + environmentSuffix)
                .retention(RetentionDays.ONE_YEAR)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        FlowLog.Builder.create(this, "VpcFlowLog")
                .resourceType(FlowLogResourceType.fromVpc(vpc))
                .destination(FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup))
                .build();
    }

    private SecurityGroup createBastionSecurityGroup(final String environmentSuffix, 
            final List<String> allowedIpAddresses) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "BastionSecurityGroup")
                .securityGroupName("tap-" + environmentSuffix + "-bastion-sg")
                .vpc(vpc)
                .description("Security group for bastion host SSH access")
                .allowAllOutbound(true)
                .build();

        // Add SSH access only from specific IP addresses
        for (String ipAddress : allowedIpAddresses) {
            securityGroup.addIngressRule(
                    Peer.ipv4(ipAddress),
                    Port.tcp(22),
                    "SSH access from " + ipAddress);
        }

        return securityGroup;
    }

    private SecurityGroup createSshSecurityGroup(final String environmentSuffix) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "SshSecurityGroup")
                .securityGroupName("tap-" + environmentSuffix + "-ssh-sg")
                .vpc(vpc)
                .description("Security group for SSH access to EC2 instances")
                .allowAllOutbound(true)
                .build();

        // Allow SSH only from bastion host
        securityGroup.addIngressRule(
                Peer.securityGroupId(bastionSecurityGroup.getSecurityGroupId()),
                Port.tcp(22),
                "SSH access from bastion host");

        return securityGroup;
    }

    private SecurityGroup createRdsSecurityGroup(final String environmentSuffix) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "RdsSecurityGroup")
                .securityGroupName("tap-" + environmentSuffix + "-rds-sg")
                .vpc(vpc)
                .description("Security group for RDS database")
                .allowAllOutbound(false)
                .build();

        // Allow database access only from EC2 security group
        securityGroup.addIngressRule(
                Peer.securityGroupId(sshSecurityGroup.getSecurityGroupId()),
                Port.tcp(3306),
                "MySQL access from EC2 instances");

        return securityGroup;
    }

    private Role createEc2Role(final String environmentSuffix) {
        return Role.Builder.create(this, "Ec2Role")
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
                .inlinePolicies(Map.of("RestrictedS3Access", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                                        .resources(Arrays.asList("arn:aws:s3:::tap-" + environmentSuffix + "-*/*"))
                                        .build()))
                        .build()))
                .build();
    }

    private IMachineImage getAmazonLinuxAmi() {
        return MachineImage.latestAmazonLinux(
                AmazonLinuxImageProps.builder()
                        .generation(AmazonLinuxGeneration.AMAZON_LINUX_2)
                        .edition(AmazonLinuxEdition.STANDARD)
                        .virtualization(AmazonLinuxVirt.HVM)
                        .cpuType(AmazonLinuxCpuType.X86_64)
                        .build());
    }

    private Instance createBastionHost(final String environmentSuffix, final Role ec2Role,
            final IMachineImage amazonLinuxAmi, final Key kmsKey) {
        return Instance.Builder.create(this, "BastionHost")
                .instanceName("tap-" + environmentSuffix + "-bastion")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amazonLinuxAmi)
                .securityGroup(bastionSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .role(ec2Role)
                .userData(UserData.forLinux())
                .blockDevices(Arrays.asList(
                        software.amazon.awscdk.services.ec2.BlockDevice.builder()
                                .deviceName("/dev/xvda")
                                .volume(software.amazon.awscdk.services.ec2.BlockDeviceVolume.ebs(20,
                                        software.amazon.awscdk.services.ec2.EbsDeviceOptions.builder()
                                                .encrypted(true)
                                                .kmsKey(kmsKey)
                                                .build()))
                                .build()))
                .build();
    }

    private Instance createWebServerInstance(final String environmentSuffix, final Role ec2Role,
            final IMachineImage amazonLinuxAmi, final Key kmsKey) {
        return Instance.Builder.create(this, "WebServerInstance")
                .instanceName("tap-" + environmentSuffix + "-ec2-instance")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amazonLinuxAmi)
                .securityGroup(sshSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .role(ec2Role)
                .userData(UserData.forLinux())
                .blockDevices(Arrays.asList(
                        software.amazon.awscdk.services.ec2.BlockDevice.builder()
                                .deviceName("/dev/xvda")
                                .volume(software.amazon.awscdk.services.ec2.BlockDeviceVolume.ebs(20,
                                        software.amazon.awscdk.services.ec2.EbsDeviceOptions.builder()
                                                .encrypted(true)
                                                .kmsKey(kmsKey)
                                                .build()))
                                .build()))
                .build();
    }

    private SubnetGroup createDbSubnetGroup() {
        return SubnetGroup.Builder.create(this, "DbSubnetGroup")
                .description("Subnet group for RDS database")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();
    }

    private DatabaseInstance createRdsInstance(final String environmentSuffix, final Key kmsKey) {
        return DatabaseInstance.Builder.create(this, "Database")
                .instanceIdentifier("tap-" + environmentSuffix + "-db")
                .engine(DatabaseInstanceEngine.mariaDb(MariaDbInstanceEngineProps.builder()
                        .version(MariaDbEngineVersion.VER_10_6)
                        .build()))
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .vpc(vpc)
                .securityGroups(Arrays.asList(rdsSecurityGroup))
                .subnetGroup(dbSubnetGroup)
                .credentials(Credentials.fromGeneratedSecret("admin"))
                .storageEncrypted(true)
                .storageEncryptionKey(kmsKey)
                .backupRetention(Duration.days(7))
                .deletionProtection(false) // For demo purposes
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
    }

    public Vpc getVpc() {
        return vpc;
    }

    public Instance getEc2Instance() {
        return ec2Instance;
    }

    public Instance getBastionHost() {
        return bastionHost;
    }

    public DatabaseInstance getRdsInstance() {
        return rdsInstance;
    }
}

/**
 * Application Stack with Lambda, S3, and API Gateway
 */
class ApplicationStack extends Stack {
    private final Function lambdaFunction;
    private final Bucket s3Bucket;
    private final RestApi apiGateway;
    private final Distribution cloudFrontDistribution;

    ApplicationStack(final Construct scope, final String id, final String environmentSuffix,
            final List<String> allowedIpAddresses, final Key kmsKey, final CfnWebACL webAcl,
            final StackProps props) {
        super(scope, id, props);

        this.s3Bucket = createS3Bucket(environmentSuffix, kmsKey, allowedIpAddresses);
        Role lambdaRole = createLambdaRole(environmentSuffix, kmsKey);
        this.lambdaFunction = createLambdaFunction(environmentSuffix, lambdaRole);
        this.apiGateway = createApiGateway(environmentSuffix);
        this.cloudFrontDistribution = createCloudFrontDistribution();
        createOutputs();
        
        Tags.of(this).add("aws-shield-advanced", "false");
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Component", "Application");
    }

    private Bucket createS3Bucket(final String environmentSuffix, final Key kmsKey,
            final List<String> allowedIpAddresses) {
        Bucket bucket = Bucket.Builder.create(this, "AppBucket")
                .bucketName("tap-" + environmentSuffix + "-app-data-" + this.getAccount())
                .encryption(BucketEncryption.KMS)
                .encryptionKey(kmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Create bucket policy to restrict access to specific IPs
        bucket.addToResourcePolicy(PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(Arrays.asList(new AccountRootPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(
                        bucket.getBucketArn(),
                        bucket.getBucketArn() + "/*"))
                .conditions(Map.of("IpAddressIfExists", Map.of("aws:SourceIp", allowedIpAddresses),
                        "Bool", Map.of("aws:ViaAWSService", "false")))
                .build());

        return bucket;
    }

    private Role createLambdaRole(final String environmentSuffix, final Key kmsKey) {
        return Role.Builder.create(this, "LambdaRole")
                .assumedBy(ServicePrincipal.Builder.create("lambda.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")))
                .inlinePolicies(Map.of("RestrictedAccess", PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                                        .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .effect(Effect.ALLOW)
                                        .actions(Arrays.asList("kms:Decrypt", "kms:GenerateDataKey"))
                                        .resources(Arrays.asList(kmsKey.getKeyArn()))
                                        .build()))
                        .build()))
                .build();
    }

    private Function createLambdaFunction(final String environmentSuffix, final Role lambdaRole) {
        String lambdaCode = "import json\n"
                + "import boto3\n" 
                + "import os\n" 
                + "from datetime import datetime\n" 
                + "\n" 
                + "def handler(event, context):\n" 
                + "    s3_client = boto3.client('s3')\n" 
                + "    bucket_name = os.environ['BUCKET_NAME']\n" 
                + "    \n" 
                + "    # Log request details for security monitoring\n" 
                + "    log_entry = {\n" 
                + "        'timestamp': datetime.utcnow().isoformat(),\n" 
                + "        'source_ip': event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown'),\n" 
                + "        'user_agent': event.get('requestContext', {}).get('identity', {}).get('userAgent', 'unknown'),\n" 
                + "        'request_id': context.aws_request_id,\n" 
                + "        'function_name': context.function_name,\n" 
                + "        'path': event.get('path', '/'),\n" 
                + "        'method': event.get('httpMethod', 'GET')\n" 
                + "    }\n" 
                + "    \n" 
                + "    try:\n" 
                + "        # Store security log in S3\n" 
                + "        log_key = f\"security-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.aws_request_id}.json\"\n" 
                + "        s3_client.put_object(\n" 
                + "            Bucket=bucket_name,\n" 
                + "            Key=log_key,\n" 
                + "            Body=json.dumps(log_entry),\n" 
                + "            ContentType='application/json'\n" 
                + "        )\n" 
                + "        \n" 
                + "        # Return API response with security headers\n" 
                + "        return {\n" 
                + "            'statusCode': 200,\n" 
                + "            'headers': {\n" 
                + "                'Content-Type': 'application/json',\n" 
                + "                'X-Content-Type-Options': 'nosniff',\n" 
                + "                'X-Frame-Options': 'DENY',\n" 
                + "                'X-XSS-Protection': '1; mode=block',\n" 
                + "                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'\n" 
                + "            },\n" 
                + "            'body': json.dumps({\n" 
                + "                'message': 'Request processed and logged',\n" 
                + "                'timestamp': log_entry['timestamp'],\n" 
                + "                'request_id': context.aws_request_id\n" 
                + "            })\n" 
                + "        }\n" 
                + "    except Exception as e:\n" 
                + "        return {\n" 
                + "            'statusCode': 500,\n" 
                + "            'headers': {'Content-Type': 'application/json'},\n" 
                + "            'body': json.dumps({'error': 'Processing failed', 'message': str(e)})\n" 
                + "        }\n";

        return Function.Builder.create(this, "AppFunction")
                .functionName("tap-" + environmentSuffix + "-function")
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.handler")
                .code(Code.fromInline(lambdaCode))
                .role(lambdaRole)
                .environment(Map.of("BUCKET_NAME", s3Bucket.getBucketName()))
                .timeout(Duration.seconds(30))
                .memorySize(256)
                .build();
    }

    private RestApi createApiGateway(final String environmentSuffix) {
        RestApi api = LambdaRestApi.Builder.create(this, "AppApi")
                .restApiName("tap-" + environmentSuffix + "-api")
                .handler(lambdaFunction)
                .proxy(false)
                .deployOptions(software.amazon.awscdk.services.apigateway.StageOptions.builder()
                        .stageName("prod")
                        .methodOptions(Map.of("/*/*", 
            software.amazon.awscdk.services.apigateway.MethodDeploymentOptions.builder()
                                .throttlingRateLimit(100.0)
                                .throttlingBurstLimit(200)
                                .build()))
                        .build())
                .build();

        // Add resource and method
        api.getRoot().addResource("hello").addMethod("GET");
        return api;
    }

    private Distribution createCloudFrontDistribution() {
        return Distribution.Builder.create(this, "AppDistribution")
                .defaultBehavior(software.amazon.awscdk.services.cloudfront.BehaviorOptions.builder()
                        .origin(S3Origin.Builder.create(s3Bucket).build())
                        .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                        .allowedMethods(software.amazon.awscdk.services.cloudfront.AllowedMethods.ALLOW_ALL)
                        .cachedMethods(software.amazon.awscdk.services.cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS)
                        .build())
                .priceClass(software.amazon.awscdk.services.cloudfront.PriceClass.PRICE_CLASS_100)
                .enabled(true)
                .build();
    }

    private void createOutputs() {
        CfnOutput.Builder.create(this, "BucketName")
                .value(s3Bucket.getBucketName())
                .description("S3 Bucket Name")
                .build();

        CfnOutput.Builder.create(this, "ApiUrl")
                .value(apiGateway.getUrl())
                .description("API Gateway URL")
                .build();

        CfnOutput.Builder.create(this, "CloudFrontUrl")
                .value("https://" + cloudFrontDistribution.getDistributionDomainName())
                .description("CloudFront Distribution URL")
                .build();
    }

    public Function getLambdaFunction() {
        return lambdaFunction;
    }

    public Bucket getS3Bucket() {
        return s3Bucket;
    }

    public RestApi getApiGateway() {
        return apiGateway;
    }
}

/**
 * Main CDK stack that orchestrates all components
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final SecurityStack securityStack;
    private final InfrastructureStack infrastructureStack;
    private final ApplicationStack applicationStack;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix and allowed IPs
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        List<String> allowedIpAddresses = Optional.ofNullable(props)
                .map(TapStackProps::getAllowedIpAddresses)
                .orElse(Arrays.asList("203.0.113.0/32"));

        // Create security stack first
        this.securityStack = new SecurityStack(
                this,
                "Security",
                environmentSuffix,
                allowedIpAddresses,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Security Stack for environment: " + environmentSuffix)
                        .build());

        // Create infrastructure stack
        this.infrastructureStack = new InfrastructureStack(
                this,
                "Infrastructure",
                environmentSuffix,
                allowedIpAddresses,
                securityStack.getKmsKey(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Infrastructure Stack for environment: " + environmentSuffix)
                        .build());

        // Create application stack
        this.applicationStack = new ApplicationStack(
                this,
                "Application",
                environmentSuffix,
                allowedIpAddresses,
                securityStack.getKmsKey(),
                securityStack.getWebAcl(),
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("Application Stack for environment: " + environmentSuffix)
                        .build());

        // Add stack dependencies
        infrastructureStack.addDependency(securityStack);
        applicationStack.addDependency(securityStack);
        applicationStack.addDependency(infrastructureStack);

        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Project", "SecureCloudInfrastructure");
        Tags.of(this).add("CreatedBy", "CDK");
        Tags.of(this).add("ComplianceLevel", "High");
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public SecurityStack getSecurityStack() {
        return securityStack;
    }

    public InfrastructureStack getInfrastructureStack() {
        return infrastructureStack;
    }

    public ApplicationStack getApplicationStack() {
        return applicationStack;
    }
    public InfrastructureStack getVpcStack() {
        return infrastructureStack;
    }
}

/**
 * Main entry point for the CDK Java application
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable, context, or default
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        }
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "pr2253";
        }

        // Get allowed IP addresses from environment or use defaults
        String allowedIpsEnv = System.getenv("ALLOWED_IP_ADDRESSES");
        List<String> allowedIpAddresses;
        if (allowedIpsEnv != null && !allowedIpsEnv.isEmpty()) {
            allowedIpAddresses = Arrays.asList(allowedIpsEnv.split(","));
        } else {
            // Default to example IP - replace with your actual IPs
            allowedIpAddresses = Arrays.asList("203.0.113.0/32", "198.51.100.0/32");
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .allowedIpAddresses(allowedIpAddresses)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-1")
                                .build())
                        .build())
                .build());

        app.synth();
    }
}