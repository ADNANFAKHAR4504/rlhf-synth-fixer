package app.constructs;

import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.constructs.Construct;
import app.config.EnvironmentConfig;

/**
 * Minimal web server construct that creates a t3.micro EC2 instance in a public subnet
 * and a lightweight instance role. Intended to satisfy prompt requirements for a
 * web-facing host locked down to HTTPS.
 */
public class WebServerConstruct extends Construct {

    private final Instance instance;
    private final Role role;

    public WebServerConstruct(final Construct scope, final String id, final Vpc vpc, final SecurityGroup webSecurityGroup) {
        super(scope, id);

        // Create a minimal role for the EC2 instance (least privilege placeholder)
        this.role = Role.Builder.create(this, EnvironmentConfig.getResourceName("web", "instance-role"))
                .assumedBy(new ServicePrincipal("ec2.amazonaws.com"))
                .build();

        // Create the EC2 instance in a public subnet using Amazon Linux (t3.micro)
        this.instance = Instance.Builder.create(this, EnvironmentConfig.getResourceName("web", "instance"))
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
                .machineImage(MachineImage.latestAmazonLinux())
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
                .securityGroup(webSecurityGroup)
                .role(this.role)
                .build();
    }

    public Instance getInstance() { return instance; }
    public Role getRole() { return role; }
}
