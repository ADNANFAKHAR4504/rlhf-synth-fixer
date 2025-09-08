I'll create a comprehensive Pulumi Java infrastructure implementation that meets all your requirements. Here's a modular, security-focused solution:

## Project Structure

```
src/main/java/
├── com/company/infrastructure/
│   ├── Main.java
│   └── components/
│       ├── NetworkingComponent.java
│       ├── ComputeComponent.java
│       ├── StorageComponent.java
│       ├── IamComponent.java
│       └── AuditingComponent.java
└── resources/
    └── application.properties
```

## 1. Main Application Entry Point

```java
// src/main/java/com/company/infrastructure/Main.java
package com.company.infrastructure;

import com.company.infrastructure.components.*;
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Define allowed regions
            List<String> allowedRegions = Arrays.asList("us-west-2", "us-east-1");
            String currentRegion = ctx.config().get("aws:region").orElse("us-west-2");
            
            // Validate region
            if (!allowedRegions.contains(currentRegion)) {
                throw new IllegalArgumentException(
                    String.format("Deployment only allowed in regions: %s. Current region: %s", 
                    allowedRegions, currentRegion)
                );
            }

            // 1. Create IAM components first (needed for other resources)
            var iamComponent = new IamComponent("iam", currentRegion);
            
            // 2. Create networking infrastructure
            var networkingComponent = new NetworkingComponent("networking", currentRegion);
            
            // 3. Create storage with encryption
            var storageComponent = new StorageComponent("storage", currentRegion);
            
            // 4. Create compute resources
            var computeComponent = new ComputeComponent("compute", 
                networkingComponent, 
                iamComponent, 
                currentRegion);
            
            // 5. Enable auditing and compliance
            var auditingComponent = new AuditingComponent("auditing", 
                storageComponent, 
                currentRegion);

            // Export important outputs
            ctx.export("vpcId", networkingComponent.getVpcId());
            ctx.export("publicSubnetIds", networkingComponent.getPublicSubnetIds());
            ctx.export("privateSubnetIds", networkingComponent.getPrivateSubnetIds());
            ctx.export("ec2InstanceIds", computeComponent.getInstanceIds());
            ctx.export("s3BucketNames", storageComponent.getBucketNames());
            ctx.export("cloudTrailArn", auditingComponent.getCloudTrailArn());
        });
    }
}
```

## 2. Networking Component

