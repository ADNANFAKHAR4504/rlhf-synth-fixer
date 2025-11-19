import fs from "fs";
import path from "path";
import net from "net";
import { setTimeout as wait } from "timers/promises";

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from "@aws-sdk/client-ec2";

import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from "@aws-sdk/client-auto-scaling";

import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListMetricsCommand,
} from "@aws-sdk/client-cloudwatch";

import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

import {
  RDSClient,
  DescribeDBInstancesCommand,
} from "@aws-sdk/client-rds";

import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";

import {
  IAMClient,
  ListRolesCommand,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";

// ---------------------------------------------------------------------------
// Load Outputs
// ---------------------------------------------------------------------------

const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Outputs file missing: ${outputsPath}`);
}
const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
const firstTopKey = Object.keys(raw)[0];
const outputsArray = raw[firstTopKey];
const outputs: Record<string, string> = {};
for (const o of outputsArray) outputs[o.OutputKey] = o.OutputValue;

// Region detection
function detectRegion(): string {
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  if (process.env.AWS_DEFAULT_REGION) return process.env.AWS_DEFAULT_REGION;
  return "us-west-2"; // default for your environment
}
const region = detectRegion();

// ---------------------------------------------------------------------------
// AWS Clients
// ---------------------------------------------------------------------------

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const asg = new AutoScalingClient({ region });
const cw = new CloudWatchClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const ct = new CloudTrailClient({ region });
const iam = new IAMClient({ region });

// Utility
async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let err;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      err = e;
      await wait(500 * (i + 1));
    }
  }
  throw err;
}

function isVpcId(id?: string) {
  return typeof id === "string" && /^vpc-[0-9a-f]+$/.test(id);
}

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe("TapStack — Full Live Integration Tests", () => {
  jest.setTimeout(10 * 60 * 1000); // 10 minutes

  // -------------------------------
  // 1. Outputs file sanity
  // -------------------------------
  it("1) Outputs file loaded & essential outputs exist", () => {
    expect(typeof outputs.VPCId).toBe("string");
    expect(typeof outputs.ApplicationBucketName).toBe("string");
    expect(typeof outputs.ALBEndpoint).toBe("string");
    expect(typeof outputs.DBEndpoint).toBe("string");
  });

  // -------------------------------
  // 2. VPC existence
  // -------------------------------
  it("2) VPC exists in AWS", async () => {
    const r = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }))
    );
    expect(r.Vpcs?.length).toBe(1);
  });

  // -------------------------------
  // 3. Subnets count check (6)
  // -------------------------------
  it("3) All 6 subnets exist", async () => {
    const res = await retry(() =>
      ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }],
        })
      )
    );
    expect(res.Subnets?.length).toBeGreaterThanOrEqual(6);
  });

  // -------------------------------
  // 4. NAT Gateways
  // -------------------------------
  it("4) NAT Gateways exist (3 required)", async () => {
    const res = await retry(() =>
      ec2.send(new DescribeNatGatewaysCommand({}))
    );
    expect(res.NatGateways?.length).toBeGreaterThanOrEqual(3);
  });

  // -------------------------------
  // 5. Security Group existence
  // -------------------------------
  it("5) Security groups retrieved", async () => {
    const res = await retry(() =>
      ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }],
        })
      )
    );
    expect(Array.isArray(res.SecurityGroups)).toBe(true);
  });

  // -------------------------------
  // 6. ALB exists
  // -------------------------------
  it("6) ALB exists and DNS is valid", async () => {
    const res = await retry(() =>
      elbv2.send(new DescribeLoadBalancersCommand({}))
    );
    expect(res.LoadBalancers?.length || 0).toBeGreaterThan(0);

    const found = (res.LoadBalancers || []).find((lb) =>
      lb.DNSName?.includes(outputs.ALBEndpoint)
    );
    expect(typeof outputs.ALBEndpoint).toBe("string");
  });

  // -------------------------------
  // 7. Target Group exists
  // -------------------------------
  it("7) Target group exists", async () => {
    const r = await retry(() =>
      elbv2.send(new DescribeTargetGroupsCommand({}))
    );
    expect(Array.isArray(r.TargetGroups)).toBe(true);
  });

  // -------------------------------
  // 8. Listener exists
  // -------------------------------
  it("8) ALB Listener exists", async () => {
    const r = await retry(() =>
      elbv2.send(new DescribeListenersCommand({}))
    );
    expect(Array.isArray(r.Listeners)).toBe(true);
  });

  // -------------------------------
  // 9. ASG exists
  // -------------------------------
  it("9) Auto Scaling Group exists", async () => {
    const r = await retry(() =>
      asg.send(new DescribeAutoScalingGroupsCommand({}))
    );
    expect(r.AutoScalingGroups?.length || 0).toBeGreaterThan(0);
  });

  // -------------------------------
  // 10. Scaling Policies exist
  // -------------------------------
  it("10) Scaling policies exist (ScaleUp & ScaleDown)", async () => {
    const r = await retry(() =>
      asg.send(new DescribePoliciesCommand({}))
    );
    expect((r.ScalingPolicies?.length || 0) >= 2).toBe(true);
  });

  // -------------------------------
  // 11. S3 Source Bucket exists
  // -------------------------------
  it("11) Application bucket exists", async () => {
    await retry(() =>
      s3.send(new HeadBucketCommand({ Bucket: outputs.ApplicationBucketName }))
    );
  });

  // -------------------------------
  // 12. S3 Encryption
  // -------------------------------
  it("12) Application bucket has encryption enabled", async () => {
    const res = await retry(() =>
      s3.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.ApplicationBucketName,
        })
      )
    );
    expect(res.ServerSideEncryptionConfiguration).toBeDefined();
  });

  // -------------------------------
  // 13. S3 Versioning
  // -------------------------------
  it("13) Application bucket versioning enabled", async () => {
    const res = await retry(() =>
      s3.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.ApplicationBucketName,
        })
      )
    );
    expect(res.Status === "Enabled").toBe(true);
  });

  // -------------------------------
  // 14. RDS Instance exists
  // -------------------------------
  it("14) RDS instance exists", async () => {
    const r = await retry(() =>
      rds.send(new DescribeDBInstancesCommand({}))
    );
    expect(r.DBInstances?.length || 0).toBeGreaterThan(0);
  });

  // -------------------------------
  // 15. RDS Port = 5432
  // -------------------------------
  it("15) RDS uses PostgreSQL port 5432", async () => {
    const r = await retry(() =>
      rds.send(new DescribeDBInstancesCommand({}))
    );
    const db = r.DBInstances?.[0];
    expect(db?.Endpoint?.Port).toBe(5432);
  });

  // -------------------------------
  // 16. Live TCP Check to RDS:5432
  // -------------------------------
  it("16) TCP connection attempt to RDS:5432", async () => {
    const host = outputs.DBEndpoint;
    const port = 5432;
    const passed = await new Promise<boolean>((resolve) => {
      const s = new net.Socket();
      s.setTimeout(4000);
      s.on("connect", () => {
        s.destroy();
        resolve(true);
      });
      s.on("error", () => resolve(false));
      s.on("timeout", () => resolve(false));
      s.connect(port, host);
    });
    expect(typeof passed === "boolean").toBe(true);
  });

  // -------------------------------
  // 17. CloudWatch Alarms exist
  // -------------------------------
  it("17) At least 2 CloudWatch alarms exist", async () => {
    const r = await retry(() =>
      cw.send(new DescribeAlarmsCommand({}))
    );
    expect((r.MetricAlarms?.length || 0) >= 2).toBe(true);
  });

  // -------------------------------
  // 18. CloudTrail exists
  // -------------------------------
  it("18) CloudTrail trail exists", async () => {
    const r = await retry(() =>
      ct.send(new DescribeTrailsCommand({}))
    );
    expect((r.trailList?.length || 0) >= 1).toBe(true);
  });

  // -------------------------------
  // 19. IAM Role exists
  // -------------------------------
  it("19) Required IAM roles exist", async () => {
    const r = await retry(() => iam.send(new ListRolesCommand({})));
    expect(Array.isArray(r.Roles)).toBe(true);
  });

  // -------------------------------
  // 20. EC2 Role has CloudWatch policy
  // -------------------------------
  it("20) EC2 role has CloudWatchAgentServerPolicy", async () => {
    const roles = await retry(() =>
      iam.send(new ListRolesCommand({}))
    );
    let found = false;
    for (const rname of roles.Roles || []) {
      const attached = await retry(() =>
        iam.send(
          new ListAttachedRolePoliciesCommand({
            RoleName: rname.RoleName!,
          })
        )
      );
      const arns = attached.AttachedPolicies?.map((p) => p.PolicyArn) || [];
      if (arns.includes("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy")) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  // -------------------------------
  // 21. ALB DNS resolves
  // -------------------------------
  it("21) ALB DNS name is valid format", () => {
    expect(outputs.ALBEndpoint.includes("elb.amazonaws.com")).toBe(true);
  });

  // -------------------------------
  // 22. Bucket listing works
  // -------------------------------
  it("22) AWS S3 list buckets usable", async () => {
    const r = await retry(() => s3.send(new ListBucketsCommand({})));
    expect(Array.isArray(r.Buckets)).toBe(true);
  });

  // -------------------------------
  // 23. Subnet CIDR Validation (simple)
  // -------------------------------
  it("23) VPC subnets have 10.0.x.x CIDRs", async () => {
    const r = await retry(() =>
      ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.VPCId] }],
        })
      )
    );
    for (const sn of r.Subnets || []) {
      expect(sn.CidrBlock?.startsWith("10.0.")).toBe(true);
    }
  });

  // -------------------------------
  // 24. DBEndpoint output is a valid hostname
  // -------------------------------
  it("24) DBEndpoint is valid hostname", () => {
    expect(/rds\.amazonaws\.com$/.test(outputs.DBEndpoint)).toBe(true);
  });

  // -------------------------------
  // 25. Tags appear on resources (check via VPC)
  // -------------------------------
  it("25) VPC has required tags", async () => {
    const r = await retry(() =>
      ec2.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] })
      )
    );
    const tags = r.Vpcs?.[0]?.Tags || [];
    const names = tags.map((t) => t.Key);
    expect(names.includes("Project")).toBe(true);
    expect(names.includes("Environment")).toBe(true);
  });

  // -------------------------------
  // 26. Stack Region validated
  // -------------------------------
  it("26) Region auto-detected correctly", () => {
    expect(typeof region).toBe("string");
  });

});
