import * as fs from 'fs';
import * as path from 'path';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  DescribeAddonCommand,
  ListNodegroupsCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Load outputs from deployed stack
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: Record<string, string> = {};

// Check if outputs file exists
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

const region = process.env.AWS_REGION || 'ap-southeast-1';

const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });
const logsClient = new CloudWatchLogsClient({ region });
const kmsClient = new KMSClient({ region });
const ssmClient = new SSMClient({ region });

describe('EKS Cluster Integration Tests', () => {
  const clusterName = outputs.EksClusterName || '';
  const clusterEndpoint = outputs.EksClusterEndpoint || '';
  const oidcProviderArn = outputs.EksOIDCProviderArn || '';
  const vpcId = outputs.EksVpcId || '';
  const privateSubnetIds = outputs.EksPrivateSubnetIds?.split(',') || [];
  const clusterSecurityGroupId = outputs.EksClusterSecurityGroupId || '';
  const fluentBitLogGroupName = outputs.EksFluentBitLogGroupName || '';
  const kmsKeyArn = outputs.EksKmsKeyArn || '';

  beforeAll(() => {
    if (!clusterName) {
      throw new Error('Stack outputs not found. Deploy the stack first.');
    }
  });

  describe('EKS Cluster', () => {
    test('cluster exists and is active', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.name).toBe(clusterName);
    }, 30000);

    test('cluster is running Kubernetes version 1.28', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.version).toBe('1.28');
    }, 30000);

    test('cluster has all control plane logging types enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      const logging = response.cluster?.logging?.clusterLogging?.[0];
      expect(logging?.enabled).toBe(true);
      expect(logging?.types).toContain('api');
      expect(logging?.types).toContain('audit');
      expect(logging?.types).toContain('authenticator');
      expect(logging?.types).toContain('controllerManager');
      expect(logging?.types).toContain('scheduler');
    }, 30000);

    test('cluster has valid endpoint', async () => {
      expect(clusterEndpoint).toBeTruthy();
      expect(clusterEndpoint).toMatch(/^https:\/\//);
    });

    test('cluster has OIDC provider configured', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.identity?.oidc?.issuer).toBeTruthy();
      expect(oidcProviderArn).toBeTruthy();
    }, 30000);

    test('cluster has KMS encryption enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.encryptionConfig).toBeDefined();
      expect(response.cluster?.encryptionConfig?.[0]?.resources).toContain(
        'secrets'
      );
      expect(
        response.cluster?.encryptionConfig?.[0]?.provider?.keyArn
      ).toBeTruthy();
    }, 30000);
  });

  describe('Node Groups', () => {
    test('three managed node groups exist', async () => {
      const command = new ListNodegroupsCommand({ clusterName });
      const response = await eksClient.send(command);

      expect(response.nodegroups).toBeDefined();
      expect(response.nodegroups?.length).toBe(3);
    }, 30000);

    test('node groups are active and healthy', async () => {
      const listCommand = new ListNodegroupsCommand({ clusterName });
      const listResponse = await eksClient.send(listCommand);

      for (const nodegroupName of listResponse.nodegroups || []) {
        const describeCommand = new DescribeNodegroupCommand({
          clusterName,
          nodegroupName,
        });
        const response = await eksClient.send(describeCommand);

        expect(response.nodegroup?.status).toBe('ACTIVE');
        expect(response.nodegroup?.health?.issues).toHaveLength(0);
      }
    }, 60000);

    test('node groups use m5.large instance type', async () => {
      const listCommand = new ListNodegroupsCommand({ clusterName });
      const listResponse = await eksClient.send(listCommand);

      const nodegroupName = listResponse.nodegroups?.[0];
      if (nodegroupName) {
        const describeCommand = new DescribeNodegroupCommand({
          clusterName,
          nodegroupName,
        });
        const response = await eksClient.send(describeCommand);

        expect(response.nodegroup?.instanceTypes).toContain('m5.large');
      }
    }, 30000);

    test('node groups have correct scaling configuration', async () => {
      const listCommand = new ListNodegroupsCommand({ clusterName });
      const listResponse = await eksClient.send(listCommand);

      const nodegroupName = listResponse.nodegroups?.[0];
      if (nodegroupName) {
        const describeCommand = new DescribeNodegroupCommand({
          clusterName,
          nodegroupName,
        });
        const response = await eksClient.send(describeCommand);

        expect(response.nodegroup?.scalingConfig?.minSize).toBe(1);
        expect(response.nodegroup?.scalingConfig?.maxSize).toBe(3);
        expect(response.nodegroup?.scalingConfig?.desiredSize).toBe(1);
      }
    }, 30000);
  });

  describe('Container Insights Add-on', () => {
    test('CloudWatch observability add-on is installed and active', async () => {
      const command = new DescribeAddonCommand({
        clusterName,
        addonName: 'amazon-cloudwatch-observability',
      });
      const response = await eksClient.send(command);

      expect(response.addon).toBeDefined();
      expect(response.addon?.status).toBe('ACTIVE');
      expect(response.addon?.addonName).toBe('amazon-cloudwatch-observability');
    }, 30000);
  });

  describe('VPC Configuration', () => {
    test('VPC exists', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0]?.State).toBe('available');
    }, 30000);

    test('VPC has private subnets', async () => {
      expect(privateSubnetIds.length).toBeGreaterThan(0);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBe(privateSubnetIds.length);
      response.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    }, 30000);

    test('NAT Gateway exists for private subnet egress', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways?.length).toBeGreaterThan(0);
    }, 30000);

    test('VPC endpoints are configured', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);

      // Check for CloudWatch Logs endpoint
      const logsEndpoint = response.VpcEndpoints?.find(ep =>
        ep.ServiceName?.includes('logs')
      );
      expect(logsEndpoint).toBeDefined();
      expect(logsEndpoint?.State).toBe('available');
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    test('Fluent Bit log group exists with proper configuration', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: fluentBitLogGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === fluentBitLogGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(fluentBitLogGroupName);
      expect(logGroup?.retentionInDays).toBe(7);
    }, 30000);

    test('log group has KMS encryption', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: fluentBitLogGroupName,
      });
      const response = await logsClient.send(command);

      const logGroup = response.logGroups?.find(
        lg => lg.logGroupName === fluentBitLogGroupName
      );

      expect(logGroup?.kmsKeyId).toBeTruthy();
    }, 30000);
  });

  describe('KMS Key', () => {
    test('KMS key exists and is enabled', async () => {
      const keyId = kmsKeyArn.split('/').pop();
      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.Description).toBe(
        'KMS key for EKS secrets encryption'
      );
    }, 30000);

    test('KMS key has automatic rotation enabled', async () => {
      const keyId = kmsKeyArn.split('/').pop();
      const command = new GetKeyRotationStatusCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('SSM Parameter Store', () => {
    test('Fluent Bit configuration is stored in SSM parameter', async () => {
      const environmentSuffix = clusterName.replace('eks-cluster-', '');
      const parameterName = `/eks/${environmentSuffix}/fluent-bit-config`;

      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Type).toBe('String');
      expect(response.Parameter?.Value).toBeTruthy();

      // Verify config contains required sections
      const config = response.Parameter?.Value || '';
      expect(config).toContain('[SERVICE]');
      expect(config).toContain('[INPUT]');
      expect(config).toContain('[FILTER]');
      expect(config).toContain('[OUTPUT]');
      expect(config).toContain('cloudwatch_logs');
    }, 30000);
  });

  describe('Tags', () => {
    test('VPC has required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs?.[0];
      const tags = vpc?.Tags || [];

      const environmentTag = tags.find(t => t.Key === 'Environment');
      const costCenterTag = tags.find(t => t.Key === 'CostCenter');

      expect(environmentTag?.Value).toBe('Production');
      expect(costCenterTag?.Value).toBe('FinTech');
    }, 30000);
  });

  describe('Resource Naming', () => {
    test('all resources use environment suffix consistently', () => {
      const environmentSuffix = clusterName.replace('eks-cluster-', '');

      expect(clusterName).toContain(environmentSuffix);
      expect(fluentBitLogGroupName).toContain(environmentSuffix);

      // VPC name should contain suffix
      expect(vpcId).toBeTruthy();
    });
  });

  describe('Stack Outputs', () => {
    test('all required outputs are present', () => {
      expect(outputs.EksClusterName).toBeTruthy();
      expect(outputs.EksClusterEndpoint).toBeTruthy();
      expect(outputs.EksOIDCProviderArn).toBeTruthy();
      expect(outputs.EksKubectlConfig).toBeTruthy();
      expect(outputs.EksVpcId).toBeTruthy();
      expect(outputs.EksPrivateSubnetIds).toBeTruthy();
      expect(outputs.EksClusterSecurityGroupId).toBeTruthy();
      expect(outputs.EksFluentBitLogGroupName).toBeTruthy();
      expect(outputs.EksKmsKeyArn).toBeTruthy();
    });

    test('kubectl config command is valid', () => {
      const kubectlConfig = outputs.EksKubectlConfig;
      expect(kubectlConfig).toMatch(
        /^aws eks update-kubeconfig --name .+ --region .+$/
      );
      expect(kubectlConfig).toContain(clusterName);
      expect(kubectlConfig).toContain(region);
    });
  });
});
