package app;

import app.constructs.*;
import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.Testing;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZones;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZonesConfig;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.provider.AwsProviderConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CDKTF Java MainStack template.
 * These tests validate resource configurations without deploying to AWS.
 */
@DisplayName("CDKTF MainStack Unit Tests")
public class MainTest {

    private MainStack stack;

    @BeforeEach
    void setup() {
        App app = Testing.app();
        stack = new MainStack(app, "test-stack");
    }

    // ========== MainStack Tests ==========

    @Test
    @DisplayName("MainStack synthesizes without errors")
    void testMainStackSynthesis() {
        String synthesized = Testing.synth(stack);
        assertNotNull(synthesized);
        assertTrue(synthesized.contains("resource"));
    }

    @Test
    @DisplayName("MainStack has correct stack ID")
    void testMainStackId() {
        assertEquals("test-stack", stack.getStackId());
    }

    @Test
    @DisplayName("MainStack creates AWS provider with correct region")
    void testAwsProviderConfiguration() {
        String synthesized = Testing.synth(stack);
        assertThat(synthesized).contains("\"region\": \"us-east-1\"");
        assertThat(synthesized).contains("\"aws\"");
    }

    @Test
    @DisplayName("MainStack creates all required outputs")
    void testMainStackOutputs() {
        String synthesized = Testing.synth(stack);

        // Kinesis outputs
        assertThat(synthesized).contains("kinesis-stream-name");
        assertThat(synthesized).contains("kinesis-stream-arn");
        assertThat(synthesized).contains("kinesis-shard-count");

        // S3 outputs
        assertThat(synthesized).contains("s3-bucket-name");
        assertThat(synthesized).contains("s3-bucket-arn");

        // Lambda outputs
        assertThat(synthesized).contains("lambda-function-name");
        assertThat(synthesized).contains("lambda-function-arn");
        assertThat(synthesized).contains("lambda-role-arn");

        // ECS outputs
        assertThat(synthesized).contains("ecs-cluster-name");
        assertThat(synthesized).contains("ecs-cluster-arn");
        assertThat(synthesized).contains("ecs-service-name");

        // VPC outputs
        assertThat(synthesized).contains("vpc-id");
        assertThat(synthesized).contains("vpc-cidr-block");
        assertThat(synthesized).contains("public-subnet-ids");
        assertThat(synthesized).contains("private-subnet-ids");
        assertThat(synthesized).contains("ecs-security-group-id");
    }

    // ========== StorageConstruct Tests ==========

    @Test
    @DisplayName("StorageConstruct creates S3 bucket with correct configuration")
    void testStorageConstructS3BucketCreation() {
        String synthesized = Testing.synth(stack);

        // Verify S3 bucket is created
        assertThat(synthesized).contains("aws_s3_bucket");
        assertThat(synthesized).contains("log-analytics-development-logs");

        // Verify bucket has tags
        assertThat(synthesized).contains("\"Purpose\": \"Long-term log storage\"");
        assertThat(synthesized).contains("\"Environment\": \"development\"");
        assertThat(synthesized).contains("\"Project\": \"Log Analytics\"");
    }

