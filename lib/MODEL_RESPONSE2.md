I'll provide the complete, production-ready Pulumi Java program in a single Main.java file that meets all your financial services security requirements.

```java
// Main.java
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.aws.ec2.*;
import com.pulumi.aws.iam.*;
import com.pulumi.aws.s3.*;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.rds.*;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.aws.lambda.Runtime;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.cloudtrail.TrailEventSelectorArgs;
import com.pulumi.aws.config.*;
import com.pulumi.aws.logs.LogGroup;
import com.pulumi.aws.logs.LogGroupArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.Map;
import java.util.List;
import java.util.Base64;

public class Main {
    // Standard tags for all resources
    private static final Map<String, String> STANDARD_TAGS = Map.of(
        "Environment", "production",
        "ManagedBy", "Pulumi",
        "Compliance", "FinancialServices",
        "Company", "YourCompany"
    );

    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // AWS Provider with explicit region
            var awsProvider = new Provider("aws-provider", ProviderArgs.builder()
                .region("us-east-1")
                .build());

            var providerOpts = CustomResourceOptions.builder()
                .provider(awsProvider)
                .build();

            // =============================================================================
            // 1. KMS KEYS FOR ENCRYPTION AT REST
            // =============================================================================
            
            // Get current AWS account ID for KMS policies
            var current = com.pulumi.aws.AwsFunctions.getCallerIdentity();
            var accountId = current.applyValue(identity -> identity.accountId());

            // S3 KMS Key
            var s3KmsKey = new Key("s3-kms-key", KeyArgs.builder()
                .description("KMS key for S3 bucket encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .policy(accountId.apply(id -> String.format("""
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
                            },
                            {
                                "Sid": "Allow Config to encrypt data",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "config.amazonaws.com"
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
                    """, id)))
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new Alias("s3-kms-alias", AliasArgs.builder()
                .name("alias/yourcompany-production-s3-encryption")
                .targetKeyId(s3KmsKey.keyId())
                .build(), providerOpts);

            // RDS KMS Key
            var rdsKmsKey = new Key("rds-kms-key", KeyArgs.builder()
                .description("KMS key for RDS encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new Alias("rds-kms-alias", AliasArgs.builder()
                .name("alias/yourcompany-production-rds-encryption")
                .targetKeyId(rdsKmsKey.keyId())
                .build(), providerOpts);

            // Lambda KMS Key for environment variables
            var lambdaKmsKey = new Key("lambda-kms-key", KeyArgs.builder()
                .description("KMS key for Lambda environment variable encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new Alias("lambda-kms-alias", AliasArgs.builder()
                .name("alias/yourcompany-production-lambda-encryption")
                .targetKeyId(lambdaKmsKey.keyId())
                .build(), providerOpts);

            // CloudTrail KMS Key
            var cloudTrailKmsKey = new Key("cloudtrail-kms-key", KeyArgs.builder()
                .description("KMS key for CloudTrail log encryption")
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .keyRotationEnabled(true)
                .policy(accountId.apply(id -> String.format("""
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
                                    "kms:DescribeKey"
                                ],
                                "Resource": "*",
                                "Condition": {
                                    "StringEquals": {
                                        "kms:EncryptionContext:aws:cloudtrail:arn": "arn:aws:cloudtrail:us-east-1:%s:trail/yourcompany-production-cloudtrail"
                                    }
                                }
                            }
                        ]
                    }
                    """, id, id)))
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new Alias("cloudtrail-kms-alias", AliasArgs.builder()
                .name("alias/yourcompany-production-cloudtrail-encryption")
                .targetKeyId(cloudTrailKmsKey.keyId())
                .build(), providerOpts);

            // =============================================================================
            // 2. VPC AND NETWORKING
            // =============================================================================

            // VPC
            var vpc = new Vpc("production-vpc", VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                    "Name", "yourcompany-production-vpc",
                    "Environment", "production",
                    "ManagedBy", "Pulumi",
                    "Compliance", "FinancialServices"
                ))
                .build(), providerOpts);

            // Internet Gateway
            var igw = new InternetGateway("production-igw", InternetGatewayArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "yourcompany-production-igw",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            // Public Subnets
            var publicSubnetA = new Subnet("public-subnet-a", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.1.0/24")
                .availabilityZone("us-east-1a")
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", "yourcompany-production-public-subnet-a",
                    "Environment", "production",
                    "Type", "Public"
                ))
                .build(), providerOpts);

            var publicSubnetB = new Subnet("public-subnet-b", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.2.0/24")
                .availabilityZone("us-east-1b")
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", "yourcompany-production-public-subnet-b",
                    "Environment", "production",
                    "Type", "Public"
                ))
                .build(), providerOpts);

            // Elastic IPs for NAT Gateways
            var eipA = new Eip("nat-eip-a", EipArgs.builder()
                .domain("vpc")
                .tags(Map.of(
                    "Name", "yourcompany-production-nat-eip-a",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            var eipB = new Eip("nat-eip-b", EipArgs.builder()
                .domain("vpc")
                .tags(Map.of(
                    "Name", "yourcompany-production-nat-eip-b",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            // NAT Gateways
            var natGatewayA = new NatGateway("nat-gateway-a", NatGatewayArgs.builder()
                .allocationId(eipA.id())
                .subnetId(publicSubnetA.id())
                .tags(Map.of(
                    "Name", "yourcompany-production-nat-gateway-a",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            var natGatewayB = new NatGateway("nat-gateway-b", NatGatewayArgs.builder()
                .allocationId(eipB.id())
                .subnetId(publicSubnetB.id())
                .tags(Map.of(
                    "Name", "yourcompany-production-nat-gateway-b",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            // Private Subnets
            var privateSubnetA = new Subnet("private-subnet-a", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.10.0/24")
                .availabilityZone("us-east-1a")
                .tags(Map.of(
                    "Name", "yourcompany-production-private-subnet-a",
                    "Environment", "production",
                    "Type", "Private"
                ))
                .build(), providerOpts);

            var privateSubnetB = new Subnet("private-subnet-b", SubnetArgs.builder()
                .vpcId(vpc.id())
                .cidrBlock("10.0.11.0/24")
                .availabilityZone("us-east-1b")
                .tags(Map.of(
                    "Name", "yourcompany-production-private-subnet-b",
                    "Environment", "production",
                    "Type", "Private"
                ))
                .build(), providerOpts);

            // Route Tables
            var publicRouteTable = new RouteTable("public-route-table", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "yourcompany-production-public-rt",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            var privateRouteTableA = new RouteTable("private-route-table-a", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "yourcompany-production-private-rt-a",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            var privateRouteTableB = new RouteTable("private-route-table-b", RouteTableArgs.builder()
                .vpcId(vpc.id())
                .tags(Map.of(
                    "Name", "yourcompany-production-private-rt-b",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            // Routes
            new Route("public-route", RouteArgs.builder()
                .routeTableId(publicRouteTable.id())
                .destinationCidrBlock("0.0.0.0/0")
                .gatewayId(igw.id())
                .build(), providerOpts);

            new Route("private-route-a", RouteArgs.builder()
                .routeTableId(privateRouteTableA.id())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGatewayA.id())
                .build(), providerOpts);

            new Route("private-route-b", RouteArgs.builder()
                .routeTableId(privateRouteTableB.id())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGatewayB.id())
                .build(), providerOpts);

            // Route Table Associations
            new RouteTableAssociation("public-rta-a", RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetA.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOpts);

            new RouteTableAssociation("public-rta-b", RouteTableAssociationArgs.builder()
                .subnetId(publicSubnetB.id())
                .routeTableId(publicRouteTable.id())
                .build(), providerOpts);

            new RouteTableAssociation("private-rta-a", RouteTableAssociationArgs.builder()
                .subnetId(privateSubnetA.id())
                .routeTableId(privateRouteTableA.id())
                .build(), providerOpts);

            new RouteTableAssociation("private-rta-b", RouteTableAssociationArgs.builder()
                .subnetId(privateSubnetB.id())
                .routeTableId(privateRouteTableB.id())
                .build(), providerOpts);

            // =============================================================================
            // 3. IAM ROLES WITH MANAGED POLICIES (NO DIRECT ADMIN ACCESS)
            // =============================================================================

            // Lambda Execution Role
            var lambdaExecutionRole = new Role("lambda-execution-role", RoleArgs.builder()
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
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            // Attach managed policies to Lambda role
            new RolePolicyAttachment("lambda-basic-execution", RolePolicyAttachmentArgs.builder()
                .role(lambdaExecutionRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build(), providerOpts);

            new RolePolicyAttachment("lambda-vpc-execution", RolePolicyAttachmentArgs.builder()
                .role(lambdaExecutionRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
                .build(), providerOpts);

            // AWS Config Service Role
            var configServiceRole = new Role("config-service-role", RoleArgs.builder()
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
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new RolePolicyAttachment("config-service-role-policy", RolePolicyAttachmentArgs.builder()
                .role(configServiceRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/ConfigRole")
                .build(), providerOpts);

            // CloudTrail Role for CloudWatch Logs
            var cloudTrailRole = new Role("cloudtrail-role", RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Action": "sts:AssumeRole",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudtrail.amazonaws.com"
                                }
                            }
                        ]
                    }
                    """)
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            var cloudTrailLogsPolicy = new Policy("cloudtrail-logs-policy", PolicyArgs.builder()
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
                                    "logs:DescribeLogGroups",
                                    "logs:DescribeLogStreams"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """)
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new RolePolicyAttachment("cloudtrail-logs-policy-attachment", RolePolicyAttachmentArgs.builder()
                .role(cloudTrailRole.name())
                .policyArn(cloudTrailLogsPolicy.arn())
                .build(), providerOpts);

            // =============================================================================
            // 4. SECURITY GROUPS
            // =============================================================================

            // Lambda Security Group
            var lambdaSecurityGroup = new SecurityGroup("lambda-sg", SecurityGroupArgs.builder()
                .name("yourcompany-production-lambda-sg")
                .description("Security group for Lambda functions")
                .vpcId(vpc.id())
                .egress(SecurityGroupEgressArgs.builder()
                    .fromPort(0)
                    .toPort(0)
                    .protocol("-1")
                    .cidrBlocks("0.0.0.0/0")
                    .description("Allow all outbound traffic")
                    .build())
                .tags(Map.of(
                    "Name", "yourcompany-production-lambda-sg",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            // RDS Security Group
            var rdsSecurityGroup = new SecurityGroup("rds-sg", SecurityGroupArgs.builder()
                .name("yourcompany-production-rds-sg")
                .description("Security group for RDS database")
                .vpcId(vpc.id())
                .ingress(SecurityGroupIngressArgs.builder()
                    .fromPort(5432)
                    .toPort(5432)
                    .protocol("tcp")
                    .securityGroups(lambdaSecurityGroup.id())
                    .description("Allow PostgreSQL from Lambda")
                    .build())
                .tags(Map.of(
                    "Name", "yourcompany-production-rds-sg",
                    "Environment", "production"
                ))
                .build(), providerOpts);

            // =============================================================================
            // 5. S3 BUCKETS WITH ENCRYPTION
            // =============================================================================

            // CloudTrail S3 Bucket
            var cloudTrailBucket = new Bucket("cloudtrail-bucket", BucketArgs.builder()
                .bucket("yourcompany-production-cloudtrail-logs")
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            // S3 Bucket Server-Side Encryption
            new BucketServerSideEncryptionConfigurationV2("cloudtrail-bucket-encryption", 
                BucketServerSideEncryptionConfigurationV2Args.builder()
                    .bucket(cloudTrailBucket.id())
                    .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                        .applyServerSideEncryptionByDefault(
                            BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                                .sseAlgorithm("aws:kms")
                                .kmsMasterKeyId(s3KmsKey.arn())
                                .build())
                        .bucketKeyEnabled(true)
                        .build())
                    .build(), providerOpts);

            // Block public access
            new BucketPublicAccessBlock("cloudtrail-bucket-pab", BucketPublicAccessBlockArgs.builder()
                .bucket(cloudTrailBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), providerOpts);

            // CloudTrail bucket policy
            new BucketPolicy("cloudtrail-bucket-policy", BucketPolicyArgs.builder()
                .bucket(cloudTrailBucket.id())
                .policy(Output.all(cloudTrailBucket.arn(), accountId).apply(values -> {
                    var bucketArn = values.t1;
                    var accId = values.t2;
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
                                    "Resource": "%s"
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
                                            "s3:x-amz-acl": "bucket-owner-full-control"
                                        }
                                    }
                                }
                            ]
                        }
                        """, bucketArn, bucketArn);
                }))
                .build(), providerOpts);

            // Config S3 Bucket
            var configBucket = new Bucket("config-bucket", BucketArgs.builder()
                .bucket("yourcompany-production-config-bucket")
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            new BucketServerSideEncryptionConfigurationV2("config-bucket-encryption", 
                BucketServerSideEncryptionConfigurationV2Args.builder()
                    .bucket(configBucket.id())
                    .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                        .applyServerSideEncryptionByDefault(
                            BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                                .sseAlgorithm("aws:kms")
                                .kmsMasterKeyId(s3KmsKey.arn())
                                .build())
                        .bucketKeyEnabled(true)
                        .build())
                    .build(), providerOpts);

            new BucketPublicAccessBlock("config-bucket-pab", BucketPublicAccessBlockArgs.builder()
                .bucket(configBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), providerOpts);

            // Config bucket policy
            new BucketPolicy("config-bucket-policy", BucketPolicyArgs.builder()
                .bucket(configBucket.id())
                .policy(Output.all(configBucket.arn(), accountId).apply(values -> {
                    var bucketArn = values.t1;
                    var accId = values.t2;
                    return String.format("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "AWSConfigBucketPermissionsCheck",
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "config.amazonaws.com"
                                    },
                                    "Action": "s3:GetBucketAcl",
                                    "Resource": "%s",
                                    "Condition": {
                                        "StringEquals": {
                                            "AWS:SourceAccount": "%s"
                                        }
                                    }
                                },
                                {
                                    "Sid": "AWSConfigBucketExistenceCheck",
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "config.amazonaws.com"
                                    },
                                    "Action": "s3:ListBucket",
                                    "Resource": "%s",
                                    "Condition": {
                                        "StringEquals": {
                                            "AWS:SourceAccount": "%s"
                                        }
                                    }
                                },
                                {
                                    "Sid": "AWSConfigBucketDelivery",
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "config.amazonaws.com"
                                    },
                                    "Action": "s3:PutObject",
                                    "Resource": "%s/*",
                                    "Condition": {
                                        "StringEquals": {
                                            "s3:x-amz-acl": "bucket-owner-full-control",
                                            "AWS:SourceAccount": "%s"
                                        }
                                    }
                                }
                            ]
                        }
                        """, bucketArn, accId, bucketArn, accId, bucketArn, accId);
                }))
                .build(), providerOpts);

            // =============================================================================
            // 6. CLOUDTRAIL SETUP
            // =============================================================================

            // CloudWatch Log Group for CloudTrail
            var cloudTrailLogGroup = new LogGroup("cloudtrail-log-group", LogGroupArgs.builder()
                .name("/aws/cloudtrail/yourcompany-production")
                .retentionInDays(365)
                .kmsKeyId(cloudTrailKmsKey.arn())
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            // CloudTrail
            var cloudTrail = new Trail("production-cloudtrail", TrailArgs.builder()
                .name("yourcompany-production-cloudtrail")
                .s3BucketName(cloudTrailBucket.bucket())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableLogging(true)
                .enableLogFileValidation(true)
                .kmsKeyId(cloudTrailKmsKey.arn())
                .cloudWatchLogsGroupArn(cloudTrailLogGroup.arn().apply(arn -> arn + ":*"))
                .cloudWatchLogsRoleArn(cloudTrailRole.arn())
                .eventSelectors(TrailEventSelectorArgs.builder()
                    .readWriteType("All")
                    .includeManagementEvents(true)
                    .dataResources(com.pulumi.aws.cloudtrail.TrailEventSelectorDataResourceArgs.builder()
                        .type("AWS::S3::Object")
                        .values("arn:aws:s3:::*/*")
                        .build())
                    .build())
                .tags(STANDARD_TAGS)
                .build(), providerOpts);

            // =============================================================================
            // 7. AWS CONFIG SETUP WITH COMPLIANCE RULES
            // =============================================================================

            // Config Delivery Channel
            var configDeliveryChannel = new DeliveryChannel("config-delivery-channel", DeliveryChannelArgs.builder()
                .name("yourcompany-production-config-delivery-channel")
                .s3BucketName(configBucket.bucket())
                .build(), providerOpts);

            // Config Configuration Recorder
            var configRecorder = new ConfigurationRecorder("config-recorder", ConfigurationRecorderArgs.builder()
                .name("yourcompany-production-config-recorder")
                .roleArn(configServiceRole.arn())
                .recordingGroup(ConfigurationRecorderRecordingGroupArgs.builder()
                    .allSupportedIncludeGlobalResourceTypes(true)
                    .includeGlobalResourceTypes(true)
                    .build())
                .build(), providerOpts);

            // Config Rules for Compliance

            // Rule: S3 bucket encryption enabled
            new ConfigRule("s3-bucket-server-side-encryption-enabled", ConfigRuleArgs.builder()
                .name("s3-bucket-server-side-encryption-enabled")
                .source(ConfigRuleSourceArgs.builder()
                    .owner("AWS")
                    .sourceIdentifier("S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED")
                    .build())
                .tags(STANDARD_TAGS)
                .build(), CustomResourceOptions.builder()
                    .dependsOn(configRecorder)
                    .provider(awsProvider)
                    .build());

            // Rule: RDS encryption enabled
            new ConfigRule("rds-storage-encrypted", ConfigRuleArgs.builder()
                .name("rds-