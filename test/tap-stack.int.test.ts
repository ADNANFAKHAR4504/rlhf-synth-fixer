// test/tap-stack.int.test.ts
import fs from "fs";
import path from "path";
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeInstancesCommandOutput,
} from "@aws-sdk/client-ec2";
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  LoadBalancer,
  TargetGroup,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { CloudWatchClient, ListDashboardsCommand } from "@aws-sdk/client-cloudwatch";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

const outputsPath = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");

// Try to read outputs if present — tests will still work without it.
let outputs: Record<string, any> = {};
try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  }
} catch (err) {
  // ignore and continue — we will derive names where possible
  outputs = {};
}

// Environment name / suffix used in CloudFormation template (default dev)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || process.env.ENV || "dev";
const region = process.env.AWS_REGION || "ap-south-1"; // set default region if needed

// AWS clients
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const secrets = new SecretsManagerClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const sts = new STSClient({ region });

describe("TapStack Infrastructure Integration Tests", () => {
  jest.setTimeout(120000); // some calls (RDS) can be slow

  test("EC2 instance should exist and be running (searched by tag Name)", async () => {
    // Tag used in template: ${EnvironmentName}-ec2
    const expectedName = `${environmentSuffix}-ec2`;

    const describeResp: DescribeInstancesCommandOutput = await ec2.send(
      new DescribeInstancesCommand({
        Filters: [{ Name: "tag:Name", Values: [expectedName] }],
      })
    );

    const instance = describeResp.Reservations?.flatMap(r => r.Instances ?? [])?.[0];
    expect(instance).toBeDefined();
    // instance state may be pending/ running — check at least that it's not terminated
    const state = instance?.State?.Name;
    expect(state).toBeDefined();
    // Accept 'running' or 'pending' as valid active states for a recently-created instance
    expect(["running", "pending"]).toContain(state);
    // Basic sanity: instance type should be t2.micro per template
    expect(instance?.InstanceType).toBe("t2.micro");
  });

  test("Application Load Balancer should exist and be active (by DNS or name)", async () => {
    // Template names: Name: ${EnvironmentName}-alb
    const expectedName = `${environmentSuffix}-alb`;
    const dnsFromOutputs: string | undefined = outputs.LoadBalancerDNS;

    let lb: LoadBalancer | undefined;

    if (dnsFromOutputs) {
      // find ALB by DNS from outputs if provided
      const resp = await elbv2.send(new DescribeLoadBalancersCommand({}));
      lb = resp.LoadBalancers?.find((l) => l.DNSName === dnsFromOutputs);
    }

    if (!lb) {
      // fallback: find by LoadBalancerName
      const resp = await elbv2.send(new DescribeLoadBalancersCommand({}));
      lb = resp.LoadBalancers?.find((l) => l.LoadBalancerName === expectedName);
    }

    expect(lb).toBeDefined();
    expect(lb?.Type).toBe("application");
    // State might be active; accept active or provisioning
    expect(["active", "provisioning"]).toContain(lb?.State?.Code ?? "");
  });

  test("ALB Target Group should exist and be HTTP on port 80", async () => {
    // Find any target group in the VPC with Port 80 + HTTP
    const tgResp = await elbv2.send(new DescribeTargetGroupsCommand({}));
    const tg: TargetGroup | undefined = tgResp.TargetGroups?.find(
      (t) => t.Port === 80 && (t.Protocol ?? "").toUpperCase() === "HTTP"
    );

    expect(tg).toBeDefined();
    expect(tg?.Port).toBe(80);
    expect((tg?.Protocol ?? "").toUpperCase()).toBe("HTTP");
  });

  test("RDS Instance should exist and be available (by predictable identifier)", async () => {
    // Template DBInstanceIdentifier: ${EnvironmentName}-mysql-db
    const expectedDbIdentifier = `${environmentSuffix}-mysql-db`;
    // Try to describe by identifier
    const r = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: expectedDbIdentifier }).catch(e => {
      // If AWS throws because not found, rethrow with clearer message
      throw e;
    }));
    const db = r.DBInstances?.[0];
    expect(db).toBeDefined();
    // DB status should be available (or backing-up), but primarily not 'deleted'
    expect(db?.DBInstanceStatus).toBeDefined();
    expect(["available", "backing-up", "modifying"]).toContain(db?.DBInstanceStatus);
    // If outputs had endpoint, validate it matches (optional)
    if (outputs.RDSInstanceEndpoint) {
      expect(db?.Endpoint?.Address).toBe(outputs.RDSInstanceEndpoint);
    }
    // engine should be mysql per template
    expect((db?.Engine ?? "").toLowerCase()).toContain("mysql");
  });

  test("Logs S3 bucket should exist (derived name from template)", async () => {
    // Template bucketName: ${EnvironmentName}-logs-${AWS::AccountId}-web-app
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    const accountId = identity.Account;
    expect(accountId).toBeDefined();

    const bucketName = `${environmentSuffix}-logs-${accountId}-web-app`;
    // attempt head bucket
    const resp = await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    // If call succeeds, we get metadata; ensure an HTTP status code exists
    expect(resp.$metadata.httpStatusCode).toBeDefined();
    // head bucket often returns 200
    expect([200, 301, 403]).toContain(resp.$metadata.httpStatusCode);
  });

  test("DB Secret should exist in Secrets Manager (by name from template)", async () => {
    // Template secret name: ${EnvironmentName}-db-secretscredential
    const secretName = `${environmentSuffix}-db-secretscredential`;

    // DescribeSecret will throw ResourceNotFoundException if not present.
    const resp = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
    expect(resp).toBeDefined();
    expect(resp.Name).toBe(secretName);
  });

  test("CloudWatch Dashboard should exist (by name)", async () => {
    // Template: DashboardName: ${EnvironmentName}-dashboard
    const dashboardName = `${environmentSuffix}-dashboard`;
    const resp = await cloudwatch.send(new ListDashboardsCommand({}));
    const found = resp.DashboardEntries?.find((d) => d.DashboardName === dashboardName);
    expect(found).toBeDefined();
  });
});
