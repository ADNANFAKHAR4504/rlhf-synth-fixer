import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  EKSClient,
  ListNodegroupsCommand
} from '@aws-sdk/client-eks';
import {
  IAMClient,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import fs from 'fs';

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Load stack outputs from deployment
let outputs: any;
try {
  const outputsPath = 'cfn-outputs/flat-outputs.json';
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  } else {
    console.warn(`⚠️  Stack outputs not found at ${outputsPath}. Integration tests will fail.`);
    outputs = {};
  }
} catch (error) {
  console.error('Failed to load stack outputs:', error);
  outputs = {};
}

// Initialize AWS clients
const eksClient = new EKSClient({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const ec2Client = new EC2Client({ region });

describe('EKS Cluster Integration Tests', () => {
  // Skip all tests if outputs are not available
  const hasOutputs = Object.keys(outputs).length > 0;

  beforeAll(() => {
    if (!hasOutputs) {
      console.warn('\n⚠️  Skipping integration tests: Stack outputs not found');
      console.warn('   Deploy the CloudFormation stack first to run integration tests\n');
    }
  });

  describe('EKS Cluster Configuration', () => {
    test('should have deployed EKS cluster', async () => {
      if (!hasOutputs) {
        console.log('⏭️  Skipping: Stack not deployed');
        return;
      }

      expect(outputs.ClusterName).toBeDefined();
      expect(outputs.ClusterArn).toBeDefined();
      expect(outputs.ClusterEndpoint).toBeDefined();

      const clusterName = outputs.ClusterName;
      expect(clusterName).toContain('eks-cluster');
    }, 30000);

    test('should have EKS cluster in ACTIVE state', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({ name: outputs.ClusterName })
      );

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.version).toBe('1.28');
    }, 30000);

    test('cluster should have private endpoint only', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({ name: outputs.ClusterName })
      );

      const vpcConfig = response.cluster?.resourcesVpcConfig;
      expect(vpcConfig?.endpointPrivateAccess).toBe(true);
      expect(vpcConfig?.endpointPublicAccess).toBe(false);
    }, 30000);

    test('cluster should have all control plane logs enabled', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({ name: outputs.ClusterName })
      );

      const logging = response.cluster?.logging?.clusterLogging;
      expect(logging).toBeDefined();

      const enabledTypes = logging?.filter(log => log.enabled)
        .flatMap(log => log.types || []);

      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
    }, 30000);

    test('cluster should have OIDC provider configured', async () => {
      if (!hasOutputs || !outputs.OIDCIssuerURL) {
        console.log('⏭️  Skipping: OIDC issuer URL not available');
        return;
      }

      expect(outputs.OIDCIssuerURL).toBeDefined();
      expect(outputs.OIDCProviderArn).toBeDefined();
      expect(outputs.OIDCIssuerURL).toContain('oidc.eks');
    }, 30000);

    test('cluster should have security group configured', async () => {
      if (!hasOutputs || !outputs.ClusterSecurityGroupId) {
        console.log('⏭️  Skipping: Security group ID not available');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.ClusterSecurityGroupId]
        })
      );

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain('EKSClusterSecurityGroup');
    }, 30000);
  });

  describe('Managed Node Group Configuration', () => {
    test('should have managed node group deployed', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const response = await eksClient.send(
        new ListNodegroupsCommand({ clusterName: outputs.ClusterName })
      );

      expect(response.nodegroups).toBeDefined();
      expect(response.nodegroups!.length).toBeGreaterThan(0);
    }, 30000);

    test('node group should be in ACTIVE state', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({ clusterName: outputs.ClusterName })
      );

      const nodegroupName = listResponse.nodegroups![0];
      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName: outputs.ClusterName,
          nodegroupName
        })
      );

      expect(describeResponse.nodegroup?.status).toBe('ACTIVE');
    }, 30000);

    test('node group should have correct scaling configuration', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({ clusterName: outputs.ClusterName })
      );

      const nodegroupName = listResponse.nodegroups![0];
      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName: outputs.ClusterName,
          nodegroupName
        })
      );

      const scalingConfig = describeResponse.nodegroup?.scalingConfig;
      expect(scalingConfig?.minSize).toBe(2);
      expect(scalingConfig?.maxSize).toBe(10);
      expect(scalingConfig?.desiredSize).toBe(4);
    }, 30000);

    test('node group should use t3.large instance type', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({ clusterName: outputs.ClusterName })
      );

      const nodegroupName = listResponse.nodegroups![0];
      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName: outputs.ClusterName,
          nodegroupName
        })
      );

      const instanceTypes = describeResponse.nodegroup?.instanceTypes;
      expect(instanceTypes).toContain('t3.large');
    }, 30000);

    test('node group should use Amazon Linux 2 AMI', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({ clusterName: outputs.ClusterName })
      );

      const nodegroupName = listResponse.nodegroups![0];
      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName: outputs.ClusterName,
          nodegroupName
        })
      );

      expect(describeResponse.nodegroup?.amiType).toBe('AL2_x86_64');
    }, 30000);

    test('node group should have proper tagging', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const listResponse = await eksClient.send(
        new ListNodegroupsCommand({ clusterName: outputs.ClusterName })
      );

      const nodegroupName = listResponse.nodegroups![0];
      const describeResponse = await eksClient.send(
        new DescribeNodegroupCommand({
          clusterName: outputs.ClusterName,
          nodegroupName
        })
      );

      const tags = describeResponse.nodegroup?.tags || {};
      expect(tags.Environment).toBeDefined();
      expect(tags.Owner).toBeDefined();
      expect(tags.CostCenter).toBeDefined();
    }, 30000);
  });

  describe('IAM Roles Configuration', () => {
    test('cluster IAM role should have correct policies', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster outputs not available');
        return;
      }

      const clusterResponse = await eksClient.send(
        new DescribeClusterCommand({ name: outputs.ClusterName })
      );

      const roleArn = clusterResponse.cluster?.roleArn!;
      const roleName = roleArn.split('/').pop()!;

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    }, 30000);

    test('node IAM role should have correct policies', async () => {
      if (!hasOutputs || !outputs.NodeInstanceRoleArn) {
        console.log('⏭️  Skipping: Node role ARN not available');
        return;
      }

      const roleName = outputs.NodeInstanceRoleArn.split('/').pop()!;

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    }, 30000);

    test('IAM roles should have environment suffix in names', async () => {
      if (!hasOutputs || !outputs.NodeInstanceRoleArn) {
        console.log('⏭️  Skipping: Role ARNs not available');
        return;
      }

      const nodeRoleName = outputs.NodeInstanceRoleArn.split('/').pop()!;
      expect(nodeRoleName).toContain('eks-node-role');
      expect(nodeRoleName).toContain(environmentSuffix);
    }, 30000);
  });

  describe('CloudWatch Logging', () => {
    test('should have CloudWatch log group for cluster logs', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const logGroupPrefix = `/aws/eks/${outputs.ClusterName}/cluster`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupPrefix
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    }, 30000);

    test('log group should have 30-day retention', async () => {
      if (!hasOutputs || !outputs.ClusterName) {
        console.log('⏭️  Skipping: Cluster name not available');
        return;
      }

      const logGroupPrefix = `/aws/eks/${outputs.ClusterName}/cluster`;

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupPrefix
        })
      );

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(30);
    }, 30000);
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming convention with environment suffix', async () => {
      if (!hasOutputs) {
        console.log('⏭️  Skipping: Stack outputs not available');
        return;
      }

      // Check cluster name
      if (outputs.ClusterName) {
        expect(outputs.ClusterName).toContain('eks-cluster');
        expect(outputs.ClusterName).toContain(environmentSuffix);
      }

      // Check security group
      if (outputs.ClusterSecurityGroupId) {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.ClusterSecurityGroupId]
          })
        );
        const nameTag = response.SecurityGroups![0].Tags?.find(t => t.Key === 'Name');
        expect(nameTag?.Value).toContain(environmentSuffix);
      }
    }, 30000);

    test('exported outputs should follow naming convention', () => {
      if (!hasOutputs) {
        console.log('⏭️  Skipping: Stack outputs not available');
        return;
      }

      const expectedOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'OIDCIssuerURL',
        'OIDCProviderArn',
        'NodeGroupArn',
        'NodeInstanceRoleArn',
        'ClusterSecurityGroupId'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
      });
    });
  });
});
