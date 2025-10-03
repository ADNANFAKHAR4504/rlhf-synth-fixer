import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { CloudWatchClient, ListDashboardsCommand } from "@aws-sdk/client-cloudwatch";
import fs from "fs";
import path from "path";

// Load Pulumi stack outputs
const outputsPath = path.join(__dirname, "../flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf-8"));

const region = process.env.AWS_REGION || "us-east-1";
const environmentSuffix = process.env.ENV || "dev";

// AWS clients
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const secrets = new SecretsManagerClient({ region });
const cloudwatch = new CloudWatchClient({ region });

describe("TapStack Infrastructure Integration Tests", () => {
  test("EC2 instance should exist and be running", async () => {
    const instanceId: string | undefined = outputs.MyEC2InstanceId;
    expect(instanceId).toBeDefined();

    const result = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [instanceId!] })
    );
    const instance = result.Reservations?.[0].Instances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe("running");
  });

  test("Application Load Balancer should exist and be active", async () => {
    const albArn: string | undefined = outputs.MyALBArn;
    expect(albArn).toBeDefined();

    const result = await elbv2.send(
      new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn!] })
    );
    const lb = result.LoadBalancers?.[0];
    expect(lb).toBeDefined();
    expect(lb?.State?.Code).toBe("active");
  });

  test("ALB Target Group should exist and be HTTP", async () => {
    const targetGroupArn: string | undefined = outputs.MyTargetGroupArn;
    expect(targetGroupArn).toBeDefined();

    const result = await elbv2.send(
      new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn!] })
    );
    const tg = result.TargetGroups?.[0];
    expect(tg).toBeDefined();
    expect(tg?.Protocol).toBe("HTTP");
  });

  test("RDS Instance should exist and be available", async () => {
    const rdsInstanceId: string | undefined = outputs.MyRDSInstanceId;
    expect(rdsInstanceId).toBeDefined();

    const result = await rds.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId! })
    );
    const db = result.DBInstances?.[0];
    expect(db).toBeDefined();
    expect(db?.DBInstanceStatus).toBe("available");
  });

  test("Logs S3 bucket should exist", async () => {
    const bucketName: string | undefined = outputs.MyLogsBucketName;
    expect(bucketName).toBeDefined();

    const result = await s3.send(new HeadBucketCommand({ Bucket: bucketName! }));
    expect(result).toBeDefined();
  });

  test("DB Secret should exist in Secrets Manager", async () => {
    const secretName = `${environmentSuffix}-db-secret`; // align with your Pulumi code
    const result = await secrets.send(
      new DescribeSecretCommand({ SecretId: secretName })
    );
    expect(result).toBeDefined();
    expect(result.Name).toBe(secretName);
  });

  test("CloudWatch Dashboard should exist", async () => {
    const dashboardName: string | undefined = outputs.MyDashboardName;
    expect(dashboardName).toBeDefined();

    const result = await cloudwatch.send(new ListDashboardsCommand({}));
    const found = result.DashboardEntries?.find(
      (d) => d.DashboardName === dashboardName
    );
    expect(found).toBeDefined();
  });
});
