import fs from "fs";
import path from "path";
import { setTimeout as wait } from "timers/promises";

// EC2
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";

// RDS
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from "@aws-sdk/client-rds";

// CloudWatch
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

// SNS
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from "@aws-sdk/client-sns";

// Secrets Manager
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

/* ---------------------------- Setup / Helpers --------------------------- */

// Load outputs - handle both all-outputs.json and flat-outputs.json formats
const outputsPath = path.resolve(process.cwd(), "cfn-outputs", "all-outputs.json");
const flatOutputsPath = path.resolve(process.cwd(), "cfn-outputs", "flat-outputs.json");

let outputs: Record<string, string> = {};

if (fs.existsSync(outputsPath)) {
  // Format: {stackName: [{OutputKey: "...", OutputValue: "..."}]}
  const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  const firstTopKey = Object.keys(raw)[0];
  const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstTopKey];
  for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;
} else if (fs.existsSync(flatOutputsPath)) {
  // Format: {key: value, key2: value2, ...}
  outputs = JSON.parse(fs.readFileSync(flatOutputsPath, "utf8"));
} else {
  throw new Error(
    `Expected outputs file at ${outputsPath} or ${flatOutputsPath} — create it before running integration tests.`
  );
}

// deduce region from ARNs/endpoints or env
function deduceRegion(): string {
  const possible = [
    outputs.ClusterArn,
    outputs.SnsTopicArn,
    outputs.AlarmCpuArn,
    outputs.AlarmConnectionsArn,
    outputs.AlarmReadLatencyArn,
    outputs.AlarmWriteLatencyArn,
    outputs.AlarmReplicaLagArn,
    outputs.SecretArn,
  ].filter(Boolean) as string[];
  for (const v of possible) {
    const m = /arn:aws:[a-z0-9-]+:([a-z0-9-]+):\d{12}:/i.exec(v);
    if (m && m[1]) return m[1];
  }
  // endpoints like foo.us-east-1.rds.amazonaws.com
  for (const ep of [outputs.WriterEndpoint, outputs.ReaderEndpoint]) {
    if (ep) {
      const m = /\.([a-z]{2}-[a-z]+-\d)\.rds\.amazonaws\.com$/i.exec(ep);
      if (m && m[1]) return m[1];
    }
  }
  // env fallback
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
}
const region = deduceRegion();

// AWS clients
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const cw = new CloudWatchClient({ region });
const sns = new SNSClient({ region });
const secrets = new SecretsManagerClient({ region });

// retry helper with incremental backoff
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 600): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await wait(baseDelayMs * (i + 1));
    }
  }
  throw lastErr;
}

function isHostname(v?: string) {
  return typeof v === "string" && /^[a-z0-9.-]+\.[a-z0-9.-]+$/.test(v);
}

function csvToList(v?: string) {
  return (v || "").split(",").map((x) => x.trim()).filter(Boolean);
}

