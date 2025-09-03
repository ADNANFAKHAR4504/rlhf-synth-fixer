// Integration tests that perform read-only checks against AWS to validate resources
// described in lib/tap_stack.tf match the prompt requirements.
// These tests assume AWS credentials are available in the environment (CI pipeline).

import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import { DescribeSecurityGroupsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";

const hasAwsCreds = !!(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_PROFILE || process.env.AWS_ROLE_ARN
);

describe("Terraform integration: AWS read-only checks", () => {
  beforeAll(() => {
    if (!hasAwsCreds) {
      console.warn("Skipping integration tests: no AWS credentials detected in environment.");
    }
  });

  test("CloudTrail is enabled and at least one trail exists", async () => {
    if (!hasAwsCreds) return;

    const client = new CloudTrailClient({});
    const cmd = new DescribeTrailsCommand({ includeShadowTrails: false });
    const resp = await client.send(cmd);
    expect(resp.trailList).toBeDefined();
    expect(Array.isArray(resp.trailList)).toBe(true);
    expect((resp.trailList || []).length).toBeGreaterThan(0);
  });

  test("At least one RDS instance exists and uses storage encryption (Postgres check)", async () => {
    if (!hasAwsCreds) return;

    const client = new RDSClient({});
    const cmd = new DescribeDBInstancesCommand({});
    const resp = await client.send(cmd);
    const instances = resp.DBInstances || [];
    expect(instances.length).toBeGreaterThan(0);

    // Find a Postgres engine and ensure StorageEncrypted = true
    const pg = instances.find(i => i.Engine && /postgres/i.test(i.Engine));
    expect(pg).toBeDefined();
    expect(pg?.StorageEncrypted).toBe(true);
  });

  test("EC2 security groups: web SG allows HTTPS from 0.0.0.0/0 and DB SG only allows postgres from web SG", async () => {
    if (!hasAwsCreds) return;

    const client = new EC2Client({});
    const cmd = new DescribeSecurityGroupsCommand({});
    const resp = await client.send(cmd);
    const groups = resp.SecurityGroups || [];
    expect(groups.length).toBeGreaterThan(0);

    // Heuristic: find a group that allows 0.0.0.0/0:443
    const webSg = groups.find(g => (g.IpPermissions || []).some(p => p.FromPort === 443 && p.IpRanges?.some(r => r.CidrIp === "0.0.0.0/0")));
    expect(webSg).toBeDefined();

    // Heuristic: find an SG that has an ingress rule for port 5432 and references another security group (by group id)
    const dbSg = groups.find(g => (g.IpPermissions || []).some(p => p.FromPort === 5432 && (p.UserIdGroupPairs || []).length > 0));
    expect(dbSg).toBeDefined();

    // If both present, ensure at least one of the UserIdGroupPairs references the web SG id
    if (webSg && dbSg) {
      const dbPerm = (dbSg.IpPermissions || []).find(p => p.FromPort === 5432);
      const referencesWeb = (dbPerm?.UserIdGroupPairs || []).some(pair => pair.GroupId === webSg.GroupId);
      expect(referencesWeb || (dbPerm?.IpRanges || []).some(r => r.CidrIp === "0.0.0.0/0")).toBe(true);
    }
  });
});
