import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || "dev";
const STACK_NAME = `TapStack${ENVIRONMENT_SUFFIX}`;

// LocalStack configuration
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes("localhost") ||
  process.env.AWS_ENDPOINT_URL?.includes("4566");
const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";

let cfnClient: CloudFormationClient;
let ec2Client: EC2Client;
let outputs: Record<string, string>;

beforeAll(async () => {
  const clientConfig = isLocalStack
    ? {
        endpoint,
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
      }
    : {};

  cfnClient = new CloudFormationClient(clientConfig);
  ec2Client = new EC2Client(clientConfig);

  const stackResp = await cfnClient.send(
    new DescribeStacksCommand({ StackName: STACK_NAME })
  );
  const stack = stackResp.Stacks?.[0];
  outputs = {};
  if (stack?.Outputs) {
    for (const o of stack.Outputs) {
      if (o.OutputKey && o.OutputValue) {
        outputs[o.OutputKey] = o.OutputValue;
      }
    }
  }
});

describe("CloudFormation Stack Integration Tests", () => {
  test("stack is deployed", async () => {
    const resp = await cfnClient.send(
      new DescribeStacksCommand({ StackName: STACK_NAME })
    );
    const status = resp.Stacks?.[0].StackStatus;
    expect(["CREATE_COMPLETE", "UPDATE_COMPLETE"]).toContain(status);
  });

  test("VPC exists and is available", async () => {
    const vpcId = outputs["VPCId"];
    const resp = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId] })
    );
    expect(resp.Vpcs?.[0].State).toBe("available");
  });

  test("Public and Private subnets exist", async () => {
    for (const key of ["PublicSubnetId", "PrivateSubnetId"]) {
      const subnetId = outputs[key];
      const resp = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [subnetId] })
      );
      expect(resp.Subnets?.[0].State).toBe("available");
    }
  });

  test("Internet Gateway is attached to VPC", async () => {
    const vpcId = outputs["VPCId"];
    const resp = await ec2Client.send(
      new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }],
      })
    );
    expect(resp.InternetGateways?.length).toBe(1);
  });

  test("NAT Gateway exists in public subnet", async () => {
    const subnetId = outputs["PublicSubnetId"];
    const resp = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        Filter: [{ Name: "subnet-id", Values: [subnetId] }],
      })
    );
    const gateways = resp.NatGateways || [];
    expect(gateways.length).toBe(1);
    expect(["available", "pending"]).toContain(gateways[0].State);
  });

  test("Route tables have IGW and NAT routes", async () => {
    const vpcId = outputs["VPCId"];
    const resp = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      })
    );

    const routeTables = resp.RouteTables || [];

    let hasIgwRoute = false;
    let hasNatRoute = false;

    for (const rt of routeTables) {
      for (const route of rt.Routes || []) {
        if (
          route.DestinationCidrBlock === "0.0.0.0/0" &&
          route.GatewayId?.startsWith("igw-")
        ) {
          hasIgwRoute = true;
        }
        if (
          route.DestinationCidrBlock === "0.0.0.0/0" &&
          route.NatGatewayId
        ) {
          hasNatRoute = true;
        }
      }
    }

    expect(hasIgwRoute).toBe(true);
    expect(hasNatRoute).toBe(true);
  });

  test("Instances are running and public instance has a public IP", async () => {
    const pubId = outputs["PublicInstanceId"];
    const privId = outputs["PrivateInstanceId"];
    const resp = await ec2Client.send(
      new DescribeInstancesCommand({
        InstanceIds: [pubId, privId],
      })
    );

    const instances =
      resp.Reservations?.flatMap((r) => r.Instances || []) || [];

    const states = new Set(instances.map((i) => i.State?.Name));
    expect(states.has("running")).toBe(true);

    const publicInstance = instances.find((i) => i.InstanceId === pubId);
    expect(publicInstance?.PublicIpAddress).toBeDefined();
  });
});
