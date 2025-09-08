```java
package app;

import java.util.Arrays;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.CfnKeyPair;
import software.amazon.awscdk.services.ec2.Instance;
import software.amazon.awscdk.services.ec2.MachineImage;
import software.amazon.awscdk.services.ec2.Peer;
import software.amazon.awscdk.services.ec2.Port;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.amazon.awscdk.services.ec2.SubnetConfiguration;
import software.amazon.awscdk.services.ec2.SubnetSelection;
import software.amazon.awscdk.services.ec2.SubnetType;
import software.amazon.awscdk.services.ec2.UserData;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.rds.Credentials;
import software.amazon.awscdk.services.rds.DatabaseInstance;
import software.amazon.awscdk.services.rds.DatabaseInstanceEngine;
import software.amazon.awscdk.services.rds.MySqlInstanceEngineProps;
import software.amazon.awscdk.services.rds.MysqlEngineVersion;
import software.amazon.awscdk.services.rds.StorageType;
import software.amazon.awscdk.services.rds.SubnetGroup;
import software.constructs.Construct;

public class Main {
  public static void main(final String[] args) {
    App app = new App();

    // Get environment suffix from context or default to "dev"
    String environmentSuffix = app.getNode().tryGetContext("environmentSuffix") != null
        ? app.getNode().tryGetContext("environmentSuffix").toString()
        : "dev";

    new TapStack(app, "TapStack" + environmentSuffix, StackProps.builder()
        .env(Environment.builder()
            .region("eu-west-2")
            .build())
        .build());

    app.synth();
  }
}

class TapStack extends Stack {
  public TapStack(final Construct scope, final String id, final StackProps props) {
    super(scope, id, props);

    // Get configuration from context or environment variables
    String dbPassword = getContextOrEnv("dbPassword", "MySecurePassword123!");
    String instanceType = getContextOrEnv("instanceType", "t3.micro");
    String myIpAddress = getContextOrEnv("myIpAddress", "0.0.0.0/0"); // Replace with your actual IP

    // Create VPC
    Vpc vpc = Vpc.Builder.create(this, "TapVpc")
        .maxAzs(2)
        .natGateways(1)
        .subnetConfiguration(Arrays.asList(
            SubnetConfiguration.builder()
                .name("public")
                .subnetType(SubnetType.PUBLIC)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("private")
                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                .cidrMask(24)
                .build(),
            SubnetConfiguration.builder()
                .name("isolated")
                .subnetType(SubnetType.PRIVATE_ISOLATED)
                .cidrMask(24)
                .build()))
        .build();

    // Security Group for EC2 (SSH access from your IP only)
    SecurityGroup ec2SecurityGroup = SecurityGroup.Builder.create(this, "EC2SecurityGroup")
        .vpc(vpc)
        .description("Security group for EC2 instance")
        .allowAllOutbound(true)
        .build();

    ec2SecurityGroup.addIngressRule(
        Peer.ipv4(myIpAddress),
        Port.tcp(22),
        "SSH access from my IP");

    // Security Group for RDS (MySQL access from EC2 only)
    SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, "RDSSecurityGroup")
        .vpc(vpc)
        .description("Security group for RDS MySQL database")
        .allowAllOutbound(false)
        .build();

    rdsSecurityGroup.addIngressRule(
        Peer.securityGroupId(ec2SecurityGroup.getSecurityGroupId()),
        Port.tcp(3306),
        "MySQL access from EC2");

    // Create DB Subnet Group
    SubnetGroup dbSubnetGroup = SubnetGroup.Builder.create(this, "DBSubnetGroup")
        .vpc(vpc)
        .description("Subnet group for RDS database")
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PRIVATE_ISOLATED)
            .build())
        .build();

    // Create RDS MySQL Database
    DatabaseInstance database = DatabaseInstance.Builder.create(this, "TapDatabase")
        .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
            .version(MysqlEngineVersion.VER_8_0_37)
            .build()))
        .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
            software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3,
            software.amazon.awscdk.services.ec2.InstanceSize.MICRO))
        .vpc(vpc)
        .subnetGroup(dbSubnetGroup)
        .securityGroups(Arrays.asList(rdsSecurityGroup))
        .credentials(Credentials.fromPassword("admin",
            software.amazon.awscdk.SecretValue.unsafePlainText(dbPassword)))
        .multiAz(false) // Set to true for production
        .allocatedStorage(20)
        .storageType(StorageType.GP2)
        .backupRetention(software.amazon.awscdk.Duration.days(7))
        .deletionProtection(false) // Set to true for production
        .deleteAutomatedBackups(false)
        .build();

    // Create Key Pair
    String keyPairName = getContextOrEnv("keyPairName", "tap-key-pair-" + this.getStackName().toLowerCase());
    CfnKeyPair keyPair = CfnKeyPair.Builder.create(this, "TapKeyPair")
        .keyName(keyPairName)
        .build();

    // Create EC2 Instance
    Instance ec2Instance = Instance.Builder.create(this, "TapEC2Instance")
        .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(
            software.amazon.awscdk.services.ec2.InstanceClass.BURSTABLE3,
            software.amazon.awscdk.services.ec2.InstanceSize.valueOf(instanceType.toUpperCase().replace("T3.", ""))))
        .machineImage(MachineImage.latestAmazonLinux2())
        .vpc(vpc)
        .vpcSubnets(SubnetSelection.builder()
            .subnetType(SubnetType.PUBLIC)
            .build())
        .securityGroup(ec2SecurityGroup)
        .keyName(keyPairName)
        .userData(UserData.forLinux())
        .build();

    // Add user data to install MySQL client
    ec2Instance.addUserData(
        "#!/bin/bash",
        "yum update -y",
        "yum install -y mysql",
        "yum install -y amazon-cloudwatch-agent");

    // Output important information
    software.amazon.awscdk.CfnOutput.Builder.create(this, "VPCId")
        .value(vpc.getVpcId())
        .description("VPC ID")
        .build();

    software.amazon.awscdk.CfnOutput.Builder.create(this, "EC2InstanceId")
        .value(ec2Instance.getInstanceId())
        .description("EC2 Instance ID")
        .build();

    software.amazon.awscdk.CfnOutput.Builder.create(this, "EC2PublicIP")
        .value(ec2Instance.getInstancePublicIp())
        .description("EC2 Public IP Address")
        .build();

    software.amazon.awscdk.CfnOutput.Builder.create(this, "DatabaseEndpoint")
        .value(database.getInstanceEndpoint().getHostname())
        .description("RDS Database Endpoint")
        .build();

    software.amazon.awscdk.CfnOutput.Builder.create(this, "DatabasePort")
        .value(database.getInstanceEndpoint().getPort().toString())
        .description("RDS Database Port")
        .build();

    // Output key pair information
    software.amazon.awscdk.CfnOutput.Builder.create(this, "KeyPairName")
        .value(keyPair.getKeyName())
        .description("EC2 Key Pair Name")
        .build();

    software.amazon.awscdk.CfnOutput.Builder.create(this, "KeyPairPrivateKey")
        .value(keyPair.getRef())
        .description("EC2 Key Pair Reference")
        .build();
  }

  private String getContextOrEnv(String key, String defaultValue) {
    // First try to get from CDK context
    Object contextValue = this.getNode().tryGetContext(key);
    if (contextValue != null) {
      return contextValue.toString();
    }

    // Then try environment variable
    String envValue = System.getenv(key.toUpperCase());
    if (envValue != null && !envValue.isEmpty()) {
      return envValue;
    }

    // Return default value
    return defaultValue;
  }
}
```