package app;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cloudformation.CloudFormationClient;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksRequest;
import software.amazon.awssdk.services.cloudformation.model.DescribeStacksResponse;
import software.amazon.awssdk.services.cloudformation.model.Output;
import software.amazon.awssdk.services.cloudformation.model.Stack;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.elasticache.ElastiCacheClient;
import software.amazon.awssdk.services.elasticache.model.DescribeReplicationGroupsRequest;
import software.amazon.awssdk.services.elasticache.model.DescribeReplicationGroupsResponse;
import software.amazon.awssdk.services.rds.RdsClient;
import software.amazon.awssdk.services.sagemaker.SageMakerClient;
import software.amazon.awssdk.services.sagemaker.model.DescribeEndpointRequest;
import software.amazon.awssdk.services.sagemaker.model.DescribeEndpointResponse;
import software.amazon.awssdk.services.elasticloadbalancingv2.ElasticLoadBalancingV2Client;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeLoadBalancersRequest;
import software.amazon.awssdk.services.elasticloadbalancingv2.model.DescribeTargetHealthRequest;
import software.amazon.awssdk.services.cloudfront.CloudFrontClient;
import software.amazon.awssdk.services.cloudfront.model.GetDistributionRequest;
import software.amazon.awssdk.core.sync.RequestBody;

