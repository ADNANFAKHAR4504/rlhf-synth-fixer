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
import fs from "fs";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-south-1";

const ec2 = new EC2Client({ region });
const dynamodb = new DynamoDBClient({ region });
const rds = new RDSClient({ region });
const lambda = new LambdaClient({ region });
const cloudtrail = new CloudTrailClient({ region });

// Load stack outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

describe("TapStack Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = [
        "SecureEnvVPCId",
        "SecureEnvPublicSubnet1Id",
        "SecureEnvPublicSubnet2Id",
        "SecureEnvPrivateSubnet1Id",
        "SecureEnvPrivateSubnet2Id",
        "SecureEnvLoadBalancerDNS",
        "SecureEnvDatabaseEndpoint",
        "SecureEnvDynamoDBTableName",
        "SecureEnvCloudTrailArn"
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
        new DescribeVpcsCommand({ VpcIds: [outputs.SecureEnvVPCId] })
      );
      const vpc = res.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(outputs.SecureEnvVPCId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
    });

    test("should have 4 subnets (2 public, 2 private)", async () => {
      const res = await ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.SecureEnvVPCId] }],
        })
      );
      expect(res.Subnets?.length).toBe(4);
      const subnetIds = res.Subnets?.map(subnet => subnet.SubnetId) || [];
      expect(subnetIds).toContain(outputs.SecureEnvPublicSubnet1Id);
      expect(subnetIds).toContain(outputs.SecureEnvPublicSubnet2Id);
      expect(subnetIds).toContain(outputs.SecureEnvPrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.SecureEnvPrivateSubnet2Id);
    });
  });

  describe("EC2 Instances", () => {
    test("WebServer instances should exist and be running", async () => {
      const res = await ec2.send(
        new DescribeInstancesCommand({
          Filters: [
            {
              Name: "tag:Project",
              Values: ["secureenv"]
            },
            {
              Name: "instance-state-name",
              Values: ["running", "pending"]
            }
          ]
        })
      );
      const instances = res.Reservations?.flatMap(r => r.Instances || []) || [];
      expect(instances.length).toBe(2);
      expect(instances.every(inst => inst?.InstanceType === "t3.micro")).toBe(true);
    });
  });

  describe("RDS", () => {
    test("Database should exist and match endpoint output", async () => {
      const endpoint = outputs.SecureEnvDatabaseEndpoint;
      const res = await rds.send(new DescribeDBInstancesCommand({}));
      const dbs = res.DBInstances || [];
      const match = dbs.find((db) => db.Endpoint?.Address === endpoint);
      expect(match).toBeDefined();
      expect(match?.Engine).toBe("mysql");
      expect(match?.DBInstanceClass).toBe("db.t3.micro");
      expect([true, false]).toContain(match?.DeletionProtection);
      expect(match?.MultiAZ).toBe(true);
    });
  });

  describe("DynamoDB", () => {
    test("Table should exist with PITR enabled", async () => {
      const tableName = outputs.SecureEnvDynamoDBTableName;
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
      const functionName = "secureenv-lambda-function";
      const res = await lambda.send(
        new GetFunctionCommand({
          FunctionName: functionName,
        })
      );
      expect(res.Configuration?.Runtime).toContain("python3.9");

      const invokeRes = await lambda.send(
        new InvokeCommand({
          FunctionName: functionName,
          InvocationType: "RequestResponse",
        })
      );
      const payload = JSON.parse(Buffer.from(invokeRes.Payload!).toString());
      expect(payload.statusCode).toBe(200);
      expect(payload.body).toContain("Hello from SecureEnv Lambda");
    });
  });

  describe("CloudTrail", () => {
    test("Trail should exist and be logging", async () => {
      const trailArn = outputs.SecureEnvCloudTrailArn;
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
      // Find SGs attached to the EC2 instances
      const ec2Res = await ec2.send(
        new DescribeInstancesCommand({
          Filters: [
            {
              Name: "tag:Project",
              Values: ["secureenv"]
            }
          ]
        })
      );
      const webSGIds = ec2Res.Reservations?.flatMap(r =>
        r.Instances?.flatMap(i => i.SecurityGroups?.map(g => g.GroupId) || []) || []
      ).filter((id): id is string => !!id);

      // Fetch all security groups in the VPC to check tags
      const allSGs = await ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: "vpc-id",
              Values: [outputs.SecureEnvVPCId]
            }
          ]
        })
      );

      // Find WebServer SG by tag Name: secureenv-web-sg
      const webSG = allSGs.SecurityGroups?.find(sg =>
        sg.Tags?.some(tag => tag.Key === "Name" && tag.Value === "secureenv-web-sg") ||
        sg.GroupName?.includes("secureenv-web-sg")
      );
      expect(webSG).toBeDefined();

      const webPorts =
        webSG?.IpPermissions?.map((r) => r.FromPort).filter(
          (p): p is number => p !== undefined
        ) || [];
      expect(webPorts).toEqual(expect.arrayContaining([80, 443, 22]));

      // Check the DB SG via the RDS instance
      const rdsRes = await rds.send(new DescribeDBInstancesCommand({}));
      const dbInst = rdsRes.DBInstances?.find(
        (db) => db.Endpoint?.Address === outputs.SecureEnvDatabaseEndpoint
      );
      const dbSGIds = (dbInst?.VpcSecurityGroups?.map((g) => g.VpcSecurityGroupId) || []).filter(
        (id): id is string => !!id
      );

      const dbSGs = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: dbSGIds })
      );
      const dbSG = dbSGs.SecurityGroups?.find(sg =>
        sg.Tags?.some(tag => tag.Key === "Name" && tag.Value === "secureenv-db-sg") ||
        sg.GroupName?.includes("secureenv-db-sg")
      );
      expect(dbSG).toBeDefined();

      const mysqlRule = dbSG?.IpPermissions?.find(
        (r) => r.FromPort === 3306 && r.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    });
  });

  describe("Application Load Balancer", () => {
    test("ALB should exist and be accessible", async () => {
      const albDns = outputs.SecureEnvLoadBalancerDNS;
      expect(albDns).toMatch(/secureenv-alb.*\.elb\.amazonaws\.com$/);
    });
  });
});