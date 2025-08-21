// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";
import { S3Client, GetBucketAclCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string | undefined;
  let publicSubnetId: string | undefined;
  let privateSubnetId: string | undefined;
  let dataBucketName: string | undefined;
  let logsBucketName: string | undefined;
  let ec2RoleArn: string | undefined;
  let lambdaRoleArn: string | undefined;
  let appLogGroupName: string | undefined;
  let systemLogGroupName: string | undefined;

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

    const stackOutputs = outputs[stackKey];
    vpcId = stackOutputs["vpc-id"];
    publicSubnetId = stackOutputs["public-subnet-ids"][0];
    privateSubnetId = stackOutputs["private-subnet-ids"][0];
    dataBucketName = stackOutputs["data-bucket-name"];
    logsBucketName = stackOutputs["logs-bucket-name"];
    ec2RoleArn = stackOutputs["ec2-role-arn"];
    lambdaRoleArn = stackOutputs["lambda-role-arn"];
    appLogGroupName = stackOutputs["app-log-group-name"];
    systemLogGroupName = stackOutputs["system-log-group-name"];

    if (!vpcId || !publicSubnetId || !privateSubnetId || !dataBucketName || !logsBucketName || !ec2RoleArn || !lambdaRoleArn || !appLogGroupName || !systemLogGroupName) {
      throw new Error("Missing one or more required stack outputs.");
    }
  });

  test(`VPC exists`, async () => {
    const { Vpcs } = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId!] })
    );
    expect(Vpcs?.length).toBe(1);
    expect(Vpcs?.[0].VpcId).toBe(vpcId);
    expect(Vpcs?.[0].State).toBe("available");
  }, 20000);

  test(`Public Subnet exists in VPC`, async () => {
    const { Subnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId!] })
    );
    expect(Subnets?.[0].SubnetId).toBe(publicSubnetId);
    expect(Subnets?.[0].VpcId).toBe(vpcId);
  }, 20000);

  test(`Private Subnet exists in VPC`, async () => {
    const { Subnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: [privateSubnetId!] })
    );
    expect(Subnets?.[0].SubnetId).toBe(privateSubnetId);
    expect(Subnets?.[0].VpcId).toBe(vpcId);
  }, 20000);

  test(`Route tables exist for VPC`, async () => {
    const { RouteTables } = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId!] }],
      })
    );
    expect(RouteTables?.length).toBeGreaterThanOrEqual(2);
  }, 20000);

  test(`NAT Gateway exists in VPC`, async () => {
    const { NatGateways } = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId!] }],
      })
    );
    expect(NatGateways?.length).toBeGreaterThanOrEqual(1);
  }, 20000);

  test(`Data S3 bucket exists`, async () => {
    await s3Client.send(new HeadBucketCommand({ Bucket: dataBucketName }));
    const { Grants } = await s3Client.send(new GetBucketAclCommand({ Bucket: dataBucketName }));
    const hasPublicRead = Grants?.some(grant =>
      grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" && grant.Permission === "READ"
    );
    expect(hasPublicRead).toBe(false); // Verify public access is blocked
  }, 20000);

  test(`Logs S3 bucket exists`, async () => {
    await s3Client.send(new HeadBucketCommand({ Bucket: logsBucketName }));
    const { Grants } = await s3Client.send(new GetBucketAclCommand({ Bucket: logsBucketName }));
    const hasPublicRead = Grants?.some(grant =>
      grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" && grant.Permission === "READ"
    );
    expect(hasPublicRead).toBe(false); // Verify public access is blocked
  }, 20000);

  test(`IAM EC2 role exists and is assumable`, async () => {
    const roleName = ec2RoleArn?.split('/')[1];
    const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(Role?.RoleName).toBe(roleName);
    // Check for a trust policy that allows EC2 to assume the role
    const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
    expect(assumeRolePolicy.Statement.some((statement: any) =>
      statement.Effect === "Allow" && statement.Principal.Service === "ec2.amazonaws.com"
    )).toBe(true);
  }, 20000);

  test(`IAM Lambda role exists and is assumable`, async () => {
    const roleName = lambdaRoleArn?.split('/')[1];
    const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(Role?.RoleName).toBe(roleName);
    // Check for a trust policy that allows Lambda to assume the role
    const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
    expect(assumeRolePolicy.Statement.some((statement: any) =>
      statement.Effect === "Allow" && statement.Principal.Service === "lambda.amazonaws.com"
    )).toBe(true);
  }, 20000);

  test(`Application CloudWatch log group exists`, async () => {
    const { logGroups } = await logsClient.send(
      new DescribeLogGroupsCommand({ logGroupNamePrefix: appLogGroupName })
    );
    expect(logGroups?.length).toBeGreaterThanOrEqual(1);
    expect(logGroups?.[0].logGroupName).toBe(appLogGroupName);
  }, 20000);

  test(`System CloudWatch log group exists`, async () => {
    const { logGroups } = await logsClient.send(
      new DescribeLogGroupsCommand({ logGroupNamePrefix: systemLogGroupName })
    );
    expect(logGroups?.length).toBeGreaterThanOrEqual(1);
    expect(logGroups?.[0].logGroupName).toBe(systemLogGroupName);
  }, 20000);
});
