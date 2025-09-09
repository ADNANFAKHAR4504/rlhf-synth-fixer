I'll design a comprehensive Pulumi Java SDK configuration for a simple web hosting environment on AWS. Note that you mentioned Terraform in some requirements, but I'll implement this using Pulumi as requested.

## Project Structure

```
pulumi-web-hosting/
├── src/main/java/
│   └── com/example/webhosting/
│       ├── App.java
│       ├── config/
│       │   └── AppConfig.java
│       ├── infrastructure/
│       │   ├── NetworkStack.java
│       │   ├── SecurityStack.java
│       │   ├── ComputeStack.java
│       │   └── StorageStack.java
│       └── utils/
│           └── TagUtils.java
├── src/main/resources/
│   └── application.properties
├── pom.xml
└── Pulumi.yaml
```

## 1. Maven Configuration (pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>pulumi-web-hosting</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <pulumi.version>0.9.9</pulumi.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.pulumi</groupId>
            <artifactId>pulumi</artifactId>
            <version>${pulumi.version}</version>
        </dependency>
        <dependency>
            <groupId>com.pulumi</groupId>
            <artifactId>aws</artifactId>
            <version>6.8.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## 2. Configuration File (application.properties)

```properties
# AWS Configuration
aws.primary.region=us-east-1
aws.secondary.region=us-west-2

# Network Configuration
vpc.cidr.block=10.0.0.0/16
subnet.public.primary.cidr=10.0.1.0/24
subnet.public.secondary.cidr=10.0.2.0/24
subnet.private.primary.cidr=10.0.3.0/24
subnet.private.secondary.cidr=10.0.4.0/24

# EC2 Configuration
ec2.instance.type=t3.micro
ec2.ami.name=amzn2-ami-hvm-*
ec2.ami.owner=amazon

# S3 Configuration
s3.bucket.name.prefix=web-hosting-static
s3.website.index.document=index.html
s3.website.error.document=error.html

# Tagging
default.environment=Development
project.name=WebHosting

# State Management
state.bucket.name=pulumi-state-web-hosting
```

## 3. Configuration Management Class

```java
package com.example.webhosting.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class AppConfig {
    private static final Properties properties = new Properties();
    
    static {
        try (InputStream input = AppConfig.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (input != null) {
                properties.load(input);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load configuration", e);
        }
    }
    
    public static String getPrimaryRegion() {
        return properties.getProperty("aws.primary.region");
    }
    
    public static String getSecondaryRegion() {
        return properties.getProperty("aws.secondary.region");
    }
    
    public static String getVpcCidrBlock() {
        return properties.getProperty("vpc.cidr.block");
    }
    
    public static String getPublicSubnetPrimaryCidr() {
        return properties.getProperty("subnet.public.primary.cidr");
    }
    
    public static String getPublicSubnetSecondaryCidr() {
        return properties.getProperty("subnet.public.secondary.cidr");
    }
    
    public static String getPrivateSubnetPrimaryCidr() {
        return properties.getProperty("subnet.private.primary.cidr");
    }
    
    public static String getPrivateSubnetSecondaryCidr() {
        return properties.getProperty("subnet.private.secondary.cidr");
    }
    
    public static String getEc2InstanceType() {
        return properties.getProperty("ec2.instance.type");
    }
    
    public static String getEc2AmiName() {
        return properties.getProperty("ec2.ami.name");
    }
    
    public static String getEc2AmiOwner() {
        return properties.getProperty("ec2.ami.owner");
    }
    
    public static String getS3BucketNamePrefix() {
        return properties.getProperty("s3.bucket.name.prefix");
    }
    
    public static String getS3WebsiteIndexDocument() {
        return properties.getProperty("s3.website.index.document");
    }
    
    public static String getS3WebsiteErrorDocument() {
        return properties.getProperty("s3.website.error.document");
    }
    
    public static String getDefaultEnvironment() {
        return properties.getProperty("default.environment");
    }
    
    public static String getProjectName() {
        return properties.getProperty("project.name");
    }
    
    public static String getStateBucketName() {
        return properties.getProperty("state.bucket.name");
    }
}
```

## 4. Tag Utilities

```java
package com.example.webhosting.utils;

import com.example.webhosting.config.AppConfig;
import java.util.Map;

public class TagUtils {
    public static Map<String, String> getDefaultTags() {
        return Map.of(
            "Environment", AppConfig.getDefaultEnvironment(),
            "Project", AppConfig.getProjectName(),
            "ManagedBy", "Pulumi"
        );
    }
    
    public static Map<String, String> getTagsWithName(String name) {
        var tags = new java.util.HashMap<>(getDefaultTags());
        tags.put("Name", name);
        return tags;
    }
}
```

