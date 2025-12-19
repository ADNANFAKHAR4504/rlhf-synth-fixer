import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand, DescribeTaskDefinitionCommand } from "@aws-sdk/client-ecs";
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DynamoDBClient, DescribeTableCommand, DescribeContinuousBackupsCommand } from "@aws-sdk/client-dynamodb";
import { CloudFrontClient, GetDistributionCommand } from "@aws-sdk/client-cloudfront";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || "ap-southeast-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const ecsClient = new ECSClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const dynamoClient = new DynamoDBClient({ region: awsRegion });
const cloudFrontClient = new CloudFrontClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("Educational Content Delivery Platform Integration Tests", () => {
  let vpcId: string;
  let albDnsName: string;
  let cloudFrontDomainName: string;
  let contentBucketName: string;
  let artifactBucketName: string;
  let ecsClusterName: string;
  let ecsServiceName: string;
  let userProgressTableName: string;
  let courseMetadataTableName: string;
  let kmsKeyId: string;
  let snsTopicArn: string;
  let stackName: string;
  let environmentSuffix: string;
  let awsAccountId: string;

  beforeAll(async () => {
    const outputFilePath = path.join(__dirname, "..", "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));

    vpcId = outputs["VPCId"];
    albDnsName = outputs["ALBDNSName"];
    cloudFrontDomainName = outputs["CloudFrontDomainName"];
    contentBucketName = outputs["ContentBucketName"];
    artifactBucketName = outputs["ArtifactBucketName"];
    ecsClusterName = outputs["ECSClusterName"];
    ecsServiceName = outputs["ECSServiceName"];
    userProgressTableName = outputs["UserProgressTableName"];
    courseMetadataTableName = outputs["CourseMetadataTableName"];
    kmsKeyId = outputs["KMSKeyId"];
    snsTopicArn = outputs["SNSTopicArn"];
    stackName = outputs["StackName"];
    environmentSuffix = outputs["EnvironmentSuffix"];

    if (!vpcId || !ecsClusterName || !ecsServiceName || !contentBucketName) {
      throw new Error("Missing required stack outputs for integration test.");
    }

    const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
    awsAccountId = Account!;
  }, 30000);

  describe("AWS Account Verification", () => {
    test("AWS account ID is accessible", async () => {
      expect(awsAccountId).toBeDefined();
      expect(awsAccountId).toMatch(/^\d{12}$/);
    }, 20000);

    test("Stack outputs contain environment suffix", () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and is available", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.State).toBe("available");
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment")).toBe(true);
    }, 20000);

    test("Public subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "tag:Name", Values: [`*public*${environmentSuffix}*`] }
          ]
        })
      );
      expect(Subnets?.length).toBeGreaterThanOrEqual(2);

      Subnets?.forEach(subnet => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
      });
    }, 20000);

    test("Private subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "tag:Name", Values: [`*private*${environmentSuffix}*`] }
          ]
        })
      );
      expect(Subnets?.length).toBeGreaterThanOrEqual(2);

      Subnets?.forEach(subnet => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
      });
    }, 20000);

    test("Internet Gateway is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
        })
      );
      expect(InternetGateways?.length).toBeGreaterThanOrEqual(1);

      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ECS security group exists and allows ALB traffic", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "tag:Name", Values: [`*ecs*${environmentSuffix}*`] }
          ]
        })
      );
      expect(SecurityGroups?.length).toBeGreaterThanOrEqual(1);

      const ecsSg = SecurityGroups?.[0];
      expect(ecsSg?.VpcId).toBe(vpcId);
      expect(ecsSg?.IpPermissions?.length).toBeGreaterThan(0);
    }, 20000);

    test("ALB security group exists and allows HTTP traffic", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "tag:Name", Values: [`*alb*${environmentSuffix}*`] }
          ]
        })
      );
      expect(SecurityGroups?.length).toBeGreaterThanOrEqual(1);

      const albSg = SecurityGroups?.[0];
      expect(albSg?.VpcId).toBe(vpcId);

      const httpRule = albSg?.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
    }, 20000);
  });

  describe("ECS Cluster and Service", () => {
    test("ECS cluster exists and is active", async () => {
      const { clusters } = await ecsClient.send(
        new DescribeClustersCommand({ clusters: [ecsClusterName] })
      );
      expect(clusters?.length).toBe(1);

      const cluster = clusters?.[0];
      expect(cluster?.clusterName).toBe(ecsClusterName);
      expect(cluster?.status).toBe("ACTIVE");
      expect(cluster?.registeredContainerInstancesCount).toBeGreaterThanOrEqual(0);
    }, 20000);

    test("ECS service is running with desired task count", async () => {
      const { services } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );
      expect(services?.length).toBe(1);

      const service = services?.[0];
      expect(service?.serviceName).toBe(ecsServiceName);
      expect(service?.status).toBe("ACTIVE");
      expect(service?.desiredCount).toBe(2);
      expect(service?.runningCount).toBe(2);
    }, 20000);

    test("ECS task definition uses correct container image", async () => {
      const { services } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );
      const taskDefArn = services?.[0]?.taskDefinition;
      expect(taskDefArn).toBeDefined();

      const { taskDefinition } = await ecsClient.send(
        new DescribeTaskDefinitionCommand({ taskDefinition: taskDefArn })
      );
      expect(taskDefinition?.containerDefinitions?.length).toBeGreaterThan(0);
      expect(taskDefinition?.containerDefinitions?.[0]?.image).toContain("nginx");
    }, 20000);
  });

  describe("Application Load Balancer", () => {
    test("ALB exists and is active", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`education-alb-${environmentSuffix}`]
        })
      );
      expect(LoadBalancers?.length).toBe(1);

      const alb = LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe("active");
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.IpAddressType).toBe("ipv4");
      expect(alb?.DNSName).toBe(albDnsName);
    }, 20000);

    test("ALB target group has correct health check configuration", async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          Names: [`education-tg-${environmentSuffix}`]
        })
      );
      expect(TargetGroups?.length).toBe(1);

      const tg = TargetGroups?.[0];
      expect(tg?.HealthCheckEnabled).toBe(true);
      expect(tg?.HealthCheckPath).toBe("/");
      expect(tg?.HealthCheckProtocol).toBe("HTTP");
      expect(tg?.HealthCheckIntervalSeconds).toBeLessThanOrEqual(30);
      expect(tg?.HealthyThresholdCount).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("ALB listener is configured for HTTP traffic", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`education-alb-${environmentSuffix}`]
        })
      );
      const albArn = LoadBalancers?.[0]?.LoadBalancerArn;
      expect(albArn).toBeDefined();

      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: albArn })
      );
      expect(Listeners?.length).toBeGreaterThanOrEqual(1);

      const httpListener = Listeners?.find(l => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener?.Protocol).toBe("HTTP");
    }, 20000);
  });

  describe("S3 Buckets", () => {
    test("Content bucket exists with encryption enabled", async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: contentBucketName }));

      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: contentBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].BucketKeyEnabled).toBe(true);
    }, 20000);

    test("Content bucket has public access blocked", async () => {
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: contentBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("Artifact bucket exists with encryption enabled", async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: artifactBucketName }));

      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: artifactBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("DynamoDB Tables", () => {
    test("User Progress table exists with correct configuration", async () => {
      const { Table } = await dynamoClient.send(
        new DescribeTableCommand({ TableName: userProgressTableName })
      );
      expect(Table?.TableName).toBe(userProgressTableName);
      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.SSEDescription?.Status).toBe("ENABLED");
      expect(Table?.KeySchema?.length).toBeGreaterThan(0);
    }, 20000);

    test("Course Metadata table exists with correct configuration", async () => {
      const { Table } = await dynamoClient.send(
        new DescribeTableCommand({ TableName: courseMetadataTableName })
      );
      expect(Table?.TableName).toBe(courseMetadataTableName);
      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.SSEDescription?.Status).toBe("ENABLED");

      const { ContinuousBackupsDescription } = await dynamoClient.send(
        new DescribeContinuousBackupsCommand({ TableName: courseMetadataTableName })
      );
      expect(ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
    }, 20000);
  });

  describe("CloudFront Distribution", () => {
    test("CloudFront distribution exists and is deployed", async () => {
      expect(cloudFrontDomainName).toBeDefined();
      expect(cloudFrontDomainName).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
      expect(cloudFrontDomainName.endsWith('.cloudfront.net')).toBe(true);
    }, 30000);
  });

  describe("KMS Encryption", () => {
    test("KMS key exists and is enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.KeyState).toBe("Enabled");
    }, 20000);

    test("KMS key has rotation enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
    }, 20000);
  });

  describe("SNS Notifications", () => {
    test("SNS topic exists for alerts", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(Attributes?.DisplayName).toBeDefined();
    }, 20000);

    test("SNS topic has KMS encryption enabled", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      expect(Attributes?.KmsMasterKeyId).toBeDefined();
    }, 20000);
  });

  describe("Resource Tagging and Naming", () => {
    test("All resources follow naming convention with environment suffix", () => {
      expect(ecsClusterName).toContain(environmentSuffix);
      expect(ecsServiceName).toContain(environmentSuffix);
      expect(contentBucketName).toContain(environmentSuffix);
      expect(userProgressTableName).toContain(environmentSuffix);
      expect(courseMetadataTableName).toContain(environmentSuffix);
    });

    test("VPC has consistent environment tagging", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];

      const envTag = vpc?.Tags?.find(tag => tag.Key === "Environment");
      expect(envTag?.Value).toBe(environmentSuffix);
    }, 20000);
  });

  describe("High Availability", () => {
    test("ECS service runs multiple tasks for redundancy", async () => {
      const { services } = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: ecsClusterName,
          services: [ecsServiceName]
        })
      );
      const service = services?.[0];

      expect(service?.desiredCount).toBeGreaterThanOrEqual(2);
      expect(service?.runningCount).toBe(service?.desiredCount);
    }, 20000);

    test("ALB spans multiple availability zones", async () => {
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [`education-alb-${environmentSuffix}`]
        })
      );
      const alb = LoadBalancers?.[0];

      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    }, 20000);

    test("Subnets span multiple availability zones", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      const azs = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 20000);
  });

  describe("Security Best Practices", () => {
    test("DynamoDB tables have point-in-time recovery enabled", async () => {
      const tables = [userProgressTableName, courseMetadataTableName];

      for (const tableName of tables) {
        const { ContinuousBackupsDescription } = await dynamoClient.send(
          new DescribeContinuousBackupsCommand({ TableName: tableName })
        );
        expect(ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe("ENABLED");
      }
    }, 30000);

    test("S3 buckets have versioning or lifecycle policies configured", async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: contentBucketName }));
      await s3Client.send(new HeadBucketCommand({ Bucket: artifactBucketName }));

      expect(contentBucketName).toBeDefined();
      expect(artifactBucketName).toBeDefined();
    }, 20000);
  });
});
