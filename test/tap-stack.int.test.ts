// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  APIGatewayClient,
  GetRestApiCommand,
} from '@aws-sdk/client-api-gateway';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

const outputsPath = 'cfn-outputs/flat-outputs.json';
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8')) as Record<
  string,
  string
>;

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Auto-enable live E2E checks when AWS creds and cfn outputs are present.
// Respect explicit overrides via E2E=true/false.
const runE2E = (() => {
  if (process.env.E2E === 'false') return false;
  if (process.env.E2E === 'true') return true;

  const homeDir = os.homedir();
  const credFile = path.join(homeDir, '.aws', 'credentials');
  const configFile = path.join(homeDir, '.aws', 'config');

  const hasCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT ||
    process.env.GITHUB_ACTIONS ||
    fs.existsSync(credFile) ||
    fs.existsSync(configFile)
  );

  const hasOutputs = Boolean(
    outputs?.VpcId &&
    outputs?.PrivateSubnet1Id &&
    outputs?.PrivateSubnet2Id &&
    outputs?.ApiEndpointUrl &&
    outputs?.LogsBucketName &&
    outputs?.KmsKeyArn
  );

  const looksPlaceholder = (() => {
    const vpcLooksFake = /^vpc-mock/.test(String(outputs?.VpcId || ''));
    const subnetLooksFake = /^subnet-mock/.test(
      String(outputs?.PrivateSubnet1Id || '')
    );
    const apiLooksFake = /mock-api/.test(String(outputs?.ApiEndpointUrl || ''));
    const bucketLooksFake = /mock-logs-bucket/.test(
      String(outputs?.LogsBucketName || '')
    );
    const kmsLooksFake = /mock-key-id/.test(String(outputs?.KmsKeyArn || ''));

    return (
      vpcLooksFake ||
      subnetLooksFake ||
      apiLooksFake ||
      bucketLooksFake ||
      kmsLooksFake
    );
  })();

  return hasCreds && hasOutputs && !looksPlaceholder;
})();

if (!runE2E) {
  const reasons: string[] = [];
  if (process.env.E2E === 'false') reasons.push('E2E=false override');

  const homeDir = os.homedir();
  const credFile = path.join(homeDir, '.aws', 'credentials');
  const configFile = path.join(homeDir, '.aws', 'config');

  const hasCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_SESSION_TOKEN ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    process.env.AWS_EC2_METADATA_SERVICE_ENDPOINT ||
    process.env.GITHUB_ACTIONS ||
    fs.existsSync(credFile) ||
    fs.existsSync(configFile)
  );

  if (!hasCreds) {
    reasons.push(
      'no AWS credentials detected (env or ~/.aws/{credentials,config})'
    );
  }

  const hasOutputs = Boolean(
    outputs?.VpcId &&
    outputs?.PrivateSubnet1Id &&
    outputs?.PrivateSubnet2Id &&
    outputs?.ApiEndpointUrl &&
    outputs?.LogsBucketName &&
    outputs?.KmsKeyArn
  );

  if (!hasOutputs) {
    reasons.push(
      'missing or incomplete CFN outputs at cfn-outputs/flat-outputs.json'
    );
  }

  const looksPlaceholder = (() => {
    const vpcLooksFake = /^vpc-mock/.test(String(outputs?.VpcId || ''));
    const subnetLooksFake = /^subnet-mock/.test(
      String(outputs?.PrivateSubnet1Id || '')
    );
    const apiLooksFake = /mock-api/.test(String(outputs?.ApiEndpointUrl || ''));
    const bucketLooksFake = /mock-logs-bucket/.test(
      String(outputs?.LogsBucketName || '')
    );
    const kmsLooksFake = /mock-key-id/.test(String(outputs?.KmsKeyArn || ''));

    return (
      vpcLooksFake ||
      subnetLooksFake ||
      apiLooksFake ||
      bucketLooksFake ||
      kmsLooksFake
    );
  })();

  if (hasOutputs && looksPlaceholder) {
    reasons.push(
      'CFN outputs appear to be placeholders; deploy real stack or set E2E=false'
    );
  }

  // eslint-disable-next-line no-console
  console.warn(
    `Skipping live E2E AWS checks: ${reasons.join('; ')}. Set E2E=true to force-enable.`
  );
}

