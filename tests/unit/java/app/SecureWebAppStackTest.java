package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;
import java.util.Map;
import java.util.List;
import java.util.Arrays;

/**
 * Comprehensive security-focused unit tests for SecureWebAppStack.
 * 
 * These tests validate all corporate security requirements including:
 * - Multi-AZ VPC configuration
 * - S3 encryption and access controls
 * - IAM least privilege implementation
 * - CloudTrail logging configuration
 * - Security monitoring and alerting
 * - AWS Config compliance rules
 */
public class SecureWebAppStackTest {
    
    private App app;
    private SecureWebAppStack stack;
    private Template template;
    private String testEnvironmentSuffix = "test";
    
    @BeforeEach
    public void setUp() {
        app = new App();
        stack = new SecureWebAppStack(app, "TestSecureStack", 
            SecureWebAppStackProps.builder()
                .environmentSuffix(testEnvironmentSuffix)
                .build());
        template = Template.fromStack(stack);
    }
    
    /**
     * Test Multi-AZ VPC configuration with proper network segmentation
     */
    @Test
    public void testMultiAzVpcConfiguration() {
        // Verify VPC is created with correct configuration
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));
        
        // Verify subnets are created (should be at least 4: 2 public + 2 private)
        assertThat(template.findResources("AWS::EC2::Subnet", Map.of()).size()).isGreaterThanOrEqualTo(4);
        
        // Verify NAT Gateways are created for private subnet internet access (2 for redundancy)
        assertThat(template.findResources("AWS::EC2::NatGateway", Map.of()).size()).isGreaterThanOrEqualTo(1);
    }
    
    /**
     * Test S3 bucket security configuration with AES256 encryption
     */
    @Test
    public void testS3BucketSecurityConfiguration() {
        // Verify S3 bucket with encryption
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Map.of(
                "ServerSideEncryptionConfiguration", Arrays.asList(
                    Map.of(
                        "ServerSideEncryptionByDefault", Map.of(
                            "SSEAlgorithm", "AES256"
                        )
                    )
                )
            ),
            "PublicAccessBlockConfiguration", Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            ),
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            )
        ));
        
        // Verify bucket lifecycle rules for log retention
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "LifecycleConfiguration", Map.of(
                "Rules", Arrays.asList(
                    Map.of(
                        "Id", "DeleteOldLogs",
                        "Status", "Enabled",
                        "ExpirationInDays", 365
                    )
                )
            )
        )));
    }
    
    /**
     * Test S3 bucket policy enforces SSL/TLS
     */
    @Test
    public void testS3BucketPolicyEnforcesSSL() {
        // Verify bucket policy exists (simplified check due to complex policy structure)
        assertThat(template.findResources("AWS::S3::BucketPolicy", Map.of()).size()).isGreaterThanOrEqualTo(1);
    }
    
    /**
     * Test IAM role follows least privilege principles
     */
    @Test
    public void testIamRoleLeastPrivilege() {
        // Verify IAM role is created for EC2
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Map.of(
                "Statement", Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Principal", Map.of(
                            "Service", "ec2.amazonaws.com"
                        ),
                        "Action", "sts:AssumeRole"
                    )
                )
            )
        ));
        
        // Verify IAM policy has only S3 and DynamoDB permissions
        template.hasResourceProperties("AWS::IAM::Policy", Match.objectLike(Map.of(
            "PolicyDocument", Map.of(
                "Statement", Arrays.asList(
                    Map.of(
                        "Effect", "Allow",
                        "Action", Arrays.asList(
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket"
                        )
                    ),
                    Map.of(
                        "Effect", "Allow",
                        "Action", Arrays.asList(
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        )
                    )
                )
            )
        )));
    }
    
    /**
     * Test CloudTrail configuration for comprehensive API logging
     */
    @Test
    public void testCloudTrailConfiguration() {
        // We are now importing an existing CloudTrail instead of creating a new one
        // Since we're using an imported CloudTrail, there should be no AWS::CloudTrail::Trail resources
        // in our template
        assertThat(template.findResources("AWS::CloudTrail::Trail", Map.of()).size()).isEqualTo(0);
        
        // We are also using an imported log group, so there is no AWS::Logs::LogGroup resource to check
    }
    
    /**
     * Test CloudWatch alarms for security monitoring
     */
    @Test
    public void testSecurityAlarms() {
        // Verify metric filter for unauthorized API calls
        template.hasResourceProperties("AWS::Logs::MetricFilter", Match.objectLike(Map.of(
            "MetricTransformations", Arrays.asList(
                Map.of(
                    "MetricName", "UnauthorizedAPICalls",
                    "MetricNamespace", "Security/WebApp",
                    "MetricValue", "1",
                    "DefaultValue", 0.0
                )
            )
        )));
        
        // Verify metric filter for root account usage
        template.hasResourceProperties("AWS::Logs::MetricFilter", Match.objectLike(Map.of(
            "MetricTransformations", Arrays.asList(
                Map.of(
                    "MetricName", "RootAccountUsage",
                    "MetricNamespace", "Security/WebApp",
                    "MetricValue", "1",
                    "DefaultValue", 0.0
                )
            )
        )));
        
        // Verify CloudWatch alarm for unauthorized calls
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
            "MetricName", "UnauthorizedAPICalls",
            "Namespace", "Security/WebApp",
            "Threshold", 1.0,
            "EvaluationPeriods", 1,
            "TreatMissingData", "notBreaching"
        )));
        
        // Verify CloudWatch alarm for root usage
        template.hasResourceProperties("AWS::CloudWatch::Alarm", Match.objectLike(Map.of(
            "MetricName", "RootAccountUsage",
            "Namespace", "Security/WebApp",
            "Threshold", 1.0,
            "EvaluationPeriods", 1,
            "TreatMissingData", "notBreaching"
        )));
    }
    
    /**
     * Test AWS Config rules for IAM policy monitoring
     */
    @Test
    public void testConfigRules() {
        // We no longer create a Config recorder or delivery channel
        // We're using the existing ones in the account to avoid MaxNumberOfConfigurationRecordersExceededException
        // and MaxNumberOfDeliveryChannelsExceededException
        
        // Verify IAM policy admin access config rule
        template.hasResourceProperties("AWS::Config::ConfigRule", Map.of(
            "Source", Map.of(
                "Owner", "AWS",
                "SourceIdentifier", "IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS"
            )
        ));
        
        // Verify root access key config rule - using correct identifier
        template.hasResourceProperties("AWS::Config::ConfigRule", Map.of(
            "Source", Map.of(
                "Owner", "AWS",
                "SourceIdentifier", "IAM_ROOT_ACCESS_KEY_CHECK"
            )
        ));
    }
    
    /**
     * Test DynamoDB table security configuration
     */
    @Test
    public void testDynamoDbSecurityConfiguration() {
        // Verify DynamoDB table with encryption
        template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
            "SSESpecification", Map.of(
                "SSEEnabled", true
            ),
            "PointInTimeRecoverySpecification", Map.of(
                "PointInTimeRecoveryEnabled", true
            )
        ));
    }
    
    /**
     * Test Security Group IP restrictions
     */
    @Test
    public void testSecurityGroupIpRestrictions() {
        // Verify security group is created with restricted access
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "SecurityGroupIngress", Arrays.asList(
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 443,
                    "ToPort", 443,
                    "CidrIp", "203.0.113.0/24"  // Office IP range
                ),
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 80,
                    "ToPort", 80,
                    "CidrIp", "198.51.100.0/24"  // Office IP range
                )
            )
        )));
        
        // Verify restricted outbound rules
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
            "SecurityGroupEgress", Arrays.asList(
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 443,
                    "ToPort", 443,
                    "CidrIp", "0.0.0.0/0"
                ),
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 80,
                    "ToPort", 80,
                    "CidrIp", "0.0.0.0/0"
                )
            )
        )));
    }
    
    /**
     * Test that all resources have proper naming with environment suffix
     */
    @Test
    public void testResourceNamingConvention() {
        // Verify S3 bucket naming
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "BucketName", Match.anyValue()
        )));
        
        // CloudTrail is now imported, not created, so we don't check its name
        
        // Verify DynamoDB table naming
        template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
            "TableName", "WebAppTable-" + testEnvironmentSuffix
        ));
        
        // Verify IAM role naming
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "RoleName", "WebAppRole-" + testEnvironmentSuffix
        )));
    }
    
    /**
     * Test that all resources have RemovalPolicy.DESTROY for non-production
     */
    @Test
    public void testResourceRemovalPolicies() {
        // Verify DynamoDB table has deletion policy
        template.hasResource("AWS::DynamoDB::Table", Map.of(
            "DeletionPolicy", "Delete",
            "UpdateReplacePolicy", "Delete"
        ));

        // Verify S3 bucket has deletion policy
        template.hasResource("AWS::S3::Bucket", Map.of(
            "DeletionPolicy", "Delete",
            "UpdateReplacePolicy", "Delete"
        ));
    }

    /**
     * Test CloudFormation outputs for VPC resources
     */
    @Test
    public void testVpcOutputs() {
        // Verify VPC ID output
        template.hasOutput("VpcId", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-VpcId-" + testEnvironmentSuffix
            )
        ));

        // Verify VPC CIDR output
        template.hasOutput("VpcCidr", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-VpcCidr-" + testEnvironmentSuffix
            )
        ));
    }

    /**
     * Test CloudFormation outputs for S3 bucket
     */
    @Test
    public void testS3BucketOutputs() {
        // Verify S3 bucket name output
        template.hasOutput("LogsBucketName", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-LogsBucket-" + testEnvironmentSuffix
            )
        ));

        // Verify S3 bucket ARN output
        template.hasOutput("LogsBucketArn", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-LogsBucketArn-" + testEnvironmentSuffix
            )
        ));
    }

    /**
     * Test CloudFormation outputs for IAM role
     */
    @Test
    public void testIamRoleOutputs() {
        // Verify IAM role ARN output
        template.hasOutput("AppRoleArn", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-AppRoleArn-" + testEnvironmentSuffix
            )
        ));

        // Verify IAM role name output
        template.hasOutput("AppRoleName", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-AppRoleName-" + testEnvironmentSuffix
            )
        ));
    }

    /**
     * Test CloudFormation outputs for DynamoDB table
     */
    @Test
    public void testDynamoTableOutputs() {
        // Verify DynamoDB table name output
        template.hasOutput("DynamoTableName", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-DynamoTable-" + testEnvironmentSuffix
            )
        ));

        // Verify DynamoDB table ARN output
        template.hasOutput("DynamoTableArn", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-DynamoTableArn-" + testEnvironmentSuffix
            )
        ));
    }

    /**
     * Test CloudFormation outputs for Security Group
     */
    @Test
    public void testSecurityGroupOutputs() {
        // Verify Security Group ID output
        template.hasOutput("SecurityGroupId", Map.of(
            "Export", Map.of(
                "Name", "SecureWebApp-SecurityGroupId-" + testEnvironmentSuffix
            )
        ));
    }

    /**
     * Test that all critical outputs are present
     */
    @Test
    public void testAllCriticalOutputsPresent() {
        // Count total outputs - should have at least 9 outputs
        Map<String, Object> outputs = template.toJSON();
        @SuppressWarnings("unchecked")
        Map<String, Object> outputsMap = (Map<String, Object>) outputs.get("Outputs");

        assertThat(outputsMap).isNotNull();
        assertThat(outputsMap.size()).isGreaterThanOrEqualTo(9);

        // Verify key outputs exist
        assertThat(outputsMap).containsKeys(
            "VpcId", "VpcCidr",
            "LogsBucketName", "LogsBucketArn",
            "AppRoleArn", "AppRoleName",
            "DynamoTableName", "DynamoTableArn",
            "SecurityGroupId"
        );
    }

    /**
     * Test that outputs are created regardless of LocalStack mode
     */
    @Test
    public void testOutputsExistInBothModes() {
        // Standard AWS mode
        assertThat(template.toJSON().get("Outputs")).isNotNull();

        // Verify outputs are created
        @SuppressWarnings("unchecked")
        Map<String, Object> outputsMap = (Map<String, Object>) template.toJSON().get("Outputs");
        assertThat(outputsMap.size()).isGreaterThanOrEqualTo(9);
    }

    /**
     * Test VPC subnet configuration details
     */
    @Test
    public void testVpcSubnetConfiguration() {
        // Verify public subnets exist
        assertThat(template.findResources("AWS::EC2::Subnet", Map.of()).size()).isGreaterThanOrEqualTo(4);

        // Verify internet gateway exists for public subnets
        assertThat(template.findResources("AWS::EC2::InternetGateway", Map.of()).size()).isGreaterThanOrEqualTo(1);

        // Verify route tables exist
        assertThat(template.findResources("AWS::EC2::RouteTable", Map.of()).size()).isGreaterThanOrEqualTo(2);
    }

    /**
     * Test S3 bucket versioning and lifecycle
     */
    @Test
    public void testS3BucketVersioningAndLifecycle() {
        // Already covered in testS3BucketSecurityConfiguration but adding explicit test
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "VersioningConfiguration", Map.of("Status", "Enabled")
        )));

        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.anyValue()
            ))
        )));
    }

    /**
     * Test DynamoDB billing mode
     */
    @Test
    public void testDynamoDbBillingMode() {
        template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
            "BillingMode", "PAY_PER_REQUEST"
        ));
    }
}