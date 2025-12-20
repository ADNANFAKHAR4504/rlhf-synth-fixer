package app;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.kms.*;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.lambda.Runtime;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudtrail.*;
import software.amazon.awscdk.services.rds.*;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.RemovalPolicy;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class Main {
    public static void main(final String[] args) {
        App app = new App();

        Object envSuffixObj = app.getNode().tryGetContext("environmentSuffix");
        String envSuffix = envSuffixObj instanceof String ? (String) envSuffixObj : null;
        if (envSuffix == null || envSuffix.isBlank()) {
            envSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        }

        String stackId = "TapStack" + envSuffix;

        String account = System.getenv().getOrDefault(
                "CDK_DEFAULT_ACCOUNT",
                System.getProperty("CDK_DEFAULT_ACCOUNT", "000000000000")
        );
        String region = System.getenv().getOrDefault(
                "CDK_DEFAULT_REGION",
                System.getProperty("CDK_DEFAULT_REGION", "us-east-1")
        );

        new TapStack(app, stackId, StackProps.builder()
                .stackName(stackId)
                .env(Environment.builder()
                        .account(account)
                        .region(region)
                        .build())
                .build());

        app.synth();
    }
}

class TapStack extends Stack {
    private final String uniqueId;
    private final String timestamp;

    public TapStack(final App scope, final String id, final StackProps props) {
        super(scope, id, props);

        Object envSuffixObj = this.getNode().tryGetContext("environmentSuffix");
        String envSuffix = envSuffixObj instanceof String ? (String) envSuffixObj : null;
        if (envSuffix == null || envSuffix.isBlank()) {
            envSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        }

        boolean isLocalStack = "000000000000".equals(System.getenv("CDK_DEFAULT_ACCOUNT"));

        // Generate unique identifiers for this deployment with extra randomness
        String fullUuid = UUID.randomUUID().toString().replace("-", "");
        this.uniqueId = fullUuid.substring(0, 8);
        this.timestamp = String.valueOf(System.currentTimeMillis());

        // 1. Create KMS Keys for encryption
        Key mainKmsKey = createKmsKey();
        Key s3KmsKey = createS3KmsKey();
        Key rdsKmsKey = createRdsKmsKey();

        // 2. Create VPC with proper network isolation
        Vpc vpc = createSecureVpc();

        // 3. Create S3 bucket with encryption and logging
        Bucket secureS3Bucket = createSecureS3Bucket(s3KmsKey);

        // 4. Create CloudTrail for comprehensive logging
        if (!isLocalStack) {
            createCloudTrail(secureS3Bucket, mainKmsKey);
        }

        // 5. Create Lambda function with proper IAM and logging
        Function secureFunction = createSecureLambdaFunction(vpc, mainKmsKey, secureS3Bucket);

        // 6. Create RDS instance with encryption
        if (!isLocalStack) {
            createSecureRdsInstance(vpc, rdsKmsKey, mainKmsKey);
        }

        // 7. Create additional security groups
        createSecurityGroups(vpc);

        CfnOutput.Builder.create(this, "EnvironmentSuffix")
                .value(envSuffix)
                .build();

        CfnOutput.Builder.create(this, "SecureBucketName")
                .value(secureS3Bucket.getBucketName())
                .build();

        CfnOutput.Builder.create(this, "IsLocalStack")
                .value(String.valueOf(isLocalStack))
                .build();
    }

