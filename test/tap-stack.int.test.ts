// test/live-integration.test.ts
import { readFileSync } from "fs";
import path from "path";
import {
  EC2Client,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { CloudWatchClient, GetDashboardCommand } from "@aws-sdk/client-cloudwatch";

const outputsPath = path.join(__dirname, "cfn-outputs/fla-outputs.json");
const outputs = JSON.parse(readFileSync(outputsPath, "utf-8"));

// Create AWS SDK clients
const ec2Client = new EC2Client({});
const rdsClient = new RDSClient({});
const elbv2Client = new ElasticLoadBalancingV2Client({});
const s3Client = new S3Client({});
const secretsClient = new SecretsManagerClient({});
const cloudwatchClient = new CloudWatchClient({});

describe("Live AWS Resource Integration Tests", () => {
  jest.setTimeout(60000); // 1 min timeout for live calls

  test("EC2 Instance exists and is running", async () => {
    const { EC2InstanceId } = outputs;
    const command = new DescribeInstancesCommand({ InstanceIds: [EC2InstanceId] });
    const response = await ec2Client.send(command);

    expect(response.Reservations?.length).toBeGreaterThan(0);
    const instance = response.Reservations![0].Instances![0];
    expect(instance.InstanceId).toBe(EC2InstanceId);
    expect(instance.State?.Name).toBeDefined();
  });

  test("RDS Database exists", async () => {
    const { DBInstanceEndpoint } = outputs;
    const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: outputs.DBInstanceEndpoint.split(".")[0] });
    const response = await rdsClient.send(command);

    expect(response.DBInstances?.length).toBeGreaterThan(0);
    const db = response.DBInstances![0];
    expect(db.Endpoint?.Address).toBe(DBInstanceEndpoint);
  });

  test("ALB exists", async () => {
    const { ApplicationLoadBalancerArn } = outputs;
    const command = new DescribeLoadBalancersCommand({ LoadBalancerArns: [ApplicationLoadBalancerArn] });
    const response = await elbv2Client.send(command);

    expect(response.LoadBalancers?.length).toBe(1);
    expect(response.LoadBalancers![0].LoadBalancerArn).toBe(ApplicationLoadBalancerArn);
  });

  test("ALB Target Group exists", async () => {
    const { ALBTargetGroupArn } = outputs;
    const command = new DescribeTargetGroupsCommand({ TargetGroupArns: [ALBTargetGroupArn] });
    const response = await elbv2Client.send(command);

    expect(response.TargetGroups?.length).toBe(1);
    expect(response.TargetGroups![0].TargetGroupArn).toBe(ALBTargetGroupArn);
  });

  test("S3 Logs Bucket exists", async () => {
    const { LogsBucketName } = outputs;
    const command = new HeadBucketCommand({ Bucket: LogsBucketName });
    await expect(s3Client.send(command)).resolves.not.toThrow();
  });

  test("Secrets Manager secret exists", async () => {
    const { DBSecretArn } = outputs;
    const command = new DescribeSecretCommand({ SecretId: DBSecretArn });
    const response = await secretsClient.send(command);

    expect(response.ARN).toBe(DBSecretArn);
  });

  test("CloudWatch Dashboard exists", async () => {
    const { DashboardName } = outputs;
    const command = new GetDashboardCommand({ DashboardName });
    const response = await cloudwatchClient.send(command);

    expect(response.DashboardName).toBe(DashboardName);
    expect(response.DashboardBody).toBeDefined();
  });
});
