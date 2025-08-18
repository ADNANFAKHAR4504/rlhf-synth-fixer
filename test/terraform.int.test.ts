/**
 * LIVE integration tests for main_repo/lib/tap_stack.tf
 *
 * - Reads cfn-outputs/flat-outputs.json (CI) or lib/flat-outputs.json (local)
 * - Verifies KMS keys, aliases, CloudWatch log groups, and IAM roles via AWS SDK v3
 *
 * Prereqs:
 *   - AWS creds with read access to KMS, CloudWatch Logs, and IAM
 *   - Node 18+ recommended
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  LogGroup,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
  ListAliasesCommandOutput,
} from "@aws-sdk/client-kms";
import fs from "fs";
import path from "path";

jest.setTimeout(300_000);

// ---------- Load outputs (CI first, local fallback) ----------
let outputs: any | undefined;
const outputsPath = path.join(__dirname, "../cfn-outputs/flat-outputs.json");
const fallbackPath = path.join(__dirname, "../lib/flat-outputs.json");

try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  } else if (fs.existsSync(fallbackPath)) {
    outputs = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  }
} catch (_e) {
  // leave outputs undefined; tests will be skipped below
}

if (!outputs) {
  // Visible log in CI, but do not fail early (deployment step may not have run)
  // eslint-disable-next-line no-console
  console.warn("No deployment outputs found - integration tests will be skipped");
}

// ---------- Helpers ----------
const arnRegion = (arn: string): string | undefined => {
  const parts = arn.split(":"); // arn:partition:service:region:account:resource...
  return parts.length > 3 ? parts[3] : undefined;
};

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Infer regions from KMS Key ARNs (best signal of where we deployed)
const kmsKeyArnsRec: Record<string, string> | string[] | undefined =
  outputs?.kms_key_arns || outputs?.KmsKeyArns || outputs?.kmsKeys || undefined;

const kmsArnList: string[] = Array.isArray(kmsKeyArnsRec)
  ? kmsKeyArnsRec
  : kmsKeyArnsRec && typeof kmsKeyArnsRec === "object"
  ? Object.values(kmsKeyArnsRec)
  : [];

const targetRegions = unique(
  kmsArnList
    .map((arn) => arnRegion(arn))
    .filter((r): r is string => Boolean(r))
);

const regions = targetRegions.length ? targetRegions : ["us-east-1", "us-west-2"];

// Log group names (arrays)
const appLogGroups: string[] =
  outputs?.application_log_group_names ||
  outputs?.ApplicationLogGroupNames ||
  [];
const auditLogGroups: string[] =
  outputs?.audit_log_group_names || outputs?.AuditLogGroupNames || [];

// Role ARN maps (env -> arn)
const appRoleArns: Record<string, string> =
  outputs?.application_role_arns || outputs?.ApplicationRoleArns || {};
const auditRoleArns: Record<string, string> =
  outputs?.audit_role_arns || outputs?.AuditRoleArns || {};
const readonlyRoleArns: Record<string, string> =
  outputs?.readonly_role_arns || outputs?.ReadonlyRoleArns || {};

// Service clients
const kms = (region: string) => new KMSClient({ region }); // KMS v3
const logs = (region: string) => new CloudWatchLogsClient({ region }); // CWL v3
const iam = () => new IAMClient({ region: "us-east-1" }); // IAM is global

// ---------- Conditional suite ----------
const maybe = outputs ? describe : describe.skip;

maybe("LIVE: Terraform stack validation via AWS APIs", () => {
  test("sanity: outputs include at least one KMS key ARN", () => {
    expect(kmsArnList.length).toBeGreaterThan(0);
  });

  test("KMS keys exist and are Enabled", async () => {
    for (const arn of kmsArnList) {
      const region = arnRegion(arn)!;
      const client = kms(region);
      const res = await client.send(
        new DescribeKeyCommand({ KeyId: arn }) // v3 DescribeKey
      );
      expect(res.KeyMetadata?.Arn).toBe(arn);
      expect(res.KeyMetadata?.KeyState).toBe("Enabled"); // Enabled state
    }
  });

  test("KMS aliases exist for each key (have 'alias/' prefix)", async () => {
    interface AliasEntry {
      AliasName?: string;
    }

    for (const arn of kmsArnList) {
      const region = arnRegion(arn)!;
      const client = kms(region);

      let nextToken: string | undefined = undefined;
      const aliases: string[] = [];

      do {
        const aliasesResponse: ListAliasesCommandOutput = await client.send(
          new ListAliasesCommand({ KeyId: arn, Marker: nextToken })
        );
        (aliasesResponse.Aliases || []).forEach((a: AliasEntry) => {
          if (a.AliasName) aliases.push(a.AliasName);
        });
        nextToken = aliasesResponse.NextMarker;
      } while (nextToken);

      expect(aliases.length).toBeGreaterThan(0);
      expect(aliases.every((n) => n.startsWith("alias/"))).toBe(true);
      await sleep(100);
    }
  });

  test("CloudWatch application log groups exist with retention and KMS encryption", async () => {
    if (!appLogGroups.length) return;

    for (const region of regions) {
      const client = logs(region);
      for (const lgName of appLogGroups) {
        const out = await client.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: lgName,
            limit: 1,
          })
        );
        const found: LogGroup | undefined = (out.logGroups || []).find(
          (g) => g.logGroupName === lgName
        );
        expect(found).toBeTruthy();
        expect(found?.retentionInDays).toBeGreaterThan(0); // unit tests assert exact env-specific values
        expect(found?.kmsKeyId).toBeTruthy(); // CloudWatch Logs exposes kmsKeyId (no kmsKeyArn)
      }
    }
  });

  test("CloudWatch audit log groups exist with retention and KMS encryption", async () => {
    if (!auditLogGroups.length) return;

    for (const region of regions) {
      const client = logs(region);
      for (const lgName of auditLogGroups) {
        const out = await client.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: lgName,
            limit: 1,
          })
        );
        const found: LogGroup | undefined = (out.logGroups || []).find(
          (g) => g.logGroupName === lgName
        );
        expect(found).toBeTruthy();
        expect(found?.retentionInDays).toBeGreaterThan(0);
        expect(found?.kmsKeyId).toBeTruthy();
      }
    }
  });

  test("IAM application roles exist and have managed policies attached", async () => {
    const client = iam();

    for (const [env, arnVal] of Object.entries(appRoleArns)) {
      const arn = arnVal as string;
      const name = arn.split("/").pop()!;
      const role = await client.send(new GetRoleCommand({ RoleName: name }));
      expect(role.Role?.Arn).toBe(arn);

      const attached = await client.send(
        new ListAttachedRolePoliciesCommand({ RoleName: name })
      );
      expect((attached.AttachedPolicies || []).length).toBeGreaterThan(0);
    }
  });

  test("IAM audit roles exist and have managed policies attached", async () => {
    const client = iam();

    for (const [env, arnVal] of Object.entries(auditRoleArns)) {
      const arn = arnVal as string;
      const name = arn.split("/").pop()!;
      const role = await client.send(new GetRoleCommand({ RoleName: name }));
      expect(role.Role?.Arn).toBe(arn);

      const attached = await client.send(
        new ListAttachedRolePoliciesCommand({ RoleName: name })
      );
      expect((attached.AttachedPolicies || []).length).toBeGreaterThan(0);
    }
  });

  test("IAM readonly roles exist and have managed policies attached", async () => {
    const client = iam();

    for (const [env, arnVal] of Object.entries(readonlyRoleArns)) {
      const arn = arnVal as string;
      const name = arn.split("/").pop()!;
      const role = await client.send(new GetRoleCommand({ RoleName: name }));
      expect(role.Role?.Arn).toBe(arn);

      const attached = await client.send(
        new ListAttachedRolePoliciesCommand({ RoleName: name })
      );
      expect((attached.AttachedPolicies || []).length).toBeGreaterThan(0);
    }
  });
});
