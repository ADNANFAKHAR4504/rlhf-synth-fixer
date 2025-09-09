```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import app.components.IamComponent;
import app.components.AuditingComponent;
import app.components.NetworkingComponent;
import app.components.ComputeComponent;
import app.components.StorageComponent;

import java.util.List;
import java.util.Arrays;

/**
 * Main class for Java Pulumi infrastructure as code.
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
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
     * <p>
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
     * <p>
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     *
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {

        List<String> allowedRegions = Arrays.asList("us-west-2", "us-east-1");
        String currentRegion = ctx.config().get("aws:region").orElse("us-west-2");

        // Validate region
        if (!allowedRegions.contains(currentRegion)) {
            throw new IllegalArgumentException(
                    String.format("Deployment only allowed in regions: %s. Current region: %s",
                            allowedRegions, currentRegion)
            );
        }

        // Create IAM components first (needed for other resources)
        var iamComponent = new IamComponent("iam", currentRegion);

        // Create networking infrastructure
        var networkingComponent = new NetworkingComponent("networking", currentRegion);

        // Create storage with encryption
        var storageComponent = new StorageComponent("storage", currentRegion);

        // Create compute resources
        var computeComponent = new ComputeComponent("compute",
                networkingComponent,
                iamComponent,
                currentRegion);

        // Enable auditing and compliance
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
    }
}
```

```java
package app.components;

import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.inputs.GetAvailabilityZonesArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NetworkingComponent extends ComponentResource {
    private final Vpc vpc;
    private final List<Subnet> publicSubnets;
    private final List<Subnet> privateSubnets;

    public NetworkingComponent(String name, String region) {
        this(name, region, null);
    }

    public NetworkingComponent(String name, String region, ComponentResourceOptions opts) {
        super("custom:infrastructure:NetworkingComponent", name, opts);

        // Create VPC with DNS support and IPv6
        this.vpc = new Vpc(name + "-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .assignGeneratedIpv6CidrBlock(true)
                .tags(getTags(name + "-vpc", "VPC", Map.of("Tier", "Network")))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create Internet Gateway
        InternetGateway internetGateway = new InternetGateway(name + "-igw", InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(getTags(name + "-igw", "InternetGateway", Map.of()))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Get available AZs dynamically
        var availabilityZones = AwsFunctions.getAvailabilityZones(GetAvailabilityZonesArgs.builder()
                .state("available")
                .build());

        // Create public subnets across first 2 available AZs for high availability
        this.publicSubnets = createSubnets(name, "public",
                List.of("10.0.1.0/24", "10.0.2.0/24"),
                availabilityZones, true);

        // Create private subnets across first 2 available AZs
        this.privateSubnets = createSubnets(name, "private",
                List.of("10.0.10.0/24", "10.0.20.0/24"),
                availabilityZones, false);

        // Create and configure public route table
        RouteTable publicRouteTable = new RouteTable(name + "-public-rt", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(getTags(name + "-public-rt", "RouteTable", Map.of("Type", "Public")))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Add route to Internet Gateway for public subnets
        new Route(name + "-public-route", RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(internetGateway.id())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Associate public subnets with public route table
        associateSubnetsWithRouteTable(name, "public", publicSubnets, publicRouteTable);

        // Create private route table (no internet access by default)
        RouteTable privateRouteTable = new RouteTable(name + "-private-rt", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(getTags(name + "-private-rt", "RouteTable", Map.of("Type", "Private")))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Associate private subnets with private route table
        associateSubnetsWithRouteTable(name, "private", privateSubnets, privateRouteTable);

        // Create VPC Flow Logs for security monitoring
        createVpcFlowLogs(name);
    }

    private List<Subnet> createSubnets(String baseName, String type, List<String> cidrs,
                                       Output<com.pulumi.aws.outputs.GetAvailabilityZonesResult> azs,
                                       boolean mapPublicIp) {
        var subnets = new ArrayList<Subnet>();

        for (int i = 0; i < cidrs.size(); i++) {
            final int index = i; // for lambda capture
            var subnetName = "%s-%s-subnet-%d".formatted(baseName, type, i + 1);
            
            var availabilityZone = azs.applyValue(zones -> zones.names().get(index));
            
            var subnet = new Subnet(subnetName, SubnetArgs.builder()
                    .vpcId(vpc.id())
                    .cidrBlock(cidrs.get(i))
                    .availabilityZone(availabilityZone)
                    .mapPublicIpOnLaunch(mapPublicIp)
                    .tags(getTags(subnetName, "Subnet", Map.of("Type", type)))
                    .build(), CustomResourceOptions.builder().parent(this).build());
            subnets.add(subnet);
        }

        return subnets;
    }

    private void associateSubnetsWithRouteTable(String baseName, String type,
                                                List<Subnet> subnets, RouteTable routeTable) {
        for (int i = 0; i < subnets.size(); i++) {
            new RouteTableAssociation("%s-%s-rta-%d".formatted(baseName, type, i + 1),
                    RouteTableAssociationArgs.builder()
                            .subnetId(subnets.get(i).id())
                            .routeTableId(routeTable.id())
                            .build(), CustomResourceOptions.builder().parent(this).build());
        }
    }

    private void createVpcFlowLogs(String name) {
        // VPC Flow Logs for network monitoring (would require CloudWatch Log Group)
        // Implementation depends on logging strategy
    }

    private Map<String, String> getTags(String name, String resourceType, Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    public Output<String> getVpcId() { return vpc.id(); }

    public Output<List<String>> getPublicSubnetIds() {
        return Output.all(publicSubnets.stream().map(Subnet::id).toList())
                .applyValue(ArrayList::new);
    }

    public Output<List<String>> getPrivateSubnetIds() {
        return Output.all(privateSubnets.stream().map(Subnet::id).toList())
                .applyValue(ArrayList::new);
    }
}
```