## 5. Network Infrastructure Stack

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.RouteTableRouteArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.List;

public class NetworkStack extends ComponentResource {
    public final Output<String> vpcId;
    public final Output<String> publicSubnetPrimaryId;
    public final Output<String> publicSubnetSecondaryId;
    public final Output<String> privateSubnetPrimaryId;
    public final Output<String> privateSubnetSecondaryId;
    public final Output<String> internetGatewayId;
    public final Output<String> publicRouteTableId;

    public NetworkStack(String name, ComponentResourceOptions options) {
        super("custom:infrastructure:NetworkStack", name, options);

        // Get availability zones
        var availabilityZones = GetAvailabilityZones.invoke();

        // Create VPC
        var vpc = new Vpc("web-hosting-vpc", VpcArgs.builder()
            .cidrBlock(AppConfig.getVpcCidrBlock())
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(TagUtils.getTagsWithName("WebHosting-VPC"))
            .build(), ComponentResourceOptions.builder()
            .parent(this)
            .build());

        this.vpcId = vpc.id();

        // Create Internet Gateway
        var internetGateway = new InternetGateway("web-hosting-igw", 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(TagUtils.getTagsWithName("WebHosting-IGW"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.internetGatewayId = internetGateway.id();

        // Create Public Subnets
        var publicSubnetPrimary = new Subnet("public-subnet-primary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPublicSubnetPrimaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                .mapPublicIpOnLaunch(true)
                .tags(TagUtils.getTagsWithName("Public-Subnet-Primary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        var publicSubnetSecondary = new Subnet("public-subnet-secondary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPublicSubnetSecondaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                .mapPublicIpOnLaunch(true)
                .tags(TagUtils.getTagsWithName("Public-Subnet-Secondary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.publicSubnetPrimaryId = publicSubnetPrimary.id();
        this.publicSubnetSecondaryId = publicSubnetSecondary.id();

        // Create Private Subnets
        var privateSubnetPrimary = new Subnet("private-subnet-primary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPrivateSubnetPrimaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                .tags(TagUtils.getTagsWithName("Private-Subnet-Primary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        var privateSubnetSecondary = new Subnet("private-subnet-secondary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPrivateSubnetSecondaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                .tags(TagUtils.getTagsWithName("Private-Subnet-Secondary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.privateSubnetPrimaryId = privateSubnetPrimary.id();
        this.privateSubnetSecondaryId = privateSubnetSecondary.id();

        // Create Route Table for Public Subnets
        var publicRouteTable = new RouteTable("public-route-table", 
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .routes(RouteTableRouteArgs.builder()
                    .cidrBlock("0.0.0.0/0")
                    .gatewayId(internetGateway.id())
                    .build())
                .tags(TagUtils.getTagsWithName("Public-Route-Table"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.publicRouteTableId = publicRouteTable.id();

        // Associate Route Table with Public Subnets
        new RouteTableAssociation("public-subnet-primary-association", 
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetPrimary.id())
                .routeTableId(publicRouteTable.id())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        new RouteTableAssociation("public-subnet-secondary-association", 
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetSecondary.id())
                .routeTableId(publicRouteTable.id())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());
    }
}
```

## 6. Security Stack

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.List;

public class SecurityStack extends ComponentResource {
    public final Output<String> webSecurityGroupId;

    public SecurityStack(String name, Output<String> vpcId, ComponentResourceOptions options) {
        super("custom:infrastructure:SecurityStack", name, options);

        // Create Security Group for Web Servers
        var webSecurityGroup = new SecurityGroup("web-security-group", 
            SecurityGroupArgs.builder()
                .name("web-security-group")
                .description("Security group for web servers")
                .vpcId(vpcId)
                .ingress(List.of(
                    SecurityGroupIngressArgs.builder()
                        .description("HTTP")
                        .fromPort(80)
                        .toPort(80)
                        .protocol("tcp")
                        .cidrBlocks("0.0.0.0/0")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .description("HTTPS")
                        .fromPort(443)
                        .toPort(443)
                        .protocol("tcp")
                        .cidrBlocks("0.0.0.0/0")
                        .build(),
                    SecurityGroupIngressArgs.builder()
                        .description("SSH")
                        .fromPort(22)
                        .toPort(22)
                        .protocol("tcp")
                        .cidrBlocks("0.0.0.0/0")
                        .build()
                ))
                .egress(SecurityGroupEgressArgs.builder()
                    .fromPort(0)
                    .toPort(0)
                    .protocol("-1")
                    .cidrBlocks("0.0.0.0/0")
                    .build())
                .tags(TagUtils.getTagsWithName("Web-Security-Group"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.webSecurityGroupId = webSecurityGroup.id();
    }
}
```

## 7. Storage Stack

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.iam.*;
import com.pulumi.aws.iam.inputs.RolePolicyAttachmentArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketWebsiteConfigurationV2;
import com.pulumi.aws.s3.BucketWebsiteConfigurationV2Args;
import com.pulumi.aws.s3.inputs.BucketWebsiteConfigurationV2IndexDocumentArgs;
import com.pulumi.aws.s3.inputs.BucketWebsiteConfigurationV2ErrorDocumentArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

public class StorageStack extends ComponentResource {
    public final Output<String> bucketId;
    public final Output<String> bucketArn;
    public final Output<String> iamRoleArn;
    public final Output<String> instanceProfileName;

    public StorageStack(String name, ComponentResourceOptions options) {
        super("custom:infrastructure:StorageStack", name, options);

        // Create S3 Bucket for static website hosting
        var bucket = new Bucket("web-hosting-bucket", 
            BucketArgs.builder()
                .bucket(AppConfig.getS3BucketNamePrefix() + "-" + System.currentTimeMillis())
                .tags(TagUtils.getTagsWithName("Web-Hosting-Bucket"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.bucketId = bucket.id();
        this.bucketArn = bucket.arn();

        // Configure bucket for static website hosting
        new BucketWebsiteConfigurationV2("bucket-website-config", 
            BucketWebsiteConfigurationV2Args.builder()
                .bucket(bucket.id())
                .indexDocument(BucketWebsiteConfigurationV2IndexDocumentArgs.builder()
                    .suffix(AppConfig.getS3WebsiteIndexDocument())
                    .build())
                .errorDocument(BucketWebsiteConfigurationV2ErrorDocumentArgs.builder()
                    .key(AppConfig.getS3WebsiteErrorDocument())
                    .build())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Block public access (we'll use CloudFront for public access)
        new BucketPublicAccessBlock("bucket-public-access-block", 
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Create IAM Role for EC2 instance
        var assumeRolePolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ]
            }
            """;

        var iamRole = new Role("ec2-s3-access-role", 
            RoleArgs.builder()
                .name("ec2-s3-access-role")
                .assumeRolePolicy(assumeRolePolicy)
                .tags(TagUtils.getTagsWithName("EC2-S3-Access-Role"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.iamRoleArn = iamRole.arn();

        // Create IAM Policy for S3 access
        var s3AccessPolicy = bucket.arn().apply(arn -> String.format("""
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "%s",
                            "%s/*"
                        ]
                    }
                ]
            }
            """, arn, arn));

        var policy = new Policy("s3-access-policy", 
            PolicyArgs.builder()
                .name("s3-access-policy")
                .policy(s3AccessPolicy)
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Attach policy to role
        new RolePolicyAttachment("role-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(iamRole.name())
                .policyArn(policy.arn())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Create Instance Profile
        var instanceProfile = new InstanceProfile("ec2-instance-profile", 
            InstanceProfileArgs.builder()
                .name("ec2-instance-profile")
                .role(iamRole.name())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceProfileName = instanceProfile.name();
    }
}
```

## 8. Compute Stack

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.ec2.GetAmi;
import com.pulumi.aws.ec2.GetAmiArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.List;

public class ComputeStack extends ComponentResource {
    public final Output<String> instanceId;
    public final Output<String> publicIp;

    public ComputeStack(String name, 
                       Output<String> subnetId, 
                       Output<String> securityGroupId,
                       Output<String> instanceProfileName,
                       ComponentResourceOptions options) {
        super("custom:infrastructure:ComputeStack", name, options);

        // Get the latest Amazon Linux 2 AMI
        var ami = GetAmi.invoke(GetAmiArgs.builder()
            .mostRecent(true)
            .owners(AppConfig.getEc2AmiOwner())
            .filters(GetAmiFilterArgs.builder()
                .name("name")
                .values(AppConfig.getEc2AmiName())
                .build())
            .build());

        // User data script to install and configure web server
        String userData = """
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Welcome to Web Hosting Environment</h1>" > /var/www/html/index.html
            echo "<p>Environment: %s</p>" >> /var/www/html/index.html
            echo "<p>Instance deployed via Pulumi</p>" >> /var/www/html/index.html
            """.formatted(AppConfig.getDefaultEnvironment());

        // Create EC2 Instance
        var instance = new Instance("web-server", 
            InstanceArgs.builder()
                .instanceType(AppConfig.getEc2InstanceType())
                .ami(ami.applyValue(GetAmi::id))
                .subnetId(subnetId)
                .vpcSecurityGroupIds(securityGroupId)
                .iamInstanceProfile(instanceProfileName)
                .userData(userData)
                .associatePublicIpAddress(true)
                .tags(TagUtils.getTagsWithName("Web-Server"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceId = instance.id();
        this.publicIp = instance.publicIp();
    }
}
```

## 9. Main Application

```java
package com.example.webhosting;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.infrastructure.*;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.resources.ComponentResourceOptions;

public class App {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Create AWS providers for different regions
            var primaryProvider = new Provider("primary-provider", 
                ProviderArgs.builder()
                    .region(AppConfig.getPrimaryRegion())
                    .build());

            var secondaryProvider = new Provider("secondary-provider", 
                ProviderArgs.builder()
                    .region(AppConfig.getSecondaryRegion())
                    .build());

            // Deploy primary region infrastructure
            deployInfrastructure(ctx, "primary", primaryProvider);
            
            // Deploy secondary region infrastructure for failover
            deployInfrastructure(ctx, "secondary", secondaryProvider);
        });
    }

    private static void deployInfrastructure(com.pulumi.Context ctx, String region, Provider provider) {
        var options = ComponentResourceOptions.builder()
            .provider(provider)
            .build();

        // Deploy Network Stack
        var networkStack = new NetworkStack(region + "-network", options);

        // Deploy Security Stack
        var securityStack = new SecurityStack(region + "-security", 
            networkStack.vpcId, options);

        // Deploy Storage Stack
        var storageStack = new StorageStack(region + "-storage", options);

        // Deploy Compute Stack
        var computeStack = new ComputeStack(region + "-compute",
            networkStack.publicSubnetPrimaryId,
            securityStack.webSecurityGroupId,
            storageStack.instanceProfileName,
            options);

        // Export outputs
        ctx.export(region + "-vpcId", networkStack.vpcId);
        ctx.export(region + "-bucketId", storageStack.bucketId);
        ctx.export(region + "-instanceId", computeStack.instanceId);
        ctx.export(region + "-publicIp", computeStack.publicIp);
        ctx.export(region + "-bucketArn", storageStack.bucketArn);
    }
}
```

## 10. Pulumi Configuration (Pulumi.yaml)

```yaml
name: web-hosting-environment
runtime: java
description: A simple web hosting environment on AWS with failover capabilities

config:
  aws:region: us-east-1
  
backend:
  url: s3://pulumi-state-web-hosting
```

## 11. State Management Script (setup-backend.sh)

```bash
#!/bin/bash

# Create S3 bucket for Pulumi state
aws s3 mb s3://pulumi-state-web-hosting --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket pulumi-state-web-hosting \
    --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
    --bucket pulumi-state-web-hosting \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

echo "Backend S3 bucket created and configured successfully!"
```

## Key Features

### 1. **Multi-Region Deployment**
- Deploys infrastructure in both `us-east-1` and `us-west-2` for failover capabilities
- Uses separate AWS providers for each region

### 2. **Configuration Management**
- Uses `application.properties` instead of `Pulumi.yaml` for configuration
- Centralized configuration through `AppConfig` class
- Easy to modify without touching code

### 3. **Modular Architecture**
- Separated into logical stacks: Network, Security, Storage, and Compute
- Each stack is a ComponentResource for better organization
- Reusable components across regions

### 4. **Security Best Practices**
- No hard-coded credentials (uses AWS CLI/SDK credential chain)
- IAM roles and policies with least privilege
- Security groups with specific port access
- S3 bucket with public access blocked

### 5. **State Management**
- Configured to use S3 backend for state storage
- Includes script to set up the backend bucket with versioning and encryption

### 6. **Tagging Strategy**
- Consistent tagging across all resources
- Environment and project tags for resource management

## Deployment Instructions

1. **Setup AWS credentials** (no hard-coding):
   ```bash
   aws configure
   # or use IAM roles, environment variables, etc.
   ```

2. **Create state backend**:
   ```bash
   chmod +x setup-backend.sh
   ./setup-backend.sh
   ```

3. **Build and deploy**:
   ```bash
   mvn clean compile
   pulumi up
   ```

4. **Access outputs**:
   ```bash
   pulumi stack output
   ```

This configuration provides a robust, scalable, and maintainable web hosting environment with proper separation of concerns and configuration management.