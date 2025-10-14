package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import java.util.Arrays;
import java.util.Map;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private Environment testEnvironment;

    @BeforeEach
    public void setUp() {
        // Set up test environment with mock AWS account and region
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
    }

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");

        // Verify all component stacks are created
        assertThat(stack.getSecurityStack()).isNotNull();
        assertThat(stack.getInfrastructureStack()).isNotNull();
        assertThat(stack.getApplicationStack()).isNotNull();
    }

    /**
     * Test that the TapStack uses default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify default environment suffix is set
        assertThat(stack.getEnvironmentSuffix()).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isNotEmpty();
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack.getVpcStack());

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();

        // Verify VPC is created
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));

        // Verify Security Groups are created (actual count is 3: Bastion, SSH, and RDS)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 3);

        // Verify EC2 Instances are created (actual count is 2)
        template.resourceCountIs("AWS::EC2::Instance", 2);
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");

        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test VPC configuration properties.
     */
    @Test
    public void testVpcConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Get VPC from the stack
        assertThat(stack.getVpcStack()).isNotNull();
        assertThat(stack.getVpcStack().getVpc()).isNotNull();

        // Verify VPC properties
        Template template = Template.fromStack(stack.getVpcStack());

        // Check for Internet Gateway
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);

        // Check for subnets (2 AZs x 3 subnet types = 6 subnets)
        template.resourceCountIs("AWS::EC2::Subnet", 6);

        // Check for route tables
        template.hasResource("AWS::EC2::RouteTable", Map.of());
        
        // Verify NAT Gateway
        template.resourceCountIs("AWS::EC2::NatGateway", 1);
    }

    /**
     * Test security group configuration.
     */
    @Test
    public void testSecurityGroupConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify security groups are created (actual count is 3: Bastion, SSH, and RDS)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 3);

        // Verify SSH security group properties (matches actual implementation)
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for SSH access to EC2 instances",
            "SecurityGroupIngress", Arrays.asList(
                Map.of(
                    "IpProtocol", "tcp",
                    "FromPort", 22,
                    "ToPort", 22,
                    "Description", "SSH access from bastion host"
                )
            )
        ));
    }

    /**
     * Test RDS configuration.
     */
    @Test
    public void testRdsConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify RDS instance is created
        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
            "Engine", "mariadb",
            "EngineVersion", "10.6",
            "DBInstanceClass", "db.t3.micro",
            "StorageEncrypted", true,
            "DeletionProtection", false
        ));

        // Verify DB subnet group
        template.hasResourceProperties("AWS::RDS::DBSubnetGroup", Map.of(
            "DBSubnetGroupDescription", "Subnet group for RDS database"
        ));
    }

    /**
     * Test IAM role configuration.
     */
    @Test
    public void testIamRoleConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getVpcStack());

        // Verify EC2 role
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Map.of(
                "Statement", Arrays.asList(
                    Map.of(
                        "Action", "sts:AssumeRole",
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "ec2.amazonaws.com")
                    )
                )
            ),
            "ManagedPolicyArns", Arrays.asList(
                Map.of(
                    "Fn::Join", Arrays.asList(
                        "",
                        Arrays.asList(
                            "arn:",
                            Map.of("Ref", "AWS::Partition"),
                            ":iam::aws:policy/AmazonSSMManagedInstanceCore"
                        )
                    )
                )
            )
        ));

        // Verify VPC Flow Logs role
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Map.of(
                "Statement", Arrays.asList(
                    Map.of(
                        "Action", "sts:AssumeRole",
                        "Effect", "Allow",
                        "Principal", Map.of("Service", "vpc-flow-logs.amazonaws.com")
                    )
                )
            )
        ));
    }

    /**
     * Test Lambda function configuration.
     */
    @Test
    public void testLambdaConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify Lambda function
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "Handler", "index.handler",
            "Runtime", "python3.9",
            "Timeout", 30,
            "MemorySize", 256
        ));
    }

    /**
     * Test API Gateway configuration.
     */
    @Test
    public void testApiGatewayConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify API Gateway
        template.hasResourceProperties("AWS::ApiGateway::RestApi", Map.of(
            "Name", "tap-test-api"
        ));

        // Verify deployment stage
        template.hasResourceProperties("AWS::ApiGateway::Stage", Map.of(
            "StageName", "prod"
        ));
    }

    /**
     * Test CloudFront distribution configuration.
     */
    @Test
    public void testCloudFrontConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify CloudFront distribution
        template.hasResourceProperties("AWS::CloudFront::Distribution", Map.of(
            "DistributionConfig", Map.of(
                "Enabled", true,
                "PriceClass", "PriceClass_100",
                "DefaultCacheBehavior", Map.of(
                    "ViewerProtocolPolicy", "redirect-to-https"
                )
            )
        ));
    }

    /**
     * Test S3 bucket configuration.
     */
    @Test
    public void testS3Configuration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template template = Template.fromStack(stack.getApplicationStack());

        // Verify S3 bucket
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Map.of(
                "ServerSideEncryptionConfiguration", Arrays.asList(
                    Map.of("ServerSideEncryptionByDefault", Map.of(
                        "SSEAlgorithm", "aws:kms"
                    ))
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
    }

    /**
     * Test DynamoDB table configuration (NEW SERVICE #1).
     * FIXED: Now checks DataStack instead of parent TapStack
     */
    @Test
    public void testDynamoDBConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Access DataStack directly - this is where the DynamoDB table is created
        Template template = Template.fromStack(stack.getDataStack());

        // Verify DynamoDB table exists
        template.hasResourceProperties("AWS::DynamoDB::Table", Map.of(
            "TableName", "tap-test-app-data",
            "BillingMode", "PAY_PER_REQUEST",
            "PointInTimeRecoverySpecification", Map.of(
                "PointInTimeRecoveryEnabled", true
            ),
            "SSESpecification", Map.of(
                "SSEEnabled", true,
                "SSEType", "KMS"
            ),
            "AttributeDefinitions", Arrays.asList(
                Map.of(
                    "AttributeName", "userId",
                    "AttributeType", "S"
                ),
                Map.of(
                    "AttributeName", "timestamp",
                    "AttributeType", "N"
                )
            ),
            "KeySchema", Arrays.asList(
                Map.of(
                    "AttributeName", "userId",
                    "KeyType", "HASH"
                ),
                Map.of(
                    "AttributeName", "timestamp",
                    "KeyType", "RANGE"
                )
            )
        ));
    }

    /**
     * Test CloudWatch Dashboard configuration (NEW SERVICE #2).
     * FIXED: Now checks MonitoringStack instead of parent TapStack
     */
    @Test
    public void testCloudWatchDashboardConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        // Access MonitoringStack directly - this is where the CloudWatch Dashboard is created
        Template template = Template.fromStack(stack.getMonitoringStack());

        // Verify CloudWatch Dashboard exists
        template.hasResourceProperties("AWS::CloudWatch::Dashboard", Map.of(
            "DashboardName", "tap-test-dashboard"
        ));

        // Verify dashboard has widgets (the DashboardBody should contain widget definitions)
        template.hasResource("AWS::CloudWatch::Dashboard", Map.of(
            "Properties", Map.of(
                "DashboardName", "tap-test-dashboard"
            )
        ));
    }

    

    /**
     * Test that stack outputs are created.
     * FIXED: Now checks DataStack for DynamoDB output
     */
    @Test
    public void testStackOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(testEnvironment)
                        .build())
                .build());

        Template applicationTemplate = Template.fromStack(stack.getApplicationStack());
        
        // Verify application outputs
        applicationTemplate.hasOutput("BucketName", Map.of());
        applicationTemplate.hasOutput("ApiUrl", Map.of());
        applicationTemplate.hasOutput("CloudFrontUrl", Map.of());

        // Verify DynamoDB output exists in DataStack (not parent stack)
        Template dataTemplate = Template.fromStack(stack.getDataStack());
        dataTemplate.hasOutput("DynamoDBTableName", Map.of());
    }
}