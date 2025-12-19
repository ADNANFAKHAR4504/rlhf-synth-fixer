### Reasoning Trace
---

This is a comprehensive request for building a real-time log analytics platform using CDK for Terraform with Java. Let me break down what needs to be included:

1. Core Requirements:
    - Process > 10,000 log events/second
    - Minimal latency
    - Amazon ECS for containerized log processing
    - Amazon Kinesis Data Streams for real-time log ingestion
    - AWS Lambda for stream processing
    - Amazon S3 for long-term storage
    - Multi-AZ deployment (at least 2 AZs)
    - Kinesis retention period <= 24 hours

2. Configuration Parameters:
    - VPC CIDR block
    - Deployment environment (dev/staging/prod)
    - Docker container image for log processor
    - Number of Kinesis shards
    - Lambda memory allocation

3. Design Requirements:
    - Clean, modular structure
    - Reusable logic in constructs package
    - Use Java records for configuration
    - No hardcoded values

Let me design a comprehensive solution with the following structure:
- Main application class
- Configuration record
- Constructs for each component (VPC, Kinesis, ECS, Lambda, S3)
- Clear separation of concerns

I'll need to include:
- VPC with public/private subnets across 2 AZs
- ECS cluster with Fargate service
- Kinesis Data Stream with configurable shards
- Lambda function for stream processing
- S3 bucket with lifecycle policies
- IAM roles and policies
- Security groups
- CloudWatch logs
### Answer
---

I'll help you build a comprehensive real-time log analytics platform using CDK for Terraform in Java. This solution will handle high-volume log processing with minimal latency while maintaining high availability across multiple availability zones.

## Project Structure

```
log-analytics-platform/
├── src/main/java/
│   ├── com/loganalytics/
│   │   ├── Main.java
│   │   ├── config/
│   │   │   └── PlatformConfig.java
│   │   └── constructs/
│   │       ├── NetworkingConstruct.java
│   │       ├── KinesisConstruct.java
│   │       ├── EcsConstruct.java
│   │       ├── LambdaConstruct.java
│   │       └── StorageConstruct.java
│   └── resources/
│       └── lambda/
│           └── log-processor.py
├── pom.xml
└── cdktf.json
```

## Implementation

### 1. Configuration Record

```java
package com.loganalytics.config;

public record PlatformConfig(
    String environment,
    String vpcCidrBlock,
    String containerImage,
    Integer kinesisShards,
    Integer lambdaMemory,
    String projectName
) {
    public PlatformConfig {
        // Validation
        if (environment == null || !environment.matches("development|staging|production")) {
            throw new IllegalArgumentException("Environment must be development, staging, or production");
        }
        if (vpcCidrBlock == null || vpcCidrBlock.isBlank()) {
            throw new IllegalArgumentException("VPC CIDR block is required");
        }
        if (containerImage == null || containerImage.isBlank()) {
            throw new IllegalArgumentException("Container image is required");
        }
        if (kinesisShards == null || kinesisShards < 1 || kinesisShards > 1000) {
            throw new IllegalArgumentException("Kinesis shards must be between 1 and 1000");
        }
        if (lambdaMemory == null || lambdaMemory < 128 || lambdaMemory > 10240) {
            throw new IllegalArgumentException("Lambda memory must be between 128 and 10240 MB");
        }
    }
    
    public String resourcePrefix() {
        return String.format("%s-%s", projectName, environment);
    }
}
```

### 2. Main Application Class

