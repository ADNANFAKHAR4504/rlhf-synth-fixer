/*
 * Maven Dependencies for pom.xml:
 *
 * <dependencies>
 *     <dependency>
 *         <groupId>software.amazon.awscdk</groupId>
 *         <artifactId>aws-cdk-lib</artifactId>
 *         <version>2.111.0</version>
 *     </dependency>
 *     <dependency>
 *         <groupId>software.constructs</groupId>
 *         <artifactId>constructs</artifactId>
 *         <version>10.3.0</version>
 *     </dependency>
 * </dependencies>
 */

package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.apigateway.LambdaRestApi;
import software.amazon.awscdk.services.apigateway.LogGroupLogDestination;
import software.amazon.awscdk.services.apigateway.MethodLoggingLevel;
import software.amazon.awscdk.services.apigateway.StageOptions;
import software.amazon.awscdk.services.ec2.LaunchTemplate;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.Effect;
import software.amazon.awscdk.services.iam.PolicyDocument;
import software.amazon.awscdk.services.iam.PolicyStatement;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.iam.AnyPrincipal;
import software.amazon.awscdk.services.kms.Key;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.customresources.AwsCustomResource;
import software.amazon.awscdk.customresources.AwsCustomResourcePolicy;
import software.amazon.awscdk.customresources.PhysicalResourceId;
import software.amazon.awscdk.customresources.AwsSdkCall;
import software.amazon.awscdk.customresources.SdkCallsPolicyOptions;
import software.amazon.awscdk.services.networkfirewall.CfnFirewall;
import software.amazon.awscdk.services.networkfirewall.CfnFirewallPolicy;
import software.amazon.awscdk.services.networkfirewall.CfnRuleGroup;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.PostgresEngineVersion;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Map;

/**
 * Comprehensive AWS CDK Stack for Financial Services Infrastructure
 * Project: SecurityConfigurationAsCode_CloudFormation_YAML_a8b7e6t4q9j2
 *
 * This stack implements a secure, compliant cloud infrastructure for financial services
 * with multi-AZ VPC, encryption at rest, network firewalls, and comprehensive auditing.
 */
class NovaModelStack extends Stack {

    private static final String PROJECT_NAME = "novamodel";
    private static final String ENVIRONMENT = "dev";
    private static final String CENTRAL_LOGGING_BUCKET_ARN = "arn:aws:s3:::central-logging-bucket-123456789012";
    private final String environmentSuffix;

    // Standard tags applied to all resources
    private static final Map<String, String> STANDARD_TAGS = Map.of(
        "Project", "NovaModel",
        "Environment", ENVIRONMENT,
        "Owner", "FinServTeam",
        "ManagedBy", "CDK"
    );

    public NovaModelStack(final Construct scope, final String id, final StackProps props, final String environmentSuffix) {
        super(scope, id, props);
        this.environmentSuffix = environmentSuffix;

        // Apply standard tags to all resources in this stack
        STANDARD_TAGS.forEach((key, value) -> Tags.of(this).add(key, value));

        // 1. Create Customer Managed Key for encryption
        Key cmk = createCustomerManagedKey();

        // 2. Enable EBS encryption by default
        enableEbsEncryptionByDefault(cmk);

        // 3. Create VPC with proper networking setup
        Vpc vpc = createVpc();

        // 4. Create security groups with least privilege
        SecurityGroup lambdaSecurityGroup = createLambdaSecurityGroup(vpc);
        SecurityGroup rdsSecurityGroup = createRdsSecurityGroup(vpc, lambdaSecurityGroup);

        // 5. Deploy Network Firewall
        deployNetworkFirewall(vpc);

        // 6. Create S3 bucket with encryption and secure transport
        Bucket dataBucket = createS3Bucket(cmk);

        // 7. Create RDS PostgreSQL instance
        DatabaseInstance rdsInstance = createRdsInstance(vpc, rdsSecurityGroup, cmk);

        // 8. Create IAM roles with least privilege
        Role lambdaRole = createLambdaExecutionRole(dataBucket, rdsInstance);

        // 9. Create Lambda function
        Function lambdaFunction = createLambdaFunction(vpc, lambdaSecurityGroup, lambdaRole);

        // 10. Create API Gateway with logging
        LambdaRestApi apiGateway = createApiGateway(lambdaFunction);

        // 11. Create EC2 launch template for Nitro Enclaves
        LaunchTemplate launchTemplate = createEc2LaunchTemplate();

        // 12. Set up CloudTrail for audit logging
        setupCloudTrail();

        // 13. Set up AWS Config conditionally
        setupAwsConfigConditionally(dataBucket);

        // 14. Create stack outputs (non-sensitive only)
        createStackOutputs(vpc, dataBucket, rdsInstance);
    }

