package app;

import software.amazon.awscdk.*;
import software.amazon.awscdk.services.ec2.*;
import software.amazon.awscdk.services.iam.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.cloudtrail.*;
import software.amazon.awscdk.services.cloudtrail.DataResourceType;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.config.*;
import software.amazon.awscdk.services.logs.*;
import software.amazon.awscdk.services.dynamodb.*;
import software.constructs.Construct;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Properties for SecureWebAppStack
 */
class SecureWebAppStackProps {
    private final String environmentSuffix;

    private SecureWebAppStackProps(String environmentSuffix) {
        this.environmentSuffix = environmentSuffix;
    }

    public String getEnvironmentSuffix() {
        return environmentSuffix;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String environmentSuffix;

        public Builder environmentSuffix(String environmentSuffix) {
            this.environmentSuffix = environmentSuffix;
            return this;
        }

        public SecureWebAppStackProps build() {
            return new SecureWebAppStackProps(environmentSuffix);
        }
    }
}

/**
 * Comprehensive security infrastructure stack for web application.
 * 
 * This stack implements:
 * - Multi-AZ VPC with public/private subnets and restricted access
 * - S3 bucket with AES256 encryption for logs and CloudTrail
 * - CloudTrail for API call logging with network activity events
 * - IAM role with least privilege access to S3 and DynamoDB
 * - CloudWatch alarms for unauthorized API calls
 * - AWS Config rules for IAM policy monitoring
 * - NAT gateways for secure outbound internet access
 */
public class SecureWebAppStack extends Stack {
    private final String environmentSuffix;
    
    public SecureWebAppStack(final Construct scope, final String id, final SecureWebAppStackProps props) {
        super(scope, id, null);
        
        this.environmentSuffix = props.getEnvironmentSuffix();
        
        // 1. Create VPC with proper network segmentation
        Vpc vpc = createSecureVpc();
        
        // 2. Create S3 bucket for logs with AES256 encryption
        Bucket logsBucket = createSecureLogsBucket();
        
        // 3. Create IAM role with least privilege access
        Role appRole = createLeastPrivilegeRole(logsBucket);
        
        // 4. Create CloudTrail for API logging
        Trail cloudTrail = createCloudTrail(logsBucket, vpc);
        
        // 5. Create CloudWatch alarms for security monitoring
        createSecurityAlarms(cloudTrail);
        
        // 6. Create AWS Config for IAM policy monitoring
        createConfigRules();
        
        // 7. Create DynamoDB table (referenced by IAM role)
        createSecureDynamoTable();

        // 8. Create security groups with IP restrictions
        createRestrictedSecurityGroups(vpc);
    }
    
    /**
     * Creates a secure VPC with multi-AZ public/private subnets and restricted access
     */
    private Vpc createSecureVpc() {
        return Vpc.Builder.create(this, "SecureWebAppVpc")
            .maxAzs(2)  // Multi-AZ for high availability
            .cidr("10.0.0.0/16")
            .subnetConfiguration(Arrays.asList(
                SubnetConfiguration.builder()
                    .name("PublicSubnet")
                    .subnetType(SubnetType.PUBLIC)
                    .cidrMask(24)
                    .build(),
                SubnetConfiguration.builder()
                    .name("PrivateSubnet")
                    .subnetType(SubnetType.PRIVATE_WITH_EGRESS)  // Includes NAT Gateway
                    .cidrMask(24)
                    .build()
            ))
            .natGateways(2)  // One NAT gateway per AZ for redundancy
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .build();
    }
    
    /**
     * Creates S3 bucket with AES256 encryption for storing logs and CloudTrail data
     */
    private Bucket createSecureLogsBucket() {
        Bucket bucket = Bucket.Builder.create(this, "SecureLogsBucket")
            .bucketName("secure-webapp-logs-" + environmentSuffix + "-" + this.getAccount())
            .encryption(BucketEncryption.S3_MANAGED)  // AES256 encryption
            .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
            .versioned(true)
            .lifecycleRules(Arrays.asList(
                LifecycleRule.builder()
                    .id("DeleteOldLogs")
                    .expiration(Duration.days(365))
                    .build()
            ))
            .serverAccessLogsPrefix("access-logs/")
            .removalPolicy(RemovalPolicy.DESTROY)
            .build();
        
        // Add bucket policy to enforce SSL
        bucket.addToResourcePolicy(PolicyStatement.Builder.create()
            .effect(Effect.DENY)
            .principals(Arrays.asList(new AnyPrincipal()))
            .actions(Arrays.asList("s3:*"))
            .resources(Arrays.asList(
                bucket.getBucketArn(),
                bucket.getBucketArn() + "/*"
            ))
            .conditions(Map.of(
                "Bool", Map.of("aws:SecureTransport", "false")
            ))
            .build());
        
        return bucket;
    }
    
