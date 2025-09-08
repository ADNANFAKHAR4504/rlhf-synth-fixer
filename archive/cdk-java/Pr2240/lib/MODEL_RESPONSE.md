# CDK Java Infrastructure Response

Based on your requirements for a basic AWS VPC infrastructure in us-west-2, I'll create a comprehensive solution using CDK Java. This infrastructure will include all the components you specified with modern AWS best practices.

## Main Application File

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.constructs.Construct;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
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
                .cidr("10.0.0.0/16")
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
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .build();

        // Get the latest Amazon Linux 2023 AMI
        IMachineImage amazonLinuxAmi = MachineImage.latestAmazonLinux2023(
            AmazonLinux2023ImageSsmParameterProps.builder()
                .cachedInContext(true)
                .cpuType(AmazonLinux2023CpuType.X86_64)
                .edition(AmazonLinux2023Edition.STANDARD)
                .build()
        );

        // Create EC2 instance in the first public subnet
        this.ec2Instance = Instance.Builder.create(this, "WebServerInstance")
                .vpc(vpc)
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Cost-optimized instance type
                .machineImage(amazonLinuxAmi)
                .securityGroup(sshSecurityGroup)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .availabilityZones(Arrays.asList(vpc.getAvailabilityZones().get(0)))
                    .build())
                .role(ec2Role)
                .userData(UserData.forLinux())
                .keyName("my-keypair") // You'll need to create this key pair manually
                .build();

        // Add comprehensive tags to all resources
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Project", "VpcInfrastructure");
        Tags.of(this).add("CreatedBy", "CDK");
        Tags.of(this).add("Purpose", "BasicVpcSetup");
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

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create VPC infrastructure stack
        this.vpcStack = new VpcInfrastructureStack(
            this,
            "VpcInfrastructure" + environmentSuffix,
            environmentSuffix,
            StackProps.builder()
                .env(this.getEnvironment())
                .build()
        );
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

        // Get environment suffix from context or default to 'dev'
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2") // Explicitly set to us-west-2 as requested
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

This infrastructure creates:

1. **VPC** with CIDR 10.0.0.0/16 across 2 availability zones
2. **Two public subnets** (automatically created by CDK in different AZs)
3. **Internet Gateway** (automatically attached by CDK for public subnets)
4. **Route tables** (automatically configured by CDK for public subnet routing)
5. **Security Group** with SSH access restricted to 203.0.113.0/32
6. **EC2 instance** using the latest Amazon Linux 2023 AMI and cost-optimized t3.micro instance type
7. **IAM role** with Session Manager support for additional secure access options

Key features included:
- Latest EC2 instance types (t3.micro for cost optimization)
- Modern security practices with Session Manager support
- Comprehensive resource tagging
- Production-ready configuration with proper VPC setup
- DNS support enabled for the VPC
- All resources properly organized in nested stacks

The infrastructure is ready for future scaling with EC2 Fleet capabilities and can be enhanced with CloudFront VPC Origins when you need to add a load balancer and CDN functionality.

Note: You'll need to create an EC2 key pair named "my-keypair" in the us-west-2 region before deploying this stack, or modify the keyName parameter to match your existing key pair.