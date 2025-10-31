package app;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.cloudformation.model.StackStatus;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSecurityGroupsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsRequest;
import software.amazon.awssdk.services.ec2.model.DescribeVpcEndpointsRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.GetBucketVersioningRequest;
import software.amazon.awssdk.services.s3.model.GetBucketEncryptionRequest;
import software.amazon.awssdk.services.s3.model.GetBucketLifecycleConfigurationRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.GetFunctionRequest;
import software.amazon.awssdk.services.lambda.model.GetFunctionResponse;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.awssdk.services.ssm.model.GetParameterRequest;
import software.amazon.awssdk.services.ssm.model.GetParameterResponse;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogGroupsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogGroupsResponse;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.GetRoleRequest;
import software.amazon.awssdk.services.iam.model.GetRoleResponse;
import software.amazon.awssdk.services.iam.model.GetRolePolicyRequest;
import software.amazon.awssdk.core.SdkBytes;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

/**
 * Real-world integration tests for the Main CDK application.
 *
 * These tests verify actual AWS resources deployed by the CDK stack.
 * They require real AWS credentials and an actual deployed stack.
 *
 * Prerequisites:
 * - AWS_ACCESS_KEY_ID environment variable must be set
 * - AWS_SECRET_ACCESS_KEY environment variable must be set
 * - AWS_DEFAULT_REGION environment variable must be set (defaults to us-east-1)
 * - STACK_NAME environment variable must be set (defaults to TapStacktest)
 * - Stack must be already deployed before running these tests
 *
 * These tests are disabled by default and only run when AWS credentials are available.
 */
@EnabledIfEnvironmentVariable(named = "AWS_ACCESS_KEY_ID", matches = ".+")
@EnabledIfEnvironmentVariable(named = "AWS_SECRET_ACCESS_KEY", matches = ".+")
public class MainIntegrationTest {

    private static String awsAccessKeyId;
    private static String awsSecretAccessKey;
    private static String awsRegion;
    private static String stackName;
    private static String environmentSuffix;

    private static CloudFormationClient cfnClient;
    private static Ec2Client ec2Client;
    private static S3Client s3Client;
    private static LambdaClient lambdaClient;
    private static SsmClient ssmClient;
    private static CloudWatchLogsClient logsClient;
    private static IamClient iamClient;

