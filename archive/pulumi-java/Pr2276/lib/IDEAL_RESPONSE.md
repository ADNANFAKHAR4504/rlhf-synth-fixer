```java
package app.config;

import com.pulumi.Config;
import com.pulumi.Context;

public class AppConfig {

    private final Config config;

    public AppConfig(Context ctx) {
        this.config = ctx.config();
    }

    public String getDefaultEnvironment() {
        return config.require("environment");
    }

    public String getPrimaryRegion() {
        return config.require("primaryRegion");
    }

    public String getSecondaryRegion() {
        return config.require("secondaryRegion");
    }

    // Network
    public String getVpcCidrBlock() {
        return config.require("vpcCidrBlock");
    }

    public String getPublicSubnetPrimaryCidr() {
        return config.require("publicSubnetPrimaryCidr");
    }

    public String getPublicSubnetSecondaryCidr() {
        return config.require("publicSubnetSecondaryCidr");
    }

    public String getEc2AmiName() {
        return config.require("amiName");
    }

    public String getEc2InstanceType() {
        return config.require("instanceType");
    }

    public String getPrivateSubnetPrimaryCidr() {
        return config.require("privateSubnetPrimaryCidr");
    }

    public String getPrivateSubnetSecondaryCidr() {
        return config.require("privateSubnetSecondaryCidr");
    }

    public String getS3BucketNamePrefix() {
        return config.require("bucketNamePrefix");
    }

    public String getS3WebsiteIndexDocument() {
        return config.require("websiteIndexDocument");
    }

    public String getS3WebsiteErrorDocument() {
        return config.require("websiteErrorDocument");
    }

    public String getProjectName() {
        return config.require("projectName");
    }
}
```

```java
package app.utils;
import app.config.AppConfig;

import java.util.Map;

public final class TagUtils {
    
    private TagUtils() {
        // Utility class should not be instantiated
    }
    public static Map<String, String> getDefaultTags(AppConfig config) {
        return Map.of(
                "Environment", config.getDefaultEnvironment(),
                "Project", config.getProjectName(),
                "ManagedBy", "Pulumi"
        );
    }

    public static Map<String, String> getTagsWithName(String name, AppConfig config) {
        var tags = new java.util.HashMap<>(getDefaultTags(config));
        tags.put("Name", name);
        return tags;
    }
}
```

```java
package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.ec2.InternetGateway;
import com.pulumi.aws.ec2.InternetGatewayArgs;
import com.pulumi.aws.ec2.RouteTable;
import com.pulumi.aws.ec2.RouteTableArgs;
import com.pulumi.aws.ec2.RouteTableAssociation;
import com.pulumi.aws.ec2.RouteTableAssociationArgs;
import com.pulumi.aws.ec2.Subnet;
import com.pulumi.aws.ec2.SubnetArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.inputs.RouteTableRouteArgs;
import com.pulumi.aws.inputs.GetAvailabilityZonesArgs;
import com.pulumi.aws.outputs.GetAvailabilityZonesResult;
import com.pulumi.core.Output;
import com.pulumi.deployment.InvokeOptions;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.Objects;

public class NetworkStack extends ComponentResource {
    public final Output<String> vpcId;
    public final Output<String> publicSubnetPrimaryId;
    public final Output<String> publicSubnetSecondaryId;
    public final Output<String> privateSubnetPrimaryId;
    public final Output<String> privateSubnetSecondaryId;
    public final Output<String> internetGatewayId;
    public final Output<String> publicRouteTableId;

    public NetworkStack(String name, AppConfig config, ComponentResourceOptions options) {
        super("custom:infrastructure:NetworkStack", name, options);

        // Get availability zones
        Output<GetAvailabilityZonesResult> availabilityZones = AwsFunctions.getAvailabilityZones(
                GetAvailabilityZonesArgs.builder()
                        .state("available")
                        .build(),
                InvokeOptions.builder()
                        .provider(Objects.requireNonNull(options.getProvider().orElse(null)))
                        .build()
        );

        // Create VPC
        var vpc = new Vpc(name + "web-hosting-vpc", VpcArgs.builder()
                .cidrBlock(config.getVpcCidrBlock())
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(TagUtils.getTagsWithName("WebHosting-VPC", config))
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.vpcId = vpc.id();

        // Create Internet Gateway
        var internetGateway = new InternetGateway(name + "web-hosting-igw",
                InternetGatewayArgs.builder()
                        .vpcId(vpc.id())
                        .tags(TagUtils.getTagsWithName("WebHosting-IGW", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.internetGatewayId = internetGateway.id();

        // Create Public Subnets
        var publicSubnetPrimary = new Subnet(name + "public-subnet-primary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPublicSubnetPrimaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                        .mapPublicIpOnLaunch(true)
                        .tags(TagUtils.getTagsWithName("Public-Subnet-Primary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        var publicSubnetSecondary = new Subnet(name + "public-subnet-secondary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPublicSubnetSecondaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                        .mapPublicIpOnLaunch(true)
                        .tags(TagUtils.getTagsWithName("Public-Subnet-Secondary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.publicSubnetPrimaryId = publicSubnetPrimary.id();
        this.publicSubnetSecondaryId = publicSubnetSecondary.id();

        // Create Private Subnets
        var privateSubnetPrimary = new Subnet(name + "private-subnet-primary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPrivateSubnetPrimaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(0)))
                        .tags(TagUtils.getTagsWithName("Private-Subnet-Primary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        var privateSubnetSecondary = new Subnet(name + "private-subnet-secondary",
                SubnetArgs.builder()
                        .vpcId(vpc.id())
                        .cidrBlock(config.getPrivateSubnetSecondaryCidr())
                        .availabilityZone(availabilityZones.applyValue(azs -> azs.names().get(1)))
                        .tags(TagUtils.getTagsWithName("Private-Subnet-Secondary", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.privateSubnetPrimaryId = privateSubnetPrimary.id();
        this.privateSubnetSecondaryId = privateSubnetSecondary.id();

        // Create Route Table for Public Subnets
        var publicRouteTable = new RouteTable(name + "public-route-table",
                RouteTableArgs.builder()
                        .vpcId(vpc.id())
                        .routes(RouteTableRouteArgs.builder()
                                .cidrBlock("0.0.0.0/0")
                                .gatewayId(internetGateway.id())
                                .build())
                        .tags(TagUtils.getTagsWithName("Public-Route-Table", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.publicRouteTableId = publicRouteTable.id();

        // Associate Route Table with Public Subnets
        new RouteTableAssociation(name + "public-subnet-primary-association",
                RouteTableAssociationArgs.builder()
                        .subnetId(publicSubnetPrimary.id())
                        .routeTableId(publicRouteTable.id())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        new RouteTableAssociation(name + "public-subnet-secondary-association",
                RouteTableAssociationArgs.builder()
                        .subnetId(publicSubnetSecondary.id())
                        .routeTableId(publicRouteTable.id())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());
    }
}
```

