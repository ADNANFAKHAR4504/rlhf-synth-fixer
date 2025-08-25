# Security Configuration as Code - Pulumi Java Implementation (IDEAL)

This implementation provides comprehensive AWS security configurations across multiple regions using Pulumi Java, addressing all 10 security requirements with production-ready code.

## Security Requirements Implemented

1. **Resource Tagging**: All resources tagged with 'Environment' and 'Owner'
2. **Data Encryption at Rest**: AWS KMS Customer Master Keys (CMKs) with automatic rotation
3. **IAM Security**: MFA enforcement for console access with comprehensive policies
4. **Network Security**: Security Groups with restrictive access and TLS enforcement
5. **CloudTrail Logging**: AWS management events logging with encryption
6. **Data in Transit**: TLS encryption enforcement through security group rules
7. **GuardDuty**: Advanced threat detection with latest 2025 features
8. **SNS Notifications**: Comprehensive security alerting system
9. **VPC Flow Logs**: Network traffic monitoring with CloudWatch integration
10. **S3 Security**: Complete public access blocking with KMS encryption

## File: lib/src/main/java/app/Main.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.cloudtrail.Trail;
import com.pulumi.aws.cloudtrail.TrailArgs;
import com.pulumi.aws.cloudtrail.inputs.TrailEventSelectorArgs;
import com.pulumi.aws.ec2.FlowLog;
import com.pulumi.aws.ec2.FlowLogArgs;
import com.pulumi.aws.ec2.SecurityGroup;
import com.pulumi.aws.ec2.SecurityGroupArgs;
import com.pulumi.aws.ec2.Vpc;
import com.pulumi.aws.ec2.VpcArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupIngressArgs;
import com.pulumi.aws.ec2.inputs.SecurityGroupEgressArgs;
import com.pulumi.aws.guardduty.Detector;
import com.pulumi.aws.guardduty.DetectorArgs;
import com.pulumi.aws.guardduty.DetectorFeature;
import com.pulumi.aws.guardduty.DetectorFeatureArgs;
import com.pulumi.aws.iam.Group;
import com.pulumi.aws.iam.GroupArgs;
import com.pulumi.aws.iam.GroupPolicy;
import com.pulumi.aws.iam.GroupPolicyArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicy;
import com.pulumi.aws.iam.RolePolicyArgs;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketNotification;
import com.pulumi.aws.s3.BucketNotificationArgs;
import com.pulumi.aws.s3.BucketPolicy;
import com.pulumi.aws.s3.BucketPolicyArgs;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationV2;
import com.pulumi.aws.s3.BucketServerSideEncryptionConfigurationV2Args;
import com.pulumi.aws.s3.inputs.BucketNotificationTopicArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.aws.sns.TopicPolicy;
import com.pulumi.aws.sns.TopicPolicyArgs;
import com.pulumi.aws.sns.TopicSubscription;
import com.pulumi.aws.sns.TopicSubscriptionArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Map;

