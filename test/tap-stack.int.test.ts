// inte-tests.ts

import fs from "fs";
import path from "path";
import net from "net";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
} from "@aws-sdk/client-ec2";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";

import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
  DescribeConfigRulesCommand,
} from "@aws-sdk/client-config-service";

import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBParametersCommand,
} from "@aws-sdk/client-rds";

import {
  KMSClient,
  DescribeKeyCommand,
} from "@aws-sdk/client-kms";

import {
  WAFV2Client,
  GetWebACLCommand,
  ListResourcesForWebACLCommand,
} from "@aws-sdk/client-wafv2";

import {
  SecurityHubClient,
  DescribeHubCommand,
  GetEnabledStandardsCommand,
} from "@aws-sdk/client-securityhub";

import {
  GuardDutyClient,
  GetDetectorCommand,
} from "@aws-sdk/client-guardduty";

/* ---------------------------- Setup / Helpers --------------------------- */

const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(p)) {
  throw new Error(`Expected outputs file at ${p} — create it before running integration tests.`);
}
const raw = JSON.parse(fs.readFileSync(p, "utf8"));

// Assume standard CFN outputs structure: { "StackName": [ {OutputKey, OutputValue}, ... ] }
const firstTopKey = Object.keys(raw)[0];
const outputsArray: { OutputKey: string; OutputValue: string }[] = raw[firstTopKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

function deduceRegion(): string {
  const fromOutputs =
    outputs.PrimaryRegionOut ||
    outputs.PrimaryRegion ||
    outputs.Region ||
    outputs.RegionValidation ||
    "";

  const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "";

  const candidate = fromOutputs || envRegion || "us-east-1";
  const match = String(candidate).match(/[a-z]{2}-[a-z0-9-]+-\d/);
  return match ? match[0] : "us-east-1";
}

const region = deduceRegion();

// AWS clients in the stack’s region
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const ct = new CloudTrailClient({ region });
const configSvc = new ConfigServiceClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const kms = new KMSClient({ region });
const wafv2 = new WAFV2Client({ region });
const sh = new SecurityHubClient({ region });
const gd = new GuardDutyClient({ region });

// generic retry helper
async function retry<T>(fn: () => Promise<T>, attempts = 4, baseDelayMs = 1000): Promise<T> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await wait(baseDelayMs * (i + 1));
      }
    }
  }
  throw lastErr;
}

function isVpcId(v?: string) {
  return typeof v === "string" && /^vpc-[0-9a-f]+$/.test(v);
}

