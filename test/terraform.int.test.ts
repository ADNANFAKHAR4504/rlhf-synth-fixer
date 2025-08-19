/**
 * LIVE integration tests for lib/tap_stack.tf
 * - Explicit TypeScript types to avoid TS7022/TS7006
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
  ListAliasesCommandOutput,
} from "@aws-sdk/client-kms";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandOutput,
  LogGroup,
} from "@aws-sdk/client-cloudwatch-logs";

const discoverOutputsPath = (): string | undefined => {
  const candidates = [
    join(process.cwd(), "cfn-outputs", "flat-outputs.json"),
    join(process.cwd(), "lib", "flat-outputs.json"),
    join(process.cwd(), "flat-outputs.json"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined;
};

let outputs: Record<string, any> | undefined;
const path = discoverOutputsPath();
if (path && existsSync(path)) {
  try {
    outputs = JSON.parse(readFileSync(path, "utf8"));
    // eslint-disable-next-line no-console
    console.log(`Loaded deployment outputs from: ${path}`);
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`Failed to parse outputs JSON at ${path}`);
  }
} else {
  // eslint-disable-next-line no-console
  console.warn("No deployment outputs found - integration tests will be skipped");
}

const arnRegion = (arn: string): string | undefined => {
  const parts = arn.split(":"); // arn:partition:service:region:account:resource
  return parts.length > 3 ? parts[3] : undefined;
};

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Regions from KMS key ARNs */
const kmsKeyArnsRec: Record<string, string> | undefined =
  outputs?.kms_logs_use1_arn_by_key || outputs?.kms_logs_usw2_arn_by_key
    ? {
        ...(outputs?.kms_logs_use1_arn_by_key || {}),
        ...(outputs?.kms_logs_usw2_arn_by_key || {}),
      }
    : undefined;

const regions: string[] = kmsKeyArnsRec
  ? unique(
      Object.values(kmsKeyArnsRec)
        .map((v) => String(v))
        .map((arn) => arnRegion(arn))
        .filter((r): r is string => Boolean(r))
    )
  : [];

const kmsClients: Record<string, KMSClient> = Object.fromEntries(
  regions.map((r) => [r, new KMSClient({ region: r })])
);
const logsClients: Record<string, CloudWatchLogsClient> = Object.fromEntries(
  regions.map((r) => [r, new CloudWatchLogsClient({ region: r })])
);

/** Page DescribeLogGroups until exact name match */
const findLogGroup = async (
  client: CloudWatchLogsClient,
  name: string
): Promise<LogGroup | undefined> => {
  let nextToken: string | undefined = undefined;
  for (let i = 0; i < 20; i++) {
    const page: DescribeLogGroupsCommandOutput = await client.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: name,
        nextToken,
      })
    );
    const found = (page.logGroups || []).find(
      (g: LogGroup) => g.logGroupName === name
    );
    if (found) return found;
    if (!page.nextToken) break;
    nextToken = page.nextToken;
    await sleep(250);
  }
  return undefined;
};

/** ------------------------------------------------------------------
 * Tests
 * ------------------------------------------------------------------ */