```java
package com.loganalytics;

import com.hashicorp.cdktf.*;
import com.hashicorp.cdktf.providers.aws.provider.AwsProvider;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZones;
import com.loganalytics.config.PlatformConfig;
import com.loganalytics.constructs.*;
import software.constructs.Construct;

public class Main extends TerraformStack {
    
    public Main(Construct scope, String id, PlatformConfig config) {
        super(scope, id);
        
        // Configure AWS Provider
        new AwsProvider(this, "aws", AwsProviderConfig.builder()
            .region("us-east-1")
            .defaultTags(AwsProviderDefaultTags.builder()
                .tags(java.util.Map.of(
                    "Environment", config.environment(),
                    "Project", config.projectName(),
                    "ManagedBy", "CDK-Terraform"
                ))
                .build())
            .build());
        
        // Get available AZs
        DataAwsAvailabilityZones azs = new DataAwsAvailabilityZones(this, "azs", 
            DataAwsAvailabilityZonesConfig.builder()
                .state("available")
                .build());
        
        // Create networking infrastructure
        NetworkingConstruct networking = new NetworkingConstruct(this, "networking", 
            config, azs);
        
        // Create Kinesis Data Stream
        KinesisConstruct kinesis = new KinesisConstruct(this, "kinesis", config);
        
        // Create S3 storage
        StorageConstruct storage = new StorageConstruct(this, "storage", config);
        
        // Create Lambda processor
        LambdaConstruct lambda = new LambdaConstruct(this, "lambda", 
            config, kinesis.getStream(), storage.getBucket());
        
        // Create ECS infrastructure
        EcsConstruct ecs = new EcsConstruct(this, "ecs", 
            config, networking.getVpc(), kinesis.getStream());
        
        // Output important values
        new TerraformOutput(this, "kinesis-stream-name", TerraformOutputConfig.builder()
            .value(kinesis.getStream().getName())
            .description("Name of the Kinesis Data Stream")
            .build());
        
        new TerraformOutput(this, "ecs-cluster-name", TerraformOutputConfig.builder()
            .value(ecs.getCluster().getName())
            .description("Name of the ECS cluster")
            .build());
        
        new TerraformOutput(this, "s3-bucket-name", TerraformOutputConfig.builder()
            .value(storage.getBucket().getBucket())
            .description("Name of the S3 bucket for log storage")
            .build());
    }
    
    public static void main(String[] args) {
        App app = new App();
        
        // Configuration from environment variables or defaults
        PlatformConfig config = new PlatformConfig(
            System.getenv().getOrDefault("ENVIRONMENT", "development"),
            System.getenv().getOrDefault("VPC_CIDR", "10.0.0.0/16"),
            System.getenv().getOrDefault("CONTAINER_IMAGE", "log-processor:latest"),
            Integer.parseInt(System.getenv().getOrDefault("KINESIS_SHARDS", "10")),
            Integer.parseInt(System.getenv().getOrDefault("LAMBDA_MEMORY", "512")),
            "log-analytics"
        );
        
        new Main(app, "log-analytics-platform", config);
        app.synth();
    }
}
```

### 3. Networking Construct

