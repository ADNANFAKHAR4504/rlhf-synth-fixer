# AWS CDK Java Web Application Infrastructure

I'll help you create secure infrastructure for your web application using AWS CDK Java. This solution implements the security requirements with proper resource naming and latest AWS features.

## Solution Architecture

The infrastructure includes:
- A VPC with public subnet for the EC2 instance
- Security group allowing only HTTPS (port 443) traffic
- IAM role with S3 read-only permissions
- EC2 instance with Session Manager access and IMDSv2

## Implementation

Here's the complete CDK Java code:

### WebAppStack.java
```java
package app;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;

public class WebAppStack extends Stack {
    
    public WebAppStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public WebAppStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC for the application
        Vpc vpc = Vpc.Builder.create(this, "myapp-vpc-production")
                .maxAzs(2)
                .natGateways(0) // No NAT gateways for cost optimization
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("public")
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build()
                ))
                .build();

        // Create security group allowing only HTTPS traffic
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "myapp-securitygroup-production")
                .vpc(vpc)
                .description("Security group for web application - HTTPS only")
                .allowAllOutbound(true)
                .build();

        // Add inbound rule for HTTPS traffic only
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS traffic"
        );

        // Create IAM role with S3 read-only access
        Role ec2Role = Role.Builder.create(this, "myapp-iamrole-production")
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("IAM role for EC2 instance with S3 read-only access")
                .build();

        // Add S3 read-only policy to the role
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"));

        // Add Systems Manager Session Manager policy for secure access
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));

        // Create instance profile for the EC2 role
        InstanceProfile instanceProfile = InstanceProfile.Builder.create(this, "myapp-instanceprofile-production")
                .role(ec2Role)
                .build();

        // Get the latest Amazon Linux 2023 AMI
        IMachineImage amazonLinuxImage = MachineImage.latestAmazonLinux2023(AmazonLinux2023ImageSsmParameterProps.builder()
                .edition(AmazonLinux2023Edition.STANDARD)
                .build());

        // Create EC2 instance with security configurations
        Instance webInstance = Instance.Builder.create(this, "myapp-instance-production")
                .instanceType(InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .machineImage(amazonLinuxImage)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PUBLIC)
                        .build())
                .securityGroup(webSecurityGroup)
                .role(ec2Role)
                .requireImdsv2(true) // Enforce IMDSv2 for enhanced security
                .userData(UserData.forLinux()) // Empty user data for basic setup
                .build();

        // Tag all resources for better organization
        this.getNode().applyAspect(new TagsAspect());
    }

    // Custom aspect to tag all resources
    private static class TagsAspect implements software.amazon.awscdk.IAspect {
        @Override
        public void visit(software.constructs.IConstruct node) {
            if (node instanceof software.amazon.awscdk.CfnResource) {
                software.amazon.awscdk.CfnResource cfnResource = (software.amazon.awscdk.CfnResource) node;
                cfnResource.addPropertyOverride("Tags", Arrays.asList(
                        software.amazon.awscdk.CfnTag.builder()
                                .key("Project")
                                .value("myapp")
                                .build(),
                        software.amazon.awscdk.CfnTag.builder()
                                .key("Environment") 
                                .value("production")
                                .build()
                ));
            }
        }
    }
}
```

### Updated Main.java
```java
package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class Main {
    public static void main(final String[] args) {
        App app = new App();

        new WebAppStack(app, "WebAppStack", StackProps.builder()
                .env(Environment.builder()
                        .account(System.getenv("CDK_DEFAULT_ACCOUNT"))
                        .region("us-east-1")
                        .build())
                .build());

        app.synth();
    }
}
```

## Security Features Implemented

1. **Network Security**: Security group restricted to HTTPS (port 443) only
2. **IAM Security**: Least privilege role with S3 read-only access
3. **Instance Security**: IMDSv2 enforcement and Session Manager access
4. **Access Control**: No SSH access, only secure Session Manager connections

## Key Benefits

- **Zero SSH**: Uses AWS Systems Manager Session Manager for secure shell access
- **IMDSv2**: Enhanced metadata service security to prevent SSRF attacks
- **Least Privilege**: IAM role has minimal required permissions
- **Network Isolation**: Security group allows only necessary traffic
- **Cost Optimized**: Uses t3.micro instances and no NAT gateways

The infrastructure follows AWS security best practices and implements the latest security features for production workloads.