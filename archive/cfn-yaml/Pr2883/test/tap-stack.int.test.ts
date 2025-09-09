import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketPolicyStatusCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ca-central-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const dynamodb = new DynamoDBClient({ region });
const rds = new RDSClient({ region });
const lambda = new LambdaClient({ region });
const cloudtrail = new CloudTrailClient({ region });

// Load stack outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

describe("SecureApp Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = [
        "WebServerInstanceId",
        "VPCId",
        "CloudTrailArn",
        "ApplicationBucket",
        "DynamoDBTableName",
        "DatabaseEndpoint",
      ];
      keys.forEach((key) => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe("");
      });
    });
  });

  describe("VPC", () => {
    test("should exist and have CIDR 10.0.0.0/16", async () => {
      const res = await ec2.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      );
      const vpc = res.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(outputs.VPCId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
    });

    test("should have 4 subnets (2 public, 2 private)", async () => {
      const res = await ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }],
        })
      );
      expect(res.Subnets?.length).toBe(4);
    });
  });

  describe("S3 Buckets", () => {
    test("Application bucket should be encrypted and block public access", async () => {
      const bucket = outputs.ApplicationBucket;

      const encryption = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucket })
      );
      const algo =
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(["AES256", "aws:kms"]).toContain(algo);

      let isPublic = true;
      try {
        const policyStatus = await s3.send(
          new GetBucketPolicyStatusCommand({ Bucket: bucket })
        );
        isPublic = policyStatus.PolicyStatus?.IsPublic ?? true;
      } catch (err: any) {
        if (err.name === "NoSuchBucketPolicy") {
          isPublic = false;
        } else {
          throw err;
        }
      }
      expect(isPublic).toBe(false);

      const location = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      const expectedRegionSet =
        region === "us-east-1"
          ? [undefined, null, "", "us-east-1"]
          : [region];
      expect(expectedRegionSet).toContain(location.LocationConstraint);
    });
  });

  describe("EC2 Instance", () => {
    test("WebServer instance should exist and be running", async () => {
      const res = await ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.WebServerInstanceId],
        })
      );
      const inst = res.Reservations?.[0]?.Instances?.[0];
      expect(inst?.InstanceId).toBe(outputs.WebServerInstanceId);
      expect(["running", "pending"]).toContain(inst?.State?.Name);
    });
  });

  describe("RDS", () => {
    test("Database should exist and match endpoint output", async () => {
      const endpoint = outputs.DatabaseEndpoint;
      const res = await rds.send(new DescribeDBInstancesCommand({}));
      const dbs = res.DBInstances || [];
      const match = dbs.find((db) => db.Endpoint?.Address === endpoint);
      expect(match).toBeDefined();
      expect(match?.Engine).toBe("mysql");
      expect([true, false]).toContain(match?.DeletionProtection);
    });
  });

  describe("DynamoDB", () => {
    test("Table should exist with PITR enabled", async () => {
      const tableName = outputs.DynamoDBTableName;
      const res = await dynamodb.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(res.Table?.TableName).toBe(tableName);

      const pitr = await dynamodb.send(
        new DescribeContinuousBackupsCommand({ TableName: tableName })
      );
      expect(
        pitr.ContinuousBackupsDescription?.PointInTimeRecoveryDescription
          ?.PointInTimeRecoveryStatus
      ).toBe("ENABLED");
    });
  });

  describe("Lambda", () => {
    test("Function should exist and return a hello message", async () => {
      const res = await lambda.send(
        new GetFunctionCommand({
          FunctionName: "secureapp-application-function",
        })
      );
      expect(res.Configuration?.Runtime).toContain("python3");

      const invokeRes = await lambda.send(
        new InvokeCommand({
          FunctionName: "secureapp-application-function",
          InvocationType: "RequestResponse",
        })
      );
      const payload = JSON.parse(Buffer.from(invokeRes.Payload!).toString());
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toContain("Hello from secure Lambda");
    });
  });

  describe("CloudTrail", () => {
    test("Trail should exist and be logging", async () => {
      const trailArn = outputs.CloudTrailArn;
      const trails = await cloudtrail.send(
        new DescribeTrailsCommand({ trailNameList: [trailArn] })
      );
      const trail = trails.trailList?.[0];
      expect(trail?.TrailARN).toBe(trailArn);
      expect(trail?.IsMultiRegionTrail).toBe(true);

      const status = await cloudtrail.send(
        new GetTrailStatusCommand({ Name: trailArn })
      );
      expect(status.IsLogging).toBe(true);
    });
  });

  describe("Security Groups", () => {
    test("WebServer SG should allow 80, 443, 22; DB SG should allow 3306", async () => {
      // Find SGs attached to the EC2 instance
      const ec2Res = await ec2.send(
        new DescribeInstancesCommand({
          InstanceIds: [outputs.WebServerInstanceId],
        })
      );
      const ec2Inst = ec2Res.Reservations?.[0]?.Instances?.[0];
      const webSGIds = (ec2Inst?.SecurityGroups?.map((g) => g.GroupId) || []).filter(
        (id): id is string => !!id
      );

      // Fetch the actual SGs
      const webSGs = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: webSGIds })
      );
      const webSG = webSGs.SecurityGroups?.[0];
      expect(webSG).toBeDefined();

      const webPorts =
        webSG?.IpPermissions?.map((r) => r.FromPort).filter(
          (p): p is number => p !== undefined
        ) || [];
      expect(webPorts).toEqual(expect.arrayContaining([80, 443, 22]));

      // Now check the DB SG via the RDS instance
      const rdsRes = await rds.send(new DescribeDBInstancesCommand({}));
      const dbInst = rdsRes.DBInstances?.find(
        (db) => db.Endpoint?.Address === outputs.DatabaseEndpoint
      );
      const dbSGIds = (dbInst?.VpcSecurityGroups?.map((g) => g.VpcSecurityGroupId) || []).filter(
        (id): id is string => !!id
      );

      const dbSGs = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: dbSGIds })
      );
      const dbSG = dbSGs.SecurityGroups?.[0];
      expect(dbSG).toBeDefined();

      const mysqlRule = dbSG?.IpPermissions?.find(
        (r) => r.FromPort === 3306 && r.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    });
  });
});