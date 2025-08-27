package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(String environmentSuffix, StackProps stackProps) {
        this.environmentSuffix = environmentSuffix;
        this.stackProps = stackProps != null ? stackProps : StackProps.builder().build();
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public StackProps getStackProps() {
        return stackProps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * Represents the main CDK stack for the Tap project.
 *
 * This stack implements a secure AWS environment with:
 * - VPC with public/private subnets
 * - EC2 instance with least privilege IAM role
 * - S3 bucket with encryption and access logging
 * - Security groups with restricted SSH access
 * - CloudWatch logging
 * 
 * All resources follow AWS security best practices and least privilege principles.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    
    // Configuration constants
    private static final String ALLOWED_SSH_CIDR = "203.0.113.0/24"; // Replace with your IP range
    private static final String APPLICATION_NAME = "secure-app";
    private static final String EC2_KEY_PAIR_NAME = "my-key-pair"; // Must exist in us-west-2 region

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create secure AWS infrastructure
        createSecureInfrastructure();
    }

    /**
     * Creates the complete secure AWS infrastructure
     */
    private void createSecureInfrastructure() {
        // Create VPC with proper network segmentation
        Vpc vpc = createSecureVpc();
        
        // Create S3 buckets (main bucket and logging bucket)
        Bucket loggingBucket = createS3LoggingBucket();
        Bucket applicationBucket = createSecureS3Bucket(loggingBucket);
        
        // Create CloudWatch Log Group for application logs
        LogGroup applicationLogGroup = createCloudWatchLogGroup();
        
        // Create IAM role with least privilege policies
        Role ec2Role = createEC2Role(applicationBucket, applicationLogGroup);
        
        // Create security group with restricted SSH access
        SecurityGroup securityGroup = createSecurityGroup(vpc);
        
        // Create EC2 instance with all security configurations
        Instance ec2Instance = createSecureEC2Instance(vpc, securityGroup, ec2Role);
        
        // Output important resource information
        createOutputs(vpc, applicationBucket, ec2Instance);
    }

    /**
     * Creates a secure VPC with public and private subnets across multiple AZs
     * Follows AWS best practices for network segmentation
     */
    private Vpc createSecureVpc() {
        return Vpc.Builder.create(this, "SecureVPC")
            .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
            .maxAzs(2) // Use 2 AZs for high availability
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .subnetConfiguration(Arrays.asList(
                // Public subnet for resources that need internet access
                SubnetConfiguration.builder()
                    .name("PublicSubnet")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                // Private subnet for internal resources
                SubnetConfiguration.builder()
                    .name("PrivateSubnet")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build()
            ))
            .natGateways(1) // Single NAT Gateway for cost optimization
            .build();
    }

    /**
     * Creates a dedicated S3 bucket for access logging
     * This bucket stores access logs from the main application bucket
     */
    private Bucket createS3LoggingBucket() {
        return Bucket.Builder.create(this, "S3AccessLogsBucket")
            .bucketName(APPLICATION_NAME + "-access-logs-" + this.getAccount() + "-" + environmentSuffix.toLowerCase())
            .versioned(false) // Logs don't need versioning
            .publicReadAccess(false)
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            // Server-side encryption for log files
            .encryption(BucketEncryption.S3_MANAGED)
            // Lifecycle policy to manage log retention and costs
            .lifecycleRules(Collections.singletonList(
                LifecycleRule.builder()
                    .id("LogRetentionRule")
                    .enabled(true)
                    .expiration(software.amazon.awscdk.Duration.days(90))
                    .transitions(Collections.singletonList(
                        Transition.builder()
                            .storageClass(StorageClass.INFREQUENT_ACCESS)
                            .transitionAfter(software.amazon.awscdk.Duration.days(30))
                            .build()
                    ))
                    .build()
            ))
            // Removal policy to ensure bucket is deleted when stack is destroyed
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
    }

    /**
     * Creates the main application S3 bucket with comprehensive security configurations
     * Includes encryption, access logging, and public access blocking
     */
    private Bucket createSecureS3Bucket(Bucket loggingBucket) {
        return Bucket.Builder.create(this, "SecureApplicationBucket")
            .bucketName(APPLICATION_NAME + "-data-" + this.getAccount() + "-" + environmentSuffix.toLowerCase())
            .versioned(true) // Enable versioning for data protection
            .publicReadAccess(false)
            // REQUIREMENT: Public access fully blocked
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            // REQUIREMENT: Server-side encryption enabled
            .encryption(BucketEncryption.S3_MANAGED)
            // REQUIREMENT: Access logging enabled
            .serverAccessLogsBucket(loggingBucket)
            .serverAccessLogsPrefix("application-bucket-access-logs/")
            // Additional security configurations
            .lifecycleRules(Collections.singletonList(
                LifecycleRule.builder()
                    .id("DataLifecycleRule")
                    .enabled(true)
                    .noncurrentVersionExpiration(software.amazon.awscdk.Duration.days(30))
                    .transitions(Arrays.asList(
                        Transition.builder()
                            .storageClass(StorageClass.INFREQUENT_ACCESS)
                            .transitionAfter(software.amazon.awscdk.Duration.days(30))
                            .build(),
                        Transition.builder()
                            .storageClass(StorageClass.GLACIER)
                            .transitionAfter(software.amazon.awscdk.Duration.days(90))
                            .build()
                    ))
                    .build()
            ))
            // Removal policy to ensure bucket is deleted when stack is destroyed
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
    }

    /**
     * Creates CloudWatch Log Group for application logging
     */
    private LogGroup createCloudWatchLogGroup() {
        return LogGroup.Builder.create(this, "ApplicationLogGroup")
            .logGroupName("/aws/ec2/" + APPLICATION_NAME + "-" + environmentSuffix.toLowerCase())
            .retention(RetentionDays.ONE_MONTH) // 30 days retention
            // Removal policy to ensure log group is deleted when stack is destroyed
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
    }

    /**
     * Creates IAM role for EC2 instance with least privilege policies
     * REQUIREMENT: Least privilege policies scoped only to application needs
     */
    private Role createEC2Role(Bucket applicationBucket, LogGroup logGroup) {
        // Create the IAM role that EC2 can assume
        Role role = Role.Builder.create(this, "SecureEC2Role")
            .roleName(APPLICATION_NAME + "-ec2-role-" + environmentSuffix.toLowerCase())
            .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
            .description("Least privilege role for secure application EC2 instance")
            .build();
        
        // LEAST PRIVILEGE: S3 access policy - only to specific bucket and required actions
        PolicyStatement s3PolicyStatement = PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ))
            .resources(Arrays.asList(
                applicationBucket.getBucketArn(),
                applicationBucket.getBucketArn() + "/*"
            ))
            .build();
        
        // LEAST PRIVILEGE: CloudWatch Logs policy - only to specific log group
        PolicyStatement logsPolicy = PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams"
            ))
            .resources(Collections.singletonList(logGroup.getLogGroupArn() + "*"))
            .build();
        
        // LEAST PRIVILEGE: CloudWatch metrics policy - only basic EC2 metrics
        PolicyStatement metricsPolicy = PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "cloudwatch:PutMetricData",
                "ec2:DescribeVolumes",
                "ec2:DescribeTags"
            ))
            .resources(Collections.singletonList("*"))
            .conditions(Map.of(
                "StringEquals", Map.of(
                    "cloudwatch:namespace", "AWS/EC2"
                )
            ))
            .build();
        
        // Create and attach custom policy with least privilege permissions
        Policy customPolicy = Policy.Builder.create(this, "SecureEC2Policy")
            .policyName(APPLICATION_NAME + "-ec2-policy")
            .statements(Arrays.asList(s3PolicyStatement, logsPolicy, metricsPolicy))
            .build();
        
        role.attachInlinePolicy(customPolicy);
        
        // Attach AWS managed policy for SSM (for secure remote access alternative to SSH)
        role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));
        
        return role;
    }

    /**
     * Creates security group with restricted SSH access
     * REQUIREMENT: SSH traffic only on port 22, restricted to specified IP range
     */
    private SecurityGroup createSecurityGroup(Vpc vpc) {
        SecurityGroup securityGroup = SecurityGroup.Builder.create(this, "SecureApplicationSG")
            .vpc(vpc)
            .securityGroupName(APPLICATION_NAME + "-security-group-" + environmentSuffix.toLowerCase())
            .description("Security group for secure application with restricted SSH access")
            .allowAllOutbound(true) // Allow outbound traffic for updates and S3 access
            .build();
        
        // REQUIREMENT: SSH access only on port 22, restricted to specified IP range
        securityGroup.addIngressRule(
            Peer.ipv4(ALLOWED_SSH_CIDR),
            Port.tcp(22),
            "SSH access from authorized IP range only"
        );
        
        // Allow HTTPS outbound for S3 and other AWS services
        securityGroup.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "HTTPS outbound for AWS services"
        );
        
        // Allow HTTP outbound for package updates
        securityGroup.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "HTTP outbound for package updates"
        );
        
        return securityGroup;
    }

    /**
     * Creates secure EC2 instance with all security configurations applied
     * REQUIREMENT: All resources properly connected (IAM role attached)
     */
    private Instance createSecureEC2Instance(Vpc vpc, SecurityGroup securityGroup, Role ec2Role) {
        // Create instance profile for the IAM role
        CfnInstanceProfile instanceProfile = CfnInstanceProfile.Builder.create(this, "SecureInstanceProfile")
            .instanceProfileName(APPLICATION_NAME + "-instance-profile-" + environmentSuffix.toLowerCase())
            .roles(Collections.singletonList(ec2Role.getRoleName()))
            .build();
        
        // User data script for initial configuration
        UserData userData = UserData.forLinux();
        userData.addCommands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y awscli",
            // Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            "{",
            "  \"logs\": {",
            "    \"logs_collected\": {",
            "      \"files\": {",
            "        \"collect_list\": [",
            "          {",
            "            \"file_path\": \"/var/log/messages\",",
            "            \"log_group_name\": \"" + "/aws/ec2/" + APPLICATION_NAME + "\",",
            "            \"log_stream_name\": \"{instance_id}/messages\"",
            "          }",
            "        ]",
            "      }",
            "    }",
            "  }",
            "}",
            "EOF",
            // Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
        );
        
        return Instance.Builder.create(this, "SecureApplicationInstance")
            .instanceName(APPLICATION_NAME + "-instance-" + environmentSuffix.toLowerCase())
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Cost-effective for demo
            .machineImage(MachineImage.latestAmazonLinux2())
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PUBLIC) // Public subnet for SSH access
                .build())
            .securityGroup(securityGroup)
            .role(ec2Role) // REQUIREMENT: IAM role properly attached
            .userData(userData)
            .keyName(EC2_KEY_PAIR_NAME) // Hardcoded key pair name for us-west-2 region
            // Additional security configurations
            .detailedMonitoring(true) // Enable detailed monitoring
            .build();
    }

    /**
     * Creates CloudFormation outputs for important resource information
     */
    private void createOutputs(Vpc vpc, Bucket applicationBucket, Instance ec2Instance) {
        software.amazon.awscdk.CfnOutput.Builder.create(this, "VPCId")
            .description("VPC ID")
            .value(vpc.getVpcId())
            .build();
        
        software.amazon.awscdk.CfnOutput.Builder.create(this, "S3BucketName")
            .description("Application S3 Bucket Name")
            .value(applicationBucket.getBucketName())
            .build();
        
        software.amazon.awscdk.CfnOutput.Builder.create(this, "EC2InstanceId")
            .description("EC2 Instance ID")
            .value(ec2Instance.getInstanceId())
            .build();
        
        software.amazon.awscdk.CfnOutput.Builder.create(this, "EC2PublicIP")
            .description("EC2 Instance Public IP")
            .value(ec2Instance.getInstancePublicIp())
            .build();
    }

    /**
     * Gets the environment suffix used by this stack.
     *
     * @return The environment suffix (e.g., 'dev', 'prod')
     */
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the CDK application.
     *
     * This method creates a CDK App instance and instantiates the TapStack
     * with appropriate configuration based on environment variables and context.
     *
     * @param args Command line arguments (not used in this application)
     */
    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack with us-west-2 region as required
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2") // REQUIREMENT: Deploy in us-west-2 region
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}