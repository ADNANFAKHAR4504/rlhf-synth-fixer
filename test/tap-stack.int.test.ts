import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  ConfigServiceClient,
  DescribeConfigurationRecorderStatusCommand, // Correct command to check status
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
const REGION = process.env.AWS_REGION || 'us-west-2'; // Your target region

// --- Type Definition for Stack Outputs ---
interface StackOutputs {
  EC2RoleArn: string;
  KMSKeyArn: string;
  EC2InstanceId: string;
  EnvironmentSuffix: string;
}

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const kmsClient = new KMSClient({ region: REGION });
const iamClient = new IAMClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
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
      acc[curr.OutputKey] = curr.OutputValue;
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

testSuite('New TAP Stack Integration Tests', () => {
  // --- Test Suite: Security & IAM ---
  describe('🛡️ Security & IAM', () => {
    test('KMS Key should be enabled', async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: outputs!.KMSKeyArn })
      );
      expect(KeyMetadata).toBeDefined();
      expect(KeyMetadata!.Enabled).toBe(true);
    });

    test('EC2 IAM Role should exist with the specified regional name', async () => {
      // The role name is extracted from the ARN provided in the outputs
      const roleName = outputs!.EC2RoleArn.split('/')[1];
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(Role).toBeDefined();
      expect(Role!.RoleName).toBe(roleName);
    });

    test('EC2 Security Group should have no ingress rules', async () => {
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
      expect(sgResponse.SecurityGroups?.[0].IpPermissions).toHaveLength(0); // Checks for empty ingress rules
    });
  });

  // --- Test Suite: Compute & Storage ---
  describe('⚙️ Compute & Storage', () => {
    test('EC2 instance should be running and its root volume encrypted', async () => {
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
      expect(Volumes?.[0].Encrypted).toBe(true);
      expect(Volumes?.[0].KmsKeyId).toBe(outputs!.KMSKeyArn);
    }, 120000);
  });

  // --- Test Suite: Compliance & Custom Resources ---
  describe('⚖️ Compliance & Custom Resources', () => {
    // FIX: This test now uses the correct SDK command and checks the correct properties.
    test('AWS Config recorder should be on and recording successfully', async () => {
      const recorderName = `NovaConfigRecorder-${REGION}`;
      const { ConfigurationRecordersStatus } = await configClient.send(
        new DescribeConfigurationRecorderStatusCommand({
          ConfigurationRecorderNames: [recorderName],
        })
      );

      expect(ConfigurationRecordersStatus).toBeDefined();
      expect(ConfigurationRecordersStatus!).toHaveLength(1);

      const status = ConfigurationRecordersStatus![0];
      expect(status.name).toBe(recorderName);
      expect(status.recording).toBe(true);
      expect(status.lastStatus).toBe('SUCCESS');
    });

    test('Required AWS Config rules should exist', async () => {
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

    test('Custom Lambda function for starting Config should exist', async () => {
      const functionName = `StartConfigRecorder-${REGION}-${outputs!.EnvironmentSuffix}`;
      const { Configuration } = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(Configuration).toBeDefined();
      expect(Configuration!.Runtime).toBe('python3.9');
    });
  });
});