```java
package com.loganalytics.constructs;

import com.hashicorp.cdktf.providers.aws.vpc.*;
import com.hashicorp.cdktf.providers.aws.security_group.*;
import com.hashicorp.cdktf.providers.aws.data_aws_availability_zones.DataAwsAvailabilityZones;
import com.loganalytics.config.PlatformConfig;
import software.constructs.Construct;
import java.util.*;

public class NetworkingConstruct extends Construct {
    private final Vpc vpc;
    private final List<Subnet> publicSubnets;
    private final List<Subnet> privateSubnets;
    private final SecurityGroup ecsSecurityGroup;
    
    public NetworkingConstruct(Construct scope, String id, PlatformConfig config, 
                             DataAwsAvailabilityZones azs) {
        super(scope, id);
        
        // Create VPC
        this.vpc = new Vpc(this, "vpc", VpcConfig.builder()
            .cidrBlock(config.vpcCidrBlock())
            .enableDnsHostnames(true)
            .enableDnsSupport(true)
            .tags(Map.of("Name", config.resourcePrefix() + "-vpc"))
            .build());
        
        // Create Internet Gateway
        InternetGateway igw = new InternetGateway(this, "igw", InternetGatewayConfig.builder()
            .vpcId(vpc.getId())
            .tags(Map.of("Name", config.resourcePrefix() + "-igw"))
            .build());
        
        // Create public and private subnets in 2 AZs
        this.publicSubnets = new ArrayList<>();
        this.privateSubnets = new ArrayList<>();
        
        for (int i = 0; i < 2; i++) {
            String azName = azs.getNames().get(i);
            
            // Public subnet
            Subnet publicSubnet = new Subnet(this, "public-subnet-" + i, SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock("10.0." + (i * 2) + ".0/24")
                .availabilityZone(azName)
                .mapPublicIpOnLaunch(true)
                .tags(Map.of(
                    "Name", config.resourcePrefix() + "-public-subnet-" + (i + 1),
                    "Type", "Public"
                ))
                .build());
            publicSubnets.add(publicSubnet);
            
            // Private subnet
            Subnet privateSubnet = new Subnet(this, "private-subnet-" + i, SubnetConfig.builder()
                .vpcId(vpc.getId())
                .cidrBlock("10.0." + ((i * 2) + 1) + ".0/24")
                .availabilityZone(azName)
                .tags(Map.of(
                    "Name", config.resourcePrefix() + "-private-subnet-" + (i + 1),
                    "Type", "Private"
                ))
                .build());
            privateSubnets.add(privateSubnet);
        }
        
        // Create NAT Gateways for private subnets
        for (int i = 0; i < publicSubnets.size(); i++) {
            Eip natEip = new Eip(this, "nat-eip-" + i, EipConfig.builder()
                .domain("vpc")
                .tags(Map.of("Name", config.resourcePrefix() + "-nat-eip-" + (i + 1)))
                .build());
            
            NatGateway natGw = new NatGateway(this, "nat-gw-" + i, NatGatewayConfig.builder()
                .allocationId(natEip.getId())
                .subnetId(publicSubnets.get(i).getId())
                .tags(Map.of("Name", config.resourcePrefix() + "-nat-gw-" + (i + 1)))
                .build());
            
            // Route table for private subnet
            RouteTable privateRt = new RouteTable(this, "private-rt-" + i, RouteTableConfig.builder()
                .vpcId(vpc.getId())
                .tags(Map.of("Name", config.resourcePrefix() + "-private-rt-" + (i + 1)))
                .build());
            
            new Route(this, "private-route-" + i, RouteConfig.builder()
                .routeTableId(privateRt.getId())
                .destinationCidrBlock("0.0.0.0/0")
                .natGatewayId(natGw.getId())
                .build());
            
            new RouteTableAssociation(this, "private-rta-" + i, RouteTableAssociationConfig.builder()
                .subnetId(privateSubnets.get(i).getId())
                .routeTableId(privateRt.getId())
                .build());
        }
        
        // Public route table
        RouteTable publicRt = new RouteTable(this, "public-rt", RouteTableConfig.builder()
            .vpcId(vpc.getId())
            .tags(Map.of("Name", config.resourcePrefix() + "-public-rt"))
            .build());
        
        new Route(this, "public-route", RouteConfig.builder()
            .routeTableId(publicRt.getId())
            .destinationCidrBlock("0.0.0.0/0")
            .gatewayId(igw.getId())
            .build());
        
        for (int i = 0; i < publicSubnets.size(); i++) {
            new RouteTableAssociation(this, "public-rta-" + i, RouteTableAssociationConfig.builder()
                .subnetId(publicSubnets.get(i).getId())
                .routeTableId(publicRt.getId())
                .build());
        }
        
        // ECS Security Group
        this.ecsSecurityGroup = new SecurityGroup(this, "ecs-sg", SecurityGroupConfig.builder()
            .name(config.resourcePrefix() + "-ecs-sg")
            .description("Security group for ECS tasks")
            .vpcId(vpc.getId())
            .egress(List.of(SecurityGroupEgress.builder()
                .fromPort(0)
                .toPort(0)
                .protocol("-1")
                .cidrBlocks(List.of("0.0.0.0/0"))
                .build()))
            .tags(Map.of("Name", config.resourcePrefix() + "-ecs-sg"))
            .build());
    }
    
    // Getters
    public Vpc getVpc() { return vpc; }
    public List<Subnet> getPublicSubnets() { return publicSubnets; }
    public List<Subnet> getPrivateSubnets() { return privateSubnets; }
    public SecurityGroup getEcsSecurityGroup() { return ecsSecurityGroup; }
}
```

### 4. Kinesis Construct

