import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr7338';
const region = process.env.AWS_REGION || 'us-east-2';

const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
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

    it('should have encryption config enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.encryptionConfig).toBeDefined();
      expect(response.cluster?.encryptionConfig?.length).toBeGreaterThan(0);
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

  describe('EKS Node Group Validation', () => {
    const nodeGroupName = `eks-nodes-${environmentSuffix}`;

    it('should have node group deployed and active', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup?.status).toBe('ACTIVE');
    });

    it('should have correct scaling configuration', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup?.scalingConfig?.minSize).toBe(3);
      expect(response.nodegroup?.scalingConfig?.maxSize).toBe(15);
      expect(response.nodegroup?.scalingConfig?.desiredSize).toBeGreaterThanOrEqual(3);
    });

    it('should use correct instance type', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup?.instanceTypes).toContain('t3.large');
    });

    it('should have nodes in private subnets', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup?.subnets?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('VPC Configuration Validation', () => {
    it('should have VPC with correct CIDR', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`eks-vpc-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

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

  describe('VPC Endpoints Validation', () => {
    it('should have S3 VPC endpoint', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`s3-endpoint-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.length).toBe(1);
      expect(response.VpcEndpoints?.[0].State).toBe('available');
    });

    it('should have ECR API VPC endpoint', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`ecr-api-endpoint-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.length).toBe(1);
      expect(response.VpcEndpoints?.[0].State).toBe('available');
    });

    it('should have ECR DKR VPC endpoint', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`ecr-dkr-endpoint-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints?.length).toBe(1);
      expect(response.VpcEndpoints?.[0].State).toBe('available');
    });
  });

  describe('Security Groups Validation', () => {
    it('should have EKS cluster security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`eks-cluster-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups?.length).toBe(1);
    });

    it('should have EKS node security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`eks-nodes-sg-${environmentSuffix}`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups?.length).toBe(1);
    });
  });

  describe('IAM Roles Validation', () => {
    it('should have cluster autoscaler IAM role', async () => {
      const roleName = `cluster-autoscaler-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have ALB controller IAM role', async () => {
      const roleName = `alb-controller-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have EBS CSI driver IAM role', async () => {
      const roleName = `ebs-csi-driver-${environmentSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
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