```java
package app.components;

import com.pulumi.aws.AwsFunctions;
import com.pulumi.aws.inputs.GetCallerIdentityArgs;
import com.pulumi.aws.outputs.GetCallerIdentityResult;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationArgs;
import com.pulumi.aws.s3.BucketVersioningArgs;
import com.pulumi.core.Output;
import com.pulumi.aws.kms.*;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.s3.inputs.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class StorageComponent extends ComponentResource {
    private final Key kmsKey;
    private final List<Bucket> buckets;
    private final Bucket cloudTrailBucket;
    private final Output<String> accountId;

    public StorageComponent(String name, String region) {
        this(name, region, null);
    }

    public StorageComponent(String name, String region, ComponentResourceOptions opts) {
        super("custom:infrastructure:StorageComponent", name, opts);

        var identity = AwsFunctions.getCallerIdentity(GetCallerIdentityArgs.builder().build());

        this.accountId = identity.applyValue(GetCallerIdentityResult::accountId);

        // Create KMS Customer Managed Key for S3 encryption
        this.kmsKey = createKmsKey(name, region);

        // Create KMS key alias for easier reference
        new Alias(name + "-s3-kms-alias", AliasArgs.builder()
                .name("alias/" + name + "-s3-encryption")
                .targetKeyId(kmsKey.keyId())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create secure S3 buckets for different purposes
        this.buckets = createSecureBuckets(name);

        // Create dedicated CloudTrail bucket
        this.cloudTrailBucket = createCloudTrailBucket(name);
    }

    private Key createKmsKey(String name, String region) {
        return new Key(name + "-s3-kms-key", KeyArgs.builder()
                .description("KMS Customer Managed Key for S3 bucket encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .enableKeyRotation(true)
                .policy(accountId.applyValue(this::createKmsKeyPolicy))
                .tags(getTags(name + "-s3-kms-key", "KMSKey", Map.of("Purpose", "S3Encryption")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private String createKmsKeyPolicy(String accountId) {
        return """
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
                            "kms:GenerateDataKey",
                            "kms:GenerateDataKeyWithoutPlaintext",
                            "kms:DescribeKey"
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
                            "kms:GenerateDataKey",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            """.formatted(accountId);
    }

    private List<Bucket> createSecureBuckets(String name) {
        var buckets = new ArrayList<Bucket>();
        var bucketPurposes = List.of("critical-data", "application-logs", "backup-data", "compliance-archive");

        bucketPurposes.forEach(purpose -> {
            var bucket = createSecureBucket(name + "-" + purpose, purpose);
            buckets.add(bucket);
        });

        return buckets;
    }

    private Bucket createCloudTrailBucket(String name) {
        return createSecureBucket(name + "-cloudtrail-logs", "cloudtrail");
    }

    private Bucket createSecureBucket(String bucketName, String purpose) {
        var timestamp = String.valueOf(System.currentTimeMillis());
        var uniqueBucketName = bucketName + "-" + timestamp;

        // Create S3 bucket
        var bucket = new Bucket(bucketName, BucketArgs.builder()
                .bucket(uniqueBucketName)
                .tags(getTags(bucketName, "S3Bucket", Map.of(
                        "Purpose", purpose,
                        "Encryption", "KMS-CMK",
                        "DataClassification", purpose.contains("critical") ? "Confidential" : "Internal"
                )))
                .forceDestroy(true)
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Enable versioning for data protection (but not for CloudTrail buckets to ease deletion)
        if (!purpose.equals("cloudtrail")) {
            new BucketVersioning(bucketName + "-versioning", BucketVersioningArgs.builder()
                    .bucket(bucket.id())
                    .versioningConfiguration(BucketVersioningVersioningConfigurationArgs.builder()
                            .status("Enabled")
                            .build())
                    .build(), CustomResourceOptions.builder().parent(this).build());
        }

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
                        .build(), CustomResourceOptions.builder().parent(this).build());

        // Block all public access
        new BucketPublicAccessBlock(bucketName + "-pab", BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Add lifecycle configuration for cost optimization
        createBucketLifecycle(bucketName, bucket, purpose);

        return bucket;
    }

    private void createBucketLifecycle(String bucketName, Bucket bucket, String purpose) {
        var lifecycleRules = new ArrayList<BucketLifecycleConfigurationRuleArgs>();

        // Standard lifecycle rule
        lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                .id("standard-lifecycle")
                .status("Enabled")
                .transitions(
                        BucketLifecycleConfigurationRuleTransitionArgs.builder()
                                .days(30)
                                .storageClass("STANDARD_IA")
                                .build(),
                        BucketLifecycleConfigurationRuleTransitionArgs.builder()
                                .days(90)
                                .storageClass("GLACIER")
                                .build()
                )
                .build());

        // Add cleanup rules for multipart uploads and optionally versioned objects
        if (purpose.equalsIgnoreCase("cloudtrail")) {
            // For CloudTrail buckets, only clean up multipart uploads since versioning is disabled
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("cleanup-multipart")
                    .status("Enabled")
                    .abortIncompleteMultipartUpload(
                            BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs.builder()
                            .daysAfterInitiation(1)
                            .build())
                    .build());
        } else {
            // For other buckets with versioning enabled, clean up versions and multipart uploads
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("cleanup-versions")
                    .status("Enabled")
                    .noncurrentVersionExpiration(
                            BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs.builder()
                            .noncurrentDays(1)
                            .build())
                    .abortIncompleteMultipartUpload(
                            BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs.builder()
                            .daysAfterInitiation(1)
                            .build())
                    .build());
        }

        // Add retention rules for compliance data
        if (purpose.toLowerCase().contains("compliance") || purpose.contains("audit")) {
            // Keep compliance data for 7 years
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("compliance-retention")
                    .status("Enabled")
                    .expiration(BucketLifecycleConfigurationRuleExpirationArgs.builder()
                            .days(2555) // 7 years
                            .build())
                    .build());
        } else if (purpose.toLowerCase().contains("cloudtrail")) {
            // For CloudTrail buckets, keep logs for 90 days for testing
            lifecycleRules.add(BucketLifecycleConfigurationRuleArgs.builder()
                    .id("cloudtrail-cleanup")
                    .status("Enabled")
                    .expiration(BucketLifecycleConfigurationRuleExpirationArgs.builder()
                            .days(90)
                            .build())
                    .noncurrentVersionExpiration(
                            BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs.builder()
                                    .noncurrentDays(90) // keep old versions for retention
                                    .build())
                    .build());
        }

        new BucketLifecycleConfiguration(bucketName + "-lifecycle",
                BucketLifecycleConfigurationArgs.builder()
                        .bucket(bucket.id())
                        .rules(lifecycleRules)
                        .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Map<String, String> getTags(String name, String resourceType, Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure",
                "BackupRequired", "true"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    // Getters
    public Output<String> getKmsKeyArn() { return kmsKey.arn(); }

    public Output<List<String>> getBucketNames() {
        return Output.all(buckets.stream().map(Bucket::bucket).toList())
                .applyValue(ArrayList::new);
    }

    public Output<String> getCloudTrailBucketName() {
        return cloudTrailBucket.bucket();
    }
}
```

