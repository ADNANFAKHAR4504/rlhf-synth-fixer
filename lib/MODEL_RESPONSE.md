Here's a Java CDK script that sets up the infrastructure you described, adhering to AWS best practices:

```java
import software.amazon.awscdk.core.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.rds.*;

public class VpcInfrastructureStack extends Stack {
    public VpcInfrastructureStack(final App scope, final String id) {
        super(scope, id);

        // Create VPC with public/private subnets
        Vpc vpc = Vpc.Builder.create(this, "MainVPC")
            .maxAzs(2)
            .cidr("10.0.0.0/16")
            .subnetConfiguration(List.of(
                SubnetConfiguration.builder()
                    .name("PublicSubnet")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("PrivateSubnet")
                    .subnetType(SubnetType.PRIVATE)
                    .cidrMask(24)
                    .build()
            ))
            .natGateways(1)
            .build();

        // Security group for EC2 instances
        SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup")
            .vpc(vpc)
            .allowAllOutbound(true)
            .build();

        // Restrict SSH access to specific IP
        ec2SecurityGroup.addIngressRule(
            Peer.ipv4("YOUR_IP_ADDRESS/32"),
            Port.tcp(22),
            "Allow SSH from specific IP"
        );

        // EC2 instance in public subnet
        Instance.Builder.create(this, "WebServer")
            .instanceType(InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO))
            .machineImage(new AmazonLinuxImage())
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PUBLIC).build())
            .securityGroup(ec2SecurityGroup)
            .build();

        // Security group for RDS
        SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, "RDSSecurityGroup")
            .vpc(vpc)
            .allowAllOutbound(false)
            .build();

        // Allow EC2 instances to connect to RDS
        rdsSecurityGroup.addIngressRule(
            ec2SecurityGroup,
            Port.tcp(5432),
            "Allow EC2 to RDS"
        );

        // PostgreSQL RDS instance
        DatabaseInstance rdsInstance = DatabaseInstance.Builder.create(this, "PostgreSQL")
            .engine(DatabaseInstanceEngine.postgres(PostgresInstanceEngineProps.builder()
                .version(PostgresEngineVersion.VER_13_3)
                .build()))
            .instanceType(InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL))
            .credentials(Credentials.fromGeneratedSecret("admin"))
            .vpc(vpc)
            .vpcSubnets(SubnetSelection.builder().subnetType(SubnetType.PRIVATE).build())
            .securityGroups(List.of(rdsSecurityGroup))
            .storageEncrypted(true)
            .backupRetention(Duration.days(7))
            .removalPolicy(RemovalPolicy.SNAPSHOT)
            .build();

        // Add proper tagging
        Tags.of(vpc).add("Environment", "Production");
        Tags.of(ec2SecurityGroup).add("Name", "WebServerSecurityGroup");
        Tags.of(rdsInstance).add("Service", "Database");
    }

    public static void main(final String[] args) {
        App app = new App();
        new VpcInfrastructureStack(app, "VpcInfrastructure");
        app.synth();
    }
}
```

Key components included:
1. VPC with 2 AZs, public/private subnets and NAT Gateway
2. EC2 instance with restricted SSH access
3. PostgreSQL RDS with encryption and backups
4. Security groups with least privilege access
5. Resource tagging for all major components

Make sure to:
1. Replace `YOUR_IP_ADDRESS` with your actual IP
2. Configure proper credentials
3. Add additional error handling as needed
4. Review IAM roles created by CDK

To deploy:
1. Install AWS CDK and Java SDK
2. Set up AWS credentials
3. Run `cdk bootstrap aws://ACCOUNT/us-west-2`
4. Deploy with `cdk deploy`

The infrastructure follows AWS best practices including:
- Network segmentation
- Encryption at rest
- Restricted security groups
- Automated backups
- Resource tagging
- Private database placement

Remember to validate the configuration against your organization's specific security requirements before deploying to production.