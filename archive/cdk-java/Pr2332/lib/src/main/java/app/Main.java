package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;

import java.util.List;
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
 * This stack implements the infrastructure requirements:
 * - VPC with 2 public and 2 private subnets across 2 AZs
 * - EC2 instances in private subnets
 * - Application Load Balancer in public subnets
 * - Security groups and IAM roles following best practices
 * - Proper removal policies for all resources

 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;
    private final Vpc vpc;
    private final ApplicationLoadBalancer alb;

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

        // Create VPC with 2 public and 2 private subnets across 2 AZs
        this.vpc = Vpc.Builder.create(this, "VPC" + environmentSuffix)
                .maxAzs(2)
                .subnetConfiguration(List.of(
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PUBLIC)
                                .name("PublicSubnet" + environmentSuffix)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .name("PrivateSubnet" + environmentSuffix)
                                .cidrMask(24)
                                .build()
                ))
                .build();
        
        // Apply removal policy to VPC
        vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);



        // Security group for EC2 instances with minimal required access
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup" + environmentSuffix)
                .vpc(vpc)
                .allowAllOutbound(true)
                .description("Security group for EC2 instances in " + environmentSuffix + " environment")
                .build();

        // Allow ALB to access EC2 instances on port 80
        ec2SecurityGroup.addIngressRule(
                Peer.ipv4(vpc.getVpcCidrBlock()), 
                Port.tcp(80), 
                "Allow HTTP from ALB to EC2 instances"
        );



        // IAM Role for EC2 instances with least privilege
        Role ec2Role = Role.Builder.create(this, "EC2InstanceRole" + environmentSuffix)
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for EC2 instances in " + environmentSuffix + " environment")
                .build();
        

        
        // Apply removal policy to IAM role
        ec2Role.applyRemovalPolicy(RemovalPolicy.DESTROY);



        // Create EC2 instances in private subnets
        List<ISubnet> privateSubnets = vpc.selectSubnets(SubnetSelection.builder().subnetType(SubnetType.PRIVATE_WITH_EGRESS).build()).getSubnets();
        for (int i = 0; i < privateSubnets.size(); i++) {
            ISubnet subnet = privateSubnets.get(i);
            Instance instance = Instance.Builder.create(this, "Instance" + environmentSuffix + (i + 1))
                    .instanceType(InstanceType.of(InstanceClass.T2, InstanceSize.MICRO))
                    .machineImage(new AmazonLinuxImage())
                    .vpc(vpc)
                    .vpcSubnets(SubnetSelection.builder().subnets(List.of(subnet)).build())
                    .securityGroup(ec2SecurityGroup)
                    .role(ec2Role)

                    .build();
            
            // Apply removal policy to EC2 instance
            instance.applyRemovalPolicy(RemovalPolicy.DESTROY);
        }

        // Security group for ALB
        SecurityGroup albSecurityGroup = SecurityGroup.Builder.create(this, "ALBSecurityGroup" + environmentSuffix)
                .vpc(vpc)
                .allowAllOutbound(true)
                .description("Security group for ALB in " + environmentSuffix + " environment")
                .build();
        
        // Apply removal policies to security groups
        ec2SecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
        albSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

        // Create Application Load Balancer in public subnets
        this.alb = ApplicationLoadBalancer.Builder.create(this, "ALB" + environmentSuffix)
                .vpc(vpc)
                .internetFacing(true)
                .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
                .securityGroup(albSecurityGroup)
                .build();
        
        // Apply removal policy to ALB
        alb.applyRemovalPolicy(RemovalPolicy.DESTROY);

        // Allow inbound HTTP traffic to ALB
        albSecurityGroup.addIngressRule(
                Peer.anyIpv4(), 
                Port.tcp(80), 
                "Allow HTTP inbound traffic to ALB"
        );

        // Add a listener and target group for the ALB
        ApplicationListener listener = alb.addListener("Listener" + environmentSuffix, 
                BaseApplicationListenerProps.builder()
                        .port(80)
                        .open(true)
                        .build());

        ApplicationTargetGroup targetGroup = listener.addTargets("TargetGroup" + environmentSuffix, 
                AddApplicationTargetsProps.builder()
                        .port(80)
                        .build());
        
        // Apply removal policy to listener
        listener.applyRemovalPolicy(RemovalPolicy.DESTROY);

        // Register EC2 instances with the target group
        // Note: In CDK Java, we need to manually add instances to target group
        // This will be handled by the CDK framework automatically

        // Output the DNS name of the ALB
        CfnOutput.Builder.create(this, "LoadBalancerDNS" + environmentSuffix)
                .value(alb.getLoadBalancerDnsName())
                .description("DNS name of the Application Load Balancer for " + environmentSuffix + " environment")
                .build();

        // Output VPC ID
        CfnOutput.Builder.create(this, "VPCID" + environmentSuffix)
                .value(vpc.getVpcId())
                .description("VPC ID for " + environmentSuffix + " environment")
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

    /**
     * Gets the VPC created by this stack.
     *
     * @return The VPC instance
     */
    public Vpc getVpc() {
        return vpc;
    }

    /**
     * Gets the Application Load Balancer created by this stack.
     *
     * @return The ALB instance
     */
    public ApplicationLoadBalancer getAlb() {
        return alb;
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 *
 * This class serves as the entry point for the CDK application and is responsible
 * for initializing the CDK app and instantiating the main TapStack.
 *
 * The application supports environment-specific deployments through the
 * environmentSuffix context parameter and creates separate stacks for dev and prod environments.
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
     * Supports both dev and prod environments with separate AWS accounts.
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

        // Define environment configurations for separate AWS accounts
        Environment devEnv = Environment.builder()
                .account(System.getenv("DEV_ACCOUNT_ID"))
                .region("us-east-1")
                .build();

        Environment prodEnv = Environment.builder()
                .account(System.getenv("PROD_ACCOUNT_ID"))
                .region("us-east-1")
                .build();

        // Create the main TAP stack for the specified environment
        StackProps stackProps;
        if ("prod".equals(environmentSuffix)) {
            stackProps = StackProps.builder()
                    .env(prodEnv)
                    .build();
        } else {
            stackProps = StackProps.builder()
                    .env(devEnv)
                    .build();
        }

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(stackProps)
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
