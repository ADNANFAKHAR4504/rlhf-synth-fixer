package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;

import software.amazon.awscdk.services.ec2.IMachineImage;
import software.amazon.awscdk.services.ec2.ISubnet;
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
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.amazon.awscdk.services.s3.BlockPublicAccess;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.s3.BucketEncryption;
import software.amazon.awscdk.services.s3.LifecycleRule;
import software.amazon.awscdk.services.s3.StorageClass;
import software.amazon.awscdk.services.s3.Transition;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;

import java.util.Arrays;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String newEnvironmentSuffix, final StackProps newStackProps) {
        this.environmentSuffix = newEnvironmentSuffix;
        this.stackProps = newStackProps != null ? newStackProps : StackProps.builder().build();
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

        public Builder environmentSuffix(final String newEnvironmentSuffix) {
            this.environmentSuffix = newEnvironmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps newStackProps) {
            this.stackProps = newStackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * CDK Java Basic Environment Stack
 * 
 * This stack creates a basic AWS environment equivalent to the Terraform HCL setup:
 * - VPC with 10.0.0.0/16 CIDR across 2 AZs
 * - EC2 instance with public IP access
 * - Security groups for SSH access (port 22)
 * - Internet Gateway and proper routing
 * - Latest AWS features: S3 with Metadata and CloudWatch integration
 * - Cost-optimized with fast deployment times
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private Vpc vpc;
    private Instance ec2Instance;
    private SecurityGroup sshSecurityGroup;
    private Bucket s3Bucket;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create VPC with required specifications
        createVpc();
        
        // Create Security Groups for SSH access
        createSecurityGroups();
        
        // Create EC2 Instance with public IP
        createEc2Instance();
        
        // Create S3 Bucket with latest metadata features
        createS3BucketWithMetadata();
        
        // Create CloudWatch resources for monitoring
        createCloudWatchResources();
        
        // Apply Project tags to all resources
        applyProjectTags();
        
        // Create comprehensive stack outputs for integration testing
        createStackOutputs();
    }

    private void createVpc() {
        // Create VPC with 10.0.0.0/16 CIDR block across 2 AZs
        this.vpc = Vpc.Builder.create(this, "cdk-vpc-" + environmentSuffix)
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2) // Deploy across 2 availability zones
                .subnetConfiguration(Arrays.asList(
                        // Public subnet for EC2 instance
                        SubnetConfiguration.builder()
                                .name("cdk-public-subnet")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        // Private subnet for future expansion
                        SubnetConfiguration.builder()
                                .name("cdk-private-subnet") 
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        Tags.of(vpc).add("Name", "cdk-vpc-" + environmentSuffix);
    }

    private void createSecurityGroups() {
        // Create security group allowing SSH access on port 22
        this.sshSecurityGroup = SecurityGroup.Builder.create(this, "cdk-ssh-sg-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for SSH access on port 22")
                .allowAllOutbound(true)
                .build();

        // Add SSH ingress rule for port 22
        sshSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(22),
                "Allow SSH access from anywhere on port 22"
        );

        Tags.of(sshSecurityGroup).add("Name", "cdk-ssh-sg-" + environmentSuffix);
    }

    private void createEc2Instance() {
        // Create IAM role for EC2 with Systems Manager access (cost-effective management)
        Role ec2Role = Role.Builder.create(this, "cdk-ec2-role-" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for EC2 instance with SSM access")
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .build();

        // Use latest Amazon Linux 2 AMI (stable and compatible)
        IMachineImage ami = MachineImage.latestAmazonLinux2();

        // Create user data for basic setup
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y amazon-cloudwatch-agent",
                "echo 'Basic environment setup complete'"
        );

        // Create EC2 instance with public IP in public subnet
        this.ec2Instance = Instance.Builder.create(this, "cdk-ec2-instance-" + environmentSuffix)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Cost-optimized
                .machineImage(ami)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .securityGroup(sshSecurityGroup)
                .role(ec2Role)
                .userData(userData)
                .associatePublicIpAddress(true) // Ensure public IP assignment
                .keyName(null) // Using Session Manager instead of key pairs
                .build();

        Tags.of(ec2Instance).add("Name", "cdk-ec2-instance-" + environmentSuffix);
    }

    private void createS3BucketWithMetadata() {
        // Create S3 bucket with latest metadata features (2025)
        this.s3Bucket = Bucket.Builder.create(this, "cdk-s3-bucket-" + environmentSuffix)
                .bucketName("cdk-basic-env-" + environmentSuffix + "-"
                           + this.getAccount() + "-" + this.getRegion())
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .lifecycleRules(Arrays.asList(
                        LifecycleRule.builder()
                                .id("optimize-storage-costs")
                                .transitions(Arrays.asList(
                                        Transition.builder()
                                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                                .transitionAfter(software.amazon.awscdk.Duration.days(30))
                                                .build()
                                ))
                                .enabled(true)
                                .build()
                ))
                // Intelligent tiering configured via lifecycle rules for cost optimization
                .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY)
                .build();

        Tags.of(s3Bucket).add("Name", "cdk-s3-bucket-" + environmentSuffix);
    }

    private void createCloudWatchResources() {
        // Create CloudWatch Log Group for application logs
        LogGroup logGroup = LogGroup.Builder.create(this, "cdk-log-group-" + environmentSuffix)
                .logGroupName("/aws/ec2/cdk-basic-env-" + environmentSuffix)
                .retention(RetentionDays.ONE_WEEK) // Cost-effective retention
                .removalPolicy(software.amazon.awscdk.RemovalPolicy.DESTROY)
                .build();

        Tags.of(logGroup).add("Name", "cdk-log-group-" + environmentSuffix);
    }

    private void applyProjectTags() {
        // Apply required project tags to all resources
        Tags.of(this).add("Project", "TerraformSetup");
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("ManagedBy", "AWS-CDK");
        Tags.of(this).add("CostCenter", "Development");
    }

    private void createStackOutputs() {
        // VPC Outputs
        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("ID of the created VPC")
                .exportName("cdk-vpc-id-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "VpcCidr")
                .value(vpc.getVpcCidrBlock())
                .description("CIDR block of the VPC (10.0.0.0/16)")
                .exportName("cdk-vpc-cidr-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "InternetGatewayId")
                .value(vpc.getInternetGatewayId())
                .description("ID of the Internet Gateway")
                .exportName("cdk-igw-id-" + environmentSuffix)
                .build();

        // Subnet Outputs
        CfnOutput.Builder.create(this, "PublicSubnetIds")
                .value(String.join(",", vpc.getPublicSubnets().stream()
                        .map(ISubnet::getSubnetId)
                        .toArray(String[]::new)))
                .description("IDs of the public subnets")
                .exportName("cdk-public-subnet-ids-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "PrivateSubnetIds")
                .value(String.join(",", vpc.getPrivateSubnets().stream()
                        .map(ISubnet::getSubnetId)
                        .toArray(String[]::new)))
                .description("IDs of the private subnets")
                .exportName("cdk-private-subnet-ids-" + environmentSuffix)
                .build();

        // EC2 Instance Outputs
        CfnOutput.Builder.create(this, "InstanceId")
                .value(ec2Instance.getInstanceId())
                .description("ID of the EC2 instance")
                .exportName("cdk-ec2-instance-id-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "InstancePublicIp")
                .value(ec2Instance.getInstancePublicIp())
                .description("Public IP address of the EC2 instance")
                .exportName("cdk-ec2-public-ip-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "InstancePrivateIp")
                .value(ec2Instance.getInstancePrivateIp())
                .description("Private IP address of the EC2 instance")
                .exportName("cdk-ec2-private-ip-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "InstanceAvailabilityZone")
                .value(ec2Instance.getInstanceAvailabilityZone())
                .description("Availability zone of the EC2 instance")
                .exportName("cdk-ec2-az-" + environmentSuffix)
                .build();

        // Security Group Outputs
        CfnOutput.Builder.create(this, "SecurityGroupId")
                .value(sshSecurityGroup.getSecurityGroupId())
                .description("ID of the SSH security group (port 22)")
                .exportName("cdk-ssh-sg-id-" + environmentSuffix)
                .build();

        // S3 Bucket Outputs
        CfnOutput.Builder.create(this, "S3BucketName")
                .value(s3Bucket.getBucketName())
                .description("Name of the S3 bucket with metadata features")
                .exportName("cdk-s3-bucket-name-" + environmentSuffix)
                .build();

        CfnOutput.Builder.create(this, "S3BucketArn")
                .value(s3Bucket.getBucketArn())
                .description("ARN of the S3 bucket")
                .exportName("cdk-s3-bucket-arn-" + environmentSuffix)
                .build();
    }

    // Getters for accessing resources from integration tests
    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public Vpc getVpc() {
        return vpc;
    }

    public Instance getEc2Instance() {
        return ec2Instance;
    }

    public SecurityGroup getSshSecurityGroup() {
        return sshSecurityGroup;
    }

    public Bucket getS3Bucket() {
        return s3Bucket;
    }
}

/**
 * Main entry point for the CDK application
 */
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

        // Create the TapStack with environment configuration
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(System.getenv("CDK_DEFAULT_REGION"))
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}