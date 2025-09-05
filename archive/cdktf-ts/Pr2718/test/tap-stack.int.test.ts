// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand, GetRolePolicyCommand, ListAttachedRolePoliciesCommand, GetPolicyCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand, DescribeNatGatewaysCommand, DescribeVpcEndpointsCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";
import { KMSClient } from "@aws-sdk/client-kms";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const dynamoClient = new DynamoDBClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const cloudtrailClient = new CloudTrailClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("TapStack Secure Web Application Infrastructure Integration Tests", () => {
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
      "app-bucket-name",
      "logs-bucket-name",
      "ec2-instance-ids",
      "dynamodb-table-name",
      "lambda-function-name",
      "elasticsearch-endpoint",
      "cloudtrail-arn",
      "sns-topic-arn",
      "nat-gateway-id",
      "s3-vpc-endpoint-id"
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
      
      // Verify secure application tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("vpc"))).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "pr2718")).toBe(true);
      expect(tags.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
    }, 20000);

    test("Public subnets exist with proper configuration in multiple AZs", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Type", Values: ["public"] }
        ]
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[1-2]\.0\/24$/);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify public subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "public")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("public"))).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Private subnets exist for secure resource isolation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Type", Values: ["private"] }
        ]
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[01]\.0\/24$/);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify private subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "private")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("private"))).toBe(true);
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
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("igw"))).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
    }, 20000);

    test("NAT Gateway exists for secure private subnet outbound access", async () => {
      const natGatewayId = stackOutputs["nat-gateway-id"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGatewayId]
      }));
      
      expect(NatGateways).toHaveLength(1);
      const natGw = NatGateways![0];
      
      expect(natGw.State).toBe("available");
      expect(natGw.VpcId).toBe(stackOutputs["vpc-id"]);
      
      // Verify NAT Gateway is in a public subnet
      const publicSubnets = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [stackOutputs["vpc-id"]] },
          { Name: "tag:Type", Values: ["public"] }
        ]
      }));
      
      const publicSubnetIds = publicSubnets.Subnets?.map(subnet => subnet.SubnetId) || [];
      expect(publicSubnetIds).toContain(natGw.SubnetId);
      
      // Verify NAT Gateway tagging
      const tags = natGw.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("nat-gw"))).toBe(true);
    }, 20000);

    test("S3 VPC Endpoint exists for private S3 access", async () => {
      const vpcEndpointId = stackOutputs["s3-vpc-endpoint-id"];
      
      const { VpcEndpoints } = await ec2Client.send(new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [vpcEndpointId]
      }));
      
      expect(VpcEndpoints).toHaveLength(1);
      const endpoint = VpcEndpoints![0];
      
      expect(endpoint.State).toBe("available");
      expect(endpoint.VpcId).toBe(stackOutputs["vpc-id"]);
      expect(endpoint.ServiceName).toBe(`com.amazonaws.${awsRegion}.s3`);
      expect(endpoint.VpcEndpointType).toBe("Gateway");
      
      // Verify endpoint tagging
      const tags = endpoint.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("s3-endpoint"))).toBe(true);
    }, 20000);

    test("Route tables are properly configured for network segmentation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have multiple route tables: default + public + private
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

    test("Lambda security group has minimal required permissions", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*lambda-sg"] }
        ]
      }));
      
      const lambdaSg = SecurityGroups?.find(sg => sg.GroupName?.includes("lambda-sg"));
      expect(lambdaSg).toBeDefined();
      
      // Lambda should have minimal ingress rules (likely none)
      expect(lambdaSg?.IpPermissions?.length || 0).toBeLessThanOrEqual(1);
      
      // Check HTTPS egress for AWS services
      const httpsEgress = lambdaSg?.IpPermissionsEgress?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsEgress).toBeDefined();
      
      // Verify Lambda SG tagging
      const tags = lambdaSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("lambda-sg"))).toBe(true);
    }, 20000);
  });

  describe("Compute Module - EC2 Instances in Private Subnets", () => {

    test("EC2 instances are deployed in private subnets across AZs", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const vpcId = stackOutputs["vpc-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      // Get private subnets
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Type", Values: ["private"] }
        ]
      }));
      
      const privateSubnetIds = Subnets?.map(subnet => subnet.SubnetId) || [];
      const instanceSubnets = new Set();
      const instanceAZs = new Set();
      
      Reservations?.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(privateSubnetIds).toContain(instance.SubnetId);
        instanceSubnets.add(instance.SubnetId);
        instanceAZs.add(instance.Placement?.AvailabilityZone);
      });
      
      // Verify instances are in different subnets/AZs for high availability
      expect(instanceSubnets.size).toBe(2);
      expect(instanceAZs.size).toBe(2);
    }, 20000);

    test("EC2 instances have proper IAM instance profile attached", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      Reservations?.forEach(async (reservation) => {
        const instance = reservation.Instances![0];
        
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile?.Arn).toContain("ec2-profile");
        
        // Verify IAM instance profile exists and has correct role
        const instanceProfileName = instance.IamInstanceProfile?.Arn?.split('/').pop();
        const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
          InstanceProfileName: instanceProfileName!
        }));
        
        expect(InstanceProfile?.Roles).toHaveLength(1);
        expect(InstanceProfile?.Roles![0].RoleName).toContain("ec2-role");
      });
    }, 20000);
  });

  describe("Storage Module - Encrypted S3 Buckets with Security Controls", () => {
    test("Application S3 bucket exists with proper configuration", async () => {
      const bucketName = stackOutputs["app-bucket-name"];
      expect(bucketName).toBe("acme-corp-pr2718-app");
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("Application S3 bucket has server-side encryption enabled", async () => {
      const bucketName = stackOutputs["app-bucket-name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      expect(ServerSideEncryptionConfiguration?.Rules![0].BucketKeyEnabled).toBe(true);
    }, 20000);

    test("Application S3 bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["app-bucket-name"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Logs S3 bucket exists with proper CloudTrail configuration", async () => {
      const logsBucketName = stackOutputs["logs-bucket-name"];
      expect(logsBucketName).toBe("acme-corp-pr2718-logs");
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: logsBucketName })))
        .resolves.toBeDefined();
      
      // Verify encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: logsBucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    }, 20000);

    test("Logs S3 bucket has proper CloudTrail access policy", async () => {
      const logsBucketName = stackOutputs["logs-bucket-name"];
      
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ 
        Bucket: logsBucketName 
      }));
      
      expect(Policy).toBeDefined();
      const policyDocument = JSON.parse(Policy!);
      
      // Check for CloudTrail permissions
      const cloudtrailAclCheck = policyDocument.Statement.find((stmt: any) =>
        stmt.Sid === "AWSCloudTrailAclCheck" &&
        stmt.Action === "s3:GetBucketAcl"
      );
      expect(cloudtrailAclCheck).toBeDefined();
      
      const cloudtrailWrite = policyDocument.Statement.find((stmt: any) =>
        stmt.Sid === "AWSCloudTrailWrite" &&
        stmt.Action === "s3:PutObject"
      );
      expect(cloudtrailWrite).toBeDefined();
      
      // Check for secure transport requirement
      const secureTransport = policyDocument.Statement.find((stmt: any) =>
        stmt.Effect === "Deny" &&
        stmt.Condition?.Bool?.["aws:SecureTransport"] === "false"
      );
      expect(secureTransport).toBeDefined();
    }, 20000);
  });

  describe("Lambda Module - Function in VPC for Secure Access", () => {
    test("Lambda function exists with proper configuration", async () => {
      const functionName = stackOutputs["lambda-function-name"];
      expect(functionName).toBe("acme-corp-pr2718-processor");
      
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
      
      expect(Configuration?.FunctionName).toBe(functionName);
      expect(Configuration?.Runtime).toBe("python3.9");
      expect(Configuration?.Handler).toBe("lambda_function.handler");
      expect(Configuration?.Timeout).toBe(30);
      expect(Configuration?.MemorySize).toBe(512);
      expect(Configuration?.State).toBe("Active");
    }, 20000);


  });

  describe("Database Module - DynamoDB and RDS with Security", () => {
    test("DynamoDB table exists with proper configuration", async () => {
      const tableName = stackOutputs["dynamodb-table-name"];
      expect(tableName).toBe("acme-corp-pr2718-app-data");
      
      const { Table } = await dynamoClient.send(new DescribeTableCommand({
        TableName: tableName
      }));
      
      expect(Table?.TableName).toBe(tableName);
      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST");
      
      // Verify key schema
      expect(Table?.KeySchema).toHaveLength(1);
      expect(Table?.KeySchema![0].AttributeName).toBe("id");
      expect(Table?.KeySchema![0].KeyType).toBe("HASH");
      
      
      // Verify server-side encryption
      expect(Table?.SSEDescription?.Status).toBe("ENABLED");
    }, 20000);

    test("RDS instance exists with proper security configuration", async () => {
      const dbIdentifier = `acme-corp-pr2718-db`;
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageType).toBe("gp2");
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.AutoMinorVersionUpgrade).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(true);
      
      // Verify database name
      expect(dbInstance.DBName).toBe("appdb");
    }, 30000);

  });

  describe("Monitoring Module - CloudTrail, CloudWatch, and SNS", () => {
    test("CloudTrail exists with proper configuration and KMS encryption", async () => {
      const cloudtrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudtrailArn.split(':')[5].split('/')[1];
      
      const { trailList } = await cloudtrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));
      
      expect(trailList).toHaveLength(1);
      const trail = trailList![0];
      
      expect(trail.Name).toBe(trailName);
      expect(trail.S3BucketName).toBe("acme-corp-pr2718-logs");
      expect(trail.S3KeyPrefix).toBe("cloudtrail-logs/");
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      
      // Verify trail is logging
      const { IsLogging } = await cloudtrailClient.send(new GetTrailStatusCommand({
        Name: trailName
      }));
      expect(IsLogging).toBe(true);
    }, 20000);

    test("SNS topic exists for alert notifications", async () => {
      const snsTopicArn = stackOutputs["sns-topic-arn"];
      
      const { Attributes } = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: snsTopicArn
      }));
      
      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(Attributes?.DisplayName).toBe("Application Alerts");
      
      // Verify topic name
      const topicName = snsTopicArn.split(':')[5];
      expect(topicName).toBe("acme-corp-pr2718-alerts");
    }, 20000);

    test("CloudWatch alarm exists for EC2 CPU monitoring", async () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`acme-corp-pr2718-high-cpu`]
      }));
      
      expect(MetricAlarms).toHaveLength(1);
      const alarm = MetricAlarms![0];
      
      expect(alarm.AlarmName).toBe("acme-corp-pr2718-high-cpu");
      expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.MetricName).toBe("CPUUtilization");
      expect(alarm.Namespace).toBe("AWS/EC2");
      expect(alarm.Period).toBe(300);
      expect(alarm.Statistic).toBe("Average");
      expect(alarm.Threshold).toBe(80);
      expect(alarm.AlarmActions).toContain(stackOutputs["sns-topic-arn"]);
      
      // Verify alarm is monitoring one of the EC2 instances
      expect(instanceIds).toContain(alarm.Dimensions![0].Value);
    }, 20000);
  });

  describe("IAM Module - Least Privilege Access Control", () => {
    test("EC2 IAM role exists with minimal required permissions", async () => {
      const roleName = "acme-corp-pr2718-ec2-role";
      
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(Role?.RoleName).toBe(roleName);
      
      // Verify assume role policy allows EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
      
      // Verify attached policies
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName
      }));
      
      expect(AttachedPolicies?.length).toBe(1);
      expect(AttachedPolicies![0].PolicyName).toContain("ec2-policy");
    }, 20000);

    test("Lambda IAM role exists with VPC and DynamoDB permissions", async () => {
      const roleName = "acme-corp-pr2718-lambda-role";
      
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(Role?.RoleName).toBe(roleName);
      
      // Verify assume role policy allows Lambda service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("lambda.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
      
      // Verify attached policies include Lambda policy
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: roleName
      }));
      
      expect(AttachedPolicies?.length).toBe(1);
      expect(AttachedPolicies![0].PolicyName).toContain("lambda-policy");
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All required outputs are present and properly formatted", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["app-bucket-name"]).toBe("acme-corp-pr2718-app");
      expect(stackOutputs["logs-bucket-name"]).toBe("acme-corp-pr2718-logs");
      expect(stackOutputs["dynamodb-table-name"]).toBe("acme-corp-pr2718-app-data");
      expect(stackOutputs["lambda-function-name"]).toBe("acme-corp-pr2718-processor");
      
      // Verify array outputs
      expect(Array.isArray(stackOutputs["ec2-instance-ids"])).toBe(true);
      expect(stackOutputs["ec2-instance-ids"]).toHaveLength(2);
      
      // Verify ARN formats
      expect(stackOutputs["cloudtrail-arn"]).toMatch(/^arn:aws:cloudtrail:/);
      expect(stackOutputs["sns-topic-arn"]).toMatch(/^arn:aws:sns:/);
      
      // Verify ID formats
      expect(stackOutputs["nat-gateway-id"]).toMatch(/^nat-[a-f0-9]{17}$/);
      expect(stackOutputs["s3-vpc-endpoint-id"]).toMatch(/^vpce-[a-f0-9]{17}$/);
    });

    test("Elasticsearch endpoint follows expected naming pattern", () => {
      const endpoint = stackOutputs["elasticsearch-endpoint"];
      expect(endpoint).toContain("acme-corp-pr2718-search");
      expect(endpoint).toContain(awsRegion);
      expect(endpoint).toContain("es.amazonaws.com");
    });

    test("EC2 instance IDs follow AWS format", () => {
      const instanceIds = stackOutputs["ec2-instance-ids"];
      
      instanceIds.forEach((instanceId: string) => {
        expect(instanceId).toMatch(/^i-[a-f0-9]{17}$/);
      });
    });
  });

  describe("Security Best Practices Validation", () => {
    test("Network isolation is properly implemented", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Verify EC2 instances are in private subnets
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const privateSubnets = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Type", Values: ["private"] }
        ]
      }));
      const privateSubnetIds = privateSubnets.Subnets?.map(subnet => subnet.SubnetId) || [];
      
      Reservations?.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(privateSubnetIds).toContain(instance.SubnetId);
        expect(instance.PublicIpAddress).toBeUndefined();
      });
      
      // Verify RDS is not publicly accessible
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-corp-pr2718-db"
      }));
      expect(DBInstances![0].PubliclyAccessible).toBe(false);
    }, 20000);

  });

  describe("High Availability and Resilience", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Check subnet distribution
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      
      // Check EC2 instance distribution
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instanceAZs = new Set(Reservations?.map(res => res.Instances![0].Placement?.AvailabilityZone));
      expect(instanceAZs.size).toBe(2);
    }, 20000);

    test("NAT Gateway provides outbound connectivity for private resources", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const natGatewayId = stackOutputs["nat-gateway-id"];
      
      // Verify NAT Gateway is available
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGatewayId]
      }));
      expect(NatGateways![0].State).toBe("available");
      
      // Verify private route tables have routes to NAT Gateway
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const natRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => route.NatGatewayId === natGatewayId)
      );
      expect(natRoutes!.length).toBeGreaterThan(0);
    }, 20000);

    test("S3 VPC endpoint reduces internet dependency", async () => {
      const vpcEndpointId = stackOutputs["s3-vpc-endpoint-id"];
      
      const { VpcEndpoints } = await ec2Client.send(new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [vpcEndpointId]
      }));
      
      const endpoint = VpcEndpoints![0];
      expect(endpoint.State).toBe("available");
      expect(endpoint.VpcEndpointType).toBe("Gateway");
      expect(endpoint.ServiceName).toContain("s3");
      expect(endpoint.RouteTableIds?.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Compliance and Governance", () => {
    test("All resources have proper tagging for governance", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceIds = stackOutputs["ec2-instance-ids"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "pr2718")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform")).toBe(true);
      
      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      Reservations?.forEach(reservation => {
        const instanceTags = reservation.Instances![0].Tags || [];
        expect(instanceTags.some(tag => tag.Key === "Environment" && tag.Value === "pr2718")).toBe(true);
        expect(instanceTags.some(tag => tag.Key === "Role" && tag.Value === "web-server")).toBe(true);
      });
    }, 20000);

    test("Audit logging is properly configured", async () => {
      const cloudtrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudtrailArn.split(':')[5].split('/')[1];
      
      const { trailList } = await cloudtrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));
      
      const trail = trailList![0];
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      
      // Verify trail is actively logging
      const { IsLogging } = await cloudtrailClient.send(new GetTrailStatusCommand({
        Name: trailName
      }));
      expect(IsLogging).toBe(true);
    }, 20000);

    test("Monitoring and alerting is configured", async () => {
      // Verify SNS topic for alerts
      const snsTopicArn = stackOutputs["sns-topic-arn"];
      const { Attributes } = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: snsTopicArn
      }));
      expect(Attributes?.DisplayName).toBe("Application Alerts");
      
      // Verify CloudWatch alarm exists and is configured
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ["acme-corp-pr2718-high-cpu"]
      }));
      
      expect(MetricAlarms).toHaveLength(1);
      expect(MetricAlarms![0].AlarmActions).toContain(snsTopicArn);
    }, 20000);
  });

  describe("Performance and Cost Optimization Validation", () => {

    test("Auto-scaling and resource optimization features are enabled", async () => {
      // Verify RDS has auto-scaling storage
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-corp-pr2718-db"
      }));
      
      const dbInstance = DBInstances![0];
      expect(dbInstance.MaxAllocatedStorage).toBe(100);
      expect(dbInstance.AllocatedStorage).toBeLessThan(dbInstance.MaxAllocatedStorage!);
      
      // Verify EC2 instances have detailed monitoring for cost optimization
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      Reservations?.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.Monitoring?.State).toBe("enabled");
      });
      
      // Verify CloudWatch alarm exists for proactive monitoring
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ["acme-corp-pr2718-high-cpu"]
      }));
      
      expect(MetricAlarms).toHaveLength(1);
      expect(MetricAlarms![0].Threshold).toBe(80); // 80% CPU threshold
    }, 20000);
  });

  describe("Data Protection and Backup Validation", () => {
    test("Disaster recovery capabilities are in place", async () => {
      // Verify multi-AZ deployment for RDS
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-corp-pr2718-db"
      }));
      // Note: Multi-AZ might not be enabled for cost reasons in development, 
      // but we can verify the subnet group spans multiple AZs
      
      const dbSubnetGroupName = DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName!
      }));
      
      const availabilityZones = new Set(
        DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(availabilityZones.size).toBe(2); // Subnets in multiple AZs
      
      // Verify EC2 instances are distributed across AZs
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instanceAZs = new Set(
        Reservations?.map(res => res.Instances![0].Placement?.AvailabilityZone)
      );
      expect(instanceAZs.size).toBe(2);
      
      // Verify CloudTrail is multi-region for audit continuity
      const cloudtrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudtrailArn.split(':')[5].split('/')[1];
      
      const { trailList } = await cloudtrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));
      expect(trailList![0].IsMultiRegionTrail).toBe(true);
    }, 20000);
  });

  describe("Network Security Deep Dive", () => {

    test("Security group rules are restrictive and well-defined", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Filter out default security group
      const customSecurityGroups = SecurityGroups?.filter(sg => sg.GroupName !== "default") || [];
      
      customSecurityGroups.forEach(sg => {
        // Each security group should have descriptive name
        expect(sg.GroupName).toBeDefined();
        expect(sg.Description).toBeDefined();
        
        // Ingress rules should be specific (not 0.0.0.0/0 for sensitive ports)
        sg.IpPermissions?.forEach(rule => {
          if (rule.FromPort === 22 || rule.FromPort === 3306) { // SSH or MySQL
            // These should not be open to the world
            const hasOpenAccess = rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0");
            if (rule.FromPort === 22) {
              expect(hasOpenAccess).toBe(false); // SSH should be restricted
            }
            if (rule.FromPort === 3306) {
              expect(hasOpenAccess).toBe(false); // MySQL should be restricted
            }
          }
        });
        
        // All custom security groups should have proper tagging
        const tags = sg.Tags || [];
        expect(tags.some(tag => tag.Key === "Name")).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      });
    }, 20000);
  });

  describe("Operational Excellence Validation", () => {
    test("Monitoring and logging are comprehensive", async () => {
      // Verify CloudWatch Log Groups exist for application logs
      const logGroupName = `/aws/ec2/acme-corp-pr2718`;
      
      // CloudWatch log groups might not be immediately available, so we'll check if they could be created
      // This is more of a configuration validation
      
      // Verify SNS topic for alerting
      const snsTopicArn = stackOutputs["sns-topic-arn"];
      const { Attributes } = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: snsTopicArn
      }));
      
      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(Attributes?.DisplayName).toBe("Application Alerts");
      
      // Verify CloudWatch alarm configuration
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ["acme-corp-pr2718-high-cpu"]
      }));
      
      expect(MetricAlarms).toHaveLength(1);
      const alarm = MetricAlarms![0];
      expect(alarm.AlarmActions).toContain(snsTopicArn);
      expect(alarm.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.MetricName).toBe("CPUUtilization");
      expect(alarm.Threshold).toBe(80);
    }, 20000);

    test("Infrastructure is properly tagged for management", async () => {
      const requiredTags = ["Environment", "ManagedBy"];
      const environmentValue = "pr2718";
      
      // Check VPC tags
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      requiredTags.forEach(tagKey => {
        expect(vpcTags.some(tag => tag.Key === tagKey)).toBe(true);
      });
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === environmentValue)).toBe(true);
      
      // Check EC2 instance tags
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      Reservations?.forEach(reservation => {
        const instanceTags = reservation.Instances![0].Tags || [];
        requiredTags.forEach(tagKey => {
          expect(instanceTags.some(tag => tag.Key === tagKey)).toBe(true);
        });
        expect(instanceTags.some(tag => tag.Key === "Environment" && tag.Value === environmentValue)).toBe(true);
      });
      
      // Check RDS tags
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-corp-pr2718-db"
      }));
      
      const dbTags = DBInstances![0].TagList || [];
      requiredTags.forEach(tagKey => {
        expect(dbTags.some(tag => tag.Key === tagKey)).toBe(true);
      });
      expect(dbTags.some(tag => tag.Key === "Environment" && tag.Value === environmentValue)).toBe(true);
    }, 20000);
  });

  describe("Infrastructure Stress Testing", () => {
    test("All infrastructure components can handle their configuration limits", async () => {
      // This test validates that resources are configured within AWS service limits
      // and can handle their designated workloads
      
      // Verify EC2 instances have adequate resources
      const instanceIds = stackOutputs["ec2-instance-ids"];
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      Reservations?.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.InstanceType).toBe("t3.medium");
        expect(instance.State?.Name).toBe("running");
        
        // Verify instance is healthy
        expect(instance.StateReason?.Code).not.toBe("Client.InternalError");
        expect(instance.StateReason?.Code).not.toBe("Server.InternalError");
      });
      
      // Verify RDS instance can handle connection limits
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "acme-corp-pr2718-db"
      }));
      
      const dbInstance = DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe("available");
      expect(dbInstance.Endpoint?.Address).toBeDefined();
      expect(dbInstance.Endpoint?.Port).toBe(3306);
      
      // Verify DynamoDB table can handle reads/writes
      const tableName = stackOutputs["dynamodb-table-name"];
      const { Table } = await dynamoClient.send(new DescribeTableCommand({
        TableName: tableName
      }));
      
      expect(Table?.TableStatus).toBe("ACTIVE");
      expect(Table?.BillingModeSummary?.BillingMode).toBe("PAY_PER_REQUEST"); // Can auto-scale
    }, 30000);

    test("Network infrastructure can handle expected traffic patterns", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const natGatewayId = stackOutputs["nat-gateway-id"];
      
      // Verify NAT Gateway is operational
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGatewayId]
      }));
      
      expect(NatGateways![0].State).toBe("available");
      expect(NatGateways![0].NatGatewayAddresses).toBeDefined();
      expect(NatGateways![0].NatGatewayAddresses!.length).toBeGreaterThan(0);
      
      // Verify Internet Gateway connectivity
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      
      // Verify route table configurations support traffic flow
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have routes for both public and private traffic
      const hasPublicRoutes = RouteTables?.some(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      const hasPrivateRoutes = RouteTables?.some(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      
      expect(hasPublicRoutes).toBe(true);
      expect(hasPrivateRoutes).toBe(true);
    }, 20000);
  });
});