import java.util.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Real end-to-end integration tests for TapStack deployed infrastructure.
 * 
 * These tests connect to actual AWS resources and verify functionality.
 * Requires deployed infrastructure and valid AWS credentials.
 * 
 * Note: Redis/ElastiCache tests have been removed as they require VPN access to private subnets.
 * 
 * Environment Variables Required:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - ENVIRONMENT_SUFFIX (default: dev)
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class MainIntegrationTest {

    private static final Region REGION = Region.US_WEST_2;
    private String environmentSuffix;
    private String stackName;
    
    // AWS Clients
    private CloudFormationClient cfnClient;
    private DynamoDbClient dynamoDbClient;
    private S3Client s3Client;
    private ElastiCacheClient elastiCacheClient;
    private RdsClient rdsClient;
    private SageMakerClient sageMakerClient;
    private ElasticLoadBalancingV2Client elbClient;
    private CloudFrontClient cloudFrontClient;
    
    // Stack Outputs
    private Map<String, String> stackOutputs;
    private String albDnsName;
    private String webSocketApiUrl;
    private String cloudFrontDomain;
    private String mediaBucketName;
    private String auroraWriteEndpoint;
    private String auroraReadEndpoint;
    private String userGraphTableName;
    private String postTableName;
    private String redisEndpoint;
    private String feedRankingEndpointName;
    private String viralDetectionEndpointName;
    
    @BeforeAll
    public void setUp() {
        // Get environment suffix
        environmentSuffix = System.getenv().getOrDefault("ENVIRONMENT_SUFFIX", "dev");
        stackName = "TapStack" + environmentSuffix;
        
        // Get AWS credentials from environment
        String awsAccessKey = System.getenv("AWS_ACCESS_KEY_ID");
        String awsSecretKey = System.getenv("AWS_SECRET_ACCESS_KEY");
        
        assertThat(awsAccessKey).as("AWS_ACCESS_KEY_ID must be set").isNotNull();
        assertThat(awsSecretKey).as("AWS_SECRET_ACCESS_KEY must be set").isNotNull();
        
        AwsBasicCredentials credentials = AwsBasicCredentials.create(awsAccessKey, awsSecretKey);
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        
        // Initialize AWS clients
        cfnClient = CloudFormationClient.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        dynamoDbClient = DynamoDbClient.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        s3Client = S3Client.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        elastiCacheClient = ElastiCacheClient.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        rdsClient = RdsClient.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        sageMakerClient = SageMakerClient.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        elbClient = ElasticLoadBalancingV2Client.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
                
        cloudFrontClient = CloudFrontClient.builder()
                .region(REGION)
                .credentialsProvider(credentialsProvider)
                .build();
        
        // Load stack outputs
        loadStackOutputs();
    }
    
    private void loadStackOutputs() {
        DescribeStacksResponse response = cfnClient.describeStacks(
            DescribeStacksRequest.builder()
                .stackName(stackName)
                .build()
        );
        
        Stack stack = response.stacks().get(0);
        stackOutputs = new HashMap<>();
        
        for (Output output : stack.outputs()) {
            stackOutputs.put(output.outputKey(), output.outputValue());
        }
        
        // Extract outputs
        albDnsName = stackOutputs.get("AlbDnsName");
        webSocketApiUrl = stackOutputs.get("WebSocketApiUrl");
        cloudFrontDomain = stackOutputs.get("CloudFrontDomain");
        mediaBucketName = stackOutputs.get("MediaBucketName");
        auroraWriteEndpoint = stackOutputs.get("AuroraClusterEndpoint");
        auroraReadEndpoint = stackOutputs.get("AuroraReaderEndpoint");
        userGraphTableName = stackOutputs.get("UserGraphTableName");
        postTableName = stackOutputs.get("PostTableName");
        redisEndpoint = stackOutputs.get("RedisEndpoint");
        feedRankingEndpointName = stackOutputs.get("FeedRankingEndpoint");
        viralDetectionEndpointName = stackOutputs.get("ViralDetectionEndpoint");
        
        System.out.println("Loaded stack outputs for: " + stackName);
    }

    // ==================== DynamoDB Integration Tests ====================
    
    @Test
    public void testDynamoDBUserGraphTableExists() {
        DescribeTableResponse response = dynamoDbClient.describeTable(
            DescribeTableRequest.builder()
                .tableName(userGraphTableName)
                .build()
        );
        
        assertThat(response.table().tableName()).isEqualTo(userGraphTableName);
        assertThat(response.table().tableStatus()).isEqualTo(TableStatus.ACTIVE);
    }
    
    @Test
    public void testDynamoDBPostTableExists() {
        DescribeTableResponse response = dynamoDbClient.describeTable(
            DescribeTableRequest.builder()
                .tableName(postTableName)
                .build()
        );
        
        assertThat(response.table().tableName()).isEqualTo(postTableName);
        assertThat(response.table().tableStatus()).isEqualTo(TableStatus.ACTIVE);
    }
    
    @Test
    public void testPutUserGraphConnection() {
        String testUserId = "test-user-" + System.currentTimeMillis();
        String friendId = "friend-" + System.currentTimeMillis();
        
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("userId", AttributeValue.builder().s(testUserId).build());
        item.put("friendId", AttributeValue.builder().s(friendId).build());
        item.put("connectionType", AttributeValue.builder().s("friend").build());
        item.put("timestamp", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());
        
        PutItemResponse response = dynamoDbClient.putItem(
            PutItemRequest.builder()
                .tableName(userGraphTableName)
                .item(item)
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testPutPostItem() {
        String postId = "post-" + System.currentTimeMillis();
        long timestamp = System.currentTimeMillis();
        
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("postId", AttributeValue.builder().s(postId).build());
        item.put("timestamp", AttributeValue.builder().n(String.valueOf(timestamp)).build());
        item.put("userId", AttributeValue.builder().s("user-123").build());
        item.put("content", AttributeValue.builder().s("This is a test post").build());
        item.put("likes", AttributeValue.builder().n("0").build());
        
        PutItemResponse response = dynamoDbClient.putItem(
            PutItemRequest.builder()
                .tableName(postTableName)
                .item(item)
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testQueryPostsByTimestamp() {
        // Put multiple posts first
        String userId = "user-query-test";
        for (int i = 0; i < 3; i++) {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("postId", AttributeValue.builder().s("post-" + i).build());
            item.put("timestamp", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis() + i)).build());
            item.put("userId", AttributeValue.builder().s(userId).build());
            
            dynamoDbClient.putItem(
                PutItemRequest.builder()
                    .tableName(postTableName)
                    .item(item)
                    .build()
            );
        }
        
        // Query using GSI
        QueryResponse response = dynamoDbClient.query(
            QueryRequest.builder()
                .tableName(postTableName)
                .indexName("UserPostsIndex")
                .keyConditionExpression("userId = :userId")
                .expressionAttributeValues(Map.of(
                    ":userId", AttributeValue.builder().s(userId).build()
                ))
                .build()
        );
        
        assertThat(response.count()).isGreaterThanOrEqualTo(3);
    }
    
    @Test
    public void testBatchWriteToUserGraph() {
        List<WriteRequest> writeRequests = new ArrayList<>();
        
        for (int i = 0; i < 10; i++) {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("userId", AttributeValue.builder().s("batch-user-" + i).build());
            item.put("friendId", AttributeValue.builder().s("friend-" + i).build());
            
            writeRequests.add(WriteRequest.builder()
                .putRequest(PutRequest.builder().item(item).build())
                .build());
        }
        
        BatchWriteItemResponse response = dynamoDbClient.batchWriteItem(
            BatchWriteItemRequest.builder()
                .requestItems(Map.of(userGraphTableName, writeRequests))
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testScanUserGraphTable() {
        ScanResponse response = dynamoDbClient.scan(
            ScanRequest.builder()
                .tableName(userGraphTableName)
                .limit(10)
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
        assertThat(response.items()).isNotNull();
    }

    // ==================== S3 Integration Tests ====================
    
    @Test
    public void testS3MediaBucketExists() {
        HeadBucketResponse response = s3Client.headBucket(
            HeadBucketRequest.builder()
                .bucket(mediaBucketName)
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testUploadImageToS3() {
        String key = "test-images/test-" + System.currentTimeMillis() + ".jpg";
        String content = "fake image data";
        
        PutObjectResponse response = s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(key)
                .contentType("image/jpeg")
                .build(),
            RequestBody.fromString(content)
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
        assertThat(response.eTag()).isNotNull();
    }
    
    @Test
    public void testUploadVideoToS3() {
        String key = "test-videos/test-" + System.currentTimeMillis() + ".mp4";
        byte[] videoData = new byte[1024]; // Fake video data
        
        PutObjectResponse response = s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(key)
                .contentType("video/mp4")
                .build(),
            RequestBody.fromBytes(videoData)
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testGetObjectFromS3() throws Exception {
        // First upload
        String key = "test-get/test-" + System.currentTimeMillis() + ".txt";
        String content = "test content for retrieval";
        
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(key)
                .build(),
            RequestBody.fromString(content)
        );
        
        // Now get it
        GetObjectResponse response = s3Client.getObject(
            GetObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(key)
                .build()
        ).response();
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
        assertThat(response.contentLength()).isGreaterThan(0L);
    }
    
    @Test
    public void testListObjectsInS3() {
        ListObjectsV2Response response = s3Client.listObjectsV2(
            ListObjectsV2Request.builder()
                .bucket(mediaBucketName)
                .maxKeys(10)
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
        assertThat(response.contents()).isNotNull();
    }
    
    @Test
    public void testDeleteObjectFromS3() {
        // First upload
        String key = "test-delete/test-" + System.currentTimeMillis() + ".txt";
        
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(key)
                .build(),
            RequestBody.fromString("to be deleted")
        );
        
        // Now delete
        DeleteObjectResponse response = s3Client.deleteObject(
            DeleteObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(key)
                .build()
        );
        
        assertThat(response.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testS3BucketVersioning() {
        GetBucketVersioningResponse response = s3Client.getBucketVersioning(
            GetBucketVersioningRequest.builder()
                .bucket(mediaBucketName)
                .build()
        );
        
        assertThat(response.status()).isEqualTo(BucketVersioningStatus.ENABLED);
    }
    
    @Test
    public void testS3BucketEncryption() {
        GetBucketEncryptionResponse response = s3Client.getBucketEncryption(
            GetBucketEncryptionRequest.builder()
                .bucket(mediaBucketName)
                .build()
        );
        
        assertThat(response.serverSideEncryptionConfiguration()).isNotNull();
    }

    //  Load Balancer Integration Tests
    
    @Test
    public void testALBExists() {
        var response = elbClient.describeLoadBalancers(
            DescribeLoadBalancersRequest.builder().build()
        );
        
        boolean albFound = response.loadBalancers().stream()
            .anyMatch(lb -> lb.loadBalancerName().contains(environmentSuffix));
        
        assertThat(albFound).isTrue();
    }

    //  CloudFront Integration Tests 
    @Test
    public void testCloudFrontDistributionExists() {
        assertThat(cloudFrontDomain).isNotNull();
        assertThat(cloudFrontDomain).contains("cloudfront.net");
    }
    
    @Test
    public void testCloudFrontDistributionStatus() throws Exception {
        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
            
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://" + cloudFrontDomain))
            .timeout(Duration.ofSeconds(10))
            .GET()
            .build();
        
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        // CloudFront should be accessible
        assertThat(response.statusCode()).isIn(200, 403, 404); // 403 if no default object
    }

    // ==================== SageMaker Integration Tests ====================
    
    @Test
    public void testFeedRankingEndpointExists() {
        DescribeEndpointResponse response = sageMakerClient.describeEndpoint(
            DescribeEndpointRequest.builder()
                .endpointName(feedRankingEndpointName)
                .build()
        );
        
        assertThat(response.endpointName()).isEqualTo(feedRankingEndpointName);
        assertThat(response.endpointStatus().toString()).isIn("InService", "Creating", "Updating");
    }
    
    @Test
    public void testViralDetectionEndpointExists() {
        DescribeEndpointResponse response = sageMakerClient.describeEndpoint(
            DescribeEndpointRequest.builder()
                .endpointName(viralDetectionEndpointName)
                .build()
        );
        
        assertThat(response.endpointName()).isEqualTo(viralDetectionEndpointName);
        assertThat(response.endpointStatus().toString()).isIn("InService", "Creating", "Updating");
    }

    // ==================== WebSocket API Integration Tests ====================
    
    @Test
    public void testWebSocketApiEndpointExists() {
        assertThat(webSocketApiUrl).isNotNull();
        assertThat(webSocketApiUrl).contains("amazonaws.com");
    }

    //  Cross-Service Integration Tests 
    
    @Test
    public void testSocialGraphTraversal() {
        String userId = "graph-user-" + System.currentTimeMillis();
        
        // Create multiple friend connections
        for (int i = 0; i < 5; i++) {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("userId", AttributeValue.builder().s(userId).build());
            item.put("friendId", AttributeValue.builder().s("friend-" + i).build());
            item.put("connectionType", AttributeValue.builder().s("friend").build());
            
            dynamoDbClient.putItem(
                PutItemRequest.builder()
                    .tableName(userGraphTableName)
                    .item(item)
                    .build()
            );
        }
        
        // Query all friends
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("userId", AttributeValue.builder().s(userId).build());
        
        QueryResponse response = dynamoDbClient.query(
            QueryRequest.builder()
                .tableName(userGraphTableName)
                .keyConditionExpression("userId = :userId")
                .expressionAttributeValues(Map.of(
                    ":userId", AttributeValue.builder().s(userId).build()
                ))
                .build()
        );
        
        assertThat(response.count()).isEqualTo(5);
    }
    
    @Test
    public void testMediaProcessingPipeline() {
        String originalKey = "uploads/" + System.currentTimeMillis() + ".jpg";
        String processedKey = "processed/" + System.currentTimeMillis() + ".jpg";
        
        // 1. Upload original
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(originalKey)
                .build(),
            RequestBody.fromString("original image")
        );
        
        // 2. Simulate processing (in real system, Lambda would do this)
        // 3. Upload processed version
        s3Client.putObject(
            PutObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(processedKey)
                .build(),
            RequestBody.fromString("processed image")
        );
        
        // 4. Verify both exist
        HeadObjectResponse original = s3Client.headObject(
            HeadObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(originalKey)
                .build()
        );
        
        HeadObjectResponse processed = s3Client.headObject(
            HeadObjectRequest.builder()
                .bucket(mediaBucketName)
                .key(processedKey)
                .build()
        );
        
        assertThat(original.sdkHttpResponse().isSuccessful()).isTrue();
        assertThat(processed.sdkHttpResponse().isSuccessful()).isTrue();
    }
    
    @Test
    public void testHighVolumePostIngestion() {
        String userId = "bulk-user-" + System.currentTimeMillis();
        int postCount = 100;
        
        // Simulate high volume post creation
        for (int i = 0; i < postCount; i++) {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("postId", AttributeValue.builder().s("bulk-post-" + i).build());
            item.put("timestamp", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis() + i)).build());
            item.put("userId", AttributeValue.builder().s(userId).build());
            item.put("content", AttributeValue.builder().s("Bulk post " + i).build());
            
            dynamoDbClient.putItem(
                PutItemRequest.builder()
                    .tableName(postTableName)
                    .item(item)
                    .build()
            );
        }
        
        // Verify posts were created
        QueryResponse response = dynamoDbClient.query(
            QueryRequest.builder()
                .tableName(postTableName)
                .indexName("UserPostsIndex")
                .keyConditionExpression("userId = :userId")
                .expressionAttributeValues(Map.of(
                    ":userId", AttributeValue.builder().s(userId).build()
                ))
                .build()
        );
        
        assertThat(response.count()).isGreaterThanOrEqualTo(postCount);
    }
    
    @Test
    public void testStackOutputsCompleteness() {
        assertThat(stackOutputs).isNotEmpty();
        assertThat(albDnsName).isNotNull();
        assertThat(webSocketApiUrl).isNotNull();
        assertThat(cloudFrontDomain).isNotNull();
        assertThat(mediaBucketName).isNotNull();
        assertThat(auroraWriteEndpoint).isNotNull();
        assertThat(auroraReadEndpoint).isNotNull();
        assertThat(userGraphTableName).isNotNull();
        assertThat(postTableName).isNotNull();
        assertThat(redisEndpoint).isNotNull();
        assertThat(feedRankingEndpointName).isNotNull();
        assertThat(viralDetectionEndpointName).isNotNull();
    }
}