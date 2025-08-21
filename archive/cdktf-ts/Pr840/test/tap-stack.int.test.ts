// __tests__/tap-stack.int.test.ts
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";
import * as fs from "fs";
import * as path from "path";

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string | undefined;
  let publicSubnetId: string | undefined;
  let privateSubnetId: string | undefined;

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
    vpcId = stackOutputs["vpc_id"];
    publicSubnetId = stackOutputs["public_subnet_id"];
    privateSubnetId = stackOutputs["private_subnet_id"];

    if (!vpcId || !publicSubnetId || !privateSubnetId) {
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
});
