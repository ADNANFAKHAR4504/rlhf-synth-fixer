import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeAddonCommand,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  EKSClient,
  ListAddonsCommand,
  ListNodegroupsCommand,
} from '@aws-sdk/client-eks';
import {
  IAMClient
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

describe('EKS Cluster Integration Tests', () => {
  let outputs: any;
  let eksClient: EKSClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let logsClient: CloudWatchLogsClient;
  let clusterName: string;
  let vpcId: string;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Parse JSON strings to objects/arrays if needed
    if (typeof outputs.nodeGroupArns === 'string') {
      outputs.nodeGroupArns = JSON.parse(outputs.nodeGroupArns);
    }
    if (typeof outputs.kubeconfig === 'string') {
      outputs.kubeconfig = JSON.parse(outputs.kubeconfig);
    }

    const region = process.env.AWS_REGION || 'us-east-1';
    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
    logsClient = new CloudWatchLogsClient({ region });

    clusterName = outputs.clusterName;
    vpcId = outputs.vpcId;

    if (!clusterName || !vpcId) {
      throw new Error('Required outputs (clusterName, vpcId) not found in flat-outputs.json');
    }
  });

  afterAll(() => {
    eksClient.destroy();
    ec2Client.destroy();
    iamClient.destroy();
    logsClient.destroy();
  });

  describe('VPC Configuration', () => {
    it('should have VPC created', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(vpcId);
    });

    it('should have 6 subnets (3 public + 3 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(6);
    });

    it('should have subnets in multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets?.map((subnet) => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('EKS Cluster', () => {
    it('should have cluster created and active', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      expect(response.cluster).toBeDefined();
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.name).toBe(clusterName);
    });

    it('should have Kubernetes version 1.28 or higher', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      const version = response.cluster?.version;
      expect(version).toBeDefined();

      const versionNumber = parseFloat(version!);
      expect(versionNumber).toBeGreaterThanOrEqual(1.28);
    });

    it('should have all control plane logging enabled', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      const logging = response.cluster?.logging?.clusterLogging;

      expect(logging).toBeDefined();
      const enabledLogs = logging?.[0]?.types || [];

      expect(enabledLogs).toContain('api');
      expect(enabledLogs).toContain('audit');
      expect(enabledLogs).toContain('authenticator');
      expect(enabledLogs).toContain('controllerManager');
      expect(enabledLogs).toContain('scheduler');
    });

    it('should have OIDC provider configured', async () => {
      const describeCommand = new DescribeClusterCommand({
        name: clusterName,
      });

      const clusterResponse = await eksClient.send(describeCommand);
      const oidcIssuer = clusterResponse.cluster?.identity?.oidc?.issuer;

      expect(oidcIssuer).toBeDefined();
      expect(oidcIssuer).toContain('https://');

      // Extract OIDC provider ARN from issuer
      const oidcId = oidcIssuer?.split('/').pop();
      expect(oidcId).toBeDefined();
    });

    it('should have both public and private subnet configuration', async () => {
      const command = new DescribeClusterCommand({
        name: clusterName,
      });

      const response = await eksClient.send(command);
      const resourcesVpcConfig = response.cluster?.resourcesVpcConfig;

      expect(resourcesVpcConfig?.subnetIds).toBeDefined();
      // Should have at least 6 subnets (3 public + 3 private) for HA
      expect(resourcesVpcConfig?.subnetIds?.length).toBeGreaterThanOrEqual(6);
      expect(resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
      expect(resourcesVpcConfig?.endpointPublicAccess).toBe(true);
    });
  });

  describe('Node Groups', () => {
    it('should have two node groups', async () => {
      const command = new ListNodegroupsCommand({
        clusterName,
      });

      const response = await eksClient.send(command);
      expect(response.nodegroups).toBeDefined();
      expect(response.nodegroups?.length).toBeGreaterThanOrEqual(2);
    });

    it('should have general workload node group with c7g.large', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      const generalNodeGroup = listResponse.nodegroups?.find((ng) =>
        ng.includes('general')
      );

      expect(generalNodeGroup).toBeDefined();

      const describeCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: generalNodeGroup,
      });

      const response = await eksClient.send(describeCommand);
      expect(response.nodegroup?.instanceTypes).toContain('c7g.large');
      expect(response.nodegroup?.capacityType).toBe('ON_DEMAND');
      expect(response.nodegroup?.amiType).toBe('AL2_ARM_64');
    });

    it('should have batch workload node group with c7g.xlarge spot', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      const batchNodeGroup = listResponse.nodegroups?.find((ng) =>
        ng.includes('batch')
      );

      expect(batchNodeGroup).toBeDefined();

      const describeCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: batchNodeGroup,
      });

      const response = await eksClient.send(describeCommand);
      expect(response.nodegroup?.instanceTypes).toContain('c7g.xlarge');
      expect(response.nodegroup?.capacityType).toBe('SPOT');
      expect(response.nodegroup?.amiType).toBe('AL2_ARM_64');
    });

    it('should have node groups with scaling configuration', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);

      for (const nodegroupName of listResponse.nodegroups || []) {
        const describeCommand = new DescribeNodegroupCommand({
          clusterName,
          nodegroupName,
        });

        const response = await eksClient.send(describeCommand);
        const scalingConfig = response.nodegroup?.scalingConfig;

        expect(scalingConfig).toBeDefined();
        expect(scalingConfig?.minSize).toBeGreaterThanOrEqual(2);
        expect(scalingConfig?.maxSize).toBeLessThanOrEqual(10);
        expect(scalingConfig?.desiredSize).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have batch node group with taint', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      const batchNodeGroup = listResponse.nodegroups?.find((ng) =>
        ng.includes('batch')
      );

      expect(batchNodeGroup).toBeDefined();

      const describeCommand = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: batchNodeGroup,
      });

      const response = await eksClient.send(describeCommand);
      const taints = response.nodegroup?.taints;

      expect(taints).toBeDefined();
      expect(taints?.length).toBeGreaterThan(0);

      const workloadTaint = taints?.find((t) => t.key === 'workload');
      expect(workloadTaint).toBeDefined();
      expect(workloadTaint?.value).toBe('batch');
      expect(workloadTaint?.effect).toBe('NO_SCHEDULE');
    });
  });

  describe('EKS Addons', () => {
    it('should have CoreDNS addon installed', async () => {
      const command = new DescribeAddonCommand({
        clusterName,
        addonName: 'coredns',
      });

      const response = await eksClient.send(command);
      expect(response.addon).toBeDefined();
      expect(response.addon?.addonName).toBe('coredns');
      expect(response.addon?.status).toMatch(/ACTIVE|CREATING|UPDATING/);
    });

    it('should have kube-proxy addon installed', async () => {
      const command = new DescribeAddonCommand({
        clusterName,
        addonName: 'kube-proxy',
      });

      const response = await eksClient.send(command);
      expect(response.addon).toBeDefined();
      expect(response.addon?.addonName).toBe('kube-proxy');
      expect(response.addon?.status).toMatch(/ACTIVE|CREATING|UPDATING/);
    });

    it('should have VPC CNI addon installed', async () => {
      const command = new DescribeAddonCommand({
        clusterName,
        addonName: 'vpc-cni',
      });

      const response = await eksClient.send(command);
      expect(response.addon).toBeDefined();
      expect(response.addon?.addonName).toBe('vpc-cni');
      expect(response.addon?.status).toMatch(/ACTIVE|CREATING|UPDATING/);
    });

    it('should have EBS CSI driver addon installed', async () => {
      const command = new DescribeAddonCommand({
        clusterName,
        addonName: 'aws-ebs-csi-driver',
      });

      const response = await eksClient.send(command);
      expect(response.addon).toBeDefined();
      expect(response.addon?.addonName).toBe('aws-ebs-csi-driver');
      expect(response.addon?.status).toMatch(/ACTIVE|CREATING|UPDATING/);
    });

    it('should list all expected addons', async () => {
      const command = new ListAddonsCommand({
        clusterName,
      });

      const response = await eksClient.send(command);
      expect(response.addons).toBeDefined();

      const addons = response.addons || [];
      expect(addons).toContain('coredns');
      expect(addons).toContain('kube-proxy');
      expect(addons).toContain('vpc-cni');
      expect(addons).toContain('aws-ebs-csi-driver');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have CloudWatch log group for cluster', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/eks/${clusterName}`,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const clusterLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(clusterName)
      );
      expect(clusterLogGroup).toBeDefined();
    });

    it('should have log retention configured to 90 days for compliance', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/eks/${clusterName}`,
      });

      const response = await logsClient.send(command);
      const clusterLogGroup = response.logGroups?.find((lg) =>
        lg.logGroupName?.includes(clusterName)
      );

      expect(clusterLogGroup?.retentionInDays).toBeDefined();
      expect(clusterLogGroup?.retentionInDays).toBe(90);
    });
  });

  describe('Resource Naming', () => {
    it('should have environmentSuffix in cluster name', () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(clusterName).toContain(environmentSuffix);
    });

    it('should have environmentSuffix in VPC ID tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      const envSuffixTag = vpc?.Tags?.find((tag) => tag.Key === 'EnvironmentSuffix');
      expect(envSuffixTag).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterOidcIssuer).toBeDefined();
      expect(outputs.kubeconfig).toBeDefined();
      expect(outputs.clusterSecurityGroupId).toBeDefined();
      expect(outputs.nodeGroupArns).toBeDefined();
    });

    it('should have valid cluster endpoint URL', () => {
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.clusterEndpoint).toContain('eks.amazonaws.com');
    });

    it('should have valid OIDC issuer URL', () => {
      expect(outputs.clusterOidcIssuer).toMatch(/^https:\/\//);
      expect(outputs.clusterOidcIssuer).toContain('oidc.eks');
    });

    it('should have valid kubeconfig structure', () => {
      const kubeconfig = outputs.kubeconfig;

      expect(kubeconfig).toHaveProperty('apiVersion');
      expect(kubeconfig).toHaveProperty('clusters');
      expect(kubeconfig).toHaveProperty('contexts');
      expect(kubeconfig).toHaveProperty('users');
      expect(kubeconfig).toHaveProperty('current-context');

      expect(kubeconfig.apiVersion).toBe('v1');
      expect(kubeconfig.clusters).toHaveLength(1);
      expect(kubeconfig.contexts).toHaveLength(1);
      expect(kubeconfig.users).toHaveLength(1);
    });

    it('should have node group ARNs array', () => {
      // Parse the JSON string to array
      const nodeGroupArns = typeof outputs.nodeGroupArns === 'string'
        ? JSON.parse(outputs.nodeGroupArns)
        : outputs.nodeGroupArns;

      expect(Array.isArray(nodeGroupArns)).toBe(true);
      expect(nodeGroupArns.length).toBeGreaterThanOrEqual(2);

      nodeGroupArns.forEach((arn: string) => {
        expect(arn).toContain('arn:aws:eks');
        expect(arn).toContain('nodegroup');
      });
    });
  });
});
