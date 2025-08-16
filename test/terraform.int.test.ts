import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const outputPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
const outputs: any = JSON.parse(fs.readFileSync(outputPath, "utf-8")); // mark as any to avoid type noise

const environments = ["dev", "staging", "production"];

describe("Terraform Infrastructure Integration Tests", () => {
  const ec2 = new EC2Client({ region: "us-west-2" });
  const iam = new IAMClient({ region: "us-west-2" });

  environments.forEach((env) => {
    describe(`Environment: ${env}`, () => {
      const vpcId: string = outputs.vpc_ids.value[env];
      const vpcCidr: string = outputs.vpc_cidrs.value[env];

      const publicSubnetIds: string[] = Object.entries(outputs.public_subnet_ids.value)
        .filter(([k]) => k.startsWith(env))
        .map(([_, v]) => v as string);

      const privateSubnetIds: string[] = Object.entries(outputs.private_subnet_ids.value)
        .filter(([k]) => k.startsWith(env))
        .map(([_, v]) => v as string);

      const igwId: string = outputs.internet_gateway_ids.value[env];
      const natId: string = outputs.nat_gateway_ids.value[env];
      const iamRoleArn: string = outputs.iam_role_arns.value[env];
      const sgId: string = outputs.security_group_ids.value[env];
      const instanceId: string = outputs.ec2_instance_ids.value[env];
      const instanceSummary = outputs.environment_summary.value[env];

      it("VPC exists and CIDR matches", async () => {
        const result = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(result.Vpcs?.[0].VpcId).toBe(vpcId);
        expect(result.Vpcs?.[0].CidrBlock).toBe(vpcCidr);
      });

      it("Public subnets exist", async () => {
        const result = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
        expect(result.Subnets?.length).toBe(publicSubnetIds.length);
      });

      it("Private subnets exist", async () => {
        const result = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
        expect(result.Subnets?.length).toBe(privateSubnetIds.length);
      });

      it("Internet Gateway exists", async () => {
        const result = await ec2.send(new DescribeInternetGatewaysCommand({ InternetGatewayIds: [igwId] }));
        expect(result.InternetGateways?.[0].InternetGatewayId).toBe(igwId);
      });

      it("NAT Gateway exists", async () => {
        const result = await ec2.send(new DescribeNatGatewaysCommand({ NatGatewayIds: [natId] }));
        expect(result.NatGateways?.[0].NatGatewayId).toBe(natId);
        expect(result.NatGateways?.[0].State).toBe("available");
      });

      it("IAM Role exists", async () => {
        const roleName = iamRoleArn.split("/").pop();
        const result = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
        expect(result.Role?.Arn).toBe(iamRoleArn);
      });

      it("Security Group exists", async () => {
        const result = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
        expect(result.SecurityGroups?.[0].GroupId).toBe(sgId);
      });

      it("EC2 Instance exists and matches summary", async () => {
        const result = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
        const reservations = result.Reservations ?? [];
        expect(reservations.length).toBeGreaterThan(0);

        const instance = reservations[0].Instances?.[0];
        expect(instance?.InstanceId).toBe(instanceSummary.instance_id);
        expect(instance?.InstanceType).toBe(instanceSummary.instance_type);
        expect(instance?.PrivateIpAddress).toBe(instanceSummary.private_ip);
        expect(instance?.PublicIpAddress).toBe(instanceSummary.public_ip);
        expect(instance?.VpcId).toBe(instanceSummary.vpc_id);
      });
    });
  });
});
