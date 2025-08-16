import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { execSync } from "child_process";

const ec2 = new EC2Client({ region: process.env.AWS_REGION || "us-east-1" });
const iam = new IAMClient({ region: process.env.AWS_REGION || "us-east-1" });

/**
 * Run terraform output -json once and parse
 */
function getTerraformOutputs() {
  const raw = execSync("terraform output -json", { encoding: "utf-8" });
  return JSON.parse(raw);
}

/**
 * Safely extract ID(s) for given environment
 */
function resolveOutput(outputs: any, key: string, env: string): string | string[] | undefined {
  if (!outputs[key]) return undefined;

  // Terraform json output wraps values like { value: { env: "id" } }
  const val = outputs[key].value;

  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val;
  if (val && typeof val === "object") return val[env]; // environment-specific map
  return undefined;
}

describe("Terraform Integration Tests (Live AWS Read-Only)", () => {
  const outputs = getTerraformOutputs();
  const environments = ["sensitive", "type", "value"];

  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      test("VPC exists", async () => {
        const vpcId = resolveOutput(outputs, "vpc_ids", env);
        expect(vpcId).toBeDefined();
        if (!vpcId) return;

        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs?.[0]?.VpcId).toBe(vpcId);
      });

      test("Public subnets exist", async () => {
        const publicSubnetIds = resolveOutput(outputs, "public_subnet_ids", env) || [];
        expect(publicSubnetIds.length).toBeGreaterThan(0);
        if (publicSubnetIds.length === 0) return;

        const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
        const returnedIds = resp.Subnets?.map((s) => s.SubnetId) || [];
        publicSubnetIds.forEach((id: string) => expect(returnedIds).toContain(id));
      });

      test("Private subnets exist", async () => {
        const privateSubnetIds = resolveOutput(outputs, "private_subnet_ids", env) || [];
        expect(privateSubnetIds.length).toBeGreaterThan(0);
        if (privateSubnetIds.length === 0) return;

        const resp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        const returnedIds = resp.Subnets?.map((s) => s.SubnetId) || [];
        privateSubnetIds.forEach((id: string) => expect(returnedIds).toContain(id));
      });

      test("Internet Gateway exists", async () => {
        const igwId = resolveOutput(outputs, "internet_gateway_ids", env);
        expect(igwId).toBeDefined();
        if (!igwId) return;

        const resp = await ec2.send(
          new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
        );
        expect(resp.InternetGateways?.[0]?.InternetGatewayId).toBe(igwId);
      });

      test("IAM Role exists", async () => {
        const iamRoleArn = resolveOutput(outputs, "iam_role_arns", env);
        expect(iamRoleArn).toBeDefined();
        if (!iamRoleArn) return;

        // handle arrays or strings
        const arn = Array.isArray(iamRoleArn) ? iamRoleArn[0] : iamRoleArn;
        const roleName = arn.split("/").pop();
        expect(roleName).toBeDefined();

        const resp = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
        expect(resp.Role?.Arn).toBe(arn);
      });
    });
  });
});