```java
package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;

public class SecurityStack extends ComponentResource {
    public final Output<String> webSecurityGroupId;

    public SecurityStack(String name, Output<String> vpcId, AppConfig config, ComponentResourceOptions options) {
        super("custom:infrastructure:SecurityStack", name, options);

        // Create Security Group for Web Servers
        var webSecurityGroup = new SecurityGroup(name + "web-security-group",
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
                        .tags(TagUtils.getTagsWithName("Web-Security-Group", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.webSecurityGroupId = webSecurityGroup.id();
    }
}
```

```java
package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.iam.InstanceProfile;
import com.pulumi.aws.iam.InstanceProfileArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketWebsiteConfiguration;
import com.pulumi.aws.s3.BucketWebsiteConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketWebsiteConfigurationErrorDocumentArgs;
import com.pulumi.aws.s3.inputs.BucketWebsiteConfigurationIndexDocumentArgs;
import com.pulumi.core.Either;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

public class StorageStack extends ComponentResource {
    public final Output<String> bucketId;
    public final Output<String> bucketArn;
    public final Output<String> iamRoleArn;
    public final Output<String> instanceProfileName;

    public StorageStack(String name, AppConfig config, ComponentResourceOptions options) {
        super("custom:infrastructure:StorageStack", name, options);

        // Create S3 Bucket for static website hosting
        var bucket = new Bucket(name + "web-hosting-bucket",
                BucketArgs.builder()
                        .bucket(config.getS3BucketNamePrefix() + "-" + System.currentTimeMillis())
                        .tags(TagUtils.getTagsWithName("Web-Hosting-Bucket", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.bucketId = bucket.id();
        this.bucketArn = bucket.arn();

        // Configure bucket for static website hosting
        new BucketWebsiteConfiguration(name + "bucket-website-config",
                BucketWebsiteConfigurationArgs.builder()
                        .bucket(bucket.id())
                        .indexDocument(BucketWebsiteConfigurationIndexDocumentArgs.builder()
                                .suffix(config.getS3WebsiteIndexDocument())
                                .build())
                        .errorDocument(BucketWebsiteConfigurationErrorDocumentArgs.builder()
                                .key(config.getS3WebsiteErrorDocument())
                                .build())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Block public access (we'll use CloudFront for public access)
        new BucketPublicAccessBlock(name + "bucket-public-access-block",
                BucketPublicAccessBlockArgs.builder()
                        .bucket(bucket.id())
                        .blockPublicAcls(true)
                        .blockPublicPolicy(true)
                        .ignorePublicAcls(true)
                        .restrictPublicBuckets(true)
                        .build(), CustomResourceOptions.builder()
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

        var iamRole = new Role(name + "ec2-s3-access-role",
                RoleArgs.builder()
                        .name(name + "ec2-s3-access-role")
                        .assumeRolePolicy(assumeRolePolicy)
                        .tags(TagUtils.getTagsWithName("EC2-S3-Access-Role", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.iamRoleArn = iamRole.arn();

        // Create IAM Policy for S3 access
        var s3AccessPolicy = bucket.arn().applyValue(arn -> String.format("""
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

        var policy = new Policy(name + "s3-access-policy",
                PolicyArgs.builder()
                        .name(name + "s3-access-policy")
                        .policy(s3AccessPolicy.applyValue(Either::ofLeft))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Attach policy to role
        new RolePolicyAttachment(name + "role-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(iamRole.name())
                        .policyArn(policy.arn())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        // Create Instance Profile
        var instanceProfile = new InstanceProfile(name + "ec2-instance-profile",
                InstanceProfileArgs.builder()
                        .name(name + "ec2-instance-profile")
                        .role(iamRole.name())
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceProfileName = instanceProfile.name();
    }
}
```

