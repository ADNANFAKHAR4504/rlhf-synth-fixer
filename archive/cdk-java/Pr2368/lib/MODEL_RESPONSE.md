I'll help you create a basic AWS environment using AWS CDK with Java. Here's the complete setup:

## Project Structure

First, let's set up the basic CDK Java project structure:

```
my-cdk-app/
├── pom.xml
└── src/
    └── main/
        └── java/
            └── com/
                └── mycompany/
                    └── app/
                        └── Main.java
```

## pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd"
         xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.mycompany</groupId>
    <artifactId>my-cdk-app</artifactId>
    <version>0.1</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdk.version>2.100.0</cdk.version>
        <constructs.version>10.3.0</constructs.version>
        <junit.version>5.7.1</junit.version>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
    </properties>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <release>11</release>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>com.mycompany.app.Main</mainClass>
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

        <!-- JUnit 5 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</dependencies>
</project>
```

## Main.java

```java
package com.mycompany.app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.rds.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(final String[] args) {
        App app = new App();
        
        // Get environment suffix from context or default to "dev"
        String environmentSuffix = app.getNode().tryGetContext("environmentSuffix") != null ? 
            app.getNode().tryGetContext("environmentSuffix").toString() : "dev";
        
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
                                .build()
                ))
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
                "SSH access from my IP"
        );

        // Security Group for RDS (MySQL access from EC2 only)
        SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, "RDSSecurityGroup")
                .vpc(vpc)
                .description("Security group for RDS MySQL database")
                .allowAllOutbound(false)
                .build();

        rdsSecurityGroup.addIngressRule(
                Peer.securityGroupId(ec2SecurityGroup.getSecurityGroupId()),
                Port.tcp(3306),
                "MySQL access from EC2"
        );

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
                        .version(MysqlEngineVersion.VER_8_0_35)
                        .build()))
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO))
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

        // Create Key Pair (you'll need to create this manually or import existing one)
        // For this example, we'll reference an existing key pair
        String keyPairName = getContextOrEnv("keyPairName", "my-key-pair");

        // Create EC2 Instance
        Instance ec2Instance = Instance.Builder.create(this, "TapEC2Instance")
                .instanceType(InstanceType.of(InstanceClass.BURSTABLE3, 
                        InstanceSize.valueOf(instanceType.toUpperCase().replace("T3.", ""))))
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
                "yum install -y amazon-cloudwatch-agent"
        );

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

## Setup and Deployment Instructions

### 1. Prerequisites

Make sure you have:
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Java 11 or higher
- Maven

### 2. Create SSH Key Pair

Before deploying, create an SSH key pair in the AWS console or using CLI:

```bash
aws ec2 create-key-pair --key-name my-key-pair --query 'KeyMaterial' --output text > my-key-pair.pem
chmod 400 my-key-pair.pem
```

### 3. Set Configuration

You can set configuration in several ways:

**Option 1: Environment Variables**
```bash
export DB_PASSWORD="YourSecurePassword123!"
export INSTANCE_TYPE="t3.micro"
export MY_IP_ADDRESS="YOUR_IP/32"  # Replace with your actual IP
export KEY_PAIR_NAME="my-key-pair"
```

**Option 2: CDK Context**
```bash
cdk deploy --context dbPassword="YourSecurePassword123!" --context myIpAddress="YOUR_IP/32" --context environmentSuffix="dev"
```

### 4. Deploy the Stack

```bash
# Install dependencies
mvn compile

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy TapStackdev
```

## Security Best Practices Implemented

1. **Network Isolation**: 
   - RDS database is in isolated subnets (no internet access)
   - EC2 instance is in public subnet for SSH access

2. **Security Groups**:
   - EC2 security group only allows SSH from your IP
   - RDS security group only allows MySQL access from EC2

3. **Least Privilege**:
   - No unnecessary ports are opened
   - Database is not publicly accessible

4. **Backup Strategy**:
   - Automatic backups enabled for 7 days
   - Can be extended for production use

## Key Features

- **VPC with proper subnet configuration** (public, private, isolated)
- **MySQL RDS database** with automatic backups
- **EC2 instance** with Amazon Linux 2
- **Security groups** following least privilege principle
- **Configurable parameters** via environment variables or CDK context
- **CloudFormation outputs** for important resource information

## Usage After Deployment

1. **Connect to EC2**:
```bash
ssh -i my-key-pair.pem ec2-user@<EC2_PUBLIC_IP>
```

2. **Connect to Database from EC2**:
```bash
mysql -h <DATABASE_ENDPOINT> -u admin -p
```

This setup provides a solid foundation for a basic AWS environment with proper security practices and can be easily extended for production use.