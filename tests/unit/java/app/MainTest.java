package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Map;
import java.util.List;

/**
 * Unit tests for the Main CDK application.
 * 
 * These tests verify the basic structure and configuration of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    private App app;

    @BeforeEach
    public void setup() {
        app = new App();
    }

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that VPC is created with correct CIDR and configuration.
     */
    @Test
    public void testVpcCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC exists with correct CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                "CidrBlock", "10.24.0.0/16"
        ));

        // Verify NAT Gateways (2 for high availability)
        template.resourceCountIs("AWS::EC2::NatGateway", 2);

        assertThat(stack.getVpc()).isNotNull();
    }

    /**
     * Test that DynamoDB table is created with correct configuration.
     */
    @Test
    public void testDynamoDbTableCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DynamoDB table with partition and sort keys
        template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "TableName", "TicketInventory-test",
                "BillingMode", "PAY_PER_REQUEST",
                "PointInTimeRecoverySpecification", Map.of("PointInTimeRecoveryEnabled", true),
                "StreamSpecification", Map.of(
                        "StreamViewType", "NEW_AND_OLD_IMAGES"
                )
        )));

        // Verify GSI exists
        template.hasResourceProperties("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "GlobalSecondaryIndexes", Match.arrayWith(List.of(Match.objectLike(Map.of(
                        "IndexName", "statusIndex"
                ))))
        )));

        assertThat(stack.getTicketInventoryTable()).isNotNull();
    }

    /**
     * Test that Aurora Serverless v2 cluster is created.
     */
    @Test
    public void testAuroraClusterCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Aurora cluster
        template.hasResourceProperties("AWS::RDS::DBCluster", Match.objectLike(Map.of(
                "Engine", "aurora-postgresql",
                "DatabaseName", "ticketdb",
                "ServerlessV2ScalingConfiguration", Map.of(
                        "MinCapacity", 0.5,
                        "MaxCapacity", 2.0
                )
        )));

        // Verify database secret (should not use "admin" username)
        template.hasResourceProperties("AWS::SecretsManager::Secret", Match.objectLike(Map.of(
                "GenerateSecretString", Match.objectLike(Map.of(
                        "SecretStringTemplate", Match.stringLikeRegexp(".*dbadmin.*")
                ))
        )));

        assertThat(stack.getAuroraCluster()).isNotNull();
    }

    /**
     * Test that S3 bucket is created with encryption and lifecycle rules.
     */
    @Test
    public void testS3BucketCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket with encryption
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
                "VersioningConfiguration", Map.of("Status", "Enabled"),
                "BucketEncryption", Match.objectLike(Map.of(
                        "ServerSideEncryptionConfiguration", Match.anyValue()
                )),
                "LifecycleConfiguration", Match.objectLike(Map.of(
                        "Rules", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "ExpirationInDays", 90
                        ))))
                ))
        )));

        assertThat(stack.getQrCodeBucket()).isNotNull();
    }

    /**
     * Test that QR Code Generator Lambda function is created.
     */
    @Test
    public void testQrCodeGeneratorLambdaCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "QRCodeGenerator-test",
                "Runtime", "python3.11",
                "Handler", "index.lambda_handler",
                "MemorySize", 512,
                "Timeout", 30
        )));

        // Verify Lambda has DynamoDB stream event source mapping
        template.hasResourceProperties("AWS::Lambda::EventSourceMapping", Match.objectLike(Map.of(
                "StartingPosition", "LATEST",
                "BatchSize", 10
        )));

        assertThat(stack.getQrCodeGeneratorFunction()).isNotNull();
    }

    /**
     * Test that Validation Lambda function is created.
     */
    @Test
    public void testValidationLambdaCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify validation Lambda function
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "TicketValidator-test",
                "Runtime", "python3.11",
                "Handler", "index.lambda_handler",
                "MemorySize", 256,
                "Timeout", 10
        )));
    }

    /**
     * Test that API Gateway is created with correct configuration.
     */
    @Test
    public void testApiGatewayCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify API Gateway REST API
        template.hasResourceProperties("AWS::ApiGateway::RestApi", Match.objectLike(Map.of(
                "Name", "TicketValidationAPI-test"
        )));

        // Verify API Gateway deployment
        template.resourceCountIs("AWS::ApiGateway::Deployment", 1);

        // Verify API Gateway stage
        template.hasResourceProperties("AWS::ApiGateway::Stage", Match.objectLike(Map.of(
                "StageName", "prod"
        )));

        // Verify API Key
        template.hasResourceProperties("AWS::ApiGateway::ApiKey", Match.objectLike(Map.of(
                "Name", "TicketValidationKey-test",
                "Enabled", true
        )));

        // Verify Usage Plan
        template.hasResourceProperties("AWS::ApiGateway::UsagePlan", Match.objectLike(Map.of(
                "UsagePlanName", "TicketValidationPlan-test",
                "Throttle", Map.of(
                        "RateLimit", 100,
                        "BurstLimit", 200
                )
        )));

        assertThat(stack.getValidationApi()).isNotNull();
    }

    /**
     * Test that Cognito User Pool is created with correct settings.
     */
    @Test
    public void testCognitoUserPoolCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Cognito User Pool
        template.hasResourceProperties("AWS::Cognito::UserPool", Match.objectLike(Map.of(
                "UserPoolName", "TicketSystemUsers-test",
                "AutoVerifiedAttributes", List.of("email"),
                "MfaConfiguration", "OPTIONAL",
                "Policies", Match.objectLike(Map.of(
                        "PasswordPolicy", Match.objectLike(Map.of(
                                "MinimumLength", 8,
                                "RequireLowercase", true,
                                "RequireUppercase", true,
                                "RequireNumbers", true,
                                "RequireSymbols", true
                        ))
                ))
        )));

        // Verify User Pool Client
        template.hasResourceProperties("AWS::Cognito::UserPoolClient", Match.objectLike(Map.of(
                "ClientName", "WebAppClient-test",
                "GenerateSecret", false
        )));

        assertThat(stack.getUserPool()).isNotNull();
    }

    /**
     * Test that ECS Fargate service is created.
     */
    @Test
    public void testEcsFargateServiceCreation() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify ECS Cluster
        template.resourceCountIs("AWS::ECS::Cluster", 1);

        // Verify ECS Task Definition
        template.hasResourceProperties("AWS::ECS::TaskDefinition", Match.objectLike(Map.of(
                "Cpu", "512",
                "Memory", "1024",
                "NetworkMode", "awsvpc",
                "RequiresCompatibilities", List.of("FARGATE")
        )));

        // Verify ECS Service
        template.hasResourceProperties("AWS::ECS::Service", Match.objectLike(Map.of(
                "DesiredCount", 2,
                "LaunchType", "FARGATE"
        )));

        // Verify Application Load Balancer
        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);

        // Verify Auto Scaling Target
        template.hasResourceProperties("AWS::ApplicationAutoScaling::ScalableTarget", Match.objectLike(Map.of(
                "MinCapacity", 2,
                "MaxCapacity", 10
        )));

        // Verify CPU scaling policy
        template.hasResourceProperties("AWS::ApplicationAutoScaling::ScalingPolicy", Match.objectLike(Map.of(
                "PolicyType", "TargetTrackingScaling",
                "TargetTrackingScalingPolicyConfiguration", Match.objectLike(Map.of(
                        "TargetValue", 70
                ))
        )));
    }

    /**
     * Test that SES Configuration Set is created.
     */
    @Test
    public void testSesConfigurationSet() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SES Configuration Set
        template.hasResourceProperties("AWS::SES::ConfigurationSet", Match.objectLike(Map.of(
                "Name", "ticketing-emails-test"
        )));
    }
    /**
     * Test IAM roles are created with correct permissions.
     */
    @Test
    public void testIamRoles() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda execution roles
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "Principal", Map.of("Service", "lambda.amazonaws.com")
                        ))))
                ))
        )));

        // Verify ECS task role
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "Principal", Map.of("Service", "ecs-tasks.amazonaws.com")
                        ))))
                ))
        )));

        // Verify API Gateway CloudWatch role
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
                "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(List.of(Match.objectLike(Map.of(
                                "Principal", Map.of("Service", "apigateway.amazonaws.com")
                        ))))
                ))
        )));
    }

    /**
     * Test security groups are created for all services.
     */
    @Test
    public void testSecurityGroups() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Count security groups (Aurora, Lambda, Validation Lambda, ECS)
        template.resourceCountIs("AWS::EC2::SecurityGroup", 5);

        // Verify Aurora security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupDescription", "Security group for Aurora Serverless cluster"
        )));

        // Verify Lambda security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupDescription", "Security group for Lambda functions"
        )));

        // Verify ECS security group
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Match.objectLike(Map.of(
                "GroupDescription", "Security group for ECS tasks"
        )));
    }

    /**
     * Test TapStackProps builder pattern.
     */
    @Test
    public void testTapStackPropsBuilder() {
        StackProps stackProps = StackProps.builder()
                .env(Environment.builder()
                        .account("123456789012")
                        .region("us-west-2")
                        .build())
                .build();

        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .stackProps(stackProps)
                .build();

        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isEqualTo(stackProps);
    }

    /**
     * Test TapStack with null props.
     */
    @Test
    public void testStackWithNullProps() {
        TapStack stack = new TapStack(app, "TestStack", null);

        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test all getters return non-null values.
     */
    @Test
    public void testAllGetters() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        assertThat(stack.getEnvironmentSuffix()).isNotNull();
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getTicketInventoryTable()).isNotNull();
        assertThat(stack.getAuroraCluster()).isNotNull();
        assertThat(stack.getQrCodeBucket()).isNotNull();
        assertThat(stack.getQrCodeGeneratorFunction()).isNotNull();
        assertThat(stack.getValidationApi()).isNotNull();
        assertThat(stack.getUserPool()).isNotNull();
    }

    /**
     * Test that removal policies are set for cleanup.
     */
    @Test
    public void testRemovalPolicies() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify DynamoDB has deletion policy
        template.hasResource("AWS::DynamoDB::Table", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete"
        )));

        // Verify S3 bucket has deletion policy and auto-delete
        template.hasResource("AWS::S3::Bucket", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete"
        )));

        // Verify Aurora cluster has deletion policy
        template.hasResource("AWS::RDS::DBCluster", Match.objectLike(Map.of(
                "DeletionPolicy", "Delete"
        )));
    }

    /**
     * Test environment variables are set correctly for Lambda functions.
     */
    @Test
    public void testLambdaEnvironmentVariables() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify QR Generator Lambda has required environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "QRCodeGenerator-test",
                "Environment", Match.objectLike(Map.of(
                        "Variables", Match.objectLike(Map.of(
                                "S3_BUCKET_NAME", Match.anyValue(),
                                "DYNAMODB_TABLE", Match.anyValue(),
                                "SENDER_EMAIL", "tickets@yourdomain.com"
                        ))
                ))
        )));

        // Verify Validation Lambda has required environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
                "FunctionName", "TicketValidator-test",
                "Environment", Match.objectLike(Map.of(
                        "Variables", Match.objectLike(Map.of(
                                "DYNAMODB_TABLE", Match.anyValue()
                        ))
                ))
        )));
    }

    /**
     * Test that resources are created in private subnets where appropriate.
     */
    @Test
    public void testPrivateSubnetPlacement() {
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify subnets are created
        template.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private

        // Verify private subnets have route tables
        template.resourceCountIs("AWS::EC2::RouteTable", 4); // 2 public + 2 private
    }

    /**
     * Integration test: Verify complete stack can be synthesized.
     */
    @Test
    public void testCompleteStackSynthesis() {
        App testApp = new App();
        
        TapStack stack = new TapStack(testApp, "TapStacktest", TapStackProps.builder()
                .environmentSuffix("test")
                .stackProps(StackProps.builder()
                        .env(Environment.builder()
                                .account("123456789012")
                                .region("us-west-2")
                                .build())
                        .build())
                .build());

        Template template = Template.fromStack(stack);

        // Verify major resource types exist
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::DynamoDB::Table", 1);
        template.resourceCountIs("AWS::RDS::DBCluster", 1);
        template.resourceCountIs("AWS::S3::Bucket", 1);
        template.resourceCountIs("AWS::Lambda::Function", 3);
        template.resourceCountIs("AWS::ApiGateway::RestApi", 1);
        template.resourceCountIs("AWS::Cognito::UserPool", 1);
        template.resourceCountIs("AWS::ECS::Service", 1);
        template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);

        assertThat(template).isNotNull();
    }
}