```java
package app.components;

import com.pulumi.aws.iam.*;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;

public class IamComponent extends ComponentResource {
    private final Role ec2Role;
    private final Policy ec2Policy;
    private final InstanceProfile ec2InstanceProfile;
    private final User adminUser;
    private final Policy adminPolicy;
    private final Policy mfaEnforcementPolicy;
    private final Group adminGroup;

    public IamComponent(String name, String region) {
        this(name, region, null);
    }

    public IamComponent(String name, String region, ComponentResourceOptions opts) {
        super("custom:infrastructure:IamComponent", name, opts);

        // Create EC2 service role with minimal permissions
        this.ec2Role = createEc2Role(name);
        this.ec2Policy = createEc2Policy(name);
        this.ec2InstanceProfile = createInstanceProfile(name);

        // Create admin user with MFA enforcement
        this.adminUser = createAdminUser(name);
        this.adminPolicy = createAdminPolicy(name);
        this.mfaEnforcementPolicy = createMfaEnforcementPolicy(name);
        this.adminGroup = createAdminGroup(name);

        // Attach policies
        attachPolicies(name);
    }

    private Role createEc2Role(String name) {
        return new Role(name + "-ec2-role", RoleArgs.builder()
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
                            },
                            "Condition": {
                                "StringEquals": {
                                    "aws:RequestedRegion": ["us-west-2", "us-east-1"]
                                }
                            }
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-ec2-role", "IAMRole", Map.of("Purpose", "EC2Instance")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Policy createEc2Policy(String name) {
        return new Policy(name + "-ec2-policy", PolicyArgs.builder()
                .name(name + "-ec2-policy")
                .description("Minimal permissions for EC2 instances with logging and monitoring")
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
                                "logs:DescribeLogStreams",
                                "logs:DescribeLogGroups"
                            ],
                            "Resource": "arn:aws:logs:*:*:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ssm:UpdateInstanceInformation",
                                "ssm:SendCommand",
                                "ssm:ListCommandInvocations",
                                "ssm:DescribeInstanceInformation",
                                "ssm:GetParameter",
                                "ssm:GetParameters"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "cloudwatch:PutMetricData",
                                "cloudwatch:GetMetricStatistics",
                                "cloudwatch:ListMetrics"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ec2:DescribeVolumes",
                                "ec2:DescribeInstances",
                                "ec2:DescribeTags"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-ec2-policy", "IAMPolicy", Map.of("Purpose", "EC2MinimalAccess")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private InstanceProfile createInstanceProfile(String name) {
        return new InstanceProfile(name + "-ec2-instance-profile",
                InstanceProfileArgs.builder()
                        .name(name + "-ec2-instance-profile")
                        .role(ec2Role.name())
                        .tags(getTags(name + "-ec2-instance-profile", "IAMInstanceProfile", Map.of()))
                        .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private User createAdminUser(String name) {
        return new User(name + "-admin-user", UserArgs.builder()
                .name(name + "-admin-user")
                .path("/administrators/")
                .forceDestroy(false)
                .tags(getTags(name + "-admin-user", "IAMUser", Map.of(
                        "Role", "Administrator",
                        "MFARequired", "true",
                        "AccessLevel", "Full"
                )))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Policy createMfaEnforcementPolicy(String name) {
        return new Policy(name + "-mfa-enforcement", PolicyArgs.builder()
                .name(name + "-mfa-enforcement-policy")
                .description("Enforce MFA for all actions except MFA management")
                .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AllowViewAccountInfo",
                            "Effect": "Allow",
                            "Action": [
                                "iam:GetAccountPasswordPolicy",
                                "iam:ListVirtualMFADevices",
                                "iam:GetUser",
                                "iam:ListMFADevices"
                            ],
                            "Resource": "*"
                        },
                        {
                            "Sid": "AllowManageOwnPasswords",
                            "Effect": "Allow",
                            "Action": [
                                "iam:ChangePassword",
                                "iam:GetUser"
                            ],
                            "Resource": "arn:aws:iam::*:user/${aws:username}"
                        },
                        {
                            "Sid": "AllowManageOwnMFA",
                            "Effect": "Allow",
                            "Action": [
                                "iam:CreateVirtualMFADevice",
                                "iam:DeleteVirtualMFADevice",
                                "iam:EnableMFADevice",
                                "iam:ResyncMFADevice"
                            ],
                            "Resource": [
                                "arn:aws:iam::*:mfa/${aws:username}",
                                "arn:aws:iam::*:user/${aws:username}"
                            ]
                        },
                        {
                            "Sid": "DenyAllExceptUnlessSignedInWithMFA",
                            "Effect": "Deny",
                            "NotAction": [
                                "iam:CreateVirtualMFADevice",
                                "iam:EnableMFADevice",
                                "iam:GetUser",
                                "iam:ListMFADevices",
                                "iam:ListVirtualMFADevices",
                                "iam:ResyncMFADevice",
                                "sts:GetSessionToken"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "BoolIfExists": {
                                    "aws:MultiFactorAuthPresent": "false"
                                }
                            }
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-mfa-enforcement", "IAMPolicy", Map.of("Purpose", "MFAEnforcement")))
                .build(),  CustomResourceOptions.builder().parent(this).build());
    }

    private Policy createAdminPolicy(String name) {
        return new Policy(name + "-admin-policy", PolicyArgs.builder()
                .name(name + "-admin-policy")
                .description("Administrative access with regional restrictions and MFA requirements")
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
                                },
                                "StringEquals": {
                                    "aws:RequestedRegion": ["us-west-2", "us-east-1"]
                                }
                            }
                        },
                        {
                            "Effect": "Deny",
                            "Action": [
                                "account:CloseAccount",
                                "account:DeleteAlternateContact",
                                "organizations:LeaveOrganization"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
                .tags(getTags(name + "-admin-policy", "IAMPolicy", Map.of("Purpose", "AdministrativeAccess")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Group createAdminGroup(String name) {
        return new Group(name + "-admin-group", GroupArgs.builder()
                .name(name + "-administrators")
                .path("/administrators/")
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private void attachPolicies(String name) {
        // Attach EC2 policy to EC2 role
        new RolePolicyAttachment(name + "-ec2-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn(ec2Policy.arn())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach AWS managed policy for Systems Manager to EC2 role
        new RolePolicyAttachment(name + "-ec2-ssm-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach AWS managed policy for CloudWatch agent to EC2 role
        new RolePolicyAttachment(name + "-ec2-cloudwatch-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(ec2Role.name())
                .policyArn("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach MFA enforcement policy to admin group
        new GroupPolicyAttachment(name + "-mfa-policy-attachment", GroupPolicyAttachmentArgs.builder()
                .group(adminGroup.name())
                .policyArn(mfaEnforcementPolicy.arn())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Attach admin policy to admin group
        new GroupPolicyAttachment(name + "-admin-policy-attachment", GroupPolicyAttachmentArgs.builder()
                .group(adminGroup.name())
                .policyArn(adminPolicy.arn())
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Add admin user to admin group
        new GroupMembership(name + "-admin-group-membership", GroupMembershipArgs.builder()
                .name(name + "-admin-group-membership")
                .users(adminUser.name().applyValue(List::of))
                .group(adminGroup.name())
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private Map<String, String> getTags(String name, String resourceType, Map<String, String> additional) {
        return buildResourceTags(name, resourceType, additional);
    }

    public static Map<String, String> buildResourceTags(String name, String resourceType, Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure",
                "ComplianceRequired", "true"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    // Getters
    public Output<String> getEc2InstanceProfileName() { return ec2InstanceProfile.name(); }
}
```