function splitCsv(val?: string): string[] {
  if (!val) return [];
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ------------------------------ Tests ---------------------------------- */

describe("TapStack — Live Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes for full suite

  /* 1 */
  it("outputs file parsed and essential outputs are present", () => {
    expect(Array.isArray(outputsArray)).toBe(true);
    expect(outputs.VpcId).toBeDefined();
    expect(outputs.LoggingBucketName).toBeDefined();
    expect(outputs.CloudTrailBucketName).toBeDefined();
    expect(outputs.AlbDnsName).toBeDefined();
    expect(outputs.RdsEndpointAddress).toBeDefined();
    expect(outputs.KmsKeyArns).toBeDefined();
  });

  /* 2 */
  it("deduced region is a valid AWS region-like string", () => {
    expect(typeof region).toBe("string");
    expect(region).toMatch(/^[a-z]{2}-[a-z0-9-]+-\d$/);
  });

  /* 3 */
  it("VPC exists and is available", async () => {
    const vpcId = outputs.VpcId;
    expect(isVpcId(vpcId)).toBe(true);
    const resp = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }))
    );
    expect(resp.Vpcs && resp.Vpcs.length).toBe(1);
    const vpc = resp.Vpcs![0];
    expect(vpc.State).toBe("available");
    expect(vpc.CidrBlock).toBeDefined();
  });

  /* 4 */
  it("public subnets exist, belong to the VPC, and map public IPs on launch", async () => {
    const vpcId = outputs.VpcId;
    const publicSubnetIds = splitCsv(outputs.PublicSubnetIds);
    expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }))
    );
    expect(resp.Subnets && resp.Subnets.length).toBe(publicSubnetIds.length);

    for (const sn of resp.Subnets || []) {
      expect(sn.VpcId).toBe(vpcId);
      expect(sn.MapPublicIpOnLaunch).toBe(true);
    }
  });

  /* 5 */
  it("private subnets exist, belong to the VPC, and do NOT map public IPs", async () => {
    const vpcId = outputs.VpcId;
    const privateSubnetIds = splitCsv(outputs.PrivateSubnetIds);
    expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

    const resp = await retry(() =>
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }))
    );
    expect(resp.Subnets && resp.Subnets.length).toBe(privateSubnetIds.length);

    for (const sn of resp.Subnets || []) {
      expect(sn.VpcId).toBe(vpcId);
      expect(sn.MapPublicIpOnLaunch).toBe(false);
    }
  });

  /* 6 */
  it("NAT gateways exist in public subnets and are available", async () => {
    const vpcId = outputs.VpcId;
    const resp = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({ Filter: [{ Name: "vpc-id", Values: [vpcId] }] }))
    );
    const natGws = resp.NatGateways || [];
    expect(natGws.length).toBeGreaterThanOrEqual(2);
    const availableCount = natGws.filter((g) => g.State === "available").length;
    expect(availableCount).toBeGreaterThanOrEqual(1);
  });

  /* 7 */
  it("Logging S3 bucket exists, is versioned and KMS-encrypted", async () => {
    const bucket = outputs.LoggingBucketName;
    const head = await retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })));
    expect(head.$metadata.httpStatusCode).toBe(200);

    const ver = await retry(() =>
      s3.send(new GetBucketVersioningCommand({ Bucket: bucket }))
    );
    expect(ver.Status).toBe("Enabled");

    const enc = await retry(() =>
      s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }))
    );
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
    const rules = enc.ServerSideEncryptionConfiguration!.Rules || [];
    expect(rules.length).toBeGreaterThanOrEqual(1);
    const algo = rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toBe("aws:kms");
  });

  /* 8 */
  it("CloudTrail S3 bucket exists, is versioned and KMS-encrypted", async () => {
    const bucket = outputs.CloudTrailBucketName;
    const head = await retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })));
    expect(head.$metadata.httpStatusCode).toBe(200);

    const ver = await retry(() =>
      s3.send(new GetBucketVersioningCommand({ Bucket: bucket }))
    );
    expect(ver.Status).toBe("Enabled");

    const enc = await retry(() =>
      s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }))
    );
    expect(enc.ServerSideEncryptionConfiguration).toBeDefined();
    const rules = enc.ServerSideEncryptionConfiguration!.Rules || [];
    expect(rules.length).toBeGreaterThanOrEqual(1);
    const algo = rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(algo).toBe("aws:kms");
  });

  /* 9 */
  it("Logging bucket policy enforces TLS-only access", async () => {
    const bucket = outputs.LoggingBucketName;
    const polResp = await retry(() =>
      s3.send(new GetBucketPolicyCommand({ Bucket: bucket }))
    );
    expect(polResp.Policy).toBeDefined();
    const policyDoc = JSON.parse(polResp.Policy!);
    const statements = policyDoc.Statement || [];
    const enforceTls = statements.find(
      (s: any) => s.Sid === "EnforceTLS" && s.Effect === "Deny"
    );
    expect(enforceTls).toBeDefined();
    expect(enforceTls.Condition?.Bool?.["aws:SecureTransport"]).toBe("false");
  });

  /* 10 */
  it("all KMS keys from outputs are enabled and have rotation turned on", async () => {
    const keyIds = splitCsv(outputs.KmsKeyArns);
    expect(keyIds.length).toBeGreaterThanOrEqual(4);

    for (const keyId of keyIds) {
      const resp = await retry(() =>
        kms.send(new DescribeKeyCommand({ KeyId: keyId }))
      );
      const meta = resp.KeyMetadata!;
      expect(meta.KeyState).toBe("Enabled");
      expect(meta.Enabled).toBe(true);
      expect(meta.KeyRotationEnabled).toBe(true);
    }
  });

  /* 11 */
  it("gateway VPC endpoint for S3 exists in the VPC", async () => {
    const vpcId = outputs.VpcId;
    const resp = await retry(() =>
      ec2.send(
        new DescribeVpcEndpointsCommand({
          Filters: [
            { Name: "vpc-id", Values: [vpcId] },
            { Name: "service-name", Values: [`com.amazonaws.${region}.s3`] },
          ],
        })
      )
    );
    const endpoints = resp.VpcEndpoints || [];
    expect(endpoints.length).toBeGreaterThanOrEqual(1);
    expect(endpoints[0].VpcEndpointType).toBe("Gateway");
  });

  /* 12 */
  it("interface VPC endpoints for logs, STS, KMS and SSM exist in the VPC", async () => {
    const vpcId = outputs.VpcId;
    const services = ["logs", "sts", "kms", "ssm"];
    const resp = await retry(() =>
      ec2.send(
        new DescribeVpcEndpointsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }],
        })
      )
    );
    const endpoints = resp.VpcEndpoints || [];
    for (const svc of services) {
      const fullName = `com.amazonaws.${region}.${svc}`;
      const found = endpoints.find((e) => e.ServiceName === fullName);
      expect(found).toBeDefined();
      expect(found!.VpcEndpointType).toBe("Interface");
    }
  });

  /* 13 */
  it("ALB exists, is application-type, has correct scheme, and DNS name matches output", async () => {
    const albArn = outputs.AlbArn;
    const dnsOutput = outputs.AlbDnsName;
    const resp = await retry(() =>
      elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }))
    );
    expect(resp.LoadBalancers && resp.LoadBalancers.length).toBe(1);
    const lb = resp.LoadBalancers![0];
    expect(lb.Type).toBe("application");
    expect(lb.Scheme).toBeDefined();
    expect(lb.DNSName).toBe(dnsOutput);
  });

  /* 14 */
  it("ALB security group only exposes ports 80 and 443", async () => {
    const albArn = outputs.AlbArn;
    const lbResp = await retry(() =>
      elbv2.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] }))
    );
    const lb = lbResp.LoadBalancers![0];
    const sgIds = lb.SecurityGroups || [];
    expect(sgIds.length).toBeGreaterThanOrEqual(1);

    const sgResp = await retry(() =>
      ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: sgIds,
        })
      )
    );
    const allIngress = (sgResp.SecurityGroups || []).flatMap(
      (sg) => sg.IpPermissions || []
    );
    // ALB template defines exactly two ingress rules: 80 and 443
    const ports = allIngress.map((p) => p.FromPort).filter((p) => p != null).sort();
    expect(ports).toEqual([80, 443]);
  });

  /* 15 */
  it("WAFv2 WebACL exists and includes AWS managed rule groups", async () => {
    const webAclArn = outputs.WebAclArn;
    expect(webAclArn).toBeDefined();

    // ARN format: arn:aws:wafv2:region:acctid:regional/webacl/name/id
    const parts = webAclArn.split("/");
    const webAclName = parts[parts.length - 2];
    const webAclId = parts[parts.length - 1];

    const resp = await retry(() =>
      wafv2.send(
        new GetWebACLCommand({
          Name: webAclName,
          Id: webAclId,
          Scope: "REGIONAL",
        })
      )
    );
    expect(resp.WebACL).toBeDefined();
    const rules = resp.WebACL!.Rules || [];
    expect(rules.length).toBeGreaterThanOrEqual(1);
    const hasManaged = rules.some(
      (r) =>
        r.Statement?.ManagedRuleGroupStatement?.VendorName === "AWS" &&
        !!r.Statement.ManagedRuleGroupStatement.Name
    );
    expect(hasManaged).toBe(true);
  });

  /* 16 */
  it("WAFv2 WebACL is associated with the ALB", async () => {
    const webAclArn = outputs.WebAclArn;
    const albArn = outputs.AlbArn;
    const resp = await retry(() =>
      wafv2.send(
        new ListResourcesForWebACLCommand({
          WebACLArn: webAclArn,
          ResourceType: "APPLICATION_LOAD_BALANCER",
        })
      )
    );
    const resources = resp.ResourceArns || [];
    expect(resources.length).toBeGreaterThanOrEqual(1);
    expect(resources).toContain(albArn);
  });

  /* 17 */
  it("CloudTrail trail is multi-region and logging is enabled", async () => {
    const trailName = outputs.CloudTrailArn; // value is Ref CloudTrail (trail name)
    const desc = await retry(() =>
      ct.send(new DescribeTrailsCommand({ trailNameList: [trailName] }))
    );
    const trailList = desc.trailList || [];
    expect(trailList.length).toBe(1);
    const trail = trailList[0];
    expect(trail.IsMultiRegionTrail).toBe(true);

    const status = await retry(() =>
      ct.send(new GetTrailStatusCommand({ Name: trailName }))
    );
    expect(typeof status.IsLogging).toBe("boolean");
    expect(status.IsLogging).toBe(true);
  });

  /* 18 */
  it("VPC Flow Logs are configured for the VPC and send ALL traffic to CloudWatch Logs", async () => {
    const flowLogId = outputs.FlowLogId;
    const resp = await retry(() =>
      ec2.send(new DescribeFlowLogsCommand({ FlowLogIds: [flowLogId] }))
    );
    const fls = resp.FlowLogs || [];
    expect(fls.length).toBe(1);
    const fl = fls[0];
    expect(fl.ResourceType).toBe("VPC");
    expect(fl.ResourceId).toBe(outputs.VpcId);
    expect(fl.TrafficType).toBe("ALL");
    expect(fl.LogDestinationType).toBe("cloud-watch-logs");
  });

  /* 19 */
  it("AWS Config recorder 'default' exists and is actively recording", async () => {
    const recorderName = outputs.ConfigRecorderName || "default";
    const rec = await retry(() =>
      configSvc.send(
        new DescribeConfigurationRecordersCommand({
          ConfigurationRecorderNames: [recorderName],
        })
      )
    );
    const recorders = rec.ConfigurationRecorders || [];
    expect(recorders.length).toBe(1);
    const r = recorders[0];
    expect(r.recordingGroup?.allSupported).toBe(true);
    expect(r.recordingGroup?.includeGlobalResourceTypes).toBe(true);

    const statusResp = await retry(() =>
      configSvc.send(
        new DescribeConfigurationRecorderStatusCommand({
          ConfigurationRecorderNames: [recorderName],
        })
      )
    );
    const statuses = statusResp.ConfigurationRecordersStatus || [];
    expect(statuses.length).toBe(1);
    const st = statuses[0];
    expect(st.recording).toBe(true);
  });

  /* 20 */
  it("AWS Config core managed rules for security are present", async () => {
    const desiredIds = new Set([
      "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
      "CLOUD_TRAIL_ENABLED",
      "INCOMING_SSH_DISABLED",
      "RDS_STORAGE_ENCRYPTED",
      "VPC_DEFAULT_SECURITY_GROUP_CLOSED",
      "ROOT_ACCOUNT_MFA_ENABLED",
    ]);

    const resp = await retry(() =>
      configSvc.send(new DescribeConfigRulesCommand({}))
    );
    const rules = resp.ConfigRules || [];
    const foundIds = new Set(
      rules.map((r) => r.Source?.SourceIdentifier).filter(Boolean) as string[]
    );

    for (const id of desiredIds) {
      expect(foundIds.has(id)).toBe(true);
    }
  });

  /* 21 */
  it("Security Hub hub is enabled and matches outputs.SecurityHubStatus", async () => {
    const statusOutput = outputs.SecurityHubStatus;
    expect(statusOutput).toBe("ENABLED"); // template default

    const resp = await retry(() => sh.send(new DescribeHubCommand({})));
    expect(resp.HubArn).toBeDefined();
    // if DescribeHub works, Security Hub is enabled
  });

  /* 22 */
  it("Security Hub CIS and AWS FSBP standards are enabled", async () => {
    const resp = await retry(() =>
      sh.send(new GetEnabledStandardsCommand({}))
    );
    const subs = resp.StandardsSubscriptions || [];
    expect(subs.length).toBeGreaterThanOrEqual(1);

    const arns = subs.map((s) => s.StandardsArn || "");
    const hasCis = arns.some((a) =>
      a.includes("cis-aws-foundations-benchmark/v/1.4.0")
    );
    const hasFsbp = arns.some((a) =>
      a.includes("aws-foundational-security-best-practices/v/1.0.0")
    );

    expect(hasCis).toBe(true);
    expect(hasFsbp).toBe(true);
  });

  /* 23 */
  it("GuardDuty detector from outputs is enabled with S3 logs", async () => {
    const detectorId = outputs.GuardDutyDetectorId;
    expect(detectorId).toBeDefined();

    const resp = await retry(() =>
      gd.send(new GetDetectorCommand({ DetectorId: detectorId }))
    );
    expect(resp.Status === "ENABLED" || resp.Enable === true).toBe(true);
    expect(resp.DataSources?.S3Logs?.Enable).toBe(true);
  });

  /* 24 */
  it("RDS instance exists, is encrypted, MultiAZ and not publicly accessible", async () => {
    const dbIdentifier = outputs.RdsArn; // value is Ref RdsInstance (identifier)
    expect(dbIdentifier).toBeDefined();

    const resp = await retry(() =>
      rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      )
    );
    const instances = resp.DBInstances || [];
    expect(instances.length).toBe(1);
    const db = instances[0];

    expect(db.Engine).toBe("postgres");
    expect(db.MultiAZ).toBe(true);
    expect(db.PubliclyAccessible).toBe(false);
    expect(db.StorageEncrypted).toBe(true);
    expect(db.DeletionProtection).toBe(true);
  });

  /* 25 */
  it("RDS parameter group enforces rds.force_ssl = '1'", async () => {
    const dbIdentifier = outputs.RdsArn;
    const resp = await retry(() =>
      rds.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      )
    );
    const db = resp.DBInstances![0];
    const paramGroupName = db.DBParameterGroups?.[0]?.DBParameterGroupName;
    expect(paramGroupName).toBeDefined();

    const paramsResp = await retry(() =>
      rds.send(
        new DescribeDBParametersCommand({
          DBParameterGroupName: paramGroupName,
        })
      )
    );

    const params = paramsResp.Parameters || [];
    const forceSsl = params.find((p) => p.ParameterName === "rds.force_ssl");
    expect(forceSsl).toBeDefined();
    expect(forceSsl!.ParameterValue).toBe("1");
  });

  /* 26 */
  it("RDS endpoint is reachable on TCP port 5432", async () => {
    const endpoint = outputs.RdsEndpointAddress;
    expect(endpoint).toBeDefined();

    const port = 5432;
    const connected = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      let done = false;

      const finalize = (ok: boolean) => {
        if (!done) {
          done = true;
          socket.destroy();
          resolve(ok);
        }
      };

      socket.setTimeout(8000);

      socket.on("connect", () => finalize(true));
      socket.on("timeout", () => finalize(false));
      socket.on("error", () => finalize(false));

      socket.connect(port, endpoint);
    });

    // For a properly reachable private RDS from where tests run (e.g., same VPC/VPN),
    // this should be true. If network is blocked, this will fail and highlight connectivity issues.
    expect(connected).toBe(true);
  });
});
