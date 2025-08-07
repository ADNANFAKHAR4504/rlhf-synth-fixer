import {
  IAMClient,
  GetGroupCommand,
  ListAttachedGroupPoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from '@aws-sdk/client-iam';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeConfigurationRecordersCommand,
} from '@aws-sdk/client-config-service';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const REGION = process.env.AWS_REGION || 'us-west-2';

// --- AWS SDK Clients ---
const iamClient = new IAMClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const configClient = new ConfigServiceClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
let outputs: { [key: string]: string } = {};
try {
  // Assumes an outputs file is generated in this path post-deployment
  outputs = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../cfn-outputs/flat-outputs.json'),
      'utf8'
    )
  );
} catch (error) {
  console.warn(
    'Could not read "cfn-outputs/flat-outputs.json". Skipping integration tests.'
  );
}

// Conditionally run tests only if outputs were loaded successfully
const testSuite = Object.keys(outputs).length > 0 ? describe : describe.skip;

testSuite('IaC Foundational Security Stack - Integration Tests', () => {
  // Get resource names from stack outputs
  const mfaGroupName = outputs.MfaEnforcedUsersGroupName;
  const configBucketName = outputs.ConfigBucketNameOutput;
  const sampleBucketName = outputs.SampleS3BucketNameOutput;
  const environmentSuffix = outputs.EnvironmentSuffix;

  describe('🛡️ IAM MFA Enforcement', () => {
    let mfaPolicy: any;

    beforeAll(async () => {
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedGroupPoliciesCommand({ GroupName: mfaGroupName })
      );
      const policyInfo = AttachedPolicies?.find(p =>
        p.PolicyName?.startsWith('MfaEnforcedPolicy')
      );
      if (!policyInfo || !policyInfo.PolicyArn) {
        throw new Error(
          `Could not find MFA policy attached to group ${mfaGroupName}`
        );
      }

      const { Policy } = await iamClient.send(
        new GetPolicyCommand({ PolicyArn: policyInfo.PolicyArn })
      );
      const { PolicyVersion } = await iamClient.send(
        new GetPolicyVersionCommand({
          PolicyArn: policyInfo.PolicyArn,
          VersionId: Policy?.DefaultVersionId,
        })
      );
      mfaPolicy = JSON.parse(
        decodeURIComponent(PolicyVersion?.Document || '{}')
      );
    });

    test('MfaEnforcedUsersGroup should exist', async () => {
      const { Group } = await iamClient.send(
        new GetGroupCommand({ GroupName: mfaGroupName })
      );
      expect(Group).toBeDefined();
      expect(Group?.GroupName).toBe(mfaGroupName);
    });

    test('Attached IAM policy should deny all actions when MFA is not present', () => {
      const statement = mfaPolicy.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Action).toBe('*');
      expect(statement.Resource).toBe('*');
      expect(
        statement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']
      ).toBe('false');
    });
  });

  describe('⚙️ AWS Config & S3 Security', () => {
    test('Config S3 bucket should be private and have versioning enabled', async () => {
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: configBucketName })
      );
      expect(Status).toBe('Enabled');

      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: configBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('Configuration Recorder should be active and recording', async () => {
      const { ConfigurationRecorders } = await configClient.send(
        new DescribeConfigurationRecordersCommand({})
      );
      const recorder = ConfigurationRecorders?.find(r =>
        r.name?.includes(environmentSuffix)
      );
      expect(recorder).toBeDefined();
      const lastStatus = recorder?.lastStatus;
      expect(['SUCCESS', 'PENDING']).toContain(lastStatus);
    });

    test('S3 public access Config Rules should be active', async () => {
      const ruleNames = [
        `s3-bucket-public-read-prohibited-${environmentSuffix}`,
        `s3-bucket-public-write-prohibited-${environmentSuffix}`,
      ];
      const { ConfigRules } = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: ruleNames })
      );
      expect(ConfigRules).toHaveLength(2);
      ConfigRules?.forEach(rule => {
        expect(rule.ConfigRuleState).toBe('ACTIVE');
      });
    });
  });

  describe('📦 Demonstration Resources', () => {
    test('Sample S3 Bucket should be private', async () => {
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: sampleBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });
});
