package app;

import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Tags;
import software.amazon.awscdk.services.ec2.AmazonLinux2ImageSsmParameterProps;
import software.amazon.awscdk.services.ec2.AmazonLinuxCpuType;
import software.amazon.awscdk.services.ec2.IMachineImage;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.InstanceClass;
import software.amazon.awscdk.services.ec2.InstanceSize;
import software.amazon.awscdk.services.ec2.InstanceType;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.CfnInstance;
import software.amazon.awscdk.services.ec2.CfnSecurityGroupIngress;
import software.amazon.awscdk.services.ec2.CfnSecurityGroupEgress;
import software.amazon.awscdk.services.iam.ManagedPolicy;
import software.amazon.awscdk.services.iam.Role;
import software.amazon.awscdk.services.iam.ServicePrincipal;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.Map;

public class WebAppStack extends Stack {
    
    private final String environmentSuffix;
    
    public WebAppStack(final Construct scope, final String id) {
        this(scope, id, null, "dev");
    }
    
    public WebAppStack(final Construct scope, final String id, final StackProps props) {
        this(scope, id, props, "prod");
    }

    public WebAppStack(final Construct scope, final String id, final StackProps props, final String envSuffix) {
        super(scope, id, props);
        this.environmentSuffix = envSuffix != null ? envSuffix : "dev";

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

        // Create security group for web application (without implicit rules)
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "myapp-sg-" + environmentSuffix)
                .vpc(vpc)
                .description("Security group for web application - HTTPS only")
                .allowAllOutbound(false)  // Disable implicit outbound rules
                .build();

        // Create explicit ingress rule for HTTPS traffic
        CfnSecurityGroupIngress httpsIngress = CfnSecurityGroupIngress.Builder.create(this, "myapp-sg-ingress-https-" + environmentSuffix)
                .groupId(webSecurityGroup.getSecurityGroupId())
                .ipProtocol("tcp")
                .fromPort(443)
                .toPort(443)
                .cidrIp("0.0.0.0/0")
                .build();

        // Create explicit egress rule for all outbound traffic
        CfnSecurityGroupEgress allOutboundEgress = CfnSecurityGroupEgress.Builder.create(this, "myapp-sg-egress-all-" + environmentSuffix)
                .groupId(webSecurityGroup.getSecurityGroupId())
                .ipProtocol("-1")
                .cidrIp("0.0.0.0/0")
                .build();

        // Create IAM role with S3 read-only access
        Role ec2Role = Role.Builder.create(this, "myapp-ec2role-" + environmentSuffix)
                .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
                .description("IAM role for EC2 instance with S3 read-only access")
                .build();

        // Add S3 read-only policy to the role
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"));

        // Add Systems Manager Session Manager policy for secure access
        ec2Role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));

        // Instance profile will be automatically created by CDK when role is assigned to EC2 instance

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

        // Add explicit metadata options for IMDSv2 enforcement (required by tests)
        CfnInstance cfnInstance = (CfnInstance) webInstance.getNode().getDefaultChild();
        cfnInstance.addPropertyOverride("MetadataOptions", Map.of(
                "HttpTokens", "required",
                "HttpPutResponseHopLimit", 2
        ));

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