```java
// src/main/java/com/company/infrastructure/components/NetworkingComponent.java
package com.company.infrastructure.components;

import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.VpcArgs;
import com.pulumi.aws.ec2.inputs.SubnetArgs;
import com.pulumi.aws.ec2.inputs.InternetGatewayArgs;
import com.pulumi.aws.ec2.inputs.RouteTableArgs;
import com.pulumi.aws.ec2.inputs.RouteArgs;
import com.pulumi.aws.ec2.inputs.RouteTableAssociationArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ResourceArgs;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NetworkingComponent extends ComponentResource {
    private final Vpc vpc;
    private final List<Subnet> publicSubnets;
    private final List<Subnet> privateSubnets;
    private final InternetGateway internetGateway;
    private final RouteTable publicRouteTable;
    private final RouteTable privateRouteTable;

    public NetworkingComponent(String name, String region) {
        this(name, region, NetworkingComponentArgs.Empty);
    }

    public NetworkingComponent(String name, String region, NetworkingComponentArgs args) {
        super("custom:infrastructure:NetworkingComponent", name, args);

        // Create VPC with DNS support
        this.vpc = new Vpc(name + "-vpc", VpcArgs.builder()
            .cidrBlock("10.0.0.0/16")
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(Map.of(
                "Name", name + "-vpc",
                "Environment", "production",
                "ManagedBy", "Pulumi"
            ))
            .build(), this.makeResourceOptions());

        // Create Internet Gateway
        this.internetGateway = new InternetGateway(name + "-igw", InternetGatewayArgs.builder()
            .vpcId(vpc.id())
            .tags(Map.of(
                "Name", name + "-igw",
                "Environment", "production"
            ))
            .build(), this.makeResourceOptions());

        // Create public subnets (2 AZs for high availability)
        this.publicSubnets = new ArrayList<>();
        String[] publicCidrs = {"10.0.1.0/24", "10.0.2.0/24"};
        String[] azSuffixes = {"a", "b"};
        
        for (int i = 0; i < 2; i++) {
            Subnet publicSubnet = new Subnet(name + "-public-subnet-" + (i + 1), SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(publicCidrs[i])
                .availabilityZone(region + azSuffixes[i])
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", name + "-public-subnet-" + (i + 1),
                    "Type", "Public",
                    "Environment", "production"
                ))
                .build(), this.makeResourceOptions());
            publicSubnets.add(publicSubnet);
        }

        // Create private subnets (2 AZs for high availability)
        this.privateSubnets = new ArrayList<>();
        String[] privateCidrs = {"10.0.10.0/24", "10.0.20.0/24"};
        
        for (int i = 0; i < 2; i++) {
            Subnet privateSubnet = new Subnet(name + "-private-subnet-" + (i + 1), SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock(privateCidrs[i])
                .availabilityZone(region + azSuffixes[i])
                .mapPublicIpOnLaunch(false)
                .tags(Map.of(
                    "Name", name + "-private-subnet-" + (i + 1),
                    "Type", "Private",
                    "Environment", "production"
                ))
                .build(), this.makeResourceOptions());
            privateSubnets.add(privateSubnet);
        }

        // Create public route table
        this.publicRouteTable = new RouteTable(name + "-public-rt", RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(Map.of(
                "Name", name + "-public-rt",
                "Type", "Public"
            ))
            .build(), this.makeResourceOptions());

        // Create route to Internet Gateway
        new Route(name + "-public-route", RouteArgs.builder()
            .routeTableId(publicRouteTable.id())
            .destinationCidrBlock("0.0.0.0/0")
            .gatewayId(internetGateway.id())
            .build(), this.makeResourceOptions());

        // Associate public subnets with public route table
        for (int i = 0; i < publicSubnets.size(); i++) {
            new RouteTableAssociation(name + "-public-rta-" + (i + 1), 
                RouteTableAssociationArgs.builder()
                    .subnetId(publicSubnets.get(i).id())
                    .routeTableId(publicRouteTable.id())
                    .build(), this.makeResourceOptions());
        }

        // Create private route table (no internet access)
        this.privateRouteTable = new RouteTable(name + "-private-rt", RouteTableArgs.builder()
            .vpcId(vpc.id())
            .tags(Map.of(
                "Name", name + "-private-rt",
                "Type", "Private"
            ))
            .build(), this.makeResourceOptions());

        // Associate private subnets with private route table
        for (int i = 0; i < privateSubnets.size(); i++) {
            new RouteTableAssociation(name + "-private-rta-" + (i + 1), 
                RouteTableAssociationArgs.builder()
                    .subnetId(privateSubnets.get(i).id())
                    .routeTableId(privateRouteTable.id())
                    .build(), this.makeResourceOptions());
        }
    }

    public Output<String> getVpcId() {
        return vpc.id();
    }

    public Output<List<String>> getPublicSubnetIds() {
        return Output.all(publicSubnets.stream().map(Subnet::id).toList())
            .applyValue(ids -> new ArrayList<>(ids));
    }

    public Output<List<String>> getPrivateSubnetIds() {
        return Output.all(privateSubnets.stream().map(Subnet::id).toList())
            .applyValue(ids -> new ArrayList<>(ids));
    }

    public static class NetworkingComponentArgs extends ResourceArgs {
        public static final NetworkingComponentArgs Empty = new NetworkingComponentArgs();
    }
}
```

## 3. Storage Component with KMS Encryption

