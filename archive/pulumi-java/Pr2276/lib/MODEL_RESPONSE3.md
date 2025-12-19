The error occurs because we're trying to create subnets in `us-east-1a` availability zone while deploying to the `us-west-2` region. The issue is that we're using a global `GetAvailabilityZones.invoke()` call that's not respecting the provider context.

Here's the fix:

## 1. Updated NetworkStack with Provider-Aware AZ Lookup

```java
package com.example.webhosting.infrastructure;

import com.example.webhosting.config.AppConfig;
import com.example.webhosting.utils.TagUtils;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.GetAvailabilityZonesArgs;
import com.pulumi.aws.ec2.inputs.RouteTableRouteArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.InvokeOptions;

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

        // Get availability zones for the specific provider/region
        var availabilityZones = GetAvailabilityZones.invoke(
            GetAvailabilityZonesArgs.builder()
                .state("available")
                .build(),
            InvokeOptions.builder()
                .provider(options.getProvider().orElse(null))
                .build()
        );

        // Create VPC with unique name
        var vpc = new Vpc(region + "-web-hosting-vpc", VpcArgs.builder()
            .cidrBlock(AppConfig.getVpcCidrBlock(region))
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(TagUtils.getTagsWithName(region + "-WebHosting-VPC"))
            .build(), ComponentResourceOptions.builder()
            .parent(this)
            .provider(options.getProvider().orElse(null))
            .build());

        this.vpcId = vpc.id();

        // Create Internet Gateway with unique name
        var internetGateway = new InternetGateway(region + "-web-hosting-igw", 
            InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(TagUtils.getTagsWithName(region + "-WebHosting-IGW"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        this.internetGatewayId = internetGateway.id();

        // Create Public Subnets with unique names
        var publicSubnetPrimary = new Subnet(region + "-public-subnet-primary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPublicSubnetPrimaryCidr(region))
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                .mapPublicIpOnLaunch(true)
                .tags(TagUtils.getTagsWithName(region + "-Public-Subnet-Primary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        var publicSubnetSecondary = new Subnet(region + "-public-subnet-secondary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPublicSubnetSecondaryCidr(region))
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                .mapPublicIpOnLaunch(true)
                .tags(TagUtils.getTagsWithName(region + "-Public-Subnet-Secondary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        this.publicSubnetPrimaryId = publicSubnetPrimary.id();
        this.publicSubnetSecondaryId = publicSubnetSecondary.id();

        // Create Private Subnets with unique names
        var privateSubnetPrimary = new Subnet(region + "-private-subnet-primary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPrivateSubnetPrimaryCidr(region))
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                .tags(TagUtils.getTagsWithName(region + "-Private-Subnet-Primary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        var privateSubnetSecondary = new Subnet(region + "-private-subnet-secondary", 
            SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(AppConfig.getPrivateSubnetSecondaryCidr(region))
                .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                .tags(TagUtils.getTagsWithName(region + "-Private-Subnet-Secondary"))
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
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
                .provider(options.getProvider().orElse(null))
                .build());

        this.publicRouteTableId = publicRouteTable.id();

        // Associate Route Table with Public Subnets with unique names
        new RouteTableAssociation(region + "-public-subnet-primary-association", 
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetPrimary.id())
                .routeTableId(publicRouteTable.id())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        new RouteTableAssociation(region + "-public-subnet-secondary-association", 
            RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetSecondary.id())
                .routeTableId(publicRouteTable.id())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());
    }
}
```

## 2. Updated SecurityStack with Provider Context

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
                .provider(options.getProvider().orElse(null))
                .build());

        this.webSecurityGroupId = webSecurityGroup.id();
    }
}
```

## 3. Updated StorageStack with Provider Context

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
                .provider(options.getProvider().orElse(null))
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
                .provider(options.getProvider().orElse(null))
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
                .provider(options.getProvider().orElse(null))
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
                .provider(options.getProvider().orElse(null))
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
                .provider(options.getProvider().orElse(null))
                .build());

        // Attach policy to role with unique name
        new RolePolicyAttachment(region + "-role-policy-attachment", 
            RolePolicyAttachmentArgs.builder()
                .role(iamRole.name())
                .policyArn(policy.arn())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        // Create Instance Profile with unique name
        var instanceProfile = new InstanceProfile(region + "-ec2-instance-profile", 
            InstanceProfileArgs.builder()
                .name(region + "-ec2-instance-profile")
                .role(iamRole.name())
                .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(options.getProvider().orElse(null))
                .build());

        this.instanceProfileName = instanceProfile.name();
    }
}
```

## 4. Updated ComputeStack with Provider Context

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
import com.pulumi.resources.InvokeOptions;

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

        // Get the latest Amazon Linux 2 AMI for the specific provider/region
        var ami = GetAmi.invoke(GetAmiArgs.builder()
            .mostRecent(true)
            .owners(AppConfig.getEc2AmiOwner())
            .filters(GetAmiFilterArgs.builder()
                .name("name")
                .values(AppConfig.getEc2AmiName())
                .build())
            .build(),
            InvokeOptions.builder()
                .provider(options.getProvider().orElse(null))
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
                .provider(options.getProvider().orElse(null))
                .build());

        this.instanceId = instance.id();
        this.publicIp = instance.publicIp();
    }
}
```

## 5. Alternative Approach: Single Region Deployment with Failover Configuration

If you prefer to deploy to one region at a time and set up failover separately, here's an alternative approach:

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
            // Get region from config or environment variable
            String deploymentRegion = System.getenv("DEPLOYMENT_REGION");
            if (deploymentRegion == null) {
                deploymentRegion = AppConfig.getPrimaryRegion();
            }

            // Create AWS provider for the deployment region
            var provider = new Provider("aws-provider", 
                ProviderArgs.builder()
                    .region(deploymentRegion)
                    .build());

            // Deploy infrastructure to the specified region
            deployInfrastructure(ctx, deploymentRegion, provider);
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

        // Export outputs
        ctx.export("vpcId", networkStack.vpcId);
        ctx.export("bucketId", storageStack.bucketId);
        ctx.export("instanceId", computeStack.instanceId);
        ctx.export("publicIp", computeStack.publicIp);
        ctx.export("bucketArn", storageStack.bucketArn);
        ctx.export("websiteUrl", computeStack.publicIp.apply(ip -> "http://" + ip));
        ctx.export("region", region);
    }
}
```

## Deployment Commands

For single region deployment:
```bash
# Deploy to primary region (us-east-1)
pulumi up

# Deploy to secondary region (us-west-2)
DEPLOYMENT_REGION=us-west-2 pulumi up --stack secondary
```

## Key Fixes Applied:

1. **Provider Context**: All `invoke` calls now use `InvokeOptions.builder().provider()` to ensure they use the correct regional provider
2. **Explicit Provider Assignment**: All resources now explicitly inherit the provider from their parent options
3. **Region-Specific AZ Lookup**: Availability zones are now fetched for the specific region/provider context
4. **Consistent Provider Propagation**: Provider context is properly passed down through all component resource options

This should resolve the availability zone mismatch error and ensure resources are created in the correct regions.