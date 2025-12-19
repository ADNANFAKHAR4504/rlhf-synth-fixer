// __tests__/fitness-tracker-stack.int.test.ts
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, HeadBucketCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from "@aws-sdk/client-cognito-identity-provider";
import { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { APIGatewayClient, GetRestApisCommand, GetAuthorizersCommand, GetResourcesCommand } from "@aws-sdk/client-api-gateway";
import { ElastiCacheClient, DescribeCacheClustersCommand } from "@aws-sdk/client-elasticache";
import { KMSClient, DescribeKeyCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2";
const ec2Client = new EC2Client({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const dynamodbClient = new DynamoDBClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const cognitoClient = new CognitoIdentityProviderClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const apigatewayClient = new APIGatewayClient({ region: awsRegion });
const elasticacheClient = new ElastiCacheClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("Fitness Tracking Backend Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    
    // Extract stack name from resource names
    const workoutTableName = outputs["WorkoutHistoryTableName"];
    stackName = workoutTableName ? workoutTableName.split("-")[0] : "TapStack";

    // Validate required outputs exist
    const requiredOutputs = [
      "ApiEndpoint",
      "WorkoutProcessingFunctionArn",
      "LeaderboardFunctionArn",
      "WorkoutHistoryTableName",
      "S3BucketName",
      "CognitoUserPoolId",
      "SNSTopicArn",
      "RedisClusterEndpoint",
      "CloudWatchDashboardName"
    ];

    for (const output of requiredOutputs) {
      if (!outputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Network Foundation", () => {
    test("VPC exists with correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: "cidr-block", Values: ["10.0.0.0/16"] },
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "FitnessTracker")).toBe(true);
      expect(tags.some(tag => tag.Key === "Owner" && tag.Value === "FitnessBackendTeam")).toBe(true);
    }, 20000);

    test("Public subnets configured correctly", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "cidr-block", Values: ["10.0.10.0/24", "10.0.11.0/24"] },
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      expect(Subnets).toHaveLength(2);
      
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe("available");
        
        // Verify subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
        expect(tags.some(tag => tag.Key === "Project" && tag.Value === "FitnessTracker")).toBe(true);
      });
    }, 20000);

    test("Private subnets exist in multiple AZs", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "cidr-block", Values: ["10.0.1.0/24", "10.0.2.0/24"] },
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
        expect(tags.some(tag => tag.Key === "Project" && tag.Value === "FitnessTracker")).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("NAT Gateways exist and are available", async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "state", Values: ["available"] }
        ]
      }));
      
      const fitnessNatGateways = NatGateways?.filter(nat => 
        nat.SubnetId && nat.State === "available"
      );
      
      expect(fitnessNatGateways!.length).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("Security Groups - Access Controls", () => {
    test("Lambda security group exists with correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "group-name", Values: ["*LambdaSecurityGroup*"] },
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      const lambdaSg = SecurityGroups![0];
      
      expect(lambdaSg.Description).toBe("Security group for Lambda functions");
      
      // Check egress rules - should allow all outbound traffic
      const egressRules = lambdaSg.IpPermissionsEgress;
      expect(egressRules?.some(rule => 
        rule.IpProtocol === "-1" && 
        rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
      )).toBe(true);
      
      // Verify security group tagging
      const tags = lambdaSg.Tags || [];
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "FitnessTracker")).toBe(true);
    }, 20000);

    test("Redis security group restricts access to Lambda functions", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "group-name", Values: ["*RedisSecurityGroup*"] },
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      const redisSg = SecurityGroups![0];
      
      expect(redisSg.Description).toBe("Security group for ElastiCache Redis");
      
      // Check Redis ingress rule (port 6379)
      const redisRule = redisSg.IpPermissions?.find(rule =>
        rule.FromPort === 6379 && rule.ToPort === 6379 && rule.IpProtocol === "tcp"
      );
      expect(redisRule).toBeDefined();
      expect(redisRule?.UserIdGroupPairs).toHaveLength(1);
    }, 20000);
  });

  describe("DynamoDB Tables - Data Storage", () => {
    test("UserProfiles table exists with correct configuration", async () => {
      const userProfilesTable = `${stackName}-UserProfiles`;
      
      const { Table } = await dynamodbClient.send(new DescribeTableCommand({
        TableName: userProfilesTable
      }));
      
      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.ProvisionedThroughput?.ReadCapacityUnits).toBeGreaterThanOrEqual(5);
      expect(Table?.ProvisionedThroughput?.WriteCapacityUnits).toBeGreaterThanOrEqual(5);
      
      // Verify key schema
      expect(Table?.KeySchema).toHaveLength(1);
      expect(Table?.KeySchema?.[0].AttributeName).toBe("userId");
      expect(Table?.KeySchema?.[0].KeyType).toBe("HASH");
      
      // Verify GSI for email
      const emailIndex = Table?.GlobalSecondaryIndexes?.find(gsi => gsi.IndexName === "EmailIndex");
      expect(emailIndex).toBeDefined();
      expect(emailIndex?.KeySchema?.[0].AttributeName).toBe("email");
      expect(emailIndex?.KeySchema?.[0].KeyType).toBe("HASH");
      
      // Verify encryption
      expect(Table?.SSEDescription?.Status).toBe("ENABLED");
      expect(Table?.SSEDescription?.SSEType).toBe("KMS");
    }, 30000);

    test("WorkoutHistory table exists with correct configuration and indexes", async () => {
      const workoutHistoryTable = outputs["WorkoutHistoryTableName"];
      
      const { Table } = await dynamodbClient.send(new DescribeTableCommand({
        TableName: workoutHistoryTable
      }));
      
      expect(Table?.TableStatus).toBe("ACTIVE");
      
      // Verify key schema
      expect(Table?.KeySchema).toHaveLength(2);
      expect(Table?.KeySchema?.[0].AttributeName).toBe("userId");
      expect(Table?.KeySchema?.[0].KeyType).toBe("HASH");
      expect(Table?.KeySchema?.[1].AttributeName).toBe("workoutTimestamp");
      expect(Table?.KeySchema?.[1].KeyType).toBe("RANGE");
      
      // Verify GSIs
      expect(Table?.GlobalSecondaryIndexes).toHaveLength(2);
      
      const workoutTypeIndex = Table?.GlobalSecondaryIndexes?.find(gsi => gsi.IndexName === "WorkoutTypeIndex");
      expect(workoutTypeIndex).toBeDefined();
      expect(workoutTypeIndex?.KeySchema?.[0].AttributeName).toBe("workoutType");
      
      const userDateIndex = Table?.GlobalSecondaryIndexes?.find(gsi => gsi.IndexName === "UserDateIndex");
      expect(userDateIndex).toBeDefined();
      expect(userDateIndex?.KeySchema?.[0].AttributeName).toBe("userId");
      expect(userDateIndex?.KeySchema?.[1].AttributeName).toBe("workoutDate");
      
      // Verify encryption
      expect(Table?.SSEDescription?.Status).toBe("ENABLED");
      expect(Table?.SSEDescription?.SSEType).toBe("KMS");
    }, 30000);
  });

  describe("Storage Resources - S3 Bucket", () => {
    test("S3 bucket exists with correct configuration", async () => {
      const bucketName = outputs["S3BucketName"];
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket has KMS encryption configured", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    }, 20000);

    test("S3 bucket has public access blocked", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe("Lambda Functions - Compute", () => {
    test("WorkoutProcessing Lambda function exists with correct configuration", async () => {
      const functionArn = outputs["WorkoutProcessingFunctionArn"];
      const functionName = functionArn.split(":").pop();
      
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
      
      expect(Configuration?.FunctionName).toBe(`${stackName}-WorkoutProcessing`);
      expect(Configuration?.Runtime).toBe("python3.9");
      expect(Configuration?.Handler).toBe("index.handler");
      expect(Configuration?.Timeout).toBe(30);
      expect(Configuration?.MemorySize).toBe(256);
      
      // Verify VPC configuration
      expect(Configuration?.VpcConfig?.SubnetIds).toHaveLength(2);
      expect(Configuration?.VpcConfig?.SecurityGroupIds).toHaveLength(1);
      
      // Verify environment variables
      const envVars = Configuration?.Environment?.Variables;
      expect(envVars?.USER_PROFILES_TABLE).toBeDefined();
      expect(envVars?.WORKOUT_HISTORY_TABLE).toBe(outputs["WorkoutHistoryTableName"]);
      expect(envVars?.ACHIEVEMENT_TOPIC_ARN).toBe(outputs["SNSTopicArn"]);
      expect(envVars?.ASSETS_BUCKET).toBe(outputs["S3BucketName"]);
      expect(envVars?.REDIS_ENDPOINT).toBe(outputs["RedisClusterEndpoint"]);
    }, 20000);

    test("Leaderboard Lambda function exists with correct configuration", async () => {
      const functionArn = outputs["LeaderboardFunctionArn"];
      const functionName = functionArn.split(":").pop();
      
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
      
      expect(Configuration?.FunctionName).toBe(`${stackName}-Leaderboard`);
      expect(Configuration?.Runtime).toBe("python3.9");
      expect(Configuration?.Handler).toBe("index.handler");
      expect(Configuration?.Timeout).toBe(30);
      expect(Configuration?.MemorySize).toBe(256);
      
      // Verify environment variables
      const envVars = Configuration?.Environment?.Variables;
      expect(envVars?.WORKOUT_HISTORY_TABLE).toBe(outputs["WorkoutHistoryTableName"]);
      expect(envVars?.REDIS_ENDPOINT).toBe(outputs["RedisClusterEndpoint"]);
    }, 20000);
  });

  describe("API Gateway - REST API", () => {
    test("API Gateway exists and is accessible", async () => {
      const apiEndpoint = outputs["ApiEndpoint"];
      const apiId = apiEndpoint.split("/")[2].split(".")[0];
      
      const { items } = await apigatewayClient.send(new GetRestApisCommand({}));
      
      const fitnessApi = items?.find(api => api.id === apiId);
      expect(fitnessApi).toBeDefined();
      expect(fitnessApi?.name).toBe("FitnessAPI");
      expect(fitnessApi?.description).toBe("Fitness Tracking Mobile API");
      expect(fitnessApi?.endpointConfiguration?.types).toContain("REGIONAL");
    }, 20000);

    test("API has Cognito authorizer configured", async () => {
      const apiEndpoint = outputs["ApiEndpoint"];
      const apiId = apiEndpoint.split("/")[2].split(".")[0];
      
      const { items } = await apigatewayClient.send(new GetAuthorizersCommand({
        restApiId: apiId
      }));
      
      expect(items?.length).toBeGreaterThan(0);
      const authorizer = items![0];
      expect(authorizer.name).toBe("CognitoAuthorizer");
      expect(authorizer.type).toBe("COGNITO_USER_POOLS");
    }, 20000);

    test("API has correct resources configured", async () => {
      const apiEndpoint = outputs["ApiEndpoint"];
      const apiId = apiEndpoint.split("/")[2].split(".")[0];
      
      const { items } = await apigatewayClient.send(new GetResourcesCommand({
        restApiId: apiId
      }));
      
      const resources = items?.map(item => item.path);
      expect(resources).toContain("/workout");
      expect(resources).toContain("/leaderboard");
    }, 20000);
  });

  describe("ElastiCache Redis - Caching Layer", () => {
    test("Redis cluster exists and is available", async () => {
      const redisEndpoint = outputs["RedisClusterEndpoint"];
      const clusterId = redisEndpoint.split(".")[0];
      
      const { CacheClusters } = await elasticacheClient.send(new DescribeCacheClustersCommand({
        CacheClusterId: clusterId
      }));
      
      expect(CacheClusters).toHaveLength(1);
      const cluster = CacheClusters![0];
      
      expect(cluster.CacheClusterStatus).toBe("available");
      expect(cluster.Engine).toBe("redis");
      expect(cluster.CacheNodeType).toMatch(/^cache\.t3\.(micro|small|medium)$/);
      expect(cluster.NumCacheNodes).toBe(1);
    }, 20000);
  });

  describe("SNS Topic - Notifications", () => {
    test("Achievement SNS topic exists with KMS encryption", async () => {
      const topicArn = outputs["SNSTopicArn"];
      
      const { Attributes } = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: topicArn
      }));
      
      expect(Attributes?.DisplayName).toBe("Fitness Achievement Notifications");
      expect(Attributes?.KmsMasterKeyId).toBeDefined();
    }, 20000);
  });

  describe("KMS Encryption", () => {
    test("KMS key exists with correct alias", async () => {
      const { Aliases } = await kmsClient.send(new ListAliasesCommand({}));
      
      const fitnessKeyAlias = Aliases?.find(alias => alias.AliasName === "alias/fitness-tracker-key");
      expect(fitnessKeyAlias).toBeDefined();
      expect(fitnessKeyAlias?.TargetKeyId).toBeDefined();
    }, 20000);
  });

  describe("High Availability Configuration", () => {
    test("Resources distributed across multiple availability zones", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("Security Best Practices", () => {
    test("Private subnets are not directly accessible from internet", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "cidr-block", Values: ["10.0.1.0/24", "10.0.2.0/24"] },
          { Name: "tag:Project", Values: ["FitnessTracker"] }
        ]
      }));
      
      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, 20000);

    test("S3 bucket is not publicly accessible", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls && 
             config?.BlockPublicPolicy && 
             config?.IgnorePublicAcls && 
             config?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe("Output Validation", () => {
    test("All outputs have valid formats", () => {
      // API Gateway endpoint
      expect(outputs["ApiEndpoint"]).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/dev$/);
      
      // Lambda Function ARNs
      expect(outputs["WorkoutProcessingFunctionArn"]).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-]+$/);
      expect(outputs["LeaderboardFunctionArn"]).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-zA-Z0-9-]+$/);
      
      // DynamoDB Table Name
      expect(outputs["WorkoutHistoryTableName"]).toMatch(/^[a-zA-Z0-9-]+$/);
      
      // S3 Bucket Name
      expect(outputs["S3BucketName"]).toBe("fitness-assets-cfn");
      
      // Cognito User Pool ID
      expect(outputs["CognitoUserPoolId"]).toMatch(/^[a-z0-9-]+_[a-zA-Z0-9]+$/);
      
      // SNS Topic ARN
      expect(outputs["SNSTopicArn"]).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:[a-zA-Z0-9-]+$/);
      
      // Redis Endpoint
      expect(outputs["RedisClusterEndpoint"]).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.\d{4}\.[a-z0-9]+\.cache\.amazonaws\.com$/);
      
      // CloudWatch Dashboard Name
      expect(outputs["CloudWatchDashboardName"]).toMatch(/^[a-zA-Z0-9-]+$/);
    });
  });
});
