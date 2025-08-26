package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.constructs.Construct;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;

// EC2 / VPC
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.MachineImage;

// ASG
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroupProps;
import software.amazon.awscdk.services.autoscaling.HealthCheck;

// ALB
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancerProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationListener;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroupProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ListenerAction;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;

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

    public String getEnvironmentSuffix() { return environmentSuffix; }
    public StackProps getStackProps() { return stackProps; }

    public static Builder builder() { return new Builder(); }
    public static class Builder {
        private String environmentSuffix;
        private StackProps stackProps;
        public Builder environmentSuffix(String environmentSuffix) { this.environmentSuffix = environmentSuffix; return this; }
        public Builder stackProps(StackProps stackProps) { this.stackProps = stackProps; return this; }
        public TapStackProps build() { return new TapStackProps(environmentSuffix, stackProps); }
    }
}

/**
 * Network stack: VPC with 2 AZs, public + private subnets.
 */
class NetworkStack extends Stack {
    private final Vpc vpc;

    public NetworkStack(final Construct scope, final String id, final String envSuffix, final StackProps props) {
        super(scope, id, props);

        // Tags common to the project (you can extend from context if needed)
        Tags.of(this).add("Project", "IaC - AWS Nova Model Breaking");
        Tags.of(this).add("Environment", envSuffix);

        this.vpc = new Vpc(this, "Vpc" + envSuffix, VpcProps.builder()
            .vpcName("tap-vpc-" + envSuffix)
            .maxAzs(2)
            .subnetConfiguration(List.of(
                SubnetConfiguration.builder()
                    .name("public")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("private")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                    .cidrMask(24)
                    .build()
            ))
            .build());

        Tags.of(vpc).add("Owner", "platform");   // adjust as needed
        Tags.of(vpc).add("CostCenter", "devx");  // adjust as needed
    }

    public Vpc getVpc() { return vpc; }
}

/**
 * Web tier: SecurityGroup, AutoScalingGroup (with user data), ALB + Listener + TargetGroup.
 * All resources are created in the provided VPC.
 */
class WebTierStack extends Stack {
    public WebTierStack(final Construct scope, final String id, final String envSuffix, final Vpc vpc, final StackProps props) {
        super(scope, id, props);

        Tags.of(this).add("Project", "IaC - AWS Nova Model Breaking");
        Tags.of(this).add("Environment", envSuffix);

        // SG allowing HTTP + optional SSH (adjust as per your policy)
        SecurityGroup sg = SecurityGroup.Builder.create(this, "WebSg" + envSuffix)
            .vpc(vpc)
            .description("Security group for web servers")
            .allowAllOutbound(true)
            .build();
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP");
        sg.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "Allow SSH"); // remove if you use SSM only

        // User data to install Apache and a simple index
        UserData userData = UserData.forLinux();
        userData.addCommands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl enable --now httpd",
            "echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html"
        );

        AutoScalingGroup asg = AutoScalingGroup.Builder.create(this, "Asg" + envSuffix)
            .vpc(vpc)
            .vpcSubnets(vpc.selectSubnets(subnetSelection -> subnetSelection.subnetGroupName("public")))
            .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
            .machineImage(MachineImage.latestAmazonLinux2023())
            .securityGroup(sg)
            .minCapacity(2)
            .desiredCapacity(2)
            .maxCapacity(4)
            .userData(userData)
            .healthCheck(HealthCheck.elb())
            .build();

        // Target group (instances on port 80)
        ApplicationTargetGroup tg = new ApplicationTargetGroup(this, "Tg" + envSuffix, ApplicationTargetGroupProps.builder()
            .vpc(vpc)
            .port(80)
            .protocol(ApplicationProtocol.HTTP)
            .targetType(TargetType.INSTANCE)
            .healthCheck(software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck.builder()
                .enabled(true)
                .path("/")
                .healthyHttpCodes("200-399")
                .build())
            .build());

        // ALB in public subnets
        ApplicationLoadBalancer alb = new ApplicationLoadBalancer(this, "Alb" + envSuffix, ApplicationLoadBalancerProps.builder()
            .vpc(vpc)
            .internetFacing(true)
            .vpcSubnets(vpc.selectSubnets(subnetSelection -> subnetSelection.subnetGroupName("public")))
            .build());

        // Listener forwards to TG
        ApplicationListener listener = alb.addListener("HttpListener" + envSuffix, software.amazon.awscdk.services.elasticloadbalancingv2.BaseApplicationListenerProps.builder()
            .port(80)
            .defaultAction(ListenerAction.forward(List.of(tg)))
            .build());

        // Attach ASG to TG
        asg.attachToApplicationTargetGroup(tg);

        // Useful output
        new CfnOutput(this, "AlbDns" + envSuffix, CfnOutputProps.builder()
            .value(alb.getLoadBalancerDnsName())
            .description("DNS name of the Application Load Balancer")
            .exportName("AlbDns-" + envSuffix)
            .build());
    }
}

/**
 * Orchestrator stack — wires child stacks (no direct resources here).
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        this.environmentSuffix = Optional.ofNullable(props)
            .map(TapStackProps::getEnvironmentSuffix)
            .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix")).map(Object::toString))
            .orElse("dev");

        // Global tags (apply at orchestrator level)
        Tags.of(this).add("Project", "IaC - AWS Nova Model Breaking");
        Tags.of(this).add("Environment", environmentSuffix);

        // --- Instantiate child stacks (pattern you outlined) ---
        NetworkStack network = new NetworkStack(this, "NetworkStack-" + environmentSuffix, environmentSuffix, StackProps.builder().build());

        // Pass VPC into the web tier
        new WebTierStack(this, "WebTierStack-" + environmentSuffix, environmentSuffix, network.getVpc(), StackProps.builder().build());
        // (Add more stacks similarly: DataStack, ObservabilityStack, etc.)
    }

    public String getEnvironmentSuffix() { return environmentSuffix; }
}

/**
 * Entry point (unchanged behavior).
 */
public final class Main {
    private Main() {}

    public static void main(final String[] args) {
        App app = new App();

        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) environmentSuffix = "dev";

        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
            .environmentSuffix(environmentSuffix)
            .stackProps(StackProps.builder()
                .env(Environment.builder()
                    .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                    .region(System.getenv("CDK_DEFAULT_REGION"))
                    .build())
                .build())
            .build());

        app.synth();
    }
}
