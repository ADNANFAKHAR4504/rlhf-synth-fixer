package com.example;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.CfnOutputProps;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroup;
import software.amazon.awscdk.services.autoscaling.AutoScalingGroupProps;
import software.amazon.awscdk.services.autoscaling.LaunchConfiguration;
import software.amazon.awscdk.services.autoscaling.LaunchConfigurationProps;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.InternetGateway;
import software.amazon.awscdk.services.ec2.InternetGatewayProps;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.PrivateSubnet;
import software.amazon.awscdk.services.ec2.PrivateSubnetProps;
import software.amazon.awscdk.services.ec2.PublicSubnet;
import software.amazon.awscdk.services.ec2.PublicSubnetProps;
import software.amazon.awscdk.services.ec2.Route;
import software.amazon.awscdk.services.ec2.RouteProps;
import software.amazon.awscdk.services.ec2.RouteTable;
import software.amazon.awscdk.services.ec2.RouteTableProps;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SecurityGroupProps;
import software.amazon.awscdk.services.ec2.SubnetRouteTableAssociation;
import software.amazon.awscdk.services.ec2.SubnetRouteTableAssociationProps;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.VpcProps;
import software.amazon.awscdk.services.ec2.VpcGatewayAttachment;
import software.amazon.awscdk.services.ec2.VpcGatewayAttachmentProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationListener;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationListenerProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancer;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationLoadBalancerProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroup;
import software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationTargetGroupProps;
import software.amazon.awscdk.services.elasticloadbalancingv2.HealthCheck;
import software.amazon.awscdk.services.elasticloadbalancingv2.ListenerAction;
import software.amazon.awscdk.services.elasticloadbalancingv2.Protocol;
import software.amazon.awscdk.services.elasticloadbalancingv2.TargetType;

import java.util.Arrays;
import java.util.Map;

public class IacAwsNovaModelBreakingStack extends Stack {
    public IacAwsNovaModelBreakingStack(final App scope, final String id) {
        this(scope, id, null);
    }

    public IacAwsNovaModelBreakingStack(final App scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Common tags
        Map<String, String> projectTags = Map.of("Project", "IaC - AWS Nova Model Breaking");

        // Create VPC
        Vpc vpc = new Vpc(this, "VPC", VpcProps.builder()
                .cidr("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build());
        Tags.of(vpc).add("Project", "IaC - AWS Nova Model Breaking");

        // Create Internet Gateway
        InternetGateway internetGateway = new InternetGateway(this, "InternetGateway", 
                InternetGatewayProps.builder().build());
        Tags.of(internetGateway).add("Project", "IaC - AWS Nova Model Breaking");

        // Attach Internet Gateway to VPC
        VpcGatewayAttachment vpcGatewayAttachment = new VpcGatewayAttachment(this, "VpcGatewayAttachment",
                VpcGatewayAttachmentProps.builder()
                        .vpcId(vpc.getVpcId())
                        .internetGatewayId(internetGateway.getRef())
                        .build());

        // Create Public Subnets
        PublicSubnet publicSubnet1 = new PublicSubnet(this, "PublicSubnet1", PublicSubnetProps.builder()
                .vpcId(vpc.getVpcId())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone("us-east-1a")
                .build());
        Tags.of(publicSubnet1).add("Project", "IaC - AWS Nova Model Breaking");

        PublicSubnet publicSubnet2 = new PublicSubnet(this, "PublicSubnet2", PublicSubnetProps.builder()
                .vpcId(vpc.getVpcId())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone("us-east-1b")
                .build());
        Tags.of(publicSubnet2).add("Project", "IaC - AWS Nova Model Breaking");

        // Create Private Subnets
        PrivateSubnet privateSubnet1 = new PrivateSubnet(this, "PrivateSubnet1", PrivateSubnetProps.builder()
                .vpcId(vpc.getVpcId())
                .cidrBlock("10.0.3.0/24")
                .availabilityZone("us-east-1a")
                .build());
        Tags.of(privateSubnet1).add("Project", "IaC - AWS Nova Model Breaking");

        PrivateSubnet privateSubnet2 = new PrivateSubnet(this, "PrivateSubnet2", PrivateSubnetProps.builder()
                .vpcId(vpc.getVpcId())
                .cidrBlock("10.0.4.0/24")
                .availabilityZone("us-east-1b")
                .build());
        Tags.of(privateSubnet2).add("Project", "IaC - AWS Nova Model Breaking");

        // Create Public Route Table
        RouteTable publicRouteTable = new RouteTable(this, "PublicRouteTable", RouteTableProps.builder()
                .vpcId(vpc.getVpcId())
                .build());
        Tags.of(publicRouteTable).add("Project", "IaC - AWS Nova Model Breaking");

        // Create Route to Internet Gateway
        Route publicRoute = new Route(this, "PublicRoute", RouteProps.builder()
                .routeTableId(publicRouteTable.getRef())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.getRef())
                .build());

        // Associate Public Route Table with Public Subnets
        SubnetRouteTableAssociation publicSubnet1Association = new SubnetRouteTableAssociation(this, 
                "PublicSubnet1Association", SubnetRouteTableAssociationProps.builder()
                        .subnetId(publicSubnet1.getRef())
                        .routeTableId(publicRouteTable.getRef())
                        .build());

        SubnetRouteTableAssociation publicSubnet2Association = new SubnetRouteTableAssociation(this, 
                "PublicSubnet2Association", SubnetRouteTableAssociationProps.builder()
                        .subnetId(publicSubnet2.getRef())
                        .routeTableId(publicRouteTable.getRef())
                        .build());

        // Create Security Group
        SecurityGroup webSecurityGroup = new SecurityGroup(this, "WebSecurityGroup", SecurityGroupProps.builder()
                .vpc(vpc)
                .description("Security group for web servers")
                .allowAllOutbound(true)
                .build());
        Tags.of(webSecurityGroup).add("Project", "IaC - AWS Nova Model Breaking");

        // Add inbound rules to Security Group
        webSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "Allow HTTP traffic");
        webSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "Allow SSH traffic");

