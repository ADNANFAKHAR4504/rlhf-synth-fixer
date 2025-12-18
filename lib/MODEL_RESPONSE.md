I'll help you create a comprehensive AWS VPC setup using CDK Java with modern features and best practices. Here's the complete infrastructure code:

Main CDK Stack File

```java
package com.example.vpc;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class VpcInfrastructureStack extends Stack {
    
    public VpcInfrastructureStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public VpcInfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with specified CIDR
        Vpc vpc = Vpc.Builder.create(this, "MainVPC")
                .ipAddresses(IpAddresses.cidr("10.0.0.0/16"))
                .maxAzs(2)
                .natGateways(0) // No NAT gateways needed for public subnets only
                .subnetConfiguration(List.of(
                    SubnetConfiguration.builder()
                        .name("PublicSubnet")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build()
                ))
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .build();

        // Create security group for SSH access
        SecurityGroup sshSecurityGroup = SecurityGroup.Builder.create(this, "SSHSecurityGroup")
                .vpc(vpc)
                .description("Security group for SSH access from specific IP")
                .allowAllOutbound(true)
                .build();

        // Add SSH ingress rule for specific IP
        sshSecurityGroup.addIngressRule(
                Peer.ipv4("203.0.113.0/32"),
                Port.tcp(22),
                "SSH access from specific IP"
        );

        // Create security group for HTTP/HTTPS (for future CloudFront VPC Origins)
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "WebSecurityGroup")
                .vpc(vpc)
                .description("Security group for web traffic")
                .allowAllOutbound(true)
                .build();

        // Add HTTP and HTTPS ingress rules
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "HTTP access from anywhere"
        );
        
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "HTTPS access from anywhere"
        );

        // Create IAM role for EC2 instance with SSM permissions
        Role ec2Role = Role.Builder.create(this, "EC2InstanceRole")
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .description("IAM role for EC2 instance with SSM access")
                .managedPolicies(List.of(
                    ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
                    ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
                ))
                .build();

        // Create instance profile
        CfnInstanceProfile instanceProfile = CfnInstanceProfile.Builder.create(this, "EC2InstanceProfile")
                .roles(List.of(ec2Role.getRoleName()))
                .build();

        // Get the latest Amazon Linux 2023 AMI
        IMachineImage amazonLinux = MachineImage.latestAmazonLinux2023(
                AmazonLinux2023ImageSsmParameterProps.builder()
                    .edition(AmazonLinux2023Edition.STANDARD)
                    .build()
        );

        // User data script for EC2 instance
        UserData userData = UserData.forLinux();
        userData.addCommands(
                "#!/bin/bash",
                "yum update -y",
                "yum install -y amazon-cloudwatch-agent",
                "yum install -y htop curl wget",
                "# Install Docker for containerized applications",
                "yum install -y docker",
                "systemctl start docker",
                "systemctl enable docker",
                "usermod -a -G docker ec2-user",
                "# Configure CloudWatch agent",
                "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default",
                "echo 'Setup completed' > /tmp/setup-complete.log"
        );

        // Create EC2 instance using latest generation instance type (t3.micro for cost efficiency)
        Instance ec2Instance = Instance.Builder.create(this, "WebServerInstance")
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .availabilityZones(List.of(vpc.getAvailabilityZones().get(0)))
                    .build())
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO)) // Latest generation
                .machineImage(amazonLinux)
                .securityGroup(sshSecurityGroup)
                .userData(userData)
                .role(ec2Role)
                .keyName("my-key-pair") // Replace with your actual key pair name
                .detailedMonitoring(true)
                .build();

        // Add web security group to the instance
        ec2Instance.addSecurityGroup(webSecurityGroup);

        // Create Launch Template for future EC2 Fleet usage
        CfnLaunchTemplate launchTemplate = CfnLaunchTemplate.Builder.create(this, "WebServerLaunchTemplate")
                .launchTemplateName("web-server-template")
                .launchTemplateData(CfnLaunchTemplate.LaunchTemplateDataProperty.builder()
                    .imageId(amazonLinux.getImage(this).getImageId())
                    .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO).toString())
                    .keyName("my-key-pair") // Replace with your actual key pair name
                    .securityGroupIds(List.of(
                        sshSecurityGroup.getSecurityGroupId(),
                        webSecurityGroup.getSecurityGroupId()
                    ))
                    .iamInstanceProfile(CfnLaunchTemplate.IamInstanceProfileProperty.builder()
                        .name(instanceProfile.getRef())
                        .build())
                    .userData(software.amazon.awscdk.Fn.base64(userData.render()))
                    .monitoring(CfnLaunchTemplate.MonitoringProperty.builder()
                        .enabled(true)
                        .build())
                    .tagSpecifications(List.of(
                        CfnLaunchTemplate.TagSpecificationProperty.builder()
                            .resourceType("instance")
                            .tags(List.of(
                                CfnTag.builder().key("Name").value("WebServer-Fleet").build(),
                                CfnTag.builder().key("Environment").value("Production").build(),
                                CfnTag.builder().key("Project").value("VPC-Infrastructure").build()
                            ))
                            .build()
                    ))
                    .build())
                .build();

        // Apply tags to all resources
        Tags.of(this).add("Environment", "Production");
        Tags.of(this).add("Project", "VPC-Infrastructure");
        Tags.of(this).add("ManagedBy", "CDK");
        Tags.of(this).add("CostCenter", "Infrastructure");

        // Tag specific resources
        Tags.of(vpc).add("Name", "Main-VPC");
        Tags.of(ec2Instance).add("Name", "WebServer-Instance");
        Tags.of(sshSecurityGroup).add("Name", "SSH-SecurityGroup");
        Tags.of(webSecurityGroup).add("Name", "Web-SecurityGroup");

        // Output important information
        software.amazon.awscdk.CfnOutput.Builder.create(this, "VPCId")
                .description("VPC ID")
                .value(vpc.getVpcId())
                .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "EC2InstanceId")
                .description("EC2 Instance ID")
                .value(ec2Instance.getInstanceId())
                .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "EC2PublicIP")
                .description("EC2 Instance Public IP")
                .value(ec2Instance.getInstancePublicIp())
                .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "LaunchTemplateId")
                .description("Launch Template ID for EC2 Fleet")
                .value(launchTemplate.getRef())
                .build();

        software.amazon.awscdk.CfnOutput.Builder.create(this, "PublicSubnetIds")
                .description("Public Subnet IDs")
                .value(String.join(",", vpc.getPublicSubnets().stream()
                    .map(ISubnet::getSubnetId)
                    .toList()))
                .build();
    }
}
CDK App Main Class
package com.example.vpc;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class VpcInfrastructureApp {
    public static void main(final String[] args) {
        App app = new App();

        new VpcInfrastructureStack(app, "VpcInfrastructureStack", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region("us-west-1")
                        .build())
                .description("Production VPC infrastructure with EC2 instance and security groups")
                .build());

        app.synth();
    }
}
```

