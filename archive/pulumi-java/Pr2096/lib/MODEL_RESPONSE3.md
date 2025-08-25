package com.company.aws.security;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.*;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;
import software.amazon.awssdk.services.stepfunctions.SfnClient;
import software.amazon.awssdk.services.stepfunctions.model.*;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityRequest;
import software.amazon.awssdk.services.sts.model.GetCallerIdentityResponse;
import software.amazon.awssdk.services.cloudtrail.CloudTrailClient;
import software.amazon.awssdk.services.cloudtrail.model.*;
import software.amazon.awssdk.core.SdkBytes;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Logger;
import java.util.logging.Level;
import java.nio.charset.StandardCharsets;

/**
 * Comprehensive AWS Multi-Account Security Infrastructure Framework
 * 
 * This class provides a production-ready security foundation for AWS Organizations
 * with focus on compliance, monitoring, and automated threat response.
 */
public class Main {
    
    private static final Logger LOGGER = Logger.getLogger(Main.class.getName());
    private static final Region DEFAULT_REGION = Region.US_EAST_1;
    private static final String ENVIRONMENT = "production";
    private static final String PROJECT = "security-infrastructure";
    
    // AWS Clients
    private final IamClient iamClient;
    private final KmsClient kmsClient;
    private final S3Client s3Client;
    private final CloudWatchClient cloudWatchClient;
    private final SnsClient snsClient;
    private final LambdaClient lambdaClient;
    private final SfnClient stepFunctionsClient;
    private final StsClient stsClient;
    private final CloudTrailClient cloudTrailClient;
    
    private final String accountId;
    private final ExecutorService executorService;
    private boolean testMode = false;
    
    // Test tracking
    private final Map<String, Boolean> deploymentResults = new HashMap<>();
    private final List<String> testResults = new ArrayList<>();
    
    public Main() {
        this(false);
    }
    
    public Main(boolean testMode) {
        this.testMode = testMode;
        
        // Initialize AWS clients with default credentials
        this.iamClient = IamClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.kmsClient = KmsClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.s3Client = S3Client.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.cloudWatchClient = CloudWatchClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.snsClient = SnsClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.lambdaClient = LambdaClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.stepFunctionsClient = SfnClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.stsClient = StsClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
            
        this.cloudTrailClient = CloudTrailClient.builder()
            .region(DEFAULT_REGION)
            .credentialsProvider(DefaultCredentialsProvider.create())
            .build();
        
        // Get current account ID
        this.accountId = getCurrentAccountId();
        this.executorService = Executors.newFixedThreadPool(10);
        
        LOGGER.info("AWS Security Infrastructure initialized for account: " + accountId);
    }
    
    /**
     * Main entry point - deploys the complete security infrastructure
     */
    public static void main(String[] args) {
        Main securityInfrastructure = new Main();
        
        try {
            LOGGER.info("Starting AWS Multi-Account Security Infrastructure deployment...");
            
            // Deploy all components
            securityInfrastructure.deploySecurityInfrastructure();
            
            // Run comprehensive tests
            securityInfrastructure.runSecurityTests();
            
            LOGGER.info("Security infrastructure deployment completed successfully!");
            
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to deploy security infrastructure", e);
            System.exit(1);
        } finally {
            securityInfrastructure.cleanup();
        }
    }
    
    /**
     * Gets the current AWS account ID
     */
    public String getCurrentAccountId() {
        try {
            GetCallerIdentityResponse response = stsClient.getCallerIdentity(GetCallerIdentityRequest.builder().build());
            return response.account();
        } catch (Exception e) {
            if (testMode) {
                return "123456789012"; // Mock account ID for testing
            }
            LOGGER.log(Level.SEVERE, "Failed to get account ID", e);
            throw new RuntimeException("Cannot determine AWS account ID", e);
        }
    }
    
    /**
     * Deploys the complete security infrastructure
     */
    public void deploySecurityInfrastructure() {
        LOGGER.info("Deploying security infrastructure components...");
        
        try {
            // Deploy components sequentially for better error handling
            deploymentResults.put("IAM", setupIAMRolesAndPolicies());
            deploymentResults.put("KMS", setupKMSEncryption());
            deploymentResults.put("S3", setupSecureS3Buckets());
            deploymentResults.put("Monitoring", setupMonitoringAndAlerting());
            deploymentResults.put("Automation", setupAutomatedResponse());
            deploymentResults.put("CloudTrail", setupCloudTrail());
            
            LOGGER.info("All security infrastructure components deployed successfully");
            
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to deploy security infrastructure", e);
            throw new RuntimeException("Deployment failed", e);
        }
    }
    
