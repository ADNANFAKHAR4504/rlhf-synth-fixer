I'll create a comprehensive AWS CDK Java solution for your dual-VPC environment. Here's the complete implementation:

## Project Structure

```
src/main/java/
├── DualVpcApp.java
├── DualVpcStack.java
└── components/
    ├── VpcComponent.java
    ├── Ec2Component.java
    └── SecurityGroupComponent.java
```

## 1. Main Application Class

```java
// DualVpcApp.java
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class DualVpcApp {
    public static void main(final String[] args) {
        App app = new App();

        // Define environments for different regions
        Environment usEast1 = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-east-1")
                .build();

        Environment usWest2 = Environment.builder()
                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                .region("us-west-2")
                .build();

        // Create stacks in different regions
        new DualVpcStack(app, "DualVpcStack-USEast1", StackProps.builder()
                .env(usEast1)
                .description("Dual VPC Stack in US East 1")
                .build());

        new DualVpcStack(app, "DualVpcStack-USWest2", StackProps.builder()
                .env(usWest2)
                .description("Dual VPC Stack in US West 2")
                .build());

        app.synth();
    }
}
```

## 2. Main Stack Class

```java
// DualVpcStack.java
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.constructs.Construct;
import components.VpcComponent;
import components.Ec2Component;
import components.SecurityGroupComponent;

public class DualVpcStack extends Stack {
    public DualVpcStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

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
        VpcComponent vpcComponent = new VpcComponent(this, "VpcComponent", vpcCidr);

        // Create security group component
        SecurityGroupComponent securityGroupComponent = new SecurityGroupComponent(
                this, "SecurityGroupComponent", vpcComponent.getVpc());

        // Create EC2 instance only in the first VPC (us-east-1)
        if (shouldCreateEc2) {
            new Ec2Component(this, "Ec2Component", 
                    vpcComponent.getVpc(), 
                    vpcComponent.getPublicSubnet(),
                    securityGroupComponent.getWebSecurityGroup());
        }
    }
}
```

## 3. VPC Component

```java
// components/VpcComponent.java
package components;

import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

public class VpcComponent extends Construct {
    private final Vpc vpc;
    private final Subnet publicSubnet;
    private final Subnet privateSubnet;
    private final NatGateway natGateway;

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
                .vpc(vpc)
                .cidrBlock(calculateSubnetCidr(vpcCidr, 0)) // First subnet
                .availabilityZone(availabilityZone)
                .mapPublicIpOnLaunch(true)
                .build();

        // Create private subnet
        this.privateSubnet = Subnet.Builder.create(this, "PrivateSubnet")
                .vpc(vpc)
                .cidrBlock(calculateSubnetCidr(vpcCidr, 1)) // Second subnet
                .availabilityZone(availabilityZone)
                .mapPublicIpOnLaunch(false)
                .build();

        // Create Elastic IP for NAT Gateway
        CfnEIP natEip = CfnEIP.Builder.create(this, "NatEip")
                .domain("vpc")
                .build();

        // Create NAT Gateway in public subnet
        this.natGateway = NatGateway.Builder.create(this, "NatGateway")
                .subnet(publicSubnet)
                .allocationId(natEip.getAttrAllocationId())
                .build();

        // Create route table for public subnet
        RouteTable publicRouteTable = RouteTable.Builder.create(this, "PublicRouteTable")
                .vpc(vpc)
                .build();

        // Add route to Internet Gateway for public subnet
        Route.Builder.create(this, "PublicRoute")
                .routeTable(publicRouteTable)
                .destination("0.0.0.0/0")
                .target(RouterType.gateway(igw.getRef()))
                .build();

        // Associate public subnet with public route table
        SubnetRouteTableAssociation.Builder.create(this, "PublicSubnetRouteTableAssociation")
                .subnet(publicSubnet)
                .routeTable(publicRouteTable)
                .build();

        // Create route table for private subnet
        RouteTable privateRouteTable = RouteTable.Builder.create(this, "PrivateRouteTable")
                .vpc(vpc)
                .build();

        // Add route to NAT Gateway for private subnet
        Route.Builder.create(this, "PrivateRoute")
                .routeTable(privateRouteTable)
                .destination("0.0.0.0/0")
                .target(RouterType.natGateway(natGateway.getNatGatewayId()))
                .build();

        // Associate private subnet with private route table
        SubnetRouteTableAssociation.Builder.create(this, "PrivateSubnetRouteTableAssociation")
                .subnet(privateSubnet)
                .routeTable(privateRouteTable)
                .build();
    }

    private String calculateSubnetCidr(String vpcCidr, int subnetIndex) {
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

    public Subnet getPrivateSubnet() {
        return privateSubnet;
    }

    public NatGateway getNatGateway() {
        return natGateway;
    }
}
```