```java
package com.loganalytics.constructs;

import com.hashicorp.cdktf.providers.aws.kinesis_stream.*;
import com.loganalytics.config.PlatformConfig;
import software.constructs.Construct;
import java.util.Map;

public class KinesisConstruct extends Construct {
    private final KinesisStream stream;
    
    public KinesisConstruct(Construct scope, String id, PlatformConfig config) {
        super(scope, id);
        
        this.stream = new KinesisStream(this, "log-stream", KinesisStreamConfig.builder()
            .name(config.resourcePrefix() + "-log-stream")
            .shardCount(config.kinesisShards())
            .retentionPeriod(24) // 24 hours as required
            .encryptionType("KMS")
            .kmsKeyId("alias/aws/kinesis")
            .shardLevelMetrics(java.util.List.of(
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords"
            ))
            .streamModeDetails(KinesisStreamStreamModeDetails.builder()
                .streamMode("PROVISIONED")
                .build())
            .tags(Map.of(
                "Name", config.resourcePrefix() + "-log-stream",
                "Purpose", "Real-time log ingestion"
            ))
            .build());
    }
    
    public KinesisStream getStream() { return stream; }
}
```

### 5. Storage Construct

```java
package com.loganalytics.constructs;

import com.hashicorp.cdktf.providers.aws.s3_bucket.*;
import com.loganalytics.config.PlatformConfig;
import software.constructs.Construct;
import java.util.Map;
import java.util.List;

public class StorageConstruct extends Construct {
    private final S3Bucket bucket;
    
    public StorageConstruct(Construct scope, String id, PlatformConfig config) {
        super(scope, id);
        
        // S3 bucket for long-term storage
        this.bucket = new S3Bucket(this, "log-bucket", S3BucketConfig.builder()
            .bucket(config.resourcePrefix() + "-logs-" + System.currentTimeMillis())
            .tags(Map.of(
                "Name", config.resourcePrefix() + "-logs",
                "Purpose", "Long-term log storage"
            ))
            .build());
        
        // Bucket versioning
        new S3BucketVersioningA(this, "bucket-versioning", S3BucketVersioningAConfig.builder()
            .bucket(bucket.getId())
            .versioningConfiguration(S3BucketVersioningVersioningConfiguration.builder()
                .status("Enabled")
                .build())
            .build());
        
        // Server-side encryption
        new S3BucketServerSideEncryptionConfigurationA(this, "bucket-encryption",
            S3BucketServerSideEncryptionConfigurationAConfig.builder()
                .bucket(bucket.getId())
                .rule(List.of(S3BucketServerSideEncryptionConfigurationRule.builder()
                    .applyServerSideEncryptionByDefault(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault.builder()
                            .sseAlgorithm("AES256")
                            .build())
                    .build()))
                .build());
        
        // Lifecycle rules for cost optimization
        new S3BucketLifecycleConfiguration(this, "bucket-lifecycle",
            S3BucketLifecycleConfigurationConfig.builder()
                .bucket(bucket.getId())
                .rule(List.of(S3BucketLifecycleConfigurationRule.builder()
                    .id("archive-old-logs")
                    .status("Enabled")
                    .transition(List.of(
                        S3BucketLifecycleConfigurationRuleTransition.builder()
                            .days(30)
                            .storageClass("STANDARD_IA")
                            .build(),
                        S3BucketLifecycleConfigurationRuleTransition.builder()
                            .days(90)
                            .storageClass("GLACIER")
                            .build()
                    ))
                    .build()))
                .build());
        
        // Block public access
        new S3BucketPublicAccessBlock(this, "bucket-pab", S3BucketPublicAccessBlockConfig.builder()
            .bucket(bucket.getId())
            .blockPublicAcls(true)
            .blockPublicPolicy(true)
            .ignorePublicAcls(true)
            .restrictPublicBuckets(true)
            .build());
    }
    
    public S3Bucket getBucket() { return bucket; }
}
```

### 6. Lambda Construct

