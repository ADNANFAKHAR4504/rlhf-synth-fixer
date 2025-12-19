package app;

import java.util.Arrays;
import java.util.Optional;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.AmazonLinuxCpuType;
import software.amazon.awscdk.services.ec2.AmazonLinuxEdition;
import software.amazon.awscdk.services.ec2.AmazonLinuxGeneration;
import software.amazon.awscdk.services.ec2.AmazonLinuxImageProps;
import software.amazon.awscdk.services.ec2.AmazonLinuxVirt;
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
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.constructs.Construct;


/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 */
final class TapStackProps {
    private final String environmentSuffix;
    private final StackProps stackProps;

    private TapStackProps(final String envSuffix, final StackProps props) {
        this.environmentSuffix = envSuffix;
        this.stackProps = props != null ? props : StackProps.builder().build();
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

        public Builder environmentSuffix(final String suffix) {
            this.environmentSuffix = suffix;
            return this;
        }

        public Builder stackProps(final StackProps props) {
            this.stackProps = props;
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
class InfrastructureStack extends Stack {
    private final Vpc vpc;
    private final Instance ec2Instance;
    private final SecurityGroup sshSecurityGroup;

    InfrastructureStack(final Construct scope, final String id, final String environmentSuffix,
            final StackProps props) {
        super(scope, id, props);

        // Detect LocalStack environment
        boolean isLocalStack = System.getenv("AWS_ENDPOINT_URL") != null
                && System.getenv("AWS_ENDPOINT_URL").contains("localhost");

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
                                .build()))
                .natGateways(0) // No NAT gateways needed for public subnets only
                .restrictDefaultSecurityGroup(!isLocalStack) // Disable for LocalStack (avoids custom resource)
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
                "SSH access from specific IP");

        // Create IAM role for EC2 instance with Session Manager support
        Role ec2Role = Role.Builder.create(this, "Ec2Role")
                .roleName("tap-" + environmentSuffix + "-ec2-role")
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")))
                .build();

        // Get the latest Amazon Linux 2 AMI
        // For LocalStack, use a fixed AMI ID instead of SSM parameter lookup
        IMachineImage amazonLinuxAmi;
        if (isLocalStack) {
            // Use LocalStack's mock AMI
            amazonLinuxAmi = MachineImage.genericLinux(
                    java.util.Collections.singletonMap("us-east-1", "ami-04681a1dbd79675a5")
            );
        } else {
            amazonLinuxAmi = MachineImage.latestAmazonLinux(
                    AmazonLinuxImageProps.builder()
                            .generation(AmazonLinuxGeneration.AMAZON_LINUX_2)
                            .edition(AmazonLinuxEdition.STANDARD)
                            .virtualization(AmazonLinuxVirt.HVM)
                            .cpuType(AmazonLinuxCpuType.X86_64)
                            .build());
        }

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
                .userData(UserData.forLinux())
                .build();

        // Add comprehensive tags to all resources
        Tags.of(this).add("Environment", environmentSuffix);
        Tags.of(this).add("Project", "VpcInfrastructure");
        Tags.of(this).add("CreatedBy", "CDK");
        Tags.of(this).add("Purpose", "BasicVpcSetup");

        // Create outputs for integration testing
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
    private final InfrastructureStack vpcStack;

    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create infrastructure stack
        this.vpcStack = new InfrastructureStack(
                this,
                "VpcInfrastructure",
                environmentSuffix,
                StackProps.builder()
                        .env(props != null && props.getStackProps() != null ? props.getStackProps().getEnv() : null)
                        .description("VPC Infrastructure Stack for environment: " + environmentSuffix)
                        .build());
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public InfrastructureStack getVpcStack() {
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
            environmentSuffix = "pr2253";
        }

        // Create the main TAP stack
        String region = System.getenv("CDK_DEFAULT_REGION");
        if (region == null || region.isEmpty()) {
            region = "us-east-1";
        }

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region(region)
                                .build())
                        .build())
                .build());

        app.synth();
    }
}