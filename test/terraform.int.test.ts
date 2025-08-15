import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";

const outputsPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Dynamically detect environments from the keys in vpc_ids
const environments = Object.keys(outputs.vpc_ids || {});

describe("Terraform Integration Tests (Live AWS Read-Only)", () => {
  const ec2 = new EC2Client({});
  const iam = new IAMClient({});

  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      const vpcId: string = outputs.vpc_ids?.[env];
      const publicSubnetIds: string[] = Object.entries(outputs.public_subnet_ids || {})
        .filter(([key]) => key.startsWith(env))
        .map(([, id]) => id as string);
      const privateSubnetIds: string[] = Object.entries(outputs.private_subnet_ids || {})
        .filter(([key]) => key.startsWith(env))
        .map(([, id]) => id as string);
      const igwId: string = outputs.internet_gateway_ids?.[env];
      const iamRoleArn: string = outputs.iam_role_arns?.[env];

      test("VPC exists", async () => {
        expect(vpcId).toBeDefined();
        const resp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(resp.Vpcs?.[0]?.VpcId).toBe(vpcId);
      });

      test("Public subnets exist", async () => {
        expect(publicSubnetIds.length).toBeGreaterThan(0);
        const resp = await ec2.send(
          new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
        );
        const returnedIds = resp.Subnets?.map((s) => s.SubnetId) || [];
        expect(returnedIds).toEqual(expect.arrayContaining(publicSubnetIds));
      });

      test("Private subnets exist", async () => {
        expect(privateSubnetIds.length).toBeGreaterThan(0);
        const resp = await ec2.send(
          new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
        );
        const returnedIds = resp.Subnets?.map((s) => s.SubnetId) || [];
        expect(returnedIds).toEqual(expect.arrayContaining(privateSubnetIds));
      });

      test("Internet Gateway exists", async () => {
        expect(igwId).toBeDefined();
        const resp = await ec2.send(
          new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] })
        );
        expect(resp.InternetGateways?.[0]?.InternetGatewayId).toBe(igwId);
      });

      test("IAM Role exists", async () => {
        expect(iamRoleArn).toBeDefined();
        // Extract role name from ARN: arn:aws:iam::123456789012:role/MyRoleName
        const roleName = iamRoleArn.split("/").pop();
        expect(roleName).toBeDefined();
        const resp = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
        expect(resp.Role?.Arn).toBe(iamRoleArn);
      });
    });
  });
});