    private Key createKmsKey() {
        return Key.Builder.create(this, "MainKMSKey" + uniqueId)
                .description("Main KMS key for general encryption - " + uniqueId)
                .enableKeyRotation(true)
                .policy(PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .sid("EnableIAMUserPermissions")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new AccountRootPrincipal()))
                                        .actions(Arrays.asList("kms:*"))
                                        .resources(Arrays.asList("*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .sid("AllowCloudWatchLogs")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new ServicePrincipal("logs." + this.getRegion() + ".amazonaws.com")))
                                        .actions(Arrays.asList(
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                        ))
                                        .resources(Arrays.asList("*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .sid("AllowCloudTrailService")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                                        .actions(Arrays.asList(
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                        ))
                                        .resources(Arrays.asList("*"))
                                        .build()
                        ))
                        .build())
                .build();
    }
    
    private Key createS3KmsKey() {
        return Key.Builder.create(this, "S3KMSKey" + uniqueId)
                .description("KMS key for S3 bucket encryption - " + uniqueId)
                .enableKeyRotation(true)
                .policy(PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .sid("EnableIAMUserPermissions")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new AccountRootPrincipal()))
                                        .actions(Arrays.asList("kms:*"))
                                        .resources(Arrays.asList("*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .sid("AllowS3Service")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new ServicePrincipal("s3.amazonaws.com")))
                                        .actions(Arrays.asList(
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                        ))
                                        .resources(Arrays.asList("*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .sid("AllowCloudTrailService")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                                        .actions(Arrays.asList(
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                        ))
                                        .resources(Arrays.asList("*"))
                                        .build()
                        ))
                        .build())
                .build();
    }
    
    private Key createRdsKmsKey() {
        return Key.Builder.create(this, "RDSKMSKey" + uniqueId)
                .description("KMS key for RDS encryption - " + uniqueId)
                .enableKeyRotation(true)
                .policy(PolicyDocument.Builder.create()
                        .statements(Arrays.asList(
                                PolicyStatement.Builder.create()
                                        .sid("EnableIAMUserPermissions")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new AccountRootPrincipal()))
                                        .actions(Arrays.asList("kms:*"))
                                        .resources(Arrays.asList("*"))
                                        .build(),
                                PolicyStatement.Builder.create()
                                        .sid("AllowRDSService")
                                        .effect(Effect.ALLOW)
                                        .principals(Arrays.asList(new ServicePrincipal("rds.amazonaws.com")))
                                        .actions(Arrays.asList(
                                                "kms:Encrypt",
                                                "kms:Decrypt",
                                                "kms:ReEncrypt*",
                                                "kms:GenerateDataKey*",
                                                "kms:DescribeKey"
                                        ))
                                        .resources(Arrays.asList("*"))
                                        .build()
                        ))
                        .build())
                .build();
    }
    
    private Vpc createSecureVpc() {
        return Vpc.Builder.create(this, "SecureVPC" + uniqueId)
                .maxAzs(3)
                .cidr("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .subnetConfiguration(Arrays.asList(
                        SubnetConfiguration.builder()
                                .name("PublicSubnet" + uniqueId)
                                .subnetType(SubnetType.PUBLIC)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("PrivateSubnet" + uniqueId)
                                .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                                .cidrMask(24)
                                .build(),
                        SubnetConfiguration.builder()
                                .name("IsolatedSubnet" + uniqueId)
                                .subnetType(SubnetType.PRIVATE_ISOLATED)
                                .cidrMask(24)
                                .build()
                ))
                .natGateways(2)
                .build();
    }
    
    private Bucket createSecureS3Bucket(Key s3KmsKey) {
        // Create CloudWatch Log Group for S3 access logs
        LogGroup s3LogGroup = LogGroup.Builder.create(this, "S3AccessLogGroup" + uniqueId)
                .logGroupName("/aws/s3/access-logs-" + uniqueId)
                .retention(RetentionDays.ONE_YEAR)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        
        // Create access logs bucket first
        Bucket accessLogsBucket = Bucket.Builder.create(this, "S3AccessLogsBucket" + uniqueId)
                .bucketName("s3-access-logs-" + uniqueId + "-" + timestamp)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(false)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        
        Bucket secureS3Bucket = Bucket.Builder.create(this, "SecureS3Bucket" + uniqueId)
                .bucketName("secure-infrastructure-bucket-" + uniqueId + "-" + timestamp)
                .encryption(BucketEncryption.KMS)
                .encryptionKey(s3KmsKey)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .versioned(true)
                .bucketKeyEnabled(true)
                .serverAccessLogsBucket(accessLogsBucket)
                .serverAccessLogsPrefix("access-logs/")
                .lifecycleRules(Arrays.asList(
                        LifecycleRule.builder()
                                .id("DeleteIncompleteMultipartUploads" + uniqueId)
                                .abortIncompleteMultipartUploadAfter(Duration.days(7))
                                .enabled(true)
                                .build(),
                        LifecycleRule.builder()
                                .id("TransitionToIA" + uniqueId)
                                .transitions(Arrays.asList(
                                        Transition.builder()
                                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                                .transitionAfter(Duration.days(30))
                                                .build()
                                ))
                                .enabled(true)
                                .build()
                ))
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        
        // Add bucket policy to allow CloudTrail access
        secureS3Bucket.addToResourcePolicy(
                PolicyStatement.Builder.create()
                        .sid("AWSCloudTrailAclCheck")
                        .effect(Effect.ALLOW)
                        .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                        .actions(Arrays.asList("s3:GetBucketAcl"))
                        .resources(Arrays.asList(secureS3Bucket.getBucketArn()))
                        .build()
        );
        
        secureS3Bucket.addToResourcePolicy(
                PolicyStatement.Builder.create()
                        .sid("AWSCloudTrailWrite")
                        .effect(Effect.ALLOW)
                        .principals(Arrays.asList(new ServicePrincipal("cloudtrail.amazonaws.com")))
                        .actions(Arrays.asList("s3:PutObject"))
                        .resources(Arrays.asList(secureS3Bucket.getBucketArn() + "/cloudtrail-logs/*"))
                        .conditions(Map.of(
                                "StringEquals", Map.of(
                                        "s3:x-amz-acl", "bucket-owner-full-control"
                                )
                        ))
                        .build()
        );
        
        return secureS3Bucket;
    }
    
    private void createCloudTrail(Bucket s3Bucket, Key kmsKey) {
        // Create CloudWatch Log Group for CloudTrail
        LogGroup cloudTrailLogGroup = LogGroup.Builder.create(this, "CloudTrailLogGroup" + uniqueId)
                .logGroupName("/aws/cloudtrail/secure-infrastructure-" + uniqueId)
                .retention(RetentionDays.ONE_YEAR)
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        
        // Create IAM role for CloudTrail to write to CloudWatch Logs
        Role cloudTrailRole = Role.Builder.create(this, "CloudTrailRole" + uniqueId)
                .roleName("CloudTrailRole-" + uniqueId)
                .assumedBy(new ServicePrincipal("cloudtrail.amazonaws.com"))
                .inlinePolicies(Map.of(
                        "CloudTrailLogsPolicy",
                        PolicyDocument.Builder.create()
                                .statements(Arrays.asList(
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList(
                                                        "logs:CreateLogGroup",
                                                        "logs:CreateLogStream",
                                                        "logs:PutLogEvents",
                                                        "logs:DescribeLogGroups",
                                                        "logs:DescribeLogStreams"
                                                ))
                                                .resources(Arrays.asList(cloudTrailLogGroup.getLogGroupArn() + "*"))
                                                .build()
                                ))
                                .build()
                ))
                .build();
        
        Trail.Builder.create(this, "SecureCloudTrail" + uniqueId)
                .trailName("secure-infrastructure-trail-" + uniqueId)
                .bucket(s3Bucket)
                .s3KeyPrefix("cloudtrail-logs/")
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(true)
                .enableFileValidation(true)
                .encryptionKey(kmsKey)
                .cloudWatchLogGroup(cloudTrailLogGroup)
                .sendToCloudWatchLogs(true)
                .build();
    }
    
    private Function createSecureLambdaFunction(Vpc vpc, Key kmsKey, Bucket s3Bucket) {
        // Create CloudWatch Log Group for Lambda
        LogGroup lambdaLogGroup = LogGroup.Builder.create(this, "LambdaLogGroup" + uniqueId)
                .logGroupName("/aws/lambda/secure-function-" + uniqueId)
                .retention(RetentionDays.ONE_MONTH)
                .encryptionKey(kmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        
        // Create IAM role for Lambda with least privilege
        Role lambdaRole = Role.Builder.create(this, "SecureLambdaRole" + uniqueId)
                .roleName("SecureLambdaRole-" + uniqueId)
                .assumedBy(new ServicePrincipal("lambda.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
                ))
                .inlinePolicies(Map.of(
                        "LambdaS3Policy",
                        PolicyDocument.Builder.create()
                                .statements(Arrays.asList(
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList(
                                                        "s3:GetObject",
                                                        "s3:PutObject"
                                                ))
                                                .resources(Arrays.asList(s3Bucket.getBucketArn() + "/*"))
                                                .build(),
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList(
                                                        "kms:Encrypt",
                                                        "kms:Decrypt",
                                                        "kms:GenerateDataKey"
                                                ))
                                                .resources(Arrays.asList(kmsKey.getKeyArn()))
                                                .build(),
                                        PolicyStatement.Builder.create()
                                                .effect(Effect.ALLOW)
                                                .actions(Arrays.asList(
                                                        "logs:CreateLogStream",
                                                        "logs:PutLogEvents"
                                                ))
                                                .resources(Arrays.asList(lambdaLogGroup.getLogGroupArn() + "*"))
                                                .build()
                                ))
                                .build()
                ))
                .build();
        
        // Create security group for Lambda
        SecurityGroup lambdaSecurityGroup = SecurityGroup.Builder.create(this, "LambdaSecurityGroup" + uniqueId)
                .securityGroupName("LambdaSecurityGroup-" + uniqueId)
                .vpc(vpc)
                .description("Security group for secure Lambda function - " + uniqueId)
                .allowAllOutbound(false)
                .build();
        
        // Allow HTTPS outbound for AWS API calls
        lambdaSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS outbound for AWS API calls"
        );
        
        return Function.Builder.create(this, "SecureFunction" + uniqueId)
                .functionName("secure-infrastructure-function-" + uniqueId)
                .runtime(Runtime.PYTHON_3_9)
                .handler("index.handler")
                .code(Code.fromInline(
                        "import json\n" +
                        "import boto3\n" +
                        "import logging\n" +
                        "import os\n" +
                        "\n" +
                        "logger = logging.getLogger()\n" +
                        "logger.setLevel(logging.INFO)\n" +
                        "\n" +
                        "def handler(event, context):\n" +
                        "    logger.info(f'Processing secure request: {json.dumps(event)}')\n" +
                        "    \n" +
                        "    # Get environment variables\n" +
                        "    bucket_name = os.environ.get('S3_BUCKET_NAME')\n" +
                        "    kms_key_id = os.environ.get('KMS_KEY_ID')\n" +
                        "    \n" +
                        "    # Example secure processing\n" +
                        "    response = {\n" +
                        "        'statusCode': 200,\n" +
                        "        'body': json.dumps({\n" +
                        "            'message': 'Processed securely',\n" +
                        "            'bucket': bucket_name,\n" +
                        "            'kms_key': kms_key_id,\n" +
                        "            'input': event\n" +
                        "        })\n" +
                        "    }\n" +
                        "    \n" +
                        "    return response\n"
                ))
                .role(lambdaRole)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .build())
                .securityGroups(Arrays.asList(lambdaSecurityGroup))
                .environment(Map.of(
                        "S3_BUCKET_NAME", s3Bucket.getBucketName(),
                        "KMS_KEY_ID", kmsKey.getKeyId(),
                        "UNIQUE_ID", uniqueId
                ))
                .timeout(Duration.minutes(5))
                .memorySize(512)
                .logGroup(lambdaLogGroup)
                .build();
    }
    
    private void createSecureRdsInstance(Vpc vpc, Key rdsKmsKey, Key mainKmsKey) {
        // Create security group for RDS
        SecurityGroup rdsSecurityGroup = SecurityGroup.Builder.create(this, "RDSSecurityGroup" + uniqueId)
                .securityGroupName("RDSSecurityGroup-" + uniqueId)
                .vpc(vpc)
                .description("Security group for RDS instance - " + uniqueId)
                .allowAllOutbound(false)
                .build();
        
        // Create subnet group for RDS
        SubnetGroup rdsSubnetGroup = SubnetGroup.Builder.create(this, "RDSSubnetGroup" + uniqueId)
                .subnetGroupName("rds-subnet-group-" + uniqueId)
                .description("Subnet group for RDS instance - " + uniqueId)
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .build();
        
        // Create parameter group with encryption settings
        ParameterGroup rdsParameterGroup = ParameterGroup.Builder.create(this, "RDSParameterGroup" + uniqueId)
                .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0_42)
                        .build()))
                .description("Parameter group for secure RDS instance - " + uniqueId)
                .parameters(Map.of(
                        "slow_query_log", "1",
                        "general_log", "1",
                        "log_queries_not_using_indexes", "1"
                ))
                .build();
        
        // Create CloudWatch Log Group for RDS
        LogGroup rdsLogGroup = LogGroup.Builder.create(this, "RDSLogGroup" + uniqueId)
                .logGroupName("/aws/rds/instance/secure-db-" + uniqueId + "/error")
                .retention(RetentionDays.ONE_MONTH)
                .encryptionKey(mainKmsKey)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
        
        // Create monitoring role for RDS
        Role rdsMonitoringRole = Role.Builder.create(this, "RDSMonitoringRole" + uniqueId)
                .roleName("RDSMonitoringRole-" + uniqueId)
                .assumedBy(new ServicePrincipal("monitoring.rds.amazonaws.com"))
                .managedPolicies(Arrays.asList(
                        ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonRDSEnhancedMonitoringRole")
                ))
                .build();
        
        DatabaseInstance.Builder.create(this, "SecureRDSInstance" + uniqueId)
                .instanceIdentifier("secure-db-instance-" + uniqueId)
                .engine(DatabaseInstanceEngine.mysql(MySqlInstanceEngineProps.builder()
                        .version(MysqlEngineVersion.VER_8_0_42)
                        .build()))
                .instanceType(software.amazon.awscdk.services.ec2.InstanceType.of(InstanceClass.T3, InstanceSize.MICRO))
                .vpc(vpc)
                .vpcSubnets(SubnetSelection.builder()
                        .subnetType(SubnetType.PRIVATE_ISOLATED)
                        .build())
                .securityGroups(Arrays.asList(rdsSecurityGroup))
                .subnetGroup(rdsSubnetGroup)
                .parameterGroup(rdsParameterGroup)
                .storageEncrypted(true)
                .storageEncryptionKey(rdsKmsKey)
                .backupRetention(Duration.days(7))
                .deletionProtection(false) // Set to true for production
                .deleteAutomatedBackups(false)
                .enablePerformanceInsights(false)
                .cloudwatchLogsExports(Arrays.asList("error", "general"))
                .monitoringInterval(Duration.minutes(1))
                .monitoringRole(rdsMonitoringRole)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();
    }
    
    private void createSecurityGroups(Vpc vpc) {
        // Web tier security group
        SecurityGroup webSecurityGroup = SecurityGroup.Builder.create(this, "WebSecurityGroup" + uniqueId)
                .securityGroupName("WebSecurityGroup-" + uniqueId)
                .vpc(vpc)
                .description("Security group for web tier - " + uniqueId)
                .allowAllOutbound(false)
                .build();
        
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS inbound"
        );
        
        webSecurityGroup.addIngressRule(
                Peer.anyIpv4(),
                Port.tcp(80),
                "Allow HTTP inbound"
        );
        
        webSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS outbound"
        );
        
        // Application tier security group
        SecurityGroup appSecurityGroup = SecurityGroup.Builder.create(this, "AppSecurityGroup" + uniqueId)
                .securityGroupName("AppSecurityGroup-" + uniqueId)
                .vpc(vpc)
                .description("Security group for application tier - " + uniqueId)
                .allowAllOutbound(false)
                .build();
        
        appSecurityGroup.addIngressRule(
                webSecurityGroup,
                Port.tcp(8080),
                "Allow traffic from web tier"
        );
        
        appSecurityGroup.addEgressRule(
                Peer.anyIpv4(),
                Port.tcp(443),
                "Allow HTTPS outbound for AWS services"
        );
        
        // Database tier security group
        SecurityGroup dbSecurityGroup = SecurityGroup.Builder.create(this, "DBSecurityGroup" + uniqueId)
                .securityGroupName("DBSecurityGroup-" + uniqueId)
                .vpc(vpc)
                .description("Security group for database tier - " + uniqueId)
                .allowAllOutbound(false)
                .build();
        
        dbSecurityGroup.addIngressRule(
                appSecurityGroup,
                Port.tcp(3306),
                "Allow MySQL traffic from app tier"
        );
    }
}