    @Test
    @DisplayName("StorageConstruct enables S3 bucket versioning")
    void testStorageConstructBucketVersioning() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_s3_bucket_versioning");
        assertThat(synthesized).contains("\"status\": \"Enabled\"");
    }

    @Test
    @DisplayName("StorageConstruct configures S3 bucket encryption")
    void testStorageConstructBucketEncryption() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_s3_bucket_server_side_encryption_configuration");
        assertThat(synthesized).contains("\"sse_algorithm\": \"AES256\"");
    }

    @Test
    @DisplayName("StorageConstruct configures S3 lifecycle rules")
    void testStorageConstructBucketLifecycle() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_s3_bucket_lifecycle_configuration");
        assertThat(synthesized).contains("archive-old-logs");
        assertThat(synthesized).contains("\"storage_class\": \"STANDARD_IA\"");
        assertThat(synthesized).contains("\"storage_class\": \"GLACIER\"");
        assertThat(synthesized).contains("\"days\": 30");
        assertThat(synthesized).contains("\"days\": 90");
    }

    @Test
    @DisplayName("StorageConstruct blocks S3 public access")
    void testStorageConstructPublicAccessBlock() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_s3_bucket_public_access_block");
        assertThat(synthesized).contains("\"block_public_acls\": true");
        assertThat(synthesized).contains("\"block_public_policy\": true");
        assertThat(synthesized).contains("\"ignore_public_acls\": true");
        assertThat(synthesized).contains("\"restrict_public_buckets\": true");
    }

    // ========== KinesisConstruct Tests ==========

    @Test
    @DisplayName("KinesisConstruct creates Kinesis stream with correct configuration")
    void testKinesisConstructStreamCreation() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_kinesis_stream");
        assertThat(synthesized).contains("log-analytics-development-log-stream");
        assertThat(synthesized).contains("\"shard_count\": 10");
        assertThat(synthesized).contains("\"retention_period\": 24");
    }

    @Test
    @DisplayName("KinesisConstruct enables encryption")
    void testKinesisConstructEncryption() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"encryption_type\": \"KMS\"");
        assertThat(synthesized).contains("\"kms_key_id\": \"alias/aws/kinesis\"");
    }

    @Test
    @DisplayName("KinesisConstruct configures stream mode as PROVISIONED")
    void testKinesisConstructStreamMode() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"stream_mode\": \"PROVISIONED\"");
    }

    @Test
    @DisplayName("KinesisConstruct enables shard-level metrics")
    void testKinesisConstructShardMetrics() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("IncomingBytes");
        assertThat(synthesized).contains("IncomingRecords");
        assertThat(synthesized).contains("OutgoingBytes");
        assertThat(synthesized).contains("OutgoingRecords");
    }

    @Test
    @DisplayName("KinesisConstruct has required tags")
    void testKinesisConstructTags() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"Purpose\": \"Real-time log ingestion\"");
        assertThat(synthesized).contains("\"Environment\": \"development\"");
    }

    // ========== NetworkingConstruct Tests ==========

    @Test
    @DisplayName("NetworkingConstruct creates VPC with correct CIDR")
    void testNetworkingConstructVpcCreation() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_vpc");
        assertThat(synthesized).contains("\"cidr_block\": \"10.0.0.0/16\"");
        assertThat(synthesized).contains("\"enable_dns_hostnames\": true");
        assertThat(synthesized).contains("\"enable_dns_support\": true");
    }

    @Test
    @DisplayName("NetworkingConstruct creates Internet Gateway")
    void testNetworkingConstructInternetGateway() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_internet_gateway");
    }

    @Test
    @DisplayName("NetworkingConstruct creates public subnets in multiple AZs")
    void testNetworkingConstructPublicSubnets() {
        String synthesized = Testing.synth(stack);

        // Should have 2 public subnets
        int publicSubnetCount = countOccurrences(synthesized, "log-analytics-development-public-subnet");
        assertEquals(2, publicSubnetCount);

        assertThat(synthesized).contains("\"cidr_block\": \"10.0.0.0/24\"");
        assertThat(synthesized).contains("\"cidr_block\": \"10.0.2.0/24\"");
        assertThat(synthesized).contains("\"map_public_ip_on_launch\": true");
    }

    @Test
    @DisplayName("NetworkingConstruct creates private subnets in multiple AZs")
    void testNetworkingConstructPrivateSubnets() {
        String synthesized = Testing.synth(stack);

        // Should have 2 private subnets
        int privateSubnetCount = countOccurrences(synthesized, "log-analytics-development-private-subnet");
        assertEquals(2, privateSubnetCount);

        assertThat(synthesized).contains("\"cidr_block\": \"10.0.1.0/24\"");
        assertThat(synthesized).contains("\"cidr_block\": \"10.0.3.0/24\"");
    }

    @Test
    @DisplayName("NetworkingConstruct creates NAT Gateways for high availability")
    void testNetworkingConstructNatGateways() {
        String synthesized = Testing.synth(stack);

        // Should have 2 NAT Gateways (one per AZ)
        assertThat(synthesized).contains("aws_nat_gateway");
        assertThat(synthesized).contains("aws_eip");

        int natGatewayCount = countOccurrences(synthesized, "aws_nat_gateway");
        assertTrue(natGatewayCount >= 2, "Should have at least 2 NAT Gateways");
    }

    @Test
    @DisplayName("NetworkingConstruct creates route tables for public and private subnets")
    void testNetworkingConstructRouteTables() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_route_table");
        assertThat(synthesized).contains("aws_route");
        assertThat(synthesized).contains("aws_route_table_association");

        // Should have public route table and 2 private route tables (one per AZ)
        assertThat(synthesized).contains("log-analytics-development-public-rt");
        assertThat(synthesized).contains("log-analytics-development-private-rt");
    }

    @Test
    @DisplayName("NetworkingConstruct creates ECS security group")
    void testNetworkingConstructSecurityGroup() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_security_group");
        assertThat(synthesized).contains("log-analytics-development-ecs-sg");
        assertThat(synthesized).contains("Security group for ECS tasks");
    }

    @Test
    @DisplayName("NetworkingConstruct security group allows all outbound traffic")
    void testNetworkingConstructSecurityGroupEgress() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"egress\"");
        assertThat(synthesized).contains("\"protocol\": \"-1\"");
        assertThat(synthesized).contains("\"0.0.0.0/0\"");
    }

    // ========== LambdaConstruct Tests ==========

    @Test
    @DisplayName("LambdaConstruct creates Lambda function with correct configuration")
    void testLambdaConstructFunctionCreation() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_lambda_function");
        assertThat(synthesized).contains("log-analytics-development-log-processor");
        assertThat(synthesized).contains("\"handler\": \"log_processor.handler\"");
        assertThat(synthesized).contains("\"runtime\": \"python3.9\"");
        assertThat(synthesized).contains("\"memory_size\": 512");
        assertThat(synthesized).contains("\"timeout\": 60");
        assertThat(synthesized).contains("\"reserved_concurrent_executions\": 100");
    }

    @Test
    @DisplayName("LambdaConstruct creates IAM role for Lambda")
    void testLambdaConstructIamRole() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_iam_role");
        assertThat(synthesized).contains("log-analytics-development-lambda-role");
        assertThat(synthesized).contains("sts:AssumeRole");
        assertThat(synthesized).contains("lambda.amazonaws.com");
    }

    @Test
    @DisplayName("LambdaConstruct attaches necessary IAM policies")
    void testLambdaConstructIamPolicies() {
        String synthesized = Testing.synth(stack);

        // Basic execution policy
        assertThat(synthesized).contains("AWSLambdaBasicExecutionRole");

        // Kinesis execution policy
        assertThat(synthesized).contains("AWSLambdaKinesisExecutionRole");

        // Custom S3 and CloudWatch policy
        assertThat(synthesized).contains("s3:PutObject");
        assertThat(synthesized).contains("s3:PutObjectAcl");
        assertThat(synthesized).contains("cloudwatch:PutMetricData");
    }

    @Test
    @DisplayName("LambdaConstruct configures environment variables")
    void testLambdaConstructEnvironmentVariables() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("S3_BUCKET");
        assertThat(synthesized).contains("ENVIRONMENT");
        assertThat(synthesized).contains("development");
    }

    @Test
    @DisplayName("LambdaConstruct creates CloudWatch log group")
    void testLambdaConstructLogGroup() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_cloudwatch_log_group");
        assertThat(synthesized).contains("/aws/lambda/log-analytics-development-processor");
        assertThat(synthesized).contains("\"retention_in_days\": 7");
    }

    @Test
    @DisplayName("LambdaConstruct enables X-Ray tracing")
    void testLambdaConstructXRayTracing() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"tracing_config\"");
        assertThat(synthesized).contains("\"mode\": \"Active\"");
    }

    @Test
    @DisplayName("LambdaConstruct creates Kinesis event source mapping")
    void testLambdaConstructEventSourceMapping() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_lambda_event_source_mapping");
        assertThat(synthesized).contains("\"starting_position\": \"LATEST\"");
        assertThat(synthesized).contains("\"parallelization_factor\": 10");
        assertThat(synthesized).contains("\"batch_size\": 100");
        assertThat(synthesized).contains("\"maximum_batching_window_in_seconds\": 5");
        assertThat(synthesized).contains("\"bisect_batch_on_function_error\": true");
        assertThat(synthesized).contains("\"maximum_retry_attempts\": 3");
    }

    // ========== EcsConstruct Tests ==========

    @Test
    @DisplayName("EcsConstruct creates ECS cluster with container insights")
    void testEcsConstructClusterCreation() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_ecs_cluster");
        assertThat(synthesized).contains("log-analytics-development-cluster");
        assertThat(synthesized).contains("containerInsights");
        assertThat(synthesized).contains("enabled");
    }

    @Test
    @DisplayName("EcsConstruct creates task execution role")
    void testEcsConstructTaskExecutionRole() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("log-analytics-development-ecs-task-execution-role");
        assertThat(synthesized).contains("ecs-tasks.amazonaws.com");
        assertThat(synthesized).contains("AmazonECSTaskExecutionRolePolicy");
    }

    @Test
    @DisplayName("EcsConstruct creates task role with Kinesis permissions")
    void testEcsConstructTaskRole() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("log-analytics-development-ecs-task-role");
        assertThat(synthesized).contains("kinesis:DescribeStream");
        assertThat(synthesized).contains("kinesis:GetShardIterator");
        assertThat(synthesized).contains("kinesis:GetRecords");
        assertThat(synthesized).contains("kinesis:PutRecord");
        assertThat(synthesized).contains("kinesis:PutRecords");
    }

    @Test
    @DisplayName("EcsConstruct creates task definition with correct configuration")
    void testEcsConstructTaskDefinition() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_ecs_task_definition");
        assertThat(synthesized).contains("log-analytics-development-log-processor");
        assertThat(synthesized).contains("FARGATE");
        assertThat(synthesized).contains("\"network_mode\": \"awsvpc\"");
        assertThat(synthesized).contains("\"cpu\": \"1024\"");
        assertThat(synthesized).contains("\"memory\": \"2048\"");
    }

    @Test
    @DisplayName("EcsConstruct configures container definition with environment variables")
    void testEcsConstructContainerDefinition() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("log-processor");
        assertThat(synthesized).contains("nginx:latest");
        assertThat(synthesized).contains("KINESIS_STREAM");
        assertThat(synthesized).contains("ENVIRONMENT");
    }

    @Test
    @DisplayName("EcsConstruct creates CloudWatch log group for ECS")
    void testEcsConstructLogGroup() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("/ecs/log-analytics-development-log-processor");
        assertThat(synthesized).contains("awslogs");
    }

    @Test
    @DisplayName("EcsConstruct configures health check for container")
    void testEcsConstructHealthCheck() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("healthCheck");
        assertThat(synthesized).contains("CMD-SHELL");
    }

    @Test
    @DisplayName("EcsConstruct creates ECS service with multi-AZ deployment")
    void testEcsConstructServiceCreation() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("aws_ecs_service");
        assertThat(synthesized).contains("log-analytics-development-log-processor-service");
        assertThat(synthesized).contains("\"desired_count\": 2");
        assertThat(synthesized).contains("\"launch_type\": \"FARGATE\"");
        assertThat(synthesized).contains("\"platform_version\": \"LATEST\"");
    }

    @Test
    @DisplayName("EcsConstruct configures network configuration for service")
    void testEcsConstructServiceNetworkConfiguration() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"network_configuration\"");
        assertThat(synthesized).contains("\"assign_public_ip\": false");
    }

    @Test
    @DisplayName("EcsConstruct enables deployment circuit breaker")
    void testEcsConstructCircuitBreaker() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"deployment_circuit_breaker\"");
        assertThat(synthesized).contains("\"enable\": true");
        assertThat(synthesized).contains("\"rollback\": true");
    }

    @Test
    @DisplayName("EcsConstruct configures deployment percentages")
    void testEcsConstructDeploymentConfiguration() {
        String synthesized = Testing.synth(stack);

        assertThat(synthesized).contains("\"deployment_maximum_percent\": 200");
        assertThat(synthesized).contains("\"deployment_minimum_healthy_percent\": 100");
    }

    // ========== Cross-Construct Integration Tests ==========

    @Test
    @DisplayName("Lambda function references correct Kinesis stream")
    void testLambdaKinesisIntegration() {
        String synthesized = Testing.synth(stack);

        // Verify Lambda event source mapping references Kinesis stream
        assertThat(synthesized).contains("aws_lambda_event_source_mapping");
        assertThat(synthesized).contains("aws_kinesis_stream");
    }

    @Test
    @DisplayName("Lambda function has access to S3 bucket")
    void testLambdaS3Integration() {
        String synthesized = Testing.synth(stack);

        // Verify Lambda has S3 permissions
        assertThat(synthesized).contains("s3:PutObject");
        // Verify Lambda environment variable references S3 bucket
        assertThat(synthesized).contains("S3_BUCKET");
    }

    @Test
    @DisplayName("ECS service uses VPC networking resources")
    void testEcsVpcIntegration() {
        String synthesized = Testing.synth(stack);

        // ECS service should reference subnets and security groups
        assertThat(synthesized).contains("network_configuration");
        assertThat(synthesized).contains("security_groups");
    }

    @Test
    @DisplayName("ECS task has access to Kinesis stream")
    void testEcsKinesisIntegration() {
        String synthesized = Testing.synth(stack);

        // Verify ECS task role has Kinesis permissions
        assertThat(synthesized).contains("kinesis:PutRecord");
        // Verify container definition has Kinesis stream environment variable
        assertThat(synthesized).contains("KINESIS_STREAM");
    }

    @Test
    @DisplayName("All resources have consistent naming convention")
    void testResourceNamingConsistency() {
        String synthesized = Testing.synth(stack);

        // All resources should use the same prefix
        String prefix = "log-analytics-development";

        assertThat(synthesized).contains(prefix + "-logs");
        assertThat(synthesized).contains(prefix + "-log-stream");
        assertThat(synthesized).contains(prefix + "-vpc");
        assertThat(synthesized).contains(prefix + "-log-processor");
        assertThat(synthesized).contains(prefix + "-cluster");
    }

    @Test
    @DisplayName("All resources have required tags")
    void testResourceTagging() {
        String synthesized = Testing.synth(stack);

        // Verify common tags are present
        assertThat(synthesized).contains("\"Environment\": \"development\"");
        assertThat(synthesized).contains("\"Project\": \"Log Analytics\"");
        assertThat(synthesized).contains("\"ManagedBy\": \"CDK For Terraform\"");
    }

    @Test
    @DisplayName("High availability requirements are met")
    void testHighAvailabilityConfiguration() {
        String synthesized = Testing.synth(stack);

        // Should have 2 AZs
        int publicSubnetCount = countOccurrences(synthesized, "log-analytics-development-public-subnet");
        assertTrue(publicSubnetCount >= 2, "Should have at least 2 public subnets for HA");

        int privateSubnetCount = countOccurrences(synthesized, "log-analytics-development-private-subnet");
        assertTrue(privateSubnetCount >= 2, "Should have at least 2 private subnets for HA");

        // ECS service should have desired count of 2
        assertThat(synthesized).contains("\"desired_count\": 2");

        // Should have 2 NAT Gateways (one per AZ)
        int natGatewayCount = countOccurrences(synthesized, "aws_nat_gateway");
        assertTrue(natGatewayCount >= 2, "Should have at least 2 NAT Gateways for HA");
    }

    @Test
    @DisplayName("Security best practices are followed")
    void testSecurityBestPractices() {
        String synthesized = Testing.synth(stack);

        // S3 bucket should block public access
        assertThat(synthesized).contains("\"block_public_acls\": true");
        assertThat(synthesized).contains("\"block_public_policy\": true");

        // S3 bucket should have encryption
        assertThat(synthesized).contains("\"sse_algorithm\": \"AES256\"");

        // S3 bucket should have versioning
        assertThat(synthesized).contains("\"status\": \"Enabled\"");

        // Kinesis should have encryption
        assertThat(synthesized).contains("\"encryption_type\": \"KMS\"");

        // ECS tasks should not have public IPs in private subnets
        assertThat(synthesized).contains("\"assign_public_ip\": false");
    }

    @Test
    @DisplayName("Configuration matches requirements from PROMPT.md")
    void testRequirementsCompliance() {
        String synthesized = Testing.synth(stack);

        // Kinesis retention should be 24 hours (as per requirement: no more than 24 hours)
        assertThat(synthesized).contains("\"retention_period\": 24");

        // Should have 10 Kinesis shards (configurable)
        assertThat(synthesized).contains("\"shard_count\": 10");

        // Lambda memory should be configurable (default 512MB)
        assertThat(synthesized).contains("\"memory_size\": 512");

        // VPC CIDR should be configurable
        assertThat(synthesized).contains("\"cidr_block\": \"10.0.0.0/16\"");

        // Multi-AZ deployment (at least 2 AZs) - check for public and private subnet resources
        int publicSubnetCount = countOccurrences(synthesized, "log-analytics-development-public-subnet");
        int privateSubnetCount = countOccurrences(synthesized, "log-analytics-development-private-subnet");

        assertTrue(publicSubnetCount >= 2, "Should have at least 2 public subnets for multi-AZ");
        assertTrue(privateSubnetCount >= 2, "Should have at least 2 private subnets for multi-AZ");
    }

    // ========== Helper Methods ==========

    private int countOccurrences(String text, String pattern) {
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(pattern, index)) != -1) {
            count++;
            index += pattern.length();
        }
        return count;
    }
}
