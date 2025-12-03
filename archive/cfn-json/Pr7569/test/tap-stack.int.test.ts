import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { EKSClient, DescribeClusterCommand, DescribeNodegroupCommand } from '@aws-sdk/client-eks';
import { IAMClient, GetRoleCommand, GetOpenIDConnectProviderCommand } from '@aws-sdk/client-iam';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

interface FlatOutputs {
  [key: string]: string;
}

describe('EKS Cluster Integration Tests', () => {
  let outputs: FlatOutputs;
  let cfnClient: CloudFormationClient;
  let eksClient: EKSClient;
  let iamClient: IAMClient;
  let ec2Client: EC2Client;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Deploy the stack first.');
    }
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region });
    eksClient = new EKSClient({ region });
    iamClient = new IAMClient({ region });
    ec2Client = new EC2Client({ region });
  });

  describe('Stack Deployment', () => {
    test('should have stack deployed successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(response.Stacks![0].StackStatus);
    }, 30000);

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'ClusterName',
        'ClusterEndpoint',
        'ClusterArn',
        'OIDCIssuerURL',
        'OIDCProviderArn',
        'GeneralNodeGroupArn',
        'ComputeNodeGroupArn',
        'ALBControllerRoleArn',
        'EBSCSIDriverRoleArn'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('EKS Cluster', () => {
    test('should have EKS cluster created', async () => {
      expect(outputs.ClusterName).toBeDefined();

      const command = new DescribeClusterCommand({
        name: outputs.ClusterName
      });
      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster!.status).toBe('ACTIVE');
      expect(response.cluster!.name).toContain(environmentSuffix);
    }, 30000);

    test('should have private endpoint configuration', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName
      });
      const response = await eksClient.send(command);

      expect(response.cluster!.resourcesVpcConfig!.endpointPrivateAccess).toBe(true);
      expect(response.cluster!.resourcesVpcConfig!.endpointPublicAccess).toBe(false);
    }, 30000);

    test('should have all logging enabled', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName
      });
      const response = await eksClient.send(command);

      const logging = response.cluster!.logging!.clusterLogging!;
      const enabledTypes = logging
        .filter(log => log.enabled === true)
        .flatMap(log => log.types || []);

      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
    }, 30000);

    test('should have Kubernetes version 1.28 or higher', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName
      });
      const response = await eksClient.send(command);

      const version = parseFloat(response.cluster!.version!);
      expect(version).toBeGreaterThanOrEqual(1.28);
    }, 30000);

    test('should have cluster endpoint accessible', () => {
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.ClusterEndpoint).toMatch(/^https:\/\//);
    });

    test('should have cluster ARN with correct format', () => {
      expect(outputs.ClusterArn).toBeDefined();
      expect(outputs.ClusterArn).toMatch(/^arn:aws:eks:[a-z0-9-]+:[0-9]{12}:cluster\//);
    });
  });

  describe('OIDC Provider', () => {
    test('should have OIDC provider created', async () => {
      expect(outputs.OIDCProviderArn).toBeDefined();

      const providerArn = outputs.OIDCProviderArn;
      const command = new GetOpenIDConnectProviderCommand({
        OpenIDConnectProviderArn: providerArn
      });
      const response = await iamClient.send(command);

      expect(response.ClientIDList).toContain('sts.amazonaws.com');
      expect(response.ThumbprintList).toBeDefined();
      expect(response.ThumbprintList!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have OIDC issuer URL matching cluster', () => {
      expect(outputs.OIDCIssuerURL).toBeDefined();
      expect(outputs.OIDCIssuerURL).toMatch(/^https:\/\/oidc\.eks\.[a-z0-9-]+\.amazonaws\.com\/id\//);
    });
  });

  describe('Node Groups', () => {
    test('should have general node group created', async () => {
      expect(outputs.GeneralNodeGroupArn).toBeDefined();

      // Extract node group name from ARN (format: arn:aws:eks:...:nodegroup/cluster-name/nodegroup-name/uuid)
      const nodeGroupName = outputs.GeneralNodeGroupArn.split('/')[2];

      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: nodeGroupName
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup!.status).toBe('ACTIVE');
      expect(response.nodegroup!.nodegroupName).toContain(environmentSuffix);
    }, 30000);

    test('should have general node group with correct instance types', async () => {
      const nodeGroupName = outputs.GeneralNodeGroupArn.split('/')[2];

      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: nodeGroupName
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup!.instanceTypes).toContain('t3.large');
    }, 30000);

    test('should have general node group with correct scaling config', async () => {
      const nodeGroupName = outputs.GeneralNodeGroupArn.split('/')[2];

      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: nodeGroupName
      });
      const response = await eksClient.send(command);

      const scaling = response.nodegroup!.scalingConfig!;
      expect(scaling.minSize).toBe(2);
      expect(scaling.maxSize).toBe(6);
      expect(scaling.desiredSize).toBeGreaterThanOrEqual(2);
      expect(scaling.desiredSize).toBeLessThanOrEqual(6);
    }, 30000);

    test('should have compute node group created', async () => {
      expect(outputs.ComputeNodeGroupArn).toBeDefined();

      const nodeGroupName = outputs.ComputeNodeGroupArn.split('/')[2];

      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: nodeGroupName
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup!.status).toBe('ACTIVE');
      expect(response.nodegroup!.nodegroupName).toContain(environmentSuffix);
    }, 30000);

    test('should have compute node group with correct instance types', async () => {
      const nodeGroupName = outputs.ComputeNodeGroupArn.split('/')[2];

      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: nodeGroupName
      });
      const response = await eksClient.send(command);

      expect(response.nodegroup!.instanceTypes).toContain('c5.xlarge');
    }, 30000);

    test('should have compute node group with correct scaling config', async () => {
      const nodeGroupName = outputs.ComputeNodeGroupArn.split('/')[2];

      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: nodeGroupName
      });
      const response = await eksClient.send(command);

      const scaling = response.nodegroup!.scalingConfig!;
      expect(scaling.minSize).toBe(1);
      expect(scaling.maxSize).toBe(4);
      expect(scaling.desiredSize).toBeGreaterThanOrEqual(1);
      expect(scaling.desiredSize).toBeLessThanOrEqual(4);
    }, 30000);

    test('should have both node groups using Amazon Linux 2', async () => {
      const generalNodeGroupName = outputs.GeneralNodeGroupArn.split('/')[2];
      const computeNodeGroupName = outputs.ComputeNodeGroupArn.split('/')[2];

      const generalCommand = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: generalNodeGroupName
      });
      const computeCommand = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: computeNodeGroupName
      });

      const generalResponse = await eksClient.send(generalCommand);
      const computeResponse = await eksClient.send(computeCommand);

      expect(generalResponse.nodegroup!.amiType).toBe('AL2_x86_64');
      expect(computeResponse.nodegroup!.amiType).toBe('AL2_x86_64');
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('should have ALB controller role created', async () => {
      expect(outputs.ALBControllerRoleArn).toBeDefined();

      const roleName = outputs.ALBControllerRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toContain(environmentSuffix);
      expect(response.Role!.RoleName).toContain('alb-controller');
    }, 30000);

    test('should have ALB controller role with OIDC trust policy', async () => {
      const roleName = outputs.ALBControllerRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const statement = trustPolicy.Statement[0];

      expect(statement.Action).toBe('sts:AssumeRoleWithWebIdentity');
      expect(statement.Principal.Federated).toBe(outputs.OIDCProviderArn);
    }, 30000);

    test('should have EBS CSI driver role created', async () => {
      expect(outputs.EBSCSIDriverRoleArn).toBeDefined();

      const roleName = outputs.EBSCSIDriverRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toContain(environmentSuffix);
      expect(response.Role!.RoleName).toContain('ebs-csi-driver');
    }, 30000);

    test('should have EBS CSI driver role with OIDC trust policy', async () => {
      const roleName = outputs.EBSCSIDriverRoleArn.split('/').pop()!;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const statement = trustPolicy.Statement[0];

      expect(statement.Action).toBe('sts:AssumeRoleWithWebIdentity');
      expect(statement.Principal.Federated).toBe(outputs.OIDCProviderArn);
    }, 30000);
  });

  describe('Security Configuration', () => {
    test('should have cluster security group with restricted access', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName
      });
      const clusterResponse = await eksClient.send(command);

      const securityGroupIds = clusterResponse.cluster!.resourcesVpcConfig!.securityGroupIds || [];
      expect(securityGroupIds.length).toBeGreaterThan(0);

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      });
      const sgResponse = await ec2Client.send(sgCommand);

      expect(sgResponse.SecurityGroups).toBeDefined();
      expect(sgResponse.SecurityGroups!.length).toBeGreaterThan(0);

      // Verify security group has name with environment suffix
      const customSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes(environmentSuffix)
      );
      expect(customSg).toBeDefined();

      // Verify ingress rules restrict access to 10.0.0.0/8
      const httpsIngress = customSg!.IpPermissions?.find(perm =>
        perm.FromPort === 443 && perm.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress!.IpRanges?.some(range =>
        range.CidrIp === '10.0.0.0/8'
      )).toBe(true);
    }, 30000);
  });

  describe('Resource Naming', () => {
    test('all resources should include environment suffix', () => {
      expect(outputs.ClusterName).toContain(environmentSuffix);
      expect(outputs.GeneralNodeGroupArn).toContain(environmentSuffix);
      expect(outputs.ComputeNodeGroupArn).toContain(environmentSuffix);
      expect(outputs.ALBControllerRoleArn).toContain(environmentSuffix);
      expect(outputs.EBSCSIDriverRoleArn).toContain(environmentSuffix);
    });
  });

  describe('Tagging', () => {
    test('should have proper tags on cluster', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName
      });
      const response = await eksClient.send(command);

      const tags = response.cluster!.tags || {};
      expect(tags.Environment).toBeDefined();
      expect(tags.ManagedBy).toBe('CloudFormation');
    }, 30000);
  });
});
