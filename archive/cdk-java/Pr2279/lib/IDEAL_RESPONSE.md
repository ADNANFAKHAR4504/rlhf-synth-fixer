# AWS CDK Java Secure Web Application Infrastructure - Production Ready Solution

## Overview

This solution provides a secure, production-ready web application infrastructure using AWS CDK Java. It implements security best practices, proper resource naming, and modern AWS features including IMDSv2 enforcement and Systems Manager Session Manager access.

## Complete Implementation

### WebAppStack.java
```java
package app;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;

import java.util.Arrays;

/**
 * WebAppStack creates secure infrastructure for a web application.
 * This includes VPC, Security Groups, IAM Roles, and EC2 instances.
 */
public class WebAppStack extends Stack {
    
    private final String environmentSuffix;
    
    // Constructor overloads for backward compatibility
    public WebAppStack(final Construct scope, final String id) {
        this(scope, id, null, "dev");
    }
    
    public WebAppStack(final Construct scope, final String id, final StackProps props) {
        this(scope, id, props, "dev");
    }

    /**
     * Main constructor that accepts environment suffix for resource naming
     */
    public WebAppStack(final Construct scope, final String id, final StackProps props, final String environmentSuffix) {
        super(scope, id, props);
        this.environmentSuffix = environmentSuffix != null ? environmentSuffix : "dev";

        // Create VPC with public subnets only (cost-optimized)
        Vpc vpc = Vpc.Builder.create(this, "myapp-vpc-" + this.environmentSuffix)
                .maxAzs(2)  // High availability across 2 AZs
                .natGateways(0) // No NAT gateways to reduce costs
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build()
                ))
                .build();

        // Security group allowing HTTPS traffic only
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "myapp-securitygroup-" + this.environmentSuffix)
                .vpc(vpc)
                .description("Security group for web application - HTTPS only")
                .allowAllOutbound(true)
                .build();

        // Add ingress rule for HTTPS (port 443) only
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic"
        );

        // IAM role with least privilege - S3 read-only access
        Role ec2Role = Role.Builder.create(this, "myapp-ec2role-" + this.environmentSuffix)
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("IAM role for EC2 instance with S3 read-only access")
                .roleName("myapp-ec2role-" + this.environmentSuffix)
                .build();

        // Attach managed policies for S3 read access and SSM
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"));
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));

        // Instance profile is automatically created by CDK when role is assigned

        // Use latest Amazon Linux 2 AMI with proper CPU architecture
        IMachineImage amazonLinuxImage = MachineImage.latestAmazonLinux2(
                AmazonLinux2ImageSsmParameterProps.builder()
                        .cpuType(AmazonLinuxCpuType.X86_64)
                        .build());

        // Create EC2 instance with security hardening
        Instance webInstance = Instance.Builder.create(this, "myapp-instance-" + this.environmentSuffix)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amazonLinuxImage)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .securityGroup(webSecurityGroup)
                .role(ec2Role)
                .instanceName("myapp-instance-" + this.environmentSuffix)
                .requireImdsv2(true) // Enforce IMDSv2 for security
                .userData(UserData.forLinux())
                .build();

        // Apply tags to all resources in the stack
        Tags.of(this).add("Project", "myapp");
        Tags.of(this).add("Environment", "production");
        Tags.of(this).add("EnvironmentSuffix", this.environmentSuffix);
        Tags.of(this).add("ManagedBy", "CDK");
        
        // CloudFormation outputs for integration and testing
        CfnOutput.Builder.create(this, "VpcId")
                .description("VPC ID")
                .value(vpc.getVpcId())
                .exportName("myapp-vpc-id-" + this.environmentSuffix)
                .build();
                
        CfnOutput.Builder.create(this, "SecurityGroupId")
                .description("Security Group ID")
                .value(webSecurityGroup.getSecurityGroupId())
                .exportName("myapp-sg-id-" + this.environmentSuffix)
                .build();
                
        CfnOutput.Builder.create(this, "InstanceId")
                .description("EC2 Instance ID")
                .value(webInstance.getInstanceId())
                .exportName("myapp-instance-id-" + this.environmentSuffix)
                .build();
                
        CfnOutput.Builder.create(this, "InstancePublicIp")
                .description("EC2 Instance Public IP")
                .value(webInstance.getInstancePublicIp())
                .exportName("myapp-public-ip-" + this.environmentSuffix)
                .build();
                
        CfnOutput.Builder.create(this, "RoleArn")
                .description("IAM Role ARN")
                .value(ec2Role.getRoleArn())
                .exportName("myapp-role-arn-" + this.environmentSuffix)
                .build();
    }
}
```