## 4. Security Group Component

```java
// components/SecurityGroupComponent.java
package components;

import software.amazon.awscdk.services.ec2.*;
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

## 5. EC2 Component

```java
// components/Ec2Component.java
package components;

import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;
import java.util.List;

public class Ec2Component extends Construct {
    private final Instance ec2Instance;
    private final Role ec2Role;

    public Ec2Component(final Construct scope, final String id, 
                       final Vpc vpc, final Subnet subnet, final SecurityGroup securityGroup) {
        super(scope, id);

        // Create IAM role for EC2 instance with SSM permissions
        this.ec2Role = Role.Builder.create(this, "Ec2SsmRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for EC2 instance with SSM permissions")
                .managedPolicies(List.of(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                        ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                ))
                .build();

        // Get the latest Amazon Linux 2 AMI
        IMachineImage amazonLinux2 = MachineImage.latestAmazonLinux2(
                AmazonLinux2ImageSsmParameterProps.builder()
                        .generation(AmazonLinuxGeneration.AMAZON_LINUX_2)
                        .build()
        );

        // Create EC2 instance
        this.ec2Instance = Instance.Builder.create(this, "WebServer")
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amazonLinux2)
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

    public Instance getEc2Instance() {
        return ec2Instance;
    }

    public Role getEc2Role() {
        return ec2Role;
    }
}
```

## 6. Maven Dependencies (pom.xml)

```xml
<dependencies>
    <dependency>
        <groupId>software.amazon.awscdk</groupId>
        <artifactId>aws-cdk-lib</artifactId>
        <version>2.100.0</version>
    </dependency>
    <dependency>
        <groupId>software.constructs</groupId>
        <artifactId>constructs</artifactId>
        <version>10.3.0</version>
    </dependency>
</dependencies>
```

## Key Features Implemented

### 1. **Dual-VPC Architecture**
- VPC1 in us-east-1 with CIDR 10.0.0.0/16
- VPC2 in us-west-2 with CIDR 192.168.0.0/16

### 2. **Subnet Configuration**
- Public subnet: .0.0/24 (e.g., 10.0.0.0/24, 192.168.0.0/24)
- Private subnet: .1.0/24 (e.g., 10.0.1.0/24, 192.168.1.0/24)

### 3. **NAT Gateway Setup**
- One NAT Gateway per VPC in the public subnet
- Private subnets route internet traffic through NAT Gateway
- Elastic IP allocated for each NAT Gateway

### 4. **EC2 Instance**
- Amazon Linux 2 instance in public subnet of first VPC
- IAM role with SSM permissions (AmazonSSMManagedInstanceCore)
- User data installs Apache web server
- No SSH access required - managed via SSM

### 5. **Security Groups**
- HTTP (port 80) and HTTPS (port 443) inbound access
- HTTPS outbound for SSM communication

### 6. **Component-Based Design**
- Modular architecture with separate component classes
- Reusable components in the `components` package
- Clean separation of concerns

## Deployment Commands

```bash
# Install dependencies
mvn compile

# Deploy to both regions
cdk deploy DualVpcStack-USEast1 DualVpcStack-USWest2

# Or deploy individually
cdk deploy DualVpcStack-USEast1
cdk deploy DualVpcStack-USWest2
```

This solution provides a robust, scalable dual-VPC environment that meets all your requirements while following AWS best practices for security and architecture.