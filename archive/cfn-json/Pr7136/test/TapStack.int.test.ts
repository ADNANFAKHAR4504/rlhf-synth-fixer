import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeVpcEndpointsCommand, DescribeFlowLogsCommand } from '@aws-sdk/client-ec2';
import { KMSClient, GetKeyRotationStatusCommand, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { S3Client, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { ConfigServiceClient, DescribeConfigurationRecordersCommand, DescribeConfigRulesCommand } from '@aws-sdk/client-config-service';
import { NetworkFirewallClient, DescribeFirewallCommand } from '@aws-sdk/client-network-firewall';

describe('Zero-Trust Security Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  const region = process.env.AWS_REGION || 'us-east-1';
  const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'synth101912586'}`;

  let cfnClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let kmsClient: KMSClient;
  let s3Client: S3Client;
  let iamClient: IAMClient;
  let configClient: ConfigServiceClient;
  let networkFirewallClient: NetworkFirewallClient;

  beforeAll(async () => {
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    ec2Client = new EC2Client({ region });
    kmsClient = new KMSClient({ region });
    s3Client = new S3Client({ region });
    iamClient = new IAMClient({ region });
    configClient = new ConfigServiceClient({ region });
    networkFirewallClient = new NetworkFirewallClient({ region });

    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Ensure deployment completed successfully.`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  afterAll(async () => {
    // Cleanup clients
    cfnClient.destroy();
    ec2Client.destroy();
    kmsClient.destroy();
    s3Client.destroy();
    iamClient.destroy();
    configClient.destroy();
    networkFirewallClient.destroy();
  });

  describe('CloudFormation Stack', () => {
    test('should have stack deployed successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all expected outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnetAZ1Id).toBeDefined();
      expect(outputs.PrivateSubnetAZ2Id).toBeDefined();
      expect(outputs.PrivateSubnetAZ3Id).toBeDefined();
      expect(outputs.NetworkFirewallArn).toBeDefined();
      expect(outputs.EBSKMSKeyArn).toBeDefined();
      expect(outputs.S3KMSKeyArn).toBeDefined();
      expect(outputs.RDSKMSKeyArn).toBeDefined();
      expect(outputs.EC2InstanceRoleArn).toBeDefined();
      expect(outputs.EC2InstanceProfileArn).toBeDefined();
      expect(outputs.VPCFlowLogsBucketName).toBeDefined();
      expect(outputs.ConfigBucketName).toBeDefined();
    });
  });

  describe('VPC and Network Configuration', () => {
    test('should have VPC with DNS enabled', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      // Check DNS attributes using describe-vpc-attribute
      const { DescribeVpcAttributeCommand } = require('@aws-sdk/client-ec2');

      const dnsHostnamesCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResp = await ec2Client.send(dnsHostnamesCmd);
      expect(dnsHostnamesResp.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResp = await ec2Client.send(dnsSupportCmd);
      expect(dnsSupportResp.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have private subnets in different AZs', async () => {
      const subnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id,
      ];

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test('should have VPC Flow Logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      expect(response.FlowLogs![0].TrafficType).toBe('ALL');
    });
  });

  describe('Network Firewall', () => {
    test('should have Network Firewall deployed and active', async () => {
      const command = new DescribeFirewallCommand({
        FirewallArn: outputs.NetworkFirewallArn,
      });
      const response = await networkFirewallClient.send(command);

      expect(response.Firewall).toBeDefined();
      expect(response.Firewall!.FirewallPolicyArn).toBeDefined();
      expect(response.Firewall!.SubnetMappings).toBeDefined();
      expect(response.Firewall!.SubnetMappings!.length).toBe(3);
    });
  });

  describe('KMS Keys', () => {
    test('should have EBS KMS key with rotation enabled', async () => {
      const keyId = outputs.EBSKMSKeyArn.split('/')[1];
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('should have S3 KMS key with rotation enabled', async () => {
      const keyId = outputs.S3KMSKeyArn.split('/')[1];
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('should have RDS KMS key with rotation enabled', async () => {
      const keyId = outputs.RDSKMSKeyArn.split('/')[1];
      const command = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    });

    test('all KMS keys should be enabled', async () => {
      const keyArns = [
        outputs.EBSKMSKeyArn,
        outputs.S3KMSKeyArn,
        outputs.RDSKMSKeyArn,
      ];

      for (const arn of keyArns) {
        const keyId = arn.split('/')[1];
        const command = new DescribeKeyCommand({ KeyId: keyId });
        const response = await kmsClient.send(command);

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      }
    });
  });

  describe('S3 Buckets', () => {
    test('VPC Flow Logs bucket should have encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.VPCFlowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('VPC Flow Logs bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.VPCFlowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test('Config bucket should have encryption', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.ConfigBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('Config bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.ConfigBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('EC2 Instance Role should exist and have SSM policy', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toContain('ec2-instance-role');
    });
  });

  describe('AWS Config', () => {
    test('should have Config Recorder configured', async () => {
      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigurationRecorders).toBeDefined();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);

      const recorder = response.ConfigurationRecorders!.find(r =>
        r.name && r.name.includes(process.env.ENVIRONMENT_SUFFIX || 'synth101912586')
      );
      expect(recorder).toBeDefined();
      expect(recorder!.recordingGroup).toBeDefined();
      expect(recorder!.recordingGroup!.allSupported).toBe(true);
    });

    test('should have Config Rules deployed', async () => {
      const command = new DescribeConfigRulesCommand({});
      const response = await configClient.send(command);

      expect(response.ConfigRules).toBeDefined();
      expect(response.ConfigRules!.length).toBeGreaterThan(0);

      const encryptedVolumesRule = response.ConfigRules!.find(r =>
        r.ConfigRuleName && r.ConfigRuleName.includes('encrypted-volumes')
      );
      expect(encryptedVolumesRule).toBeDefined();

      const passwordPolicyRule = response.ConfigRules!.find(r =>
        r.ConfigRuleName && r.ConfigRuleName.includes('iam-password-policy')
      );
      expect(passwordPolicyRule).toBeDefined();
    });
  });

  describe('Systems Manager VPC Endpoints', () => {
    test('should have SSM VPC endpoints deployed', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);

      const ssmEndpoints = response.VpcEndpoints!.filter(e =>
        e.ServiceName && (
          e.ServiceName.includes('.ssm') ||
          e.ServiceName.includes('.ssmmessages') ||
          e.ServiceName.includes('.ec2messages')
        )
      );

      expect(ssmEndpoints.length).toBeGreaterThanOrEqual(3);

      for (const endpoint of ssmEndpoints) {
        expect(endpoint.VpcEndpointType).toBe('Interface');
        expect(endpoint.PrivateDnsEnabled).toBe(true);
      }
    });
  });

  describe('Security Validations', () => {
    test('should not have any internet gateways attached to VPC', async () => {
      const command = new DescribeStackResourcesCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const igw = response.StackResources?.find(r =>
        r.ResourceType === 'AWS::EC2::InternetGateway'
      );

      expect(igw).toBeUndefined();
    });

    test('should not have GuardDuty detector in stack', async () => {
      const command = new DescribeStackResourcesCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      const guardduty = response.StackResources?.find(r =>
        r.ResourceType === 'AWS::GuardDuty::Detector'
      );

      expect(guardduty).toBeUndefined();
    });
  });
});
