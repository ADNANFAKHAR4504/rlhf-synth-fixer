import {
  EKSClient,
  DescribeClusterCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr7338';
const region = process.env.AWS_REGION || 'us-east-2';

const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });

describe('EKS Infrastructure Integration Tests', () => {
  const clusterName = `eks-cluster-${environmentSuffix}`;

  describe('EKS Cluster Validation', () => {
    it('should have EKS cluster deployed and active', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.name).toBe(clusterName);
      expect(response.cluster?.status).toBe('ACTIVE');
    });

    it('should have correct Kubernetes version', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.version).toMatch(/^1\.\d+$/);
    });

    it('should have OIDC identity provider configured', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.identity?.oidc?.issuer).toBeDefined();
      expect(response.cluster?.identity?.oidc?.issuer).toContain('oidc.eks');
    });

    it('should have cluster logging enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      const enabledLogTypes = response.cluster?.logging?.clusterLogging
        ?.filter(log => log.enabled)
        ?.flatMap(log => log.types || []);

      expect(enabledLogTypes).toContain('api');
      expect(enabledLogTypes).toContain('audit');
      expect(enabledLogTypes).toContain('authenticator');
    });
  });

  describe('VPC Configuration Validation', () => {
    it('should have private subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`eks-private-*-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBeGreaterThanOrEqual(3);

      const azs = new Set(response.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('CloudWatch Logs Validation', () => {
    it('should have EKS cluster log group', async () => {
      const logGroupName = `/aws/eks/${clusterName}/cluster`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });
  });
});
