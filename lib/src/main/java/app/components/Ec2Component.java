package app.components;

import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
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
