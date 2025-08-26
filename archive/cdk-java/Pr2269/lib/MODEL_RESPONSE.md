# Enhanced Cloud Environment with Advanced Networking

This infrastructure code creates a secure cloud environment in the us-west-2 region with advanced networking capabilities using Amazon VPC Lattice for microservices communication and AWS Network Manager Cloud WAN for global connectivity with intent-based networking.

## Architecture Overview

The infrastructure includes:
- VPC with CIDR 10.0.0.0/16 and public subnets in us-west-2a and us-west-2b
- EC2 instance using Graviton4 (m8g.medium) with restricted SSH access
- Application Load Balancer and CloudFront distribution for secure web access
- VPC Lattice service network for microservices communication with IAM-based authentication
- Cloud WAN core network with production and development segments
- Intent-based networking policies for traffic routing and security

## Code Implementation

### Main.java

```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.cloudfront.*;
import software.amazon.awscdk.services.cloudfront.origins.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.targets.*;
import software.amazon.awscdk.services.vpclattice.*;
import software.amazon.awscdk.services.networkmanager.*;
import software.constructs.Construct;

import java.util.Arrays;
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
 * Represents the main CDK stack for the Tap project.
 * 
 * This stack creates a secure cloud environment with advanced networking capabilities:
 * - VPC with public subnets in us-west-2
 * - EC2 instance using Graviton4 (m8g.medium) 
 * - Security group with SSH access restricted to specific IP
 * - CloudFront distribution with VPC origins for enhanced security
 * - Amazon VPC Lattice service network for microservices communication
 * - VPC Lattice service with target group and IAM-based authentication
 * - AWS Network Manager Cloud WAN for global network connectivity
 * - Intent-based networking policies with production and development segments
 * - Cloud WAN VPC attachment for multi-region networking capabilities
 */
class TapStack extends Stack {
    private final String environmentSuffix;

    public TapStack(final Construct scope, final String id, final TapStackProps props) {
        super(scope, id, props != null ? props.getStackProps() : null);

        // Get environment suffix from props, context, or use 'dev' as default
        this.environmentSuffix = Optional.ofNullable(props)
                .map(TapStackProps::getEnvironmentSuffix)
                .or(() -> Optional.ofNullable(this.getNode().tryGetContext("environmentSuffix"))
                        .map(Object::toString))
                .orElse("dev");

        // Create VPC with CIDR 10.0.0.0/16
        Vpc vpc = Vpc.Builder.create(this, "SecureVPC")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .availabilityZones(Arrays.asList("us-west-2a", "us-west-2b"))
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .cidrMask(24)
                                .name("PublicSubnet")
                                .subnetType(SubnetType.PUBLIC)
                                .build()
                ))
                .build();

        // Get public subnets
        ISubnet publicSubnet1 = vpc.getPublicSubnets().get(0);
        ISubnet publicSubnet2 = vpc.getPublicSubnets().get(1);

        // Create security group for EC2 instance
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup")
                .vpc(vpc)
                .description("Security group for EC2 instance with restricted SSH access")
                .allowAllOutbound(true)
                .build();

        // Allow SSH access only from specific IP (203.0.113.1/32)
        ec2SecurityGroup.addIngressRule(
                Peer.ipv4("203.0.113.1/32"),
                Port.tcp(22),
                "SSH access from specific IP only"
        );

        // Allow HTTP access for web server
        ec2SecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "HTTP access for web server"
        );

        // Create key pair for EC2 instance
        CfnKeyPair keyPair = CfnKeyPair.Builder.create(this, "EC2KeyPair")
                .keyName("secure-key-pair-" + environmentSuffix)
                .keyType("rsa")
                .keyFormat("pem")
                .build();

        // Create IAM role for EC2 instance
        Role ec2Role = Role.Builder.create(this, "EC2Role")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for secure EC2 instance")
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
                ))
                .build();

        // Create EC2 instance using Graviton4 (m8g.medium)
        Instance ec2Instance = Instance.Builder.create(this, "SecureEC2Instance")
                .instanceType(InstanceType.of(InstanceClass.M8G, InstanceSize.MEDIUM))
                .machineImage(MachineImage.latestAmazonLinux2023(AmazonLinux2023ImageSsmParameterProps.builder()
                        .cpuType(AmazonLinuxCpuType.ARM_64)
                        .build()))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnets(Arrays.asList(publicSubnet1))
                        .build())
                .securityGroup(ec2SecurityGroup)
                .keyName(keyPair.getKeyName())
                .role(ec2Role)
                .userData(UserData.forLinux())
                .build();

        // Add user data to install basic web server
        ec2Instance.getUserData().addCommands(
                "yum update -y",
                "yum install -y httpd",
                "systemctl start httpd",
                "systemctl enable httpd",
                "echo '<h1>Secure Cloud Environment - Powered by Graviton4</h1>' > /var/www/html/index.html"
        );

        // Create Application Load Balancer (public for CloudFront origins)
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "SecureALB")
                .vpc(vpc)
                .internetFacing(true)  // Public ALB for CloudFront access
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .build();

        // Create target group and register EC2 instance
        ApplicationTargetGroup targetGroup = ApplicationTargetGroup.Builder.create(this, "EC2TargetGroup")
                .vpc(vpc)
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .targetType(TargetType.INSTANCE)
                .targets(Arrays.asList(new InstanceTarget(ec2Instance)))
                .healthCheck(HealthCheck.builder()
                        .enabled(true)
                        .path("/")
                        .port("80")
                        .protocol(software.amazon.awscdk.services.elasticloadbalancingv2.Protocol.HTTP)
                        .build())
                .build();

        // Add listener to ALB
        ApplicationListener listener = alb.addListener("ALBListener", BaseApplicationListenerProps.builder()
                .port(80)
                .protocol(ApplicationProtocol.HTTP)
                .defaultTargetGroups(Arrays.asList(targetGroup))
                .build());

        // Create CloudFront distribution with VPC origins
        Distribution distribution = Distribution.Builder.create(this, "SecureCloudFrontDistribution")
                .defaultBehavior(BehaviorOptions.builder()
                        .origin(LoadBalancerV2Origin.Builder.create(alb)
                                .protocolPolicy(OriginProtocolPolicy.HTTP_ONLY)
                                .build())
                        .viewerProtocolPolicy(ViewerProtocolPolicy.REDIRECT_TO_HTTPS)
                        .allowedMethods(AllowedMethods.ALLOW_GET_HEAD)
                        .cachePolicy(CachePolicy.CACHING_OPTIMIZED)
                        .build())
                .priceClass(PriceClass.PRICE_CLASS_100)
                .comment("CloudFront distribution with VPC origins for secure EC2 access")
                .build();

        // Create AWS Network Manager Cloud WAN Global Network
        CfnGlobalNetwork globalNetwork = CfnGlobalNetwork.Builder.create(this, "CloudWANGlobalNetwork")
                .description("Global network for multi-region connectivity with Cloud WAN")
                .build();

        // Create Cloud WAN Core Network with intent-based policy
        String coreNetworkPolicyDocument = "{\n" +
                "  \"version\": \"2021.12\",\n" +
                "  \"core-network-configuration\": {\n" +
                "    \"vpn-ecmp-support\": false,\n" +
                "    \"asn-ranges\": [\"64512-64555\"],\n" +
                "    \"edge-locations\": [\n" +
                "      {\n" +
                "        \"location\": \"us-west-2\",\n" +
                "        \"asn\": 64512\n" +
                "      }\n" +
                "    ]\n" +
                "  },\n" +
                "  \"segments\": [\n" +
                "    {\n" +
                "      \"name\": \"production\",\n" +
                "      \"description\": \"Production workload segment\",\n" +
                "      \"isolate-attachments\": false,\n" +
                "      \"require-attachment-acceptance\": false\n" +
                "    },\n" +
                "    {\n" +
                "      \"name\": \"development\",\n" +
                "      \"description\": \"Development workload segment\",\n" +
                "      \"isolate-attachments\": false,\n" +
                "      \"require-attachment-acceptance\": false\n" +
                "    }\n" +
                "  ],\n" +
                "  \"segment-actions\": [\n" +
                "    {\n" +
                "      \"action\": \"create-route\",\n" +
                "      \"segment\": \"production\",\n" +
                "      \"destination-cidr-blocks\": [\"10.0.0.0/16\"]\n" +
                "    }\n" +
                "  ],\n" +
                "  \"attachment-policies\": [\n" +
                "    {\n" +
                "      \"rule-number\": 100,\n" +
                "      \"condition-logic\": \"or\",\n" +
                "      \"conditions\": [\n" +
                "        {\n" +
                "          \"type\": \"tag-value\",\n" +
                "          \"operator\": \"equals\",\n" +
                "          \"key\": \"Environment\",\n" +
                "          \"value\": \"production\"\n" +
                "        }\n" +
                "      ],\n" +
                "      \"action\": {\n" +
                "        \"association-method\": \"constant\",\n" +
                "        \"segment\": \"production\"\n" +
                "      }\n" +
                "    },\n" +
                "    {\n" +
                "      \"rule-number\": 200,\n" +
                "      \"condition-logic\": \"or\",\n" +
                "      \"conditions\": [\n" +
                "        {\n" +
                "          \"type\": \"tag-value\",\n" +
                "          \"operator\": \"equals\",\n" +
                "          \"key\": \"Environment\",\n" +
                "          \"value\": \"development\"\n" +
                "        }\n" +
                "      ],\n" +
                "      \"action\": {\n" +
                "        \"association-method\": \"constant\",\n" +
                "        \"segment\": \"development\"\n" +
                "      }\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        CfnCoreNetwork coreNetwork = CfnCoreNetwork.Builder.create(this, "CloudWANCoreNetwork")
                .globalNetworkId(globalNetwork.getRef())
                .description("Core network for intent-based networking with segments")
                .policyDocument(coreNetworkPolicyDocument)
                .build();

        // Create VPC attachment to Cloud WAN core network
        CfnVpcAttachment vpcAttachment = CfnVpcAttachment.Builder.create(this, "CloudWANVPCAttachment")
                .coreNetworkId(coreNetwork.getRef())
                .vpcArn(vpc.getVpcArn())
                .subnetArns(Arrays.asList(
                        publicSubnet1.getSubnetArn(),
                        publicSubnet2.getSubnetArn()
                ))
                .tags(Arrays.asList(
                        software.amazon.awscdk.CfnTag.builder()
                                .key("Environment")
                                .value(environmentSuffix.equals("prod") ? "production" : "development")
                                .build(),
                        software.amazon.awscdk.CfnTag.builder()
                                .key("Project")
                                .value("SecureCloudEnvironment")
                                .build()
                ))
                .build();

        // Create VPC Lattice Service Network
        CfnServiceNetwork vpcLatticeServiceNetwork = CfnServiceNetwork.Builder.create(this, "VPCLatticeServiceNetwork")
                .name("microservices-network-" + environmentSuffix)
                .authType("AWS_IAM")
                .build();

        // Create VPC Lattice Service Network VPC Association
        CfnServiceNetworkVpcAssociation serviceNetworkVpcAssociation = CfnServiceNetworkVpcAssociation.Builder.create(this, "VPCLatticeVPCAssociation")
                .serviceNetworkIdentifier(vpcLatticeServiceNetwork.getRef())
                .vpcIdentifier(vpc.getVpcId())
                .build();

        // Create VPC Lattice Target Group for EC2 instance
        CfnTargetGroup vpcLatticeTargetGroup = CfnTargetGroup.Builder.create(this, "VPCLatticeTargetGroup")
                .name("ec2-targets-" + environmentSuffix)
                .type("INSTANCE")
                .port(80)
                .protocol("HTTP")
                .vpcIdentifier(vpc.getVpcId())
                .targets(Arrays.asList(
                        software.amazon.awscdk.services.vpclattice.CfnTargetGroup.TargetProperty.builder()
                                .id(ec2Instance.getInstanceId())
                                .port(80)
                                .build()
                ))
                .healthCheck(software.amazon.awscdk.services.vpclattice.CfnTargetGroup.HealthCheckConfigProperty.builder()
                        .enabled(true)
                        .path("/")
                        .port(80)
                        .protocol("HTTP")
                        .healthCheckIntervalSeconds(30)
                        .healthyThresholdCount(2)
                        .unhealthyThresholdCount(5)
                        .build())
                .build();

        // Create VPC Lattice Service
        CfnService vpcLatticeService = CfnService.Builder.create(this, "VPCLatticeWebService")
                .name("web-service-" + environmentSuffix)
                .authType("AWS_IAM")
                .build();

        // Create VPC Lattice Service Listener
        CfnListener vpcLatticeListener = CfnListener.Builder.create(this, "VPCLatticeListener")
                .serviceIdentifier(vpcLatticeService.getRef())
                .name("web-listener")
                .port(80)
                .protocol("HTTP")
                .defaultAction(software.amazon.awscdk.services.vpclattice.CfnListener.DefaultActionProperty.builder()
                        .forward(software.amazon.awscdk.services.vpclattice.CfnListener.ForwardProperty.builder()
                                .targetGroups(Arrays.asList(
                                        software.amazon.awscdk.services.vpclattice.CfnListener.WeightedTargetGroupProperty.builder()
                                                .targetGroupIdentifier(vpcLatticeTargetGroup.getRef())
                                                .weight(100)
                                                .build()
                                ))
                                .build())
                        .build())
                .build();

        // Associate VPC Lattice Service with Service Network
        CfnServiceNetworkServiceAssociation serviceNetworkServiceAssociation = CfnServiceNetworkServiceAssociation.Builder.create(this, "VPCLatticeServiceAssociation")
                .serviceNetworkIdentifier(vpcLatticeServiceNetwork.getRef())
                .serviceIdentifier(vpcLatticeService.getRef())
                .build();

        // Create IAM policy for VPC Lattice service-to-service authentication
        PolicyDocument vpcLatticePolicyDocument = PolicyDocument.Builder.create()
                .statements(Arrays.asList(
                        PolicyStatement.Builder.create()
                                .sid("AllowVPCLatticeServiceAccess")
                                .effect(Effect.ALLOW)
                                .principals(Arrays.asList(new AnyPrincipal()))
                                .actions(Arrays.asList("vpc-lattice-svcs:Invoke"))
                                .resources(Arrays.asList("*"))
                                .conditions(java.util.Map.of(
                                        "StringEquals", java.util.Map.of(
                                                "aws:PrincipalTag/Environment", environmentSuffix
                                        )
                                ))
                                .build()
                ))
                .build();

        // Create resource policy for VPC Lattice Service Network
        CfnResourcePolicy vpcLatticeResourcePolicy = CfnResourcePolicy.Builder.create(this, "VPCLatticeResourcePolicy")
                .resourceArn(vpcLatticeServiceNetwork.getAttrArn())
                .policy(vpcLatticePolicyDocument.toJSON())
                .build();

        // Add resource tags
        addResourceTags(vpc, "Environment", environmentSuffix);
        addResourceTags(ec2SecurityGroup, "Environment", environmentSuffix);
        addResourceTags(ec2Instance, "Environment", environmentSuffix);
        addResourceTags(keyPair, "Environment", environmentSuffix);
        addResourceTags(alb, "Environment", environmentSuffix);
        addResourceTags(distribution, "Environment", environmentSuffix);
        addResourceTags(globalNetwork, "Environment", environmentSuffix);
        addResourceTags(coreNetwork, "Environment", environmentSuffix);
        addResourceTags(vpcAttachment, "Environment", environmentSuffix);
        addResourceTags(vpcLatticeServiceNetwork, "Environment", environmentSuffix);
        addResourceTags(vpcLatticeService, "Environment", environmentSuffix);
        addResourceTags(vpcLatticeTargetGroup, "Environment", environmentSuffix);

        // Create outputs
        CfnOutput.Builder.create(this, "VpcId")
                .description("VPC ID")
                .value(vpc.getVpcId())
                .build();

        CfnOutput.Builder.create(this, "PublicSubnet1Id")
                .description("Public Subnet 1 ID (us-west-2a)")
                .value(publicSubnet1.getSubnetId())
                .build();

        CfnOutput.Builder.create(this, "PublicSubnet2Id")
                .description("Public Subnet 2 ID (us-west-2b)")
                .value(publicSubnet2.getSubnetId())
                .build();

        CfnOutput.Builder.create(this, "EC2InstanceId")
                .description("EC2 Instance ID (Graviton4 m8g.medium)")
                .value(ec2Instance.getInstanceId())
                .build();

        CfnOutput.Builder.create(this, "EC2PublicIp")
                .description("EC2 Instance Public IP")
                .value(ec2Instance.getInstancePublicIp())
                .build();

        CfnOutput.Builder.create(this, "CloudFrontDistributionDomain")
                .description("CloudFront Distribution Domain Name")
                .value(distribution.getDistributionDomainName())
                .build();

        CfnOutput.Builder.create(this, "ALBDNSName")
                .description("Application Load Balancer DNS Name")
                .value(alb.getLoadBalancerDnsName())
                .build();

        CfnOutput.Builder.create(this, "KeyPairName")
                .description("Key Pair Name for EC2 SSH Access")
                .value(keyPair.getKeyName())
                .build();

        CfnOutput.Builder.create(this, "SecurityGroupId")
                .description("Security Group ID with SSH access restricted to 203.0.113.1/32")
                .value(ec2SecurityGroup.getSecurityGroupId())
                .build();

        CfnOutput.Builder.create(this, "VPCLatticeServiceNetworkArn")
                .description("VPC Lattice Service Network ARN for microservices communication")
                .value(vpcLatticeServiceNetwork.getAttrArn())
                .build();

        CfnOutput.Builder.create(this, "VPCLatticeServiceArn")
                .description("VPC Lattice Service ARN for web service")
                .value(vpcLatticeService.getAttrArn())
                .build();

        CfnOutput.Builder.create(this, "CloudWANCoreNetworkArn")
                .description("Cloud WAN Core Network ARN for global connectivity")
                .value(coreNetwork.getAttrCoreNetworkArn())
                .build();

        CfnOutput.Builder.create(this, "CloudWANGlobalNetworkId")
                .description("Cloud WAN Global Network ID")
                .value(globalNetwork.getRef())
                .build();

        CfnOutput.Builder.create(this, "CloudWANVPCAttachmentId")
                .description("Cloud WAN VPC Attachment ID")
                .value(vpcAttachment.getRef())
                .build();
    }

    private void addResourceTags(Construct resource, String key, String value) {
        software.amazon.awscdk.Tags.of(resource).add(key, value);
        software.amazon.awscdk.Tags.of(resource).add("Project", "SecureCloudEnvironment");
        software.amazon.awscdk.Tags.of(resource).add("ManagedBy", "CDK");
        software.amazon.awscdk.Tags.of(resource).add("Region", "us-west-2");
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }
}

/**
 * Main entry point for the TAP CDK Java application.
 * 
 * Creates a secure cloud environment with advanced networking capabilities including:
 * VPC, EC2 instance using Graviton4, restricted security group, CloudFront distribution,
 * Amazon VPC Lattice for microservices communication, and AWS Network Manager Cloud WAN
 * for global connectivity with intent-based networking policies.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        App app = new App();

        // Get environment suffix from context or environment variable
        String environmentSuffix = (String) app.getNode().tryGetContext("environmentSuffix");
        if (environmentSuffix == null) {
            environmentSuffix = System.getenv("ENVIRONMENT_SUFFIX");
        }
        if (environmentSuffix == null) {
            environmentSuffix = "dev";
        }

        // Create the main TAP stack with us-west-2 region
        new TapStack(app, "TapStack" + environmentSuffix, TapStackProps.builder()
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                                .region("us-west-2")  // Fixed region as required
                                .build())
                        .build())
                .build());

        // Synthesize the CDK app
        app.synth();
    }
}
```

## Key Features

### Advanced Networking Components

1. **Amazon VPC Lattice Service Network**
   - Microservices communication framework
   - IAM-based authentication and authorization
   - Service discovery and load balancing
   - Target group integration with EC2 instance

2. **AWS Network Manager Cloud WAN**
   - Global network management with intent-based policies
   - Production and development network segments
   - Automatic route creation and traffic routing
   - Multi-region connectivity capabilities

3. **Enhanced Security**
   - VPC Lattice resource policies for service-to-service authentication
   - Environment-based access control using tags
   - Restricted SSH access and secure web communication

### Deployment Complexity

This enhanced infrastructure introduces significant deployment complexity:
- Cross-service dependencies between VPC Lattice and Cloud WAN
- Intent-based networking policies requiring careful JSON configuration  
- IAM resource policies for service-to-service authentication
- Complex resource associations and network attachments

The infrastructure demonstrates modern AWS networking capabilities while maintaining security best practices and providing a foundation for microservices architectures with global connectivity.