# CDK Java Infrastructure - Ideal Response

## Overview

This solution provides a production-ready AWS VPC infrastructure using CDK Java with the following components:
- VPC with CIDR 10.0.0.0/16 across 2 availability zones
- Public subnets with Internet Gateway access
- EC2 instance with restricted SSH access
- Comprehensive security and IAM configuration
- Environment-based resource naming and tagging

## Main Application File

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import java.util.Arrays;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
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
 * VPC Infrastructure Stack
 * 
 * Creates a complete VPC infrastructure with public subnets, security groups,
 * and an EC2 instance with restricted SSH access.
 */
class VpcInfrastructureStack extends Stack {
    private final Vpc vpc;
    private final Instance ec2Instance;
    private final SecurityGroup sshSecurityGroup;

    public VpcInfrastructureStack(final Construct scope, final String id, final String environmentSuffix, final StackProps props) {
        super(scope, id, props);

        // Create VPC with specified CIDR
        this.vpc = Vpc.Builder.create(this, "MainVpc")
                .vpcName("tap-" + environmentSuffix + "-vpc")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2) // Use 2 availability zones
                .enableDnsSupport(true)
                .enableDnsHostnames(true)
                .subnetConfiguration(Arrays.asList(
                    SubnetConfiguration.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .name("PublicSubnet")
                        .cidrMask(24)
                        .build()
                ))
                .natGateways(0) // No NAT gateways needed for public subnets only
                .build();

        // Create security group for SSH access
        this.sshSecurityGroup = SecurityGroup.Builder.create(this, "SshSecurityGroup")
                .securityGroupName("tap-" + environmentSuffix + "-ssh-sg")
                .vpc(vpc)
                .description("Security group for SSH access to EC2 instances")
                .allowAllOutbound(true)
                .build();

        // Add SSH rule restricted to specific IP
        sshSecurityGroup.addIngressRule(
            Peer.ipv4("203.0.113.0/32"),
            Port.tcp(22),
            "SSH access from specific IP"
        );

        // Create IAM role for EC2 instance with Session Manager support
        Role ec2Role = Role.Builder.create(this, "Ec2Role")
                .roleName("tap-" + environmentSuffix + "-ec2-role")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .build();

        // Get the latest Amazon Linux 2 AMI
        IMachineImage amazonLinuxAmi = MachineImage.latestAmazonLinux2(
            AmazonLinux2ImageSsmParameterProps.builder()
                .cpuType(AmazonLinuxCpuType.X86_64)
                .cachedInContext(false)
                .build()
        );

        // Create user data script for basic setup
        UserData userData = UserData.forLinux();
        userData.addCommands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "echo 'EC2 instance initialized successfully' > /var/log/user-data.log"
        );

        // Create EC2 instance in the first public subnet
        this.ec2Instance = Instance.Builder.create(this, "WebServerInstance")
                .instanceName("tap-" + environmentSuffix + "-ec2-instance")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Cost-optimized instance type
                .machineImage(amazonLinuxAmi)
                .securityGroup(sshSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .availabilityZones(Arrays.asList(vpc.getAvailabilityZones().get(0)))
                    .build())
                .role(ec2Role)
                .userData(userData)
                .associatePublicIpAddress(true)
                .build();

        // Add comprehensive tags to all resources
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Project", "VpcInfrastructure");
        Tags.of(this).add("CreatedBy", "CDK");
        Tags.of(this).add("Purpose", "BasicVpcSetup");
        Tags.of(this).add("ManagedBy", "Infrastructure-as-Code");
        
        // Create outputs for integration testing and cross-stack references
        CfnOutput.Builder.create(this, "VpcId")
                .value(vpc.getVpcId())
                .description("VPC ID")
                .exportName("VpcId-" + environmentSuffix)
                .build();
        
        CfnOutput.Builder.create(this, "InstanceId")
                .value(ec2Instance.getInstanceId())
                .description("EC2 Instance ID")
                .exportName("InstanceId-" + environmentSuffix)
                .build();
        
        CfnOutput.Builder.create(this, "InstancePublicIp")
                .value(ec2Instance.getInstancePublicIp())
                .description("EC2 Instance Public IP")
                .exportName("InstancePublicIp-" + environmentSuffix)
                .build();
        
        CfnOutput.Builder.create(this, "SecurityGroupId")
                .value(sshSecurityGroup.getSecurityGroupId())
                .description("SSH Security Group ID")
                .exportName("SecurityGroupId-" + environmentSuffix)
                .build();
        
        // Output subnet IDs for reference
        CfnOutput.Builder.create(this, "PublicSubnetIds")
                .value(String.join(",", 
                    vpc.getPublicSubnets().stream()
                        .map(subnet -> ((Subnet) subnet).getSubnetId())
                        .toArray(String[]::new)))
                .description("Public Subnet IDs")
                .exportName("PublicSubnetIds-" + environmentSuffix)
                .build();
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
}