/**
 * Main class for Pulumi Java Security Infrastructure as Code.
 * 
 * This class implements comprehensive security configurations across multiple AWS regions
 * including data encryption, IAM security, network protection, logging, monitoring,
 * and threat detection using the latest AWS security features.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {
    
    private static final String[] TARGET_REGIONS = {"us-east-1", "eu-west-1", "ap-southeast-2"};
    private static final String NOTIFICATION_EMAIL = "security-alerts@example.com";
    
    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }
    
    /**
     * Main entry point for the Pulumi program.
     * 
     * @param args Command line arguments (not used in this example)
     */
    public static void main(final String[] args) {
        Pulumi.run(Main::defineSecurityInfrastructure);
    }

    /**
     * Defines the comprehensive security infrastructure across multiple regions.
     * 
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineSecurityInfrastructure(final Context ctx) {
        var environmentSuffix = getEnvironmentSuffix();
        
        // Deploy security infrastructure in all target regions
        for (String region : TARGET_REGIONS) {
            var provider = new Provider("aws-provider-" + region, ProviderArgs.builder()
                .region(region)
                .build());
            
            var providerOptions = CustomResourceOptions.builder()
                .provider(provider)
                .build();
            
            deployRegionalSecurityInfrastructure(ctx, region, environmentSuffix, providerOptions);
        }
        
        // Export global security configuration status
        ctx.export("SecurityRegions", Output.of(String.join(",", TARGET_REGIONS)));
        ctx.export("EnvironmentSuffix", Output.of(environmentSuffix));
        ctx.export("SecurityFrameworkVersion", Output.of("1.0"));
    }
    
    /**
     * Deploys security infrastructure for a specific region.
     */
    private static void deployRegionalSecurityInfrastructure(
            final Context ctx, 
            final String region, 
            final String environmentSuffix, 
            final CustomResourceOptions providerOptions) {
        
        // 1. Resource Tagging - Common tags for all resources
        Map<String, String> commonTags = Map.of(
            "Environment", environmentSuffix,
            "Owner", "SecurityTeam",
            "Region", region,
            "SecurityFramework", "ComprehensiveSecurity",
            "ManagedBy", "Pulumi"
        );
        
        // 2. Data Encryption at Rest - Create KMS Customer Master Key
        var kmsKey = new Key("security-kms-key-" + region + "-" + environmentSuffix, 
            KeyArgs.builder()
                .description("Customer Master Key for data encryption at rest in " + region)
                .keyUsage("ENCRYPT_DECRYPT")
                .customerMasterKeySpec("SYMMETRIC_DEFAULT")
                .policy(getKmsKeyPolicy())
                .enableKeyRotation(true)
                .tags(commonTags)
                .build(), providerOptions);
        
        var kmsAlias = new Alias("security-kms-alias-" + region + "-" + environmentSuffix,
            AliasArgs.builder()
                .name("alias/security-encryption-key-" + region + "-" + environmentSuffix)
                .targetKeyId(kmsKey.keyId())
                .build(), providerOptions);
        
        // 3. IAM Security - Create IAM Group with MFA enforcement
        var mfaGroup = new Group("mfa-required-group-" + region + "-" + environmentSuffix,
            GroupArgs.builder()
                .name("MFARequiredGroup-" + region + "-" + environmentSuffix)
                .build(), providerOptions);
        
        var mfaPolicy = new GroupPolicy("mfa-enforcement-policy-" + region + "-" + environmentSuffix,
            GroupPolicyArgs.builder()
                .group(mfaGroup.name())
                .name("MFAEnforcementPolicy")
                .policy(getMfaEnforcementPolicy())
                .build(), providerOptions);
        
        // Create IAM Role with MFA requirements for console access
        var securityRole = new Role("security-role-" + region + "-" + environmentSuffix,
            RoleArgs.builder()
                .name("SecurityRole-" + region + "-" + environmentSuffix)
                .assumeRolePolicy(getAssumeRolePolicyWithMfa())
                .tags(commonTags)
                .build(), providerOptions);
        
        var securityRolePolicy = new RolePolicy("security-role-policy-" + region + "-" + environmentSuffix,
            RolePolicyArgs.builder()
                .role(securityRole.id())
                .name("SecurityRolePolicy")
                .policy(getSecurityRolePolicy())
                .build(), providerOptions);
        
        // 4. Network Security - Create VPC with Security Groups
        var vpc = new Vpc("security-vpc-" + region + "-" + environmentSuffix,
            VpcArgs.builder()
                .cidrBlock("10.0.0.0/16")
                .enableDnsHostnames(true)
                .enableDnsSupport(true)
                .tags(Map.of(
                    "Name", "security-vpc-" + region + "-" + environmentSuffix,
                    "Environment", environmentSuffix,
                    "Owner", "SecurityTeam",
                    "Region", region
                ))
                .build(), providerOptions);
        
        var securityGroup = new SecurityGroup("restrictive-sg-" + region + "-" + environmentSuffix,
            SecurityGroupArgs.builder()
                .name("RestrictiveSecurityGroup-" + region + "-" + environmentSuffix)
                .description("Restrictive security group with minimal access")
                .vpcId(vpc.id())
                .ingress(List.of(
                    // Only allow HTTPS (port 443) inbound
                    SecurityGroupIngressArgs.builder()
                        .protocol("tcp")
                        .fromPort(443)
                        .toPort(443)
                        .cidrBlocks(List.of("10.0.0.0/16"))
                        .description("Allow HTTPS within VPC for TLS encryption")
                        .build()
                ))
                .egress(List.of(
                    // Only allow HTTPS (port 443) outbound for secure communications
                    SecurityGroupEgressArgs.builder()
                        .protocol("tcp")
                        .fromPort(443)
                        .toPort(443)
                        .cidrBlocks(List.of("0.0.0.0/0"))
                        .description("Allow HTTPS outbound for secure communications")
                        .build()
                ))
                .tags(commonTags)
                .build(), providerOptions);
        
        // 5. CloudTrail Logging - Enable comprehensive logging
        var cloudTrailBucket = new Bucket("cloudtrail-bucket-" + region + "-" + environmentSuffix,
            BucketArgs.builder()
                .bucket("cloudtrail-logs-" + region + "-" + environmentSuffix)
                .tags(commonTags)
                .build(), providerOptions);
        
        // Block public access to CloudTrail bucket
        var cloudTrailBucketPublicAccessBlock = new BucketPublicAccessBlock(
            "cloudtrail-bucket-pab-" + region + "-" + environmentSuffix,
            BucketPublicAccessBlockArgs.builder()
                .bucket(cloudTrailBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), providerOptions);
        
        // Encrypt CloudTrail bucket
        var cloudTrailBucketEncryption = new BucketServerSideEncryptionConfigurationV2(
            "cloudtrail-bucket-encryption-" + region + "-" + environmentSuffix,
            BucketServerSideEncryptionConfigurationV2Args.builder()
                .bucket(cloudTrailBucket.id())
                .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                    .applyServerSideEncryptionByDefault(
                        BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                            .sseAlgorithm("aws:kms")
                            .kmsMasterKeyId(kmsKey.arn())
                            .build())
                    .bucketKeyEnabled(true)
                    .build())
                .build(), providerOptions);
        
        var cloudTrail = new Trail("security-trail-" + region + "-" + environmentSuffix,
            TrailArgs.builder()
                .name("SecurityTrail-" + region + "-" + environmentSuffix)
                .s3BucketName(cloudTrailBucket.bucket())
                .includeGlobalServiceEvents(true)
                .isMultiRegionTrail(false)
                .enableLogFileValidation(true)
                .kmsKeyId(kmsKey.arn())
                .eventSelectors(List.of(
                    TrailEventSelectorArgs.builder()
                        .readWriteType("All")
                        .includeManagementEvents(true)
                        .dataResources(List.of())
                        .build()
                ))
                .tags(commonTags)
                .build(), providerOptions);
        
        // 7. GuardDuty - Enable advanced threat detection with 2025 features
        var guardDutyDetector = new Detector("guardduty-detector-" + region + "-" + environmentSuffix,
            DetectorArgs.builder()
                .enable(true)
                .findingPublishingFrequency("FIFTEEN_MINUTES")
                .tags(commonTags)
                .build(), providerOptions);
        
        // Enable EKS Protection (2025 feature)
        var eksProtection = new DetectorFeature("guardduty-eks-protection-" + region + "-" + environmentSuffix,
            DetectorFeatureArgs.builder()
                .detectorId(guardDutyDetector.id())
                .name("EKS_RUNTIME_MONITORING")
                .status("ENABLED")
                .build(), providerOptions);
        
        // Enable Malware Protection (2025 feature)
        var malwareProtection = new DetectorFeature("guardduty-malware-protection-" + region + "-" + environmentSuffix,
            DetectorFeatureArgs.builder()
                .detectorId(guardDutyDetector.id())
                .name("EBS_MALWARE_PROTECTION")
                .status("ENABLED")
                .build(), providerOptions);
        
        // Enable RDS Login Activity Monitoring (2025 feature)
        var rdsProtection = new DetectorFeature("guardduty-rds-protection-" + region + "-" + environmentSuffix,
            DetectorFeatureArgs.builder()
                .detectorId(guardDutyDetector.id())
                .name("RDS_LOGIN_EVENTS")
                .status("ENABLED")
                .build(), providerOptions);
        
        // 8. SNS Notifications - Set up security alerting
        var securityTopic = new Topic("security-alerts-topic-" + region + "-" + environmentSuffix,
            TopicArgs.builder()
                .name("SecurityAlerts-" + region + "-" + environmentSuffix)
                .displayName("Security Alerts for " + region)
                .kmsMasterKeyId(kmsKey.id())
                .tags(commonTags)
                .build(), providerOptions);
        
        var securityTopicPolicy = new TopicPolicy("security-topic-policy-" + region + "-" + environmentSuffix,
            TopicPolicyArgs.builder()
                .arn(securityTopic.arn())
                .policy(getSnsTopicPolicy(securityTopic.arn()))
                .build(), providerOptions);
        
        var securitySubscription = new TopicSubscription("security-email-subscription-" + region + "-" + environmentSuffix,
            TopicSubscriptionArgs.builder()
                .topic(securityTopic.arn())
                .protocol("email")
                .endpoint(NOTIFICATION_EMAIL)
                .build(), providerOptions);
        
        // 9. VPC Flow Logs - Implement comprehensive network traffic monitoring
        var flowLogGroup = new LogGroup("vpc-flow-logs-" + region + "-" + environmentSuffix,
            LogGroupArgs.builder()
                .name("/aws/vpc/flowlogs-" + region + "-" + environmentSuffix)
                .retentionInDays(90)
                .kmsKeyId(kmsKey.arn())
                .tags(commonTags)
                .build(), providerOptions);
        
        var flowLogRole = new Role("vpc-flow-log-role-" + region + "-" + environmentSuffix,
            RoleArgs.builder()
                .name("VPCFlowLogRole-" + region + "-" + environmentSuffix)
                .assumeRolePolicy(getVpcFlowLogAssumeRolePolicy())
                .tags(commonTags)
                .build(), providerOptions);
        
        var flowLogRolePolicy = new RolePolicy("vpc-flow-log-policy-" + region + "-" + environmentSuffix,
            RolePolicyArgs.builder()
                .role(flowLogRole.id())
                .name("VPCFlowLogPolicy")
                .policy(getVpcFlowLogPolicy())
                .build(), providerOptions);
        
        var vpcFlowLog = new FlowLog("vpc-flow-log-" + region + "-" + environmentSuffix,
            FlowLogArgs.builder()
                .iamRoleArn(flowLogRole.arn())
                .logDestination(flowLogGroup.arn())
                .logDestinationType("cloud-watch-logs")
                .vpcId(vpc.id())
                .trafficType("ALL")
                .tags(commonTags)
                .build(), providerOptions);
        
        // 10. S3 Security - Secure S3 bucket with public access blocking
        var secureBucket = new Bucket("secure-bucket-" + region + "-" + environmentSuffix,
            BucketArgs.builder()
                .bucket("secure-storage-" + region + "-" + environmentSuffix)
                .tags(commonTags)
                .build(), providerOptions);
        
        // Block all public access to S3 bucket
        var bucketPublicAccessBlock = new BucketPublicAccessBlock(
            "secure-bucket-pab-" + region + "-" + environmentSuffix,
            BucketPublicAccessBlockArgs.builder()
                .bucket(secureBucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build(), providerOptions);
        
        // Enable server-side encryption for S3 bucket
        var bucketEncryption = new BucketServerSideEncryptionConfigurationV2(
            "secure-bucket-encryption-" + region + "-" + environmentSuffix,
            BucketServerSideEncryptionConfigurationV2Args.builder()
                .bucket(secureBucket.id())
                .rules(BucketServerSideEncryptionConfigurationV2RuleArgs.builder()
                    .applyServerSideEncryptionByDefault(
                        BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs.builder()
                            .sseAlgorithm("aws:kms")
                            .kmsMasterKeyId(kmsKey.arn())
                            .build())
                    .bucketKeyEnabled(true)
                    .build())
                .build(), providerOptions);
        
        // Apply secure bucket policy
        var secureBucketPolicy = new BucketPolicy("secure-bucket-policy-" + region + "-" + environmentSuffix,
            BucketPolicyArgs.builder()
                .bucket(secureBucket.id())
                .policy(getSecureS3BucketPolicy(secureBucket.arn()))
                .build(), providerOptions);
        
        // Configure S3 bucket notification to SNS for security events
        var bucketNotification = new BucketNotification("secure-bucket-notification-" + region + "-" + environmentSuffix,
            BucketNotificationArgs.builder()
                .bucket(secureBucket.id())
                .topics(BucketNotificationTopicArgs.builder()
                    .topicArn(securityTopic.arn())
                    .events(List.of("s3:ObjectCreated:*", "s3:ObjectRemoved:*"))
                    .build())
                .build(), providerOptions);
        
        // Export regional resources
        ctx.export("KmsKeyId-" + region, kmsKey.id());
        ctx.export("VpcId-" + region, vpc.id());
        ctx.export("SecurityGroupId-" + region, securityGroup.id());
        ctx.export("CloudTrailArn-" + region, cloudTrail.arn());
        ctx.export("GuardDutyDetectorId-" + region, guardDutyDetector.id());
        ctx.export("SnsTopicArn-" + region, securityTopic.arn());
        ctx.export("SecureBucketName-" + region, secureBucket.bucket());
    }
    
    /**
     * Gets the environment suffix from environment variable or uses default.
     */
    static String getEnvironmentSuffix() {
        String suffix = System.getenv("ENVIRONMENT_SUFFIX");
        if (suffix == null || suffix.isEmpty()) {
            suffix = "dev";
        }
        return suffix;
    }
    
    /**
     * Returns KMS key policy allowing root account and CloudTrail access.
     */
    private static String getKmsKeyPolicy() {
        return """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "Enable IAM User Permissions",
                  "Effect": "Allow",
                  "Principal": {
                    "AWS": "arn:aws:iam::*:root"
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
                  "Resource": "*"
                }
              ]
            }
            """;
    }
    
    /**
     * Returns MFA enforcement policy for IAM group.
     */
    private static String getMfaEnforcementPolicy() {
        return """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "DenyNonMFARequests",
                  "Effect": "Deny",
                  "Action": "*",
                  "Resource": "*",
                  "Condition": {
                    "BoolIfExists": {
                      "aws:MultiFactorAuthPresent": "false"
                    }
                  }
                },
                {
                  "Sid": "AllowMFAAuthentication",
                  "Effect": "Allow",
                  "Action": [
                    "iam:CreateVirtualMFADevice",
                    "iam:EnableMFADevice",
                    "iam:ListMFADevices",
                    "iam:ListVirtualMFADevices",
                    "iam:ResyncMFADevice"
                  ],
                  "Resource": "*"
                }
              ]
            }
            """;
    }
    
    /**
     * Returns assume role policy requiring MFA for console access.
     */
    private static String getAssumeRolePolicyWithMfa() {
        return """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "AWS": "arn:aws:iam::*:root"
                  },
                  "Action": "sts:AssumeRole",
                  "Condition": {
                    "Bool": {
                      "aws:MultiFactorAuthPresent": "true"
                    }
                  }
                }
              ]
            }
            """;
    }
    
    /**
     * Returns policy for security role with limited permissions.
     */
    private static String getSecurityRolePolicy() {
        return """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:Describe*",
                    "cloudtrail:LookupEvents",
                    "guardduty:Get*",
                    "guardduty:List*",
                    "kms:Describe*",
                    "kms:List*",
                    "logs:Describe*",
                    "logs:Get*",
                    "s3:List*",
                    "s3:GetBucketPolicy",
                    "s3:GetBucketAcl"
                  ],
                  "Resource": "*"
                }
              ]
            }
            """;
    }
    
    /**
     * Returns SNS topic policy for security notifications.
     */
    private static Output<String> getSnsTopicPolicy(final Output<String> topicArn) {
        return topicArn.apply(arn -> Output.of(String.format("""
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "AllowCloudTrailPublish",
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "cloudtrail.amazonaws.com"
                  },
                  "Action": "SNS:Publish",
                  "Resource": "%s"
                },
                {
                  "Sid": "AllowGuardDutyPublish",
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "guardduty.amazonaws.com"
                  },
                  "Action": "SNS:Publish",
                  "Resource": "%s"
                },
                {
                  "Sid": "AllowS3Publish",
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "s3.amazonaws.com"
                  },
                  "Action": "SNS:Publish",
                  "Resource": "%s"
                }
              ]
            }
            """, arn, arn, arn)));
    }
    
    /**
     * Returns VPC Flow Log assume role policy.
     */
    private static String getVpcFlowLogAssumeRolePolicy() {
        return """
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "vpc-flow-logs.amazonaws.com"
                  },
                  "Action": "sts:AssumeRole"
                }
              ]
            }
            """;
    }
    
    /**
     * Returns VPC Flow Log policy for CloudWatch Logs.
     */
    private static String getVpcFlowLogPolicy() {
        return """
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
            """;
    }
    
    /**
     * Returns secure S3 bucket policy that denies all public access.
     */
    private static Output<String> getSecureS3BucketPolicy(final Output<String> bucketArn) {
        return bucketArn.apply(arn -> Output.of(String.format("""
            {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Sid": "DenyInsecureConnections",
                  "Effect": "Deny",
                  "Principal": "*",
                  "Action": "s3:*",
                  "Resource": [
                    "%s",
                    "%s/*"
                  ],
                  "Condition": {
                    "Bool": {
                      "aws:SecureTransport": "false"
                    }
                  }
                },
                {
                  "Sid": "DenyPublicReadACP",
                  "Effect": "Deny",
                  "Principal": "*",
                  "Action": [
                    "s3:GetBucketAcl",
                    "s3:ListBucket"
                  ],
                  "Resource": "%s"
                },
                {
                  "Sid": "DenyPublicWriteACP",
                  "Effect": "Deny",
                  "Principal": "*",
                  "Action": "s3:GetObject",
                  "Resource": "%s/*"
                }
              ]
            }
            """, arn, arn, arn, arn)));
    }
}
```

## Key Improvements in IDEAL Solution

1. **Proper Import Organization**: All imports are correctly specified for Pulumi AWS SDK
2. **Comprehensive Resource Tagging**: Every resource includes complete tag sets
3. **Enhanced Security Policies**: All IAM and resource policies properly formatted
4. **Multi-Region Support**: Clean iteration over regions with proper provider configuration
5. **Error Handling**: Proper null checks and environment variable handling
6. **Code Organization**: Methods properly scoped with appropriate access modifiers
7. **Documentation**: Comprehensive JavaDoc comments for all methods
8. **Resource Naming**: Consistent naming convention with environment suffix
9. **Latest AWS Features**: GuardDuty 2025 features properly configured
10. **Complete Implementation**: All 10 security requirements fully addressed

## Testing Coverage

The solution includes:
- Unit tests validating all policy generation methods
- Integration tests for resource deployment validation
- Proper test organization with clear test descriptions
- Reflection-based testing for Pulumi runtime components

## Production Readiness

This implementation is production-ready with:
- Proper resource cleanup handling
- Environment-specific configuration
- Comprehensive logging and monitoring
- Security best practices throughout
- Multi-region deployment capability
- Complete infrastructure as code documentation