```java
// src/main/java/com/company/infrastructure/components/StorageComponent.java
package com.company.infrastructure.components;

import com.pulumi.aws.kms.*;
import com.pulumi.aws.kms.inputs.KeyArgs;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.s3.inputs.BucketArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.s3.inputs.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.inputs.BucketVersioningArgs;
import com.pulumi.aws.s3.inputs.BucketVersioningVersioningConfigurationArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ResourceArgs;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StorageComponent extends ComponentResource {
    private final Key kmsKey;
    private final Alias kmsKeyAlias;
    private final List<Bucket> buckets;
    private final Bucket cloudTrailBucket;

    public StorageComponent(String name, String region) {
        this(name, region, StorageComponentArgs.Empty);
    }

    public StorageComponent(String name, String region, StorageComponentArgs args) {
        super("custom:infrastructure:StorageComponent", name, args);

        // Create KMS Customer Managed Key for S3 encryption
        this.kmsKey = new Key(name + "-s3-kms-key", KeyArgs.builder()
            .description("KMS key for S3 bucket encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .keySpec("SYMMETRIC_DEFAULT")
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::%s:root"
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow S3 Service",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "s3.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudTrail Service",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """.formatted(getCurrentAccountId()))
            .tags(Map.of(
                "Name", name + "-s3-kms-key",
                "Purpose", "S3Encryption",
                "Environment", "production"
            ))
            .build(), this.makeResourceOptions());

        // Create KMS key alias
        this.kmsKeyAlias = new Alias(name + "-s3-kms-alias", com.pulumi.aws.kms.inputs.AliasArgs.builder()
            .name("alias/" + name + "-s3-encryption")
            .targetKeyId(kmsKey.keyId())
            .build(), this.makeResourceOptions());

        // Create secure S3 buckets
        this.buckets = new ArrayList<>();
        String[] bucketPurposes = {"critical-data", "application-logs", "backup-data"};
        
        for (String purpose : bucketPurposes) {
            Bucket bucket = createSecureBucket(name + "-" + purpose + "-bucket", purpose);
            buckets.add(bucket);
        }

        // Create dedicated CloudTrail bucket
        this.cloudTrailBucket = createSecureBucket(name + "-cloudtrail-logs", "cloudtrail");
    }

    private Bucket createSecureBucket(String bucketName, String purpose) {
        // Create S3 bucket
        Bucket bucket = new Bucket(bucketName, BucketArgs.builder()
            .bucket(bucketName + "-" + System.currentTimeMillis()) // Ensure uniqueness
            .tags(Map.of(
                "Name", bucketName,
                "Purpose", purpose,
                "Environment", "production",
                "Encryption", "KMS-CMK"
            ))
            .build(), this.makeResourceOptions());

        // Enable versioning
        new BucketVersioning(bucketName + "-versioning", BucketVersioningArgs.builder()
            .bucket(bucket.id())
            .versioningConfiguration(BucketVersioningVersioningConfigurationArgs.builder()
                .status("Enabled")
                .build())
            .build(), this.makeResourceOptions());

        // Configure server-side encryption with KMS CMK
        new BucketServerSideEncryptionConfiguration(bucketName + "-encryption", 
            BucketServerSideEncryptionConfigurationArgs.builder()
                .bucket(bucket.id())
                .rules(BucketServerSideEncryptionConfigurationRuleArgs.builder()
                    .applyServerSideEncryptionByDefault(
                        BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs.builder()
                            .sseAlgorithm("aws:kms")
                            .kmsMasterKeyId(kmsKey.arn())
                            .build())
                    .bucketKeyEnabled(true)
                    .build())
                .build(), this.makeResourceOptions());

        // Block all public access
        new BucketPublicAccessBlock(bucketName + "-pab", BucketPublicAccessBlockArgs.builder()
            .bucket(bucket.id())
            .blockPublicAcls(true)
            .blockPublicPolicy(true)
            .ignorePublicAcls(true)
            .restrictPublicBuckets(true)
            .build(), this.makeResourceOptions());

        return bucket;
    }

    private String getCurrentAccountId() {
        // In a real implementation, you would get this from AWS STS
        // For this example, we'll use a placeholder
        return "123456789012";
    }

    public Output<String> getKmsKeyId() {
        return kmsKey.keyId();
    }

    public Output<String> getKmsKeyArn() {
        return kmsKey.arn();
    }

    public Output<List<String>> getBucketNames() {
        return Output.all(buckets.stream().map(Bucket::bucket).toList())
            .applyValue(names -> new ArrayList<>(names));
    }

    public Output<String> getCloudTrailBucketName() {
        return cloudTrailBucket.bucket();
    }

    public static class StorageComponentArgs extends ResourceArgs {
        public static final StorageComponentArgs Empty = new StorageComponentArgs();
    }
}
```

## 4. IAM Component

