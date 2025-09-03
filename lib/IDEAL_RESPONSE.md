```java
package app.components;

import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Subnet;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.constructs.Construct;
import java.util.List;

public class Ec2Component extends Construct {

    public Ec2Component(final Construct scope, final String id,
                        final Vpc vpc, final Subnet subnet, final SecurityGroup securityGroup) {
        super(scope, id);

        // Create IAM role for EC2 instance with SSM permissions
        Role ec2Role = Role.Builder.create(this, "Ec2SsmRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for EC2 instance with SSM permissions")
                .managedPolicies(List.of(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                ))
                .build();

        // Create EC2 instance
        Instance ec2Instance = Instance.Builder.create(this, "WebServer")
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux2())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnets(List.of(subnet))
                        .build())
                .securityGroup(securityGroup)
                .role(ec2Role)
                .userData(UserData.forLinux())
                .build();

        // Add user data to install and start a simple web server
        ec2Instance.getUserData().addCommands(
                "#!/bin/bash",
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Hello from AWS CDK!</h1>' > /var/www/html/index.html",
                "echo '<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>' >> /var/www/html/index.html",
                "echo '<p>Region: $(curl -s http://169.254.169.254/latest/meta-data/placement/region)</p>' >> /var/www/html/index.html"
        );
    }
}
```

```java
package app.components;

import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

public class SecurityGroupComponent extends Construct {
    private final SecurityGroup webSecurityGroup;

    public SecurityGroupComponent(final Construct scope, final String id, final Vpc vpc) {
        super(scope, id);

        // Create security group for web traffic
        this.webSecurityGroup = SecurityGroup.Builder.create(this, "WebSecurityGroup")
                .vpc(vpc)
                .description("Security group allowing HTTP traffic")
                .allowAllOutbound(true)
                .build();

        // Allow HTTP traffic (port 80) from anywhere
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP traffic from anywhere"
        );

        // Allow HTTPS traffic (port 443) from anywhere
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic from anywhere"
        );

        // Allow outbound traffic for SSM (HTTPS to AWS services)
        webSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS outbound for SSM"
        );
    }

    public SecurityGroup getWebSecurityGroup() {
        return webSecurityGroup;
    }
}
```

```java
package app.components;

import software.amazon.awscdk.services.ec2.CfnEIP;
import software.amazon.awscdk.services.ec2.CfnInternetGateway;
import software.amazon.awscdk.services.ec2.CfnNatGateway;
import software.amazon.awscdk.services.ec2.CfnRoute;
import software.amazon.awscdk.services.ec2.CfnRouteTable;
import software.amazon.awscdk.services.ec2.CfnSubnetRouteTableAssociation;
import software.amazon.awscdk.services.ec2.CfnVPCGatewayAttachment;
import software.amazon.awscdk.services.ec2.IpAddresses;
import software.amazon.awscdk.services.ec2.Subnet;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;

public class VpcComponent extends Construct {
    private final Vpc vpc;
    private final Subnet publicSubnet;

    public VpcComponent(final Construct scope, final String id, final String vpcCidr) {
        super(scope, id);

        // Create VPC
        this.vpc = Vpc.Builder.create(this, "Vpc")
                .ipAddresses(IpAddresses.cidr(vpcCidr))
                .maxAzs(1) // Use single AZ for simplicity
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(java.util.List.of())
                .natGateways(0) // We'll create NAT Gateway manually
                .build();

        // Create Internet Gateway (automatically created with VPC, but we reference it)
        CfnInternetGateway igw = CfnInternetGateway.Builder.create(this, "InternetGateway")
                .build();

        CfnVPCGatewayAttachment.Builder.create(this, "VpcGatewayAttachment")
                .vpcId(vpc.getVpcId())
                .internetGatewayId(igw.getRef())
                .build();

        // Get the first availability zone
        String availabilityZone = vpc.getAvailabilityZones().get(0);

        // Create public subnet
        this.publicSubnet = Subnet.Builder.create(this, "PublicSubnet")
                .vpcId(vpc.getVpcId())
                .cidrBlock(calculateSubnetCidr(vpcCidr, 0)) // First subnet
                .availabilityZone(availabilityZone)
                .mapPublicIpOnLaunch(true)
                .build();

        // Create private subnet
        // Second subnet
        Subnet privateSubnet = Subnet.Builder.create(this, "PrivateSubnet")
                .vpcId(vpc.getVpcId())
                .cidrBlock(calculateSubnetCidr(vpcCidr, 1)) // Second subnet
                .availabilityZone(availabilityZone)
                .mapPublicIpOnLaunch(false)
                .build();

        // Create Elastic IP for NAT Gateway
        CfnEIP natEip = CfnEIP.Builder.create(this, "NatEip")
                .domain("vpc")
                .build();

        // Create NAT Gateway in public subnet
        CfnNatGateway natGateway = CfnNatGateway.Builder.create(this, "NatGateway")
                .subnetId(publicSubnet.getSubnetId())
                .allocationId(natEip.getAttrAllocationId())
                .build();

        // Create route table for public subnet
        CfnRouteTable publicRouteTable = CfnRouteTable.Builder.create(this, "PublicRouteTable")
                .vpcId(vpc.getVpcId())
                .build();

        // Add route to Internet Gateway for public subnet
        CfnRoute.Builder.create(this, "PublicRoute")
                .routeTableId(publicRouteTable.getAttrRouteTableId())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.getAttrInternetGatewayId())
                .build();

        // Associate public subnet with public route table
        CfnSubnetRouteTableAssociation.Builder.create(this, "PublicSubnetRouteTableAssociation")
                .subnetId(publicSubnet.getSubnetId())
                .routeTableId(publicRouteTable.getAttrRouteTableId())
                .build();

        // Create route table for private subnet
        CfnRouteTable privateRouteTable = CfnRouteTable.Builder.create(this, "PrivateRouteTable")
                .vpcId(vpc.getVpcId())
                .build();

        // Add route to NAT Gateway for private subnet
        CfnRoute.Builder.create(this, "PrivateRoute")
                .routeTableId(privateRouteTable.getAttrRouteTableId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGateway.getAttrNatGatewayId())
                .build();

        // Associate private subnet with private route table
        CfnSubnetRouteTableAssociation.Builder.create(this, "PrivateSubnetRouteTableAssociation")
                .subnetId(privateSubnet.getSubnetId())
                .routeTableId(privateRouteTable.getAttrRouteTableId())
                .build();
    }

    private String calculateSubnetCidr(final String vpcCidr, final int subnetIndex) {
        // Simple CIDR calculation for /24 subnets
        // For 10.0.0.0/16: subnet 0 = 10.0.0.0/24, subnet 1 = 10.0.1.0/24
        // For 192.168.0.0/16: subnet 0 = 192.168.0.0/24, subnet 1 = 192.168.1.0/24
        String[] parts = vpcCidr.split("\\.");
        return parts[0] + "." + parts[1] + "." + subnetIndex + ".0/24";
    }

    public Vpc getVpc() {
        return vpc;
    }

    public Subnet getPublicSubnet() {
        return publicSubnet;
    }
}
```