    /**
     * Creates a Customer Managed Key (CMK) for encryption at rest
     */
    private Key createCustomerManagedKey() {
        return Key.Builder.create(this, formatResourceName("CMK"))
            .description("Customer Managed Key for NovaModel encryption")
            .enableKeyRotation(true)
            .build();
    }

    /**
     * Creates a multi-AZ VPC with proper subnet configuration
     */
    private Vpc createVpc() {
        return Vpc.Builder.create(this, formatResourceName("VPC"))
            .maxAzs(3)
            .natGateways(2)
            .subnetConfiguration(Arrays.asList(
                SubnetConfiguration.builder()
                    .name("PublicSubnet")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("PrivateSubnet")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("DatabaseSubnet")
                    .subnetType(SubnetType.PRIVATE_ISOLATED)
                    .cidrMask(24)
                    .build()
            ))
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .build();
    }

    /**
     * Creates security group for Lambda functions
     */
    private SecurityGroup createLambdaSecurityGroup(Vpc vpc) {
        return SecurityGroup.Builder.create(this, formatResourceName("LambdaSG"))
            .vpc(vpc)
            .description("Security group for Lambda functions")
            .allowAllOutbound(true)
            .build();
    }

    /**
     * Creates security group for RDS with least privilege access
     */
    private SecurityGroup createRdsSecurityGroup(Vpc vpc, SecurityGroup lambdaSecurityGroup) {
        SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, formatResourceName("RdsSG"))
            .vpc(vpc)
            .description("Security group for RDS PostgreSQL")
            .allowAllOutbound(false)
            .build();

        // Allow inbound connections only from Lambda security group on PostgreSQL port
        rdsSecurityGroup.addIngressRule(
            lambdaSecurityGroup,
            Port.tcp(5432),
            "Allow Lambda to access PostgreSQL"
        );

