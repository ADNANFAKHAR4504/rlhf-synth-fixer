import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputPath, "utf-8"));

// normalize helper → always return string[]
function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const environments = ["dev", "prod"];

describe("Terraform Infrastructure Integration Tests", () => {
  const ec2 = new EC2Client({ region: "us-east-1" });
  const iam = new IAMClient({ region: "us-east-1" });

  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      // Normalize Terraform outputs
      const vpcIds: string[] = normalizeToArray(outputs.vpc_ids?.[env]);
      const publicSubnetIds: string[] = normalizeToArray(outputs.public_subnet_ids?.[env]);
      const privateSubnetIds: string[] = normalizeToArray(outputs.private_subnet_ids?.[env]);
      const igwIds: string[] = normalizeToArray(outputs.internet_gateway_ids?.[env]);
      const iamRoleArns: string[] = normalizeToArray(outputs.iam_role_arns?.[env]);

      it("VPC exists", async () => {
        expect(vpcIds.length).toBeGreaterThan(0);
        const result = await ec2.send(new DescribeVpcsCommand({ VpcIds: vpcIds }));
        expect(result.Vpcs?.length).toBeGreaterThan(0);
      });

      it("Public subnets exist", async () => {
        expect(publicSubnetIds.length).toBeGreaterThan(0);
        const result = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
        expect(result.Subnets?.length).toBe(publicSubnetIds.length);
      });

      it("Private subnets exist", async () => {
        expect(privateSubnetIds.length).toBeGreaterThan(0);
        const result = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(result.Subnets?.length).toBe(privateSubnetIds.length);
      });

      it("Internet Gateway exists", async () => {
        expect(igwIds.length).toBeGreaterThan(0);
        const result = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: igwIds }));
        expect(result.InternetGateways?.length).toBe(igwIds.length);
      });

      it("IAM Role exists", async () => {
        expect(iamRoleArns.length).toBeGreaterThan(0);
        const roleArn = iamRoleArns[0];
        const roleName = roleArn.split("/").pop(); // extract role name from ARN
        expect(roleName).toBeDefined();

        const result = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
        expect(result.Role?.Arn).toBe(roleArn);
      });
    });
  });
});
