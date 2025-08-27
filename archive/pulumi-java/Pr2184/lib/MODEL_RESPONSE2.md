I see the issue! The S3 buckets can't be deleted because they contain CloudTrail logs. We need to add a `forceDestroy` property to the S3 buckets and also add lifecycle configuration to handle object cleanup. Let me provide you with a complete `Main.java` file that fixes this issue:

```java
// Main.java
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.config.*;
import com.pulumi.aws.rds.*;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.core.Output;
import java.util.Map;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Configuration
            var environment = ctx.config().get("environment").orElse("production");
            var companyName = ctx.config().get("companyName").orElse("YourCompany");
            var region = "us-east-1";
            
            // Standard tags
            var standardTags = Map.of(
                "Environment", environment,
                "Company", companyName,
                "ManagedBy", "Pulumi",
                "Compliance", "FinancialServices"
            );
            
            // Helper function to create resource names
            java.util.function.BiFunction<String, String, String> resourceName = 
                (service, resource) -> String.format("%s-%s-%s-%s", 
                    companyName.toLowerCase(), environment, service, resource);
            
            // ===== KMS KEYS =====
            
            // S3 KMS Key with proper CloudTrail permissions
            var s3Key = new Key(resourceName.apply("kms", "s3"), KeyArgs.builder()
                .description("KMS key for S3 bucket encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(standardTags)
                .policy(ctx.config().get("aws:accountId").apply(accountId -> String.format("""
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
                                "Sid": "Allow CloudTrail to encrypt logs",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudtrail.amazonaws.com"
                                },
                                "Action": [
                                    "kms:GenerateDataKey*",
                                    "kms:DescribeKey",
                                    "kms:Encrypt",
                                    "kms:ReEncrypt*",
                                    "kms:Decrypt"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """, accountId)))
                .build());
                
            new Alias(resourceName.apply("kms-alias", "s3"), AliasArgs.builder()
                .name("alias/" + resourceName.apply("s3", "encryption"))
                .targetKeyId(s3Key.keyId())
                .build());
            
            // RDS KMS Key
            var rdsKey = new Key(resourceName.apply("kms", "rds"), KeyArgs.builder()
                .description("KMS key for RDS encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(standardTags)
                .build());
                
            new Alias(resourceName.apply("kms-alias", "rds"), AliasArgs.builder()
                .name("alias/" + resourceName.apply("rds", "encryption"))
                .targetKeyId(rdsKey.keyId())
                .build());
            
            // Lambda KMS Key
            var lambdaKey = new Key(resourceName.apply("kms", "lambda"), KeyArgs.builder()
                .description("KMS key for Lambda environment variable encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(standardTags)
                .build());
                
            new Alias(resourceName.apply("kms-alias", "lambda"), AliasArgs.builder()
                .name("alias/" + resourceName.apply("lambda", "encryption"))
                .targetKeyId(lambdaKey.keyId())
                .build());
            
            // CloudTrail KMS Key
            var cloudTrailKey = new Key(resourceName.apply("kms", "cloudtrail"), KeyArgs.builder()
                .description("KMS key for CloudTrail log encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(standardTags)
                .build());
                
            new Alias(resourceName.apply("kms-alias", "cloudtrail"), AliasArgs.builder()
                .name("alias/" + resourceName.apply("cloudtrail", "encryption"))
                .targetKeyId(cloudTrailKey.keyId())
                .build());
            
            // Config KMS Key
            var configKey = new Key(resourceName.apply("kms", "config"), KeyArgs.builder()
                .description("KMS key for AWS Config encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(standardTags)
                .build());
                
            new Alias(resourceName.apply("kms-alias", "config"), AliasArgs.builder()
                .name("alias/" + resourceName.apply("config", "encryption"))
                .targetKeyId(configKey.keyId())
                .build());
            
            // ===== IAM ROLES =====
            
            // Lambda Execution Role
            var lambdaExecutionRole = new Role(resourceName.apply("role", "lambda-execution"), RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Action": "sts:AssumeRole",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "lambda.amazonaws.com"
                                }
                            }
                        ]
                    }
                    """)
                .tags(standardTags)
                .build());
            
            // Attach managed policies to Lambda role
            new RolePolicyAttachment(resourceName.apply("rpa", "lambda-basic"), RolePolicyAttachmentArgs.builder()
                .role(lambdaExecutionRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());
                
            new RolePolicyAttachment(resourceName.apply("rpa", "lambda-vpc"), RolePolicyAttachmentArgs.builder()
                .role(lambdaExecutionRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
                .build());
            
            // AWS Config Service Role
            var configServiceRole = new Role(resourceName.apply("role", "config-service"), RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Action": "sts:AssumeRole",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "config.amazonaws.com"
                                }
                            }
                        ]
                    }
                    """)
                .tags(standardTags)
                .build());
            
            // Attach managed policy to Config role
            new RolePolicyAttachment(resourceName.apply("rpa", "config-service"), RolePolicyAttachmentArgs.builder()
                .role(configServiceRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/ConfigRole")
                .build());
            
            // ===== VPC AND NETWORKING =====
            
            // VPC
            var vpc = new Vpc(resourceName.apply("vpc", "main"), VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                    "Name", resourceName.apply("vpc", "main"),
                    "Environment", environment,
                    "Company", companyName,
                    "ManagedBy", "Pulumi"
                ))
                .build());
            
            // Internet Gateway
            var igw = new InternetGateway(resourceName.apply("igw", "main"), InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(standardTags)
                .build());
            
            // Public Subnets
            var publicSubnetA = new Subnet(resourceName.apply("subnet", "public-a"), SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone("us-east-1a")
                .mapPublicIpOnLaunch(true)
                .tags(standardTags)
                .build());
                
            var publicSubnetB = new Subnet(resourceName.apply("subnet", "public-b"), SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone("us-east-1b")
                .mapPublicIpOnLaunch(true)
                .tags(standardTags)
                .build());
            
            // Elastic IPs for NAT Gateways
            var eipA = new Eip(resourceName.apply("eip", "nat-a"), EipArgs.builder()
                .domain("vpc")
                .tags(standardTags)
                .build());
                
            var eipB = new Eip(resourceName.apply("eip", "nat-b"), EipArgs.builder()
                .domain("vpc")
                .tags(standardTags)
                .build());
            
            // NAT Gateways
            var natGatewayA = new NatGateway(resourceName.apply("nat", "a"), NatGatewayArgs.builder()
                .allocationId(eipA.id())
                .subnetId(publicSubnetA.id())
                .tags(standardTags)
                .build());
                
            var natGatewayB = new NatGateway(resourceName.apply("nat", "b"), NatGatewayArgs.builder()
                .allocationId(eipB.id())
                .subnetId(publicSubnetB.id())
                .tags(standardTags)
                .build());
            
            // Private Subnets
            var privateSubnetA = new Subnet(resourceName.apply("subnet", "private-a"), SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.10.0/24")
                .availabilityZone("us-east-1a")
                .tags(standardTags)
                .build());
                
            var privateSubnetB = new Subnet(resourceName.apply("subnet", "private-b"), SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.11.0/24")
                .availabilityZone("us-east-1b")
                .tags(standardTags)
                .build());
            
            // Route Tables
            var publicRouteTable = new RouteTable(resourceName.apply("rt", "public"), RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(standardTags)
                .build());
                
            var privateRouteTableA = new RouteTable(resourceName.apply("rt", "private-a"), RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(standardTags)
                .build());
                
            var privateRouteTableB = new RouteTable(resourceName.apply("rt", "private-b"), RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(standardTags)
                .build());
            
            // Routes
            new Route(resourceName.apply("route", "public-igw"), RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build());
                
            new Route(resourceName.apply("route", "private-a-nat"), RouteArgs.builder()
                .routeTableId(privateRouteTableA.id())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGatewayA.id())
                .build());
                
            new Route(resourceName.apply("route", "private-b-nat"), RouteArgs.builder()
                .routeTableId(privateRouteTableB.id())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGatewayB.id())
                .build());
            
            // Route Table Associations
            new RouteTableAssociation(resourceName.apply("rta", "public-a"), RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetA.id())
                .routeTableId(publicRouteTable.id())
                .build());
                
            new RouteTableAssociation(resourceName.apply("rta", "public-b"), RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetB.id())
                .routeTableId(publicRouteTable.id())
                .build());
                
            new RouteTableAssociation(resourceName.apply("rta", "private-a"), RouteTableAssociationArgs.builder()
                .subnetId(privateSubnetA.id())
                .routeTableId(privateRouteTableA.id())
                .build());
                
            new RouteTableAssociation(resourceName.apply("rta", "private-b"), RouteTableAssociationArgs.builder()
                .subnetId(privateSubnetB.id())
                .routeTableId(privateRouteTableB.id())
                .build());
            
            // ===== SECURITY GROUPS =====
            
            // Lambda Security Group
            var lambdaSecurityGroup = new SecurityGroup(resourceName.apply("sg", "lambda"), SecurityGroupArgs.builder()
                .name(resourceName.apply("sg", "lambda"))
                .description("Security group for Lambda functions")
                .vpcId(vpc.id())
                .egress(SecurityGroupEgressArgs.builder()
                    .fromPort(0)
                    .toPort(0)
                    .protocol("-1")
                    .cidrBlocks("0.0.0.0/0")
                    .description("Allow all outbound traffic")
                    .build())
                .tags(standardTags)
                .build());
            
            // RDS Security Group
            var rdsSecurityGroup = new SecurityGroup(resourceName.apply("sg", "rds"), SecurityGroupArgs.builder()
                .name(resourceName.apply("sg", "rds"))
                .description("Security group for RDS database")
                .vpcId(vpc.id())
                .ingress(SecurityGroupIngressArgs.builder()
                    .fromPort(5432)
                    .toPort(5432)
                    .protocol("tcp")
                    .securityGroups(lambdaSecurityGroup.id())
                    .description("Allow PostgreSQL from Lambda")
                    .build())
                .tags(standardTags)
                .build());
            
            // ===== S3 BUCKETS =====
            
            // CloudTrail S3 Bucket with forceDestroy to fix deletion issues
            var cloudTrailBucket = new Bucket("bucket-cloudtrail-logs", BucketArgs.builder()
                .bucket(resourceName.apply("cloudtrail", "logs"))
                .forceDestroy(true) // This allows deletion even with objects
                .tags(standardTags)
                .build());
            
            // S3 Bucket Versioning
            new BucketVersioningV2("bucket-cloudtrail-versioning", BucketVersioningV2Args.builder()
                .bucket(cloudTrailBucket.id())
                .versioningConfiguration(BucketVersioningV2VersioningConfigurationArgs.builder()
                    .status("Enabled")
                    .build())
                .build());
            
            // S3 Bucket Server Side Encryption
            new BucketServerSideEncryptionConfigurationV2("bucket-cloudtrail-encryption", 
                BucketServerSideEncryptionConfigurationV2Args.builder()
                    .bucket(cloudTrailBucket.id())
                    .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                        .applyServerSideEncryptionByDefault(
                            BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                                .sseAlgorithm("aws:kms")
                                .kmsMasterKeyId(s3Key.arn())
                                .build())
                        .bucketKeyEnabled(true)
                        .build())
                    .build());
            
            // S3 Bucket Public Access Block
            new BucketPublicAccessBlock("bucket-cloudtrail-pab", BucketPublicAccessBlockArgs.builder()
                .bucket(cloudTrailBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());
            
            // S3 Bucket Lifecycle Configuration to automatically delete old objects
            new BucketLifecycleConfigurationV2("bucket-cloudtrail-lifecycle", 
                BucketLifecycleConfigurationV2Args.builder()
                    .bucket(cloudTrailBucket.id())
                    .rules(BucketLifecycleConfigurationV2RuleArgs.builder()
                        .id("delete-old-logs")
                        .status("Enabled")
                        .expiration(BucketLifecycleConfigurationV2RuleExpirationArgs.builder()
                            .days(90) // Delete logs after 90 days
                            .build())
                        .noncurrentVersionExpiration(
                            BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs.builder()
                                .noncurrentDays(30)
                                .build())
                        .build())
                    .build());
            
            // CloudTrail Bucket Policy
            var cloudTrailBucketPolicy = new BucketPolicy("cloudtrail-bucket-policy", BucketPolicyArgs.builder()
                .bucket(cloudTrailBucket.id())
                .policy(Output.tuple(cloudTrailBucket.arn(), ctx.config().get("aws:accountId"))
                    .apply(tuple -> {
                        var bucketArn = tuple.t1;
                        var accountId = tuple.t2;
                        return String.format("""
                            {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Sid": "AWSCloudTrailAclCheck",
                                        "Effect": "Allow",
                                        "Principal": {
                                            "Service": "cloudtrail.amazonaws.com"
                                        },
                                        "Action": "s3:GetBucketAcl",
                                        "Resource": "%s",
                                        "Condition": {
                                            "StringEquals": {
                                                "AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:%s:trail/%s"
                                            }
                                        }
                                    },
                                    {
                                        "Sid": "AWSCloudTrailWrite",
                                        "Effect": "Allow",
                                        "Principal": {
                                            "Service": "cloudtrail.amazonaws.com"
                                        },
                                        "Action": "s3:PutObject",
                                        "Resource": "%s/*",
                                        "Condition": {
                                            "StringEquals": {
                                                "s3:x-amz-acl": "bucket-owner-full-control",
                                                "AWS:SourceArn": "arn:aws:cloudtrail:us-east-1:%s:trail/%s"
                                            }
                                        }
                                    }
                                ]
                            }
                            """, bucketArn, accountId, resourceName.apply("cloudtrail", "main"), 
                                 bucketArn, accountId, resourceName.apply("cloudtrail", "main"));
                    }))
                .build());
            
            // AWS Config S3 Bucket
            var configBucket = new Bucket("bucket-config-logs", BucketArgs.builder()
                .bucket(resourceName.apply("config", "logs"))
                .forceDestroy(true) // This allows deletion even with objects
                .tags(standardTags)
                .build());
            
            // Config Bucket Versioning
            new BucketVersioningV2("bucket-config-versioning", BucketVersioningV2Args.builder()
                .bucket(configBucket.id())
                .versioningConfiguration(BucketVersioningV2VersioningConfigurationArgs.builder()
                    .status("Enabled")
                    .build())
                .build());
            
            // Config Bucket Encryption
            new BucketServerSideEncryptionConfigurationV2("bucket-config-encryption", 
                BucketServerSideEncryptionConfigurationV2Args.builder()
                    .bucket(configBucket.id())
                    .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                        .applyServerSideEncryptionByDefault(
                            BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                                .sseAlgorithm("aws:kms")
                                .kmsMasterKeyId(configKey.arn())
                                .build())
                        .bucketKeyEnabled(true)
                        .build())
                    .build());
            
            // Config Bucket Public Access Block
            new BucketPublicAccessBlock("bucket-config-pab", BucketPublicAccessBlockArgs.builder()
                .bucket(configBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());
            
            // Config Bucket Lifecycle
            new BucketLifecycleConfigurationV2("bucket-config-lifecycle", 
                BucketLifecycleConfigurationV2Args.builder()
                    .bucket(configBucket.id())
                    .rules(BucketLifecycleConfigurationV2RuleArgs.builder()
                        .id("delete-old-config")
                        .status("Enabled")
                        .expiration(BucketLifecycleConfigurationV2RuleExpirationArgs.builder()
                            .days(365) // Keep config data for 1 year
                            .build())
                        .build())
                    .build());
            
            // ===== CLOUDTRAIL =====
            
            var cloudTrail = new Trail(resourceName.apply("cloudtrail", "main"), TrailArgs.builder()
                .name(resourceName.apply("cloudtrail", "main"))
                .s3BucketName(cloudTrailBucket.bucket())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableLogFileValidation(true)
                .kmsKeyId(cloudTrailKey.arn())
                .tags(standardTags)
                .eventSelectors(TrailEventSelectorArgs.builder()
                    .readWriteType("All")
                    .includeManagementEvents(true)
                    .dataResources(TrailEventSelectorDataResourceArgs.builder()
                        .type("AWS::S3::Object")
                        .values("arn:aws:s3:::*/*")
                        .build())
                    .build())
                .build());
            
            // ===== AWS CONFIG =====
            
            // Config Delivery Channel
            var configDeliveryChannel = new DeliveryChannel(resourceName.apply("config", "delivery-channel"), 
                DeliveryChannelArgs.builder()
                    .name(resourceName.apply("config", "delivery-channel"))
                    .s3BucketName(configBucket.bucket())
                    .build());
            
            // Config Configuration Recorder
            var configRecorder = new ConfigurationRecorder(resourceName.apply("config", "recorder"), 
                ConfigurationRecorderArgs.builder()
                    .name(resourceName.apply("config", "recorder"))
                    .roleArn(configServiceRole.arn())
                    .recordingGroup(ConfigurationRecorderRecordingGroupArgs.builder()
                        .allSupportedIncludeGlobalResourceTypes(true)
                        .includeGlobalResourceTypes(true)
                        .build())
                    .build());
            
            // Config Rules for Compliance
            new ConfigRule("config-rule-encrypted-volumes", ConfigRuleArgs.builder()
                .name("encrypted-ebs-volumes")
                .source(ConfigRuleSourceArgs.builder()
                    .owner("AWS")
                    .sourceIdentifier("ENCRYPTED_VOLUMES")
                    .build())
                .dependsOn(configRecorder)
                .tags(standardTags)
                .build());
            
            new ConfigRule("config-rule-rds-encrypted", ConfigRuleArgs.builder()
                .name("rds-storage-encrypted")
                .source(ConfigRuleSourceArgs.builder()
                    .owner("AWS")
                    .sourceIdentifier("RDS_STORAGE_ENCRYPTED")
                    .build())
                .dependsOn(configRecorder)
                .tags(standardTags)
                .build());
            
            new ConfigRule("config-rule-s3-encrypted", ConfigRuleArgs.builder()
                .name("s3-bucket-server-side-encryption-enabled")
                .source(ConfigRuleSourceArgs.builder()
                    .owner("AWS")
                    .sourceIdentifier("S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED")
                    .build())
                .dependsOn(configRecorder)
                .tags(standardTags)
                .build());
            
            // ===== RDS DATABASE =====
            
            // RDS Subnet Group
            var rdsSubnetGroup = new SubnetGroup(resourceName.apply("rds", "subnet-group"), SubnetGroupArgs.builder()
                .name(resourceName.apply("rds", "subnet-group"))
                .subnetIds(privateSubnetA.id(), privateSubnetB.id())
                .tags(standardTags)
                .build());
            
            // RDS Instance
            var rdsInstance = new Instance(resourceName.apply("rds", "main"), InstanceArgs.builder()
                .identifier(resourceName.apply("rds", "main"))
                .allocatedStorage(20)
                .storageType("gp3")
                .storageEncrypted(true)
                .kmsKeyId(rdsKey.arn())
                .engine("postgres")
                .engineVersion("15.4")
                .instanceClass("db.t3.micro")
                .dbName("financialdb")
                .username("dbadmin")
                .managePassword(true) // AWS managed password
                .vpcSecurityGroupIds(rdsSecurityGroup.id())
                .dbSubnetGroupName(rdsSubnetGroup.name())
                .backupRetentionPeriod(7)
                .backupWindow("03:00-04:00")
                .maintenanceWindow("sun:04:00-sun:05:00")
                .skipFinalSnapshot(false)
                .finalSnapshotIdentifier(resourceName.apply("rds", "final-snapshot"))
                .deletionProtection(true)
                .tags(standardTags)
                .build());
            
            // ===== LAMBDA FUNCTION =====
            
            var lambdaFunction = new Function(resourceName.apply("lambda", "processor"), FunctionArgs.builder()
                .name(resourceName.apply("lambda", "processor"))
                .runtime("java17")
                .handler("com.company.Handler::handleRequest")
                .role(lambdaExecutionRole.arn())
                .code(new com.pulumi.asset.StringAsset("""
                    package com.company;
                    
                    import com.amazonaws.services.lambda.runtime.Context;
                    import com.amazonaws.services.lambda.runtime.RequestHandler;
                    import java.util.Map;
                    
                    public class Handler implements RequestHandler<Map<String,Object>, String> {
                        @Override
                        public String handleRequest(Map<String,Object> input, Context context) {
                            context.getLogger().log("Processing financial transaction: " + input);
                            return "Transaction processed successfully";
                        }
                    }
                    """))
                .vpcConfig(FunctionVpcConfigArgs.builder()
                    .subnetIds(privateSubnetA.id(), privateSubnetB.id())
                    .securityGroupIds(lambdaSecurityGroup.id())
                    .build())
                .environment(FunctionEnvironmentArgs.builder()
                    .variables(Map.of(
                        "DB_HOST", rdsInstance.endpoint(),
                        "ENVIRONMENT", environment,
                        "SENSITIVE_DATA", "encrypted-value" // This will be encrypted with KMS
                    ))
                    .build())
                .kmsKeyArn(lambdaKey.arn()) // Encrypt environment variables
                .tags(standardTags)
                .build());
            
            // ===== OUTPUTS =====
            
            ctx.export("vpcId", vpc.id());
            ctx.export("vpcCidrBlock", vpc.cidrBlock());
            ctx.export("privateSubnetIdA", privateSubnetA.id());
            ctx.export("privateSubnetIdB", privateSubnetB.id());
            ctx.export("publicSubnetIdA", publicSubnetA.id());
            ctx.export("publicSubnetIdB", publicSubnetB.id());
            ctx.export("internetGatewayId", igw.id());
            ctx.export("natGatewayIdA", natGatewayA.id());
            ctx.export("natGatewayIdB", nat