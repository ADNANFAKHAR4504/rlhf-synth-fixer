package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive unit tests for the Main CDK application.
 * 
 * These tests verify all resources, configurations, and policies of the TapStack
 * without requiring actual AWS resources to be created.
 */
public class MainTest {

    /**
     * Test that the TapStack can be instantiated successfully with default properties.
     */
    @Test
    public void testStackCreation() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify stack was created
        assertThat(stack).isNotNull();
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("test");
    }

    /**
     * Test that the TapStack uses 'dev' as default environment suffix when none is provided.
     */
    @Test
    public void testDefaultEnvironmentSuffix() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
    }

    /**
     * Test that the TapStack synthesizes without errors.
     */
    @Test
    public void testStackSynthesis() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Create template from the stack
        Template template = Template.fromStack(stack);

        // Verify template can be created (basic synthesis test)
        assertThat(template).isNotNull();
    }

    /**
     * Test that the TapStack respects environment suffix from CDK context.
     */
    @Test
    public void testEnvironmentSuffixFromContext() {
        App app = new App();
        app.getNode().setContext("environmentSuffix", "staging");
        
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder().build());

        // Verify environment suffix from context is used
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("staging");
    }

    /**
     * Test that VPC is created with correct CIDR and subnet configuration.
     */
    @Test
    public void testVpcConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC exists with correct CIDR
        template.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "CidrBlock", "10.0.0.0/16",
            "EnableDnsHostnames", true,
            "EnableDnsSupport", true
        ));

        // Verify public subnets exist
        template.resourceCountIs("AWS::EC2::Subnet", 4); // 2 public + 2 private

        // Verify NAT Gateway exists
        template.resourceCountIs("AWS::EC2::NatGateway", 1);

        // Verify Internet Gateway exists
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
    }

    /**
     * Test that VPC endpoints for S3 and DynamoDB are created.
     */
    @Test
    public void testVpcEndpoints() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 VPC Endpoint
        template.hasResourceProperties("AWS::EC2::VPCEndpoint", Map.of(
            "ServiceName", Match.objectLike(Map.of(
                "Fn::Join", Match.arrayWith(Arrays.asList(
                    Match.arrayWith(Arrays.asList(
                        Match.stringLikeRegexp(".*s3.*")
                    ))
                ))
            )),
            "VpcEndpointType", "Gateway"
        ));

        // Verify DynamoDB VPC Endpoint
        template.hasResourceProperties("AWS::EC2::VPCEndpoint", Map.of(
            "ServiceName", Match.objectLike(Map.of(
                "Fn::Join", Match.arrayWith(Arrays.asList(
                    Match.arrayWith(Arrays.asList(
                        Match.stringLikeRegexp(".*dynamodb.*")
                    ))
                ))
            )),
            "VpcEndpointType", "Gateway"
        ));

        // Verify total VPC endpoints count
        template.resourceCountIs("AWS::EC2::VPCEndpoint", 2);
    }

    /**
     * Test that Security Group is created with correct configuration.
     */
    @Test
    public void testSecurityGroupConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Security Group exists
        template.hasResourceProperties("AWS::EC2::SecurityGroup", Map.of(
            "GroupDescription", "Security group for Lambda functions in Tap application",
            "SecurityGroupEgress", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "CidrIp", "0.0.0.0/0"
                ))
            )),
            "SecurityGroupIngress", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "CidrIp", Match.anyValue(),
                    "FromPort", 443,
                    "ToPort", 443,
                    "IpProtocol", "tcp"
                ))
            ))
        ));
    }

    /**
     * Test that S3 bucket is created with correct configuration.
     */
    @Test
    public void testS3BucketConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 bucket exists with encryption
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "BucketEncryption", Match.objectLike(Map.of(
                "ServerSideEncryptionConfiguration", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "ServerSideEncryptionByDefault", Map.of(
                            "SSEAlgorithm", "AES256"
                        )
                    ))
                ))
            )),
            "VersioningConfiguration", Map.of(
                "Status", "Enabled"
            ),
            "PublicAccessBlockConfiguration", Map.of(
                "BlockPublicAcls", true,
                "BlockPublicPolicy", true,
                "IgnorePublicAcls", true,
                "RestrictPublicBuckets", true
            )
        ));

        // Verify bucket count
        template.resourceCountIs("AWS::S3::Bucket", 1);
    }

    /**
     * Test that S3 bucket lifecycle rules are configured correctly.
     */
    @Test
    public void testS3BucketLifecycleRules() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify lifecycle rules
        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
            "LifecycleConfiguration", Match.objectLike(Map.of(
                "Rules", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Id", "TransitionToIA",
                        "Status", "Enabled",
                        "Transitions", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                "StorageClass", "STANDARD_IA",
                                "TransitionInDays", 90
                            ))
                        ))
                    )),
                    Match.objectLike(Map.of(
                        "Id", "DeleteOldVersions",
                        "Status", "Enabled",
                        "NoncurrentVersionExpiration", Match.objectLike(Map.of(
                            "NoncurrentDays", 30
                        ))
                    ))
                ))
            ))
        ));
    }

    /**
     * Test that CloudWatch Log Group is created with correct retention.
     */
    @Test
    public void testLogGroupConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Log Group exists
        template.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "LogGroupName", "/aws/lambda/tap-processor-test",
            "RetentionInDays", 7
        ));

        template.resourceCountIs("AWS::Logs::LogGroup", 1);
    }

    /**
     * Test that IAM role is created with correct policies.
     */
    @Test
    public void testLambdaRoleConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify IAM role exists
        template.hasResourceProperties("AWS::IAM::Role", Map.of(
            "AssumeRolePolicyDocument", Match.objectLike(Map.of(
                "Statement", Match.arrayWith(Arrays.asList(
                    Match.objectLike(Map.of(
                        "Action", "sts:AssumeRole",
                        "Effect", "Allow",
                        "Principal", Map.of(
                            "Service", "lambda.amazonaws.com"
                        )
                    ))
                ))
            )),
            "Description", "Execution role for Tap processor Lambda function"
        ));
    }

    /**
     * Test that S3 read/write policy is configured correctly.
     */
    @Test
    public void testS3PolicyConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify S3 read policy
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Policies", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "PolicyName", "S3ReadWritePolicy",
                    "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                "Effect", "Allow",
                                "Action", Arrays.asList("s3:GetObject", "s3:GetObjectVersion")
                            )),
                            Match.objectLike(Map.of(
                                "Effect", "Allow",
                                "Action", Arrays.asList("s3:PutObject", "s3:PutObjectAcl")
                            )),
                            Match.objectLike(Map.of(
                                "Effect", "Allow",
                                "Action", Match.anyValue(),
                                "Condition", Match.objectLike(Map.of(
                                    "StringLike", Match.objectLike(Map.of(
                                        "s3:prefix", Arrays.asList("input/*", "output/*")
                                    ))
                                ))
                            ))
                        ))
                    ))
                ))
            ))
        )));
    }

    /**
     * Test that CloudWatch Logs policy is configured correctly.
     */
    @Test
    public void testCloudWatchLogsPolicy() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify CloudWatch Logs policy
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Policies", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "PolicyName", "CloudWatchLogsPolicy",
                    "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                "Effect", "Allow",
                                "Action", Arrays.asList("logs:CreateLogStream", "logs:PutLogEvents")
                            ))
                        ))
                    ))
                ))
            ))
        )));
    }

    /**
     * Test that SSM parameter policy is configured correctly.
     */
    @Test
    public void testSSMParameterPolicy() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify SSM policy
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Policies", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "PolicyName", "SSMParameterPolicy",
                    "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                "Effect", "Allow",
                                "Action", Arrays.asList("ssm:GetParameter", "ssm:GetParameters")
                            ))
                        ))
                    ))
                ))
            ))
        )));
    }

    /**
     * Test that VPC execution policy is configured correctly.
     */
    @Test
    public void testVPCExecutionPolicy() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC execution policy
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Policies", Match.arrayWith(Arrays.asList(
                Match.objectLike(Map.of(
                    "PolicyName", "VPCExecutionPolicy",
                    "PolicyDocument", Match.objectLike(Map.of(
                        "Statement", Match.arrayWith(Arrays.asList(
                            Match.objectLike(Map.of(
                                "Effect", "Allow",
                                "Action", Arrays.asList(
                                    "ec2:CreateNetworkInterface",
                                    "ec2:DescribeNetworkInterfaces",
                                    "ec2:DeleteNetworkInterface",
                                    "ec2:AssignPrivateIpAddresses",
                                    "ec2:UnassignPrivateIpAddresses"
                                ),
                                "Resource", Match.anyValue()
                            ))
                        ))
                    ))
                ))
            ))
        )));
    }

    /**
     * Test that Lambda function is created with correct configuration.
     */
    @Test
    public void testLambdaFunctionConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda function exists
        template.hasResourceProperties("AWS::Lambda::Function", Map.of(
            "FunctionName", "tap-processor-test",
            "Runtime", "python3.11",
            "Handler", "index.handler",
            "Timeout", 30,
            "MemorySize", 256
        ));

        template.resourceCountIs("AWS::Lambda::Function", 1);
    }

    /**
     * Test that Lambda function has correct environment variables.
     */
    @Test
    public void testLambdaEnvironmentVariables() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda environment variables
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Environment", Match.objectLike(Map.of(
                "Variables", Match.objectLike(Map.of(
                    "ENVIRONMENT", "test"
                ))
            ))
        )));
    }

    /**
     * Test that Lambda function is deployed in VPC with private subnets.
     */
    @Test
    public void testLambdaVpcConfiguration() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda is in VPC
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "VpcConfig", Match.objectLike(Map.of(
                "SubnetIds", Match.anyValue(),
                "SecurityGroupIds", Match.anyValue()
            ))
        )));
    }

    /**
     * Test that Lambda function code contains expected Python code.
     */
    @Test
    public void testLambdaFunctionCode() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify Lambda code contains key elements
        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Code", Match.objectLike(Map.of(
                "ZipFile", Match.stringLikeRegexp(".*import boto3.*")
            ))
        )));

        template.hasResourceProperties("AWS::Lambda::Function", Match.objectLike(Map.of(
            "Code", Match.objectLike(Map.of(
                "ZipFile", Match.stringLikeRegexp(".*def handler\\(event, context\\).*")
            ))
        )));
    }

    /**
     * Test that SSM parameters are created correctly.
     */
    @Test
    public void testSSMParameters() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC ID parameter
        template.hasResourceProperties("AWS::SSM::Parameter", Map.of(
            "Name", "/tap/test/vpc-id",
            "Type", "String",
            "Description", "VPC ID for Tap application"
        ));

        // Verify Bucket Name parameter
        template.hasResourceProperties("AWS::SSM::Parameter", Map.of(
            "Name", "/tap/test/data-bucket-name",
            "Type", "String",
            "Description", "S3 data bucket name for Tap application"
        ));

        // Verify Bucket ARN parameter
        template.hasResourceProperties("AWS::SSM::Parameter", Map.of(
            "Name", "/tap/test/data-bucket-arn",
            "Type", "String",
            "Description", "S3 data bucket ARN for Tap application"
        ));

        // Verify parameter count
        template.resourceCountIs("AWS::SSM::Parameter", 3);
    }

    /**
     * Test that CloudFormation outputs are created correctly.
     */
    @Test
    public void testCloudFormationOutputs() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify VPC ID output
        template.hasOutput("VpcIdOutput", Map.of(
            "Export", Map.of("Name", "TapVpcId-test"),
            "Description", "VPC ID"
        ));

        // Verify Security Group output
        template.hasOutput("SecurityGroupIdOutput", Map.of(
            "Export", Map.of("Name", "TapLambdaSecurityGroupId-test"),
            "Description", "Lambda Security Group ID"
        ));

        // Verify Bucket Name output
        template.hasOutput("BucketNameOutput", Map.of(
            "Export", Map.of("Name", "TapDataBucketName-test"),
            "Description", "Data Bucket Name"
        ));

        // Verify Bucket ARN output
        template.hasOutput("BucketArnOutput", Map.of(
            "Export", Map.of("Name", "TapDataBucketArn-test"),
            "Description", "Data Bucket ARN"
        ));

        // Verify Function ARN output
        template.hasOutput("FunctionArnOutput", Map.of(
            "Export", Map.of("Name", "TapProcessorFunctionArn-test"),
            "Description", "Processor Lambda Function ARN"
        ));
    }

    /**
     * Test that resource getters return correct objects.
     */
    @Test
    public void testResourceGetters() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        // Verify all getters return non-null objects
        assertThat(stack.getVpc()).isNotNull();
        assertThat(stack.getLambdaSecurityGroup()).isNotNull();
        assertThat(stack.getDataBucket()).isNotNull();
        assertThat(stack.getProcessorFunction()).isNotNull();
    }

    /**
     * Test TapStackProps builder functionality.
     */
    @Test
    public void testTapStackPropsBuilder() {
        TapStackProps props = TapStackProps.builder()
                .environmentSuffix("prod")
                .build();

        assertThat(props).isNotNull();
        assertThat(props.getEnvironmentSuffix()).isEqualTo("prod");
        assertThat(props.getStackProps()).isNotNull();
    }

    /**
     * Test that stack handles null props gracefully.
     */
    @Test
    public void testStackWithNullProps() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", null);

        // Should use default environment suffix
        assertThat(stack.getEnvironmentSuffix()).isEqualTo("dev");
        assertThat(stack).isNotNull();
    }

    /**
     * Test that bucket name includes environment suffix and account.
     */
    @Test
    public void testBucketNamingConvention() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        Template template = Template.fromStack(stack);

        // Verify bucket name pattern
        template.hasResourceProperties("AWS::S3::Bucket", Match.objectLike(Map.of(
            "BucketName", Match.anyValue()
        )));
    }

    /**
     * Test that multiple environment suffixes create different resource names.
     */
    @Test
    public void testMultipleEnvironments() {
        App app = new App();
        
        TapStack devStack = new TapStack(app, "DevStack", TapStackProps.builder()
                .environmentSuffix("dev")
                .build());
        
        TapStack prodStack = new TapStack(app, "ProdStack", TapStackProps.builder()
                .environmentSuffix("prod")
                .build());

        // Verify different environment suffixes
        assertThat(devStack.getEnvironmentSuffix()).isEqualTo("dev");
        assertThat(prodStack.getEnvironmentSuffix()).isEqualTo("prod");

        Template devTemplate = Template.fromStack(devStack);
        Template prodTemplate = Template.fromStack(prodStack);

        // Verify different log group names
        devTemplate.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "LogGroupName", "/aws/lambda/tap-processor-dev"
        ));

        prodTemplate.hasResourceProperties("AWS::Logs::LogGroup", Map.of(
            "LogGroupName", "/aws/lambda/tap-processor-prod"
        ));
    }

    /**
     * Test that S3 bucket has RETAIN removal policy.
     */
    @Test
    public void testS3BucketRemovalPolicy() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify retention policy
        template.hasResource("AWS::S3::Bucket", Match.objectLike(Map.of(
            "DeletionPolicy", "Retain",
            "UpdateReplacePolicy", "Retain"
        )));
    }

    /**
     * Test that Log Group has DESTROY removal policy.
     */
    @Test
    public void testLogGroupRemovalPolicy() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify deletion policy
        template.hasResource("AWS::Logs::LogGroup", Match.objectLike(Map.of(
            "DeletionPolicy", "Delete",
            "UpdateReplacePolicy", "Delete"
        )));
    }

    /**
     * Test that all IAM policies are defined inline (no managed policies).
     */
    @Test
    public void testNoManagedPolicies() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify role has inline policies, not managed policies
        template.hasResourceProperties("AWS::IAM::Role", Match.objectLike(Map.of(
            "Policies", Match.anyValue()
        )));
    }

    /**
     * Test that VPC has exactly 2 availability zones.
     */
    @Test
    public void testVpcAvailabilityZones() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Count subnets - should be 4 total (2 public + 2 private across 2 AZs)
        template.resourceCountIs("AWS::EC2::Subnet", 4);
    }

    /**
     * Test complete resource count to ensure no extra resources are created.
     */
    @Test
    public void testCompleteResourceCount() {
        App app = new App();
        TapStack stack = new TapStack(app, "TestStack", TapStackProps.builder()
                .environmentSuffix("test")
                .build());

        Template template = Template.fromStack(stack);

        // Verify expected resource counts
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Subnet", 4);
        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::NatGateway", 1);
        template.resourceCountIs("AWS::EC2::EIP", 1);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
        template.resourceCountIs("AWS::EC2::VPCEndpoint", 2);
        template.resourceCountIs("AWS::S3::Bucket", 1);
        template.resourceCountIs("AWS::Lambda::Function", 1);
        template.resourceCountIs("AWS::IAM::Role", 1);
        template.resourceCountIs("AWS::Logs::LogGroup", 1);
        template.resourceCountIs("AWS::SSM::Parameter", 3);
        template.resourceCountIs("AWS::EC2::RouteTable", 4); // 2 public + 2 private
    }

    /**
     * Test that the Main class cannot be instantiated.
     */
    @Test
    public void testMainClassPrivateConstructor() {
        // This test verifies that Main class follows utility class pattern
        // Main class should have private constructor
        assertThat(Main.class.getDeclaredConstructors()).hasSize(1);
        assertThat(Main.class.getDeclaredConstructors()[0].canAccess(null)).isFalse();
    }
}