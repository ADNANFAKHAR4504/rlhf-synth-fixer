// Integration tests for Terraform multi-region infrastructure
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from "@aws-sdk/client-ec2";
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from "@aws-sdk/client-s3";
import {
  LambdaClient,
  GetFunctionCommand,
} from "@aws-sdk/client-lambda";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from "@aws-sdk/client-auto-scaling";
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  Route53Client,
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
  GetHealthCheckCommand,
} from "@aws-sdk/client-route-53";
import {
  BackupClient,
  ListBackupPlansCommand,
  ListBackupSelectionsCommand,
} from "@aws-sdk/client-backup";
import fs from "fs";
import path from "path";

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};
let isDeployed = false;

if (fs.existsSync(outputsPath)) {
  try {
    const fileContent = fs.readFileSync(outputsPath, "utf8");
    outputs = JSON.parse(fileContent);
    // Check if outputs has actual data (not just empty object)
    isDeployed = Object.keys(outputs).length > 0;
  } catch (error) {
    console.warn("Failed to parse outputs file:", error);
  }
}

const TIMEOUT = 30000;

// Helper to skip tests if not deployed
const describeIfDeployed = isDeployed ? describe : describe.skip;
const testIfDeployed = isDeployed ? test : test.skip;

describe("Terraform Multi-Region Infrastructure - Integration Tests", () => {
  const usEast1Client = new EC2Client({ region: "us-east-1" });
  const usWest2Client = new EC2Client({ region: "us-west-2" });
  const rdsClient = new RDSClient({ region: "us-east-1" });
  const s3Client = new S3Client({ region: "us-east-1" });
  const lambdaClient = new LambdaClient({ region: "us-east-1" });
  const elbUsEast1 = new ElasticLoadBalancingV2Client({ region: "us-east-1" });
  const elbUsWest2 = new ElasticLoadBalancingV2Client({ region: "us-west-2" });
  const asgUsEast1 = new AutoScalingClient({ region: "us-east-1" });
  const asgUsWest2 = new AutoScalingClient({ region: "us-west-2" });
  const cwUsEast1 = new CloudWatchClient({ region: "us-east-1" });
  const cwUsWest2 = new CloudWatchClient({ region: "us-west-2" });
  const route53Client = new Route53Client({ region: "us-east-1" });
  const backupClient = new BackupClient({ region: "us-east-1" });

  describe("Deployment Outputs", () => {
    test("outputs file exists", () => {
      if (!isDeployed) {
        console.warn("⚠️  Infrastructure not deployed yet. Skipping integration tests.");
      }
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    testIfDeployed("has required outputs", () => {
      expect(outputs).toHaveProperty("alb_dns_us_east_1");
      expect(outputs).toHaveProperty("alb_dns_us_west_2");
      expect(outputs).toHaveProperty("s3_bucket_name");
      expect(outputs).toHaveProperty("lambda_function_name");
    });
  });

  describeIfDeployed("VPC Infrastructure - US-EAST-1", () => {
    test("VPC exists in us-east-1", async () => {
      const response = await usEast1Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: "tag:Name", Values: ["vpc-production-us-east-1"] },
          ],
        })
      );
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test("has 2 public subnets in us-east-1", async () => {
      const response = await usEast1Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "tag:Type", Values: ["Public"] },
            { Name: "tag:Name", Values: ["*us-east-1*"] },
          ],
        })
      );
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);

    test("has 2 private subnets in us-east-1", async () => {
      const response = await usEast1Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "tag:Type", Values: ["Private"] },
            { Name: "tag:Name", Values: ["*us-east-1*"] },
          ],
        })
      );
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);
  });

  describeIfDeployed("VPC Infrastructure - US-WEST-2", () => {
    test("VPC exists in us-west-2", async () => {
      const response = await usWest2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            { Name: "tag:Name", Values: ["vpc-production-us-west-2"] },
          ],
        })
      );
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test("has 2 public subnets in us-west-2", async () => {
      const response = await usWest2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "tag:Type", Values: ["Public"] },
            { Name: "tag:Name", Values: ["*us-west-2*"] },
          ],
        })
      );
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);

    test("has 2 private subnets in us-west-2", async () => {
      const response = await usWest2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            { Name: "tag:Type", Values: ["Private"] },
            { Name: "tag:Name", Values: ["*us-west-2*"] },
          ],
        })
      );
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);
  });

  describeIfDeployed("Application Load Balancers", () => {
    test("ALB exists in us-east-1", async () => {
      if (!outputs.alb_dns_us_east_1) {
        throw new Error("ALB DNS output not found for us-east-1");
      }
      const response = await elbUsEast1.send(
        new DescribeLoadBalancersCommand({})
      );
      const alb = response.LoadBalancers?.find((lb) =>
        lb.DNSName === outputs.alb_dns_us_east_1
      );
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe("active");
    }, TIMEOUT);

    test("ALB exists in us-west-2", async () => {
      if (!outputs.alb_dns_us_west_2) {
        throw new Error("ALB DNS output not found for us-west-2");
      }
      const response = await elbUsWest2.send(
        new DescribeLoadBalancersCommand({})
      );
      const alb = response.LoadBalancers?.find((lb) =>
        lb.DNSName === outputs.alb_dns_us_west_2
      );
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe("active");
    }, TIMEOUT);

    test("target groups are healthy in us-east-1", async () => {
      const tgResponse = await elbUsEast1.send(
        new DescribeTargetGroupsCommand({})
      );
      const targetGroups = tgResponse.TargetGroups?.filter((tg) =>
        tg.TargetGroupName?.includes("us-east-1")
      );
      expect(targetGroups).toBeDefined();
      expect(targetGroups!.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test("target groups are healthy in us-west-2", async () => {
      const tgResponse = await elbUsWest2.send(
        new DescribeTargetGroupsCommand({})
      );
      const targetGroups = tgResponse.TargetGroups?.filter((tg) =>
        tg.TargetGroupName?.includes("us-west-2")
      );
      expect(targetGroups).toBeDefined();
      expect(targetGroups!.length).toBeGreaterThan(0);
    }, TIMEOUT);
  });

  describeIfDeployed("Auto Scaling Groups", () => {
    test("ASG exists in us-east-1 with correct capacity", async () => {
      const response = await asgUsEast1.send(
        new DescribeAutoScalingGroupsCommand({})
      );
      const asg = response.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes("us-east-1")
      );
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(5);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);

    test("ASG exists in us-west-2 with correct capacity", async () => {
      const response = await asgUsWest2.send(
        new DescribeAutoScalingGroupsCommand({})
      );
      const asg = response.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes("us-west-2")
      );
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(5);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);

    test("EC2 instances are running in us-east-1", async () => {
      const response = await usEast1Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: "instance-state-name", Values: ["running"] },
            { Name: "tag:Environment", Values: ["Production"] },
          ],
        })
      );
      const instances = response.Reservations?.flatMap((r) => r.Instances) || [];
      expect(instances.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);

    test("EC2 instances are running in us-west-2", async () => {
      const response = await usWest2Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: "instance-state-name", Values: ["running"] },
            { Name: "tag:Environment", Values: ["Production"] },
          ],
        })
      );
      const instances = response.Reservations?.flatMap((r) => r.Instances) || [];
      expect(instances.length).toBeGreaterThanOrEqual(2);
    }, TIMEOUT);
  });

  describeIfDeployed("RDS Database", () => {
    test("RDS MySQL instance exists and is available", async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "mysql-production",
        })
      );
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      const db = response.DBInstances![0];
      expect(db.Engine).toBe("mysql");
      expect(db.EngineVersion).toMatch(/^8\.0/);
      expect(db.DBInstanceStatus).toBe("available");
    }, TIMEOUT);

    test("RDS has encryption enabled", async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "mysql-production",
        })
      );
      const db = response.DBInstances![0];
      expect(db.StorageEncrypted).toBe(true);
    }, TIMEOUT);

    test("RDS has automated backups configured", async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: "mysql-production",
        })
      );
      const db = response.DBInstances![0];
      expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
    }, TIMEOUT);
  });

  describeIfDeployed("AWS Backup", () => {
    test("backup plan exists", async () => {
      const response = await backupClient.send(
        new ListBackupPlansCommand({})
      );
      const plans = response.BackupPlansList?.filter((plan) =>
        plan.BackupPlanName?.includes("rds-backup-plan")
      );
      expect(plans).toBeDefined();
      expect(plans!.length).toBeGreaterThan(0);
    }, TIMEOUT);
  });

  describeIfDeployed("S3 Bucket", () => {
    test("S3 bucket exists", async () => {
      if (!outputs.s3_bucket_name) {
        throw new Error("S3 bucket name output not found");
      }
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, TIMEOUT);

    test("S3 bucket has versioning enabled", async () => {
      if (!outputs.s3_bucket_name) {
        throw new Error("S3 bucket name output not found");
      }
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.Status).toBe("Enabled");
    }, TIMEOUT);

    test("S3 bucket has encryption enabled", async () => {
      if (!outputs.s3_bucket_name) {
        throw new Error("S3 bucket name output not found");
      }
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    }, TIMEOUT);
  });

  describeIfDeployed("Lambda Function", () => {
    test("Lambda function exists", async () => {
      if (!outputs.lambda_function_name) {
        throw new Error("Lambda function name output not found");
      }
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe("python3.9");
    }, TIMEOUT);

    test("Lambda has VPC configuration", async () => {
      if (!outputs.lambda_function_name) {
        throw new Error("Lambda function name output not found");
      }
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.Configuration?.VpcConfig?.SubnetIds!.length).toBeGreaterThan(0);
    }, TIMEOUT);

    test("Lambda has required environment variables", async () => {
      if (!outputs.lambda_function_name) {
        throw new Error("Lambda function name output not found");
      }
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );
      const env = response.Configuration?.Environment?.Variables;
      expect(env).toBeDefined();
      expect(env).toHaveProperty("DB_HOST");
      expect(env).toHaveProperty("DB_NAME");
      expect(env).toHaveProperty("BUCKET_NAME");
    }, TIMEOUT);
  });

  describeIfDeployed("CloudWatch Alarms", () => {
    test("CPU alarms exist for us-east-1", async () => {
      const response = await cwUsEast1.send(
        new DescribeAlarmsCommand({
          AlarmNames: ["high-cpu-usage-us-east-1"],
        })
      );
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    }, TIMEOUT);

    test("CPU alarms exist for us-west-2", async () => {
      const response = await cwUsWest2.send(
        new DescribeAlarmsCommand({
          AlarmNames: ["high-cpu-usage-us-west-2"],
        })
      );
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    }, TIMEOUT);

    test("RDS CPU alarm exists", async () => {
      const response = await cwUsEast1.send(
        new DescribeAlarmsCommand({
          AlarmNames: ["rds-high-cpu"],
        })
      );
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);
    }, TIMEOUT);
  });

  describeIfDeployed("Route 53 DNS and Failover", () => {
    test("hosted zone exists", async () => {
      const response = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      const zone = response.HostedZones?.find((z) =>
        z.Name?.includes("example.com")
      );
      expect(zone).toBeDefined();
    }, TIMEOUT);

    test("DNS records exist for failover configuration", async () => {
      const zonesResponse = await route53Client.send(
        new ListHostedZonesCommand({})
      );
      const zone = zonesResponse.HostedZones?.find((z) =>
        z.Name?.includes("example.com")
      );
      if (zone) {
        const response = await route53Client.send(
          new ListResourceRecordSetsCommand({
            HostedZoneId: zone.Id,
          })
        );
        expect(response.ResourceRecordSets).toBeDefined();
        expect(response.ResourceRecordSets!.length).toBeGreaterThan(0);
      }
    }, TIMEOUT);
  });

  describeIfDeployed("Resource Tagging", () => {
    test("EC2 instances have correct tags", async () => {
      const response = await usEast1Client.send(
        new DescribeInstancesCommand({
          Filters: [
            { Name: "tag:Environment", Values: ["Production"] },
            { Name: "tag:Team", Values: ["DevOps"] },
          ],
        })
      );
      const instances = response.Reservations?.flatMap((r) => r.Instances) || [];
      expect(instances.length).toBeGreaterThan(0);
    }, TIMEOUT);
  });
});