/**
 * Main CDK stack that orchestrates the infrastructure components
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final VpcInfrastructureStack vpcStack;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, environment variable, context, or default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(System.getenv("ENVIRONMENT_SUFFIX")))
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("synthtrainr457");

        // Create VPC infrastructure stack
        this.vpcStack = new VpcInfrastructureStack(
            this,
            "VpcInfrastructure",
            environmentSuffix,
            StackProps.builder()
                .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                .description("VPC Infrastructure Stack for environment: " + environmentSuffix)
                .build()
        );
        
        // Add stack-level tags
        Tags.of(this).add("StackType", "Main");
        Tags.of(this).add("Environment", environmentSuffix);
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public VpcInfrastructureStack getVpcStack() {
        return vpcStack;
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
            environmentSuffix = "synthtrainr457";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2") // Explicitly set to us-west-2 as requested
                                .build())
                        .description("Main TAP Stack for AWS VPC Infrastructure")
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

## Key Improvements Made

### 1. **Resource Naming Convention**
- All resources now include the environment suffix in their names
- Consistent naming pattern: `tap-{environmentSuffix}-{resourceType}`
- This prevents naming conflicts across multiple deployments

### 2. **Enhanced Security**
- IAM role with principle of least privilege
- Security group with strictly limited SSH access (203.0.113.0/32)
- Session Manager support for secure access without SSH keys
- EC2 instance in public subnet with controlled internet access

### 3. **Better Configuration Management**
- Environment suffix sourced from multiple locations (env var, context, default)
- Proper use of CDK best practices with IpAddresses.cidr() instead of deprecated cidr property
- User data script for instance initialization

### 4. **Production Readiness**
- Comprehensive tagging strategy for resource management
- CloudFormation outputs for integration testing
- Export names for cross-stack references
- Proper error handling and defaults

### 5. **Testing Support**
- All critical resource IDs exposed as outputs
- Flattened outputs structure for easy integration testing
- Environment-specific export names to avoid conflicts

### 6. **Cost Optimization**
- T3.micro instance type for cost efficiency
- No NAT gateways (not needed for public subnet only design)
- Minimal resource footprint while maintaining functionality

### 7. **Scalability Considerations**
- VPC design supports future expansion
- Ready for EC2 Fleet and CloudFront VPC Origins integration
- Modular stack design for easy enhancement

## Deployment Commands

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=synthtrainr457

# Build the project
./scripts/build.sh

# Synthesize the stack
./scripts/synth.sh

# Deploy to AWS
./scripts/deploy.sh

# Run tests
./scripts/unit-tests.sh
./scripts/integration-tests.sh

# Destroy resources
./scripts/destroy.sh
```

## Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VPC (10.0.0.0/16)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐       │
│  │  Public Subnet AZ1  │    │  Public Subnet AZ2  │       │
│  │    10.0.0.0/24      │    │    10.0.1.0/24      │       │
│  └──────────┬──────────┘    └─────────────────────┘       │
│             │                                               │
│      ┌──────┴────────┐                                     │
│      │ EC2 Instance  │                                     │
│      │   (t3.micro)  │                                     │
│      └───────────────┘                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │           Internet Gateway                      │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Testing Coverage

The solution includes comprehensive unit and integration tests covering:
- Stack creation and configuration
- VPC and subnet setup
- Security group rules
- IAM role configuration
- Resource tagging
- CloudFormation outputs
- Multi-environment deployments
- Network connectivity validation

All tests are designed to work with both synthetic and real AWS resources, ensuring the infrastructure works correctly in production environments.