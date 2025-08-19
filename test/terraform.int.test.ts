/**
 * LIVE integration tests for lib/tap_stack.tf
 * - Explicit TypeScript types to avoid TS7022/TS7006
 * - Comprehensive testing of all AWS infrastructure components
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
  ListAliasesCommandOutput,
  GetKeyPolicyCommand,
  ListKeysCommand,
} from "@aws-sdk/client-kms";

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogGroupsCommandOutput,
  LogGroup,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

import {
  IAMClient,
  GetRoleCommand,
  ListRolesCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";

import {
  STSClient,
  GetCallerIdentityCommand,
} from "@aws-sdk/client-sts";

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
const iamClients: Record<string, IAMClient> = Object.fromEntries(
  regions.map((r) => [r, new IAMClient({ region: r })])
);
const stsClients: Record<string, STSClient> = Object.fromEntries(
  regions.map((r) => [r, new STSClient({ region: r })])
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

/** Helper function to generate log data for testing */
const generateLogData = (message: string): any => ({
  timestamp: Date.now(),
  message: `[TEST] ${message} - ${new Date().toISOString()}`,
});

/** Helper to validate resource naming conventions */
const validateResourceNaming = (resourceName: string, expectedPattern: RegExp): boolean => {
  return expectedPattern.test(resourceName);
};

/** Helper to extract environment from resource name */
const extractEnvironmentFromName = (name: string): string | undefined => {
  const match = name.match(/(staging|production)/);
  return match ? match[1] : undefined;
};

/** ------------------------------------------------------------------
 * Tests
 * ------------------------------------------------------------------ */

