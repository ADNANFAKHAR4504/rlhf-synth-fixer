package app;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;

public class WebAppStack extends Stack {
    
    private final String environmentSuffix;
    
    public WebAppStack(final Construct scope, final String id) {
        this(scope, id, null, "dev");
    }
    
    public WebAppStack(final Construct scope, final String id, final StackProps props) {
        this(scope, id, props, "dev");
    }

    public WebAppStack(final Construct scope, final String id, final StackProps props, final String environmentSuffix) {
        super(scope, id, props);
        this.environmentSuffix = environmentSuffix != null ? environmentSuffix : "dev";

        // Create VPC for the application
        Vpc vpc = Vpc.Builder.create(this, "myapp-vpc-" + environmentSuffix)
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
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "myapp-securitygroup-" + environmentSuffix)
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
        Role ec2Role = Role.Builder.create(this, "myapp-ec2role-" + environmentSuffix)
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("IAM role for EC2 instance with S3 read-only access")
                .build();

        // Add S3 read-only policy to the role
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"));

        // Add Systems Manager Session Manager policy for secure access
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));

        // Create instance profile for the EC2 role
        InstanceProfile instanceProfile = InstanceProfile.Builder.create(this, "myapp-instanceprofile-" + environmentSuffix)
                .role(ec2Role)
                .build();

        // Get the latest Amazon Linux 2 AMI
        IMachineImage amazonLinuxImage = MachineImage.latestAmazonLinux2(
                AmazonLinux2ImageSsmParameterProps.builder()
                        .cpuType(AmazonLinuxCpuType.X86_64)
                        .build());

        // Create EC2 instance with security configurations
        Instance webInstance = Instance.Builder.create(this, "myapp-instance-" + environmentSuffix)
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
        Tags.of(this).add("Project", "myapp");
        Tags.of(this).add("Environment", "production");
        Tags.of(this).add("EnvironmentSuffix", environmentSuffix);
        
        // Add CloudFormation outputs
        CfnOutput.Builder.create(this, "VpcId")
                .description("VPC ID")
                .value(vpc.getVpcId())
                .build();
                
        CfnOutput.Builder.create(this, "SecurityGroupId")
                .description("Security Group ID")
                .value(webSecurityGroup.getSecurityGroupId())
                .build();
                
        CfnOutput.Builder.create(this, "InstanceId")
                .description("EC2 Instance ID")
                .value(webInstance.getInstanceId())
                .build();
                
        CfnOutput.Builder.create(this, "InstancePublicIp")
                .description("EC2 Instance Public IP")
                .value(webInstance.getInstancePublicIp())
                .build();
                
        CfnOutput.Builder.create(this, "RoleArn")
                .description("IAM Role ARN")
                .value(ec2Role.getRoleArn())
                .build();
    }
}