    /**
     * Sets up IAM roles and policies following least privilege principle
     */
    public boolean setupIAMRolesAndPolicies() {
        LOGGER.info("Setting up IAM roles and policies...");
        
        try {
            // Create security monitoring role
            createSecurityMonitoringRole();
            
            // Create cross-account access role
            createCrossAccountAccessRole();
            
            // Create automated response role
            createAutomatedResponseRole();
            
            // Create audit logging role
            createAuditLoggingRole();
            
            LOGGER.info("IAM roles and policies setup completed");
            return true;
            
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to setup IAM roles and policies", e);
            if (!testMode) {
                throw new RuntimeException("IAM setup failed", e);
            }
            return false;
        }
    }
    
    /**
     * Creates security monitoring role with minimal required permissions
     */
    public void createSecurityMonitoringRole() {
        String roleName = accountId + "-security-monitoring-role";
        
        // Trust policy for Lambda and CloudWatch
        String trustPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": ["lambda.amazonaws.com", "monitoring.amazonaws.com"]
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            """;
        
        // Permissions policy - only what's needed for security monitoring
        String permissionsPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "cloudwatch:PutMetricData",
                            "cloudwatch:GetMetricStatistics",
                            "iam:ListUsers",
                            "iam:ListRoles",
                            "iam:GetLoginProfile",
                            "sns:Publish"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            """;
        
        createRoleWithPolicy(roleName, trustPolicy, permissionsPolicy, "SecurityMonitoringPolicy");
    }
    
