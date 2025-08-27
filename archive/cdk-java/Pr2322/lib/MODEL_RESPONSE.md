I'll design a secure AWS infrastructure using AWS CDK with Java that meets all your requirements. Here's a production-ready implementation:

```java
package com.example.secure.infrastructure;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.logs.LogGroup;
import software.amazon.awscdk.services.logs.RetentionDays;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Secure AWS Infrastructure Stack
 * 
 * This CDK application creates a secure AWS infrastructure with:
 * - VPC with public/private subnets
 * - EC2 instance with least privilege IAM role
 * - S3 bucket with encryption and access logging
 * - Security groups with restricted access
 * - CloudWatch logging
 * 
 * All resources follow AWS security best practices and least privilege principles.
 */
public class SecureInfrastructureApp {
    
    public static void main(final String[] args) {
        App app = new App();
        
        // Create stack with us-west-2 region as required
        new SecureInfrastructureStack(app, "SecureInfrastructureStack", 
            StackProps.builder()
                .env(Environment.builder()
                    .region("us-west-2")
                    .build())
                .build());
        
        app.synth();
    }
}

class SecureInfrastructureStack extends Stack {
    
    // Configuration constants
    private static final String ALLOWED_SSH_CIDR = "203.0.113.0/24"; // Replace with your IP range
    private static final String APPLICATION_NAME = "secure-app";
    
    public SecureInfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);
        
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
            .bucketName(APPLICATION_NAME + "-access-logs-" + this.getAccount())
            .versioned(false) // Logs don't need versioning
            .publicReadAccess(false)
            .publicWriteAccess(false)
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
            .build();
    }
    
    /**
     * Creates the main application S3 bucket with comprehensive security configurations
     * Includes encryption, access logging, and public access blocking
     */
    private Bucket createSecureS3Bucket(Bucket loggingBucket) {
        return Bucket.Builder.create(this, "SecureApplicationBucket")
            .bucketName(APPLICATION_NAME + "-data-" + this.getAccount())
            .versioned(true) // Enable versioning for data protection
            .publicReadAccess(false)
            .publicWriteAccess(false)
            // REQUIREMENT: Public access fully blocked
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            // REQUIREMENT: Server-side encryption enabled
            .encryption(BucketEncryption.S3_MANAGED)
            .enforceSSL(true) // Require HTTPS for all requests
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
            .build();
    }
    
    /**
     * Creates CloudWatch Log Group for application logging
     */
    private LogGroup createCloudWatchLogGroup() {
        return LogGroup.Builder.create(this, "ApplicationLogGroup")
            .logGroupName("/aws/ec2/" + APPLICATION_NAME)
            .retention(RetentionDays.ONE_MONTH) // 30 days retention
            .build();
    }
    
    /**
     * Creates IAM role for EC2 instance with least privilege policies
     * REQUIREMENT: Least privilege policies scoped only to application needs
     */
    private Role createEC2Role(Bucket applicationBucket, LogGroup logGroup) {
        // Create the IAM role that EC2 can assume
        Role role = Role.Builder.create(this, "SecureEC2Role")
            .roleName(APPLICATION_NAME + "-ec2-role")
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
            .securityGroupName(APPLICATION_NAME + "-security-group")
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
            .instanceProfileName(APPLICATION_NAME + "-instance-profile")
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
            .instanceName(APPLICATION_NAME + "-instance")
            .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Cost-effective for demo
            .machineImage(MachineImage.latestAmazonLinux2())
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder()
                .subnetType(SubnetType.PUBLIC) // Public subnet for SSH access
                .build())
            .securityGroup(securityGroup)
            .role(ec2Role) // REQUIREMENT: IAM role properly attached
            .userData(userData)
            .keyName("my-key-pair") // Replace with your key pair name
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
}
```

## Key Security Features Implemented

### 1. **Region Compliance** ✅
- All resources deployed in `us-west-2` region as required

### 2. **Least Privilege IAM Policies** ✅
- EC2 role with minimal permissions:
  - S3 access only to specific application bucket
  - CloudWatch logs access only to specific log group
  - CloudWatch metrics limited to EC2 namespace
  - SSM access for secure remote management

### 3. **Restricted SSH Access** ✅
- Security group allows SSH only on port 22
- Access restricted to specified IP range (`ALLOWED_SSH_CIDR`)
- Additional security with SSM Session Manager as SSH alternative

### 4. **Secure S3 Configuration** ✅
- **Server-side encryption**: S3-managed encryption enabled
- **Access logging**: Dedicated logging bucket with lifecycle policies
- **Public access blocked**: `BlockPublicAccess.BLOCK_ALL` enforced
- **Additional security**: SSL enforcement, versioning, lifecycle management

### 5. **Proper Resource Connections** ✅
- IAM role properly attached to EC2 instance
- Security group associated with EC2 instance
- S3 logging bucket referenced by main bucket
- CloudWatch log group connected via IAM permissions

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Install AWS CDK
   npm install -g aws-cdk
   
   # Configure AWS credentials
   aws configure
   ```

2. **Update Configuration**:
   - Replace `ALLOWED_SSH_CIDR` with your IP range
   - Replace `"my-key-pair"` with your EC2 key pair name

3. **Deploy**:
   ```bash
   # Bootstrap CDK (first time only)
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   
   # Deploy the stack
   cdk deploy
   ```

## Security Best Practices Included

- **Network Segmentation**: VPC with public/private subnets
- **Encryption**: S3 server-side encryption and SSL enforcement
- **Monitoring**: CloudWatch logging and detailed EC2 monitoring
- **Access Control**: Least privilege IAM policies and security groups
- **Cost Optimization**: Lifecycle policies and appropriate instance sizing
- **High Availability**: Multi-AZ deployment capability

This implementation provides a production-ready, secure AWS infrastructure that strictly adheres to all specified requirements while following AWS security best practices.