```java
package com.loganalytics.constructs;

import com.hashicorp.cdktf.providers.aws.iam_role.*;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.*;
import com.hashicorp.cdktf.providers.aws.lambda_function.*;
import com.hashicorp.cdktf.providers.aws.lambda_event_source_mapping.*;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.*;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.hashicorp.cdktf.providers.aws.s3_bucket.S3Bucket;
import com.loganalytics.config.PlatformConfig;
import software.constructs.Construct;
import com.hashicorp.cdktf.TerraformAsset;
import com.hashicorp.cdktf.AssetType;
import java.util.*;

public class LambdaConstruct extends Construct {
    private final LambdaFunction function;
    
    public LambdaConstruct(Construct scope, String id, PlatformConfig config, 
                         KinesisStream kinesisStream, S3Bucket s3Bucket) {
        super(scope, id);
        
        // IAM role for Lambda
        IamRole lambdaRole = new IamRole(this, "lambda-role", IamRoleConfig.builder()
            .name(config.resourcePrefix() + "-lambda-role")
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Action": "sts:AssumeRole",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Effect": "Allow"
                    }]
                }
                """)
            .build());
        
        // Attach necessary policies
        new IamRolePolicyAttachment(this, "lambda-basic-execution", 
            IamRolePolicyAttachmentConfig.builder()
                .role(lambdaRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());
        
        new IamRolePolicyAttachment(this, "lambda-kinesis-execution", 
            IamRolePolicyAttachmentConfig.builder()
                .role(lambdaRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaKinesisExecutionRole")
                .build());
        
        // Custom policy for S3 access
        new IamRolePolicy(this, "lambda-s3-policy", IamRolePolicyConfig.builder()
            .name("s3-access")
            .role(lambdaRole.getId())
            .policy(String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                        "Resource": "%s/*"
                    }]
                }
                """, s3Bucket.getArn()))
            .build());
        
        // CloudWatch log group
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, "lambda-logs",
            CloudwatchLogGroupConfig.builder()
                .name("/aws/lambda/" + config.resourcePrefix() + "-processor")
                .retentionInDays(7)
                .build());
        
        // Package Lambda function
        TerraformAsset lambdaAsset = new TerraformAsset(this, "lambda-asset",
            TerraformAssetConfig.builder()
                .path("src/main/resources/lambda")
                .type(AssetType.ARCHIVE)
                .build());
        
        // Lambda function
        this.function = new LambdaFunction(this, "log-processor", LambdaFunctionConfig.builder()
            .functionName(config.resourcePrefix() + "-log-processor")
            .filename(lambdaAsset.getPath())
            .handler("log-processor.handler")
            .runtime("python3.9")
            .role(lambdaRole.getArn())
            .memorySize(config.lambdaMemory())
            .timeout(60)
            .reservedConcurrentExecutions(100)
            .environment(LambdaFunctionEnvironment.builder()
                .variables(Map.of(
                    "S3_BUCKET", s3Bucket.getBucket(),
                    "ENVIRONMENT", config.environment()
                ))
                .build())
            .deadLetterConfig(LambdaFunctionDeadLetterConfig.builder()
                .targetArn("") // Add DLQ ARN if needed
                .build())
            .tracingConfig(LambdaFunctionTracingConfig.builder()
                .mode("Active")
                .build())
            .dependsOn(List.of(lambdaRole, logGroup))
            .build());
        
        // Event source mapping from Kinesis
        new LambdaEventSourceMapping(this, "kinesis-trigger", 
            LambdaEventSourceMappingConfig.builder()
                .eventSourceArn(kinesisStream.getArn())
                .functionName(function.getArn())
                .startingPosition("LATEST")
                .parallelizationFactor(10)
                .maximumBatchingWindowInSeconds(5)
                .batchSize(100)
                .maximumRecordAgeInSeconds(3600)
                .bisectBatchOnFunctionError(true)
                .maximumRetryAttempts(3)
                .build());
    }
    
    public LambdaFunction getFunction() { return function; }
}
```

### 7. ECS Construct