const hasOutputs = !!outputs;
(hasOutputs ? describe : describe.skip)("tap_stack live checks (new for_each outputs)", () => {
  test("KMS keys exist and match DescribeKey", async () => {
    const allKeyArns = {
      ...(outputs?.kms_logs_use1_arn_by_key || {}),
      ...(outputs?.kms_logs_usw2_arn_by_key || {}),
    } as Record<string, string>;

    for (const [k, arn] of Object.entries(allKeyArns)) {
      const region = arnRegion(arn);
      expect(region).toBeTruthy();
      const kms = kmsClients[String(region)];
      const resp = await kms.send(new DescribeKeyCommand({ KeyId: arn }));
      expect(resp.KeyMetadata?.Arn).toBe(arn);
      expect(resp.KeyMetadata?.KeyState).not.toBe("PendingDeletion");
      // eslint-disable-next-line no-console
      console.log(`✔ KMS key ok (${k}) -> ${arn}`);
    }
  });

  test("KMS aliases resolve to the correct target key", async () => {
    const aliasesByRegion: Record<
      string,
      { name: string; targetKeyId?: string }
    >[] = [];

    const use1Aliases = outputs?.kms_alias_logs_use1_name_by_key || {};
    const usw2Aliases = outputs?.kms_alias_logs_usw2_name_by_key || {};
    const aliasItems = [
      ...Object.values(use1Aliases),
      ...Object.values(usw2Aliases),
    ].map((v) => String(v));

    // Expected targetKeyId from outputs
    const expectedTargetByAlias: Record<string, string | undefined> = {};
    for (const [k, aliasName] of Object.entries(use1Aliases)) {
      const keyId = (outputs?.kms_logs_use1_key_id_by_key || {})[k];
      expectedTargetByAlias[String(aliasName)] = keyId
        ? String(keyId)
        : undefined;
    }
    for (const [k, aliasName] of Object.entries(usw2Aliases)) {
      const keyId = (outputs?.kms_logs_usw2_key_id_by_key || {})[k];
      expectedTargetByAlias[String(aliasName)] = keyId
        ? String(keyId)
        : undefined;
    }

    // Fetch aliases from AWS and compare
    for (const region of regions) {
      const kms = kmsClients[region];
      let nextToken: string | undefined = undefined;
      const seen: Record<string, { name: string; targetKeyId?: string }> = {};
      for (let i = 0; i < 50; i++) {
        const page: ListAliasesCommandOutput = await kms.send(
          new ListAliasesCommand({ Marker: nextToken })
        );
        for (const a of page.Aliases || []) {
          if (a.AliasName) {
            seen[a.AliasName] = {
              name: a.AliasName,
              targetKeyId: a.TargetKeyId,
            };
          }
        }
        if (!page.Truncated) break;
        nextToken = page.NextMarker;
      }
      aliasesByRegion.push(seen);
    }

    // Validate expected aliases exist and targetKeyId matches
    for (const aliasName of aliasItems) {
      const expectedTarget = expectedTargetByAlias[aliasName];
      let found: { name: string; targetKeyId?: string } | undefined;
      for (const bag of aliasesByRegion) {
        if (bag[aliasName]) {
          found = bag[aliasName];
          break;
        }
      }
      expect(found?.name).toBe(aliasName);
      if (expectedTarget) {
        expect(found?.targetKeyId).toBe(expectedTarget);
      }
      // eslint-disable-next-line no-console
      console.log(`✔ KMS alias ok ${aliasName} -> ${found?.targetKeyId}`);
    }
  });

  test("CloudWatch log groups exist and are KMS-encrypted with expected key", async () => {
    type MapStr = Record<string, string>;
    const namesUse1: MapStr = outputs?.log_group_use1_name_by_key || {};
    const namesUsw2: MapStr = outputs?.log_group_usw2_name_by_key || {};
    const kmsUse1: MapStr = outputs?.log_group_use1_kms_key_id_by_key || {};
    const kmsUsw2: MapStr = outputs?.log_group_usw2_kms_key_id_by_key || {};

    const checkGroup = async (name: string, expectedKmsId?: string) => {
      const region = expectedKmsId ? arnRegion(expectedKmsId) : undefined;
      const regionsToTry = region ? [region] : regions;
      let found: LogGroup | undefined;
      for (const r of regionsToTry) {
        const client = logsClients[r];
        found = await findLogGroup(client, name);
        if (found) break;
      }
      expect(found?.logGroupName).toBe(name);
      if (expectedKmsId) {
        expect(found?.kmsKeyId).toBe(expectedKmsId);
      } else {
        expect(found?.kmsKeyId).toBeTruthy();
      }
    };

    for (const [k, name] of Object.entries(namesUse1)) {
      await checkGroup(String(name), String(kmsUse1[k] || ""));
      // eslint-disable-next-line no-console
      console.log(`✔ LogGroup (use1) ok (${k}) -> ${name}`);
    }

    for (const [k, name] of Object.entries(namesUsw2)) {
      await checkGroup(String(name), String(kmsUsw2[k] || ""));
      // eslint-disable-next-line no-console
      console.log(`✔ LogGroup (usw2) ok (${k}) -> ${name}`);
    }
  });
});
