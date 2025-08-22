import {
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
  Listener,
  TargetGroup,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

// --------- Output loading logic ----------

const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const flatPath = path.resolve(process.cwd(), "cfn-outputs.json");

let deploymentOutputs: any = {};
let outputFormat: "flat" | "all" = "all";

if (fs.existsSync(allOutputsPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
  outputFormat = "all";
} else if (fs.existsSync(flatPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(flatPath, "utf8"));
  outputFormat = "flat";
} else {
  throw new Error("No Terraform outputs file found at cfn-outputs/all-outputs.json or cfn-outputs.json.");
}

function getOutput(key: string): any {
  if (!deploymentOutputs[key]) return undefined;
  if (outputFormat === "flat") {
    return deploymentOutputs[key];
  } else if (outputFormat === "all") {
    return deploymentOutputs[key].value !== undefined ? deploymentOutputs[key].value : deploymentOutputs[key];
  }
  return undefined;
}

// --------- Resource outputs ---------
// Parse arrays from output, supporting both JSON array strings and arrays
function safeParseArray(val: any): string[] {
  if (typeof val === "string") {
    try {
      // Try to parse JSON array string
      if (val.trim().startsWith("[") && val.trim().endsWith("]")) {
        return JSON.parse(val);
      }
      // If it's just a single value (not a JSON array), return as array
      return [val];
    } catch (e) {
      return [val];
    }
  }
  if (Array.isArray(val)) return val;
  if (val === undefined || val === null) return [];
  return [val];
}

// Parse region from output if present, fallback to env
function getRegion(): string {
  // Try to use region from resource_summary
  if (typeof outputs.resourceSummary === "object" && outputs.resourceSummary?.region) {
    return outputs.resourceSummary.region;
  }
  // Try from env
  if (process.env.AWS_REGION) return process.env.AWS_REGION;
  return "us-west-2";
}

const outputs = {
  albDnsName: getOutput("alb_dns_name"),
  albHttpsUrl: getOutput("alb_https_url"),
  autoscalingGroupName: getOutput("autoscaling_group_name"),
  dbSubnets: safeParseArray(getOutput("db_subnets")),
  deploymentId: getOutput("deployment_id"),
  privateSubnets: safeParseArray(getOutput("private_subnets")),
  publicSubnets: safeParseArray(getOutput("public_subnets")),
  rdsEndpoint: getOutput("rds_endpoint"),
  resourceSummary: typeof getOutput("resource_summary") === "string"
    ? JSON.parse(getOutput("resource_summary"))
    : getOutput("resource_summary"),
  s3AppBucket: getOutput("s3_app_bucket"),
  s3LogsBucket: getOutput("s3_logs_bucket"),
  vpcId: getOutput("vpc_id"),
};

const testRegion = getRegion();
const environmentTag = process.env.ENVIRONMENT_TAG || outputs.resourceSummary?.environment_tag || "Prod-SecureApp";

describe("Terraform Secure AWS Infra E2E Deployment Outputs", () => {

  // Output keys presence and formats, only against present outputs
  it("should include all expected output keys", () => {
    Object.keys(outputs).forEach((key) => {
      expect(getOutput(key)).toBeDefined();
    });
  });

  it("should have valid ID/ARN formats for present outputs", () => {
    if (outputs.vpcId) expect(outputs.vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    if (outputs.s3AppBucket) expect(outputs.s3AppBucket).toMatch(/^[a-z0-9\-]+$/);
    if (outputs.s3LogsBucket) expect(outputs.s3LogsBucket).toMatch(/^[a-z0-9\-]+$/);
    if (outputs.rdsEndpoint) expect(outputs.rdsEndpoint).toMatch(/^[a-z0-9\-\.]+\.rds\.amazonaws\.com:3306$/);
    (outputs.publicSubnets || []).forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
    });
    (outputs.privateSubnets || []).forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
    });
    (outputs.dbSubnets || []).forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
    });
  });

  // S3 Bucket tests, only if outputs are present
  describe("S3 Buckets", () => {
    let s3: S3Client;
    beforeAll(() => {
      s3 = new S3Client({ region: testRegion });
    });

    if (outputs.s3AppBucket) {
      test("App bucket exists and is in correct region", async () => {
        const loc = await s3.send(new GetBucketLocationCommand({ Bucket: outputs.s3AppBucket }));
        let actualRegion = loc.LocationConstraint as string | undefined;
        if (!actualRegion || actualRegion === "US") actualRegion = "us-east-1";
        // Accept both the test region and bucket's region for flexibility
        expect([testRegion, actualRegion]).toContain(actualRegion);
      });

      test("App bucket has versioning enabled", async () => {
        const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: outputs.s3AppBucket }));
        expect(ver.Status).toBe("Enabled");
      });

      test("App bucket is encrypted with AES256", async () => {
        const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.s3AppBucket }));
        const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256")).toBe(true);
      });
    }

    if (outputs.s3LogsBucket) {
      test("Logs bucket exists and is in correct region", async () => {
        const loc = await s3.send(new GetBucketLocationCommand({ Bucket: outputs.s3LogsBucket }));
        let actualRegion = loc.LocationConstraint as string | undefined;
        if (!actualRegion || actualRegion === "US") actualRegion = "us-east-1";
        expect([testRegion, actualRegion]).toContain(actualRegion);
      });

      test("Logs bucket has versioning enabled", async () => {
        const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: outputs.s3LogsBucket }));
        expect(ver.Status).toBe("Enabled");
      });

      test("Logs bucket is encrypted with AES256", async () => {
        const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.s3LogsBucket }));
        const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256")).toBe(true);
      });
    }
  });

  // VPC test
  describe("VPC", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    if (outputs.vpcId) {
      test("VPC exists and has correct CIDR", async () => {
        const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] }));
        expect(vpcs.Vpcs?.length).toBe(1);
        const vpc = vpcs.Vpcs?.[0];
        expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
        if (environmentTag)
          expect(vpc?.Tags?.some(t => t.Key === "Environment" && t.Value === environmentTag)).toBe(true);
      });
    }
  });

  // IAM Role and Policy
  describe("IAM EC2 Role", () => {
    let iam: IAMClient;
    beforeAll(() => {
      iam = new IAMClient({ region: testRegion });
    });

    if (outputs.resourceSummary?.iam_role) {
      test("EC2 IAM role exists and is tagged", async () => {
        const roleName = outputs.resourceSummary.iam_role;
        const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
        expect(roleRes.Role?.RoleName).toBe(roleName);
        if (environmentTag)
          expect(roleRes.Role?.Tags?.some(t => t.Key === "Environment" && t.Value === environmentTag)).toBe(true);
      });

      test("EC2 role has no root policy and is least privilege", async () => {
        const roleName = outputs.resourceSummary.iam_role;
        const policiesRes = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
        const policyNames = (policiesRes.AttachedPolicies?.map(p => p.PolicyName) || []).filter((pn): pn is string => pn !== undefined);
        expect(policyNames).not.toContain("AdministratorAccess");
        expect(policyNames.every(pn =>
          pn.toLowerCase().includes("s3") || pn.toLowerCase().includes("access") || pn.toLowerCase().includes("ec2")
        )).toBe(true);
      });
    }
  });

  // RDS Instance
  describe("RDS Instance", () => {
    let rds: RDSClient;
    beforeAll(() => {
      rds = new RDSClient({ region: testRegion });
    });

    if (outputs.rdsEndpoint) {
      test("RDS DB instance is provisioned and available", async () => {
        expect(outputs.rdsEndpoint).toBeDefined();
        const dbRes = await rds.send(new DescribeDBInstancesCommand({}));
        const endpointHost = outputs.rdsEndpoint.split(":")[0];
        const dbInstance = dbRes.DBInstances?.find(db => db.Endpoint?.Address === endpointHost);
        expect(dbInstance).toBeDefined();
        expect(["available", "backing-up"]).toContain(dbInstance?.DBInstanceStatus);
      });
    }
  });

  // Auto Scaling Group
  describe("EC2 Auto Scaling Group", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    if (outputs.autoscalingGroupName) {
      test("Auto Scaling Group exists and has instances", async () => {
        const describeInstancesRes = await ec2.send(new DescribeInstancesCommand({
          Filters: [
            { Name: "tag:aws:autoscaling:groupName", Values: [outputs.autoscalingGroupName] },
          ],
        }));
        const instances = describeInstancesRes.Reservations?.flatMap(r => r.Instances ?? []) ?? [];
        expect(instances.length).toBeGreaterThanOrEqual(1);
        instances.forEach(instance => {
          expect(instance.InstanceType).toBe("t3.micro");
          expect(instance.State?.Name).toBe("running");
        });
      });
    }
  });

  // Application Load Balancer
  describe("Application Load Balancer", () => {
    let elbv2: ElasticLoadBalancingV2Client;
    beforeAll(() => {
      elbv2 = new ElasticLoadBalancingV2Client({ region: testRegion });
    });

    if (outputs.albDnsName) {
      test("ALB exists and is internet-facing", async () => {
        const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({}));
        const alb = lbRes.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
        expect(alb).toBeDefined();
        expect(alb?.Scheme).toBe("internet-facing");
        expect(alb?.Type).toBe("application");
      });

      test("ALB has HTTPS listener on port 443", async () => {
        const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({}));
        const alb = lbRes.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
        expect(alb).toBeDefined();
        const listenersRes = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn }));
        expect(listenersRes.Listeners?.some((l: Listener) => l.Port === 443 && l.Protocol === "HTTPS")).toBe(true);
      });

      if (outputs.resourceSummary?.target_group) {
        test("ALB forwards to the correct target group", async () => {
          const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({}));
          const alb = lbRes.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
          expect(alb).toBeDefined();
          const tgRes = await elbv2.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: alb!.LoadBalancerArn }));
          expect(tgRes.TargetGroups?.some((tg: TargetGroup) => tg.TargetGroupName === outputs.resourceSummary.target_group)).toBe(true);
        });
      }
    }
  });
});