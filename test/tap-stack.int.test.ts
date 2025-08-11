// __tests__/tap-stack.int.test.ts

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
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

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let ec2InstanceIds: string[];
  let s3BucketName: string;
  let natGatewayIps: string[];
  let iamRoleName: string;
  let iamInstanceProfileName: string;
  let rdsEndpoint: string;

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
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    ec2InstanceIds = stackOutputs["ec2-instance-ids"];
    s3BucketName = stackOutputs["s3-logs-bucket-name"];
    natGatewayIps = stackOutputs["nat-gateway-ips"];
    iamRoleName = stackOutputs["ec2-role-name"];
    iamInstanceProfileName = stackOutputs["ec2-instance-profile-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];

    if (
      !vpcId ||
      !publicSubnetIds?.length ||
      !privateSubnetIds?.length ||
      !ec2InstanceIds?.length ||
      !s3BucketName
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

  test("Route tables exist for VPC", async () => {
    const { RouteTables } = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      })
    );
    expect(RouteTables?.length).toBeGreaterThanOrEqual(2);
  }, 20000);

  test("NAT Gateways exist", async () => {
    const { NatGateways } = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }],
      })
    );
    expect(NatGateways?.length).toBeGreaterThanOrEqual(1);
    const natIps = NatGateways?.map((ngw) =>
      ngw.NatGatewayAddresses?.[0]?.PublicIp
    );
    natGatewayIps.forEach((ip) => expect(natIps).toContain(ip));
  }, 20000);

  test("EC2 instances exist and are running", async () => {
    const { Reservations } = await ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: ec2InstanceIds })
    );
    const instances = Reservations?.flatMap((r) => r.Instances || []);
    expect(instances?.length).toBe(ec2InstanceIds.length);
    instances?.forEach((instance) => {
      expect(instance.State?.Name).toBe("running");
    });
  }, 30000);

  test("S3 bucket exists", async () => {
    await expect(
      s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }))
    ).resolves.not.toThrow();
  }, 15000);

  test("IAM Role exists", async () => {
    if (iamRoleName) {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: iamRoleName })
      );
      expect(Role?.RoleName).toBe(iamRoleName);
    }
  }, 15000);

  test("IAM Instance Profile exists", async () => {
    if (iamInstanceProfileName) {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({
          InstanceProfileName: iamInstanceProfileName,
        })
      );
      expect(InstanceProfile?.InstanceProfileName).toBe(
        iamInstanceProfileName
      );
    }
  }, 15000);

  test("RDS instance exists", async () => {
    if (rdsEndpoint) {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );
      const match = DBInstances?.find(
        (db) => db.Endpoint?.Address === rdsEndpoint
      );
      expect(match).toBeDefined();
    }
  }, 30000);
});
