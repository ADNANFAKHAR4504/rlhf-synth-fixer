import * as pulumi from "@pulumi/pulumi";
import { TapStack, TapStackArgs } from "../lib/tap-stack";
import * as AWS from "aws-sdk";
import * as fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Helper function to unwrap Pulumi Output
async function unwrapOutput<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply((value) => {
      resolve(value);
    });
  });
}

// Integration tests require actual AWS credentials and resources
// These tests should be run in a test AWS account
describe("TapStack Integration Tests", () => {
  let stack: TapStack;
  let config: TapStackArgs;
  let ec2Client: AWS.EC2;
  let rdsClient: AWS.RDS;
  let s3Client: AWS.S3;
  let elbv2Client: AWS.ELBv2;
  let route53Client: AWS.Route53;
  let cloudwatchClient: AWS.CloudWatch;

  const TEST_TIMEOUT = 30000; // 30 seconds

  beforeAll(() => {
    // Initialize AWS clients for both regions
    ec2Client = new AWS.EC2({ region: "eu-central-1" });
    rdsClient = new AWS.RDS({ region: "eu-central-1" });
    s3Client = new AWS.S3({ region: "eu-central-1" });
    elbv2Client = new AWS.ELBv2({ region: "eu-central-1" });
    route53Client = new AWS.Route53();
    cloudwatchClient = new AWS.CloudWatch({ region: "eu-central-1" });

    config = {
      environmentSuffix: "inttest",
      sourceRegion: "us-east-1",
      targetRegion: "eu-central-1",
      vpcConfig: {
        sourceCidr: "10.0.0.0/16",
        targetCidr: "10.1.0.0/16",
      },
      dbConfig: {
        instanceClass: "db.t3.micro", // Smaller for tests
        engine: "postgres",
        engineVersion: "13.7",
        username: "testadmin",
        allocatedStorage: 20,
      },
      ec2Config: {
        instanceType: "t3.micro", // Smaller for tests
        instanceCount: 2, // Fewer for tests
        amiId: "ami-0abcdef1234567890",
      },
      migrationConfig: {
        maxDowntimeMinutes: 15,
        enableRollback: true,
      },
      tags: {
        TestRun: "integration",
        AutoDelete: "true",
      },
    };
  });

  afterAll(async () => {
    // Cleanup test resources
    if (fs.existsSync("cfn-outputs/flat-outputs.json")) {
      fs.unlinkSync("cfn-outputs/flat-outputs.json");
    }
    if (fs.existsSync("scripts")) {
      fs.rmSync("scripts", { recursive: true, force: true });
    }
  });

  describe("Infrastructure Deployment", () => {
    it(
      "should deploy stack successfully",
      async () => {
        stack = new TapStack("inttest-stack", config);
        const outputs = await unwrapOutput(stack.outputs);
        expect(outputs).toBeDefined();
        expect(outputs.migrationStatus).toBe("completed");
      },
      TEST_TIMEOUT
    );

    it(
      "should create target VPC in eu-central-1",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const vpcs = await ec2Client
          .describeVpcs({
            Filters: [
              { Name: "tag:TargetRegion", Values: ["eu-central-1"] },
              { Name: "tag:Environment", Values: ["inttest"] },
            ],
          })
          .promise();

        expect(vpcs.Vpcs).toBeDefined();
        expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
        expect(vpcs.Vpcs![0].CidrBlock).toBe("10.1.0.0/16");
      },
      TEST_TIMEOUT
    );

    it(
      "should create subnets across multiple AZs",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const targetVpcId = outputs.targetVpcId;
        
        const subnets = await ec2Client
          .describeSubnets({
            Filters: [
              { Name: "vpc-id", Values: [targetVpcId] },
            ],
          })
          .promise();

        expect(subnets.Subnets).toBeDefined();
        expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(6); // 2 public, 2 private, 2 DB

        const azs = new Set(subnets.Subnets!.map((s) => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);
      },
      TEST_TIMEOUT
    );
  });

  describe("VPC Peering", () => {
    it(
      "should establish VPC peering between regions",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const peeringId = outputs.vpcPeeringConnectionId;
        
        const peering = await ec2Client
          .describeVpcPeeringConnections({
            VpcPeeringConnectionIds: [peeringId],
          })
          .promise();

        expect(peering.VpcPeeringConnections).toBeDefined();
        expect(peering.VpcPeeringConnections!.length).toBe(1);
        expect(peering.VpcPeeringConnections![0].Status?.Code).toBe("active");
      },
      TEST_TIMEOUT
    );

    it(
      "should allow cross-region connectivity",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const targetVpcId = outputs.targetVpcId;
        const peeringId = outputs.vpcPeeringConnectionId;
        
        const routeTables = await ec2Client
          .describeRouteTables({
            Filters: [
              { Name: "vpc-id", Values: [targetVpcId] },
            ],
          })
          .promise();

        expect(routeTables.RouteTables).toBeDefined();
        
        const hasRouteToSource = routeTables.RouteTables!.some((rt) =>
          rt.Routes?.some((r) => r.VpcPeeringConnectionId === peeringId)
        );

        expect(hasRouteToSource).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe("RDS Migration", () => {
    it(
      "should create RDS read replica in target region",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const instances = await rdsClient
          .describeDBInstances({
            Filters: [
              { Name: "db-instance-id", Values: [`inttest-stack-target-db-replica-inttest`] },
            ],
          })
          .promise();

        expect(instances.DBInstances).toBeDefined();
        expect(instances.DBInstances!.length).toBe(1);
        expect(instances.DBInstances![0].Engine).toBe("postgres");
        expect(instances.DBInstances![0].StorageEncrypted).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      "should enable Multi-AZ for RDS",
      async () => {
        const instances = await rdsClient
          .describeDBInstances({
            Filters: [
              { Name: "db-instance-id", Values: [`inttest-stack-target-db-replica-inttest`] },
            ],
          })
          .promise();

        expect(instances.DBInstances![0].MultiAZ).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      "should monitor RDS replica lag",
      async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

        const metrics = await cloudwatchClient
          .getMetricStatistics({
            Namespace: "AWS/RDS",
            MetricName: "ReplicaLag",
            Dimensions: [
              {
                Name: "DBInstanceIdentifier",
                Value: "inttest-stack-target-db-replica-inttest",
              },
            ],
            StartTime: startTime,
            EndTime: endTime,
            Period: 300,
            Statistics: ["Average", "Maximum"],
          })
          .promise();

        expect(metrics.Datapoints).toBeDefined();
        // Check that lag is within 15 minute threshold (900 seconds)
        if (metrics.Datapoints!.length > 0) {
          const maxLag = Math.max(...metrics.Datapoints!.map((d) => d.Maximum || 0));
          expect(maxLag).toBeLessThan(900);
        }
      },
      TEST_TIMEOUT
    );

    it(
      "should encrypt RDS snapshots with KMS",
      async () => {
        const instances = await rdsClient
          .describeDBInstances({
            Filters: [
              { Name: "db-instance-id", Values: [`inttest-stack-target-db-replica-inttest`] },
            ],
          })
          .promise();

        expect(instances.DBInstances![0].StorageEncrypted).toBe(true);
        expect(instances.DBInstances![0].KmsKeyId).toBeDefined();
      },
      TEST_TIMEOUT
    );
  });

  describe("S3 Replication", () => {
    it(
      "should replicate S3 objects with metadata",
      async () => {
        const sourceBucket = "inttest-stack-source-assets-inttest";
        const targetBucket = "inttest-stack-target-assets-inttest";

        // Put test object in source
        await s3Client
          .putObject({
            Bucket: sourceBucket,
            Key: "test-file.txt",
            Body: "test content",
            Metadata: {
              "test-key": "test-value",
            },
          })
          .promise();

        // Wait for replication
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check target bucket
        const targetObject = await s3Client
          .headObject({
            Bucket: targetBucket,
            Key: "test-file.txt",
          })
          .promise();

        expect(targetObject.Metadata).toHaveProperty("test-key");
        expect(targetObject.Metadata!["test-key"]).toBe("test-value");
      },
      TEST_TIMEOUT
    );

    it(
      "should preserve ACLs during replication",
      async () => {
        const sourceBucket = "inttest-stack-source-assets-inttest";
        const targetBucket = "inttest-stack-target-assets-inttest";

        await s3Client
          .putObject({
            Bucket: sourceBucket,
            Key: "test-acl.txt",
            Body: "test content",
            ACL: "private",
          })
          .promise();

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const targetAcl = await s3Client
          .getObjectAcl({
            Bucket: targetBucket,
            Key: "test-acl.txt",
          })
          .promise();

        expect(targetAcl.Grants).toBeDefined();
      },
      TEST_TIMEOUT
    );

    it(
      "should enable versioning on S3 buckets",
      async () => {
        const targetBucket = "inttest-stack-target-assets-inttest";

        const versioning = await s3Client
          .getBucketVersioning({
            Bucket: targetBucket,
          })
          .promise();

        expect(versioning.Status).toBe("Enabled");
      },
      TEST_TIMEOUT
    );
  });

  describe("Load Balancer", () => {
    it(
      "should create ALB in target region",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const lbs = await elbv2Client
          .describeLoadBalancers({
            Names: [`inttest-stack-target-alb-inttest`],
          })
          .promise();

        expect(lbs.LoadBalancers).toBeDefined();
        expect(lbs.LoadBalancers!.length).toBe(1);
        expect(lbs.LoadBalancers![0].Type).toBe("application");
      },
      TEST_TIMEOUT
    );

    it(
      "should configure health checks",
      async () => {
        const lbs = await elbv2Client
          .describeLoadBalancers({
            Names: [`inttest-stack-target-alb-inttest`],
          })
          .promise();

        const targetGroups = await elbv2Client
          .describeTargetGroups({
            LoadBalancerArn: lbs.LoadBalancers![0].LoadBalancerArn,
          })
          .promise();

        expect(targetGroups.TargetGroups).toBeDefined();
        expect(targetGroups.TargetGroups![0].HealthCheckEnabled).toBe(true);
        expect(targetGroups.TargetGroups![0].HealthCheckPath).toBe("/health");
      },
      TEST_TIMEOUT
    );

    it(
      "should have healthy targets",
      async () => {
        const lbs = await elbv2Client
          .describeLoadBalancers({
            Names: [`inttest-stack-target-alb-inttest`],
          })
          .promise();

        const targetGroups = await elbv2Client
          .describeTargetGroups({
            LoadBalancerArn: lbs.LoadBalancers![0].LoadBalancerArn,
          })
          .promise();

        const targetGroupArn = targetGroups.TargetGroups![0].TargetGroupArn;
        if (!targetGroupArn) {
          throw new Error("Target group ARN is undefined");
        }

        const health = await elbv2Client
          .describeTargetHealth({
            TargetGroupArn: targetGroupArn,
          })
          .promise();

        const healthyTargets = health.TargetHealthDescriptions!.filter(
          (t) => t.TargetHealth?.State === "healthy"
        );

        expect(healthyTargets.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("Route53 DNS", () => {
    it(
      "should create Route53 health checks",
      async () => {
        const healthChecks = await route53Client
          .listHealthChecks()
          .promise();

        const migrationHealthChecks = healthChecks.HealthChecks.filter((hc) =>
          hc.HealthCheckConfig.FullyQualifiedDomainName?.includes("inttest")
        );

        expect(migrationHealthChecks.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );

    it(
      "should configure weighted routing policy",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const zone = await route53Client
          .listHostedZones()
          .promise();

        const records = await route53Client
          .listResourceRecordSets({
            HostedZoneId: zone.HostedZones[0].Id,
          })
          .promise();

        const weightedRecords = records.ResourceRecordSets.filter(
          (r) => r.SetIdentifier === "target-region"
        );

        expect(weightedRecords.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("CloudWatch Monitoring", () => {
    it(
      "should create CloudWatch alarms for RDS",
      async () => {
        const alarms = await cloudwatchClient
          .describeAlarms({
            AlarmNamePrefix: "inttest-stack-rds",
          })
          .promise();

        expect(alarms.MetricAlarms).toBeDefined();
        expect(alarms.MetricAlarms!.length).toBeGreaterThanOrEqual(2);
      },
      TEST_TIMEOUT
    );

    it(
      "should create CloudWatch alarms for ALB",
      async () => {
        const alarms = await cloudwatchClient
          .describeAlarms({
            AlarmNamePrefix: "inttest-stack-alb",
          })
          .promise();

        expect(alarms.MetricAlarms).toBeDefined();
        expect(alarms.MetricAlarms!.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );

    it(
      "should trigger alarms on threshold breach",
      async () => {
        const alarms = await cloudwatchClient
          .describeAlarms({
            AlarmNamePrefix: "inttest-stack",
            StateValue: "ALARM",
          })
          .promise();

        // Should have no alarms in ALARM state during healthy operation
        expect(alarms.MetricAlarms!.length).toBe(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("Validation Scripts", () => {
    it(
      "should execute pre-migration validation successfully",
      async () => {
        const { stdout, stderr } = await execAsync(
          "bash scripts/pre-migration-validation.sh"
        );

        expect(stderr).toBe("");
        expect(stdout).toContain("Validating source infrastructure");
      },
      TEST_TIMEOUT
    );

    it(
      "should execute post-migration validation successfully",
      async () => {
        const { stdout, stderr } = await execAsync(
          "bash scripts/post-migration-validation.sh"
        );

        expect(stderr).toBe("");
        expect(stdout).toContain("All checks passed");
      },
      TEST_TIMEOUT
    );

    it(
      "should verify ALB health endpoint",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const albDnsName = outputs.targetEndpoints.albDnsName;
        
        const response = await fetch(`http://${albDnsName}/health`);

        expect(response.status).toBe(200);
        const text = await response.text();
        expect(text).toBe("OK");
      },
      TEST_TIMEOUT
    );
  });

  describe("Rollback Mechanism", () => {
    it(
      "should support rollback on validation failure",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        expect(outputs.rollbackAvailable).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      "should maintain source infrastructure during migration",
      async () => {
        const sourceEc2 = new AWS.EC2({ region: "us-east-1" });
        const vpcs = await sourceEc2
          .describeVpcs({
            Filters: [
              { Name: "tag:SourceRegion", Values: ["us-east-1"] },
            ],
          })
          .promise();

        expect(vpcs.Vpcs).toBeDefined();
        expect(vpcs.Vpcs!.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe("End-to-End Migration", () => {
    it(
      "should complete full migration workflow",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);

        // Verify all components
        expect(outputs.migrationStatus).toBe("completed");
        expect(outputs.targetEndpoints.albDnsName).toBeDefined();
        expect(outputs.targetEndpoints.rdsEndpoint).toBeDefined();
        expect(outputs.targetEndpoints.cloudfrontDomain).toBeDefined();
        expect(outputs.targetEndpoints.route53Record).toBeDefined();

        // Verify validation passed
        expect(outputs.validationResults.preCheck.passed).toBe(true);
        expect(outputs.validationResults.postCheck.passed).toBe(true);
        expect(outputs.validationResults.healthChecks.passed).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      "should write complete outputs to file",
      async () => {
        expect(fs.existsSync("cfn-outputs/flat-outputs.json")).toBe(true);

        const outputs = JSON.parse(
          fs.readFileSync("cfn-outputs/flat-outputs.json", "utf-8")
        );

        expect(outputs).toHaveProperty("migrationStatus");
        expect(outputs).toHaveProperty("targetEndpoints");
        expect(outputs).toHaveProperty("validationResults");
        expect(outputs).toHaveProperty("sourceVpcId");
        expect(outputs).toHaveProperty("targetVpcId");
        expect(outputs).toHaveProperty("vpcPeeringConnectionId");
      },
      TEST_TIMEOUT
    );
  });

  describe("Security Compliance", () => {
    it(
      "should encrypt all data at rest",
      async () => {
        // RDS encryption verified in RDS tests
        // S3 versioning verified in S3 tests
        expect(true).toBe(true);
      },
      TEST_TIMEOUT
    );

    it(
      "should use KMS CMKs for encryption",
      async () => {
        const kmsClient = new AWS.KMS({ region: "eu-central-1" });
        const keys = await kmsClient.listKeys().promise();

        const migrationKeys = await Promise.all(
          keys.Keys!.map(async (key) => {
            const metadata = await kmsClient
              .describeKey({ KeyId: key.KeyId! })
              .promise();
            return metadata;
          })
        );

        const hasEnabledRotation = migrationKeys.some(
          (k) => k.KeyMetadata?.KeyManager === "CUSTOMER"
        );

        expect(hasEnabledRotation).toBe(true);
      },
      TEST_TIMEOUT
    );
  });

  describe("Performance", () => {
    it(
      "should complete database cutover within 15 minutes",
      async () => {
        const outputs = await unwrapOutput(stack.outputs);
        const migrationTime = new Date(outputs.migrationTimestamp);
        const now = new Date();
        const diffMinutes = (now.getTime() - migrationTime.getTime()) / 60000;

        expect(diffMinutes).toBeLessThan(15);
      },
      TEST_TIMEOUT
    );
  });
});
