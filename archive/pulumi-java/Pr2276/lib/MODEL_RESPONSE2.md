The error occurs because we're creating resources with the same names in both regions, causing URN conflicts. Let me fix this by making resource names unique per region and improving the overall structure.

## Fixed Project Structure

Here's the corrected implementation with unique resource naming:

## 1. Updated Network Stack

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.RouteTableRouteArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

public class NetworkStack extends ComponentResource {
    public final Output<String> vpcId;
    public final Output<String> publicSubnetPrimaryId;
    public final Output<String> publicSubnetSecondaryId;
    public final Output<String> privateSubnetPrimaryId;
    public final Output<String> privateSubnetSecondaryId;
    public final Output<String> internetGatewayId;
    public final Output<String> publicRouteTableId;

    private final String region;

    public NetworkStack(String name, String region, ComponentResourceOptions options) {
        super("custom:infrastructure:NetworkStack", name, options);
        this.region = region;

        // Get availability zones
        var availabilityZones = GetAvailabilityZones.invoke();

        // Create VPC with unique name
        var vpc = new Vpc(region + "-web-hosting-vpc", VpcArgs.builder()
            .cidrBlock(AppConfig.getVpcCidrBlock())
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(TagUtils.getTagsWithName(region + "-WebHosting-VPC"))
            .build(), ComponentResourceOptions.builder()
            .parent(this)
            .build());

        this.vpcId = vpc.id();

        // Create Internet Gateway with unique name
        var internetGateway = new InternetGateway(region + "-web-hosting-igw", 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(TagUtils.getTagsWithName(region + "-WebHosting-IGW"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.internetGatewayId = internetGateway.id();

        // Create Public Subnets with unique names
        var publicSubnetPrimary = new Subnet(region + "-public-subnet-primary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPublicSubnetPrimaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                .mapPublicIpOnLaunch(true)
                .tags(TagUtils.getTagsWithName(region + "-Public-Subnet-Primary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        var publicSubnetSecondary = new Subnet(region + "-public-subnet-secondary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPublicSubnetSecondaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                .mapPublicIpOnLaunch(true)
                .tags(TagUtils.getTagsWithName(region + "-Public-Subnet-Secondary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.publicSubnetPrimaryId = publicSubnetPrimary.id();
        this.publicSubnetSecondaryId = publicSubnetSecondary.id();

        // Create Private Subnets with unique names
        var privateSubnetPrimary = new Subnet(region + "-private-subnet-primary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPrivateSubnetPrimaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                .tags(TagUtils.getTagsWithName(region + "-Private-Subnet-Primary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        var privateSubnetSecondary = new Subnet(region + "-private-subnet-secondary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPrivateSubnetSecondaryCidr())
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                .tags(TagUtils.getTagsWithName(region + "-Private-Subnet-Secondary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.privateSubnetPrimaryId = privateSubnetPrimary.id();
        this.privateSubnetSecondaryId = privateSubnetSecondary.id();

        // Create Route Table for Public Subnets with unique name
        var publicRouteTable = new RouteTable(region + "-public-route-table", 
            RouteTableArgs.builder()
                .vpcId(vpc.id())
                .routes(RouteTableRouteArgs.builder()
                    .cidrBlock("0.0.0.0/0")
                    .gatewayId(internetGateway.id())
                    .build())
                .tags(TagUtils.getTagsWithName(region + "-Public-Route-Table"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.publicRouteTableId = publicRouteTable.id();

        // Associate Route Table with Public Subnets with unique names
        new RouteTableAssociation(region + "-public-subnet-primary-association", 
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetPrimary.id())
                .routeTableId(publicRouteTable.id())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        new RouteTableAssociation(region + "-public-subnet-secondary-association", 
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetSecondary.id())
                .routeTableId(publicRouteTable.id())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());
    }
}
```

## 2. Updated Security Stack

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

    private final String region;

    public SecurityStack(String name, String region, Output<String> vpcId, ComponentResourceOptions options) {
        super("custom:infrastructure:SecurityStack", name, options);
        this.region = region;

        // Create Security Group for Web Servers with unique name
        var webSecurityGroup = new SecurityGroup(region + "-web-security-group", 
            SecurityGroupArgs.builder()
                .name(region + "-web-security-group")
                .description("Security group for web servers in " + region)
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
                .tags(TagUtils.getTagsWithName(region + "-Web-Security-Group"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.webSecurityGroupId = webSecurityGroup.id();
    }
}
```

## 3. Updated Storage Stack

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.iam.*;
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

    private final String region;

    public StorageStack(String name, String region, ComponentResourceOptions options) {
        super("custom:infrastructure:StorageStack", name, options);
        this.region = region;

        // Create S3 Bucket for static website hosting with unique name
        var bucket = new Bucket(region + "-web-hosting-bucket", 
            BucketArgs.builder()
                .bucket(AppConfig.getS3BucketNamePrefix() + "-" + region + "-" + System.currentTimeMillis())
                .tags(TagUtils.getTagsWithName(region + "-Web-Hosting-Bucket"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.bucketId = bucket.id();
        this.bucketArn = bucket.arn();

        // Configure bucket for static website hosting
        new BucketWebsiteConfigurationV2(region + "-bucket-website-config", 
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
        new BucketPublicAccessBlock(region + "-bucket-public-access-block", 
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Create IAM Role for EC2 instance with unique name
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

        var iamRole = new Role(region + "-ec2-s3-access-role", 
            RoleArgs.builder()
                .name(region + "-ec2-s3-access-role")
                .assumeRolePolicy(assumeRolePolicy)
                .tags(TagUtils.getTagsWithName(region + "-EC2-S3-Access-Role"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.iamRoleArn = iamRole.arn();

        // Create IAM Policy for S3 access with unique name
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

        var policy = new Policy(region + "-s3-access-policy", 
            PolicyArgs.builder()
                .name(region + "-s3-access-policy")
                .policy(s3AccessPolicy)
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Attach policy to role with unique name
        new RolePolicyAttachment(region + "-role-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(iamRole.name())
                .policyArn(policy.arn())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        // Create Instance Profile with unique name
        var instanceProfile = new InstanceProfile(region + "-ec2-instance-profile", 
            InstanceProfileArgs.builder()
                .name(region + "-ec2-instance-profile")
                .role(iamRole.name())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceProfileName = instanceProfile.name();
    }
}
```

## 4. Updated Compute Stack

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

public class ComputeStack extends ComponentResource {
    public final Output<String> instanceId;
    public final Output<String> publicIp;

    private final String region;

    public ComputeStack(String name, 
                       String region,
                       Output<String> subnetId, 
                       Output<String> securityGroupId,
                       Output<String> instanceProfileName,
                       ComponentResourceOptions options) {
        super("custom:infrastructure:ComputeStack", name, options);
        this.region = region;

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
            echo "<p>Region: %s</p>" >> /var/www/html/index.html
            echo "<p>Instance deployed via Pulumi</p>" >> /var/www/html/index.html
            """.formatted(AppConfig.getDefaultEnvironment(), region);

        // Create EC2 Instance with unique name
        var instance = new Instance(region + "-web-server", 
            InstanceArgs.builder()
                .instanceType(AppConfig.getEc2InstanceType())
                .ami(ami.applyValue(GetAmi::id))
                .subnetId(subnetId)
                .vpcSecurityGroupIds(securityGroupId)
                .iamInstanceProfile(instanceProfileName)
                .userData(userData)
                .associatePublicIpAddress(true)
                .tags(TagUtils.getTagsWithName(region + "-Web-Server"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceId = instance.id();
        this.publicIp = instance.publicIp();
    }
}
```

## 5. Updated Main Application

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
            deployInfrastructure(ctx, AppConfig.getPrimaryRegion(), primaryProvider);
            
            // Deploy secondary region infrastructure for failover
            deployInfrastructure(ctx, AppConfig.getSecondaryRegion(), secondaryProvider);
        });
    }

    private static void deployInfrastructure(com.pulumi.Context ctx, String region, Provider provider) {
        var options = ComponentResourceOptions.builder()
            .provider(provider)
            .build();

        // Deploy Network Stack
        var networkStack = new NetworkStack(region + "-network", region, options);

        // Deploy Security Stack
        var securityStack = new SecurityStack(region + "-security", region,
            networkStack.vpcId, options);

        // Deploy Storage Stack
        var storageStack = new StorageStack(region + "-storage", region, options);

        // Deploy Compute Stack
        var computeStack = new ComputeStack(region + "-compute", region,
            networkStack.publicSubnetPrimaryId,
            securityStack.webSecurityGroupId,
            storageStack.instanceProfileName,
            options);

        // Export outputs with region prefix
        ctx.export(region + "VpcId", networkStack.vpcId);
        ctx.export(region + "BucketId", storageStack.bucketId);
        ctx.export(region + "InstanceId", computeStack.instanceId);
        ctx.export(region + "PublicIp", computeStack.publicIp);
        ctx.export(region + "BucketArn", storageStack.bucketArn);
        ctx.export(region + "WebsiteUrl", computeStack.publicIp.apply(ip -> "http://" + ip));
    }
}
```

## 6. Updated Configuration for Different CIDR Blocks per Region

```properties
# AWS Configuration
aws.primary.region=us-east-1
aws.secondary.region=us-west-2

# Network Configuration - Primary Region (us-east-1)
primary.vpc.cidr.block=10.0.0.0/16
primary.subnet.public.primary.cidr=10.0.1.0/24
primary.subnet.public.secondary.cidr=10.0.2.0/24
primary.subnet.private.primary.cidr=10.0.3.0/24
primary.subnet.private.secondary.cidr=10.0.4.0/24

# Network Configuration - Secondary Region (us-west-2)
secondary.vpc.cidr.block=10.1.0.0/16
secondary.subnet.public.primary.cidr=10.1.1.0/24
secondary.subnet.public.secondary.cidr=10.1.2.0/24
secondary.subnet.private.primary.cidr=10.1.3.0/24
secondary.subnet.private.secondary.cidr=10.1.4.0/24

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

## 7. Updated AppConfig Class

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
    
    public static String getVpcCidrBlock(String region) {
        if (region.equals(getPrimaryRegion())) {
            return properties.getProperty("primary.vpc.cidr.block");
        } else {
            return properties.getProperty("secondary.vpc.cidr.block");
        }
    }
    
    public static String getPublicSubnetPrimaryCidr(String region) {
        if (region.equals(getPrimaryRegion())) {
            return properties.getProperty("primary.subnet.public.primary.cidr");
        } else {
            return properties.getProperty("secondary.subnet.public.primary.cidr");
        }
    }
    
    public static String getPublicSubnetSecondaryCidr(String region) {
        if (region.equals(getPrimaryRegion())) {
            return properties.getProperty("primary.subnet.public.secondary.cidr");
        } else {
            return properties.getProperty("secondary.subnet.public.secondary.cidr");
        }
    }
    
    public static String getPrivateSubnetPrimaryCidr(String region) {
        if (region.equals(getPrimaryRegion())) {
            return properties.getProperty("primary.subnet.private.primary.cidr");
        } else {
            return properties.getProperty("secondary.subnet.private.primary.cidr");
        }
    }
    
    public static String getPrivateSubnetSecondaryCidr(String region) {
        if (region.equals(getPrimaryRegion())) {
            return properties.getProperty("primary.subnet.private.secondary.cidr");
        } else {
            return properties.getProperty("secondary.subnet.private.secondary.cidr");
        }
    }
    
    // Keep the original methods for backward compatibility
    public static String getVpcCidrBlock() {
        return getVpcCidrBlock(getPrimaryRegion());
    }
    
    public static String getPublicSubnetPrimaryCidr() {
        return getPublicSubnetPrimaryCidr(getPrimaryRegion());
    }
    
    public static String getPublicSubnetSecondaryCidr() {
        return getPublicSubnetSecondaryCidr(getPrimaryRegion());
    }
    
    public static String getPrivateSubnetPrimaryCidr() {
        return getPrivateSubnetPrimaryCidr(getPrimaryRegion());
    }
    
    public static String getPrivateSubnetSecondaryCidr() {
        return getPrivateSubnetSecondaryCidr(getPrimaryRegion());
    }
    
    // Other methods remain the same...
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

## 8. Update NetworkStack to use region-specific CIDR blocks

```java
// In NetworkStack constructor, replace the CIDR block calls:
.cidrBlock(AppConfig.getVpcCidrBlock(region))

// And for subnets:
.cidrBlock(AppConfig.getPublicSubnetPrimaryCidr(region))
.cidrBlock(AppConfig.getPublicSubnetSecondaryCidr(region))
.cidrBlock(AppConfig.getPrivateSubnetPrimaryCidr(region))
.cidrBlock(AppConfig.getPrivateSubnetSecondaryCidr(region))
```

## Key Changes Made:

1. **Unique Resource Names**: All resources now include the region prefix to ensure unique URNs
2. **Region-Specific CIDR Blocks**: Different CIDR blocks for each region to avoid conflicts
3. **Improved Configuration**: Region-aware configuration management
4. **Better Resource Identification**: Each resource is clearly identified by region in tags and names
5. **Enhanced Outputs**: Outputs are prefixed with region names for clarity

This should resolve the duplicate URN error and provide a clean multi-region deployment.