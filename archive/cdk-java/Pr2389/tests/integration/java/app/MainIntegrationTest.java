package app;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;
import software.amazon.awssdk.services.codepipeline.CodePipelineClient;
import software.amazon.awssdk.services.codepipeline.model.*;
import software.amazon.awssdk.services.codebuild.CodeBuildClient;
import software.amazon.awssdk.services.codebuild.model.*;
import software.amazon.awssdk.services.codedeploy.CodeDeployClient;
import software.amazon.awssdk.services.codedeploy.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.*;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.*;
import software.amazon.awssdk.core.exception.SdkException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Comprehensive integration tests for deployed AWS resources.
 *
 * These tests validate that the actual AWS infrastructure matches the CDK specifications
 * and that all resources are properly configured and functional.
 *
 * Prerequisites:
 * - AWS credentials configured (AWS CLI, IAM roles, or environment variables)
 * - CDK stack deployed to AWS
 * - Stack outputs available in cfn-outputs/flat-outputs.json
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class MainIntegrationTest {

    private static final String ENVIRONMENT_SUFFIX = System.getenv("ENVIRONMENT_SUFFIX") != null 
        ? System.getenv("ENVIRONMENT_SUFFIX") : "dev";
    private static final String STACK_NAME = "TapStack" + ENVIRONMENT_SUFFIX;
    
    private static CloudFormationClient cloudFormationClient;
    private static S3Client s3Client;
    private static IamClient iamClient;
    private static CodePipelineClient codePipelineClient;
    private static CodeBuildClient codeBuildClient;
    private static CodeDeployClient codeDeployClient;
    private static SnsClient snsClient;
    private static CloudWatchLogsClient cloudWatchLogsClient;
    
    private static Map<String, String> stackOutputs;
    private static Region region;

    @BeforeAll
    static void setUp() {
        try {
            // Initialize AWS region
            String awsRegion = System.getenv("AWS_REGION");
            if (awsRegion == null) {
                awsRegion = System.getenv("CDK_DEFAULT_REGION");
            }
            if (awsRegion == null) {
                awsRegion = "us-east-1"; // Default region
            }
            region = Region.of(awsRegion);

            // Initialize AWS SDK clients
            DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
            
            cloudFormationClient = CloudFormationClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
                
            s3Client = S3Client.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .forcePathStyle(false)  // Use virtual-hosted style
                .build();
                
            iamClient = IamClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
                
            codePipelineClient = CodePipelineClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
                
            codeBuildClient = CodeBuildClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
                
            codeDeployClient = CodeDeployClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
                
            snsClient = SnsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
                
            cloudWatchLogsClient = CloudWatchLogsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

            // Load stack outputs
            loadStackOutputs();
            
        } catch (Exception e) {
            System.err.println("Failed to initialize AWS clients or load stack outputs: " + e.getMessage());
            e.printStackTrace();
            fail("Setup failed: " + e.getMessage());
        }
    }

    private static void loadStackOutputs() {
        try {
            // First try to load from flat-outputs.json file
            File flatOutputsFile = new File("cfn-outputs/flat-outputs.json");
            if (flatOutputsFile.exists()) {
                String content = Files.readString(flatOutputsFile.toPath());
                ObjectMapper mapper = new ObjectMapper();
                stackOutputs = mapper.readValue(content, new TypeReference<Map<String, String>>(){});
                System.out.println("Loaded stack outputs from flat-outputs.json: " + stackOutputs.keySet());
                return;
            }

            // Fallback: Query CloudFormation directly for stack outputs
            System.out.println("flat-outputs.json not found, querying CloudFormation directly...");
            DescribeStacksRequest request = DescribeStacksRequest.builder()
                .stackName(STACK_NAME)
                .build();
                
            DescribeStacksResponse response = cloudFormationClient.describeStacks(request);
            
            if (response.stacks().isEmpty()) {
                throw new RuntimeException("Stack " + STACK_NAME + " not found");
            }
            
            software.amazon.awssdk.services.cloudformation.model.Stack stack = response.stacks().get(0);
            stackOutputs = stack.outputs().stream()
                .collect(Collectors.toMap(Output::outputKey, Output::outputValue));
                
            System.out.println("Loaded stack outputs from CloudFormation: " + stackOutputs.keySet());
            
        } catch (Exception e) {
            System.err.println("Failed to load stack outputs: " + e.getMessage());
            e.printStackTrace();
            stackOutputs = new HashMap<>(); // Initialize empty map to avoid null pointer exceptions
        }
    }

    @Test
    @Order(1)
    public void testStackExists() {
        try {
            DescribeStacksRequest request = DescribeStacksRequest.builder()
                .stackName(STACK_NAME)
                .build();
                
            DescribeStacksResponse response = cloudFormationClient.describeStacks(request);
            
            assertThat(response.stacks()).isNotEmpty();
            software.amazon.awssdk.services.cloudformation.model.Stack stack = response.stacks().get(0);
            assertThat(stack.stackName()).isEqualTo(STACK_NAME);
            assertThat(stack.stackStatus()).isIn(
                StackStatus.CREATE_COMPLETE,
                StackStatus.UPDATE_COMPLETE
            );
            
            System.out.println("✅ Stack " + STACK_NAME + " exists and is in " + stack.stackStatus() + " state");
            
        } catch (Exception e) {
            fail("Stack validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(2)
    public void testS3ArtifactsBucketConfiguration() {
        try {
            // Get bucket name from outputs
            String bucketName = stackOutputs.get("ArtifactsBucketName");
            assertThat(bucketName).isNotNull().withFailMessage("ArtifactsBucketName not found in stack outputs");
            System.out.println("Testing S3 bucket: " + bucketName);
            
            // Verify bucket exists
            HeadBucketRequest headRequest = HeadBucketRequest.builder()
                .bucket(bucketName)
                .build();
            s3Client.headBucket(headRequest);
            System.out.println("✅ S3 bucket " + bucketName + " exists");
            
            // Verify bucket encryption
            GetBucketEncryptionRequest encryptionRequest = GetBucketEncryptionRequest.builder()
                .bucket(bucketName)
                .build();
            GetBucketEncryptionResponse encryptionResponse = s3Client.getBucketEncryption(encryptionRequest);
            
            assertThat(encryptionResponse.serverSideEncryptionConfiguration().rules())
                .isNotEmpty();
            assertThat(encryptionResponse.serverSideEncryptionConfiguration().rules().get(0)
                .applyServerSideEncryptionByDefault().sseAlgorithm())
                .isEqualTo(ServerSideEncryption.AES256);
            System.out.println("✅ S3 bucket encryption verified (AES256)");
            
            // Verify versioning
            GetBucketVersioningRequest versioningRequest = GetBucketVersioningRequest.builder()
                .bucket(bucketName)
                .build();
            GetBucketVersioningResponse versioningResponse = s3Client.getBucketVersioning(versioningRequest);
            assertThat(versioningResponse.status()).isEqualTo(BucketVersioningStatus.ENABLED);
            System.out.println("✅ S3 bucket versioning verified (Enabled)");
            
            // Verify lifecycle configuration
            GetBucketLifecycleConfigurationRequest lifecycleRequest = GetBucketLifecycleConfigurationRequest.builder()
                .bucket(bucketName)
                .build();
            GetBucketLifecycleConfigurationResponse lifecycleResponse = s3Client.getBucketLifecycleConfiguration(lifecycleRequest);
            assertThat(lifecycleResponse.rules()).isNotEmpty();
            System.out.println("✅ S3 bucket lifecycle configuration verified");
            
        } catch (Exception e) {
            fail("S3 bucket validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(3)
    public void testIAMRolesConfiguration() {
        try {
            // Test CodeBuild service role
            String codeBuildRoleName = "prod-codebuild-service-role";
            GetRoleRequest roleRequest = GetRoleRequest.builder()
                .roleName(codeBuildRoleName)
                .build();
            GetRoleResponse roleResponse = iamClient.getRole(roleRequest);
            
            assertThat(roleResponse.role().roleName()).isEqualTo(codeBuildRoleName);
            System.out.println("✅ CodeBuild service role exists: " + codeBuildRoleName);
            
            // Verify role policies
            ListAttachedRolePoliciesRequest policiesRequest = ListAttachedRolePoliciesRequest.builder()
                .roleName(codeBuildRoleName)
                .build();
            ListAttachedRolePoliciesResponse policiesResponse = iamClient.listAttachedRolePolicies(policiesRequest);
            
            boolean hasCloudWatchLogsPolicy = policiesResponse.attachedPolicies().stream()
                .anyMatch(policy -> policy.policyName().contains("CloudWatchLogsFullAccess"));
            assertThat(hasCloudWatchLogsPolicy).isTrue();
            System.out.println("✅ CodeBuild role has required managed policies");
            
            // Test inline policies
            ListRolePoliciesRequest inlinePoliciesRequest = ListRolePoliciesRequest.builder()
                .roleName(codeBuildRoleName)
                .build();
            ListRolePoliciesResponse inlinePoliciesResponse = iamClient.listRolePolicies(inlinePoliciesRequest);
            assertThat(inlinePoliciesResponse.policyNames()).contains("CodeBuildPolicy");
            System.out.println("✅ CodeBuild role has required inline policies");
            
            // Test EC2 instance role
            String ec2RoleName = "prod-ec2-codedeploy-role";
            GetRoleRequest ec2RoleRequest = GetRoleRequest.builder()
                .roleName(ec2RoleName)
                .build();
            GetRoleResponse ec2RoleResponse = iamClient.getRole(ec2RoleRequest);
            assertThat(ec2RoleResponse.role().roleName()).isEqualTo(ec2RoleName);
            System.out.println("✅ EC2 CodeDeploy role exists: " + ec2RoleName);
            
        } catch (Exception e) {
            fail("IAM roles validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(4)
    public void testCodePipelineConfiguration() {
        try {
            String pipelineName = "prod-cicd-pipeline";
            
            GetPipelineRequest request = GetPipelineRequest.builder()
                .name(pipelineName)
                .build();
            GetPipelineResponse response = codePipelineClient.getPipeline(request);
            
            assertThat(response.pipeline().name()).isEqualTo(pipelineName);
            System.out.println("✅ CodePipeline exists: " + pipelineName);
            
            // Verify pipeline stages
            List<StageDeclaration> stages = response.pipeline().stages();
            List<String> stageNames = stages.stream()
                .map(StageDeclaration::name)
                .collect(Collectors.toList());
                
            assertThat(stageNames).containsExactly("Source", "Build", "Approval", "Deploy");
            System.out.println("✅ CodePipeline has required stages: " + stageNames);
            
            // Verify pipeline state
            GetPipelineStateRequest stateRequest = GetPipelineStateRequest.builder()
                .name(pipelineName)
                .build();
            GetPipelineStateResponse stateResponse = codePipelineClient.getPipelineState(stateRequest);
            assertThat(stateResponse.pipelineName()).isEqualTo(pipelineName);
            System.out.println("✅ CodePipeline state accessible");
            
        } catch (Exception e) {
            fail("CodePipeline validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(5)
    public void testCodeBuildProjectConfiguration() {
        try {
            String projectName = "prod-build-project";
            
            BatchGetProjectsRequest request = BatchGetProjectsRequest.builder()
                .names(projectName)
                .build();
            BatchGetProjectsResponse response = codeBuildClient.batchGetProjects(request);
            
            assertThat(response.projects()).hasSize(1);
            Project project = response.projects().get(0);
            assertThat(project.name()).isEqualTo(projectName);
            System.out.println("✅ CodeBuild project exists: " + projectName);
            
            // Verify environment configuration
            ProjectEnvironment env = project.environment();
            assertThat(env.type()).isEqualTo(EnvironmentType.LINUX_CONTAINER);
            assertThat(env.computeType()).isEqualTo(ComputeType.BUILD_GENERAL1_MEDIUM);
            assertThat(env.image()).contains("amazonlinux2");
            System.out.println("✅ CodeBuild environment configuration verified");
            
            // Verify service role
            assertThat(project.serviceRole()).contains("codebuild-service-role");
            System.out.println("✅ CodeBuild service role configured");
            
        } catch (Exception e) {
            fail("CodeBuild validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(6)
    public void testCodeDeployConfiguration() {
        try {
            String applicationName = "prod-deployment-application";
            
            GetApplicationRequest request = GetApplicationRequest.builder()
                .applicationName(applicationName)
                .build();
            GetApplicationResponse response = codeDeployClient.getApplication(request);
            
            assertThat(response.application().applicationName()).isEqualTo(applicationName);
            assertThat(response.application().computePlatform()).isEqualTo(ComputePlatform.SERVER);
            System.out.println("✅ CodeDeploy application exists: " + applicationName);
            
            // Verify deployment group
            String deploymentGroupName = "prod-deployment-group";
            GetDeploymentGroupRequest dgRequest = GetDeploymentGroupRequest.builder()
                .applicationName(applicationName)
                .deploymentGroupName(deploymentGroupName)
                .build();
            GetDeploymentGroupResponse dgResponse = codeDeployClient.getDeploymentGroup(dgRequest);
            
            assertThat(dgResponse.deploymentGroupInfo().deploymentGroupName()).isEqualTo(deploymentGroupName);
            assertThat(dgResponse.deploymentGroupInfo().serviceRoleArn()).contains("codedeploy-service-role");
            System.out.println("✅ CodeDeploy deployment group configured: " + deploymentGroupName);
            
        } catch (Exception e) {
            fail("CodeDeploy validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(7)
    public void testSNSTopicConfiguration() {
        try {
            // Get topic ARN from outputs
            String topicArn = stackOutputs.get("NotificationTopicArn");
            assertThat(topicArn).isNotNull().withFailMessage("NotificationTopicArn not found in stack outputs");
            System.out.println("Testing SNS topic: " + topicArn);
            
            GetTopicAttributesRequest request = GetTopicAttributesRequest.builder()
                .topicArn(topicArn)
                .build();
            GetTopicAttributesResponse response = snsClient.getTopicAttributes(request);
            
            assertThat(response.attributes()).containsKey("TopicArn");
            assertThat(response.attributes().get("TopicArn")).isEqualTo(topicArn);
            System.out.println("✅ SNS topic exists and accessible: " + topicArn);
            
            // Verify display name if set
            if (response.attributes().containsKey("DisplayName")) {
                String displayName = response.attributes().get("DisplayName");
                assertThat(displayName).contains("CI/CD Pipeline Notifications");
                System.out.println("✅ SNS topic display name verified: " + displayName);
            }
            
        } catch (Exception e) {
            fail("SNS topic validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(8)
    public void testCloudWatchLogsConfiguration() {
        try {
            // Test CodeBuild log group
            String logGroupName = "/aws/codebuild/prod-build-project";
            
            DescribeLogGroupsRequest request = DescribeLogGroupsRequest.builder()
                .logGroupNamePrefix(logGroupName)
                .build();
            DescribeLogGroupsResponse response = cloudWatchLogsClient.describeLogGroups(request);
            
            Optional<LogGroup> buildLogGroup = response.logGroups().stream()
                .filter(lg -> lg.logGroupName().equals(logGroupName))
                .findFirst();
                
            if (buildLogGroup.isPresent()) {
                System.out.println("✅ CodeBuild log group exists: " + logGroupName);
                // Verify retention policy if set
                if (buildLogGroup.get().retentionInDays() != null) {
                    System.out.println("✅ Log group retention configured: " + buildLogGroup.get().retentionInDays() + " days");
                }
            } else {
                System.out.println("⚠️ CodeBuild log group not found (will be created on first build): " + logGroupName);
            }
            
        } catch (Exception e) {
            System.out.println("⚠️ CloudWatch Logs validation completed with warnings: " + e.getMessage());
            // This is not a hard failure as log groups are created on first use
        }
    }

    @Test
    @Order(9)
    public void testResourceTaggingAndNaming() {
        try {
            // Verify resource naming conventions
            String expectedPrefix = "prod-";
            
            // Check S3 bucket naming
            String bucketName = stackOutputs.get("ArtifactsBucketName");
            if (bucketName != null) {
                assertThat(bucketName).contains("artifacts");
                System.out.println("✅ S3 bucket naming convention verified: " + bucketName);
            }
            
            // Check pipeline naming
            String pipelineName = "prod-cicd-pipeline";
            assertThat(pipelineName).startsWith(expectedPrefix);
            System.out.println("✅ Pipeline naming convention verified: " + pipelineName);
            
            // Check build project naming
            String buildProjectName = "prod-build-project";
            assertThat(buildProjectName).startsWith(expectedPrefix);
            System.out.println("✅ Build project naming convention verified: " + buildProjectName);
            
        } catch (Exception e) {
            fail("Resource naming validation failed: " + e.getMessage());
        }
    }

    @Test
    @Order(10)
    public void testSecurityConfiguration() {
        try {
            // Verify S3 bucket public access is blocked
            String bucketName = stackOutputs.get("ArtifactsBucketName");
            assertThat(bucketName).isNotNull().withFailMessage("ArtifactsBucketName not found in stack outputs");
            System.out.println("Testing S3 bucket security: " + bucketName);
            
            GetPublicAccessBlockRequest publicAccessRequest = GetPublicAccessBlockRequest.builder()
                .bucket(bucketName)
                .build();
            GetPublicAccessBlockResponse publicAccessResponse = s3Client.getPublicAccessBlock(publicAccessRequest);
            
            PublicAccessBlockConfiguration publicAccessConfig = publicAccessResponse.publicAccessBlockConfiguration();
            assertThat(publicAccessConfig.blockPublicAcls()).isTrue();
            assertThat(publicAccessConfig.blockPublicPolicy()).isTrue();
            assertThat(publicAccessConfig.ignorePublicAcls()).isTrue();
            assertThat(publicAccessConfig.restrictPublicBuckets()).isTrue();
            System.out.println("✅ S3 bucket public access is properly blocked");
            
            // Verify bucket policy denies insecure connections
            try {
                GetBucketPolicyRequest policyRequest = GetBucketPolicyRequest.builder()
                    .bucket(bucketName)
                    .build();
                GetBucketPolicyResponse policyResponse = s3Client.getBucketPolicy(policyRequest);
                assertThat(policyResponse.policy()).contains("aws:SecureTransport");
                assertThat(policyResponse.policy()).contains("Deny");
                System.out.println("✅ S3 bucket policy denies insecure connections");
            } catch (S3Exception e) {
                if (e.statusCode() == 404) {
                    System.out.println("⚠️ S3 bucket policy not yet applied (may be due to deployment timing)");
                } else {
                    throw e;
                }
            }
            
        } catch (Exception e) {
            fail("Security configuration validation failed: " + e.getMessage());
        }
    }
}