    /**
     * Creates IAM role with least privilege access to S3 and DynamoDB only
     */
    private Role createLeastPrivilegeRole(Bucket logsBucket) {
        Role role = Role.Builder.create(this, "WebAppRole")
            .roleName("WebAppRole-" + environmentSuffix)
            .assumedBy(ServicePrincipal.Builder.create("ec2.amazonaws.com").build())
            .description("Least privilege role for web application with S3 and DynamoDB access only")
            .build();
        
        // S3 access policy - only to the logs bucket
        PolicyStatement s3Policy = PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ))
            .resources(Arrays.asList(
                logsBucket.getBucketArn(),
                logsBucket.getBucketArn() + "/*"
            ))
            .build();
        
        // DynamoDB access policy - least privilege
        PolicyStatement dynamoPolicy = PolicyStatement.Builder.create()
            .effect(Effect.ALLOW)
            .actions(Arrays.asList(
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ))
            .resources(Arrays.asList(
                "arn:aws:dynamodb:" + this.getRegion() + ":" + this.getAccount() + ":table/WebAppTable-" + environmentSuffix
            ))
            .build();
        
        Policy appPolicy = Policy.Builder.create(this, "WebAppPolicy")
            .policyName("WebAppPolicy-" + environmentSuffix)
            .statements(Arrays.asList(s3Policy, dynamoPolicy))
            .build();
        
        role.attachInlinePolicy(appPolicy);
        return role;
    }
    
    /**
     * Creates CloudTrail for comprehensive API logging with network activity events
     */
    private Trail createCloudTrail(Bucket logsBucket, Vpc vpc) {
        // Create CloudWatch log group for CloudTrail
        LogGroup cloudTrailLogGroup = LogGroup.Builder.create(this, "CloudTrailLogGroup")
            .logGroupName("/aws/cloudtrail/webapp-" + environmentSuffix)
            .retention(RetentionDays.ONE_YEAR)
            .removalPolicy(RemovalPolicy.DESTROY) // Add removal policy to clean up during testing
            .build();
        
        // Create CloudTrail with enhanced features
        Trail trail = Trail.Builder.create(this, "WebAppCloudTrail")
            .trailName("WebAppSecurityTrail-" + environmentSuffix)
            .bucket(logsBucket)
            .s3KeyPrefix("cloudtrail-logs/")
            .includeGlobalServiceEvents(true)
            .isMultiRegionTrail(true)
            .enableFileValidation(true)
            .sendToCloudWatchLogs(true) // This automatically sends logs to CloudWatch
            .cloudWatchLogGroup(cloudTrailLogGroup) // Explicitly set the log group
            .cloudWatchLogsRetention(RetentionDays.ONE_YEAR)
            .build();
        
        // Add event selectors for enhanced monitoring including network activity
        trail.addEventSelector(
            DataResourceType.S3_OBJECT,
            Arrays.asList(
                logsBucket.getBucketArn() + "/application-logs/*"
            )
        );
        
        return trail;
    }
    
    /**
     * Creates CloudWatch alarms for detecting unauthorized API calls
     */
    private void createSecurityAlarms(Trail cloudTrail) {
        // Get the CloudWatch log group used by CloudTrail
        ILogGroup cloudTrailLogGroup = cloudTrail.getLogGroup();
        
        // Metric filter for detecting unauthorized API calls
        MetricFilter unauthorizedCallsFilter = MetricFilter.Builder.create(this, "UnauthorizedCallsFilter")
            .logGroup(cloudTrailLogGroup) // Use the actual log group from CloudTrail
            .metricName("UnauthorizedAPICalls")
            .metricNamespace("Security/WebApp")
            .filterPattern(FilterPattern.any(
                FilterPattern.stringValue("$.errorCode", "=", "UnauthorizedOperation"),
                FilterPattern.stringValue("$.errorCode", "=", "AccessDenied")
            ))
            .metricValue("1")
            .defaultValue(0.0)
            .build();
        
        // CloudWatch alarm for unauthorized calls
        Alarm unauthorizedCallsAlarm = Alarm.Builder.create(this, "UnauthorizedCallsAlarm")
            .alarmName("WebApp-UnauthorizedCalls-" + environmentSuffix)
            .alarmDescription("Alert on unauthorized API calls detected by CloudTrail")
            .metric(Metric.Builder.create()
                .metricName("UnauthorizedAPICalls")
                .namespace("Security/WebApp")
                .statistic("Sum")
                .build())
            .threshold(1.0)
            .evaluationPeriods(1)
            .treatMissingData(TreatMissingData.NOT_BREACHING)
            .build();
        
        // Root account usage alarm
        MetricFilter rootUsageFilter = MetricFilter.Builder.create(this, "RootUsageFilter")
            .logGroup(cloudTrailLogGroup) // Use the same log group as above
            .metricName("RootAccountUsage")
            .metricNamespace("Security/WebApp")
            .filterPattern(FilterPattern.stringValue("$.userIdentity.type", "=", "Root"))
            .metricValue("1")
            .defaultValue(0.0)
            .build();
        
        Alarm rootUsageAlarm = Alarm.Builder.create(this, "RootUsageAlarm")
            .alarmName("WebApp-RootUsage-" + environmentSuffix)
            .alarmDescription("Alert on root account usage")
            .metric(Metric.Builder.create()
                .metricName("RootAccountUsage")
                .namespace("Security/WebApp")
                .statistic("Sum")
                .build())
            .threshold(1.0)
            .evaluationPeriods(1)
            .treatMissingData(TreatMissingData.NOT_BREACHING)
            .build();
    }
    
    /**
     * Creates AWS Config rules for monitoring IAM policy changes
     */
    private void createConfigRules() {
        // Use existing AWS Config recorder and delivery channel
        // The account already has both a configuration recorder and delivery channel (limit of 1 each)
        // Instead, we'll just create rules that use the existing recorder and delivery channel
        
        // We don't need to create a delivery channel - we'll use the existing one
        // Comment out the delivery channel creation to avoid MaxNumberOfDeliveryChannelsExceededException
        /*
        CfnDeliveryChannel deliveryChannel = CfnDeliveryChannel.Builder.create(this, "ConfigDeliveryChannel")
            .name("WebAppConfigDelivery-" + environmentSuffix)
            .s3BucketName("secure-webapp-logs-" + environmentSuffix + "-" + this.getAccount())
            .s3KeyPrefix("aws-config")  // Removed trailing slash
            .build();
        */
        
        // Config rule for IAM policy changes
        CfnConfigRule iamPolicyRule = CfnConfigRule.Builder.create(this, "IAMPolicyChangesRule")
            .configRuleName("iam-policy-no-statements-with-admin-access-" + environmentSuffix)
            .source(CfnConfigRule.SourceProperty.builder()
                .owner("AWS")
                .sourceIdentifier("IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS")
                .build())
            .build();
        
        // Config rule for root access key check
        CfnConfigRule rootAccessKeyRule = CfnConfigRule.Builder.create(this, "RootAccessKeyRule")
            .configRuleName("root-access-key-check-" + environmentSuffix)
            .source(CfnConfigRule.SourceProperty.builder()
                .owner("AWS")
                .sourceIdentifier("IAM_ROOT_ACCESS_KEY_CHECK") // Fixed the source identifier
                .build())
            .build();
        
        // We no longer have a recorder or delivery channel to depend on
        // No need to add dependencies
    }
    
    /**
     * Creates secure DynamoDB table referenced by IAM role
     */
    private Table createSecureDynamoTable() {
        return Table.Builder.create(this, "WebAppTable")
            .tableName("WebAppTable-" + environmentSuffix)
            .partitionKey(Attribute.builder()
                .name("id")
                .type(AttributeType.STRING)
                .build())
            .encryption(TableEncryption.AWS_MANAGED)
            .pointInTimeRecovery(true)
            .removalPolicy(RemovalPolicy.DESTROY)  // For development; use RETAIN for production
            .billingMode(BillingMode.PAY_PER_REQUEST)
            .build();
    }

    /**
     * Creates security groups that only allow access from specific office IP ranges
     */
    private SecurityGroup createRestrictedSecurityGroups(Vpc vpc) {
        SecurityGroup webAppSG = SecurityGroup.Builder.create(this, "WebAppSecurityGroup")
            .securityGroupName("WebApp-SG-" + environmentSuffix)
            .description("Security group for web application with IP restrictions")
            .vpc(vpc)
            .allowAllOutbound(false)
            .build();
        
        // Add inbound rules for specific office IP ranges (example IPs - replace with actual)
        webAppSG.addIngressRule(
            Peer.ipv4("203.0.113.0/24"),  // Replace with actual office IP range
            Port.tcp(443),
            "HTTPS access from office network"
        );
        
        webAppSG.addIngressRule(
            Peer.ipv4("198.51.100.0/24"),  // Replace with actual office IP range
            Port.tcp(80),
            "HTTP access from office network"
        );
        
        // Outbound rules for secure internet access
        webAppSG.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(443),
            "HTTPS outbound for API calls"
        );
        
        webAppSG.addEgressRule(
            Peer.anyIpv4(),
            Port.tcp(80),
            "HTTP outbound for package downloads"
        );
        
        return webAppSG;
    }
}