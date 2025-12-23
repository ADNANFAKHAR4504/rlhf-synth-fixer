import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import {
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || "dev";

// LocalStack configuration
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes("localhost") ||
  process.env.AWS_ENDPOINT_URL?.includes("4566");
const endpoint = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";

// Use different stack names for LocalStack vs AWS
// LocalStack CI uses "localstack-stack-pr${PR_NUMBER}" (see scripts/localstack-ci-deploy.sh)
// LocalStack local uses "tap-stack-localstack" (see scripts/localstack-cloudformation-deploy.sh)
// AWS uses "TapStack${ENVIRONMENT_SUFFIX}"
const STACK_NAME = isLocalStack
  ? `localstack-stack-${ENVIRONMENT_SUFFIX}`
  : `TapStack${ENVIRONMENT_SUFFIX}`;

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

  test("Route tables exist and public route table has IGW route", async () => {
    const vpcId = outputs["VPCId"];
    const resp = await ec2Client.send(
      new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }],
      })
    );

    const routeTables = resp.RouteTables || [];
    expect(routeTables.length).toBeGreaterThanOrEqual(2);

    let hasDefaultRoute = false;

    for (const rt of routeTables) {
      for (const route of rt.Routes || []) {
        if (route.DestinationCidrBlock === "0.0.0.0/0") {
          hasDefaultRoute = true;
          break;
        }
      }
      if (hasDefaultRoute) break;
    }

    expect(hasDefaultRoute).toBe(true);
  });

  test("Security group exists and is attached to VPC", async () => {
    const securityGroupId = outputs["SecurityGroupId"];
    const vpcId = outputs["VPCId"];
    const resp = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      })
    );

    const securityGroup = resp.SecurityGroups?.[0];
    expect(securityGroup).toBeDefined();
    expect(securityGroup?.VpcId).toBe(vpcId);
    expect(securityGroup?.GroupName).toContain("SecurityGroup");
  });
});
