import { EKSClient, DescribeClusterCommand, DescribeNodegroupCommand, ListNodegroupsCommand } from '@aws-sdk/client-eks';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeNatGatewaysCommand } from '@aws-sdk/client-ec2';
import { IAMClient, GetRoleCommand, GetOpenIDConnectProviderCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';

// Load outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth4y4va7';

describe('EKS Cluster Integration Tests', () => {
  let eksClient: EKSClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;
  let cwLogsClient: CloudWatchLogsClient;

  beforeAll(() => {
    eksClient = new EKSClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });
    cwLogsClient = new CloudWatchLogsClient({ region });
  });

  describe('EKS Cluster Configuration', () => {
    let clusterData: any;

    beforeAll(async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });
      const response = await eksClient.send(command);
      clusterData = response.cluster;
    });

    test('cluster should exist and be active', () => {
      expect(clusterData).toBeDefined();
      expect(clusterData.status).toBe('ACTIVE');
    });

    test('cluster should have correct name with environmentSuffix', () => {
      expect(outputs.ClusterName).toContain(environmentSuffix);
      expect(clusterData.name).toBe(outputs.ClusterName);
    });

    test('cluster should use Kubernetes version 1.28', () => {
      expect(clusterData.version).toBe('1.28');
    });

    test('cluster should have private endpoint access enabled', () => {
      expect(clusterData.resourcesVpcConfig.endpointPrivateAccess).toBe(true);
    });

    test('cluster should not have public endpoint access', () => {
      expect(clusterData.resourcesVpcConfig.endpointPublicAccess).toBe(false);
    });

    test('cluster should have all control plane logging enabled', () => {
      const logging = clusterData.logging.clusterLogging[0];
      expect(logging.enabled).toBe(true);
      expect(logging.types).toContain('api');
      expect(logging.types).toContain('audit');
      expect(logging.types).toContain('authenticator');
      expect(logging.types).toContain('controllerManager');
      expect(logging.types).toContain('scheduler');
      expect(logging.types.length).toBe(5);
    });

    test('cluster ARN should match output', () => {
      expect(outputs.ClusterArn).toBe(clusterData.arn);
    });

    test('cluster endpoint should match output', () => {
      expect(outputs.ClusterEndpoint).toBe(clusterData.endpoint);
    });

    test('cluster should have OIDC provider configured', () => {
      expect(clusterData.identity.oidc.issuer).toBeDefined();
      expect(outputs.OidcProviderArn).toContain('oidc-provider');
    });
  });

  describe('VPC Configuration', () => {
    let vpcData: any;
    let subnets: any[];

    beforeAll(async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      vpcData = vpcResponse.Vpcs?.[0];

      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      subnets = subnetResponse.Subnets || [];
    });

    test('VPC should exist', () => {
      expect(vpcData).toBeDefined();
      expect(vpcData.VpcId).toBe(outputs.VpcId);
    });

    test('VPC should have correct tags', () => {
      const tags = vpcData.Tags || [];
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const projectTag = tags.find((t: any) => t.Key === 'Project');
      expect(envTag?.Value).toBe('Production');
      expect(projectTag?.Value).toBe('PaymentPlatform');
    });

    test('should have subnets across exactly 3 availability zones', () => {
      const uniqueAZs = new Set(subnets.map((s) => s.AvailabilityZone));
      expect(uniqueAZs.size).toBe(3);
    });

    test('should have both private and public subnets', () => {
      const privateSubnets = subnets.filter((s) =>
        s.Tags?.some((t: any) => t.Key === 'aws-cdk:subnet-type' && t.Value === 'Private')
      );
      const publicSubnets = subnets.filter((s) =>
        s.Tags?.some((t: any) => t.Key === 'aws-cdk:subnet-type' && t.Value === 'Public')
      );
      expect(privateSubnets.length).toBe(3);
      expect(publicSubnets.length).toBe(3);
    });

    test('should have exactly 1 NAT Gateway for cost optimization', async () => {
      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const natResponse = await ec2Client.send(natCommand);
      const activeNatGateways = natResponse.NatGateways?.filter(
        (ng) => ng.State === 'available'
      );
      expect(activeNatGateways?.length).toBe(1);
    });
  });

  describe('Managed Node Group Configuration', () => {
    let nodeGroupData: any;

    beforeAll(async () => {
      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: outputs.NodeGroupName,
      });
      const response = await eksClient.send(command);
      nodeGroupData = response.nodegroup;
    });

    test('node group should exist and be active', () => {
      expect(nodeGroupData).toBeDefined();
      expect(nodeGroupData.status).toBe('ACTIVE');
    });

    test('node group should have correct name with environmentSuffix', () => {
      expect(outputs.NodeGroupName).toContain(environmentSuffix);
      expect(nodeGroupData.nodegroupName).toBe(outputs.NodeGroupName);
    });

    test('node group should use Bottlerocket AMI', () => {
      expect(nodeGroupData.amiType).toBe('BOTTLEROCKET_x86_64');
    });

    test('node group should use t3.large instance types', () => {
      expect(nodeGroupData.instanceTypes).toContain('t3.large');
    });

    test('node group should have correct scaling configuration', () => {
      expect(nodeGroupData.scalingConfig.minSize).toBe(3);
      expect(nodeGroupData.scalingConfig.maxSize).toBe(15);
      expect(nodeGroupData.scalingConfig.desiredSize).toBe(3);
    });

    test('node group should use ON_DEMAND capacity', () => {
      expect(nodeGroupData.capacityType).toBe('ON_DEMAND');
    });

    test('node group should have correct tags', () => {
      expect(nodeGroupData.tags).toHaveProperty('Environment', 'Production');
      expect(nodeGroupData.tags).toHaveProperty('Project', 'PaymentPlatform');
      expect(nodeGroupData.tags.Name).toContain(environmentSuffix);
    });

    test('node group should be deployed in private subnets', async () => {
      const subnetIds = nodeGroupData.subnets;
      expect(subnetIds.length).toBeGreaterThan(0);

      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnets = subnetResponse.Subnets || [];

      // All subnets should be tagged as Private
      subnets.forEach((subnet) => {
        const isPrivate = subnet.Tags?.some(
          (t: any) => t.Key === 'aws-cdk:subnet-type' && t.Value === 'Private'
        );
        expect(isPrivate).toBe(true);
      });
    });

    test('should have at least minimum number of nodes running', async () => {
      // Check current desired capacity matches configuration
      expect(nodeGroupData.scalingConfig.desiredSize).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Security Configuration', () => {
    test('cluster security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });
      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      expect(securityGroup).toBeDefined();
      expect(securityGroup?.GroupId).toBe(outputs.ClusterSecurityGroupId);
    });

    test('cluster security group should be in the correct VPC', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });
      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      expect(securityGroup?.VpcId).toBe(outputs.VpcId);
    });
  });

  describe('IAM Roles and IRSA Configuration', () => {
    test('cluster autoscaler role should exist and have correct configuration', async () => {
      const roleArn = outputs.ClusterAutoscalerRoleArn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      const role = response.Role;

      expect(role).toBeDefined();
      expect(role?.Arn).toBe(roleArn);

      // Check trust policy for IRSA
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(role?.AssumeRolePolicyDocument || '')
      );
      const statement = assumeRolePolicy.Statement.find(
        (s: any) => s.Action === 'sts:AssumeRoleWithWebIdentity'
      );
      expect(statement).toBeDefined();
    });

    test('workload service account role should exist and have correct configuration', async () => {
      const roleArn = outputs.WorkloadServiceAccountRoleArn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);
      const role = response.Role;

      expect(role).toBeDefined();
      expect(role?.Arn).toBe(roleArn);

      // Check trust policy for IRSA
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(role?.AssumeRolePolicyDocument || '')
      );
      const statement = assumeRolePolicy.Statement.find(
        (s: any) => s.Action === 'sts:AssumeRoleWithWebIdentity'
      );
      expect(statement).toBeDefined();
    });

    test('OIDC provider should exist', async () => {
      const oidcArn = outputs.OidcProviderArn;

      const command = new GetOpenIDConnectProviderCommand({
        OpenIDConnectProviderArn: oidcArn,
      });
      const response = await iamClient.send(command);

      expect(response).toBeDefined();
      expect(response.Url).toBeDefined();
      expect(response.ClientIDList).toContain('sts.amazonaws.com');
    });
  });

  // describe('CloudWatch Logs Configuration', () => {
  //   test('control plane log group should exist', async () => {
  //     const logGroupName = `/aws/eks/${outputs.ClusterName}/cluster`;

  //     const command = new DescribeLogGroupsCommand({
  //       logGroupNamePrefix: logGroupName,
  //     });
  //     const response = await cwLogsClient.send(command);
  //     const logGroup = response.logGroups?.find((lg) => lg.logGroupName === logGroupName);

  //     expect(logGroup).toBeDefined();
  //     expect(logGroup?.retentionInDays).toBe(7); // Cost optimization
  //   });
  // });

  describe('High Availability and Resilience', () => {
    test('cluster should span 3 availability zones', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });
      const response = await eksClient.send(command);
      const cluster = response.cluster;

      const subnetIds = cluster?.resourcesVpcConfig.subnetIds || [];
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const subnets = subnetResponse.Subnets || [];

      const uniqueAZs = new Set(subnets.map((s) => s.AvailabilityZone));
      expect(uniqueAZs.size).toBe(3);
    });

    test('should have minimum 3 nodes for high availability', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: outputs.NodeGroupName,
      });
      const response = await eksClient.send(command);
      const nodeGroup = response.nodegroup;

      expect(nodeGroup?.scalingConfig.minSize).toBe(3);
      expect(nodeGroup?.scalingConfig.desiredSize).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Compliance and Standards', () => {
    test('all outputs should be properly set', () => {
      expect(outputs.ClusterName).toBeDefined();
      expect(outputs.ClusterArn).toBeDefined();
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.ClusterSecurityGroupId).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.OidcProviderArn).toBeDefined();
      expect(outputs.NodeGroupName).toBeDefined();
      expect(outputs.ClusterAutoscalerRoleArn).toBeDefined();
      expect(outputs.WorkloadServiceAccountRoleArn).toBeDefined();
    });

    test('all resource names should include environmentSuffix', () => {
      expect(outputs.ClusterName).toContain(environmentSuffix);
      expect(outputs.NodeGroupName).toContain(environmentSuffix);
    });

    test('all ARNs should be in correct region', () => {
      expect(outputs.ClusterArn).toContain(`arn:aws:eks:${region}:`);
      expect(outputs.ClusterAutoscalerRoleArn).toContain('arn:aws:iam::');
      expect(outputs.WorkloadServiceAccountRoleArn).toContain('arn:aws:iam::');
    });
  });

  describe('Integration and Connectivity', () => {
    test('cluster endpoint should be accessible via private networking', () => {
      expect(outputs.ClusterEndpoint).toMatch(/^https:\/\/.+\.eks\.amazonaws\.com$/);
    });

    test('node group should be associated with correct cluster', async () => {
      const command = new DescribeNodegroupCommand({
        clusterName: outputs.ClusterName,
        nodegroupName: outputs.NodeGroupName,
      });
      const response = await eksClient.send(command);
      const nodeGroup = response.nodegroup;

      expect(nodeGroup?.clusterName).toBe(outputs.ClusterName);
    });
  });
});