const region = process.env.AWS_REGION || 'us-east-1';

describe('Nova Security Baseline Integration Tests', () => {
  describe('Infrastructure Deployment Validation', () => {
    test('required outputs exist and have valid shapes', async () => {
      const requiredKeys = [
        'VpcId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ApiEndpointUrl',
        'LogsBucketName',
        'KmsKeyArn',
      ];

      // Presence and non-empty
      for (const key of requiredKeys) {
        expect(outputs[key]).toBeDefined();
        expect(String(outputs[key]).trim().length).toBeGreaterThan(0);
      }

      // ID formats
      expect(outputs.VpcId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[0-9a-f]{8,17}$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[0-9a-f]{8,17}$/);

      // API Gateway URL format
      expect(outputs.ApiEndpointUrl).toMatch(
        /^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod\/?$/
      );

      // S3 bucket name rules
      expect(outputs.LogsBucketName).toMatch(/^[a-z0-9-]{3,63}$/);
      expect(outputs.LogsBucketName).not.toMatch(/[A-Z_]/);

      // KMS ARN format
      expect(outputs.KmsKeyArn).toMatch(
        /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/
      );
    });
  });

  describe('E2E (live AWS checks)', () => {
    // Only run if explicitly enabled to avoid failures without live infra/creds
    (runE2E ? test : test.skip)(
      'API Gateway responds with 200 OK at health endpoint',
      async () => {
        const url = `${outputs.ApiEndpointUrl}health`;
        const resp = await axios.get(url, { timeout: 10000 });
        expect(resp.status).toBe(200);
        expect(resp.data.status).toBe('healthy');
        expect(resp.data.timestamp).toBeDefined();
      }
    );

    (runE2E ? test : test.skip)(
      'S3 bucket has encryption and public access blocked',
      async () => {
        const s3 = new S3Client({ region });

        // Check encryption
        const enc = await s3.send(
          new GetBucketEncryptionCommand({ Bucket: outputs.LogsBucketName })
        );
        const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
        const hasEncryption = rules.some(
          r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
        );
        expect(hasEncryption).toBe(true);

        // Check public access block
        const pab = await s3.send(
          new GetPublicAccessBlockCommand({ Bucket: outputs.LogsBucketName })
        );
        const cfg = pab.PublicAccessBlockConfiguration!;
        expect(cfg.BlockPublicAcls).toBe(true);
        expect(cfg.BlockPublicPolicy).toBe(true);
        expect(cfg.IgnorePublicAcls).toBe(true);
        expect(cfg.RestrictPublicBuckets).toBe(true);
      }
    );

    (runE2E ? test : test.skip)('KMS key exists and is enabled', async () => {
      const kms = new KMSClient({ region });

      // Extract key ID from ARN
      const keyId = outputs.KmsKeyArn.split('/').pop();
      const res = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));

      expect(res.KeyMetadata?.KeyId).toBe(keyId);
      expect(res.KeyMetadata?.KeyState).toBe('Enabled');
      expect(res.KeyMetadata?.KeyManager).toBe('CUSTOMER');
    });

    (runE2E ? test : test.skip)(
      'VPC exists with correct configuration',
      async () => {
        const ec2 = new EC2Client({ region });

        const vpcs = await ec2.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] })
        );

        expect(vpcs.Vpcs?.length).toBe(1);
        expect(vpcs.Vpcs?.[0].VpcId).toBe(outputs.VpcId);
        expect(vpcs.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
      }
    );

    (runE2E ? test : test.skip)('API Gateway REST API exists', async () => {
      const apiGateway = new APIGatewayClient({ region });

      // Extract API ID from endpoint URL
      const apiId = outputs.ApiEndpointUrl.split('.')[0].split('//')[1];
      const res = await apiGateway.send(
        new GetRestApiCommand({ restApiId: apiId })
      );

      expect(res.id).toBe(apiId);
      expect(res.name).toBe('Nova Security Baseline API');
    });
  });
});