    /**
     * Set up AWS clients with credentials from environment variables.
     */
    @BeforeAll
    public static void setUp() {
        // Get AWS credentials from environment variables
        awsAccessKeyId = System.getenv("AWS_ACCESS_KEY_ID");
        awsSecretAccessKey = System.getenv("AWS_SECRET_ACCESS_KEY");
        awsRegion = Optional.ofNullable(System.getenv("AWS_REGION")).orElse("us-east-1");
        environmentSuffix = Optional.ofNullable(System.getenv("ENVIRONMENT_SUFFIX")).orElse("test");
        stackName = Optional.ofNullable(System.getenv("STACK_NAME")).orElse("TapStack" + environmentSuffix);

        // Validate credentials are present
        assertThat(awsAccessKeyId).isNotNull().isNotEmpty();
        assertThat(awsSecretAccessKey).isNotNull().isNotEmpty();

        // Create AWS credentials provider
        AwsBasicCredentials credentials = AwsBasicCredentials.create(awsAccessKeyId, awsSecretAccessKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        Region region = Region.of(awsRegion);

        // Initialize AWS service clients
        cfnClient = CloudFormationClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        ec2Client = Ec2Client.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        s3Client = S3Client.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        lambdaClient = LambdaClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .overrideConfiguration(builder -> builder
                        .apiCallTimeout(java.time.Duration.ofSeconds(60))
                        .apiCallAttemptTimeout(java.time.Duration.ofSeconds(60)))
                .build();

        ssmClient = SsmClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        logsClient = CloudWatchLogsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        iamClient = IamClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
    }

    /**
     * Test that the CloudFormation stack exists and is in a healthy state.
     */
    @Test
    public void testStackExists() {
        DescribeStacksResponse response = cfnClient.describeStacks(
                DescribeStacksRequest.builder()
                        .stackName(stackName)
                        .build()
        );

        assertThat(response.stacks()).isNotEmpty();
        Stack stack = response.stacks().get(0);

        assertThat(stack.stackName()).isEqualTo(stackName);
        assertThat(stack.stackStatus()).isIn(
                StackStatus.CREATE_COMPLETE,
                StackStatus.UPDATE_COMPLETE,
                StackStatus.UPDATE_ROLLBACK_COMPLETE
        );
    }

    /**
     * Test that all expected CloudFormation outputs are present and accessible.
     */
    @Test
    public void testStackOutputsExist() {
        DescribeStacksResponse response = cfnClient.describeStacks(
                DescribeStacksRequest.builder()
                        .stackName(stackName)
                        .build()
        );

        Stack stack = response.stacks().get(0);
        Map<String, String> outputs = stack.outputs().stream()
                .collect(java.util.stream.Collectors.toMap(
                        Output::outputKey,
                        Output::outputValue
                ));

        // Verify all expected outputs exist
        assertThat(outputs).containsKeys(
                "VpcIdOutput",
                "SecurityGroupIdOutput",
                "BucketNameOutput",
                "BucketArnOutput",
                "FunctionArnOutput"
        );

        // Verify output values are not empty
        outputs.values().forEach(value -> assertThat(value).isNotEmpty());
    }

    /**
     * Test VPC configuration and verify it matches expected settings.
     */
    @Test
    public void testVpcConfiguration() {
        String vpcId = getStackOutput("VpcIdOutput");

        DescribeVpcsResponse response = ec2Client.describeVpcs(
                DescribeVpcsRequest.builder()
                        .vpcIds(vpcId)
                        .build()
        );

        assertThat(response.vpcs()).hasSize(1);
        assertThat(response.vpcs().get(0).cidrBlock()).isEqualTo("10.0.0.0/16");
        assertThat(response.vpcs().get(0).state().toString()).isEqualTo("available");
    }

    /**
     * Test that VPC has the correct number of subnets across availability zones.
     */
    @Test
    public void testVpcSubnets() {
        String vpcId = getStackOutput("VpcIdOutput");

        var response = ec2Client.describeSubnets(
                DescribeSubnetsRequest.builder()
                        .filters(software.amazon.awssdk.services.ec2.model.Filter.builder()
                                .name("vpc-id")
                                .values(vpcId)
                                .build())
                        .build()
        );

        // Should have 4 subnets (2 public + 2 private across 2 AZs)
        assertThat(response.subnets()).hasSize(4);

        // Verify subnets are in different availability zones
        long uniqueAzs = response.subnets().stream()
                .map(subnet -> subnet.availabilityZone())
                .distinct()
                .count();
        assertThat(uniqueAzs).isEqualTo(2);
    }

    /**
     * Test that VPC endpoints for S3 and DynamoDB exist.
     */
    @Test
    public void testVpcEndpoints() {
        String vpcId = getStackOutput("VpcIdOutput");

        var response = ec2Client.describeVpcEndpoints(
                DescribeVpcEndpointsRequest.builder()
                        .filters(software.amazon.awssdk.services.ec2.model.Filter.builder()
                                .name("vpc-id")
                                .values(vpcId)
                                .build())
                        .build()
        );

        assertThat(response.vpcEndpoints()).hasSizeGreaterThanOrEqualTo(2);

        // Verify S3 and DynamoDB endpoints exist
        long s3Endpoints = response.vpcEndpoints().stream()
                .filter(endpoint -> endpoint.serviceName().contains("s3"))
                .count();
        long dynamoEndpoints = response.vpcEndpoints().stream()
                .filter(endpoint -> endpoint.serviceName().contains("dynamodb"))
                .count();

        assertThat(s3Endpoints).isGreaterThanOrEqualTo(1);
        assertThat(dynamoEndpoints).isGreaterThanOrEqualTo(1);
    }

    /**
     * Test that security group exists and has correct configuration.
     */
    @Test
    public void testSecurityGroup() {
        String securityGroupId = getStackOutput("SecurityGroupIdOutput");

        var response = ec2Client.describeSecurityGroups(
                DescribeSecurityGroupsRequest.builder()
                        .groupIds(securityGroupId)
                        .build()
        );

        assertThat(response.securityGroups()).hasSize(1);
        var sg = response.securityGroups().get(0);

        assertThat(sg.groupName()).contains("LambdaSecurityGroup");
        assertThat(sg.description()).isEqualTo("Security group for Lambda functions in Tap application");

        // Verify ingress rules (HTTPS from VPC)
        assertThat(sg.ipPermissions()).isNotEmpty();
        boolean hasHttpsIngress = sg.ipPermissions().stream()
                .anyMatch(rule -> rule.fromPort() != null && rule.fromPort() == 443);
        assertThat(hasHttpsIngress).isTrue();
    }

    /**
     * Test that S3 bucket exists and has correct configuration.
     */
    @Test
    public void testS3BucketExists() {
        String bucketName = getStackOutput("BucketNameOutput");

        // Verify bucket exists
        assertThatCode(() -> s3Client.headBucket(
                HeadBucketRequest.builder()
                        .bucket(bucketName)
                        .build()
        )).doesNotThrowAnyException();
    }

    /**
     * Test that S3 bucket has versioning enabled.
     */
    @Test
    public void testS3BucketVersioning() {
        String bucketName = getStackOutput("BucketNameOutput");

        var response = s3Client.getBucketVersioning(
                GetBucketVersioningRequest.builder()
                        .bucket(bucketName)
                        .build()
        );

        assertThat(response.status().toString()).isEqualTo("Enabled");
    }

    /**
     * Test that S3 bucket has encryption enabled.
     */
    @Test
    public void testS3BucketEncryption() {
        String bucketName = getStackOutput("BucketNameOutput");

        var response = s3Client.getBucketEncryption(
                GetBucketEncryptionRequest.builder()
                        .bucket(bucketName)
                        .build()
        );

        assertThat(response.serverSideEncryptionConfiguration().rules()).isNotEmpty();
        assertThat(response.serverSideEncryptionConfiguration().rules().get(0)
                .applyServerSideEncryptionByDefault().sseAlgorithm().toString())
                .isEqualTo("AES256");
    }

    /**
     * Test that S3 bucket has lifecycle rules configured.
     */
    @Test
    public void testS3BucketLifecycleRules() {
        String bucketName = getStackOutput("BucketNameOutput");

        var response = s3Client.getBucketLifecycleConfiguration(
                GetBucketLifecycleConfigurationRequest.builder()
                        .bucket(bucketName)
                        .build()
        );

        assertThat(response.rules()).hasSizeGreaterThanOrEqualTo(2);

        // Verify TransitionToIA rule exists
        boolean hasTransitionRule = response.rules().stream()
                .anyMatch(rule -> rule.id().equals("TransitionToIA"));
        assertThat(hasTransitionRule).isTrue();

        // Verify DeleteOldVersions rule exists
        boolean hasDeleteRule = response.rules().stream()
                .anyMatch(rule -> rule.id().equals("DeleteOldVersions"));
        assertThat(hasDeleteRule).isTrue();
    }

    /**
     * Test S3 bucket write and read operations through Lambda.
     */
    @Test
    public void testS3BucketReadWriteOperations() throws IOException {
        String bucketName = getStackOutput("BucketNameOutput");
        String testKey = "input/integration-test-file.txt";
        String testContent = "Integration test content - " + System.currentTimeMillis();

        // Write test file to bucket
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build(),
                RequestBody.fromString(testContent)
        );

        // Verify file was written
        ListObjectsV2Response listResponse = s3Client.listObjectsV2(
                ListObjectsV2Request.builder()
                        .bucket(bucketName)
                        .prefix("input/")
                        .build()
        );

        assertThat(listResponse.contents()).isNotEmpty();
        boolean fileExists = listResponse.contents().stream()
                .anyMatch(obj -> obj.key().equals(testKey));
        assertThat(fileExists).isTrue();

        // Read file back
        var getResponse = s3Client.getObject(
                GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build()
        );

        String retrievedContent = new String(
                getResponse.readAllBytes(),
                StandardCharsets.UTF_8
        );
        assertThat(retrievedContent).isEqualTo(testContent);
    }