```java
package com.loganalytics.constructs;

import com.hashicorp.cdktf.providers.aws.ecs_cluster.*;
import com.hashicorp.cdktf.providers.aws.ecs_service.*;
import com.hashicorp.cdktf.providers.aws.ecs_task_definition.*;
import com.hashicorp.cdktf.providers.aws.iam_role.*;
import com.hashicorp.cdktf.providers.aws.iam_role_policy_attachment.*;
import com.hashicorp.cdktf.providers.aws.cloudwatch_log_group.*;
import com.hashicorp.cdktf.providers.aws.vpc.Vpc;
import com.hashicorp.cdktf.providers.aws.kinesis_stream.KinesisStream;
import com.loganalytics.config.PlatformConfig;
import software.constructs.Construct;
import java.util.*;

public class EcsConstruct extends Construct {
    private final EcsCluster cluster;
    private final EcsService service;
    
    public EcsConstruct(Construct scope, String id, PlatformConfig config, 
                       Vpc vpc, KinesisStream kinesisStream) {
        super(scope, id);
        
        // ECS Cluster
        this.cluster = new EcsCluster(this, "ecs-cluster", EcsClusterConfig.builder()
            .name(config.resourcePrefix() + "-cluster")
            .setting(List.of(EcsClusterSetting.builder()
                .name("containerInsights")
                .value("enabled")
                .build()))
            .build());
        
        // Task execution role
        IamRole taskExecutionRole = new IamRole(this, "task-execution-role",
            IamRoleConfig.builder()
                .name(config.resourcePrefix() + "-ecs-task-execution-role")
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Action": "sts:AssumeRole",
                            "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                            "Effect": "Allow"
                        }]
                    }
                    """)
                .build());
        
        new IamRolePolicyAttachment(this, "task-execution-policy",
            IamRolePolicyAttachmentConfig.builder()
                .role(taskExecutionRole.getName())
                .policyArn("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy")
                .build());
        
        // Task role
        IamRole taskRole = new IamRole(this, "task-role", IamRoleConfig.builder()
            .name(config.resourcePrefix() + "-ecs-task-role")
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Action": "sts:AssumeRole",
                        "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                        "Effect": "Allow"
                    }]
                }
                """)
            .build());
        
        // Kinesis access policy for task
        new IamRolePolicy(this, "task-kinesis-policy", IamRolePolicyConfig.builder()
            .name("kinesis-access")
            .role(taskRole.getId())
            .policy(String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:DescribeStream",
                            "kinesis:GetShardIterator",
                            "kinesis:GetRecords",
                            "kinesis:ListShards",
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": "%s"
                    }]
                }
                """, kinesisStream.getArn()))
            .build());
        
        // CloudWatch log group for ECS
        CloudwatchLogGroup logGroup = new CloudwatchLogGroup(this, "ecs-logs",
            CloudwatchLogGroupConfig.builder()
                .name("/ecs/" + config.resourcePrefix() + "-log-processor")
                .retentionInDays(7)
                .build());
        
        // Task definition
        EcsTaskDefinition taskDefinition = new EcsTaskDefinition(this, "task-def",
            EcsTaskDefinitionConfig.builder()
                .family(config.resourcePrefix() + "-log-processor")
                .requiresCompatibilities(List.of("FARGATE"))
                .networkMode("awsvpc")
                .cpu("1024")
                .memory("2048")
                .executionRoleArn(taskExecutionRole.getArn())
                .taskRoleArn(taskRole.getArn())
                .containerDefinitions(String.format("""
                    [
                        {
                            "name": "log-processor",
                            "image": "%s",
                            "essential": true,
                            "environment": [
                                {"name": "KINESIS_STREAM", "value": "%s"},
                                {"name": "ENVIRONMENT", "value": "%s"}
                            ],
                            "logConfiguration": {
                                "logDriver": "awslogs",
                                "options": {
                                    "awslogs-group": "%s",
                                    "awslogs-region": "us-east-1",
                                    "awslogs-stream-prefix": "ecs"
                                }
                            },
                            "healthCheck": {
                                "command": ["CMD-SHELL", "echo healthy"],
                                "interval": 30,
                                "timeout": 5,
                                "retries": 3,
                                "startPeriod": 60
                            }
                        }
                    ]
                    """, 
                    config.containerImage(), 
                    kinesisStream.getName(),
                    config.environment(),
                    logGroup.getName()))
                .build());
        
        // ECS Service
        NetworkingConstruct networking = (NetworkingConstruct) scope.getNode().tryFindChild("networking");
        
        this.service = new EcsService(this, "ecs-service", EcsServiceConfig.builder()
            .name(config.resourcePrefix() + "-log-processor-service")
            .cluster(cluster.getId())
            .taskDefinition(taskDefinition.getArn())
            .desiredCount(2) // Multi-AZ deployment
            .launchType("FARGATE")
            .platformVersion("LATEST")
            .networkConfiguration(EcsServiceNetworkConfiguration.builder()
                .subnets(networking.getPrivateSubnets().stream()
                    .map(s -> s.getId())
                    .toList())
                .securityGroups(List.of(networking.getEcsSecurityGroup().getId()))
                .assignPublicIp(false)
                .build())
            .deploymentConfiguration(EcsServiceDeploymentConfiguration.builder()
                .maximumPercent(200)
                .minimumHealthyPercent(100)
                .deploymentCircuitBreaker(EcsServiceDeploymentConfigurationDeploymentCircuitBreaker.builder()
                    .enable(true)
                    .rollback(true)
                    .build())
                .build())
            .enableEcsManagedTags(true)
            .propagateTags("TASK_DEFINITION")
            .build());
    }
    
    public EcsCluster getCluster() { return cluster; }
    public EcsService getService() { return service; }
}
```