    /**
     * Creates cross-account access role with proper trust relationships
     */
    public void createCrossAccountAccessRole() {
        String roleName = accountId + "-cross-account-access-role";
        
        // Fixed trust policy - using specific account ID instead of wildcard
        String trustPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::%s:root"
                        },
                        "Action": "sts:AssumeRole",
                        "Condition": {
                            "StringEquals": {
                                "sts:ExternalId": "security-infrastructure-external-id"
                            }
                        }
                    }
                ]
            }
            """.formatted(accountId);
        
        String permissionsPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": [
                            "arn:aws:s3:::%s-security-logs/*",
                            "arn:aws:kms:us-east-1:%s:key/*"
                        ]
                    }
                ]
            }
            """.formatted(accountId, accountId);
        
        createRoleWithPolicy(roleName, trustPolicy, permissionsPolicy, "CrossAccountAccessPolicy");
    }
    
    /**
     * Creates automated response role for security incidents
     */
    public void createAutomatedResponseRole() {
        String roleName = accountId + "-automated-response-role";
        
        String trustPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": ["lambda.amazonaws.com", "states.amazonaws.com"]
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            """;
        
        String permissionsPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:*",
                            "iam:AttachUserPolicy",
                            "iam:DetachUserPolicy",
                            "iam:PutUserPolicy",
                            "iam:DeleteUserPolicy",
                            "iam:UpdateLoginProfile",
                            "sns:Publish",
                            "ec2:DescribeInstances",
                            "ec2:StopInstances",
                            "ec2:TerminateInstances"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            """;
        
        createRoleWithPolicy(roleName, trustPolicy, permissionsPolicy, "AutomatedResponsePolicy");
    }
    
    /**
     * Creates audit logging role for compliance
     */
    public void createAuditLoggingRole() {
        String roleName = accountId + "-audit-logging-role";
        
        String trustPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudtrail.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            """;
        
        String permissionsPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:PutObject",
                            "s3:GetBucketAcl",
                            "s3:ListBucket",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": [
                            "arn:aws:s3:::%s-audit-logs",
                            "arn:aws:s3:::%s-audit-logs/*",
                            "arn:aws:logs:us-east-1:%s:*"
                        ]
                    }
                ]
            }
            """.formatted(accountId, accountId, accountId);
        
        createRoleWithPolicy(roleName, trustPolicy, permissionsPolicy, "AuditLoggingPolicy");
    }
    
    /**
     * Helper method to create IAM role with policy
     */
    public void createRoleWithPolicy(String roleName, String trustPolicy, String permissionsPolicy, String policyName) {
        if (testMode) {
            LOGGER.info("TEST MODE: Would create role: " + roleName);
            return;
        }
        
        try {
            // Create role
            CreateRoleRequest roleRequest = CreateRoleRequest.builder()
                .roleName(roleName)
                .assumeRolePolicyDocument(trustPolicy)
                .description("Security infrastructure role: " + roleName)
                .tags(getStandardTags())
                .build();
            
            try {
                iamClient.createRole(roleRequest);
                LOGGER.info("Created IAM role: " + roleName);
            } catch (EntityAlreadyExistsException e) {
                LOGGER.info("IAM role already exists: " + roleName);
            }
            
            // Create and attach policy
            String fullPolicyName = accountId + "-" + policyName;
            CreatePolicyRequest policyRequest = CreatePolicyRequest.builder()
                .policyName(fullPolicyName)
                .policyDocument(permissionsPolicy)
                .description("Security policy for " + roleName)
                .tags(getStandardTags())
                .build();
            
            try {
                CreatePolicyResponse policyResponse = iamClient.createPolicy(policyRequest);
                
                // Attach policy to role
                AttachRolePolicyRequest attachRequest = AttachRolePolicyRequest.builder()
                    .roleName(roleName)
                    .policyArn(policyResponse.policy().arn())
                    .build();
                
                iamClient.attachRolePolicy(attachRequest);
                LOGGER.info("Attached policy " + fullPolicyName + " to role " + roleName);
                
            } catch (EntityAlreadyExistsException e) {
                LOGGER.info("Policy already exists: " + fullPolicyName);
                // Try to attach existing policy
                String policyArn = "arn:aws:iam::" + accountId + ":policy/" + fullPolicyName;
                AttachRolePolicyRequest attachRequest = AttachRolePolicyRequest.builder()
                    .roleName(roleName)
                    .policyArn(policyArn)
                    .build();
                
                try {
                    iamClient.attachRolePolicy(attachRequest);
                } catch (Exception attachException) {
                    LOGGER.info("Policy already attached or attachment failed: " + attachException.getMessage());
                }
            }
            
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Error creating role/policy: " + roleName, e);
        }
    }
    
    /**
     * Sets up KMS encryption with proper key rotation
     */
    public boolean setupKMSEncryption() {
        LOGGER.info("Setting up KMS encryption...");
        
        if (testMode) {
            LOGGER.info("TEST MODE: Would create KMS key");
            return true;
        }
        
        try {
            String keyAlias = "alias/" + accountId + "-security-master-key";
            
            // Create KMS key
            CreateKeyRequest keyRequest = CreateKeyRequest.builder()
                .description("Master encryption key for security infrastructure")
                .keyUsage(KeyUsageType.ENCRYPT_DECRYPT)
                .keySpec(KeySpec.SYMMETRIC_DEFAULT)
                .origin(OriginType.AWS_KMS)
                .tags(getStandardKMSTags())
                .policy(getKMSKeyPolicy())
                .build();
            
            CreateKeyResponse keyResponse = kmsClient.createKey(keyRequest);
            String keyId = keyResponse.keyMetadata().keyId();
            
            LOGGER.info("Created KMS key: " + keyId);
            
            // Create alias for the key
            try {
                CreateAliasRequest aliasRequest = CreateAliasRequest.builder()
                    .aliasName(keyAlias)
                    .targetKeyId(keyId)
                    .build();
                
                kmsClient.createAlias(aliasRequest);
                LOGGER.info("Created KMS key alias: " + keyAlias);
            } catch (AlreadyExistsException e) {
                LOGGER.info("KMS key alias already exists: " + keyAlias);
            }
            
            // Enable key rotation
            EnableKeyRotationRequest rotationRequest = EnableKeyRotationRequest.builder()
                .keyId(keyId)
                .build();
            
            kmsClient.enableKeyRotation(rotationRequest);
            LOGGER.info("Enabled key rotation for: " + keyId);
            
            return true;
            
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to setup KMS encryption", e);
            if (!testMode) {
                throw new RuntimeException("KMS setup failed", e);
            }
            return false;
        }
    }
    
    /**
     * Gets KMS key policy with proper permissions
     */
    public String getKMSKeyPolicy() {
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
                        "Sid": "Allow security roles to use the key",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": [
                                "arn:aws:iam::%s:role/%s-security-monitoring-role",
                                "arn:aws:iam::%s:role/%s-cross-account-access-role",
                                "arn:aws:iam::%s:role/%s-automated-response-role"
                            ]
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }
            """.formatted(accountId, accountId, accountId, accountId, accountId, accountId, accountId);
    }
    
    /**
     * Sets up secure S3 buckets with encryption and proper policies
     */
    public boolean setupSecureS3Buckets() {
        LOGGER.info("Setting up secure S3 buckets...");
        
        try {
            // Create security logs bucket
            createSecureS3Bucket(accountId + "-security-logs", "Security logs and audit trails");
            
            // Create audit logs bucket
            createSecureS3Bucket(accountId + "-audit-logs", "Compliance audit logs");
            
            // Create backup bucket
            createSecureS3Bucket(accountId + "-security-backups", "Security configuration backups");
            
            LOGGER.info("Secure S3 buckets setup completed");
            return true;
            
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to setup secure S3 buckets", e);
            if (!testMode) {
                throw new RuntimeException("S3 setup failed", e);
            }
            return false;
        }
    }
    
    /**
     * Creates a secure S3 bucket with encryption and proper policies
     */
    public void createSecureS3Bucket(String bucketName, String description) {
        if (testMode) {
            LOGGER.info("TEST MODE: Would create S3 bucket: " + bucketName);
            return;
        }
        
        try {
            // Create bucket
            CreateBucketRequest bucketRequest = CreateBucketRequest.builder()
                .bucket(bucketName)
                .build();
            
            try {
                s3Client.createBucket(bucketRequest);
                LOGGER.info("Created S3 bucket: " + bucketName);
            } catch (BucketAlreadyExistsException | BucketAlreadyOwnedByYouException e) {
                LOGGER.info("S3 bucket already exists: " + bucketName);
            }
            
            // Block public access
            PutPublicAccessBlockRequest publicAccessRequest = PutPublicAccessBlockRequest.builder()
                .bucket(bucketName)
                .publicAccessBlockConfiguration(PublicAccessBlockConfiguration.builder()
                    .blockPublicAcls(true)
                    .blockPublicPolicy(true)
                    .ignorePublicAcls(true)
                    .restrictPublicBuckets(true)
                    .build())
                .build();
            
            s3Client.putPublicAccessBlock(publicAccessRequest);
            
            // Enable server-side encryption
            PutBucketEncryptionRequest encryptionRequest = PutBucketEncryptionRequest.builder()
                .bucket(bucketName)
                .serverSideEncryptionConfiguration(ServerSideEncryptionConfiguration.builder()
                    .rules(ServerSideEncryptionRule.builder()
                        .applyServerSideEncryptionByDefault(ServerSideEncryptionByDefault.builder()
                            .sseAlgorithm(ServerSideEncryption.AWS_KMS)
                            .kmsMasterKeyID("alias/" + accountId + "-security-master-key")
                            .build())
                        .bucketKeyEnabled(true)
                        .build())
                    .build())
                .build();
            
            s3Client.putBucketEncryption(encryptionRequest);
            
            // Enable versioning
            PutBucketVersioningRequest versioningRequest = PutBucketVersioningRequest.builder()
                .bucket(bucketName)
                .versioningConfiguration(VersioningConfiguration.builder()
                    .status(BucketVersioningStatus.ENABLED)
                    .build())
                .build();
            
            s3Client.putBucketVersioning(versioningRequest);
            
            // Set bucket policy
            String bucketPolicy = getSecureS3BucketPolicy(bucketName);
            PutBucketPolicyRequest policyRequest = PutBucketPolicyRequest.builder()
                .bucket(bucketName)
                .policy(bucketPolicy)
                .build();
            
            s3Client.putBucketPolicy(policyRequest);
            
            // Add tags
            PutBucketTaggingRequest taggingRequest = PutBucketTaggingRequest.builder()
                .bucket(bucketName)
                .tagging(Tagging.builder()
                    .tagSet(getStandardS3Tags(description))
                    .build())
                .build();
            
            s3Client.putBucketTagging(taggingRequest);
            
            LOGGER.info("Configured security settings for bucket: " + bucketName);
            
        } catch (Exception e) {
            LOGGER.log(Level.WARNING, "Error configuring S3 bucket: " + bucketName, e);
        }
    }
    
    /**
     * Gets secure S3 bucket policy
     */
    public String getSecureS3BucketPolicy(String bucketName) {
        return """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": [
                            "arn:aws:s3:::%s",
                            "arn:aws:s3:::%s/*"
                        ],
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    },
                    {
                        "Sid": "AllowSecurityRoles",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": [
                                "arn:aws:iam::%s:role/%s-security-monitoring-role",
                                "arn:aws:iam::%s:role/%s-audit-logging-role"
                            ]
                        },
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "arn:aws:s3:::%s",
                            "arn:aws:s3:::%s/*"
                        ]
                    }
                ]
            }
            """.formatted(bucketName, bucketName, accountId, accountId, accountId, accountId, bucketName, bucketName);
    }
    
    /**
     * Sets up monitoring and alerting with CloudWatch and SNS
     */
    public boolean setupMonitoringAndAlerting() {
        LOGGER.info("Setting up monitoring and alerting...");
        
        try {
            // Create SNS topic for security alerts
            String topicArn = createSecurityAlertsTopic();
            
            // Create CloudWatch alarms
            createSecurityCloudWatchAlarms(topicArn);
            
            // Create custom metrics
            createCustomSecurityMetrics();
            
            LOGGER.info("Monitoring and alerting setup completed");
            return true;
            
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to setup monitoring and alerting", e);
            if (!testMode) {
                throw new RuntimeException("Monitoring setup failed", e);
            }
            return false;
        }
    }
    
    /**
     * Creates SNS topic for security alerts
     */
    public String createSecurityAlertsTopic() {
        String topicName = accountId + "-security-alerts";
        
        if (testMode) {
            LOGGER.info("TEST MODE: Would create SNS topic: " + topicName);
            return "arn:aws:sns:us-east-1:" + accountId + ":" + topicName;
        }
        
        CreateTopicRequest topicRequest = CreateTopicRequest.builder()
            .name(topicName)
            .tags(getStandardSNSTags())
            .build();
        
        CreateTopicResponse topicResponse = snsClient.createTopic(topicRequest);
        String topicArn = topicResponse.topicArn();
        
        // Set topic policy
        String topicPolicy = """
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "arn:aws:iam::%s:root"
                        },
                        "Action": [
                            "SNS:Publish",
                            "SNS:Subscribe"
                        ],
                        "Resource": "%s"
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "cloudwatch.amazonaws.com"
                        },
                        "Action": "SNS:Publish",
                        "Resource": "%s"
                    }
                ]
            }
            """.formatted(accountId, topicArn, topicArn);
        
        SetTopicAttributesRequest policyRequest = SetTopicAttributesRequest.builder()
            .topicArn(topicArn)
            .attributeName("Policy")
            .attributeValue(topicPolicy)
            .build();
        
        snsClient.setTopicAttributes(policyRequest);
        
        LOGGER.info("Created SNS topic for security alerts: " + topicArn);
        return topicArn;
    }
    
    /**
     * Creates CloudWatch alarms for security monitoring
     */
    public void createSecurityCloudWatchAlarms(String snsTopicArn) {
        // Alarm for failed login attempts
        createCloudWatchAlarm(
            accountId + "-failed-login-attempts",
            "Failed login attempts detected",
            "AWS/CloudTrail",
            "ErrorCount",
            ComparisonOperator.GREATER_THAN_THRESHOLD,
            5.0,
            300, // 5 minutes
            1,
            snsTopicArn
        );
        
        // Alarm for root account usage
        createCloudWatchAlarm(
            accountId + "-root-account-usage",
            "Root account usage detected",
            "AWS/CloudTrail",
            "RootAccountUsage",
            ComparisonOperator.GREATER_THAN_THRESHOLD,
            0.0,
            300,
            1,
            snsTopicArn
        );
        
        // Alarm for unauthorized API calls
        createCloudWatchAlarm(
            accountId + "-unauthorized-api-calls",
            "Unauthorized API calls detected",
            "AWS/CloudTrail",
            "UnauthorizedAPICalls",
            ComparisonOperator.GREATER_THAN_THRESHOLD,
            10.0,
            300,
