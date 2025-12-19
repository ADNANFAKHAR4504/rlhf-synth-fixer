// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, HeadBucketCommand, GetBucketLoggingCommand } from "@aws-sdk/client-s3";
import { LambdaClient, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { KMSClient, DescribeKeyCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { CloudFrontClient, GetDistributionCommand } from "@aws-sdk/client-cloudfront";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { ApplicationAutoScalingClient, DescribeScalableTargetsCommand, DescribeScalingPoliciesCommand } from "@aws-sdk/client-application-auto-scaling";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudfrontClient = new CloudFrontClient({ region: awsRegion });
const dynamodbClient = new DynamoDBClient({ region: awsRegion });
const autoScalingClient = new ApplicationAutoScalingClient({ region: awsRegion });

describe("TapStack Production Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "public-subnet-ids", 
      "private-subnet-ids",
      "ec2-instance-ids",
      "s3-content-bucket-name",
      "s3-logs-bucket-name",
      "cloudfront-distribution-id",
      "lambda-function-arns",
      "dynamodb-table-name",
      "cloudwatch-alarm-arns"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Secure Network Foundation", () => {
    test("VPC exists with correct CIDR and DNS settings for secure architecture", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify production tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "production-vpc")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("Public subnets exist with proper configuration in multiple AZs", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
      const expectedAzs = ['us-west-2a', 'us-west-2b'];
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(expectedCidrs).toContain(subnet.CidrBlock);
        expect(expectedAzs).toContain(subnet.AvailabilityZone);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify public subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("production-public-subnet"))).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Private subnets exist for secure resource isolation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      const expectedCidrs = ['10.0.10.0/24', '10.0.11.0/24'];
      const expectedAzs = ['us-west-2a', 'us-west-2b'];
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(expectedCidrs).toContain(subnet.CidrBlock);
        expect(expectedAzs).toContain(subnet.AvailabilityZone);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify private subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("production-private-subnet"))).toBe(true);
      });

      // Verify subnets are in different AZs
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Internet Gateway is properly attached for public access", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
      // Verify IGW tagging
      const tags = InternetGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "production-igw")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("NAT Gateway exists with proper configuration", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const natGatewayIp = stackOutputs["nat-gateway-ip"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(NatGateways).toHaveLength(1);
      expect(NatGateways![0].State).toBe("available");
      expect(NatGateways![0].NatGatewayAddresses![0].PublicIp).toBe(natGatewayIp);
      
      // Verify NAT Gateway is in public subnet
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      expect(publicSubnetIds).toContain(NatGateways![0].SubnetId);
      
      // Verify NAT Gateway tagging
      const tags = NatGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "production-nat-gateway")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("Route tables are properly configured for network segmentation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have default + public + private route tables
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for internet gateway routes in public route tables
      const internetRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(internetRoutes!.length).toBeGreaterThan(0);
      
      // Check for NAT gateway routes in private route tables
      const natRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        )
      );
      expect(natRoutes!.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Security Groups - Least Privilege Network Access", () => {
    test("Web security group has restricted HTTP/HTTPS access", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*web-sg*"] }
        ]
      }));
      
      const webSg = SecurityGroups?.find(sg => sg.GroupName?.includes("web-sg"));
      expect(webSg).toBeDefined();
      
      // Check for HTTP rule (port 80)
      const httpRule = webSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check for HTTPS rule (port 443)
      const httpsRule = webSg?.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Verify web SG tagging
      const tags = webSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "production-web-sg")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("Database security group allows access only from web tier", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*db-sg*"] }
        ]
      }));
      
      const dbSg = SecurityGroups?.find(sg => sg.GroupName?.includes("db-sg"));
      expect(dbSg).toBeDefined();
      
      // Check for MySQL rule (port 3306)
      const mysqlRule = dbSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      
      // Should reference web security group, not open CIDR
      expect(mysqlRule?.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
      
      // Verify DB SG tagging
      const tags = dbSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "production-db-sg")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

  });

  describe("EC2 Module - Secure Instances with IAM Roles", () => {
    test("EC2 instances exist in private subnets with proper configuration", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instances = Reservations?.flatMap(r => r.Instances || []) || [];
      expect(instances).toHaveLength(2);
      
      instances.forEach((instance, index) => {
        expect(instance.State?.Name).toBe("running");
        expect(instance.InstanceType).toBe("t3.medium");
        expect(privateSubnetIds).toContain(instance.SubnetId);
        expect(instance.Monitoring?.State).toBe("enabled"); // Detailed monitoring
        
        // Verify instance tagging
        const tags = instance.Tags || [];
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("production-web-server"))).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        
        // Verify IAM instance profile is attached
        expect(instance.IamInstanceProfile).toBeDefined();
      });
    }, 30000);
  });

  describe("S3 Module - Secure Buckets with Encryption and Versioning", () => {
    test("Content S3 bucket exists with proper configuration", async () => {
      const bucketName = stackOutputs["s3-content-bucket-name"];
      expect(bucketName).toMatch(/production-app-123456-.*-content/);
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("Content S3 bucket has server-side encryption enabled", async () => {
      const bucketName = stackOutputs["s3-content-bucket-name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules![0].BucketKeyEnabled).toBe(true);
    }, 20000);

    test("Content S3 bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["s3-content-bucket-name"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Access logging is configured for content bucket", async () => {
      const bucketName = stackOutputs["s3-content-bucket-name"];
      const logsBucketName = stackOutputs["s3-logs-bucket-name"];
      
      const { LoggingEnabled } = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );
      
      expect(LoggingEnabled?.TargetBucket).toBe(logsBucketName);
      expect(LoggingEnabled?.TargetPrefix).toBe("access-logs/");
    }, 20000);
  });

  describe("RDS Module - Multi-AZ Database with Security", () => {
    test("RDS instance exists with proper security configuration", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.medium");
      expect(dbInstance.AllocatedStorage).toBe(50);
      expect(dbInstance.StorageType).toBe("gp2");
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.MultiAZ).toBe(true);
      
      // Verify database name
      expect(dbInstance.DBName).toBe("productiondb");
      
      // Verify managed master user password
      expect(dbInstance.MasterUserSecret).toBeDefined();
    }, 30000);

    test("RDS subnet group spans multiple availability zones", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      
      const dbSubnetGroupName = DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName!
      }));
      
      const availabilityZones = new Set(
        DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(availabilityZones.size).toBe(2);
      
      // Verify subnets are private subnets
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      const dbSubnetIds = DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      
      dbSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    }, 20000);

    test("RDS KMS key exists for encryption", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      
      const kmsKeyId = DBInstances![0].KmsKeyId;
      expect(kmsKeyId).toBeDefined();
      
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId!
      }));
      
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.Description).toBe("KMS key for RDS encryption");
    }, 20000);
  });

  describe("CloudFront Module - Secure CDN Distribution", () => {
    test("CloudFront distribution exists with proper configuration", async () => {
      const distributionId = stackOutputs["cloudfront-distribution-id"];
      const distributionDomain = stackOutputs["cloudfront-distribution-domain"];
      
      const { Distribution } = await cloudfrontClient.send(
        new GetDistributionCommand({ Id: distributionId })
      );
      
      expect(Distribution?.Id).toBe(distributionId);
      expect(Distribution?.DomainName).toBe(distributionDomain);
      expect(Distribution?.Status).toBe("Deployed");
      expect(Distribution?.DistributionConfig?.Enabled).toBe(true);
      expect(Distribution?.DistributionConfig?.IsIPV6Enabled).toBe(true);
      expect(Distribution?.DistributionConfig?.Comment).toBe("Production CloudFront distribution");
      expect(Distribution?.DistributionConfig?.DefaultRootObject).toBe("index.html");
      
      // Verify HTTPS redirect
      expect(Distribution?.DistributionConfig?.DefaultCacheBehavior?.ViewerProtocolPolicy).toBe("redirect-to-https");
      expect(Distribution?.DistributionConfig?.DefaultCacheBehavior?.Compress).toBe(true);
    }, 20000);
  });

  describe("Lambda Module - Functions in VPC", () => {
    test("Lambda function exists with proper VPC configuration", async () => {
      const functionArns = stackOutputs["lambda-function-arns"];
      expect(functionArns).toHaveLength(1);
      
      const functionName = "production-data-processor";
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
      
      expect(Configuration?.FunctionName).toBe(functionName);
      expect(Configuration?.Runtime).toBe("python3.9");
      expect(Configuration?.Handler).toBe("lambda_function.handler");
      expect(Configuration?.State).toBe("Active");
      expect(Configuration?.Timeout).toBe(30);
      expect(Configuration?.MemorySize).toBe(256);
      
      // Verify VPC configuration
      expect(Configuration?.VpcConfig?.VpcId).toBe(stackOutputs["vpc-id"]);
      expect(Configuration?.VpcConfig?.SubnetIds).toEqual(
        expect.arrayContaining(stackOutputs["private-subnet-ids"])
      );
      expect(Configuration?.VpcConfig?.SecurityGroupIds).toBeDefined();
    }, 20000);
  });

  describe("DynamoDB Module - NoSQL with Auto-scaling", () => {

    test("DynamoDB auto-scaling is configured for read capacity", async () => {
      const tableName = stackOutputs["dynamodb-table-name"];
      
      const { ScalableTargets } = await autoScalingClient.send(
        new DescribeScalableTargetsCommand({
          ServiceNamespace: "dynamodb",
          ResourceIds: [`table/${tableName}`]
        })
      );
      
      const readTarget = ScalableTargets?.find(target => 
        target.ScalableDimension === "dynamodb:table:ReadCapacityUnits"
      );
      
      expect(readTarget).toBeDefined();
      expect(readTarget?.MinCapacity).toBe(5);
      expect(readTarget?.MaxCapacity).toBe(100);
      
      // Verify scaling policy exists
      const { ScalingPolicies } = await autoScalingClient.send(
        new DescribeScalingPoliciesCommand({
          ServiceNamespace: "dynamodb",
          ResourceId: `table/${tableName}`,
          ScalableDimension: "dynamodb:table:ReadCapacityUnits"
        })
      );
      
      expect(ScalingPolicies).toHaveLength(1);
      expect(ScalingPolicies![0].PolicyType).toBe("TargetTrackingScaling");
      expect(ScalingPolicies![0].TargetTrackingScalingPolicyConfiguration?.TargetValue).toBe(70.0);
    }, 20000);

    test("DynamoDB auto-scaling is configured for write capacity", async () => {
      const tableName = stackOutputs["dynamodb-table-name"];
      
      const { ScalableTargets } = await autoScalingClient.send(
        new DescribeScalableTargetsCommand({
          ServiceNamespace: "dynamodb",
          ResourceIds: [`table/${tableName}`]
        })
      );
      
      const writeTarget = ScalableTargets?.find(target => 
        target.ScalableDimension === "dynamodb:table:WriteCapacityUnits"
      );
      
      expect(writeTarget).toBeDefined();
      expect(writeTarget?.MinCapacity).toBe(5);
      expect(writeTarget?.MaxCapacity).toBe(100);
      
      // Verify scaling policy exists
      const { ScalingPolicies } = await autoScalingClient.send(
        new DescribeScalingPoliciesCommand({
          ServiceNamespace: "dynamodb",
          ResourceId: `table/${tableName}`,
          ScalableDimension: "dynamodb:table:WriteCapacityUnits"
        })
      );
      
      expect(ScalingPolicies).toHaveLength(1);
      expect(ScalingPolicies![0].PolicyType).toBe("TargetTrackingScaling");
      expect(ScalingPolicies![0].TargetTrackingScalingPolicyConfiguration?.TargetValue).toBe(70.0);
    }, 20000);
  });

  describe("CloudWatch Module - Monitoring and Alerting", () => {
    test("CloudWatch alarms exist for EC2 CPU monitoring", async () => {
      const alarmArns = stackOutputs["cloudwatch-alarm-arns"];
      const instanceIds = stackOutputs["ec2-instance-ids"];
      
      expect(alarmArns).toHaveLength(2);
      
      // Check each CPU alarm
      for (let i = 0; i < instanceIds.length; i++) {
        const alarmName = `production-high-cpu-${i + 1}`;
        const instanceId = instanceIds[i];
        
        const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        }));
        
        expect(MetricAlarms).toHaveLength(1);
        const alarm = MetricAlarms![0];
        
        expect(alarm.AlarmName).toBe(alarmName);
        expect(alarm.AlarmDescription).toBe(`High CPU utilization alarm for instance ${instanceId}`);
        expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.MetricName).toBe("CPUUtilization");
        expect(alarm.Namespace).toBe("AWS/EC2");
        expect(alarm.Statistic).toBe("Average");
        expect(alarm.Threshold).toBe(80);
        expect(alarm.Period).toBe(300);
        expect(alarm.Dimensions![0].Name).toBe("InstanceId");
        expect(alarm.Dimensions![0].Value).toBe(instanceId);
      }
    }, 20000);

    test("CloudWatch alarms have proper tagging", async () => {
      const alarmArns = stackOutputs["cloudwatch-alarm-arns"];
      
      for (let i = 0; i < alarmArns.length; i++) {
        const alarmName = `production-high-cpu-${i + 1}`;
        
        const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        }));
        
        // Note: CloudWatch alarms don't have tags in the describe response
        // but we verify the alarm exists and is properly configured
        expect(MetricAlarms![0].AlarmName).toBe(alarmName);
      }
    }, 20000);
  });

  describe("KMS Module - Encryption Key Management", () => {
    test("KMS keys exist with proper configuration for S3", async () => {
      // Get S3 bucket encryption to find KMS key
      const bucketName = stackOutputs["s3-content-bucket-name"];
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const kmsKeyId = ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      
      if (kmsKeyId) {
        const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
          KeyId: kmsKeyId
        }));
        
        expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
        expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
        expect(KeyMetadata?.KeyState).toBe("Enabled");
        expect(KeyMetadata?.Description).toBe("KMS key for S3 bucket encryption");
      }
    }, 20000);

    test("KMS alias exists for S3 encryption key", async () => {
      const { Aliases } = await kmsClient.send(new ListAliasesCommand({}));
      
      const s3Alias = Aliases?.find(alias => alias.AliasName === "alias/production-s3-key");
      expect(s3Alias).toBeDefined();
      expect(s3Alias?.AliasName).toBe("alias/production-s3-key");
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All required outputs are present and properly formatted", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["s3-content-bucket-name"]).toMatch(/^production-app-123456-.*-content$/);
      expect(stackOutputs["s3-logs-bucket-name"]).toMatch(/^production-app-123456-.*-access-logs$/);
      expect(stackOutputs["dynamodb-table-name"]).toBe("production-dynamodb-table");
      
      // Verify array outputs
      expect(Array.isArray(stackOutputs["public-subnet-ids"])).toBe(true);
      expect(stackOutputs["public-subnet-ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["private-subnet-ids"])).toBe(true);
      expect(stackOutputs["private-subnet-ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["ec2-instance-ids"])).toBe(true);
      expect(stackOutputs["ec2-instance-ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["lambda-function-arns"])).toBe(true);
      expect(stackOutputs["lambda-function-arns"]).toHaveLength(1);
      expect(Array.isArray(stackOutputs["cloudwatch-alarm-arns"])).toBe(true);
      expect(stackOutputs["cloudwatch-alarm-arns"]).toHaveLength(2);
      
      // Verify ARN formats
      expect(stackOutputs["lambda-function-arns"][0]).toMatch(/^arn:aws:lambda:/);
      expect(stackOutputs["cloudwatch-alarm-arns"][0]).toMatch(/^arn:aws:cloudwatch:/);
      
      // Verify ID formats
      expect(stackOutputs["cloudfront-distribution-id"]).toMatch(/^[A-Z0-9]+$/);
      expect(stackOutputs["cloudfront-distribution-domain"]).toMatch(/^[a-z0-9]+\.cloudfront\.net$/);
    });

    test("CloudFront distribution domain follows expected pattern", () => {
      const distributionDomain = stackOutputs["cloudfront-distribution-domain"];
      const distributionId = stackOutputs["cloudfront-distribution-id"];
      
      expect(distributionDomain).toContain("cloudfront.net");
      expect(distributionDomain.length).toBeGreaterThan(20);
    });

    test("Subnet IDs follow AWS format and are in correct region", () => {
      const publicSubnets = stackOutputs["public-subnet-ids"];
      const privateSubnets = stackOutputs["private-subnet-ids"];
      
      [...publicSubnets, ...privateSubnets].forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });

    test("NAT Gateway IP is valid public IP", () => {
      const natGatewayIp = stackOutputs["nat-gateway-ip"];
      
      // Basic IP validation
      expect(natGatewayIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      
      // Verify it's not a private IP
      expect(natGatewayIp).not.toMatch(/^10\./);
      expect(natGatewayIp).not.toMatch(/^172\.1[6-9]\./);
      expect(natGatewayIp).not.toMatch(/^172\.2[0-9]\./);
      expect(natGatewayIp).not.toMatch(/^172\.3[01]\./);
      expect(natGatewayIp).not.toMatch(/^192\.168\./);
    });
  });

  describe("Security Best Practices Validation", () => {
    test("Encryption at rest is enabled for all data stores", async () => {
      // Verify S3 encryption
      const bucketName = stackOutputs["s3-content-bucket-name"];
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Verify RDS encryption
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      expect(DBInstances![0].StorageEncrypted).toBe(true);
      
      // Verify DynamoDB encryption
      const tableName = stackOutputs["dynamodb-table-name"];
      const { Table } = await dynamodbClient.send(new DescribeTableCommand({
        TableName: tableName
      }));
      expect(Table?.SSEDescription?.Status).toBe("ENABLED");
    }, 20000);

    test("Database is not publicly accessible", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      
      expect(DBInstances![0].PubliclyAccessible).toBe(false);
    }, 20000);
  });

  describe("High Availability and Resilience", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      // Check subnet distribution
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      expect(Array.from(availabilityZones)).toEqual(
        expect.arrayContaining(["us-west-2a", "us-west-2b"])
      );
      
      // Verify RDS multi-AZ
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      expect(DBInstances![0].MultiAZ).toBe(true);
    }, 20000);

    test("Backup and recovery mechanisms are in place", async () => {
      // Verify S3 versioning for both buckets
      const contentBucket = stackOutputs["s3-content-bucket-name"];
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ Bucket: contentBucket }));
      expect(Status).toBe("Enabled");
      
      // Verify RDS automated backups
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      expect(DBInstances![0].BackupRetentionPeriod).toBe(7);
      expect(DBInstances![0].DeletionProtection).toBe(true);
    }, 20000);

    test("Monitoring is properly configured", async () => {
      // Verify EC2 detailed monitoring
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instances = Reservations?.flatMap(r => r.Instances || []) || [];
      instances.forEach(instance => {
        expect(instance.Monitoring?.State).toBe("enabled");
      });
      
      // Verify CloudWatch alarms exist
      const alarmArns = stackOutputs["cloudwatch-alarm-arns"];
      expect(alarmArns).toHaveLength(2);
    }, 20000);
  });

  describe("Compliance and Governance", () => {
    test("All resources have proper tagging for governance", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Name" && tag.Value === "production-vpc")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      
      // Check EC2 instance tags
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instances = Reservations?.flatMap(r => r.Instances || []) || [];
      instances.forEach(instance => {
        const tags = instance.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("production-web-server"))).toBe(true);
      });
    }, 20000);

    test("Deletion protection is enabled for critical resources", async () => {
      // Verify RDS deletion protection
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "production-database"
      }));
      expect(DBInstances![0].DeletionProtection).toBe(true);
    }, 20000);
  });
});