        // Create User Data script
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Hello from $(hostname -f)</h1>' > /var/www/html/index.html"
        );

        // Create Launch Configuration
        LaunchConfiguration launchConfiguration = new LaunchConfiguration(this, "LaunchConfiguration",
                LaunchConfigurationProps.builder()
                        .imageId("ami-04505e74c0741db8f")
                        .instanceType(InstanceType.of(software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3, 
                                software.amazon.awscdk.services.ec2.InstanceSize.MICRO))
                        .securityGroups(Arrays.asList(webSecurityGroup.getSecurityGroupId()))
                        .userData(userData.render())
                        .build());

        // Create Target Group
        ApplicationTargetGroup targetGroup = new ApplicationTargetGroup(this, "TargetGroup",
                ApplicationTargetGroupProps.builder()
                        .vpc(vpc)
                        .port(80)
                        .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.ApplicationProtocol.HTTP)
                        .targetType(TargetType.INSTANCE)
                        .healthCheck(HealthCheck.builder()
                                .enabled(true)
                                .path("/")
                                .protocol(Protocol.HTTP)
                                .build())
                        .build());
        Tags.of(targetGroup).add("Project", "IaC - AWS Nova Model Breaking");

        // Create Auto Scaling Group
        AutoScalingGroup autoScalingGroup = new AutoScalingGroup(this, "AutoScalingGroup",
                AutoScalingGroupProps.builder()
                        .vpc(vpc)
                        .launchConfiguration(launchConfiguration)
                        .vpcSubnets(SubnetSelection.builder()
                                .subnets(Arrays.asList(publicSubnet1, publicSubnet2))
                                .build())
                        .minCapacity(2)
                        .maxCapacity(4)
                        .desiredCapacity(2)
                        .build());
        Tags.of(autoScalingGroup).add("Project", "IaC - AWS Nova Model Breaking");

        // Attach Auto Scaling Group to Target Group
        autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

        // Create Application Load Balancer
        ApplicationLoadBalancer loadBalancer = new ApplicationLoadBalancer(this, "LoadBalancer",
                ApplicationLoadBalancerProps.builder()
                        .vpc(vpc)
                        .internetFacing(true)
                        .vpcSubnets(SubnetSelection.builder()
                                .subnets(Arrays.asList(publicSubnet1, publicSubnet2))
                                .build())
                        .build());
        Tags.of(loadBalancer).add("Project", "IaC - AWS Nova Model Breaking");

        // Create Listener
        ApplicationListener listener = new ApplicationListener(this, "Listener",
                ApplicationListenerProps.builder()
                        .loadBalancer(loadBalancer)
                        .port(80)
                        .defaultAction(ListenerAction.forward(Arrays.asList(targetGroup)))
                        .build());

        // Output the Load Balancer DNS name
        new CfnOutput(this, "LoadBalancerDNS", CfnOutputProps.builder()
                .value(loadBalancer.getLoadBalancerDnsName())
                .description("DNS name of the Application Load Balancer")
                .exportName("LoadBalancerDNS")
                .build());
    }

    public static void main(final String[] args) {
        App app = new App();

        new IacAwsNovaModelBreakingStack(app, "IacAwsNovaModelBreakingStack", StackProps.builder()
                .env(software.amazon.awscdk.Environment.builder()
                        .region("us-east-1")
                        .build())
                .build());

        app.synth();
    }
}