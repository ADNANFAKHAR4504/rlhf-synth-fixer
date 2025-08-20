import { CloudWatchClient, GetDashboardCommand } from "@aws-sdk/client-cloudwatch";
import { DescribeNetworkAclsCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { GetBucketEncryptionCommand, GetBucketLocationCommand, GetBucketTaggingCommand, GetBucketVersioningCommand, S3Client } from "@aws-sdk/client-s3";
import { DescribeSecretCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

// Helper to load deployment outputs
function loadOutputs(): any {
  const paths = [
    path.join(__dirname, "../cfn-outputs.json"),
    path.join(__dirname, "../cfn-outputs/flat-outputs.json"),
    path.join(__dirname, "../lib/flat-outputs.json"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf8");
      if (raw.trim() !== "") return JSON.parse(raw);
    }
  }
  throw new Error("Deployment outputs not found");
}

describe("Terraform E2E Integration Tests", () => {

  let outputs: any;
  let bucketName: string;
  let bucketTags: any;
  let environment: string;

  beforeAll(() => {
    outputs = loadOutputs();
    bucketName = outputs.bucket_name?.value || outputs.bucket_name;
    bucketTags = typeof outputs.bucket_tags?.value === "object" ? outputs.bucket_tags.value : JSON.parse(outputs.bucket_tags?.value || "{}");
    environment = bucketTags.Environment || "prod";
  });


  describe("S3 Bucket", () => {
    const s3 = new S3Client({ region: "us-west-2" });

    test("bucket exists in expected region", async () => {
      const loc = await s3.send(new GetBucketLocationCommand({ Bucket: bucketName }));
      expect(["us-west-2", "US"]).toContain(loc.LocationConstraint ?? "US");
    });

    test("bucket has versioning enabled", async () => {
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(ver.Status).toBe("Enabled");
    });

    test("bucket is encrypted with AES256", async () => {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256")).toBe(true);
    });

    test("bucket tags include environment, managedBy, project", async () => {
      const tagRes = await s3.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
      const tags = Object.fromEntries((tagRes.TagSet ?? []).map(t => [t.Key, t.Value]));
      expect(tags.Environment).toBe(environment);
      expect(tags.ManagedBy).toBe("terraform");
      expect(tags.Project).toBe("ExampleProject");
    });
  });


  describe("Secrets Manager", () => {
    const secrets = new SecretsManagerClient({ region: "us-west-2" });
    test("RDS secret exists", async () => {
      const secretName = `secure-rds-password-${environment}`;
      const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
      expect(res.Name).toBe(secretName);
      expect(res.Description).toMatch(/RDS instance password/);
    });
  });


  describe("VPC", () => {
    const ec2 = new EC2Client({ region: "us-west-2" });
    test("VPC exists", async () => {
      const vpcs = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: "tag:Name", Values: ["secure-prod-vpc"] }] }));
      expect(vpcs.Vpcs?.length).toBeGreaterThan(0);
      const vpc = vpcs.Vpcs && vpcs.Vpcs[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);
    });
  });


  describe("Network ACL", () => {
    const ec2 = new EC2Client({ region: "us-west-2" });
    test("NACL exists and has correct rules", async () => {
      const nacls = await ec2.send(new DescribeNetworkAclsCommand({}));
      // Find by tag or VPC ID
      const prodNacl = nacls.NetworkAcls?.find(nacl =>
        nacl.Tags?.some(t => t.Key === "Environment" && t.Value === environment)
      );
      expect(prodNacl).toBeTruthy();
      const ingressRules = prodNacl?.Entries?.filter(e => e.Egress === false) || [];
      expect(ingressRules.some(e => e.RuleAction === "allow" && e.Protocol === "6" && e.PortRange?.From === 443)).toBe(true);
      expect(ingressRules.some(e => e.RuleAction === "allow" && e.Protocol === "6" && e.PortRange?.From === 22)).toBe(true);
      expect(ingressRules.some(e => e.RuleAction === "deny")).toBe(true);
    });
  });


  describe("IAM Role and Policies", () => {
    const iam = new IAMClient({ region: "us-west-2" });
    test("EC2 role exists, policies attached", async () => {
      const roleName = `secure-ec2-role-${environment}`;
      const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(roleRes.Role).toBeDefined();
      expect(roleRes.Role?.RoleName).toBe(roleName);
      expect(roleRes.Role?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);

      const policies = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
      const policyNames = policies.AttachedPolicies?.map(p => p.PolicyName);
      expect(policyNames).toEqual(
        expect.arrayContaining([
          `secure-cloudwatch-logs-policy-${environment}`,
          `secure-s3-access-policy-${environment}`
        ])
      );
    });
  });


  describe("CloudWatch Dashboard", () => {
    const cw = new CloudWatchClient({ region: "us-west-2" });
    test("dashboard exists", async () => {
      const dashboardName = `secure-dashboard-${environment}`;
      const res = await cw.send(new GetDashboardCommand({ DashboardName: dashboardName }));
      expect(res.DashboardName).toBe(dashboardName);
      expect(res.DashboardBody).toBeDefined();
      expect(JSON.parse(res.DashboardBody!).widgets.length).toBeGreaterThan(0);
    });
  });
});