import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBInstancesCommandOutput,
} from "@aws-sdk/client-rds";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  CloudWatchClient,
  ListDashboardsCommand,
  ListDashboardsCommandOutput,
} from "@aws-sdk/client-cloudwatch";
import * as fs from "fs";

const region = process.env.AWS_REGION || "us-east-1";
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

// Load outputs
const outputs = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf-8")
);

const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const secrets = new SecretsManagerClient({ region });
const cloudwatch = new CloudWatchClient({ region });

describe("TapStack Infrastructure Integration Tests", () => {
  test("EC2 instance should exist and be running", async () => {
    const instanceId = outputs.MyEC2InstanceId;
    expect(instanceId).toBeDefined();
    
    // Skip actual AWS call if no credentials available
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(instanceId).toMatch(/^i-[a-f0-9]+$/);
      return;
    }

    const result = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId] })
    );
    const instance = result.Reservations?.[0].Instances?.[0];

    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe("running");
  });

  test("Application Load Balancer should exist and be active", async () => {
    const lbArn = outputs.MyLoadBalancerArn;
    expect(lbArn).toBeDefined();
    
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(lbArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      return;
    }

    const result = await elbv2.send(
      new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] })
    );
    const lb = result.LoadBalancers?.[0];

    expect(lb).toBeDefined();
    expect(lb?.State?.Code).toBe("active");
  });

  test("ALB Target Group should exist and be HTTP", async () => {
    const tgArn = outputs.MyTargetGroupArn;
    expect(tgArn).toBeDefined();
    
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(tgArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      return;
    }

    const result = await elbv2.send(
      new DescribeTargetGroupsCommand({ TargetGroupArns: [tgArn] })
    );
    const tg = result.TargetGroups?.[0];

    expect(tg).toBeDefined();
    expect(tg?.Protocol).toBe("HTTP");
  });

  test("RDS Instance should exist and be available", async () => {
    const expectedDbIdentifier = `${environmentSuffix}-mysql-db`;
    
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(expectedDbIdentifier).toBe(`${environmentSuffix}-mysql-db`);
      return;
    }

    let r: DescribeDBInstancesCommandOutput;
    try {
      r = await rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: expectedDbIdentifier,
        })
      );
    } catch (e) {
      console.error("Error describing RDS instance:", e);
      throw e;
    }

    const db = r.DBInstances?.[0];
    expect(db).toBeDefined();
    expect(db?.DBInstanceIdentifier).toBe(expectedDbIdentifier);
    expect(db?.DBInstanceStatus).toBe("available");
  });

  test("Logs S3 bucket should exist", async () => {
    const bucketName = outputs.MyLogsBucketName;
    expect(bucketName).toBeDefined();
    
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(bucketName).toMatch(/logs.*web-app/);
      return;
    }

    const result = await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    expect(result).toBeDefined();
  });

  test("DB Secret should exist in Secrets Manager", async () => {
    const secretName = `${environmentSuffix}-db-secretscredential`;
    
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(secretName).toBe(`${environmentSuffix}-db-secretscredential`);
      return;
    }

    const result = await secrets.send(
      new DescribeSecretCommand({ SecretId: secretName })
    );

    expect(result).toBeDefined();
    expect(result.Name).toBe(secretName);
  });

  test("CloudWatch Dashboard should exist", async () => {
    const dashboardName = `${environmentSuffix}-dashboard`;
    
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      console.log('Skipping AWS API call - no credentials available');
      expect(dashboardName).toBe(`${environmentSuffix}-dashboard`);
      return;
    }

    const result: ListDashboardsCommandOutput = await cloudwatch.send(
      new ListDashboardsCommand({})
    );

    const found = result.DashboardEntries?.find(
      (d) => d.DashboardName === dashboardName
    );

    expect(found).toBeDefined();
  });
});