```xml
pom.xml Dependencies
<?xml version="1.0" encoding="UTF-8"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"
         xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>vpc-infrastructure</artifactId>
    <version>0.1</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdk.version>2.110.1</cdk.version>
        <constructs.version>10.3.0</constructs.version>
        <junit.version>5.10.1</junit.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <release>17</release>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>com.example.vpc.VpcInfrastructureApp</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <dependencies>
        <!-- AWS CDK -->
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>aws-cdk-lib</artifactId>
            <version>${cdk.version}</version>
        </dependency>

        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>${constructs.version}</version>
        </dependency>

        <!-- JUnit for testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</dependencies>
```

## Key Features Implemented:
* Modern AWS Features:
* Latest EC2 Instance Types: Using T3.micro (latest generation) for better performance and cost efficiency
* Launch Template: Ready for EC2 Fleet scaling with pre-configured settings
* CloudFront VPC Origins Ready: Web security group configured for HTTP/HTTPS traffic
* Amazon Linux 2023: Latest AMI with improved security and performance

## Security Best Practices:
* SSH access limited to specific IP (203.0.113.0/32)
* Separate security groups for SSH and web traffic
* IAM role with minimal required permissions (SSM + CloudWatch)
* Detailed monitoring enabled
* No unnecessary NAT gateways (cost optimization)


## Production-Ready Features:
* Comprehensive resource tagging for cost tracking
* CloudWatch agent installation for monitoring
* SSM access for secure shell access without SSH keys
* Docker pre-installed for containerized applications
* Proper DNS resolution enabled


## Scalability Preparation:
* Launch template configured for EC2 Fleet usage
* Security groups ready for load balancer integration
* VPC designed for future CloudFront VPC Origins
* Multiple AZ deployment ready


## Usage Instructions:
* Replace the key pair name in the code with your actual EC2 key pair

## Deploy the stack:
* cdk deploy
* Access your instance via SSH:
* ssh -i your-key.pem ec2-user@<public-ip>
* The infrastructure is designed for production use with proper security, monitoring, and scalability considerations. The launch template makes it easy to scale with EC2 Fleet, and the security groups are configured for future CloudFront VPC Origins integration.