    /**
     * Test that Lambda function exists and has correct configuration.
     */
    @Test
    public void testLambdaFunctionConfiguration() {
        String functionArn = getStackOutput("FunctionArnOutput");
        String functionName = functionArn.substring(functionArn.lastIndexOf(":") + 1);

        GetFunctionResponse response = lambdaClient.getFunction(
                GetFunctionRequest.builder()
                        .functionName(functionName)
                        .build()
        );

        var config = response.configuration();
        assertThat(config.functionName()).isEqualTo("tap-processor-" + environmentSuffix);
        assertThat(config.runtime().toString()).isEqualTo("python3.11");
        assertThat(config.handler()).isEqualTo("index.handler");
        assertThat(config.timeout()).isEqualTo(30);
        assertThat(config.memorySize()).isEqualTo(256);

        // Verify environment variables
        assertThat(config.environment().variables()).containsKey("BUCKET_NAME");
        assertThat(config.environment().variables()).containsKey("ENVIRONMENT");
        assertThat(config.environment().variables().get("ENVIRONMENT")).isEqualTo(environmentSuffix);
    }

    /**
     * Test that Lambda function is deployed in VPC.
     */
    @Test
    public void testLambdaFunctionVpcConfiguration() {
        String functionArn = getStackOutput("FunctionArnOutput");
        String functionName = functionArn.substring(functionArn.lastIndexOf(":") + 1);

        GetFunctionResponse response = lambdaClient.getFunction(
                GetFunctionRequest.builder()
                        .functionName(functionName)
                        .build()
        );

        var vpcConfig = response.configuration().vpcConfig();
        assertThat(vpcConfig.vpcId()).isNotEmpty();
        assertThat(vpcConfig.subnetIds()).isNotEmpty();
        assertThat(vpcConfig.securityGroupIds()).isNotEmpty();

        // Verify VPC ID matches
        String expectedVpcId = getStackOutput("VpcIdOutput");
        assertThat(vpcConfig.vpcId()).isEqualTo(expectedVpcId);
    }