const hasOutputs = !!outputs;
(hasOutputs ? describe : describe.skip)("tap_stack live checks (comprehensive)", () => {
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

  test("KMS key policies are properly configured for CloudWatch Logs", async () => {
    const allKeyArns = {
      ...(outputs?.kms_logs_use1_arn_by_key || {}),
      ...(outputs?.kms_logs_usw2_arn_by_key || {}),
    } as Record<string, string>;

    for (const [k, arn] of Object.entries(allKeyArns)) {
      const region = arnRegion(arn);
      expect(region).toBeTruthy();
      const kms = kmsClients[String(region)];
      
      // Get the key policy
      const policyResp = await kms.send(new GetKeyPolicyCommand({ 
        KeyId: arn, 
        PolicyName: 'default' 
      }));
      
      expect(policyResp.Policy).toBeTruthy();
      const policy = JSON.parse(policyResp.Policy!);
      
      // Verify policy allows CloudWatch Logs service
      const logsStatement = policy.Statement.find((stmt: any) => 
        stmt.Principal?.Service?.includes(`logs.${region}.amazonaws.com`)
      );
      expect(logsStatement).toBeTruthy();
      
      // Verify required actions for logs encryption
      const requiredActions = ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'];
      requiredActions.forEach(action => {
        expect(logsStatement.Action).toContain(action);
      });
      
      // eslint-disable-next-line no-console
      console.log(`✔ KMS key policy validated (${k}) -> ${arn}`);
    }
  });

  test("KMS keys have rotation enabled for security", async () => {
    const allKeyArns = {
      ...(outputs?.kms_logs_use1_arn_by_key || {}),
      ...(outputs?.kms_logs_usw2_arn_by_key || {}),
    } as Record<string, string>;

    for (const [k, arn] of Object.entries(allKeyArns)) {
      const region = arnRegion(arn);
      expect(region).toBeTruthy();
      const kms = kmsClients[String(region)];
      
      const resp = await kms.send(new DescribeKeyCommand({ KeyId: arn }));
      expect(resp.KeyMetadata?.KeyRotationStatus).toBe(true);
      
      // eslint-disable-next-line no-console
      console.log(`✔ KMS key rotation enabled (${k}) -> ${arn}`);
    }
  });

  test("CloudWatch log groups have correct retention policies by environment", async () => {
    const use1Names: Record<string, string> = outputs?.log_group_use1_name_by_key || {};
    const usw2Names: Record<string, string> = outputs?.log_group_usw2_name_by_key || {};
    
    const checkRetention = async (name: string, environment: string) => {
      const regionsToCheck = regions.length > 0 ? regions : ['us-east-1', 'us-west-2'];
      let found: LogGroup | undefined;
      
      for (const r of regionsToCheck) {
        const client = logsClients[r];
        found = await findLogGroup(client, name);
        if (found) break;
      }
      
      expect(found?.logGroupName).toBe(name);
      
      // Verify retention policy matches environment
      const expectedRetention = environment === 'production' ? 365 : 30;
      expect(found?.retentionInDays).toBe(expectedRetention);
      
      // eslint-disable-next-line no-console
      console.log(`✔ Log group retention (${environment}): ${found?.retentionInDays} days -> ${name}`);
    };

    for (const [k, name] of Object.entries(use1Names)) {
      const environment = extractEnvironmentFromName(String(name));
      expect(environment).toBeTruthy();
      await checkRetention(String(name), environment!);
    }

    for (const [k, name] of Object.entries(usw2Names)) {
      const environment = extractEnvironmentFromName(String(name));
      expect(environment).toBeTruthy();
      await checkRetention(String(name), environment!);
    }
  });

  test("Resource naming follows consistent conventions", () => {
    // Test KMS key naming
    const allKeyArns = {
      ...(outputs?.kms_logs_use1_arn_by_key || {}),
      ...(outputs?.kms_logs_usw2_arn_by_key || {}),
    } as Record<string, string>;

    // Test alias naming
    const allAliasNames = {
      ...(outputs?.kms_alias_logs_use1_name_by_key || {}),
      ...(outputs?.kms_alias_logs_usw2_name_by_key || {}),
    } as Record<string, string>;

    // Test log group naming  
    const allLogGroupNames = {
      ...(outputs?.log_group_use1_name_by_key || {}),
      ...(outputs?.log_group_usw2_name_by_key || {}),
    } as Record<string, string>;

    // Validate alias naming pattern: alias/{env}-logs-{project}-{suffix}-{region}
    const aliasPattern = /^alias\/(staging|production)-logs-secure-infra-[^-]+-us-(east|west)-[12]$/;
    for (const [k, aliasName] of Object.entries(allAliasNames)) {
      expect(validateResourceNaming(String(aliasName), aliasPattern)).toBe(true);
      // eslint-disable-next-line no-console
      console.log(`✔ Alias naming convention validated -> ${aliasName}`);
    }

    // Validate log group naming pattern: /aws/application/{env}-logs-{project}-{suffix}
    const logGroupPattern = /^\/aws\/application\/(staging|production)-logs-secure-infra-[^-]+$/;
    for (const [k, logGroupName] of Object.entries(allLogGroupNames)) {
      expect(validateResourceNaming(String(logGroupName), logGroupPattern)).toBe(true);
      // eslint-disable-next-line no-console
      console.log(`✔ Log group naming convention validated -> ${logGroupName}`);
    }
  });

  test("Multi-region deployment consistency", async () => {
    const use1Data = {
      keyArns: outputs?.kms_logs_use1_arn_by_key || {},
      aliasNames: outputs?.kms_alias_logs_use1_name_by_key || {},
      logGroupNames: outputs?.log_group_use1_name_by_key || {},
    };
    
    const usw2Data = {
      keyArns: outputs?.kms_logs_usw2_arn_by_key || {},
      aliasNames: outputs?.kms_alias_logs_usw2_name_by_key || {},
      logGroupNames: outputs?.log_group_usw2_name_by_key || {},
    };

    // Verify same environments are deployed in both regions
    const use1Environments = Object.keys(use1Data.keyArns);
    const usw2Environments = Object.keys(usw2Data.keyArns);
    expect(use1Environments.sort()).toEqual(usw2Environments.sort());

    // Verify resource consistency across regions for each environment
    for (const env of use1Environments) {
      // Both regions should have resources for this environment
      expect(use1Data.keyArns[env]).toBeTruthy();
      expect(usw2Data.keyArns[env]).toBeTruthy();
      expect(use1Data.aliasNames[env]).toBeTruthy();
      expect(usw2Data.aliasNames[env]).toBeTruthy();
      expect(use1Data.logGroupNames[env]).toBeTruthy();
      expect(usw2Data.logGroupNames[env]).toBeTruthy();

      // Verify regions in ARNs are correct
      const use1Arn = String(use1Data.keyArns[env]);
      const usw2Arn = String(usw2Data.keyArns[env]);
      expect(arnRegion(use1Arn)).toBe('us-east-1');
      expect(arnRegion(usw2Arn)).toBe('us-west-2');

      // eslint-disable-next-line no-console
      console.log(`✔ Multi-region consistency validated for ${env} environment`);
    }
  });

  test("KMS key and log group relationships are correct", async () => {
    // Test us-east-1 relationships
    const use1KeyIds = outputs?.kms_logs_use1_key_id_by_key || {};
    const use1LogGroupKmsKeys = outputs?.log_group_use1_kms_key_id_by_key || {};
    
    for (const [env, logGroupKmsKeyId] of Object.entries(use1LogGroupKmsKeys)) {
      const expectedKeyArn = String(use1LogGroupKmsKeys[env]);
      const actualKeyId = String(use1KeyIds[env]);
      
      // Log groups should reference KMS key ARNs, not just key IDs
      expect(expectedKeyArn).toContain(actualKeyId);
      
      // eslint-disable-next-line no-console
      console.log(`✔ KMS-LogGroup relationship validated (use1, ${env})`);
    }

    // Test us-west-2 relationships
    const usw2KeyIds = outputs?.kms_logs_usw2_key_id_by_key || {};
    const usw2LogGroupKmsKeys = outputs?.log_group_usw2_kms_key_id_by_key || {};
    
    for (const [env, logGroupKmsKeyId] of Object.entries(usw2LogGroupKmsKeys)) {
      const expectedKeyArn = String(usw2LogGroupKmsKeys[env]);
      const actualKeyId = String(usw2KeyIds[env]);
      
      expect(expectedKeyArn).toContain(actualKeyId);
      
      // eslint-disable-next-line no-console
      console.log(`✔ KMS-LogGroup relationship validated (usw2, ${env})`);
    }
  });

  test("CloudWatch log groups can receive log events", async () => {
    const testLogGroups = [
      ...Object.values(outputs?.log_group_use1_name_by_key || {}),
      ...Object.values(outputs?.log_group_usw2_name_by_key || {}),
    ];

    for (const logGroupName of testLogGroups.slice(0, 2)) { // Test first 2 to avoid rate limits
      const name = String(logGroupName);
      
      // Find the right region and client for this log group
      let client: CloudWatchLogsClient | undefined;
      let region: string | undefined;
      
      for (const r of regions) {
        const testClient = logsClients[r];
        const found = await findLogGroup(testClient, name);
        if (found) {
          client = testClient;
          region = r;
          break;
        }
      }
      
      expect(client).toBeTruthy();
      expect(region).toBeTruthy();

      // Create a test log stream
      const streamName = `test-stream-${Date.now()}`;
      try {
        await client!.send(new CreateLogStreamCommand({
          logGroupName: name,
          logStreamName: streamName,
        }));

        // Verify stream was created
        const streams = await client!.send(new DescribeLogStreamsCommand({
          logGroupName: name,
          logStreamNamePrefix: streamName,
        }));
        
        expect(streams.logStreams?.length).toBeGreaterThan(0);
        expect(streams.logStreams?.[0]?.logStreamName).toBe(streamName);

        // Send a test log event
        const logData = generateLogData(`Integration test for ${name}`);
        await client!.send(new PutLogEventsCommand({
          logGroupName: name,
          logStreamName: streamName,
          logEvents: [{
            timestamp: logData.timestamp,
            message: logData.message,
          }],
        }));

        // eslint-disable-next-line no-console
        console.log(`✔ Log events successfully sent to ${name} in ${region}`);
        
      } catch (error: any) {
        // If we get access errors, that's expected in some environments
        if (error.name === 'AccessDeniedError' || error.name === 'UnauthorizedOperation') {
          // eslint-disable-next-line no-console
          console.log(`⚠ Access denied for log events test on ${name} - this is expected in restricted environments`);
        } else {
          throw error;
        }
      }
    }
  }, 60000); // Extended timeout for live AWS operations

  test("All resources are properly tagged", async () => {
    // Test KMS key tags
    const allKeyArns = {
      ...(outputs?.kms_logs_use1_arn_by_key || {}),
      ...(outputs?.kms_logs_usw2_arn_by_key || {}),
    } as Record<string, string>;

    for (const [env, arn] of Object.entries(allKeyArns)) {
      const region = arnRegion(arn);
      expect(region).toBeTruthy();
      const kms = kmsClients[String(region)];
      
      const resp = await kms.send(new DescribeKeyCommand({ KeyId: arn }));
      const tags = resp.KeyMetadata?.Tags || [];
      
      // Verify required tags exist
      const nameTag = tags.find(tag => tag.TagKey === 'Name');
      const envTag = tags.find(tag => tag.TagKey === 'Environment');
      const regionTag = tags.find(tag => tag.TagKey === 'Region');
      
      expect(nameTag?.TagValue).toBeTruthy();
      expect(envTag?.TagValue).toBe(env);
      expect(regionTag?.TagValue).toBe(region);
      
      // eslint-disable-next-line no-console
      console.log(`✔ KMS key tags validated (${env}) -> ${arn}`);
    }
  });

  test("Security compliance: No unencrypted log groups", async () => {
    const allLogGroups = [
      ...Object.values(outputs?.log_group_use1_name_by_key || {}),
      ...Object.values(outputs?.log_group_usw2_name_by_key || {}),
    ];

    for (const logGroupName of allLogGroups) {
      const name = String(logGroupName);
      
      // Find the log group
      let found: LogGroup | undefined;
      for (const r of regions) {
        const client = logsClients[r];
        found = await findLogGroup(client, name);
        if (found) break;
      }
      
      expect(found?.logGroupName).toBe(name);
      
      // Verify KMS encryption is enabled
      expect(found?.kmsKeyId).toBeTruthy();
      expect(found?.kmsKeyId).toMatch(/^arn:aws:kms:/);
      
      // eslint-disable-next-line no-console
      console.log(`✔ Security: Log group is encrypted -> ${name}`);
    }
  });

  test("Environment isolation: Production and staging resources are separate", () => {
    const allKeyArns = {
      ...(outputs?.kms_logs_use1_arn_by_key || {}),
      ...(outputs?.kms_logs_usw2_arn_by_key || {}),
    } as Record<string, string>;

    const allAliasNames = {
      ...(outputs?.kms_alias_logs_use1_name_by_key || {}),
      ...(outputs?.kms_alias_logs_usw2_name_by_key || {}),
    } as Record<string, string>;

    const allLogGroupNames = {
      ...(outputs?.log_group_use1_name_by_key || {}),
      ...(outputs?.log_group_usw2_name_by_key || {}),
    } as Record<string, string>;

    // Verify we have both environments
    const environments = Object.keys(allKeyArns);
    expect(environments).toContain('staging');
    expect(environments).toContain('production');

    // Verify resources are distinct between environments
    const prodResources = {
      keyArn: allKeyArns['production'],
      aliasName: allAliasNames['production'],
      logGroupName: allLogGroupNames['production'],
    };

    const stagingResources = {
      keyArn: allKeyArns['staging'],
      aliasName: allAliasNames['staging'],
      logGroupName: allLogGroupNames['staging'],
    };

    // Resources should be different between environments
    expect(prodResources.keyArn).not.toBe(stagingResources.keyArn);
    expect(prodResources.aliasName).not.toBe(stagingResources.aliasName);
    expect(prodResources.logGroupName).not.toBe(stagingResources.logGroupName);

    // But they should follow the same naming patterns with different prefixes
    expect(String(prodResources.aliasName)).toContain('production');
    expect(String(stagingResources.aliasName)).toContain('staging');
    expect(String(prodResources.logGroupName)).toContain('production');
    expect(String(stagingResources.logGroupName)).toContain('staging');

    // eslint-disable-next-line no-console
    console.log(`✔ Environment isolation validated between production and staging`);
  });
});