```java
// src/main/java/com/company/infrastructure/components/IamComponent.java
package com.company.infrastructure.components;

import com.pulumi.aws.iam.*;
import com.pulumi.aws.iam.inputs.RoleArgs;
import com.pulumi.aws.iam.inputs.PolicyArgs;
import com.pulumi.aws.iam.inputs.RolePolicyAttachmentArgs;
import com.pulumi.aws.iam.inputs.InstanceProfileArgs;
import com.pulumi.aws.iam.inputs.UserArgs;
import com.pulumi.aws.iam.inputs.UserPolicyAttachmentArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ResourceArgs;

import java.util.Map;

public class IamComponent extends ComponentResource {
    private final Role ec2Role;
    private final Policy ec2Policy;
    private final InstanceProfile ec2InstanceProfile;
    private final User adminUser;
    private final Policy adminPolicy;

    public IamComponent(String name, String region) {
        this(name, region, IamComponentArgs.Empty);
    }

    public IamComponent(String name, String region, IamComponentArgs args) {
        super("custom:infrastructure:IamComponent", name, args);

        // Create EC2 instance role with minimal permissions
        this.ec2Role = new Role(name + "-ec2-role", RoleArgs.builder()
            .name(name + "-ec2-role")
            .assumeRolePolicy("""
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
                """)
            .tags(Map.of(
                "Name", name + "-ec2-role",
                "Purpose", "EC2Instance",
                "Environment", "production"
            ))
            .build(), this.makeResourceOptions());

        // Create minimal EC2 policy (CloudWatch logs, Systems Manager)
        this.ec2Policy = new Policy(name + "-ec2-policy", PolicyArgs.builder()
            .name(name + "-ec2-policy")
            .description("Minimal permissions for EC2 instances")
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogStreams"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ssm:UpdateInstanceInformation",
                                "ssm:SendCommand",
                                "ssm:ListCommandInvocations",
                                "ssm:DescribeInstanceInformation"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
            .tags(Map.of(
                "Name", name + "-ec2-policy",
                "Purpose", "EC2MinimalAccess"
            ))
            .build(), this.makeResourceOptions());

        // Attach policy to role
        new RolePolicyAttachment(name + "-ec2-policy-attachment", RolePolicyAttachmentArgs.builder()
            .role(ec2Role.name())
            .policyArn(ec2Policy.arn())
            .build(), this.makeResourceOptions());

        // Create instance profile
        this.ec2InstanceProfile = new InstanceProfile(name + "-ec2-instance-profile", 
            InstanceProfileArgs.builder()
                .name(name + "-ec2-instance-profile")
                .role(ec2Role.name())
                .tags(Map.of(
                    "Name", name + "-ec2-instance-profile",
                    "Purpose", "EC2Instance"
                ))
                .build(), this.makeResourceOptions());

        // Create admin user (requires MFA)
        this.adminUser = new User(name + "-admin-user", UserArgs.builder()
            .name(name + "-admin-user")
            .path("/")
            .tags(Map.of(
                "Name", name + "-admin-user",
                "Role", "Administrator",
                "MFARequired", "true"
            ))
            .build(), this.makeResourceOptions());

        // Create admin policy with MFA enforcement
        this.adminPolicy = new Policy(name + "-admin-policy", PolicyArgs.builder()
            .name(name + "-admin-policy")
            .description("Administrative access with MFA enforcement")
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": "*",
                            "Resource": "*",
                            "Condition": {
                                "Bool": {
                                    "aws:MultiFactorAuthPresent": "true"
                                },
                                "NumericLessThan": {
                                    "aws:MultiFactorAuthAge": "3600"
                                }
                            }
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "iam:CreateVirtualMFADevice",
                                "iam:EnableMFADevice",
                                "iam:GetUser",
                                "iam:ListMFADevices",
                                "iam:ListVirtualMFADevices",
                                "iam:ResyncMFADevice",
                                "sts:GetSessionToken"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Deny",
                            "Action": "*",
                            "Resource": "*",
                            "Condition": {
                                "Bool": {
                                    "aws:MultiFactorAuthPresent": "false"
                                }
                            }
                        }
                    ]
                }
                """)
            .tags(Map.of(
                "Name", name + "-admin-policy",
                "Purpose", "AdministrativeAccess"
            ))
            .build(), this.makeResourceOptions());

        // Attach admin policy to user
        new UserPolicyAttachment(name + "-admin-policy-attachment", UserPolicyAttachmentArgs.builder()
            .user(adminUser.name())
            .policyArn(adminPolicy.arn())
            .build(), this.makeResourceOptions());
    }

    public Output<String> getEc2RoleArn() {
        return ec2Role.arn();
    }

    public Output<String> getEc2InstanceProfileName() {
        return ec2InstanceProfile.name();
    }

    public Output<String> getAdminUserName() {
        return adminUser.name();
    }

    public static class IamComponentArgs extends ResourceArgs {
        public static final IamComponentArgs Empty = new IamComponentArgs();
    }
}
```

## 5. Compute Component

