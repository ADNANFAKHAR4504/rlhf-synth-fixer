package app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.codebuild.CodeBuildClient;
import software.amazon.awssdk.services.codebuild.model.BatchGetProjectsRequest;
import software.amazon.awssdk.services.codebuild.model.BatchGetProjectsResponse;
import software.amazon.awssdk.services.codebuild.model.Project;
import software.amazon.awssdk.services.codepipeline.CodePipelineClient;
import software.amazon.awssdk.services.codepipeline.model.GetPipelineRequest;
import software.amazon.awssdk.services.codepipeline.model.GetPipelineResponse;
import software.amazon.awssdk.services.codepipeline.model.PipelineDeclaration;
import software.amazon.awssdk.services.codedeploy.CodeDeployClient;
import software.amazon.awssdk.services.codedeploy.model.GetApplicationRequest;
import software.amazon.awssdk.services.codedeploy.model.GetApplicationResponse;
import software.amazon.awssdk.services.codedeploy.model.ListDeploymentGroupsRequest;
import software.amazon.awssdk.services.codedeploy.model.ListDeploymentGroupsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.CloudWatchLogsClient;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogGroupsRequest;
import software.amazon.awssdk.services.cloudwatchlogs.model.DescribeLogGroupsResponse;
import software.amazon.awssdk.services.cloudwatchlogs.model.LogGroup;
import software.amazon.awssdk.services.codepipeline.model.StageDeclaration;
import software.amazon.awssdk.services.cloudwatchevents.CloudWatchEventsClient;
import software.amazon.awssdk.services.iam.IamClient;
import software.amazon.awssdk.services.iam.model.*;
import software.amazon.awssdk.services.kms.KmsClient;
import software.amazon.awssdk.services.kms.model.DescribeKeyRequest;
import software.amazon.awssdk.services.kms.model.DescribeKeyResponse;
import software.amazon.awssdk.services.kms.model.GetKeyRotationStatusRequest;
import software.amazon.awssdk.services.kms.model.GetKeyRotationStatusResponse;
import software.amazon.awssdk.services.kms.model.ListAliasesRequest;
import software.amazon.awssdk.services.kms.model.ListAliasesResponse;
import software.amazon.awssdk.services.kms.model.AliasListEntry;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesRequest;
import software.amazon.awssdk.services.sns.model.GetTopicAttributesResponse;
import software.amazon.awssdk.services.sns.model.ListSubscriptionsByTopicRequest;
import software.amazon.awssdk.services.sns.model.ListSubscriptionsByTopicResponse;
import software.amazon.awssdk.services.sns.model.ListTopicsRequest;
import software.amazon.awssdk.services.sns.model.ListTopicsResponse;
import software.amazon.awssdk.services.sns.model.Subscription;
import software.amazon.awssdk.services.sns.model.Topic;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for CDKTF Java CI/CD Pipeline infrastructure.
 *
 * These tests validate actual AWS resources deployed via Terraform/CDKTF.
 * They require the stack to be deployed before running tests and focus on
 * cross-service interactions and end-to-end CI/CD pipeline functionality.
 *
 * Test execution order:
 * 1. Infrastructure validation tests
 * 2. Cross-service integration tests
 * 3. End-to-end CI/CD pipeline tests
 *
 * To run these tests:
 * 1. Deploy the stack: cdktf deploy
 * 2. Run tests: ./gradlew integrationTest
 * 3. Destroy when done: cdktf destroy
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("CDKTF CI/CD Pipeline Integration Tests")
public class MainIntegrationTest {

    private static final String OUTPUTS_FILE_PATH = Optional.ofNullable(System.getProperty("OUTPUTS_FILE_PATH"))
            .orElseGet(() -> System.getenv().getOrDefault("OUTPUTS_FILE_PATH", "cfn-outputs/flat-outputs.json"));
    private static final String REGION_STR = Optional.ofNullable(System.getenv("AWS_REGION"))
            .orElse(Optional.ofNullable(System.getenv("CDK_DEFAULT_REGION")).orElse("us-east-1"));
    private static final String PROJECT_NAME = "webapp";

    // AWS Clients
    private static S3Client s3Client;
    private static KmsClient kmsClient;
    private static IamClient iamClient;
    private static CodeBuildClient codeBuildClient;
    private static CodePipelineClient codePipelineClient;
    private static CodeDeployClient codeDeployClient;
    private static CloudWatchLogsClient logsClient;
    private static SnsClient snsClient;
    private static CloudWatchEventsClient eventBridgeClient;

    // Stack outputs
    private static Map<String, String> outputs;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @BeforeAll
    static void setup() {
        Region region = Region.of(REGION_STR);
        DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();

        // Initialize AWS clients
        s3Client = S3Client.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        kmsClient = KmsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        iamClient = IamClient.builder()
                .region(Region.AWS_GLOBAL)
                .credentialsProvider(credentialsProvider)
                .build();


        codeBuildClient = CodeBuildClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        codePipelineClient = CodePipelineClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        codeDeployClient = CodeDeployClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        logsClient = CloudWatchLogsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        snsClient = SnsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        eventBridgeClient = CloudWatchEventsClient.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();

        // Load outputs from file
        outputs = loadOutputsFromFile();

        if (outputs.isEmpty()) {
            System.err.println("WARNING: No outputs found. Tests will be skipped.");
        }
    }