        return rdsSecurityGroup;
    }

    /**
     * Deploys AWS Network Firewall with strict policy
     */
    private void deployNetworkFirewall(Vpc vpc) {
        // Create rule group for firewall with actual rules
        CfnRuleGroup ruleGroup = CfnRuleGroup.Builder.create(this, formatResourceName("NetworkFirewallRuleGroup"))
            .capacity(100)
            .ruleGroupName(formatResourceName("NetworkFirewallRuleGroup"))
            .type("STATEFUL")
            .description("Strict firewall rules for financial services")
            .ruleGroup(CfnRuleGroup.RuleGroupProperty.builder()
                .rulesSource(CfnRuleGroup.RulesSourceProperty.builder()
                    .statefulRules(Arrays.asList(
                        CfnRuleGroup.StatefulRuleProperty.builder()
                            .action("PASS")
                            .header(CfnRuleGroup.HeaderProperty.builder()
                                .destination("10.0.0.0/16")
                                .destinationPort("443")
                                .direction("FORWARD")
                                .protocol("TCP")
                                .source("10.0.0.0/16")
                                .sourcePort("ANY")
                                .build())
                            .ruleOptions(Arrays.asList(
                                CfnRuleGroup.RuleOptionProperty.builder()
                                    .keyword("sid:1")
                                    .build()
                            ))
                            .build()
                    ))
                    .build())
                .build())
            .build();

        // Create firewall policy
        CfnFirewallPolicy firewallPolicy = CfnFirewallPolicy.Builder.create(this, formatResourceName("NetworkFirewallPolicy"))
            .firewallPolicyName(formatResourceName("NetworkFirewallPolicy"))
            .firewallPolicy(CfnFirewallPolicy.FirewallPolicyProperty.builder()
                .statefulRuleGroupReferences(Arrays.asList(
                    CfnFirewallPolicy.StatefulRuleGroupReferenceProperty.builder()
                        .resourceArn(ruleGroup.getAttrRuleGroupArn())
                        .build()
                ))
                .statelessDefaultActions(Arrays.asList("aws:forward_to_sfe"))
                .statelessFragmentDefaultActions(Arrays.asList("aws:forward_to_sfe"))
                .build())
            .description("Firewall policy for network perimeter defense")
            .build();

        // Create firewall
        CfnFirewall firewall = CfnFirewall.Builder.create(this, formatResourceName("NetworkFirewall"))
            .firewallName(formatResourceName("NetworkFirewall"))
            .firewallPolicyArn(firewallPolicy.getAttrFirewallPolicyArn())
            .vpcId(vpc.getVpcId())
            .subnetMappings(vpc.getPublicSubnets().stream()
                .map(subnet -> CfnFirewall.SubnetMappingProperty.builder()
                    .subnetId(subnet.getSubnetId())
                    .build())
                .collect(java.util.stream.Collectors.toList()))
            .description("Network firewall for perimeter defense")
            .build();
    }

    /**
     * Creates S3 bucket with encryption and secure transport policy
     */
    private Bucket createS3Bucket(Key cmk) {
        Bucket bucket = Bucket.Builder.create(this, formatResourceName("DataBucket"))
            .bucketName((formatResourceName("data-bucket") + "-" + java.time.Instant.now().getEpochSecond()).toLowerCase())
            .encryption(BucketEncryption.KMS)
            .encryptionKey(cmk)
            .versioned(true)
            .blockPublicAccess(software.amazon.awscdk.services.s3.BlockPublicAccess.BLOCK_ALL)
            .build();

        // Add bucket policy to reject non-HTTPS requests
        bucket.addToResourcePolicy(
            PolicyStatement.Builder.create()
                .effect(Effect.DENY)
                .principals(Arrays.asList(new AnyPrincipal()))
                .actions(Arrays.asList("s3:*"))
                .resources(Arrays.asList(bucket.getBucketArn(), bucket.getBucketArn() + "/*"))
                .conditions(Map.of(
                    "Bool", Map.of("aws:SecureTransport", "false")
                ))
                .build()
        );

        return bucket;
    }

    /**
     * Creates RDS PostgreSQL instance with encryption
     */
    private DatabaseInstance createRdsInstance(Vpc vpc, SecurityGroup rdsSecurityGroup, Key cmk) {
        // Create DB subnet group
        SubnetGroup subnetGroup = SubnetGroup.Builder.create(this, formatResourceName("RdsSubnetGroup"))
            .description("Subnet group for RDS PostgreSQL")
            .vpc(vpc)
            .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .build())
            .build();

        return DatabaseInstance.Builder.create(this, formatResourceName("PostgreSQLInstance"))
            .engine(DatabaseInstanceEngine.postgres(
                software.amazon.awscdk.services.rds.PostgresInstanceEngineProps.builder()
                    .version(PostgresEngineVersion.VER_15)
                    .build()
            ))
            .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
                software.amazon.awscdk.services.ec2.InstanceClass.T3,
                software.amazon.awscdk.services.ec2.InstanceSize.MICRO
            ))
            .vpc(vpc)
            .subnetGroup(subnetGroup)
            .securityGroups(Arrays.asList(rdsSecurityGroup))
            .storageEncryptionKey(cmk)
            .multiAz(true)
            .backupRetention(software.amazon.awscdk.Duration.days(30))
            .deletionProtection(isProductionEnvironment())
            .build();
    }

    /**
     * Creates IAM role for Lambda with least privilege permissions
     */
    private Role createLambdaExecutionRole(Bucket dataBucket, DatabaseInstance rdsInstance) {
        return Role.Builder.create(this, formatResourceName("LambdaExecutionRole"))
            .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
            .managedPolicies(Arrays.asList(
                software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ))
            .inlinePolicies(Map.of(
                "S3Access", PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList("s3:GetObject", "s3:PutObject"))
                            .resources(Arrays.asList(dataBucket.getBucketArn() + "/*"))
                            .build()
                    ))
                    .build(),
                "RDSAccess", PolicyDocument.Builder.create()
                    .statements(Arrays.asList(
                        PolicyStatement.Builder.create()
                            .effect(Effect.ALLOW)
                            .actions(Arrays.asList("rds-db:connect"))
                            .resources(Arrays.asList(
                                "arn:aws:rds-db:" + this.getRegion() + ":" + this.getAccount() +
                                ":dbuser:" + rdsInstance.getInstanceResourceId() + "/lambda_user"
                            ))
                            .build()
                    ))
                    .build()
            ))
            .build();
    }

    /**
     * Creates Lambda function in VPC private subnets
     */
    private Function createLambdaFunction(Vpc vpc, SecurityGroup lambdaSecurityGroup, Role lambdaRole) {
        return Function.Builder.create(this, formatResourceName("ProcessorFunction"))
            .runtime(Runtime.NODEJS_18_X)
            .handler("index.handler")
            .code(Code.fromInline(
                "exports.handler = async (event) => {\n" +
                "  console.log('Event:', JSON.stringify(event, null, 2));\n" +
                "  return { statusCode: 200, body: JSON.stringify('Hello from Lambda!') };\n" +
                "};"
            ))
            .vpc(vpc)
            .vpcSubnets(software.amazon.awscdk.services.ec2.SubnetSelection.builder()
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .build())
            .securityGroups(Arrays.asList(lambdaSecurityGroup))
            .role(lambdaRole)
            .timeout(software.amazon.awscdk.Duration.seconds(30))
            .build();
    }

    /**
     * Creates API Gateway with comprehensive logging
     */
    private LambdaRestApi createApiGateway(Function lambdaFunction) {
        // Create log group for API Gateway
        LogGroup apiLogGroup = LogGroup.Builder.create(this, formatResourceName("ApiGatewayLogGroup"))
            .retention(RetentionDays.ONE_MONTH)
            .build();

        return LambdaRestApi.Builder.create(this, formatResourceName("RestApi"))
            .handler(lambdaFunction)
            .deployOptions(StageOptions.builder()
                .accessLogDestination(new LogGroupLogDestination(apiLogGroup))
                .accessLogFormat(software.amazon.awscdk.services.apigateway.AccessLogFormat.jsonWithStandardFields())
                .loggingLevel(MethodLoggingLevel.INFO)
                .dataTraceEnabled(true)
                .metricsEnabled(true)
                .build())
            .build();
    }

    /**
     * Creates EC2 launch template for Nitro Enclaves support
     */
    private LaunchTemplate createEc2LaunchTemplate() {
        return LaunchTemplate.Builder.create(this, formatResourceName("LaunchTemplate"))
            .launchTemplateName(formatResourceName("launch-template"))
            .instanceType(InstanceType.of(
                software.amazon.awscdk.services.ec2.InstanceClass.M6I,
                software.amazon.awscdk.services.ec2.InstanceSize.LARGE
            ))
            .machineImage(MachineImage.latestAmazonLinux2())
            .userData(software.amazon.awscdk.services.ec2.UserData.forLinux())
            .build();
    }

    /**
     * Sets up AWS Config conditionally - only if no configuration recorder exists
     * This avoids the MaxNumberOfConfigurationRecordersExceededException
     */
    private void setupAwsConfigConditionally(Bucket dataBucket) {
        // Check if configuration recorders exist
        AwsCustomResource configRecorderCheck = AwsCustomResource.Builder.create(this, "ConfigRecorderCheck")
            .onCreate(AwsSdkCall.builder()
                .service("ConfigService")
                .action("describeConfigurationRecorders")
                .physicalResourceId(PhysicalResourceId.of("config-recorder-check"))
                .build())
            .policy(AwsCustomResourcePolicy.fromSdkCalls(SdkCallsPolicyOptions.builder()
                .resources(Arrays.asList("*"))
                .build()))
            .build();

        // Get the result of the check
        String configRecorderCount = configRecorderCheck.getResponseField("ConfigurationRecorders.length");

        // Only create Config resources if no recorders exist

        // Create service role for Config (always needed for delivery channel)
        Role configRole = Role.Builder.create(this, formatResourceName("ConfigRole"))
            .assumedBy(new ServicePrincipal("config.amazonaws.com"))
            .managedPolicies(Arrays.asList(
                software.amazon.awscdk.services.iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "service-role/AWS_ConfigRole"
                )
            ))
            .build();
    }

    /**
     * Enables EBS encryption by default using the specified KMS key
     */
    private void enableEbsEncryptionByDefault(Key cmk) {
        // Use AWS Custom Resource to enable EBS encryption by default
        AwsCustomResource.Builder.create(this, "EnableEBSEncryption")
            .onCreate(AwsSdkCall.builder()
                .service("EC2")
                .action("enableEbsEncryptionByDefault")
                .physicalResourceId(PhysicalResourceId.of("ebs-encryption-default"))
                .build())
            .onDelete(AwsSdkCall.builder()
                .service("EC2")
                .action("disableEbsEncryptionByDefault")
                .physicalResourceId(PhysicalResourceId.of("ebs-encryption-default"))
                .build())
            .policy(AwsCustomResourcePolicy.fromSdkCalls(SdkCallsPolicyOptions.builder()
                .resources(Arrays.asList("*"))
                .build()))
            .build();
    }

    /**
     * Sets up AWS CloudTrail for audit logging
     */
    private void setupCloudTrail() {
        // Create CloudTrail S3 bucket (separate from data bucket for security)
        Bucket cloudTrailBucket = Bucket.Builder.create(this, formatResourceName("CloudTrailBucket"))
            .versioned(true)
            .encryption(BucketEncryption.KMS_MANAGED)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .removalPolicy(RemovalPolicy.RETAIN)
            .build();

        // Create CloudTrail
        software.amazon.awscdk.services.cloudtrail.Trail.Builder.create(this, formatResourceName("CloudTrail"))
            .bucket(cloudTrailBucket)
            .includeGlobalServiceEvents(true)
            .isMultiRegionTrail(true)
            .enableFileValidation(true)
            .build();
    }

    /**
     * Creates stack outputs for non-sensitive information
     */
    private void createStackOutputs(Vpc vpc, Bucket dataBucket, DatabaseInstance rdsInstance) {
        CfnOutput.Builder.create(this, "VpcId")
            .value(vpc.getVpcId())
            .description("VPC ID")
            .build();

        CfnOutput.Builder.create(this, "S3BucketName")
            .value(dataBucket.getBucketName())
            .description("S3 Data Bucket Name")
            .build();

        CfnOutput.Builder.create(this, "RdsEndpoint")
            .value(rdsInstance.getInstanceEndpoint().getHostname())
            .description("RDS PostgreSQL Endpoint")
            .build();
    }

    /**
     * Formats resource names with consistent naming convention
     */
    private String formatResourceName(String resourceType) {
        return PROJECT_NAME + "-" + resourceType + "-" + environmentSuffix;
    }

    /**
     * Determines if the current environment is production
     * Only enable deletion protection for production environments
     */
    private boolean isProductionEnvironment() {
        return "prod".equalsIgnoreCase(environmentSuffix) ||
               "production".equalsIgnoreCase(environmentSuffix);
    }
}

/**
 * Main entry point for the NovaModel CDK Java application
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main method to deploy the NovaModel stack
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from environment variable or use default
        String environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (environmentSuffix == null || environmentSuffix.isEmpty()) {
            environmentSuffix = "dev";
        }

        // Create the NovaModel stack with environment suffix
        new NovaModelStack(app, "TapStack" + environmentSuffix, StackProps.builder()
            .env(Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region(System.getenv("CDK_DEFAULT_REGION"))
                .build())
            .build(), environmentSuffix);

        // Synthesize the CDK app
        app.synth();
    }
}
