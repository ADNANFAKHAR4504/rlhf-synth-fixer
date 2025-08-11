import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const REGION = process.env.AWS_REGION || 'us-west-2'; // Or your target region

// --- Type Definition for Stack Outputs ---
interface StackOutputs {
  TurnAroundPromptTableName: string;
  TurnAroundPromptTableArn: string;
  KMSKeyArn: string;
  S3BucketName: string;
  EC2InstanceId: string;
}

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const configClient = new ConfigServiceClient({ region: REGION });

// --- Read Deployed Stack Outputs ---
let outputs: StackOutputs | null = null;
try {
  const rawOutputs = fs.readFileSync(
    path.join(__dirname, 'cfn-outputs.json'),
    'utf8'
  );
  outputs = JSON.parse(rawOutputs).Stacks[0].Outputs.reduce(
    (acc: any, curr: any) => {
      acc[curr.OutputKey.replace('Output', '')] = curr.OutputValue;
      return acc;
    },
    {}
  ) as StackOutputs;
} catch (error) {
  console.warn(
    'cfn-outputs.json not found or is invalid. Integration tests will be skipped.'
  );
}

const testSuite = outputs ? describe : describe.skip;

testSuite('TAP Stack Integration Tests', () => {
  // Test Suite: Security (KMS, Security Groups)
  describe('🛡️ Security', () => {
    test('KMS Key should be enabled and available', async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs!.KMSKeyArn })
      );
      expect(KeyMetadata).toBeDefined();
      expect(KeyMetadata!.Enabled).toBe(true);
      expect(KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('EC2 Security Group should have the correct SSH ingress rule', async () => {
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs!.EC2InstanceId] })
      );
      const sgId =
        instanceResponse.Reservations?.[0].Instances?.[0].SecurityGroups?.[0]
          .GroupId;
      expect(sgId).toBeDefined();

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId!] })
      );
      const ingressRule = sgResponse.SecurityGroups?.[0].IpPermissions?.find(
        p => p.FromPort === 22
      );
      expect(ingressRule).toBeDefined();
    });
  });

  // Test Suite: Storage (DynamoDB, S3)
  describe('📦 Storage & Database', () => {
    test('DynamoDB table should be active and encrypted with the correct KMS key', async () => {
      const { Table } = await dynamoDBClient.send(
        new DescribeTableCommand({
          TableName: outputs!.TurnAroundPromptTableName,
        })
      );
      expect(Table).toBeDefined();
      expect(Table!.TableStatus).toBe('ACTIVE');
      expect(Table!.SSEDescription?.Status).toBe('ENABLED');
      expect(Table!.SSEDescription?.KMSMasterKeyArn).toBe(outputs!.KMSKeyArn);
    }, 60000);

    test('S3 bucket should enforce encryption and block all public access', async () => {
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs!.S3BucketName })
      );

      // Assert that the encryption configuration and its rules exist
      expect(ServerSideEncryptionConfiguration).toBeDefined();
      expect(ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(
        0
      );

      // Now it's safe to access the first rule
      const sseRule = ServerSideEncryptionConfiguration!.Rules![0];
      expect(sseRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(sseRule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(
        outputs!.KMSKeyArn
      );

      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: outputs!.S3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  // Test Suite: Compute (EC2)
  describe('⚙️ Compute', () => {
    test('EC2 instance should be running and its root volume should be encrypted', async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [outputs!.EC2InstanceId] })
      );
      const instance = Reservations?.[0].Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance!.State?.Name).toBe('running');

      const volumeId = instance!.BlockDeviceMappings?.[0].Ebs?.VolumeId;
      expect(volumeId).toBeDefined();

      const { Volumes } = await ec2Client.send(
        new DescribeVolumesCommand({ VolumeIds: [volumeId!] })
      );
      const volume = Volumes?.[0];
      expect(volume).toBeDefined();
      expect(volume!.Encrypted).toBe(true);
      expect(volume!.KmsKeyId).toBe(outputs!.KMSKeyArn);
    }, 120000);
  });

  // Test Suite: Compliance (AWS Config)
  describe('⚖️ Compliance', () => {
    test('AWS Config rules should be created in the account', async () => {
      const { ConfigRules } = await configClient.send(
        new DescribeConfigRulesCommand({
          ConfigRuleNames: [
            's3-bucket-server-side-encryption-enabled',
            'encrypted-volumes',
            'iam-role-managed-policy-check',
          ],
        })
      );
      expect(ConfigRules).toBeDefined();
      expect(ConfigRules!.length).toBe(3);
    });
  });
});