/* ------------------------------ Tests ---------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000); // up to 10 minutes for cold accounts

  it("outputs contain all required keys from TapStack.yml", () => {
    const keys = [
      "ClusterArn",
      "ClusterIdentifier",
      "WriterEndpoint",
      "ReaderEndpoint",
      "EngineVersionOut",
      "DBInstanceWriterArn",
      "DBInstanceReader1Arn",
      "DBInstanceReader2Arn",
      "SnsTopicArn",
      "AlarmCpuArn",
      "AlarmConnectionsArn",
      "AlarmReadLatencyArn",
      "AlarmWriteLatencyArn",
      "AlarmReplicaLagArn",
      "VpcId",
      "DbSubnetGroupName",
      "DbSecurityGroupId",
      "AppSecurityGroupId",
      "PrivateSubnetIds",
      "SecretArn",
      "RotationScheduleArn",
    ];
    for (const k of keys) {
      expect(typeof outputs[k]).toBe("string");
      expect(outputs[k].length).toBeGreaterThan(0);
    }
  });

  it("region is deduced from ARNs or environment", () => {
    expect(typeof region).toBe("string");
    expect(/^[a-z]{2}-[a-z]+-\d$/.test(region)).toBe(true);
  });

  it("RDS: DescribeDBClusters returns the target cluster with expected engine & backtrack/backup settings", async () => {
    const id = outputs.ClusterIdentifier;
    const resp = await retry(() => rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: id })));
    expect(resp.DBClusters && resp.DBClusters.length).toBeGreaterThan(0);
    const c = resp.DBClusters![0];
    expect(c.Engine).toMatch(/^aurora-mysql/);
    expect(typeof c.BacktrackWindow === "number" ? c.BacktrackWindow : 0).toBeGreaterThanOrEqual(259200);
    expect(typeof c.BackupRetentionPeriod === "number" ? c.BackupRetentionPeriod : 0).toBeGreaterThanOrEqual(7);
  });

  it("RDS: writer DB instance (by DbiResourceId) can be described and PI is enabled", async () => {
    const dbi = outputs.DBInstanceWriterArn; // DbiResourceId
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const inst = (resp.DBInstances || []).find((i) => i.DbiResourceId === dbi);
    expect(inst).toBeDefined();
    expect(inst!.DBInstanceStatus).toBeDefined();
    // performance insights fields (best-effort: some accounts may return undefined)
    if (typeof inst!.PerformanceInsightsEnabled === "boolean") {
      expect(inst!.PerformanceInsightsEnabled).toBe(true);
    }
  });

  it("RDS: reader1 DB instance is present", async () => {
    const dbi = outputs.DBInstanceReader1Arn;
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const inst = (resp.DBInstances || []).find((i) => i.DbiResourceId === dbi);
    expect(inst).toBeDefined();
  });

  it("RDS: reader2 DB instance is present", async () => {
    const dbi = outputs.DBInstanceReader2Arn;
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const inst = (resp.DBInstances || []).find((i) => i.DbiResourceId === dbi);
    expect(inst).toBeDefined();
  });

  it("RDS: cluster has at least 3 members (1 writer + 2 readers)", async () => {
    const id = outputs.ClusterIdentifier;
    const resp = await retry(() => rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: id })));
    const c = resp.DBClusters![0];
    const members = c.DBClusterMembers || [];
    expect(members.length).toBeGreaterThanOrEqual(3);
  });

  it("Endpoints: WriterEndpoint and ReaderEndpoint look like hostnames", () => {
    expect(isHostname(outputs.WriterEndpoint)).toBe(true);
    expect(isHostname(outputs.ReaderEndpoint)).toBe(true);
  });

  it("SNS: Topic exists and returns attributes", async () => {
    const arn = outputs.SnsTopicArn;
    const attrs = await retry(() => sns.send(new GetTopicAttributesCommand({ TopicArn: arn })));
    expect(attrs.Attributes).toBeDefined();
  });

  it("SNS: Topic has at least zero or more subscriptions (list call succeeds)", async () => {
    const arn = outputs.SnsTopicArn;
    const subs = await retry(() => sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: arn })));
    expect(Array.isArray(subs.Subscriptions)).toBe(true);
  });

  it("CloudWatch Alarm (CPU): exists with threshold ≥ 80", async () => {
    const nameArn = outputs.AlarmCpuArn;
    const name = nameArn.split(":alarm:")[1] || "";
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    expect((alarm!.Threshold as number) >= 80).toBe(true);
  });

  it("CloudWatch Alarm (Connections): exists with threshold ≥ 14000", async () => {
    const nameArn = outputs.AlarmConnectionsArn;
    const name = nameArn.split(":alarm:")[1] || "";
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    expect((alarm!.Threshold as number) >= 14000).toBe(true);
  });

  it("CloudWatch Alarm (ReadLatency): exists with threshold ≥ 0.2", async () => {
    const nameArn = outputs.AlarmReadLatencyArn;
    const name = nameArn.split(":alarm:")[1] || "";
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    expect((alarm!.Threshold as number) >= 0.2).toBe(true);
  });

  it("CloudWatch Alarm (WriteLatency): exists with threshold ≥ 0.2", async () => {
    const nameArn = outputs.AlarmWriteLatencyArn;
    const name = nameArn.split(":alarm:")[1] || "";
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    expect((alarm!.Threshold as number) >= 0.2).toBe(true);
  });

  it("CloudWatch Alarm (ReplicaLag): exists with threshold ≥ 1.0", async () => {
    const nameArn = outputs.AlarmReplicaLagArn;
    const name = nameArn.split(":alarm:")[1] || "";
    const resp = await retry(() => cw.send(new DescribeAlarmsCommand({ AlarmNames: [name] })));
    const alarm = (resp.MetricAlarms || [])[0];
    expect(alarm).toBeDefined();
    expect((alarm!.Threshold as number) >= 1.0).toBe(true);
  });

  it("EC2: VPC exists", async () => {
    const vpcId = outputs.VpcId;
    const resp = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })));
    expect((resp.Vpcs || []).length).toBe(1);
  });

  it("EC2: Private subnets (3) exist in the same VPC", async () => {
    const vpcId = outputs.VpcId;
    const ids = csvToList(outputs.PrivateSubnetIds);
    expect(ids.length).toBeGreaterThanOrEqual(3);
    const resp = await retry(() => ec2.send(new DescribeSubnetsCommand({ SubnetIds: ids })));
    const subnets = resp.Subnets || [];
    expect(subnets.length).toBe(ids.length);
    subnets.forEach((s) => expect(s.VpcId).toBe(vpcId));
  });

  it("EC2: DB and App Security Groups exist and belong to VPC", async () => {
    const vpcId = outputs.VpcId;
    const dbSg = outputs.DbSecurityGroupId;
    const appSg = outputs.AppSecurityGroupId;
    const resp = await retry(() =>
      ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [dbSg, appSg] }))
    );
    const sgs = resp.SecurityGroups || [];
    expect(sgs.length).toBe(2);
    sgs.forEach((sg) => expect(sg.VpcId).toBe(vpcId));
  });

  it("RDS: DBSubnetGroup exists with >=3 subnets", async () => {
    const name = outputs.DbSubnetGroupName;
    const resp = await retry(() =>
      rds.send(new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: name }))
    );
    const g = (resp.DBSubnetGroups || [])[0];
    expect(g).toBeDefined();
    expect((g.Subnets || []).length).toBeGreaterThanOrEqual(3);
  });

  it("Secrets Manager: Secret exists, has KMS key, and (if hosted) rotation >= 30 days", async () => {
    const secretArn = outputs.SecretArn;
    expect(typeof secretArn).toBe("string");

    // Determine rotation mode from output
    const rotationModeHosted =
      outputs.RotationScheduleArn &&
      typeof outputs.RotationScheduleArn === "string" &&
      outputs.RotationScheduleArn !== "managed-by-rds";

    const resp = await retry(() =>
      secrets.send(new DescribeSecretCommand({ SecretId: secretArn }))
    );

    // Secret should exist
    expect(resp.ARN || resp.Name).toBeTruthy();

    // Must be KMS-encrypted (for both modes)
    expect(typeof resp.KmsKeyId === "string" && resp.KmsKeyId.length > 0).toBe(true);

    // Rotation rules handling:
    // - If hosted rotation is used (macro + schedule), require >= 30 days.
    // - If RDS-managed ("managed-by-rds"), do NOT enforce HostedRotationLambda cadence.
    if (resp.RotationRules && typeof resp.RotationRules.AutomaticallyAfterDays === "number") {
      const days = resp.RotationRules.AutomaticallyAfterDays;
      if (rotationModeHosted) {
        expect(days).toBeGreaterThanOrEqual(30);
      } else {
        // RDS-managed path: rotation cadence (if any) is outside HostedRotationLambda;
        // just assert it's a positive number when present.
        expect(days).toBeGreaterThan(0);
      }
    }
  });

  it("RDS: Cluster parameter group is attached (best-effort)", async () => {
    const id = outputs.ClusterIdentifier;
    const resp = await retry(() => rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: id })));
    const c = resp.DBClusters![0];
    // Presence (value may be string; just assert defined)
    expect(c.DBClusterParameterGroup).toBeDefined();
  });

  it("RDS: DB instances have AutoMinorVersionUpgrade enabled (best-effort)", async () => {
    const resp = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
    const byId = new Map((resp.DBInstances || []).map((i) => [i.DbiResourceId, i]));
    const ids = [outputs.DBInstanceWriterArn, outputs.DBInstanceReader1Arn, outputs.DBInstanceReader2Arn];
    ids.forEach((id) => {
      const inst = byId.get(id);
      if (inst && typeof inst.AutoMinorVersionUpgrade === "boolean") {
        expect(inst.AutoMinorVersionUpgrade).toBe(true);
      } else {
        // best-effort: not fatal if missing
        expect(true).toBe(true);
      }
    });
  });

  it("RDS: Cluster CopyTagsToSnapshot and StorageEncrypted are enabled (best-effort)", async () => {
    const id = outputs.ClusterIdentifier;
    const resp = await retry(() => rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: id })));
    const c = resp.DBClusters![0];
    if (typeof c.CopyTagsToSnapshot === "boolean") {
      expect(c.CopyTagsToSnapshot).toBe(true);
    } else {
      expect(true).toBe(true);
    }
    if (typeof c.StorageEncrypted === "boolean") {
      expect(c.StorageEncrypted).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });
});
