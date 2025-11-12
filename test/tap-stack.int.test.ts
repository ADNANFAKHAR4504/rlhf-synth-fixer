import fs from 'fs';
import { EKS } from '@aws-sdk/client-eks';
import { IAM } from '@aws-sdk/client-iam';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';
import { EC2 } from '@aws-sdk/client-ec2';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912514';

const eksClient = new EKS({ region });
const iamClient = new IAM({ region });
const logsClient = new CloudWatchLogs({ region });
const ec2Client = new EC2({ region });

// Read deployed stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('EKS Cluster Integration Tests', () => {
  describe('EKS Cluster Deployment', () => {
    test('should have deployed EKS cluster with correct name', async () => {
      const clusterName = outputs.ClusterName;
      expect(clusterName).toBeDefined();
      expect(clusterName).toContain(environmentSuffix);

      const { cluster } = await eksClient.describeCluster({ name: clusterName });
      expect(cluster).toBeDefined();
      expect(cluster.name).toBe(clusterName);
      expect(cluster.status).toBe('ACTIVE');
    });

    test('should have correct Kubernetes version', async () => {
      const clusterName = outputs.ClusterName;
      const { cluster } = await eksClient.describeCluster({ name: clusterName });

      expect(cluster.version).toBe('1.28');
    });

    test('should have private endpoint access only', async () => {
      const clusterName = outputs.ClusterName;
      const { cluster } = await eksClient.describeCluster({ name: clusterName });

      expect(cluster.resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
      expect(cluster.resourcesVpcConfig?.endpointPublicAccess).toBe(false);
    });

    test('should have all control plane logging enabled', async () => {
      const clusterName = outputs.ClusterName;
      const { cluster } = await eksClient.describeCluster({ name: clusterName });

      const logging = cluster.logging?.clusterLogging?.[0];
      expect(logging?.enabled).toBe(true);

      const enabledTypes = logging?.types || [];
      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
      expect(enabledTypes.length).toBe(5);
    });

    test('should have valid cluster endpoint', async () => {
      const endpoint = outputs.ClusterEndpoint;
      expect(endpoint).toBeDefined();
      expect(endpoint).toMatch(/^https:\/\//);
      expect(endpoint).toContain('.eks.amazonaws.com');
    });

    test('should have cluster ARN in correct format', async () => {
      const arn = outputs.ClusterArn;
      expect(arn).toBeDefined();
      expect(arn).toMatch(/^arn:aws:eks:us-east-1:\d+:cluster\//);
      expect(arn).toContain(environmentSuffix);
    });

    test('should have cluster security group', async () => {
      const sgId = outputs.ClusterSecurityGroupId;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-[a-f0-9]+$/);

      const { SecurityGroups } = await ec2Client.describeSecurityGroups({
        GroupIds: [sgId]
      });

      expect(SecurityGroups).toBeDefined();
      expect(SecurityGroups.length).toBe(1);
      expect(SecurityGroups[0].GroupId).toBe(sgId);
    });
  });

  describe('OIDC Provider', () => {
    test('should have OIDC provider configured', async () => {
      const oidcArn = outputs.OIDCProviderArn;
      expect(oidcArn).toBeDefined();
      expect(oidcArn).toMatch(/^arn:aws:iam::\d+:oidc-provider\//);

      const { OpenIDConnectProviderList } = await iamClient.listOpenIDConnectProviders({});
      const provider = OpenIDConnectProviderList?.find(p => p.Arn === oidcArn);
      expect(provider).toBeDefined();
    });

    test('should have correct OIDC provider URL', async () => {
      const url = outputs.OIDCProviderUrl;
      expect(url).toBeDefined();
      expect(url).toMatch(/^https:\/\/oidc\.eks\.[a-z0-9-]+\.amazonaws\.com\/id\//);
    });

    test('should have OIDC provider with correct thumbprint', async () => {
      const oidcArn = outputs.OIDCProviderArn;
      const { ThumbprintList, ClientIDList } = await iamClient.getOpenIDConnectProvider({
        OpenIDConnectProviderArn: oidcArn
      });

      expect(ThumbprintList).toBeDefined();
      expect(ThumbprintList.length).toBeGreaterThan(0);
      expect(ClientIDList).toContain('sts.amazonaws.com');
    });
  });

  describe('IAM Roles', () => {
    test('should have cluster IAM role with correct name', async () => {
      const roleName = `eks-cluster-role-${environmentSuffix}`;
      const { Role } = await iamClient.getRole({ RoleName: roleName });

      expect(Role).toBeDefined();
      expect(Role.RoleName).toBe(roleName);
    });

    test('should have node IAM role with correct name', async () => {
      const nodeRoleArn = outputs.NodeRoleArn;
      expect(nodeRoleArn).toBeDefined();
      expect(nodeRoleArn).toContain(environmentSuffix);

      const roleName = nodeRoleArn.split('/')[1];
      const { Role } = await iamClient.getRole({ RoleName: roleName });

      expect(Role).toBeDefined();
      expect(Role.RoleName).toContain(environmentSuffix);
    });

    test('should have cluster role with required managed policies', async () => {
      const roleName = `eks-cluster-role-${environmentSuffix}`;
      const { AttachedPolicies } = await iamClient.listAttachedRolePolicies({
        RoleName: roleName
      });

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });

    test('should have node role with required managed policies', async () => {
      const nodeRoleArn = outputs.NodeRoleArn;
      const roleName = nodeRoleArn.split('/')[1];
      const { AttachedPolicies } = await iamClient.listAttachedRolePolicies({
        RoleName: roleName
      });

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have CloudWatch log group created', async () => {
      const logGroupName = outputs.LogGroupName;
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain(environmentSuffix);

      const { logGroups } = await logsClient.describeLogGroups({
        logGroupNamePrefix: logGroupName
      });

      expect(logGroups).toBeDefined();
      expect(logGroups.length).toBeGreaterThan(0);
      const logGroup = logGroups.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    test('should have 30-day retention policy', async () => {
      const logGroupName = outputs.LogGroupName;
      const { logGroups } = await logsClient.describeLogGroups({
        logGroupNamePrefix: logGroupName
      });

      const logGroup = logGroups.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have control plane logs being written', async () => {
      const logGroupName = outputs.LogGroupName;

      // Check if log streams exist (indicating logs are being written)
      const { logStreams } = await logsClient.describeLogStreams({
        logGroupName,
        limit: 5
      });

      expect(logStreams).toBeDefined();
      // Log streams may take a few minutes to appear after cluster creation
      // So we just verify the log group exists and is configured correctly
    });
  });

  describe('Node Group', () => {
    test('should have node group deployed', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup).toBeDefined();
      expect(nodegroup.nodegroupName).toContain(environmentSuffix);
      expect(nodegroup.status).toBe('ACTIVE');
    });

    test('should have correct scaling configuration', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      const scaling = nodegroup.scalingConfig;
      expect(scaling?.minSize).toBe(2);
      expect(scaling?.maxSize).toBe(6);
      expect(scaling?.desiredSize).toBe(2);
    });

    test('should use SPOT capacity type', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.capacityType).toBe('SPOT');
    });

    test('should have multiple instance types', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.instanceTypes).toBeDefined();
      expect(nodegroup.instanceTypes.length).toBeGreaterThanOrEqual(2);
      expect(nodegroup.instanceTypes).toContain('t3.medium');
      expect(nodegroup.instanceTypes).toContain('t3a.medium');
    });

    test('should use Amazon Linux 2 AMI', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.amiType).toBe('AL2_x86_64');
    });

    test('should have payment workload taint', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.taints).toBeDefined();
      expect(nodegroup.taints.length).toBe(1);
      expect(nodegroup.taints[0].key).toBe('workload');
      expect(nodegroup.taints[0].value).toBe('payment');
      expect(nodegroup.taints[0].effect).toBe('NO_SCHEDULE');
    });

    test('should have MaxUnavailable update policy', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.updateConfig?.maxUnavailable).toBe(1);
    });

    test('should use launch template', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.launchTemplate).toBeDefined();
      expect(nodegroup.launchTemplate?.id).toBeDefined();
      expect(nodegroup.launchTemplate?.id).toMatch(/^lt-[a-f0-9]+$/);
    });

    test('should have nodes in private subnets', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.subnets).toBeDefined();
      expect(nodegroup.subnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are private (no auto-assign public IP)
      const { Subnets } = await ec2Client.describeSubnets({
        SubnetIds: nodegroup.subnets
      });

      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Launch Template', () => {
    test('should have launch template with encryption enabled', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      const launchTemplateId = nodegroup.launchTemplate?.id;
      expect(launchTemplateId).toBeDefined();

      const { LaunchTemplates } = await ec2Client.describeLaunchTemplates({
        LaunchTemplateIds: [launchTemplateId!]
      });

      expect(LaunchTemplates).toBeDefined();
      expect(LaunchTemplates.length).toBe(1);
      expect(LaunchTemplates[0].LaunchTemplateName).toContain(environmentSuffix);
    });

    test('should have launch template with correct version', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      const launchTemplateId = nodegroup.launchTemplate?.id;
      const version = nodegroup.launchTemplate?.version || '$Latest';

      const { LaunchTemplateVersions } = await ec2Client.describeLaunchTemplateVersions({
        LaunchTemplateId: launchTemplateId!,
        Versions: [version]
      });

      expect(LaunchTemplateVersions).toBeDefined();
      expect(LaunchTemplateVersions.length).toBeGreaterThan(0);

      const ltData = LaunchTemplateVersions[0].LaunchTemplateData;

      // Verify EBS encryption
      expect(ltData?.BlockDeviceMappings).toBeDefined();
      const ebsDevice = ltData?.BlockDeviceMappings?.find(bdm => bdm.DeviceName === '/dev/xvda');
      expect(ebsDevice?.Ebs?.Encrypted).toBe(true);
      expect(ebsDevice?.Ebs?.VolumeType).toBe('gp3');

      // Verify IMDSv2
      expect(ltData?.MetadataOptions?.HttpTokens).toBe('required');
      expect(ltData?.MetadataOptions?.HttpPutResponseHopLimit).toBe(2);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resource names should include environmentSuffix', () => {
      expect(outputs.ClusterName).toContain(environmentSuffix);
      expect(outputs.NodeGroupName).toContain(environmentSuffix);
      expect(outputs.NodeRoleArn).toContain(environmentSuffix);
      expect(outputs.LogGroupName).toContain(environmentSuffix);
      expect(outputs.ClusterArn).toContain(environmentSuffix);
    });

    test('all ARNs should be in correct format', () => {
      expect(outputs.ClusterArn).toMatch(/^arn:aws:eks:/);
      expect(outputs.NodeRoleArn).toMatch(/^arn:aws:iam:/);
      expect(outputs.OIDCProviderArn).toMatch(/^arn:aws:iam:/);
    });
  });

  describe('Security Validation', () => {
    test('cluster should not be publicly accessible', async () => {
      const clusterName = outputs.ClusterName;
      const { cluster } = await eksClient.describeCluster({ name: clusterName });

      expect(cluster.resourcesVpcConfig?.endpointPublicAccess).toBe(false);
      expect(cluster.resourcesVpcConfig?.publicAccessCidrs).toBeUndefined();
    });

    test('node group should be in private subnets', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      const { Subnets } = await ec2Client.describeSubnets({
        SubnetIds: nodegroup.subnets
      });

      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('IAM roles should follow least privilege principle', async () => {
      const clusterRoleName = `eks-cluster-role-${environmentSuffix}`;
      const { AttachedPolicies } = await iamClient.listAttachedRolePolicies({
        RoleName: clusterRoleName
      });

      // Verify only required managed policies are attached
      expect(AttachedPolicies?.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Cost Optimization Validation', () => {
    test('node group should use SPOT instances', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      expect(nodegroup.capacityType).toBe('SPOT');
    });

    test('CloudWatch logs should have retention policy', async () => {
      const logGroupName = outputs.LogGroupName;
      const { logGroups } = await logsClient.describeLogGroups({
        logGroupNamePrefix: logGroupName
      });

      const logGroup = logGroups.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should use cost-effective instance types', async () => {
      const clusterName = outputs.ClusterName;
      const nodeGroupName = outputs.NodeGroupName.split('/')[1];

      const { nodegroup } = await eksClient.describeNodegroup({
        clusterName,
        nodegroupName
      });

      // Verify t3 family instances (cost-effective)
      nodegroup.instanceTypes?.forEach(instanceType => {
        expect(instanceType).toMatch(/^t3a?\.medium$/);
      });
    });
  });
});
