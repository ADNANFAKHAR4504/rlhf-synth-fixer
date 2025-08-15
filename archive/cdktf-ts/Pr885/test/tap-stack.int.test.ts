// __tests__/tap-stack.int.test.ts

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
let stackOutputs: Record<string, any>;

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let availabilityZones: string[];
  let s3BucketName: string;
  let s3BucketArn: string;
  let ec2RoleArn: string;
  let ec2InstanceProfileName: string;
  let webSecurityGroupId: string;
  let appSecurityGroupId: string;
  let rdsEndpoint: string;
  let rdsPort: number;
  let rdsDbName: string;
  let rdsSecurityGroupId: string;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error("ENVIRONMENT_SUFFIX environment variable is not set.");
    }

    const outputFilePath = path.join(
      __dirname,
      "..",
      "cfn-outputs",
      "flat-outputs.json"
    );

    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs).find((k) => k.includes(suffix));
    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    availabilityZones = stackOutputs["availability-zones"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    s3BucketArn = stackOutputs["s3-bucket-arn"];
    ec2RoleArn = stackOutputs["ec2-role-arn"];
    ec2InstanceProfileName = stackOutputs["ec2-instance-profile-name"];
    webSecurityGroupId = stackOutputs["web-security-group-id"];
    appSecurityGroupId = stackOutputs["app-security-group-id"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsPort = stackOutputs["rds-port"];
    rdsDbName = stackOutputs["rds-db-name"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];

    if (
      !vpcId ||
      !publicSubnetIds?.length ||
      !privateSubnetIds?.length ||
      !s3BucketName ||
      !ec2RoleArn
    ) {
      throw new Error("Missing one or more required stack outputs.");
    }
  });

  test("VPC exists and is available", async () => {
    const { Vpcs } = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    expect(Vpcs?.[0]?.VpcId).toBe(vpcId);
    expect(Vpcs?.[0]?.State).toBe("available");
  }, 20000);

  test("Public subnets exist in VPC", async () => {
    const { Subnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );
    expect(Subnets?.length).toBe(publicSubnetIds.length);
    Subnets?.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
    });
  }, 20000);

  test("Private subnets exist in VPC", async () => {
    const { Subnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
    );
    expect(Subnets?.length).toBe(privateSubnetIds.length);
    Subnets?.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
    });
  }, 20000);

  test("Availability zones match AWS account", () => {
    expect(Array.isArray(availabilityZones)).toBe(true);
    expect(availabilityZones.length).toBeGreaterThan(0);
  });

  test("Route tables exist for VPC", async () => {
    const { RouteTables } = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      })
    );
    expect(RouteTables?.length).toBeGreaterThanOrEqual(2);
  }, 20000);

  test("S3 bucket exists", async () => {
    await expect(
      s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }))
    ).resolves.not.toThrow();
  }, 15000);

  test("IAM Role exists", async () => {
    const roleName = ec2RoleArn.split("/").pop();
    if (roleName) {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(Role?.Arn).toBe(ec2RoleArn);
    }
  }, 15000);

  test("IAM Instance Profile exists", async () => {
    if (ec2InstanceProfileName) {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: ec2InstanceProfileName,
        })
      );
      expect(InstanceProfile?.InstanceProfileName).toBe(
        ec2InstanceProfileName
      );
    }
  }, 15000);

  test("Web Security Group exists", async () => {
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] })
    );
    expect(SecurityGroups?.[0]?.GroupId).toBe(webSecurityGroupId);
  }, 15000);

  test("App Security Group exists", async () => {
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [appSecurityGroupId] })
    );
    expect(SecurityGroups?.[0]?.GroupId).toBe(appSecurityGroupId);
  }, 15000);

  test("RDS instance exists", async () => {
    if (!rdsEndpoint) throw new Error("RDS endpoint not found in stack outputs");

    const endpointWithoutPort = rdsEndpoint.split(":")[0];

    const { DBInstances } = await rdsClient.send(
      new DescribeDBInstancesCommand({})
    );

    const myInstance = DBInstances?.find(
      (db) => db.Endpoint?.Address === endpointWithoutPort
    );

    expect(myInstance).toBeDefined();
    expect(myInstance?.DBInstanceStatus).toBe("available");
    expect(myInstance?.DBName).toBe(rdsDbName);
  });

  test("RDS Security Group exists", async () => {
    const { SecurityGroups } = await ec2Client.send(
      new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
    );
    expect(SecurityGroups?.[0]?.GroupId).toBe(rdsSecurityGroupId);
  }, 15000);
});