```java
package app;

import app.components.Ec2Construct;
import app.components.SecurityGroupConstruct;
import app.components.VpcConstruct;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;

import java.util.List;
import java.util.Optional;

/**
 * TapStackProps holds configuration for the TapStack CDK stack.
 *
 * This class provides a simple container for stack-specific configuration
 * including environment suffix for resource naming.
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

        public Builder environmentSuffix(final String envSuffix) {
            this.environmentSuffix = envSuffix;
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
 * Represents the main CDK stack for the Tap project.
 *
 * This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
 * It determines the environment suffix from the provided properties,
 * CDK context, or defaults to 'dev'.
 *
 * Note:
 * - Do NOT create AWS resources directly in this stack.
 * - Instead, instantiate separate stacks for each resource type within this stack.
 *
 * @version 1.0
 * @since 1.0
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    /**
     * Constructs a new TapStack.
     *
     * @param scope The parent construct
     * @param id The unique identifier for this stack
     * @param props Optional properties for configuring the stack, including environment suffix
     */
    TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Determine VPC configuration based on region
        String region = this.getRegion();
        String vpcCidr;
        boolean shouldCreateEc2 = false;

        if ("us-east-1".equals(region)) {
            vpcCidr = "10.0.0.0/16";
            shouldCreateEc2 = true; // Only create EC2 in the first VPC
        } else {
            vpcCidr = "192.168.0.0/16";
        }

        // Create VPC component
        VpcConstruct vpcComponent = new VpcConstruct(this, "VpcComponent", vpcCidr);

        // Create security group component
        SecurityGroupConstruct securityGroupComponent = new SecurityGroupConstruct(
                this, "SecurityGroupComponent", vpcComponent.getVpc());

        // Create EC2 instance only in the first VPC (us-east-1)
        if (shouldCreateEc2) {
            new Ec2Construct(this, "Ec2Component",
                    vpcComponent.getVpc(),
                    vpcComponent.getPublicSubnet(),
                    securityGroupComponent.getWebSecurityGroup());
        }
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

        // Define environments for different regions
        Environment usEast1 = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-east-1")
                .build();

        Environment usWest2 = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-west-2")
                .build();

        String finalEnvironmentSuffix = environmentSuffix;

        List.of(usEast1, usWest2).forEach((environment) -> new TapStack(
                app, "TapStack-" + finalEnvironmentSuffix + "-" + environment.getRegion(),
                TapStackProps.builder()
                        .environmentSuffix(finalEnvironmentSuffix)
                        .stackProps(StackProps.builder()
                                .env(Environment.builder()
                                        .account(environment.getAccount())
                                        .region(environment.getRegion())
                                        .build())
                                .build())
                        .build()));

        app.synth();
    }
}
```