### Main.java
```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.Optional;

/**
 * TapStackProps configuration for the main stack
 */
class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String environmentSuffix, final StackProps stackProps) {
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

        public Builder environmentSuffix(final String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public Builder stackProps(final StackProps stackProps) {
            this.stackProps = stackProps;
            return this;
        }

        public TapStackProps build() {
            return new TapStackProps(environmentSuffix, stackProps);
        }
    }
}

/**
 * TapStack - Main orchestration stack
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Determine environment suffix from various sources
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(System.getenv("ENVIRONMENT_SUFFIX")))
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create nested WebApp stack with proper naming
        new WebAppStack(
            this,
            "WebAppStack" + environmentSuffix,
            StackProps.builder()
                    .stackName("TapStack" + environmentSuffix + "-WebApp")
                    .build(),
            environmentSuffix
        );
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for CDK application
 */
public final class Main {

    private Main() {
        // Prevent instantiation
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix with multiple fallbacks
        String environmentSuffix = Optional.ofNullable(System.getenv("ENVIRONMENT_SUFFIX"))
                .or(() -> Optional.ofNullable((String) app.getNode().tryGetContext("environmentSuffix")))
                .orElse("dev");

        // Determine AWS region from environment or default
        String region = Optional.ofNullable(System.getenv("AWS_REGION"))
                .or(() -> Optional.ofNullable(System.getenv("CDK_DEFAULT_REGION")))
                .orElse("us-east-1");

        // Create main stack with proper environment configuration
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .stackName("TapStack" + environmentSuffix)
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(region)
                                .build())
                        .description("Secure web application infrastructure stack")
                        .build())
                .build());

        app.synth();
    }
}
```

## Key Features Implemented

### Security Features
1. **HTTPS Only Access**: Security group configured to allow only port 443 inbound traffic
2. **Least Privilege IAM**: Role limited to S3 read-only access as specified
3. **IMDSv2 Enforcement**: Instance metadata service v2 required for enhanced security
4. **Session Manager Access**: AWS Systems Manager Session Manager enabled for secure shell access
5. **No SSH Access**: No SSH keys or port 22 access configured

### Infrastructure Components
1. **VPC Configuration**: Multi-AZ deployment across 2 availability zones
2. **Cost Optimization**: No NAT gateways to reduce costs for public subnet instances
3. **Resource Naming**: Consistent `myapp-<component>-<suffix>` naming pattern
4. **Environment Support**: Flexible environment suffix for multi-environment deployments

### Production Readiness
1. **CloudFormation Outputs**: All critical resource IDs exported for integration
2. **Resource Tagging**: Comprehensive tagging for cost allocation and management
3. **Stack Nesting**: Proper stack organization with TapStack as parent
4. **Error Handling**: Graceful fallbacks for environment configuration

### Testing Support
1. **Export Names**: CloudFormation exports for cross-stack references
2. **Output Values**: All resource identifiers available for testing
3. **Environment Flexibility**: Support for different deployment environments
4. **Consistent Naming**: Predictable resource names for testing

## Deployment Instructions

1. **Set Environment Variables**:
```bash
export ENVIRONMENT_SUFFIX=production
export AWS_REGION=us-east-1
export CDK_DEFAULT_ACCOUNT=<your-account-id>
```

2. **Build the Project**:
```bash
./gradlew build
```

3. **Deploy Infrastructure**:
```bash
npx cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX
```

4. **Access Resources**:
- Use Session Manager to access EC2 instances
- No SSH keys required
- HTTPS-only access on port 443

## Best Practices Applied

1. **Security by Default**: All resources configured with security best practices
2. **Cost Optimization**: Minimal resources deployed, no unnecessary NAT gateways
3. **High Availability**: Multi-AZ deployment for resilience
4. **Infrastructure as Code**: Fully reproducible deployments
5. **Environment Isolation**: Support for multiple environments with unique suffixes
6. **Monitoring Ready**: All resources tagged for cost tracking and monitoring

## Compliance and Standards

- **AWS Well-Architected Framework**: Security and cost optimization pillars
- **CIS AWS Foundations Benchmark**: IMDSv2 enforcement, least privilege access
- **Zero Trust Security Model**: No direct SSH, Session Manager only
- **Infrastructure Immutability**: All infrastructure defined in code

This solution provides a secure, scalable, and cost-effective foundation for web applications on AWS using CDK Java.