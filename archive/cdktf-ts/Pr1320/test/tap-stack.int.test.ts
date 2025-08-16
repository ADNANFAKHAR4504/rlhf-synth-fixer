// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeInstancesCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
} from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let outputs: Record<string, any>;
  let stackOutputs: Record<string, string>;

  beforeAll(() => {
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) throw new Error("ENVIRONMENT_SUFFIX env variable is not set");

    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) throw new Error(`flat-outputs.json not found at ${outputFilePath}`);

    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs).find((k) => k.includes(suffix));
    if (!stackKey) throw new Error(`No output found for environment: ${suffix}`);

    stackOutputs = outputs[stackKey];
  });

  // -------------------------------
  // VPC & Networking
  // -------------------------------
  test("VPC exists", async () => {
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [stackOutputs.vpc_id] }));
    expect(Vpcs?.length).toBe(1);
    expect(Vpcs?.[0].VpcId).toBe(stackOutputs.vpc_id);
    expect(Vpcs?.[0].State).toBe("available");
  }, 20000);

  test("Public Subnet exists", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [stackOutputs.public_subnet_id] }));
    expect(Subnets?.[0].SubnetId).toBe(stackOutputs.public_subnet_id);
    expect(Subnets?.[0].VpcId).toBe(stackOutputs.vpc_id);
  }, 20000);

  test("Private Subnet exists", async () => {
    const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [stackOutputs.private_subnet_id] }));
    expect(Subnets?.[0].SubnetId).toBe(stackOutputs.private_subnet_id);
    expect(Subnets?.[0].VpcId).toBe(stackOutputs.vpc_id);
  }, 20000);

  test("Route tables exist for VPC", async () => {
    const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
      Filters: [{ Name: "vpc-id", Values: [stackOutputs.vpc_id] }]
    }));
    expect(RouteTables?.length).toBeGreaterThanOrEqual(2);
  }, 20000);

  // -------------------------------
  // EC2 Instance
  // -------------------------------
  test("EC2 instance exists", async () => {
    const { Reservations } = await ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: [stackOutputs.ec2_instance_id] })
    );
    expect(Reservations?.length).toBeGreaterThan(0);
    expect(Reservations?.[0].Instances?.[0].InstanceId).toBe(stackOutputs.ec2_instance_id);
  });

  // -------------------------------
  // RDS Instance
  // -------------------------------
  test("RDS instance exists", async () => {
   const rdsInstanceIdentifier = "tap-infrastructure-dev-db";

  const { DBInstances } = await rdsClient.send(
    new DescribeDBInstancesCommand({
      DBInstanceIdentifier: rdsInstanceIdentifier,
    })
  );

  expect(DBInstances?.[0].DBInstanceIdentifier).toBe(rdsInstanceIdentifier);
  }, 30000);

  // -------------------------------
  // S3 Bucket
  // -------------------------------
  test("S3 bucket exists", async () => {
    const res = await s3Client.send(new HeadBucketCommand({ Bucket: stackOutputs.s3_bucket_name_output }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  // -------------------------------
  // IAM Role
  // -------------------------------
  test("EC2 IAM role exists", async () => {
    const { Role } = await iamClient.send(
      new GetRoleCommand({ RoleName: stackOutputs.ec2_role_arn.split("/")[1] })
    );
    expect(Role).toBeDefined();
    expect(Role!.RoleName).toBe(stackOutputs.ec2_role_arn.split("/")[1]);
  });

  // -------------------------------
  // CloudWatch Logs
  // -------------------------------
  test("CloudWatch Log Group exists", async () => {
    const { logGroups } = await cloudwatchClient.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: stackOutputs.cloudwatch_log_group_name }));
    const logGroup = logGroups?.find((g) => g.logGroupName === stackOutputs.cloudwatch_log_group_name);
    expect(logGroup).toBeDefined();
  });
});