### 8. Lambda Function Code (Python)

```python
# src/main/resources/lambda/log-processor.py
import base64
import json
import boto3
import os
from datetime import datetime
import gzip

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ['S3_BUCKET']
ENVIRONMENT = os.environ['ENVIRONMENT']

def handler(event, context):
    """Process Kinesis stream records and store in S3"""
    
    processed_records = 0
    failed_records = []
    
    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = base64.b64decode(record['kinesis']['data'])
            
            # Try to parse as JSON
            try:
                log_data = json.loads(payload)
            except json.JSONDecodeError:
                log_data = {"raw": payload.decode('utf-8')}
            
            # Add metadata
            log_data['processed_at'] = datetime.utcnow().isoformat()
            log_data['environment'] = ENVIRONMENT
            log_data['sequence_number'] = record['kinesis']['sequenceNumber']
            
            # Compress data
            compressed_data = gzip.compress(json.dumps(log_data).encode('utf-8'))
            
            # Generate S3 key with partitioning
            now = datetime.utcnow()
            s3_key = f"logs/year={now.year}/month={now.month:02d}/day={now.day:02d}/hour={now.hour:02d}/{record['kinesis']['sequenceNumber']}.json.gz"
            
            # Upload to S3
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=compressed_data,
                ContentType='application/json',
                ContentEncoding='gzip'
            )
            
            processed_records += 1
            
        except Exception as e:
            print(f"Error processing record: {e}")
            failed_records.append({
                'sequence_number': record['kinesis']['sequenceNumber'],
                'error': str(e)
            })
    
    print(f"Processed {processed_records} records, failed {len(failed_records)}")
    
    # Return status
    return {
        'batchItemFailures': [{'itemIdentifier': r['sequence_number']} for r in failed_records]
    }
```

### 9. pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.loganalytics</groupId>
    <artifactId>log-analytics-platform</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <cdktf.version>0.18.0</cdktf.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>com.hashicorp</groupId>
            <artifactId>cdktf</artifactId>
            <version>${cdktf.version}</version>
        </dependency>
        <dependency>
            <groupId>com.hashicorp</groupId>
            <artifactId>cdktf-provider-aws</artifactId>
            <version>18.0.0</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                    <compilerArgs>--enable-preview</compilerArgs>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 10. cdktf.json

```json
{
  "language": "java",
  "app": "mvn compile exec:java -Dexec.mainClass=com.loganalytics.Main",
  "projectId": "log-analytics-platform",
  "sendCrashReports": "false",
  "terraformProviders": [
    "hashicorp/aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## Key Features

1. **High Throughput**: Configured with multiple Kinesis shards and parallel Lambda processing to handle >10,000 events/second
2. **High Availability**: Deployed across 2+ availability zones with redundant NAT gateways
3. **Cost Optimization**:
    - 24-hour Kinesis retention
    - S3 lifecycle policies for archival
    - Reserved concurrent executions for Lambda
4. **Security**:
    - VPC isolation with private subnets
    - KMS encryption for Kinesis
    - IAM roles with least privilege
5. **Monitoring**:
    - CloudWatch logs for all components
    - Container Insights for ECS
    - X-Ray tracing for Lambda

## Deployment

```bash
# Install dependencies
mvn clean install

# Initialize CDKTF
cdktf init

# Deploy with custom configuration
export ENVIRONMENT=production
export VPC_CIDR=10.0.0.0/16
export CONTAINER_IMAGE=your-ecr-repo/log-processor:latest
export KINESIS_SHARDS=20
export LAMBDA_MEMORY=1024

cdktf deploy
```

This architecture provides a scalable, resilient, and cost-effective solution for real-time log analytics with minimal latency and high availability.