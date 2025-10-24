// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as https from 'https';
import { URL } from 'url';

import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeMetricFiltersCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeNetworkAclsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetWebACLCommand,
  ListResourcesForWebACLCommand,
  WAFV2Client,
} from '@aws-sdk/client-wafv2';

const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// ---- Derived config from outputs ----
const kmsArn = outputs.KmsKeyArn;
const regionFromKms = kmsArn.split(':')[3];
const apiUrl = outputs.ApiGatewayInvokeUrl;
const url = new URL(apiUrl);
const apiHostParts = url.hostname.split('.');
const restApiId = apiHostParts[0];
const regionFromApi = apiHostParts[2];
const region =
  regionFromKms || regionFromApi || process.env.AWS_REGION || 'eu-central-1';
const stageName = url.pathname.split('/').filter(Boolean)[0]; // e.g. 'prod'
const apiStageArn = `arn:aws:apigateway:${region}::/restapis/${restApiId}/stages/${stageName}`;

const appBucket = outputs.ApplicationBucketName;
const centralLogBucket = outputs.CentralLogBucketName;
const trailName = outputs.TrailName;
const trailLogGroupName = outputs.TrailLogGroupName;
const wafWebAclArn = outputs.WafWebAclArn;
const vpcId = outputs.VpcId;
const iamAlarmArns = outputs.IamEventAlarmArns?.split(',').map(s => s.trim());
const iamAlarmNames = iamAlarmArns?.map(a => a.split(':alarm:')[1]);

const subnetsAZ1 = outputs.SubnetIdsAZ1.split(',').map(s => s.trim());
const subnetsAZ2 = outputs.SubnetIdsAZ2.split(',').map(s => s.trim());
const subnetsAZ3 = outputs.SubnetIdsAZ3.split(',').map(s => s.trim());
const allSubnets = [...subnetsAZ1, ...subnetsAZ2, ...subnetsAZ3];

const naclIds = outputs.NaclIds.split(',').map(s => s.trim());

const kmsKeyIdFromArn = kmsArn.split('/')[1]; // after ...:key/<keyId>

// ---- AWS SDK clients (v3) ----
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });
const ct = new CloudTrailClient({ region });
const logs = new CloudWatchLogsClient({ region });
const cw = new CloudWatchClient({ region });
const ec2 = new EC2Client({ region });
const wafv2 = new WAFV2Client({ region });

// ---- HTTPS GET helper with minimal headers (to avoid WAF "NoUserAgent" block) ----
const httpsGet = (
  targetUrl: string
): Promise<{ status: number; body: string }> =>
  new Promise((resolve, reject) => {
    const req = https.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'TapStackIntegrationTest/1.0',
          Accept: 'application/json',
        },
      },
      res => {
        const chunks: Uint8Array[] = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () =>
          resolve({
            status: res.statusCode || 0,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        );
      }
    );
    req.on('error', reject);
    req.end();
  });

jest.setTimeout(120000);