```java
package app.components;

import com.pulumi.aws.ec2.*;
import com.pulumi.aws.ec2.inputs.*;
import com.pulumi.aws.ec2.outputs.GetAmiResult;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import com.pulumi.tls.PrivateKey;
import com.pulumi.tls.PrivateKeyArgs;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ComputeComponent extends ComponentResource {
    private final SecurityGroup webSecurityGroup;
    private final SecurityGroup appSecurityGroup;
    private final SecurityGroup databaseSecurityGroup;
    private final List<Instance> instances;
    private final KeyPair keyPair;

    public ComputeComponent(String name, NetworkingComponent networking,
                            IamComponent iam, String region) {
        this(name, networking, iam, region, null);
    }

    public ComputeComponent(String name, NetworkingComponent networking,
                            IamComponent iam, String region, ComponentResourceOptions opts) {
        super("custom:infrastructure:ComputeComponent", name, opts);

        var genKey = new PrivateKey("compute-private-key", PrivateKeyArgs.builder()
                .algorithm("RSA")
                .rsaBits(4096)
                .build());

        // Create key pair for secure SSH access
        this.keyPair = new KeyPair(name + "-key-pair", KeyPairArgs.builder()
                .keyName(name + "-secure-key")
                .publicKey(genKey.publicKeyOpenssh())
                .tags(getTags(name + "-key-pair", "KeyPair", Map.of()))
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Create layered security groups
        this.webSecurityGroup = createWebSecurityGroup(name, networking);
        this.appSecurityGroup = createAppSecurityGroup(name, networking);
        this.databaseSecurityGroup = createDatabaseSecurityGroup(name, networking);

        // Create instances with security best practices
        this.instances = createInstances(name, networking, iam, region);
    }

    private SecurityGroup createWebSecurityGroup(String name, NetworkingComponent networking) {
        return new SecurityGroup(name + "-web-sg", SecurityGroupArgs.builder()
                .name(name + "-web-tier-sg")
                .description("Security group for web tier with restrictive access")
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
                        // HTTP redirect to HTTPS
                        SecurityGroupIngressArgs.builder()
                                .protocol("tcp")
                                .fromPort(80)
                                .toPort(80)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTP redirect to HTTPS")
                                .build(),
                        // SSH from specific admin IP ranges only
                        SecurityGroupIngressArgs.builder()
                                .protocol("tcp")
                                .fromPort(22)
                                .toPort(22)
                                .cidrBlocks("203.0.113.0/24") // Replace with your admin IP range
                                .description("SSH from admin network")
                                .build()
                )
                .egress(
                        // HTTPS outbound for updates and API calls
                        SecurityGroupEgressArgs.builder()
                                .protocol("tcp")
                                .fromPort(443)
                                .toPort(443)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTPS outbound")
                                .build(),
                        // HTTP outbound for package updates
                        SecurityGroupEgressArgs.builder()
                                .protocol("tcp")
                                .fromPort(80)
                                .toPort(80)
                                .cidrBlocks("0.0.0.0/0")
                                .description("HTTP outbound for updates")
                                .build(),
                        // DNS outbound
                        SecurityGroupEgressArgs.builder()
                                .protocol("udp")
                                .fromPort(53)
                                .toPort(53)
                                .cidrBlocks("0.0.0.0/0")
                                .description("DNS outbound")
                                .build()
                )
                .tags(getTags(name + "-web-sg", "SecurityGroup", Map.of("Tier", "Web")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private SecurityGroup createAppSecurityGroup(String name, NetworkingComponent networking) {
        return new SecurityGroup(name + "-app-sg", SecurityGroupArgs.builder()
                .name(name + "-app-tier-sg")
                .description("Security group for application tier")
                .vpcId(networking.getVpcId())
                .tags(getTags(name + "-app-sg", "SecurityGroup", Map.of("Tier", "Application")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private SecurityGroup createDatabaseSecurityGroup(String name, NetworkingComponent networking) {
        return new SecurityGroup(name + "-db-sg", SecurityGroupArgs.builder()
                .name(name + "-database-tier-sg")
                .description("Security group for database tier")
                .vpcId(networking.getVpcId())
                .tags(getTags(name + "-db-sg", "SecurityGroup", Map.of("Tier", "Database")))
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    private List<Instance> createInstances(String name, NetworkingComponent networking,
                                           IamComponent iam, String region) {
        var instances = new ArrayList<Instance>();

        // Get latest Amazon Linux 2023 AMI
        var amiLookup = Ec2Functions.getAmi(GetAmiArgs.builder()
                .mostRecent(true)
                .owners("amazon")
                .filters(GetAmiFilterArgs.builder()
                        .name("name")
                        .values("al2023-ami-*-x86_64")
                        .build())
                .build());

        // Create web server instances in public subnets
        networking.getPublicSubnetIds().applyValue(subnetIds -> {
            for (int i = 0; i < Math.min(2, subnetIds.size()); i++) {
                var webInstance = new Instance(name + "-web-" + (i + 1), InstanceArgs.builder()
                        .ami(amiLookup.applyValue(GetAmiResult::id))
                        .instanceType("t3.micro")
                        .subnetId(subnetIds.get(i))
                        .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(List::of))
                        .iamInstanceProfile(iam.getEc2InstanceProfileName())
                        .keyName(keyPair.keyName())
                        .userData(createWebServerUserData())
                        .monitoring(true) // Enable detailed monitoring
                        .ebsOptimized(true)
                        .rootBlockDevice(InstanceRootBlockDeviceArgs.builder()
                                .volumeType("gp3")
                                .volumeSize(20)
                                .encrypted(true)
                                .deleteOnTermination(true)
                                .tags(getTags(name + "-web-" + (i + 1) + "-root", "EBSVolume", Map.of()))
                                .build())
                        .tags(getTags(name + "-web-" + (i + 1), "Instance", Map.of(
                                "Tier", "Web",
                                "BackupSchedule", "daily",
                                "PatchGroup", "web-servers"
                        )))
                        .build(), CustomResourceOptions.builder().parent(this).build());
                instances.add(webInstance);
            }
            return null;
        });

        // Create application server instances in private subnets
        networking.getPrivateSubnetIds().applyValue(subnetIds -> {
            for (int i = 0; i < Math.min(2, subnetIds.size()); i++) {
                var appInstance = new Instance(name + "-app-" + (i + 1), InstanceArgs.builder()
                        .ami(amiLookup.applyValue(GetAmiResult::id))
                        .instanceType("t3.small")
                        .subnetId(subnetIds.get(i))
                        .vpcSecurityGroupIds(webSecurityGroup.id().applyValue(List::of))
                        .iamInstanceProfile(iam.getEc2InstanceProfileName())
                        .keyName(keyPair.keyName())
                        .userData(createAppServerUserData())
                        .monitoring(true)
                        .ebsOptimized(true)
                        .rootBlockDevice(InstanceRootBlockDeviceArgs.builder()
                                .volumeType("gp3")
                                .volumeSize(30)
                                .encrypted(true)
                                .deleteOnTermination(true)
                                .tags(getTags(name + "-app-" + (i + 1) + "-root", "EBSVolume", Map.of()))
                                .build())
                        .tags(getTags(name + "-app-" + (i + 1), "Instance", Map.of(
                                "Tier", "Application",
                                "BackupSchedule", "daily",
                                "PatchGroup", "app-servers"
                        )))
                        .build(), CustomResourceOptions.builder().parent(this).build());
                instances.add(appInstance);
            }
            return null;
        });

        // Add security group rules after instances are created
        addSecurityGroupRules();

        return instances;
    }

    private void addSecurityGroupRules() {
        // Allow app tier to communicate with web tier
        new SecurityGroupRule("web-to-app", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(8080)
                .toPort(8080)
                .protocol("tcp")
                .sourceSecurityGroupId(webSecurityGroup.id())
                .securityGroupId(appSecurityGroup.id())
                .description("Application port from web tier")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Allow SSH from web tier to app tier
        new SecurityGroupRule("web-to-app-ssh", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(22)
                .toPort(22)
                .protocol("tcp")
                .sourceSecurityGroupId(webSecurityGroup.id())
                .securityGroupId(appSecurityGroup.id())
                .description("SSH from web tier")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // App tier outbound rules
        new SecurityGroupRule("app-https-outbound", SecurityGroupRuleArgs.builder()
                .type("egress")
                .fromPort(443)
                .toPort(443)
                .protocol("tcp")
                .cidrBlocks("0.0.0.0/0")
                .securityGroupId(appSecurityGroup.id())
                .description("HTTPS outbound")
                .build(), CustomResourceOptions.builder().parent(this).build());

        new SecurityGroupRule("app-http-outbound", SecurityGroupRuleArgs.builder()
                .type("egress")
                .fromPort(80)
                .toPort(80)
                .protocol("tcp")
                .cidrBlocks("0.0.0.0/0")
                .securityGroupId(appSecurityGroup.id())
                .description("HTTP outbound for updates")
                .build(), CustomResourceOptions.builder().parent(this).build());

        // Database tier rules (for future RDS instances)
        new SecurityGroupRule("app-to-db", SecurityGroupRuleArgs.builder()
                .type("ingress")
                .fromPort(5432)
                .toPort(5432)
                .protocol("tcp")
                .sourceSecurityGroupId(appSecurityGroup.id())
                .securityGroupId(databaseSecurityGroup.id())
                .description("PostgreSQL from app tier")
                .build(), CustomResourceOptions.builder().parent(this).build());
    }

    public static String createWebServerUserData() {
        return """
            #!/bin/bash
            yum update -y
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Install and configure nginx
            yum install -y nginx
            systemctl enable nginx
            systemctl start nginx
            
            # Configure SSL/TLS (placeholder - use proper certificates in production)
            mkdir -p /etc/nginx/ssl
            
            # Install fail2ban for SSH protection
            yum install -y fail2ban
            systemctl enable fail2ban
            systemctl start fail2ban
            
            # Configure CloudWatch agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "SecureInfrastructure/WebTier",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config -m ec2 \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Enable automatic security updates
            yum install -y yum-cron
            systemctl enable yum-cron
            systemctl start yum-cron
            """;
    }

    public static String createAppServerUserData() {
        return """
            #!/bin/bash
            yum update -y
            
            # Install CloudWatch agent
            yum install -y amazon-cloudwatch-agent
            
            # Install Java 17 for application runtime
            yum install -y java-17-amazon-corretto-devel
            
            # Install application dependencies
            yum install -y git
            
            # Configure CloudWatch agent for app tier
            cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
            {
                "metrics": {
                    "namespace": "SecureInfrastructure/AppTier",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/application.log",
                                    "log_group_name": "secure-infrastructure-app-logs",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }
            EOF
            
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
                -a fetch-config -m ec2 \
                -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
            
            # Enable automatic security updates
            yum install -y yum-cron
            systemctl enable yum-cron
            systemctl start yum-cron
            """;
    }

    public static Map<String, String> getTags(String name, String resourceType, Map<String, String> additional) {
        var baseTags = Map.of(
                "Name", name,
                "ResourceType", resourceType,
                "Environment", "production",
                "ManagedBy", "Pulumi",
                "Project", "SecureInfrastructure",
                "MonitoringEnabled", "true"
        );

        if (additional.isEmpty()) {
            return baseTags;
        }

        var allTags = new java.util.HashMap<>(baseTags);
        allTags.putAll(additional);
        return allTags;
    }

    // Getters
    public Output<List<String>> getInstanceIds() {
        return Output.all(instances.stream().map(Instance::id).toList())
                .applyValue(ArrayList::new);
    }
}
```