    /**
     * Test Lambda function invocation with real S3 interaction.
     */
    @Test
    @Timeout(90)
    public void testLambdaFunctionInvocation() {
        String functionArn = getStackOutput("FunctionArnOutput");
        String functionName = functionArn.substring(functionArn.lastIndexOf(":") + 1);
        String bucketName = getStackOutput("BucketNameOutput");

        // Create test files in the bucket
        String testKey1 = "input/test-file-1.txt";
        String testKey2 = "input/test-file-2.txt";

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey1)
                        .build(),
                RequestBody.fromString("Test content 1")
        );

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey2)
                        .build(),
                RequestBody.fromString("Test content 2")
        );

        // Invoke Lambda function
        InvokeResponse response = lambdaClient.invoke(
                InvokeRequest.builder()
                        .functionName(functionName)
                        .build()
        );

        // Verify successful invocation
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.functionError()).isNull();

        // Parse response payload
        String payload = response.payload().asUtf8String();
        assertThat(payload).contains("statusCode");
        assertThat(payload).contains("Successfully listed files");
        assertThat(payload).contains("input/");
    }

    /**
     * Test that SSM parameters exist and have correct values.
     */
    @Test
    public void testSSMParameters() {
        String vpcIdParam = String.format("/tap/%s/vpc-id", environmentSuffix);
        String bucketNameParam = String.format("/tap/%s/data-bucket-name", environmentSuffix);
        String bucketArnParam = String.format("/tap/%s/data-bucket-arn", environmentSuffix);

        // Test VPC ID parameter
        GetParameterResponse vpcResponse = ssmClient.getParameter(
                GetParameterRequest.builder()
                        .name(vpcIdParam)
                        .build()
        );
        assertThat(vpcResponse.parameter().value()).isNotEmpty();
        assertThat(vpcResponse.parameter().value()).isEqualTo(getStackOutput("VpcIdOutput"));

        // Test Bucket Name parameter
        GetParameterResponse bucketNameResponse = ssmClient.getParameter(
                GetParameterRequest.builder()
                        .name(bucketNameParam)
                        .build()
        );
        assertThat(bucketNameResponse.parameter().value()).isNotEmpty();
        assertThat(bucketNameResponse.parameter().value()).isEqualTo(getStackOutput("BucketNameOutput"));

        // Test Bucket ARN parameter
        GetParameterResponse bucketArnResponse = ssmClient.getParameter(
                GetParameterRequest.builder()
                        .name(bucketArnParam)
                        .build()
        );
        assertThat(bucketArnResponse.parameter().value()).isNotEmpty();
        assertThat(bucketArnResponse.parameter().value()).isEqualTo(getStackOutput("BucketArnOutput"));
    }

    /**
     * Test that CloudWatch Log Group exists and has correct retention.
     */
    @Test
    public void testCloudWatchLogGroup() {
        String logGroupName = String.format("/aws/lambda/tap-processor-%s", environmentSuffix);

        DescribeLogGroupsResponse response = logsClient.describeLogGroups(
                DescribeLogGroupsRequest.builder()
                        .logGroupNamePrefix(logGroupName)
                        .build()
        );

        assertThat(response.logGroups()).isNotEmpty();
        var logGroup = response.logGroups().stream()
                .filter(lg -> lg.logGroupName().equals(logGroupName))
                .findFirst();

        assertThat(logGroup).isPresent();
        assertThat(logGroup.get().retentionInDays()).isEqualTo(7);
    }

    /**
     * Test IAM role exists and has correct policies.
     */
    @Test
    public void testIAMRoleAndPolicies() {
        // Get role name from Lambda function
        String functionArn = getStackOutput("FunctionArnOutput");
        String functionName = functionArn.substring(functionArn.lastIndexOf(":") + 1);

        GetFunctionResponse funcResponse = lambdaClient.getFunction(
                GetFunctionRequest.builder()
                        .functionName(functionName)
                        .build()
        );

        String roleArn = funcResponse.configuration().role();
        String roleName = roleArn.substring(roleArn.lastIndexOf("/") + 1);

        // Get role details
        GetRoleResponse roleResponse = iamClient.getRole(
                GetRoleRequest.builder()
                        .roleName(roleName)
                        .build()
        );

        assertThat(roleResponse.role().roleName()).isEqualTo(roleName);
        assertThat(roleResponse.role().description())
                .isEqualTo("Execution role for Tap processor Lambda function");

        // Verify inline policies exist
        var listPoliciesResponse = iamClient.listRolePolicies(
                software.amazon.awssdk.services.iam.model.ListRolePoliciesRequest.builder()
                        .roleName(roleName)
                        .build()
        );

        assertThat(listPoliciesResponse.policyNames()).contains(
                "S3ReadWritePolicy",
                "CloudWatchLogsPolicy",
                "SSMParameterPolicy",
                "VPCExecutionPolicy"
        );
    }

    /**
     * End-to-end test: Upload file, trigger Lambda, verify processing.
     */
    @Test
    @Timeout(90)
    public void testEndToEndDataProcessing() throws IOException {
        String bucketName = getStackOutput("BucketNameOutput");
        String functionArn = getStackOutput("FunctionArnOutput");
        String functionName = functionArn.substring(functionArn.lastIndexOf(":") + 1);

        // Step 1: Upload test data to input prefix
        String inputKey = "input/e2e-test-file.json";
        String testData = "{\"test\": \"end-to-end integration test\", \"timestamp\": " 
                + System.currentTimeMillis() + "}";

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(inputKey)
                        .build(),
                RequestBody.fromString(testData)
        );

        // Step 2: Invoke Lambda function to process the data
        InvokeResponse invokeResponse = lambdaClient.invoke(
                InvokeRequest.builder()
                        .functionName(functionName)
                        .build()
        );

        // Step 3: Verify Lambda execution was successful
        assertThat(invokeResponse.statusCode()).isEqualTo(200);
        assertThat(invokeResponse.functionError()).isNull();

        String payload = invokeResponse.payload().asUtf8String();
        assertThat(payload).contains("\"statusCode\": 200");
        assertThat(payload).contains("Successfully listed files");

        // Step 4: Verify the file is accessible via S3 listing
        ListObjectsV2Response listResponse = s3Client.listObjectsV2(
                ListObjectsV2Request.builder()
                        .bucket(bucketName)
                        .prefix("input/")
                        .build()
        );

        boolean fileExists = listResponse.contents().stream()
                .anyMatch(obj -> obj.key().equals(inputKey));
        assertThat(fileExists).isTrue();

        // Step 5: Verify file content
        var getResponse = s3Client.getObject(
                GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(inputKey)
                        .build()
        );

        String retrievedData = new String(
                getResponse.readAllBytes(),
                StandardCharsets.UTF_8
        );
        assertThat(retrievedData).isEqualTo(testData);
    }

    /**
     * Test cross-stack reference capability via SSM parameters.
     */
    @Test
    public void testCrossStackReferenceViaSSM() {
        // Simulate another stack referencing this stack's resources via SSM
        String vpcIdParam = String.format("/tap/%s/vpc-id", environmentSuffix);
        String bucketNameParam = String.format("/tap/%s/data-bucket-name", environmentSuffix);

        // Get parameters as another stack would
        GetParameterResponse vpcResponse = ssmClient.getParameter(
                GetParameterRequest.builder()
                        .name(vpcIdParam)
                        .build()
        );

        GetParameterResponse bucketResponse = ssmClient.getParameter(
                GetParameterRequest.builder()
                        .name(bucketNameParam)
                        .build()
        );

        String vpcId = vpcResponse.parameter().value();
        String bucketName = bucketResponse.parameter().value();

        // Verify these values match the actual resources
        assertThat(vpcId).isEqualTo(getStackOutput("VpcIdOutput"));
        assertThat(bucketName).isEqualTo(getStackOutput("BucketNameOutput"));

        // Verify we can use these values to access the actual resources
        var vpcResponse2 = ec2Client.describeVpcs(
                DescribeVpcsRequest.builder()
                        .vpcIds(vpcId)
                        .build()
        );
        assertThat(vpcResponse2.vpcs()).hasSize(1);

        assertThatCode(() -> s3Client.headBucket(
                HeadBucketRequest.builder()
                        .bucket(bucketName)
                        .build()
        )).doesNotThrowAnyException();
    }

    /**
     * Helper method to get CloudFormation stack output value.
     */
    private String getStackOutput(String outputKey) {
        DescribeStacksResponse response = cfnClient.describeStacks(
                DescribeStacksRequest.builder()
                        .stackName(stackName)
                        .build()
        );

        return response.stacks().get(0).outputs().stream()
                .filter(output -> output.outputKey().equals(outputKey))
                .map(Output::outputValue)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Output " + outputKey + " not found in stack " + stackName));
    }
}