describe('Turn Around Prompt API Integration Tests', () => {
  describe('S3 – Application bucket configuration', () => {
    test('Application bucket exists (HeadBucket)', async () => {
      const out = await s3.send(new HeadBucketCommand({ Bucket: appBucket }));
      expect(out.$metadata.httpStatusCode).toBe(200);
    });

    test('Versioning is enabled', async () => {
      const out = await s3.send(
        new GetBucketVersioningCommand({ Bucket: appBucket })
      );
      expect(out.Status).toBe('Enabled');
    });

    test('Default encryption is SSE-KMS with expected KMS key', async () => {
      const out = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: appBucket })
      );
      const rule = out.ServerSideEncryptionConfiguration?.Rules?.[0];
      const def = rule?.ApplyServerSideEncryptionByDefault;
      expect(def?.SSEAlgorithm).toBe('aws:kms');
      const keyId = (def?.KMSMasterKeyID || '').split('/').pop();
      expect(keyId).toBe(kmsKeyIdFromArn);
    });

    test('Server access logging targets the central log bucket', async () => {
      const out = await s3.send(
        new GetBucketLoggingCommand({ Bucket: appBucket })
      );
      const target = out.LoggingEnabled?.TargetBucket;
      expect(target).toBe(centralLogBucket);
    });

    test('Bucket policy enforces encryption (DenyUnEncryptedObjectUploads)', async () => {
      const out = await s3.send(
        new GetBucketPolicyCommand({ Bucket: appBucket })
      );
      const policy = JSON.parse(out.Policy || '{}');
      const sids = (policy.Statement || []).map((s: any) => s.Sid);
      expect(sids).toEqual(
        expect.arrayContaining([
          'DenyUnEncryptedObjectUploads',
          'DenyIncorrectEncryptionKey',
        ])
      );
    });
  });

  describe('S3 – Central logging bucket configuration', () => {
    test('Central log bucket exists and has CloudTrail/server-access statements', async () => {
      const head = await s3.send(
        new HeadBucketCommand({ Bucket: centralLogBucket })
      );
      expect(head.$metadata.httpStatusCode).toBe(200);

      const pol = await s3.send(
        new GetBucketPolicyCommand({ Bucket: centralLogBucket })
      );
      const policy = JSON.parse(pol.Policy || '{}');
      const sids = (policy.Statement || []).map((s: any) => s.Sid);
      expect(
        sids.some((sid: string) =>
          [
            'AWSCloudTrailAclCheck',
            'AWSCloudTrailWrite',
            'S3ServerAccessLogsPolicy',
          ].includes(sid)
        )
      ).toBe(true);
    });
  });

  describe('KMS – Customer managed key', () => {
    test('KMS key exists and is enabled', async () => {
      const out = await kms.send(new DescribeKeyCommand({ KeyId: kmsArn }));
      expect(out.KeyMetadata?.Arn).toBe(kmsArn);
      expect(out.KeyMetadata?.KeyState).toBe('Enabled');
      expect(['AWS', 'CUSTOMER']).toContain(
        out.KeyMetadata?.KeyManager as string
      );
    });
  });

  describe('API Gateway – Invoke Lambda through API', () => {
    test('GET returns 200 and expected body shape', async () => {
      const res = await httpsGet(apiUrl);
      expect(res.status).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.message).toContain('Hello from secure Lambda!');
      expect(
        typeof body.request_id === 'string' || body.request_id === undefined
      ).toBe(true);
    });

    test('Region derived from URL matches region from KMS ARN', async () => {
      expect(regionFromApi).toBe(regionFromKms);
    });
  });

  describe('WAFv2 – Web ACL and API association', () => {
    test('Web ACL ARN resolves via GetWebACL', async () => {
      const parts = wafWebAclArn.split('/');
      const webAclId = parts[parts.length - 1];
      const webAclName = parts[parts.length - 2];
      const out = await wafv2.send(
        new GetWebACLCommand({ Id: webAclId, Name: webAclName, Scope: 'REGIONAL' })
      );
      expect(out.WebACL?.ARN).toBe(wafWebAclArn);
    });

    test('Web ACL is associated to the API Gateway Stage', async () => {
      const out = await wafv2.send(
        new ListResourcesForWebACLCommand({
          WebACLArn: wafWebAclArn,
          ResourceType: 'API_GATEWAY',
        })
      );
      expect(out.ResourceArns || []).toContain(apiStageArn);
    });
  });

  describe('CloudTrail – Trail & destinations', () => {
    test('Trail exists and targets central S3 + CloudWatch Logs', async () => {
      const out = await ct.send(
        new DescribeTrailsCommand({ includeShadowTrails: true })
      );
      const trails = out.trailList || [];
      const trail =
        trails.find(t => t.Name === trailName) ||
        trails.find(t => (t.TrailARN || '').endsWith(`:${trailName}`));

      expect(trail?.Name).toBe(trailName);
      expect(trail?.S3BucketName).toBe(centralLogBucket);

      // --- Robust check: extract log group name from ARN (handles optional ':*' suffix)
      const cwArn = trail?.CloudWatchLogsLogGroupArn ?? '';
      const match = cwArn.match(/:log-group:(.*?)(?::\*$|$)/);
      const logGroupFromArn = match?.[1];
      expect(logGroupFromArn).toBe(trailLogGroupName);
    });
  });

  describe('CloudWatch Logs – Trail log group & metric filters', () => {
    test('Trail log group exists', async () => {
      const out = await logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: trailLogGroupName })
      );
      const names = (out.logGroups || []).map(lg => lg.logGroupName);
      expect(names).toContain(trailLogGroupName);
    });

    test('Metric filters for critical IAM events exist', async () => {
      const mustHave = [
        'CreateUser',
        'DeleteUser',
        'CreateRole',
        'DeleteRole',
        'AttachRolePolicy',
        'DetachRolePolicy',
        'PutRolePolicy',
        'PutUserPolicy',
        'CreateAccessKey',
        'DeleteAccessKey',
        'UpdateLoginProfile',
        'DeleteLoginProfile',
        'ConsoleLoginNoMFA',
      ];
      for (const name of mustHave) {
        const resp = await logs.send(
          new DescribeMetricFiltersCommand({
            logGroupName: trailLogGroupName,
            filterNamePrefix: name,
          })
        );
        const anyMatch = (resp.metricFilters || []).some(mf =>
          (mf.filterName || '').startsWith(name)
        );
        expect(anyMatch).toBe(true);
      }
    });
  });

  describe('CloudWatch – IAM alarms exist', () => {
    test('Alarms returned by outputs exist in CloudWatch', async () => {
      const out = await cw.send(
        new DescribeAlarmsCommand({
          AlarmNames: iamAlarmNames,
        })
      );
      const returnedNames = (out.MetricAlarms || []).map(a => a.AlarmName);
      iamAlarmNames.forEach(n => expect(returnedNames).toContain(n));
    });
  });

  describe('EC2 – VPC resources', () => {
    test('All subnets are in the expected VPC', async () => {
      const out = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: allSubnets })
      );
      const gotVpcIds = new Set((out.Subnets || []).map(s => s.VpcId));
      expect(gotVpcIds.size).toBe(1);
      expect(gotVpcIds.has(vpcId)).toBe(true);
    });

    test('Network ACLs exist', async () => {
      const out = await ec2.send(
        new DescribeNetworkAclsCommand({ NetworkAclIds: naclIds })
      );
      const returnedIds = (out.NetworkAcls || []).map(n => n.NetworkAclId);
      naclIds.forEach(id => expect(returnedIds).toContain(id));
    });
  });
});
