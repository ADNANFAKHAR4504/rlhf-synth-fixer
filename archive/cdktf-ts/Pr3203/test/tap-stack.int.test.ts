// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, HeadBucketCommand, GetBucketLoggingCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";
import { LambdaClient, GetFunctionCommand, GetFunctionConfigurationCommand } from "@aws-sdk/client-lambda";
import { KMSClient, DescribeKeyCommand, GetKeyPolicyCommand } from "@aws-sdk/client-kms";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { SSMClient, GetParameterCommand, DescribeParametersCommand } from "@aws-sdk/client-ssm";
import { WAFV2Client, GetWebACLCommand } from "@aws-sdk/client-wafv2";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudtrailClient = new CloudTrailClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const wafClient = new WAFV2Client({ region: awsRegion });

describe("TapStack Secure Infrastructure Integration Tests", () => {
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
      "vpc_id",
      "public_subnet_ids", 
      "private_subnet_ids",
      "database_subnet_ids",
      "rds_endpoint",
      "logging_bucket_name",
      "cloudtrail_bucket_name",
      "app_bucket_name",
      "cloudtrail_arn",
      "lambda_arn",
      "kms_key_id"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Secure Network Foundation", () => {
    test("VPC exists with correct configuration and DNS enabled", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify production tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("Public subnets configured correctly across multiple AZs", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        expect(tags.some(tag => tag.Key === "Tier" && tag.Value === "Public")).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Private subnets exist for secure compute resources", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        expect(tags.some(tag => tag.Key === "Tier" && tag.Value === "Private")).toBe(true);
      });

      // Verify subnets are in different AZs
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Database subnets exist for RDS deployment", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const databaseSubnetIds = stackOutputs["database_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: databaseSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
        expect(tags.some(tag => tag.Key === "Tier" && tag.Value === "Database")).toBe(true);
      });

      // Verify subnets are in different AZs
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Internet Gateway attached to VPC", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
      // Verify IGW tagging
      const tags = InternetGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("Route tables configured for proper network segmentation", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have default + public + private + database route tables
      expect(RouteTables!.length).toBeGreaterThanOrEqual(4);
      
      // Check for internet gateway routes in public route tables
      const internetRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(internetRoutes!.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Security Groups - Least Privilege Access Controls", () => {
    test("Lambda security group exists with proper configuration", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: ["*lambda-sg*"] }
        ]
      }));
      
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      const lambdaSg = SecurityGroups![0];
      
      expect(lambdaSg.Description).toContain("Lambda functions");
      
      // Verify Lambda SG tagging
      const tags = lambdaSg.Tags || [];
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);

    test("RDS security group restricts database access", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: ["*db-sg*", "*rds-sg*"] }
        ]
      }));
      
      expect(SecurityGroups!.length).toBeGreaterThan(0);
      const dbSg = SecurityGroups![0];
      
      // Check for MySQL rule (port 3306)
      const mysqlRule = dbSg.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      
      // Should only allow access from Lambda security group
      expect(mysqlRule?.UserIdGroupPairs).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs!.length).toBeGreaterThan(0);
      
      // Verify DB SG tagging
      const tags = dbSg.Tags || [];
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
    }, 20000);
  });

  describe("KMS Module - Encryption Key Management", () => {
    test("KMS key exists with proper configuration", async () => {
      const kmsKeyId = stackOutputs["kms_key_id"];
      
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));
      
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.Description).toBe("KMS key for encrypting resources");
      expect(KeyMetadata?.MultiRegion).toBe(false);
      expect(KeyMetadata?.CustomerMasterKeySpec).toBe("SYMMETRIC_DEFAULT");
      
    }, 20000);

    test("KMS key policy allows CloudTrail to encrypt logs", async () => {
      const kmsKeyId = stackOutputs["kms_key_id"];
      
      const { Policy } = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: kmsKeyId,
        PolicyName: "default"
      }));
      
      const policyDoc = JSON.parse(Policy!);
      
      // Check for CloudTrail permissions
      const cloudTrailStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Principal?.Service === "cloudtrail.amazonaws.com"
      );
      
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Action).toContain("kms:GenerateDataKey*");
      expect(cloudTrailStatement.Action).toContain("kms:Decrypt");
    }, 20000);
  });

  describe("S3 Module - Secure Storage Buckets", () => {
    test("Logging bucket exists with encryption enabled", async () => {
      const bucketName = stackOutputs["logging_bucket_name"];
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
      
      // Check encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules![0].BucketKeyEnabled).toBe(true);
    }, 20000);

    test("CloudTrail bucket configured with proper access policy", async () => {
      const bucketName = stackOutputs["cloudtrail_bucket_name"];
      
      // Test bucket exists
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
      
      // Check bucket policy
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
      const policyDoc = JSON.parse(Policy!);
      
      // Verify CloudTrail access statements
      const cloudTrailStatements = policyDoc.Statement.filter((stmt: any) =>
        stmt.Principal?.Service === "cloudtrail.amazonaws.com"
      );
      
      expect(cloudTrailStatements.length).toBeGreaterThanOrEqual(2);
      
      // Check for ACL check permission
      const aclStatement = cloudTrailStatements.find((stmt: any) =>
        stmt.Action === "s3:GetBucketAcl"
      );
      expect(aclStatement).toBeDefined();
      
      // Check for write permission
      const writeStatement = cloudTrailStatements.find((stmt: any) =>
        stmt.Action === "s3:PutObject"
      );
      expect(writeStatement).toBeDefined();
    }, 20000);

    test("Application bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["app_bucket_name"];
      
      // Test bucket exists
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
      
      // Check versioning
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 buckets have logging configured", async () => {
      const appBucketName = stackOutputs["app_bucket_name"];
      const loggingBucketName = stackOutputs["logging_bucket_name"];
      
      const { LoggingEnabled } = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: appBucketName })
      );
      
      expect(LoggingEnabled?.TargetBucket).toBe(loggingBucketName);
      expect(LoggingEnabled?.TargetPrefix).toBe("app-logs/");
    }, 20000);
  });

  describe("CloudTrail Module - Audit Logging", () => {
    test("CloudTrail exists with secure configuration", async () => {
      const trailArn = stackOutputs["cloudtrail_arn"];
      const trailName = trailArn.split('/').pop();
      
      const { trailList } = await cloudtrailClient.send(
        new DescribeTrailsCommand({ trailNameList: [trailName!] })
      );
      
      expect(trailList).toHaveLength(1);
      const trail = trailList![0];
      
      expect(trail.Name).toBe("secure-tap-cloudtrail");
      expect(trail.S3BucketName).toBe(stackOutputs["cloudtrail_bucket_name"]);
    }, 20000);

    test("CloudTrail is actively logging", async () => {
      const trailArn = stackOutputs["cloudtrail_arn"];
      const trailName = trailArn.split('/').pop();
      
      const { IsLogging } = await cloudtrailClient.send(
        new GetTrailStatusCommand({ Name: trailName! })
      );
      
      expect(IsLogging).toBe(true);
    }, 20000);
  });

  describe("RDS Module - Secure Database Instance", () => {
    test("RDS instance exists with secure configuration", async () => {
      const rdsEndpoint = stackOutputs["rds_endpoint"];
      const dbIdentifier = "secure-tap-db";
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.EngineVersion).toMatch(/^8\.0/);
      expect(dbInstance.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.Endpoint?.Address).toContain(rdsEndpoint.split(':')[0]);
    }, 30000);

    test("RDS subnet group uses database subnets", async () => {
      const dbIdentifier = "secure-tap-db";
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbSubnetGroupName = DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName!
      }));
      
      const subnetIds = DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      const databaseSubnetIds = stackOutputs["database_subnet_ids"];
      
      // Verify all RDS subnets are database subnets
      subnetIds.forEach(subnetId => {
        expect(databaseSubnetIds).toContain(subnetId);
      });
      
      // Verify multiple AZs
      const availabilityZones = new Set(
        DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(availabilityZones.size).toBe(2);
    }, 20000);
  });

  describe("Lambda Module - Serverless Functions in VPC", () => {
    test("Lambda function exists with proper configuration", async () => {
      const lambdaArn = stackOutputs["lambda_arn"];
      const functionName = "secure-tap-function";
      
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: functionName
      }));
      
      expect(Configuration?.FunctionName).toBe(functionName);
      expect(Configuration?.Runtime).toBe("nodejs20.x");
      expect(Configuration?.Handler).toBe("index.handler");
      expect(Configuration?.State).toBe("Active");
      expect(Configuration?.Timeout).toBe(30);
      expect(Configuration?.MemorySize).toBe(512);
      expect(Configuration?.FunctionArn).toBe(lambdaArn);
    }, 20000);

  });

  describe("Parameter Store Module - Secure Configuration Management", () => {
    test("Database credentials stored in Parameter Store", async () => {
      // Check username parameter
      const usernameParam = await ssmClient.send(new GetParameterCommand({
        Name: "/secure-tap/db/username",
        WithDecryption: true
      }));
      
      expect(usernameParam.Parameter?.Name).toBe("/secure-tap/db/username");
      expect(usernameParam.Parameter?.Type).toBe("SecureString");
      expect(usernameParam.Parameter?.Value).toBe("admin");
      
      // Check password parameter exists (we won't verify the actual value)
      const passwordParam = await ssmClient.send(new GetParameterCommand({
        Name: "/secure-tap/db/password",
        WithDecryption: false
      }));
      
      expect(passwordParam.Parameter?.Name).toBe("/secure-tap/db/password");
      expect(passwordParam.Parameter?.Type).toBe("SecureString");
    }, 20000);

    test("Parameters are encrypted with KMS", async () => {
      const kmsKeyId = stackOutputs["kms_key_id"];
      
      const { Parameters } = await ssmClient.send(new DescribeParametersCommand({
        ParameterFilters: [
          { Key: "Name", Values: ["/secure-tap/db/username", "/secure-tap/db/password"] }
        ]
      }));
      
      expect(Parameters).toHaveLength(2);
      
      Parameters?.forEach(param => {
        expect(param.Type).toBe("SecureString");
        expect(param.KeyId).toBe(kmsKeyId);
      });
    }, 20000);
  });

  describe("High Availability and Disaster Recovery", () => {
    test("Resources distributed across multiple availability zones", async () => {
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      const databaseSubnetIds = stackOutputs["database_subnet_ids"];
      
      // Check subnet distribution
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      
      // Verify each subnet type is in both AZs
      const publicAZs = new Set();
      const privateAZs = new Set();
      const databaseAZs = new Set();
      
      Subnets?.forEach(subnet => {
        if (publicSubnetIds.includes(subnet.SubnetId!)) {
          publicAZs.add(subnet.AvailabilityZone);
        } else if (privateSubnetIds.includes(subnet.SubnetId!)) {
          privateAZs.add(subnet.AvailabilityZone);
        } else if (databaseSubnetIds.includes(subnet.SubnetId!)) {
          databaseAZs.add(subnet.AvailabilityZone);
        }
      });
      
      expect(publicAZs.size).toBe(2);
      expect(privateAZs.size).toBe(2);
      expect(databaseAZs.size).toBe(2);
    }, 20000);

    test("Backup and recovery mechanisms in place", async () => {
      // Verify S3 versioning
      const buckets = [
        stackOutputs["logging_bucket_name"],
        stackOutputs["app_bucket_name"]
      ];
      
      for (const bucketName of buckets) {
        const { Status } = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(Status).toBe("Enabled");
      }
      
      // Verify RDS automated backups
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "secure-tap-db"
      }));
      expect(DBInstances![0].BackupRetentionPeriod).toBe(7);
      expect(DBInstances![0].DeletionProtection).toBe(true);
    }, 20000);
  });

  describe("Security Best Practices Validation", () => {
    test("All data at rest is encrypted", async () => {
      // Verify S3 encryption for all buckets
      const buckets = [
        stackOutputs["logging_bucket_name"],
        stackOutputs["cloudtrail_bucket_name"],
        stackOutputs["app_bucket_name"]
      ];
      
      for (const bucketName of buckets) {
        const { ServerSideEncryptionConfiguration } = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      }
      
      // Verify RDS encryption
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "secure-tap-db"
      }));
      expect(DBInstances![0].StorageEncrypted).toBe(true);
    }, 20000);

    test("Database is not publicly accessible", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "secure-tap-db"
      }));
      
      expect(DBInstances![0].PubliclyAccessible).toBe(false);
      
      // Verify it's in database subnets (which should be private)
      const dbSubnets = DBInstances![0].DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
      const databaseSubnetIds = stackOutputs["database_subnet_ids"];
      
      dbSubnets.forEach(subnetId => {
        expect(databaseSubnetIds).toContain(subnetId);
      });
    }, 20000);

    test("CloudTrail logging is enabled for audit trail", async () => {
      const trailArn = stackOutputs["cloudtrail_arn"];
      const trailName = trailArn.split('/').pop();
      
      const { IsLogging } = await cloudtrailClient.send(
        new GetTrailStatusCommand({ Name: trailName! })
      );
      
      expect(IsLogging).toBe(true);
    }, 20000);
  });

  describe("Compliance and Governance", () => {
    test("All resources have proper production tagging", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      
      // Check subnet tags
      const allSubnetIds = [
        ...stackOutputs["public_subnet_ids"],
        ...stackOutputs["private_subnet_ids"],
        ...stackOutputs["database_subnet_ids"]
      ];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      }));
      
      Subnets?.forEach(subnet => {
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      });
    }, 20000);

    test("Critical resources have deletion protection", async () => {
      // Verify RDS deletion protection
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "secure-tap-db"
      }));
      expect(DBInstances![0].DeletionProtection).toBe(true);
      
      // Note: S3 buckets and other resources might have additional protection mechanisms
      // that could be tested here
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All outputs are present with correct formats", () => {
      // VPC outputs
      expect(stackOutputs["vpc_id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      
      // Subnet outputs
      expect(Array.isArray(stackOutputs["public_subnet_ids"])).toBe(true);
      expect(stackOutputs["public_subnet_ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["private_subnet_ids"])).toBe(true);
      expect(stackOutputs["private_subnet_ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["database_subnet_ids"])).toBe(true);
      expect(stackOutputs["database_subnet_ids"]).toHaveLength(2);
      
      // RDS output
      expect(stackOutputs["rds_endpoint"]).toMatch(/\.amazonaws\.com:3306$/);
      
      // S3 bucket names
      expect(stackOutputs["logging_bucket_name"]).toBe("secure-tap-logging-bucket");
      expect(stackOutputs["cloudtrail_bucket_name"]).toBe("secure-tap-cloudtrail-bucket");
      expect(stackOutputs["app_bucket_name"]).toBe("secure-tap-app-bucket");
      
      // CloudTrail ARN
      expect(stackOutputs["cloudtrail_arn"]).toMatch(/^arn:aws:cloudtrail:/);
      
      // Lambda ARN
      expect(stackOutputs["lambda_arn"]).toMatch(/^arn:aws:lambda:/);
      
      // KMS Key ID
      expect(stackOutputs["kms_key_id"]).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test("Subnet IDs are valid and in correct VPC", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const allSubnetIds = [
        ...stackOutputs["public_subnet_ids"],
        ...stackOutputs["private_subnet_ids"],
        ...stackOutputs["database_subnet_ids"]
      ];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      }));
      
      expect(Subnets).toHaveLength(6);
      
      Subnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
      });
    }, 20000);
  });
});
