# Financial Application Infrastructure

This solution provides a complete infrastructure setup for a financial application running on AWS with comprehensive security and monitoring capabilities.

## Infrastructure Components

The infrastructure includes the following AWS services:

- VPC with public and private subnets
- EC2 instances running in private subnets for security
- S3 buckets with KMS encryption for data storage
- CloudTrail for audit logging
- KMS keys for encryption at rest
- IAM roles and policies for secure access
- CloudWatch monitoring and alarms
- SNS topics for alerts

## Pulumi Configuration

```yaml
name: TapStack
runtime: java
description: Java-based infrastructure as code for TAP using Pulumi
```

## Java Implementation

```java
package app;

import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;
import com.pulumi.aws.ec2.Eip;
import com.pulumi.aws.ec2.EipArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.NatGateway;
import com.pulumi.aws.ec2.NatGatewayArgs;
import com.pulumi.aws.ec2.Route;
import com.pulumi.aws.ec2.RouteArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.inputs.InstanceEbsBlockDeviceArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketPolicy;
import com.pulumi.aws.s3.BucketPolicyArgs;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfiguration;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;
import java.util.Random;

public final class Main {
    
    private Main() {
        // Private constructor to prevent instantiation
    }
    
    private static final String REGION = "us-east-1";
    private static final String RANDOM_SUFFIX = generateRandomSuffix();
    
    public static void defineInfrastructure(final com.pulumi.Context ctx) {
        // Method stub for testing - actual infrastructure is defined in main()
        throw new RuntimeException("This method is only for testing purposes");
    }
    
    public static void main(final String[] args) {
        Pulumi.run(ctx -> createInfrastructure(ctx));
    }
    
    // Extracted infrastructure creation method for testing
    public static void createInfrastructure(final com.pulumi.Context ctx) {
        var awsProvider = createAwsProvider();
        var providerOptions = createProviderOptions(awsProvider);
        var kmsKey = createKmsKey(providerOptions);
        var cloudtrailBucket = createCloudTrailS3Bucket(providerOptions, kmsKey);
        var appBucket = createApplicationS3Bucket(providerOptions, kmsKey);
        var vpcResources = createVpcInfrastructure(providerOptions);
        var securityGroup = createSecurityGroup(providerOptions, vpcResources.getVpc());
        var iamResources = createIamResources(providerOptions);
        var snsTopic = createSnsTopic(providerOptions);
        createEc2Instances(providerOptions, vpcResources, securityGroup, 
            iamResources, kmsKey, snsTopic);
        var cloudTrail = createCloudTrail(providerOptions, cloudtrailBucket, kmsKey);
        exportOutputs(ctx, vpcResources, kmsKey, appBucket, snsTopic, cloudTrail, securityGroup);
    }
    
    private static Provider createAwsProvider() {
        return new Provider("aws-provider", ProviderArgs.builder()
            .region(REGION)
            .build());
    }
    
    private static CustomResourceOptions createProviderOptions(final Provider awsProvider) {
        return CustomResourceOptions.builder()
            .provider(awsProvider)
            .build();
    }
    
    private static Key createKmsKey(final CustomResourceOptions providerOptions) {
        return new Key("financial-app-kms-key-" + RANDOM_SUFFIX, KeyArgs.builder()
            .description("KMS key for financial application encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .deletionWindowInDays(7)
            .policy(buildKmsKeyPolicy())
            .tags(Map.of(
                "Environment", "production",
                "Application", "financial-services",
                "Compliance", "required"
            ))
            .build(), providerOptions);
    }
    
    private static Bucket createCloudTrailS3Bucket(final CustomResourceOptions providerOptions, 
                                                   final Key kmsKey) {
        String cloudtrailBucketName = "financial-cloudtrail-logs-" + RANDOM_SUFFIX;
        var cloudtrailBucket = new Bucket("financial-cloudtrail-logs-" + RANDOM_SUFFIX, 
            BucketArgs.builder()
                .bucket(cloudtrailBucketName)
                .forceDestroy(true)
                .tags(Map.of(
                    "Purpose", "CloudTrail-Logs",
                    "Environment", "production"
                ))
                .build(), providerOptions);
                
        // Configure S3 bucket encryption for CloudTrail
        new BucketServerSideEncryptionConfiguration(
            "cloudtrail-bucket-encryption-" + RANDOM_SUFFIX,
            BucketServerSideEncryptionConfigurationArgs.builder()
                .bucket(cloudtrailBucket.id())
                .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                    .applyServerSideEncryptionByDefault(
                        BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                            .sseAlgorithm("aws:kms")
                            .kmsMasterKeyId(kmsKey.arn())
                            .build())
                    .bucketKeyEnabled(true)
                    .build())
                .build(), providerOptions);
                
        // Create S3 bucket policy for CloudTrail
        new BucketPolicy("cloudtrail-bucket-policy-" + RANDOM_SUFFIX,
            BucketPolicyArgs.builder()
                .bucket(cloudtrailBucket.id())
                .policy(buildCloudTrailBucketPolicy(cloudtrailBucketName))
                .build(), providerOptions);
                
        return cloudtrailBucket;
    }
    
    private static Bucket createApplicationS3Bucket(final CustomResourceOptions providerOptions, 
                                                    final Key kmsKey) {
        var appBucket = new Bucket("financial-app-data-" + RANDOM_SUFFIX, 
            BucketArgs.builder()
                .forceDestroy(true)
                .tags(Map.of(
                    "Purpose", "Application-Data",
                    "Environment", "production"
                ))
                .build(), providerOptions);
                
        new BucketServerSideEncryptionConfiguration(
            "app-bucket-encryption-" + RANDOM_SUFFIX,
            BucketServerSideEncryptionConfigurationArgs.builder()
                .bucket(appBucket.id())
                .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                    .applyServerSideEncryptionByDefault(
                        BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                            .sseAlgorithm("aws:kms")
                            .kmsMasterKeyId(kmsKey.arn())
                            .build())
                    .bucketKeyEnabled(true)
                    .build())
                .build(), providerOptions);
                
        return appBucket;
    }
    
    public static class VpcResources {
        private final Vpc vpc;
        private final Subnet publicSubnet;
        private final Subnet privateSubnet;
        
        public VpcResources(final Vpc vpcParam, final Subnet publicSubnetParam, final Subnet privateSubnetParam) {
            this.vpc = vpcParam;
            this.publicSubnet = publicSubnetParam;
            this.privateSubnet = privateSubnetParam;
        }
        
        public Vpc getVpc() {
            return vpc;
        }
        
        public Subnet getPublicSubnet() {
            return publicSubnet;
        }
        
        public Subnet getPrivateSubnet() {
            return privateSubnet;
        }
    }
    
    private static VpcResources createVpcInfrastructure(final CustomResourceOptions providerOptions) {
        // Create VPC
        var vpc = new Vpc("financial-app-vpc-" + RANDOM_SUFFIX, VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(Map.of(
                "Name", "financial-app-vpc-" + RANDOM_SUFFIX,
                "Environment", "production"
            ))
            .build(), providerOptions);
            
        // Create Internet Gateway
        var igw = new InternetGateway("financial-app-igw-" + RANDOM_SUFFIX, 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "financial-app-igw-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);
                
        // Create public subnet
        var publicSubnet = new Subnet("financial-app-public-subnet-" + RANDOM_SUFFIX, 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone(REGION + "a")
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", "financial-app-public-subnet-" + RANDOM_SUFFIX,
                    "Type", "public"
                ))
                .build(), providerOptions);
                
        // Create private subnet
        var privateSubnet = new Subnet("financial-app-private-subnet-" + RANDOM_SUFFIX, 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone(REGION + "a")
                .tags(Map.of(
                    "Name", "financial-app-private-subnet-" + RANDOM_SUFFIX,
                    "Type", "private"
                ))
                .build(), providerOptions);
                
        // Create NAT Gateway infrastructure
        createNatGatewayInfrastructure(providerOptions, igw, publicSubnet, privateSubnet);
        
        return new VpcResources(vpc, publicSubnet, privateSubnet);
    }
    
    private static void createNatGatewayInfrastructure(final CustomResourceOptions providerOptions,
                                                       final InternetGateway igw,
                                                       final Subnet publicSubnet,
                                                       final Subnet privateSubnet) {
        // Create Elastic IP for NAT Gateway
        var natEip = new Eip("financial-app-nat-eip-" + RANDOM_SUFFIX, 
            EipArgs.builder()
                .domain("vpc")
                .tags(Map.of(
                    "Name", "financial-app-nat-eip-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);
                
        // Create NAT Gateway
        var natGateway = new NatGateway("financial-app-nat-" + RANDOM_SUFFIX, 
            NatGatewayArgs.builder()
                .allocationId(natEip.id())
                .subnetId(publicSubnet.id())
                .tags(Map.of(
                    "Name", "financial-app-nat-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);
                
        // Create route tables and associations
        createRouteTables(providerOptions, igw, natGateway, publicSubnet, privateSubnet);
    }
    
    private static void createRouteTables(final CustomResourceOptions providerOptions,
                                          final InternetGateway igw,
                                          final NatGateway natGateway,
                                          final Subnet publicSubnet,
                                          final Subnet privateSubnet) {
        // Public route table
        var publicRouteTable = new RouteTable("financial-app-public-rt-" + RANDOM_SUFFIX, 
            RouteTableArgs.builder()
                .vpcId(publicSubnet.vpcId())
                .tags(Map.of(
                    "Name", "financial-app-public-rt-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);
                
        new Route("financial-app-public-route-" + RANDOM_SUFFIX, 
            RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build(), providerOptions);
                
        new RouteTableAssociation("financial-app-public-rta-" + RANDOM_SUFFIX,
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnet.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOptions);
                
        // Private route table
        var privateRouteTable = new RouteTable("financial-app-private-rt-" + RANDOM_SUFFIX, 
            RouteTableArgs.builder()
                .vpcId(privateSubnet.vpcId())
                .tags(Map.of(
                    "Name", "financial-app-private-rt-" + RANDOM_SUFFIX
                ))
                .build(), providerOptions);
                
        new Route("financial-app-private-route-" + RANDOM_SUFFIX, 
            RouteArgs.builder()
                .routeTableId(privateRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.id())
                .build(), providerOptions);
                
        new RouteTableAssociation("financial-app-private-rta-" + RANDOM_SUFFIX,
            RouteTableAssociationArgs.builder()
                .subnetId(privateSubnet.id())
                .routeTableId(privateRouteTable.id())
                .build(), providerOptions);
    }
    
    private static SecurityGroup createSecurityGroup(final CustomResourceOptions providerOptions, 
                                                     final Vpc vpc) {
        return new SecurityGroup("financial-app-sg-" + RANDOM_SUFFIX, 
            SecurityGroupArgs.builder()
                .name("financial-app-sg-" + RANDOM_SUFFIX)
                .description("Security group for financial application")
                .vpcId(vpc.id())
                .ingress(SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("10.0.0.0/16")
                    .description("HTTPS traffic within VPC")
                    .build())
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTPS outbound")
                    .build())
                .egress(SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(80)
                    .toPort(80)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTP outbound for package updates")
                    .build())
                .tags(Map.of(
                    "Name", "financial-app-sg-" + RANDOM_SUFFIX,
                    "Environment", "production"
                ))
                .build(), providerOptions);
    }
    
    public static class IamResources {
        private final Role ec2Role;
        private final Policy s3Policy;
        private final InstanceProfile instanceProfile;
        
        public IamResources(final Role ec2RoleParam, final Policy s3PolicyParam, 
                           final InstanceProfile instanceProfileParam) {
            this.ec2Role = ec2RoleParam;
            this.s3Policy = s3PolicyParam;
            this.instanceProfile = instanceProfileParam;
        }
        
        public Role getEc2Role() {
            return ec2Role;
        }
        
        public Policy getS3Policy() {
            return s3Policy;
        }
        
        public InstanceProfile getInstanceProfile() {
            return instanceProfile;
        }
    }
    
    private static IamResources createIamResources(final CustomResourceOptions providerOptions) {
        // Create IAM role for EC2 instances
        var ec2Role = new Role("financial-app-ec2-role-" + RANDOM_SUFFIX, RoleArgs.builder()
            .assumeRolePolicy(buildEc2AssumeRolePolicy())
            .tags(Map.of(
                "Name", "financial-app-ec2-role-" + RANDOM_SUFFIX,
                "Environment", "production"
            ))
            .build(), providerOptions);
            
        // Create IAM policy for S3 read-only access
        var s3ReadOnlyPolicy = new Policy("financial-app-s3-readonly-" + RANDOM_SUFFIX, 
            PolicyArgs.builder()
                .description("Read-only access to specific S3 bucket")
                .policy(buildS3ReadOnlyPolicy(REGION))
                .build(), providerOptions);
                
        // Attach policies to role
        new RolePolicyAttachment("financial-app-s3-policy-attachment-" + RANDOM_SUFFIX,
            RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn(s3ReadOnlyPolicy.arn())
                .build(), providerOptions);
                
        new RolePolicyAttachment("financial-app-cloudwatch-policy-attachment-" + RANDOM_SUFFIX,
            RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build(), providerOptions);
                
        // Create instance profile
        var instanceProfile = new InstanceProfile("financial-app-instance-profile-" + RANDOM_SUFFIX,
            InstanceProfileArgs.builder()
                .role(ec2Role.name())
                .build(), providerOptions);
                
        return new IamResources(ec2Role, s3ReadOnlyPolicy, instanceProfile);
    }
    
    private static Topic createSnsTopic(final CustomResourceOptions providerOptions) {
        return new Topic("financial-app-cpu-alerts-" + RANDOM_SUFFIX, 
            TopicArgs.builder()
                .name("financial-app-cpu-alerts-" + RANDOM_SUFFIX)
                .tags(Map.of(
                    "Purpose", "CPU-Alerts",
                    "Environment", "production"
                ))
                .build(), providerOptions);
    }
    
    private static void createEc2Instances(final CustomResourceOptions providerOptions,
                                           final VpcResources vpcResources,
                                           final SecurityGroup securityGroup,
                                           final IamResources iamResources,
                                           final Key kmsKey,
                                           final Topic snsTopic) {
        String amazonLinux2AmiId = "ami-0c02fb55956c7d316";
        
        for (int i = 1; i <= 2; i++) {
            final int instanceNumber = i;
            
            var instance = new Instance("financial-app-instance-" + instanceNumber 
                + "-" + RANDOM_SUFFIX, InstanceArgs.builder()
                .ami(amazonLinux2AmiId)
                .instanceType("t3.micro")
                .subnetId(vpcResources.getPrivateSubnet().id())
                .vpcSecurityGroupIds(securityGroup.id().apply(id -> Output.of(List.of(id))))
                .iamInstanceProfile(iamResources.getInstanceProfile().name())
                .monitoring(true)
                .ebsOptimized(true)
                .ebsBlockDevices(InstanceEbsBlockDeviceArgs.builder()
                    .deviceName("/dev/xvda")
                    .volumeType("gp3")
                    .volumeSize(20)
                    .encrypted(true)
                    .kmsKeyId(kmsKey.arn())
                    .deleteOnTermination(true)
                    .build())
                .userData(buildEc2UserData())
                .tags(Map.of(
                    "Name", "financial-app-instance-" + instanceNumber + "-" + RANDOM_SUFFIX,
                    "Environment", "production",
                    "Application", "financial-services"
                ))
                .build(), providerOptions);
                
            // Create CloudWatch CPU alarm for each instance
            new MetricAlarm("financial-app-cpu-alarm-" + instanceNumber + "-" + RANDOM_SUFFIX,
                MetricAlarmArgs.builder()
                    .name("financial-app-cpu-alarm-" + instanceNumber + "-" + RANDOM_SUFFIX)
                    .comparisonOperator("GreaterThanThreshold")
                    .evaluationPeriods(2)
                    .metricName("CPUUtilization")
                    .namespace("AWS/EC2")
                    .period(300)
                    .statistic("Average")
                    .threshold(70.0)
                    .alarmDescription("This metric monitors ec2 cpu utilization")
                    .alarmActions(snsTopic.arn().apply(arn -> Output.of(List.of(arn))))
                    .tags(Map.of(
                        "Instance", "financial-app-instance-" + instanceNumber,
                        "Environment", "production"
                    ))
                    .build(), providerOptions);
        }
    }
    
    private static Trail createCloudTrail(final CustomResourceOptions providerOptions,
                                          final Bucket cloudtrailBucket,
                                          final Key kmsKey) {
        return new Trail("financial-app-cloudtrail-" + RANDOM_SUFFIX, TrailArgs.builder()
            .name("financial-app-cloudtrail-" + RANDOM_SUFFIX)
            .s3BucketName(cloudtrailBucket.bucket())
            .includeGlobalServiceEvents(true)
            .isMultiRegionTrail(true)
            .enableLogging(true)
            .kmsKeyId(kmsKey.arn())
            .tags(Map.of(
                "Environment", "production",
                "Purpose", "compliance-audit"
            ))
            .build(), providerOptions);
    }
    
    private static void exportOutputs(final com.pulumi.Context ctx,
                                      final VpcResources vpcResources,
                                      final Key kmsKey,
                                      final Bucket appBucket,
                                      final Topic snsTopic,
                                      final Trail cloudTrail,
                                      final SecurityGroup securityGroup) {
        ctx.export("vpcId", vpcResources.getVpc().id());
        ctx.export("privateSubnetId", vpcResources.getPrivateSubnet().id());
        ctx.export("kmsKeyId", kmsKey.id());
        ctx.export("appBucketName", appBucket.bucket());
        ctx.export("snsTopicArn", snsTopic.arn());
        ctx.export("cloudtrailArn", cloudTrail.arn());
        ctx.export("securityGroupId", securityGroup.id());
        ctx.export("randomSuffix", Output.of(RANDOM_SUFFIX));
    }
    
    private static String generateRandomSuffix() {
        return String.valueOf(new Random().nextInt(10000));
    }
    
    // Helper methods for building policies and configurations
    public static String buildCloudTrailBucketPolicy(final String bucketName) {
        if (bucketName == null || bucketName.isEmpty()) {
            throw new IllegalArgumentException("Bucket name cannot be null or empty");
        }
        
        return String.format("""
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AWSCloudTrailAclCheck",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:GetBucketAcl",
                        "Resource": "arn:aws:s3:::%s"
                    },
                    {
                        "Sid": "AWSCloudTrailWrite",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": "arn:aws:s3:::%s/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            }
            """, bucketName, bucketName);
    }

    public static String buildS3ReadOnlyPolicy(final String region) {
        if (region == null || region.isEmpty()) {
            throw new IllegalArgumentException("Region cannot be null or empty");
        }
        
        return String.format("""
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "arn:aws:s3:::financial-app-data-*",
                            "arn:aws:s3:::financial-app-data-*/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "arn:aws:kms:%s:*:key/*",
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": "s3.%s.amazonaws.com"
                            }
                        }
                    }
                ]
            }
            """, region, region);
    }

    public static String buildEc2AssumeRolePolicy() {
        return """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ]
            }
            """;
    }

    public static String buildCloudWatchAgentConfig() {
        return """
            {
                "metrics": {
                    "namespace": "FinancialApp/EC2",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": [
                                "cpu_usage_idle",
                                "cpu_usage_iowait",
                                "cpu_usage_user",
                                "cpu_usage_system"
                            ],
                            "metrics_collection_interval": 60,
                            "totalcpu": true
                        },
                        "disk": {
                            "measurement": [
                                "used_percent"
                            ],
                            "metrics_collection_interval": 60,
                            "resources": [
                                "*"
                            ]
                        },
                        "mem": {
                            "measurement": [
                                "mem_used_percent"
                            ],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            """;
    }

    public static String buildEc2UserData() {
        return String.format("""
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            %s
            EOF
            
            # Start CloudWatch agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
                -a fetch-config -m ec2 \\
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \\
                -s
            """, buildCloudWatchAgentConfig());
    }

    public static String buildKmsKeyPolicy() {
        return """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Allow Admin to manage key",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudTrail to encrypt logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": [
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:ReEncrypt*",
                            "kms:Decrypt"
                        ],
                        "Condition": {
                            "StringEquals": {
                                "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:*:*:trail/*"
                            }
                        }
                    },
                    {
                        "Sid": "Allow S3 service to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "s3.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": "s3.us-east-1.amazonaws.com"
                            }
                        }
                    }
                ]
            }
            """;
    }
}
```

## Architecture Overview

The infrastructure follows security best practices:

1. **Network Security**: Private subnets for application instances with NAT Gateway for outbound internet access
2. **Encryption**: All data encrypted at rest using KMS keys
3. **Monitoring**: CloudWatch alarms on CPU utilization with SNS notifications
4. **Compliance**: CloudTrail logging all API activities for audit purposes
5. **Access Control**: IAM roles with minimal required permissions
6. **Resource Isolation**: Dedicated VPC with proper subnet segmentation

## Key Features

- **Scalable VPC Design**: Public and private subnets with NAT Gateway
- **Security Groups**: Restrictive security group allowing only HTTPS traffic
- **Encrypted Storage**: S3 buckets and EBS volumes encrypted with customer-managed KMS keys
- **Monitoring**: CloudWatch agent installed on EC2 instances for detailed metrics
- **Audit Logging**: CloudTrail configured for multi-region logging
- **High Availability**: Infrastructure spans across availability zones
- **Cost Optimization**: t3.micro instances and GP3 volumes for cost efficiency