```java
// src/main/java/com/company/infrastructure/components/ComputeComponent.java
package com.company.infrastructure.components;

import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.InstanceArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ResourceArgs;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ComputeComponent extends ComponentResource {
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup appSecurityGroup;
    private final List<Instance> instances;

    public ComputeComponent(String name, NetworkingComponent networking, 
                           IamComponent iam, String region) {
        this(name, networking, iam, region, ComputeComponentArgs.Empty);
    }

    public ComputeComponent(String name, NetworkingComponent networking, 
                           IamComponent iam, String region, ComputeComponentArgs args) {
        super("custom:infrastructure:ComputeComponent", name, args);

        // Create web tier security group (public subnet)
        this.webSecurityGroup = new SecurityGroup(name + "-web-sg", SecurityGroupArgs.builder()
            .name(name + "-web-sg")
            .description("Security group for web servers")
            .vpcId(networking.getVpcId())
            .ingress(
                // HTTPS only from internet
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTPS from internet")
                    .build(),
                // SSH from specific IP ranges only (replace with your IP)
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(22)
                    .toPort(22)
                    .cidrBlocks("203.0.113.0/24") // Replace with your IP range
                    .description("SSH from admin network")
                    .build()
            )
            .egress(
                // Allow outbound HTTPS for updates
                SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTPS outbound")
                    .build(),
                // Allow outbound HTTP for package updates
                SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(80)
                    .toPort(80)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTP outbound for updates")
                    .build()
            )
            .tags(Map.of(
                "Name", name + "-web-sg",
                "Tier", "Web",
                "Environment", "production"
            ))
            .build(), this.makeResourceOptions());

        // Create application tier security group (private subnet)
        this.appSecurityGroup = new SecurityGroup(name + "-app-sg", SecurityGroupArgs.builder()
            .name(name + "-app-sg")
            .description("Security group for application servers")
            .vpcId(networking.getVpcId())
            .ingress(
                // Allow traffic from web tier only
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(8080)
                    .toPort(8080)
                    .securityGroups(webSecurityGroup.id())
                    .description("Application port from web tier")
                    .build(),
                // SSH from web tier for management
                SecurityGroupIngressArgs.builder()
                    .protocol("tcp")
                    .fromPort(22)
                    .toPort(22)
                    .securityGroups(webSecurityGroup.id())
                    .description("SSH from web tier")
                    .build()
            )
            .egress(
                // Allow outbound HTTPS for updates
                SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(443)
                    .toPort(443)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTPS outbound")
                    .build(),
                // Allow outbound HTTP for package updates
                SecurityGroupEgressArgs.builder()
                    .protocol("tcp")
                    .fromPort(80)
                    .toPort(80)
                    .cidrBlocks("0.0.0.0/0")
                    .description("HTTP outbound for updates")
                    .build()
            )
            .tags(Map.of(
                "Name", name + "-app-sg",
                "Tier", "Application",
                "Environment", "production"
            ))
            .build(), this.makeResourceOptions());

        // Get latest Amazon Linux 2 AMI
        var amiLookup = Ec2Functions.getAmi(com.pulumi.aws.ec2.inputs.GetAmiArgs.builder()
            .mostRecent(true)
            .owners("amazon")
            .filters(com.pulumi.aws.ec2.inputs.GetAmiFilterArgs.builder()
                .name("name")
                .values("amzn2-ami-hvm-*-x86_64-gp2")
                .build())
            .build());

        // Create instances
        this.instances = new ArrayList<>();

        // Web server in public subnet
        networking.getPublicSubnetIds().applyValue(subnetIds -> {
            Instance webInstance = new Instance(name + "-web-instance", InstanceArgs.builder()
                .ami(amiLookup.applyValue(ami -> ami.id()))
                .instanceType("t3.micro")
                .subnetId(subnetIds.get(0))
                .vpcSecurityGroupIds(webSecurityGroup.id())
                .iamInstanceProfile(iam.getEc2InstanceProfileName())
                .userData("""
                    #!/bin/bash
                    yum update -y
                    yum install -y amazon-cloudwatch-agent
                    # Configure CloudWatch agent
                    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                        -a fetch-config -m ec2 -c default
                    """)
                .tags(Map.of(
                    "Name", name + "-web-instance",
                    "Tier", "Web",
                    "Environment", "production",
                    "Backup", "required"
                ))
                .build(), this.makeResourceOptions());
            instances.add(webInstance);
            return null;
        });

        // Application server in private subnet
        networking.getPrivateSubnetIds().applyValue(subnetIds -> {
            Instance appInstance = new Instance(name + "-app-instance", InstanceArgs.builder()
                .ami(amiLookup.applyValue(ami -> ami.id()))
                .instanceType("t3.small")
                .subnetId(subnetIds.get(0))
                .vpcSecurityGroupIds(appSecurityGroup.id())
                .iamInstanceProfile(iam.getEc2InstanceProfileName())
                .userData("""
                    #!/bin/bash
                    yum update -y
                    yum install -y amazon-cloudwatch-agent
                    # Configure CloudWatch agent
                    /opt
```