```java
package app.components;

import app.config.AppConfig;
import app.utils.TagUtils;
import com.pulumi.aws.ec2.Ec2Functions;
import com.pulumi.aws.ec2.inputs.GetAmiArgs;
import com.pulumi.aws.ec2.Instance;
import com.pulumi.aws.ec2.InstanceArgs;
import com.pulumi.aws.ec2.inputs.GetAmiFilterArgs;
import com.pulumi.aws.ec2.outputs.GetAmiResult;
import com.pulumi.core.Output;
import com.pulumi.deployment.InvokeOptions;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Objects;

public class ComputeStack extends ComponentResource {
    public final Output<String> instanceId;
    public final Output<String> publicIp;

    public ComputeStack(String name,
                        Output<String> subnetId,
                        Output<String> securityGroupId,
                        Output<String> instanceProfileName,
                        AppConfig config,
                        ComponentResourceOptions options) {
        super("custom:infrastructure:ComputeStack", name, options);

        // Get the latest Amazon Linux 2 AMI
        var ami = Ec2Functions.getAmi(GetAmiArgs.builder()
                .mostRecent(true)
                .owners("amazon")
                .filters(GetAmiFilterArgs.builder()
                        .name("name")
                        .values(config.getEc2AmiName())
                        .build()).build(),
                InvokeOptions.builder().provider(Objects.requireNonNull(options.getProvider().orElse(null)))
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
                """.formatted(config.getDefaultEnvironment());

        // Create EC2 Instance
        var instance = new Instance(name + "web-server",
                InstanceArgs.builder()
                        .instanceType(config.getEc2InstanceType())
                        .ami(ami.applyValue(GetAmiResult::id))
                        .subnetId(subnetId)
                        .vpcSecurityGroupIds(securityGroupId.applyValue(List::of))
                        .iamInstanceProfile(instanceProfileName)
                        .userData(userData)
                        .associatePublicIpAddress(true)
                        .tags(TagUtils.getTagsWithName("Web-Server", config))
                        .build(), CustomResourceOptions.builder()
                .parent(this)
                .build());

        this.instanceId = instance.id();
        this.publicIp = instance.publicIp();
    }
}
```

```java
package app;

import app.components.ComputeStack;
import app.components.NetworkStack;
import app.components.SecurityStack;
import app.components.StorageStack;
import app.config.AppConfig;
import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.resources.ComponentResourceOptions;

import java.util.Map;

/**
 * Main class for Java Pulumi infrastructure as code.
 * 
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
 * It creates a simple S3 bucket as an example.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {
    
    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }
    
    /**
     * Main entry point for the Pulumi program.
     * 
     * This method defines the infrastructure resources to be created.
     * Pulumi will execute this code to determine what resources to create,
     * update, or delete based on the current state.
     * 
     * @param args Command line arguments (not used in this example)
     */
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources to be created.
     * 
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {

        AppConfig config = new AppConfig(ctx);

        var primaryProvider = new Provider("primary-provider",
                ProviderArgs.builder()
                        .region(config.getPrimaryRegion())
                        .build());

        var secondaryProvider = new Provider("secondary-provider",
                ProviderArgs.builder()
                        .region(config.getSecondaryRegion())
                        .build());

        Map<String, Provider> providers = Map.of(
                "primary", primaryProvider,
                "secondary", secondaryProvider
        );

        providers.forEach((region, provider) -> {

            var options = ComponentResourceOptions.builder()
                    .provider(provider)
                    .build();

            // Deploy Network Stack
            var networkStack = new NetworkStack(region + "-network", config, options);

            // Deploy Security Stack
            var securityStack = new SecurityStack(region + "-security",
                    networkStack.vpcId, config, options);

            // Deploy Storage Stack
            var storageStack = new StorageStack(region + "-storage", config, options);

            // Deploy Compute Stack
            var computeStack = new ComputeStack(region + "-compute",
                    networkStack.publicSubnetPrimaryId,
                    securityStack.webSecurityGroupId,
                    storageStack.instanceProfileName,
                    config, options);

            // Export outputs
            ctx.export(region + "-vpcId", networkStack.vpcId);
            ctx.export(region + "-bucketId", storageStack.bucketId);
            ctx.export(region + "-instanceId", computeStack.instanceId);
            ctx.export(region + "-publicIp", computeStack.publicIp);
            ctx.export(region + "-bucketArn", storageStack.bucketArn);
        });
    }
}
```