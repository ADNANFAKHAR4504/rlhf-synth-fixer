To achieve the requirements, we'll create an AWS CDK application in Java that defines the infrastructure for both development and production environments. Below is the implementation:

```java
package com.myorg;

import software.amazon.awscdk.core.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.elasticloadbalancingv2.*;
import software.amazon.awscdk.services.iam.*;

public class MultiEnvInfrastructureApp {
    public static void main(final String[] args) {
        App app = new App();

        // Define environment configurations
        Environment devEnv = Environment.builder()
            .account("DEV_ACCOUNT_ID")
            .region("us-east-1")
            .build();

        Environment prodEnv = Environment.builder()
            .account("PROD_ACCOUNT_ID")
            .region("us-east-1")
            .build();

        // Deploy the stack to both environments
        new MultiEnvInfrastructureStack(app, "DevStack", StackProps.builder()
            .env(devEnv)
            .build());

        new MultiEnvInfrastructureStack(app, "ProdStack", StackProps.builder()
            .env(prodEnv)
            .build());

        app.synth();
    }
}

class MultiEnvInfrastructureStack extends Stack {
    public MultiEnvInfrastructureStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with 2 public and 2 private subnets across 2 AZs
        Vpc vpc = Vpc.Builder.create(this, "VPC")
            .maxAzs(2)
            .subnetConfiguration(List.of(
                SubnetConfiguration.builder()
                    .subnetType(SubnetType.PUBLIC)
                    .name("PublicSubnet")
                    .build(),
                SubnetConfiguration.builder()
                    .subnetType(SubnetType.PRIVATE)
                    .name("PrivateSubnet")
                    .build()
            ))
            .build();

        // Security group for EC2 instances
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup")
            .vpc(vpc)
            .allowAllOutbound(true)
            .description("Allow http inbound and all outbound traffic")
            .build();

        // Allow ALB to access EC2 instances on port 80
        ec2SecurityGroup.addIngressRule(Peer.ipv4(vpc.getVpcCidrBlock()), Port.tcp(80), "Allow HTTP from ALB");

        // IAM Role for EC2 instances with least privilege
        Role ec2Role = Role.Builder.create(this, "EC2InstanceRole")
            .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
            .description("Role for EC2 instances with least privilege access")
            .build();

        // Create EC2 instances in private subnets
        vpc.selectSubnets(SubnetSelection.builder().subnetType(SubnetType.PRIVATE).build())
            .getSubnets().forEach(subnet -> {
                Instance.Builder.create(this, "Instance" + subnet.getAvailabilityZone())
                    .instanceType(InstanceType.of(InstanceClass.T2, InstanceSize.MICRO))
                    .machineImage(new AmazonLinuxImage())
                    .vpc(vpc)
                    .vpcSubnets(SubnetSelection.builder().subnets(List.of(subnet)).build())
                    .securityGroup(ec2SecurityGroup)
                    .role(ec2Role)
                    .build();
            });

        // Create Application Load Balancer in public subnets
        ApplicationLoadBalancer alb = ApplicationLoadBalancer.Builder.create(this, "ALB")
            .vpc(vpc)
            .internetFacing(true)
            .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
            .build();

        // Add a listener and target group for the ALB
        ApplicationListener listener = alb.addListener("Listener", BaseApplicationListenerProps.builder()
            .port(80)
            .open(true)
            .build());

        ApplicationTargetGroup targetGroup = listener.addTargets("TargetGroup", AddApplicationTargetsProps.builder()
            .port(80)
            .vpc(vpc)
            .build());

        // Register EC2 instances with the target group
        vpc.selectSubnets(SubnetSelection.builder().subnetType(SubnetType.PRIVATE).build())
            .getInstances().forEach(targetGroup::addTarget);

        // Output the DNS name of the ALB
        CfnOutput.Builder.create(this, "LoadBalancerDNS")
            .value(alb.getLoadBalancerDnsName())
            .build();
    }
}
```

### Key Points:

1. **Environment Separation**: The infrastructure is deployed to two different AWS accounts for development and production.
2. **VPC Configuration**: A VPC with two public and two private subnets across two Availability Zones.
3. **Security**:
   - Security groups are configured to allow only necessary traffic.
   - IAM roles for EC2 instances follow the principle of least privilege.
4. **Modularity**: The stack is designed to be reusable for both environments.

### Deployment:

To deploy, ensure you have the AWS CDK CLI installed and configured with the necessary credentials. Then, run:

```bash
cdk deploy DevStack
cdk deploy ProdStack
```

This will deploy the infrastructure to the respective AWS accounts. Make sure to replace `DEV_ACCOUNT_ID` and `PROD_ACCOUNT_ID` with the actual AWS account IDs.