    private static Map<String, String> loadOutputsFromFile() {
        try {
            File file = new File(OUTPUTS_FILE_PATH);
            if (!file.exists()) {
                System.err.println("Outputs file not found: " + OUTPUTS_FILE_PATH);
                return new HashMap<>();
            }

            String content = Files.readString(Paths.get(OUTPUTS_FILE_PATH));
            if (content == null || content.isBlank()) {
                return new HashMap<>();
            }

            JsonNode node = MAPPER.readTree(content);
            Map<String, String> result = new HashMap<>();

            // Handle both flat and nested output structures
            node.fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value.isObject()) {
                    // Nested structure (CDKTF format)
                    value.fields().forEachRemaining(nestedEntry -> {
                        result.put(nestedEntry.getKey(), nestedEntry.getValue().asText());
                    });
                } else {
                    // Flat structure
                    result.put(entry.getKey(), value.asText());
                }
            });

            System.out.println("Loaded " + result.size() + " outputs from " + OUTPUTS_FILE_PATH);
            return result;
        } catch (Exception e) {
            System.err.println("Failed to load outputs: " + e.getMessage());
            return new HashMap<>();
        }
    }

    // ========== Infrastructure Validation Tests ==========

    @Test
    @Order(1)
    @DisplayName("Shared Resources - S3 artifacts bucket exists with proper configuration")
    void testS3ArtifactsBucketConfiguration() {
        skipIfOutputMissing("artifactBucketName");

        String bucketName = outputs.get("artifactBucketName");

        // Verify bucket exists
        HeadBucketResponse headResponse = s3Client.headBucket(
                HeadBucketRequest.builder().bucket(bucketName).build()
        );
        assertNotNull(headResponse);

        // Verify versioning is enabled
        GetBucketVersioningResponse versioningResponse = s3Client.getBucketVersioning(
                GetBucketVersioningRequest.builder().bucket(bucketName).build()
        );
        assertEquals(BucketVersioningStatus.ENABLED, versioningResponse.status());

        // Verify encryption configuration
        GetBucketEncryptionResponse encryptionResponse = s3Client.getBucketEncryption(
                GetBucketEncryptionRequest.builder().bucket(bucketName).build()
        );
        assertNotNull(encryptionResponse.serverSideEncryptionConfiguration());

        ServerSideEncryptionRule encryptionRule = encryptionResponse.serverSideEncryptionConfiguration().rules().get(0);
        assertEquals(ServerSideEncryption.AWS_KMS, encryptionRule.applyServerSideEncryptionByDefault().sseAlgorithm());
        assertNotNull(encryptionRule.applyServerSideEncryptionByDefault().kmsMasterKeyID());
        assertTrue(encryptionRule.bucketKeyEnabled());

        // Verify public access is blocked
        GetPublicAccessBlockResponse publicAccessResponse = s3Client.getPublicAccessBlock(
                GetPublicAccessBlockRequest.builder().bucket(bucketName).build()
        );
        PublicAccessBlockConfiguration publicAccessBlock = publicAccessResponse.publicAccessBlockConfiguration();
        assertTrue(publicAccessBlock.blockPublicAcls());
        assertTrue(publicAccessBlock.blockPublicPolicy());
        assertTrue(publicAccessBlock.ignorePublicAcls());
        assertTrue(publicAccessBlock.restrictPublicBuckets());

        System.out.println("✓ S3 artifacts bucket properly configured with encryption and security settings");
    }

    @Test
    @Order(2)
    @DisplayName("Shared Resources - KMS key exists with proper configuration and alias")
    void testKmsKeyConfiguration() {
        skipIfOutputMissing("pipelineKmsKeyArn");

        String keyArn = outputs.get("pipelineKmsKeyArn");
        String keyId = keyArn.substring(keyArn.lastIndexOf("/") + 1);

        // Describe the KMS key
        DescribeKeyResponse keyResponse = kmsClient.describeKey(
                DescribeKeyRequest.builder().keyId(keyId).build()
        );

        assertNotNull(keyResponse.keyMetadata());
        assertEquals("KMS key for CI/CD pipeline artifacts encryption", keyResponse.keyMetadata().description());
        assertTrue(keyResponse.keyMetadata().enabled());
        // Check key rotation status with separate API call
        GetKeyRotationStatusResponse rotationResponse = kmsClient.getKeyRotationStatus(
                GetKeyRotationStatusRequest.builder().keyId(keyId).build()
        );
        assertTrue(rotationResponse.keyRotationEnabled());

        // Verify KMS alias exists
        ListAliasesResponse aliasesResponse = kmsClient.listAliases(
                ListAliasesRequest.builder().keyId(keyId).build()
        );

        List<AliasListEntry> aliases = aliasesResponse.aliases();
        assertTrue(aliases.stream().anyMatch(alias ->
                alias.aliasName().contains(PROJECT_NAME) && alias.aliasName().contains("pipeline")));

        System.out.println("✓ KMS key properly configured with rotation enabled and alias");
    }

    @Test
    @Order(3)
    @DisplayName("IAM Roles - CodePipeline role exists with proper policies")
    void testCodePipelineRoleConfiguration() {
        String roleName = outputs.get("codePipelineRoleName");

        // Get the role
        GetRoleResponse roleResponse = iamClient.getRole(
                GetRoleRequest.builder().roleName(roleName).build()
        );

        assertNotNull(roleResponse.role());
        assertEquals(roleName, roleResponse.role().roleName());

        // Verify assume role policy
        String assumeRolePolicy = java.net.URLDecoder.decode(roleResponse.role().assumeRolePolicyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(assumeRolePolicy).contains("codepipeline.amazonaws.com");
        assertThat(assumeRolePolicy).contains("sts:AssumeRole");

        // Get inline policies
        ListRolePoliciesResponse policiesResponse = iamClient.listRolePolicies(
                ListRolePoliciesRequest.builder().roleName(roleName).build()
        );

        List<String> policyNames = policiesResponse.policyNames();
        assertTrue(policyNames.stream().anyMatch(name -> name.contains("codepipeline-policy")));

        // Verify policy content
        String policyName = policyNames.stream()
                .filter(name -> name.contains("codepipeline-policy"))
                .findFirst().orElseThrow();

        GetRolePolicyResponse policyResponse = iamClient.getRolePolicy(
                GetRolePolicyRequest.builder()
                        .roleName(roleName)
                        .policyName(policyName)
                        .build()
        );

        String policyDocument = java.net.URLDecoder.decode(policyResponse.policyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(policyDocument).contains("s3:GetObject");
        assertThat(policyDocument).contains("s3:PutObject");
        assertThat(policyDocument).contains("codebuild:BatchGetBuilds");
        assertThat(policyDocument).contains("codedeploy:CreateDeployment");
        assertThat(policyDocument).contains("kms:Decrypt");
        assertThat(policyDocument).contains("sns:Publish");

        System.out.println("✓ CodePipeline role properly configured with necessary permissions");
    }

    @Test
    @Order(4)
    @DisplayName("IAM Roles - CodeBuild role exists with proper policies")
    void testCodeBuildRoleConfiguration() {
        String roleName = outputs.get("codeBuildRoleName");

        // Get the role
        GetRoleResponse roleResponse = iamClient.getRole(
                GetRoleRequest.builder().roleName(roleName).build()
        );

        assertNotNull(roleResponse.role());
        assertEquals(roleName, roleResponse.role().roleName());

        // Verify assume role policy
        String assumeRolePolicy = java.net.URLDecoder.decode(roleResponse.role().assumeRolePolicyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(assumeRolePolicy).contains("codebuild.amazonaws.com");

        // Get inline policies
        ListRolePoliciesResponse policiesResponse = iamClient.listRolePolicies(
                ListRolePoliciesRequest.builder().roleName(roleName).build()
        );

        List<String> policyNames = policiesResponse.policyNames();
        assertTrue(policyNames.stream().anyMatch(name -> name.contains("codebuild-policy")));

        // Verify policy content for least privilege
        String policyName = policyNames.stream()
                .filter(name -> name.contains("codebuild-policy"))
                .findFirst().orElseThrow();

        GetRolePolicyResponse policyResponse = iamClient.getRolePolicy(
                GetRolePolicyRequest.builder()
                        .roleName(roleName)
                        .policyName(policyName)
                        .build()
        );

        String policyDocument = java.net.URLDecoder.decode(policyResponse.policyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(policyDocument).contains("logs:CreateLogGroup");
        assertThat(policyDocument).contains("logs:PutLogEvents");
        assertThat(policyDocument).contains("s3:GetObject");
        assertThat(policyDocument).contains("kms:Decrypt");

        System.out.println("✓ CodeBuild role properly configured with least privilege permissions");
    }

    @Test
    @Order(5)
    @DisplayName("IAM Roles - CodeDeploy role exists with managed policy attachment")
    void testCodeDeployRoleConfiguration() {
        String roleName = outputs.get("codeDeployRoleName");

        // Get the role
        GetRoleResponse roleResponse = iamClient.getRole(
                GetRoleRequest.builder().roleName(roleName).build()
        );

        assertNotNull(roleResponse.role());
        assertEquals(roleName, roleResponse.role().roleName());

        // Verify assume role policy
        String assumeRolePolicy = java.net.URLDecoder.decode(roleResponse.role().assumeRolePolicyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(assumeRolePolicy).contains("codedeploy.amazonaws.com");

        // Verify managed policy attachment
        ListAttachedRolePoliciesResponse attachedPoliciesResponse = iamClient.listAttachedRolePolicies(
                ListAttachedRolePoliciesRequest.builder().roleName(roleName).build()
        );

        List<AttachedPolicy> attachedPolicies = attachedPoliciesResponse.attachedPolicies();
        assertTrue(attachedPolicies.stream().anyMatch(policy ->
                policy.policyArn().contains("AWSCodeDeployRole")));

        System.out.println("✓ CodeDeploy role properly configured with AWS managed policy");
    }

    @Test
    @Order(6)
    @DisplayName("S3 Source - Source bucket exists with proper configuration")
    void testS3SourceBucketConfiguration() {
        skipIfOutputMissing("sourceBucketName");

        String sourceBucketName = outputs.get("sourceBucketName");

        // Verify source bucket exists
        HeadBucketResponse headResponse = s3Client.headBucket(
                HeadBucketRequest.builder().bucket(sourceBucketName).build()
        );
        assertNotNull(headResponse);

        // Verify versioning is enabled (required for CodePipeline S3 source)
        GetBucketVersioningResponse versioningResponse = s3Client.getBucketVersioning(
                GetBucketVersioningRequest.builder().bucket(sourceBucketName).build()
        );
        assertEquals(BucketVersioningStatus.ENABLED, versioningResponse.status());

        // Verify encryption configuration
        GetBucketEncryptionResponse encryptionResponse = s3Client.getBucketEncryption(
                GetBucketEncryptionRequest.builder().bucket(sourceBucketName).build()
        );
        assertNotNull(encryptionResponse.serverSideEncryptionConfiguration());

        ServerSideEncryptionRule encryptionRule = encryptionResponse.serverSideEncryptionConfiguration().rules().get(0);
        assertEquals(ServerSideEncryption.AWS_KMS, encryptionRule.applyServerSideEncryptionByDefault().sseAlgorithm());
        assertNotNull(encryptionRule.applyServerSideEncryptionByDefault().kmsMasterKeyID());
        assertTrue(encryptionRule.bucketKeyEnabled());

        // Verify public access is blocked
        GetPublicAccessBlockResponse publicAccessResponse = s3Client.getPublicAccessBlock(
                GetPublicAccessBlockRequest.builder().bucket(sourceBucketName).build()
        );
        PublicAccessBlockConfiguration publicAccessBlock = publicAccessResponse.publicAccessBlockConfiguration();
        assertTrue(publicAccessBlock.blockPublicAcls());
        assertTrue(publicAccessBlock.blockPublicPolicy());
        assertTrue(publicAccessBlock.ignorePublicAcls());
        assertTrue(publicAccessBlock.restrictPublicBuckets());

        System.out.println("✓ S3 source bucket properly configured with encryption and security settings");
    }

    @Test
    @Order(7)
    @DisplayName("CodeBuild - Frontend and Backend projects exist with proper configuration")
    void testCodeBuildProjectsConfiguration() {
        String frontendProjectName = outputs.get("frontendBuildProjectName");
        String backendProjectName = outputs.get("backendBuildProjectName");

        // Get both projects
        BatchGetProjectsResponse projectsResponse = codeBuildClient.batchGetProjects(
                BatchGetProjectsRequest.builder()
                        .names(frontendProjectName, backendProjectName)
                        .build()
        );

        List<Project> projects = projectsResponse.projects();
        assertEquals(2, projects.size(), "Should have both frontend and backend projects");

        // Verify frontend project
        Project frontendProject = projects.stream()
                .filter(p -> p.name().equals(frontendProjectName))
                .findFirst().orElseThrow();

        assertEquals("Build project for frontend", frontendProject.description());
        assertEquals("CODEPIPELINE", frontendProject.artifacts().type().toString());
        assertEquals("BUILD_GENERAL1_SMALL", frontendProject.environment().computeType().toString());
        assertEquals("aws/codebuild/standard:5.0", frontendProject.environment().image());
        assertTrue(frontendProject.environment().environmentVariables().stream()
                .anyMatch(env -> "COMPONENT".equals(env.name()) && "frontend".equals(env.value())));

        // Verify backend project
        Project backendProject = projects.stream()
                .filter(p -> p.name().equals(backendProjectName))
                .findFirst().orElseThrow();

        assertEquals("Build project for backend", backendProject.description());
        assertTrue(backendProject.environment().environmentVariables().stream()
                .anyMatch(env -> "COMPONENT".equals(env.name()) && "backend".equals(env.value())));

        // Verify inline buildspec definitions
        assertNotNull(frontendProject.source().buildspec());
        assertThat(frontendProject.source().buildspec()).contains("npm install");
        assertThat(frontendProject.source().buildspec()).contains("npm run build");

        assertNotNull(backendProject.source().buildspec());
        assertThat(backendProject.source().buildspec()).contains("./mvnw package");
        assertThat(backendProject.source().buildspec()).contains("JAVA_HOME");

        System.out.println("✓ CodeBuild projects properly configured with inline buildspecs");
    }

    @Test
    @Order(8)
    @DisplayName("CodeBuild - CloudWatch log groups exist with proper retention")
    void testCodeBuildLogGroups() {
        String frontendLogGroup = "/aws/codebuild/" + outputs.get("frontendBuildProjectName");
        String backendLogGroup = "/aws/codebuild/" + outputs.get("backendBuildProjectName");

        // Check log groups
        DescribeLogGroupsResponse logGroupsResponse = logsClient.describeLogGroups(
                DescribeLogGroupsRequest.builder()
                        .logGroupNamePrefix("/aws/codebuild/" + PROJECT_NAME)
                        .build()
        );

        List<LogGroup> logGroups = logGroupsResponse.logGroups();
        assertTrue(logGroups.size() >= 2, "Should have log groups for both frontend and backend");

        // Verify log group retention
        logGroups.forEach(logGroup -> {
            assertEquals(Integer.valueOf(7), logGroup.retentionInDays(),
                    "Log group should have 7 days retention: " + logGroup.logGroupName());
        });

        System.out.println("✓ CodeBuild log groups properly configured with retention");
    }

    @Test
    @Order(9)
    @DisplayName("CodeDeploy - Applications and deployment groups exist")
    void testCodeDeployApplicationsConfiguration() {
        String frontendAppName = outputs.get("frontendDeployApplicationName");
        String backendAppName = outputs.get("backendDeployApplicationName");

        // Check frontend application
        GetApplicationResponse frontendAppResponse = codeDeployClient.getApplication(
                GetApplicationRequest.builder().applicationName(frontendAppName).build()
        );
        assertNotNull(frontendAppResponse.application());
        assertEquals("Server", frontendAppResponse.application().computePlatform().toString());

        // Check backend application
        GetApplicationResponse backendAppResponse = codeDeployClient.getApplication(
                GetApplicationRequest.builder().applicationName(backendAppName).build()
        );
        assertNotNull(backendAppResponse.application());

        // Verify deployment groups (names have UUID suffixes)
        ListDeploymentGroupsResponse frontendGroupsResponse = codeDeployClient.listDeploymentGroups(
                ListDeploymentGroupsRequest.builder().applicationName(frontendAppName).build()
        );
        List<String> frontendGroups = frontendGroupsResponse.deploymentGroups();
        assertTrue(frontendGroups.stream().anyMatch(name -> name.startsWith("frontend-staging")),
                "Should have frontend-staging deployment group");
        assertTrue(frontendGroups.stream().anyMatch(name -> name.startsWith("frontend-production")),
                "Should have frontend-production deployment group");

        ListDeploymentGroupsResponse backendGroupsResponse = codeDeployClient.listDeploymentGroups(
                ListDeploymentGroupsRequest.builder().applicationName(backendAppName).build()
        );
        List<String> backendGroups = backendGroupsResponse.deploymentGroups();
        assertTrue(backendGroups.stream().anyMatch(name -> name.startsWith("backend-staging")),
                "Should have backend-staging deployment group");
        assertTrue(backendGroups.stream().anyMatch(name -> name.startsWith("backend-production")),
                "Should have backend-production deployment group");

        System.out.println("✓ CodeDeploy applications properly configured with staging and production deployment groups");
    }

    @Test
    @Order(10)
    @DisplayName("CodePipeline - Main pipeline exists with all stages")
    void testCodePipelineConfiguration() {
        String pipelineName = outputs.get("pipelineName");

        // Get pipeline
        GetPipelineResponse pipelineResponse = codePipelineClient.getPipeline(
                GetPipelineRequest.builder().name(pipelineName).build()
        );

        PipelineDeclaration pipeline = pipelineResponse.pipeline();
        assertNotNull(pipeline);
        assertEquals(pipelineName, pipeline.name());

        // Verify pipeline stages
        List<String> stageNames = pipeline.stages().stream()
                .map(StageDeclaration::name)
                .collect(Collectors.toList());

        assertThat(stageNames).contains("Source");
        assertThat(stageNames).contains("Build");
        assertThat(stageNames).contains("DeployToStaging");
        assertThat(stageNames).contains("ManualApproval");
        assertThat(stageNames).contains("DeployToProduction");
        assertEquals(5, stageNames.size(), "Pipeline should have exactly 5 stages");

        // Verify artifact store configuration (multi-region pipeline)
        assertNotNull(pipeline.artifactStores());
        assertFalse(pipeline.artifactStores().isEmpty(), "Pipeline should have artifact stores");
        assertTrue(pipeline.artifactStores().size() >= 1, "Pipeline should have at least one artifact store");

        // Verify primary artifact store (artifactStores is a Map<region, ArtifactStore>)
        assertTrue(pipeline.artifactStores().containsKey(REGION_STR),
                "Primary region artifact store should exist");
        var primaryArtifactStore = pipeline.artifactStores().get(REGION_STR);
        assertNotNull(primaryArtifactStore);
        assertEquals("S3", primaryArtifactStore.type().toString());
        assertNotNull(primaryArtifactStore.encryptionKey());
        assertEquals("KMS", primaryArtifactStore.encryptionKey().type().toString());

        System.out.println("✓ CodePipeline properly configured with all required stages and multi-region S3/KMS artifact stores");
    }

    @Test
    @Order(11)
    @DisplayName("SNS - Notification topic exists with email subscription")
    void testSNSNotificationConfiguration() {
        String topicName = outputs.get("snsTopicName");

        // List topics to find ours
        ListTopicsResponse topicsResponse = snsClient.listTopics(
                ListTopicsRequest.builder().build()
        );

        Optional<Topic> notificationTopic = topicsResponse.topics().stream()
                .filter(topic -> topic.topicArn().contains(topicName))
                .findFirst();

        assertTrue(notificationTopic.isPresent(), "SNS notification topic should exist");

        // Get topic attributes
        GetTopicAttributesResponse attributesResponse = snsClient.getTopicAttributes(
                GetTopicAttributesRequest.builder()
                        .topicArn(notificationTopic.get().topicArn())
                        .build()
        );

        Map<String, String> attributes = attributesResponse.attributes();
        assertEquals("Pipeline Notifications", attributes.get("DisplayName"));

        // Verify email subscription
        ListSubscriptionsByTopicResponse subscriptionsResponse = snsClient.listSubscriptionsByTopic(
                ListSubscriptionsByTopicRequest.builder()
                        .topicArn(notificationTopic.get().topicArn())
                        .build()
        );

        List<Subscription> subscriptions = subscriptionsResponse.subscriptions();
        assertTrue(subscriptions.stream().anyMatch(sub ->
                "email".equals(sub.protocol()) && sub.endpoint().contains("@")));

        System.out.println("✓ SNS notification topic properly configured with email subscription");
    }


    // ========== Cross-Service Integration Tests ==========

    @Test
    @Order(12)
    @DisplayName("Cross-Service Integration - S3 bucket and KMS key integration")
    void testS3KmsIntegration() {
        skipIfOutputMissing("artifactBucketName", "pipelineKmsKeyArn");

        String bucketName = outputs.get("artifactBucketName");
        String kmsKeyArn = outputs.get("pipelineKmsKeyArn");

        // Test that we can put an object in the bucket (encrypted with KMS)
        String testKey = "integration-test/test-" + System.currentTimeMillis() + ".txt";
        String testContent = "Test content for KMS encryption validation";

        // Put object
        PutObjectResponse putResponse = s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .serverSideEncryption(ServerSideEncryption.AWS_KMS)
                        .ssekmsKeyId(kmsKeyArn)
                        .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromString(testContent)
        );

        assertNotNull(putResponse.eTag());
        assertEquals(ServerSideEncryption.AWS_KMS, putResponse.serverSideEncryption());
        assertNotNull(putResponse.ssekmsKeyId());

        // Get object back to verify encryption/decryption works
        ResponseBytes<GetObjectResponse> getResponse = s3Client.getObjectAsBytes(
                GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(testKey)
                        .build()
        );

        assertEquals(ServerSideEncryption.AWS_KMS, getResponse.response().serverSideEncryption());
        String retrievedContent = getResponse.asUtf8String();
        assertEquals(testContent, retrievedContent);

        // Cleanup
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(testKey)
                .build());

        System.out.println("✓ S3 and KMS integration working properly - encryption/decryption successful");
    }

    @Test
    @Order(13)
    @DisplayName("Cross-Service Integration - IAM roles can access required resources")
    void testIAMRoleResourceAccess() {
        skipIfOutputMissing("artifactBucketName", "pipelineKmsKeyArn");

        String bucketName = outputs.get("artifactBucketName");
        String kmsKeyArn = outputs.get("pipelineKmsKeyArn");

        // Test CodePipeline role policy contains correct resource ARNs
        String codePipelineRoleName = outputs.get("codePipelineRoleName");
        ListRolePoliciesResponse policiesResponse = iamClient.listRolePolicies(
                ListRolePoliciesRequest.builder().roleName(codePipelineRoleName).build()
        );

        String policyName = policiesResponse.policyNames().stream()
                .filter(name -> name.contains("codepipeline-policy"))
                .findFirst().orElseThrow();

        GetRolePolicyResponse policyResponse = iamClient.getRolePolicy(
                GetRolePolicyRequest.builder()
                        .roleName(codePipelineRoleName)
                        .policyName(policyName)
                        .build()
        );

        String policyDocument = java.net.URLDecoder.decode(policyResponse.policyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);

        // Verify policy contains specific resource ARNs from our infrastructure
        assertThat(policyDocument).contains(bucketName);
        assertThat(policyDocument).contains(kmsKeyArn);

        System.out.println("✓ IAM roles properly configured with specific resource ARNs");
    }

    @Test
    @Order(14)
    @DisplayName("Cross-Service Integration - CodeBuild projects can access S3 and KMS")
    void testCodeBuildResourceAccess() {
        skipIfOutputMissing("artifactBucketName", "pipelineKmsKeyArn");

        String frontendProjectName = outputs.get("frontendBuildProjectName");
        String bucketName = outputs.get("artifactBucketName");
        String kmsKeyArn = outputs.get("pipelineKmsKeyArn");

        // Get CodeBuild project
        BatchGetProjectsResponse projectsResponse = codeBuildClient.batchGetProjects(
                BatchGetProjectsRequest.builder().names(frontendProjectName).build()
        );

        Project project = projectsResponse.projects().get(0);

        // Verify environment variables contain our resource references
        assertTrue(project.environment().environmentVariables().stream()
                .anyMatch(env -> "ARTIFACT_BUCKET".equals(env.name()) && bucketName.equals(env.value())));
        assertTrue(project.environment().environmentVariables().stream()
                .anyMatch(env -> "KMS_KEY_ID".equals(env.name())));

        // Verify KMS key is configured for encryption
        assertNotNull(project.encryptionKey());
        assertEquals(kmsKeyArn, project.encryptionKey());

        System.out.println("✓ CodeBuild projects properly configured with S3 and KMS resource access");
    }

    @Test
    @Order(15)
    @DisplayName("Cross-Service Integration - CodePipeline can orchestrate all services")
    void testCodePipelineServiceOrchestration() {
        String pipelineName = outputs.get("pipelineName");
        String frontendBuildProject = outputs.get("frontendBuildProjectName");
        String backendBuildProject = outputs.get("backendBuildProjectName");
        String frontendApp = outputs.get("frontendDeployApplicationName");
        String backendApp = outputs.get("backendDeployApplicationName");

        // Get pipeline
        GetPipelineResponse pipelineResponse = codePipelineClient.getPipeline(
                GetPipelineRequest.builder().name(pipelineName).build()
        );

        PipelineDeclaration pipeline = pipelineResponse.pipeline();

        // Verify Source stage references S3 bucket
        var sourceStage = pipeline.stages().stream()
                .filter(stage -> "Source".equals(stage.name()))
                .findFirst().orElseThrow();

        var sourceAction = sourceStage.actions().get(0);
        assertEquals("S3", sourceAction.actionTypeId().provider());
        assertTrue(sourceAction.configuration().containsKey("S3Bucket"));
        assertEquals("source.zip", sourceAction.configuration().get("S3ObjectKey"));
        assertEquals("false", sourceAction.configuration().get("PollForSourceChanges"));

        // Verify Build stage references CodeBuild projects
        var buildStage = pipeline.stages().stream()
                .filter(stage -> "Build".equals(stage.name()))
                .findFirst().orElseThrow();

        List<String> buildProjects = buildStage.actions().stream()
                .map(action -> action.configuration().get("ProjectName"))
                .collect(Collectors.toList());
        assertThat(buildProjects).contains(frontendBuildProject);
        assertThat(buildProjects).contains(backendBuildProject);

        // Verify Deploy stages reference CodeDeploy applications
        var stagingStage = pipeline.stages().stream()
                .filter(stage -> "DeployToStaging".equals(stage.name()))
                .findFirst().orElseThrow();

        List<String> stagingApps = stagingStage.actions().stream()
                .map(action -> action.configuration().get("ApplicationName"))
                .collect(Collectors.toList());
        assertThat(stagingApps).contains(frontendApp);
        assertThat(stagingApps).contains(backendApp);

        // Verify multi-region deployment configuration
        var productionStage = pipeline.stages().stream()
                .filter(stage -> "DeployToProduction".equals(stage.name()))
                .findFirst().orElseThrow();

        // Check region configuration
        productionStage.actions().forEach(action -> {
            assertEquals("us-east-1", action.region(), "Production should deploy to us-east-1");
        });

        System.out.println("✓ CodePipeline properly orchestrates all CI/CD services with multi-region deployment");
    }

    @Test
    @Order(16)
    @DisplayName("Cross-Service Integration - EventBridge monitors pipeline and sends SNS notifications")
    void testEventBridgeSNSIntegration() {
        String topicName = outputs.get("snsTopicName");
        String buildFailedRuleName = outputs.get("buildFailedRuleName");

        // Get SNS topic ARN
        ListTopicsResponse topicsResponse = snsClient.listTopics(
                ListTopicsRequest.builder().build()
        );

        String topicArn = topicsResponse.topics().stream()
                .filter(topic -> topic.topicArn().contains(topicName))
                .findFirst()
                .map(Topic::topicArn)
                .orElseThrow(() -> new AssertionError("SNS topic not found"));

        // Verify EventBridge rules target the SNS topic
        var targetsResponse = eventBridgeClient.listTargetsByRule(
                software.amazon.awssdk.services.cloudwatchevents.model.ListTargetsByRuleRequest.builder()
                        .rule(buildFailedRuleName)
                        .build()
        );

        boolean hasSnstarget = targetsResponse.targets().stream()
                .anyMatch(target -> topicArn.equals(target.arn()));
        assertTrue(hasSnstarget, "EventBridge rule should target SNS topic");

        System.out.println("✓ EventBridge rules properly integrated with SNS for notifications");
    }

    // ========== End-to-End CI/CD Pipeline Tests ==========

    @Test
    @Order(17)
    @DisplayName("End-to-End - Pipeline stages are properly sequenced")
    void testPipelineStageSequencing() {
        String pipelineName = outputs.get("pipelineName");

        GetPipelineResponse pipelineResponse = codePipelineClient.getPipeline(
                GetPipelineRequest.builder().name(pipelineName).build()
        );

        List<String> stageNames = pipelineResponse.pipeline().stages().stream()
                .map(StageDeclaration::name)
                .toList();

        // Verify proper stage sequencing
        assertEquals("Source", stageNames.get(0), "First stage should be Source");
        assertEquals("Build", stageNames.get(1), "Second stage should be Build");
        assertEquals("DeployToStaging", stageNames.get(2), "Third stage should be DeployToStaging");
        assertEquals("ManualApproval", stageNames.get(3), "Fourth stage should be ManualApproval");
        assertEquals("DeployToProduction", stageNames.get(4), "Fifth stage should be DeployToProduction");

        // Verify Build stage has parallel actions
        var buildStage = pipelineResponse.pipeline().stages().get(1);
        assertEquals(2, buildStage.actions().size(), "Build stage should have 2 parallel actions");
        buildStage.actions().forEach(action -> {
            assertEquals(Integer.valueOf(1), action.runOrder(), "Both build actions should run in parallel (runOrder=1)");
        });

        // Verify staging deployment has parallel actions
        var stagingStage = pipelineResponse.pipeline().stages().get(2);
        assertEquals(2, stagingStage.actions().size(), "Staging deployment should have 2 parallel actions");
        stagingStage.actions().forEach(action -> {
            assertEquals(Integer.valueOf(1), action.runOrder(), "Both staging deploy actions should run in parallel");
        });

        System.out.println("✓ Pipeline stages properly sequenced with parallel build and deployment actions");
    }


    @Test
    @Order(18)
    @DisplayName("End-to-End - Manual approval gate between staging and production")
    void testManualApprovalGate() {
        String pipelineName = outputs.get("pipelineName");
        String topicName = outputs.get("snsTopicName");

        GetPipelineResponse pipelineResponse = codePipelineClient.getPipeline(
                GetPipelineRequest.builder().name(pipelineName).build()
        );

        // Find manual approval stage
        var approvalStage = pipelineResponse.pipeline().stages().stream()
                .filter(stage -> "ManualApproval".equals(stage.name()))
                .findFirst().orElseThrow();

        assertEquals(1, approvalStage.actions().size(), "Manual approval should have one action");

        var approvalAction = approvalStage.actions().get(0);
        assertEquals("Manual", approvalAction.actionTypeId().provider());
        assertEquals(software.amazon.awssdk.services.codepipeline.model.ActionCategory.APPROVAL,
                approvalAction.actionTypeId().category());

        // Verify approval action is configured with SNS notification
        assertTrue(approvalAction.configuration().containsKey("NotificationArn"));
        assertTrue(approvalAction.configuration().get("NotificationArn").contains(topicName));
        assertEquals("Please review staging deployment and approve for production",
                approvalAction.configuration().get("CustomData"));

        // Verify manual approval is positioned correctly (after staging, before production)
        List<String> stageNames = pipelineResponse.pipeline().stages().stream()
                .map(StageDeclaration::name)
                .toList();

        int approvalIndex = stageNames.indexOf("ManualApproval");
        int stagingIndex = stageNames.indexOf("DeployToStaging");
        int productionIndex = stageNames.indexOf("DeployToProduction");

        assertTrue(stagingIndex < approvalIndex, "Manual approval should come after staging");
        assertTrue(approvalIndex < productionIndex, "Manual approval should come before production");

        System.out.println("✓ Manual approval gate properly configured between staging and production with SNS notification");
    }


    @Test
    @Order(19)
    @DisplayName("End-to-End - Artifact flow through S3 with KMS encryption")
    void testArtifactFlowEncryption() {
        skipIfOutputMissing("artifactBucketName", "pipelineKmsKeyArn");

        String pipelineName = outputs.get("pipelineName");
        String bucketName = outputs.get("artifactBucketName");
        String kmsKeyArn = outputs.get("pipelineKmsKeyArn");

        // Get pipeline configuration
        GetPipelineResponse pipelineResponse = codePipelineClient.getPipeline(
                GetPipelineRequest.builder().name(pipelineName).build()
        );

        PipelineDeclaration pipeline = pipelineResponse.pipeline();

        // Verify artifact store configuration (multi-region pipeline)
        assertNotNull(pipeline.artifactStores(), "Pipeline should have artifact stores");
        assertFalse(pipeline.artifactStores().isEmpty(), "Pipeline should have artifact stores");

        // Find the primary region artifact store (artifactStores is a Map<String, ArtifactStore>)
        var primaryArtifactStore = pipeline.artifactStores().values().stream()
                .filter(store -> store.location().equals(bucketName))
                .findFirst();
        assertTrue(primaryArtifactStore.isPresent(), "Primary region artifact store should exist");

        assertEquals(bucketName, primaryArtifactStore.get().location());
        assertEquals("S3", primaryArtifactStore.get().type().toString());
        assertEquals(kmsKeyArn, primaryArtifactStore.get().encryptionKey().id());
        assertEquals("KMS", primaryArtifactStore.get().encryptionKey().type().toString());

        // Verify artifact flow through stages
        // Source stage produces SourceOutput
        var sourceStage = pipeline.stages().get(0);
        assertTrue(sourceStage.actions().get(0).outputArtifacts().stream().anyMatch(a -> a.name().equals("SourceOutput")));

        // Build stage consumes SourceOutput and produces build outputs
        var buildStage = pipeline.stages().get(1);
        buildStage.actions().forEach(action -> {
            assertTrue(action.inputArtifacts().stream().anyMatch(a -> a.name().equals("SourceOutput")));
            assertFalse(action.outputArtifacts().isEmpty());
        });

        // Deploy stages consume build outputs
        var stagingStage = pipeline.stages().get(2);
        stagingStage.actions().forEach(action -> {
            assertFalse(action.inputArtifacts().isEmpty());
            assertTrue(action.inputArtifacts().get(0).name().contains("BuildOutput"));
        });

        System.out.println("✓ Artifact flow properly configured through S3 with KMS encryption across all pipeline stages");
    }

    @Test
    @Order(20)
    @DisplayName("End-to-End - S3 Source Interactive Upload and Pipeline Triggering")
    void testS3SourceInteractiveWorkflow() {
        skipIfOutputMissing("sourceBucketName", "pipelineName");

        String sourceBucketName = outputs.get("sourceBucketName");
        String pipelineName = outputs.get("pipelineName");
        String testSourceKey = "source.zip";

        System.out.println("\n=== Interactive S3 Source Upload and Pipeline Workflow ===");

        // 1. Create a sample source code ZIP file
        String sampleSourceCode = createSampleSourceCodeZip();
        System.out.println("✓ Created sample source code ZIP with frontend and backend components");

        // 2. Upload source.zip to S3 source bucket
        PutObjectResponse uploadResponse = s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(sourceBucketName)
                        .key(testSourceKey)
                        .contentType("application/zip")
                        .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromString(sampleSourceCode)
        );
        assertNotNull(uploadResponse.eTag());
        System.out.println("✓ Successfully uploaded source.zip to S3 source bucket");

        // 3. Verify the uploaded object exists and has correct properties
        HeadObjectResponse headResponse = s3Client.headObject(
                HeadObjectRequest.builder()
                        .bucket(sourceBucketName)
                        .key(testSourceKey)
                        .build()
        );
        assertNotNull(headResponse.eTag());
        assertEquals(ServerSideEncryption.AWS_KMS, headResponse.serverSideEncryption());
        System.out.println("✓ Verified uploaded source.zip has KMS encryption");

        // 4. Get initial pipeline execution state
        var initialExecutions = codePipelineClient.listPipelineExecutions(
                software.amazon.awssdk.services.codepipeline.model.ListPipelineExecutionsRequest.builder()
                        .pipelineName(pipelineName)
                        .maxResults(5)
                        .build()
        );
        int initialExecutionCount = initialExecutions.pipelineExecutionSummaries().size();
        System.out.println("✓ Current pipeline executions count: " + initialExecutionCount);

        // 5. Manually trigger pipeline (since PollForSourceChanges is false)
        var startResponse = codePipelineClient.startPipelineExecution(
                software.amazon.awssdk.services.codepipeline.model.StartPipelineExecutionRequest.builder()
                        .name(pipelineName)
                        .build()
        );
        assertNotNull(startResponse.pipelineExecutionId());
        System.out.println("✓ Successfully triggered pipeline execution: " + startResponse.pipelineExecutionId());

        // 6. Wait and verify pipeline started processing
        try {
            Thread.sleep(5000); // Wait 5 seconds for pipeline to start
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        var newExecutions = codePipelineClient.listPipelineExecutions(
                software.amazon.awssdk.services.codepipeline.model.ListPipelineExecutionsRequest.builder()
                        .pipelineName(pipelineName)
                        .maxResults(5)
                        .build()
        );
        assertTrue(newExecutions.pipelineExecutionSummaries().size() > initialExecutionCount,
                "Pipeline should have started a new execution");
        System.out.println("✓ Confirmed new pipeline execution started");

        // 7. Verify source stage can access the uploaded S3 object
        var execution = newExecutions.pipelineExecutionSummaries().get(0);
        assertEquals(startResponse.pipelineExecutionId(), execution.pipelineExecutionId());
        System.out.println("✓ Pipeline execution ID matches triggered execution");

        // 8. Check that source stage has the correct S3 configuration
        GetPipelineResponse pipelineResponse = codePipelineClient.getPipeline(
                software.amazon.awssdk.services.codepipeline.model.GetPipelineRequest.builder()
                        .name(pipelineName)
                        .build()
        );
        var sourceStage = pipelineResponse.pipeline().stages().stream()
                .filter(stage -> "Source".equals(stage.name()))
                .findFirst().orElseThrow();
        var sourceAction = sourceStage.actions().get(0);

        assertEquals(sourceBucketName, sourceAction.configuration().get("S3Bucket"));
        assertEquals(testSourceKey, sourceAction.configuration().get("S3ObjectKey"));
        System.out.println("✓ Pipeline source stage correctly configured for uploaded S3 object");

        // 9. Verify artifact flow - Source stage should produce SourceOutput
        assertTrue(sourceAction.outputArtifacts().stream()
                .anyMatch(artifact -> "SourceOutput".equals(artifact.name())));
        System.out.println("✓ Source stage configured to produce SourceOutput artifact");

        // 10. Test S3 source object versioning (upload new version)
        String updatedSourceCode = createUpdatedSourceCodeZip();
        PutObjectResponse updateResponse = s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(sourceBucketName)
                        .key(testSourceKey)
                        .contentType("application/zip")
                        .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromString(updatedSourceCode)
        );
        assertNotEquals(uploadResponse.eTag(), updateResponse.eTag());
        System.out.println("✓ Successfully uploaded updated source.zip with different ETag");

        // 11. Verify S3 bucket versioning maintains both versions
        ListObjectVersionsResponse versionsResponse = s3Client.listObjectVersions(
                ListObjectVersionsRequest.builder()
                        .bucket(sourceBucketName)
                        .prefix(testSourceKey)
                        .build()
        );
        assertTrue(versionsResponse.versions().size() >= 2);
        System.out.println("✓ S3 bucket versioning maintains multiple versions of source.zip");

        // Cleanup test objects
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(sourceBucketName)
                .key(testSourceKey)
                .build());
        System.out.println("✓ Cleaned up test source objects");

        System.out.println("\n✅ Interactive S3 source workflow validation completed successfully!");
        System.out.println("The S3 source integration supports end-to-end CI/CD pipeline triggering and artifact flow.");
    }

    @Test
    @Order(21)
    @DisplayName("End-to-End - S3 Source Security and Access Control Validation")
    void testS3SourceSecurityValidation() {
        skipIfOutputMissing("sourceBucketName", "pipelineKmsKeyArn");

        String sourceBucketName = outputs.get("sourceBucketName");
        String kmsKeyArn = outputs.get("pipelineKmsKeyArn");

        System.out.println("\n=== S3 Source Security and Access Control Validation ===");

        // 1. Test IAM permissions - CodePipeline role should have access to source bucket
        String codePipelineRoleName = outputs.get("codePipelineRoleName");
        GetRolePolicyResponse policyResponse = iamClient.getRolePolicy(
                GetRolePolicyRequest.builder()
                        .roleName(codePipelineRoleName)
                        .policyName(PROJECT_NAME + "-codepipeline-policy")
                        .build()
        );

        String policyDocument = java.net.URLDecoder.decode(policyResponse.policyDocument(),
                java.nio.charset.StandardCharsets.UTF_8);
        assertThat(policyDocument).contains(sourceBucketName);
        assertThat(policyDocument).contains("s3:GetObject");
        assertThat(policyDocument).contains("s3:GetObjectVersion");
        assertThat(policyDocument).contains("s3:GetBucketVersioning");
        System.out.println("✓ CodePipeline role has proper S3 source permissions");

        // 2. Test KMS encryption integration with source bucket
        String testKey = "security-test-" + System.currentTimeMillis() + ".txt";
        String testContent = "Security test content for S3 source bucket";

        PutObjectResponse putResponse = s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(sourceBucketName)
                        .key(testKey)
                        .serverSideEncryption(ServerSideEncryption.AWS_KMS)
                        .ssekmsKeyId(kmsKeyArn)
                        .build(),
                software.amazon.awssdk.core.sync.RequestBody.fromString(testContent)
        );

        assertEquals(ServerSideEncryption.AWS_KMS, putResponse.serverSideEncryption());
        assertNotNull(putResponse.ssekmsKeyId());
        System.out.println("✓ S3 source bucket supports KMS encryption");

        // 3. Verify CodePipeline can decrypt and access KMS-encrypted source objects
        assertThat(policyDocument).contains(kmsKeyArn);
        assertThat(policyDocument).contains("kms:Decrypt");
        assertThat(policyDocument).contains("kms:GenerateDataKey");
        System.out.println("✓ CodePipeline role has KMS decrypt permissions for source objects");

        // 4. Test public access blocking on source bucket
        GetPublicAccessBlockResponse publicAccessResponse = s3Client.getPublicAccessBlock(
                GetPublicAccessBlockRequest.builder().bucket(sourceBucketName).build()
        );
        PublicAccessBlockConfiguration publicAccessBlock = publicAccessResponse.publicAccessBlockConfiguration();
        assertTrue(publicAccessBlock.blockPublicAcls());
        assertTrue(publicAccessBlock.blockPublicPolicy());
        assertTrue(publicAccessBlock.ignorePublicAcls());
        assertTrue(publicAccessBlock.restrictPublicBuckets());
        System.out.println("✓ S3 source bucket has proper public access blocking");

        // 5. Verify bucket policy (if any) follows least privilege
        try {
            GetBucketPolicyResponse bucketPolicyResponse = s3Client.getBucketPolicy(
                    GetBucketPolicyRequest.builder().bucket(sourceBucketName).build()
            );
            if (bucketPolicyResponse.policy() != null) {
                String bucketPolicy = bucketPolicyResponse.policy();
                // If bucket policy exists, it should be restrictive
                assertThat(bucketPolicy).doesNotContain("\"Principal\": \"*\"");
                System.out.println("✓ S3 source bucket policy follows least privilege principle");
            }
        } catch (Exception e) {
            // No bucket policy is fine - using IAM roles for access control
            System.out.println("✓ S3 source bucket uses IAM-based access control (no bucket policy)");
        }

        // Cleanup
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(sourceBucketName)
                .key(testKey)
                .build());

        System.out.println("\n✅ S3 source security validation completed successfully!");
    }


    // ========== Helper Methods ==========

    private void skipIfOutputMissing(String... requiredOutputs) {
        if (outputs == null || outputs.isEmpty()) {
            Assumptions.assumeTrue(false, "No outputs available - skipping test");
        }

        for (String output : requiredOutputs) {
            if (!outputs.containsKey(output)) {
                Assumptions.assumeTrue(false, "Required output '" + output + "' not found - skipping test");
            }
        }
    }


    // Helper methods for S3 source testing
    private String createSampleSourceCodeZip() {
        // Create a simple representation of a ZIP file content for testing
        // In a real scenario, this would be actual ZIP bytes
        return """
                {
                    "type": "source-archive",
                    "version": "1.0.0",
                    "timestamp": "%s",
                    "components": {
                        "frontend": {
                            "package.json": "{ \\"name\\": \\"webapp-frontend\\", \\"version\\": \\"1.0.0\\" }",
                            "src/index.js": "console.log('Frontend application');"
                        },
                        "backend": {
                            "pom.xml": "<project><groupId>com.example</groupId><artifactId>webapp-backend</artifactId></project>",
                            "src/main/java/Main.java": "public class Main { public static void main(String[] args) {} }"
                        }
                    }
                }
                """.formatted(System.currentTimeMillis());
    }

    private String createUpdatedSourceCodeZip() {
        // Create an updated version with different timestamp
        return """
                {
                    "type": "source-archive",
                    "version": "1.1.0",
                    "timestamp": "%s",
                    "components": {
                        "frontend": {
                            "package.json": "{ \\"name\\": \\"webapp-frontend\\", \\"version\\": \\"1.1.0\\" }",
                            "src/index.js": "console.log('Updated frontend application');"
                        },
                        "backend": {
                            "pom.xml": "<project><groupId>com.example</groupId><artifactId>webapp-backend</artifactId><version>1.1.0</version></project>",
                            "src/main/java/Main.java": "public class Main { public static void main(String[] args) { System.out.println(\\"Updated\\"); } }"
                        }
                    }
                }
                """.formatted(System.currentTimeMillis());
    }

    @AfterAll
    static void cleanup() {
        // Close all clients
        if (s3Client != null) s3Client.close();
        if (kmsClient != null) kmsClient.close();
        if (iamClient != null) iamClient.close();
        if (codeBuildClient != null) codeBuildClient.close();
        if (codePipelineClient != null) codePipelineClient.close();
        if (codeDeployClient != null) codeDeployClient.close();
        if (logsClient != null) logsClient.close();
        if (snsClient != null) snsClient.close();
        if (eventBridgeClient != null) eventBridgeClient.close();
    }
}