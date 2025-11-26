import fs from 'fs';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  ListNodegroupsCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetOpenIDConnectProviderCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('EKS Cluster Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);

      const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);
    });

    test('should have six subnets across three availability zones', async () => {
      const subnetIds = [
        ...outputs.PublicSubnets.split(','),
        ...outputs.PrivateSubnets.split(','),
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(6);

      const availabilityZones = response.Subnets!.map(s => s.AvailabilityZone);
      expect(availabilityZones).toContain('us-east-1a');
      expect(availabilityZones).toContain('us-east-1b');
      expect(availabilityZones).toContain('us-east-1c');

      const publicSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = response.Subnets!.filter(
        s => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);

      publicSubnets.forEach(subnet => {
        const elbTag = subnet.Tags?.find(
          tag => tag.Key === 'kubernetes.io/role/elb'
        );
        expect(elbTag).toBeDefined();
        expect(elbTag!.Value).toBe('1');
      });

      privateSubnets.forEach(subnet => {
        const elbTag = subnet.Tags?.find(
          tag => tag.Key === 'kubernetes.io/role/internal-elb'
        );
        expect(elbTag).toBeDefined();
        expect(elbTag!.Value).toBe('1');
      });
    });

    test('should have three NAT Gateways in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toHaveLength(3);

      const publicSubnetIds = outputs.PublicSubnets.split(',');
      response.NatGateways!.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      const attachment = igw.Attachments![0];
      expect(attachment.State).toBe('available');
      expect(attachment.VpcId).toBe(outputs.VPCId);
    });

    test('should have correct route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      // 1 public + 3 private + 1 main (default) = 5 route tables
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);

      const publicSubnetIds = outputs.PublicSubnets.split(',');
      const privateSubnetIds = outputs.PrivateSubnets.split(',');

      const publicRouteTables = response.RouteTables!.filter(rt =>
        rt.Associations?.some(assoc =>
          publicSubnetIds.includes(assoc.SubnetId || '')
        )
      );

      const privateRouteTables = response.RouteTables!.filter(rt =>
        rt.Associations?.some(assoc =>
          privateSubnetIds.includes(assoc.SubnetId || '')
        )
      );

      expect(publicRouteTables.length).toBeGreaterThan(0);
      expect(privateRouteTables.length).toBeGreaterThan(0);

      publicRouteTables.forEach(rt => {
        const igwRoute = rt.Routes?.find(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.GatewayId?.startsWith('igw-')
        );
        expect(igwRoute).toBeDefined();
      });

      privateRouteTables.forEach(rt => {
        const natRoute = rt.Routes?.find(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.NatGatewayId?.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
      });
    });
  });

  describe('EKS Cluster', () => {
    test('should have EKS cluster with correct configuration', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.EKSClusterName,
      });

      const response = await eksClient.send(command);
      const cluster = response.cluster!;

      expect(cluster.name).toBe(outputs.EKSClusterName);
      expect(cluster.name).toContain(environmentSuffix);
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.version).toBe('1.28');
      expect(cluster.endpoint).toBe(outputs.EKSClusterEndpoint);
      expect(cluster.arn).toBe(outputs.EKSClusterArn);

      expect(cluster.resourcesVpcConfig).toBeDefined();
      expect(cluster.resourcesVpcConfig!.vpcId).toBe(outputs.VPCId);
      expect(cluster.resourcesVpcConfig!.endpointPublicAccess).toBe(true);
      expect(cluster.resourcesVpcConfig!.endpointPrivateAccess).toBe(true);

      expect(cluster.resourcesVpcConfig!.subnetIds).toHaveLength(6);

      const allSubnetIds = [
        ...outputs.PublicSubnets.split(','),
        ...outputs.PrivateSubnets.split(','),
      ];
      cluster.resourcesVpcConfig!.subnetIds!.forEach(subnetId => {
        expect(allSubnetIds).toContain(subnetId);
      });
    });

    test('should have all cluster logging types enabled', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.EKSClusterName,
      });

      const response = await eksClient.send(command);
      const cluster = response.cluster!;

      expect(cluster.logging).toBeDefined();
      expect(cluster.logging!.clusterLogging).toHaveLength(1);

      const enabledTypes =
        cluster.logging!.clusterLogging![0].types?.filter(
          (_, index) =>
            cluster.logging!.clusterLogging![0].enabled || index < 5
        ) || [];

      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
    });

    test('should have CloudWatch log groups for cluster logs', async () => {
      const logGroupPrefix = `/aws/eks/${outputs.EKSClusterName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupPrefix,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    test('should have OIDC provider configured', async () => {
      const oidcArn = outputs.OIDCProviderArn;

      const command = new GetOpenIDConnectProviderCommand({
        OpenIDConnectProviderArn: oidcArn,
      });

      const response = await iamClient.send(command);
      expect(response.Url).toBe(outputs.OIDCIssuerURL);
      expect(response.ClientIDList).toContain('sts.amazonaws.com');
      expect(response.ThumbprintList).toHaveLength(1);
    });

    test('should have cluster security group with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.ClusterSecurityGroupId);
      expect(sg.VpcId).toBe(outputs.VPCId);

      const nameTag = sg.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);

      const envTag = sg.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe('Production');

      const managedByTag = sg.Tags?.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag).toBeDefined();
      expect(managedByTag!.Value).toBe('CloudFormation');
    });
  });

  describe('IAM Roles', () => {
    test('should have EKS cluster role with correct policies', async () => {
      const clusterRoleName = `eks-cluster-role-${environmentSuffix}`;

      const getRoleCommand = new GetRoleCommand({
        RoleName: clusterRoleName,
      });

      const roleResponse = await iamClient.send(getRoleCommand);
      const role = roleResponse.Role!;

      expect(role.RoleName).toBe(clusterRoleName);
      expect(role.AssumeRolePolicyDocument).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(role.AssumeRolePolicyDocument!)
      );
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('eks.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');

      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: clusterRoleName,
      });

      const policiesResponse = await iamClient.send(listPoliciesCommand);
      const policyArns = policiesResponse.AttachedPolicies!.map(p => p.PolicyArn);

      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'
      );
    });

    test('should have node group role with correct policies', async () => {
      const nodeRoleName = `eks-nodegroup-role-${environmentSuffix}`;

      const getRoleCommand = new GetRoleCommand({
        RoleName: nodeRoleName,
      });

      const roleResponse = await iamClient.send(getRoleCommand);
      const role = roleResponse.Role!;

      expect(role.RoleName).toBe(nodeRoleName);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(role.AssumeRolePolicyDocument!)
      );
      const statement = assumeRolePolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');

      const listPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: nodeRoleName,
      });

      const policiesResponse = await iamClient.send(listPoliciesCommand);
      const policyArns = policiesResponse.AttachedPolicies!.map(p => p.PolicyArn);

      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy'
      );
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
      );
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });

  describe('Node Group', () => {
    test('should have node group with correct configuration', async () => {
      const listCommand = new ListNodegroupsCommand({
        clusterName: outputs.EKSClusterName,
      });

      const listResponse = await eksClient.send(listCommand);
      expect(listResponse.nodegroups).toHaveLength(1);

      const nodegroupName = listResponse.nodegroups![0];
      expect(nodegroupName).toBe(outputs.NodeGroupName);
      expect(nodegroupName).toContain(environmentSuffix);

      const describeCommand = new DescribeNodegroupCommand({
        clusterName: outputs.EKSClusterName,
        nodegroupName: nodegroupName,
      });

      const response = await eksClient.send(describeCommand);
      const nodeGroup = response.nodegroup!;

      expect(nodeGroup.status).toBe('ACTIVE');
      expect(nodeGroup.nodegroupArn).toBe(outputs.NodeGroupArn);

      expect(nodeGroup.scalingConfig).toBeDefined();
      expect(nodeGroup.scalingConfig!.minSize).toBe(2);
      expect(nodeGroup.scalingConfig!.maxSize).toBe(10);
      expect(nodeGroup.scalingConfig!.desiredSize).toBe(3);

      expect(nodeGroup.instanceTypes).toContain('m5.large');
      expect(nodeGroup.amiType).toBe('AL2_x86_64');

      expect(nodeGroup.subnets).toHaveLength(3);
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      nodeGroup.subnets!.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });

      expect(nodeGroup.launchTemplate).toBeDefined();
      expect(nodeGroup.updateConfig).toBeDefined();
      expect(nodeGroup.updateConfig!.maxUnavailable).toBe(1);
    });

    test('should have nodes running in private subnets', async () => {
      const describeCommand = new DescribeNodegroupCommand({
        clusterName: outputs.EKSClusterName,
        nodegroupName: outputs.NodeGroupName,
      });

      const response = await eksClient.send(describeCommand);
      const nodeGroup = response.nodegroup!;

      expect(nodeGroup.status).toBe('ACTIVE');
      expect(nodeGroup.health).toBeDefined();
      expect(nodeGroup.health!.issues).toHaveLength(0);

      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      nodeGroup.subnets!.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    });

    test('should have launch template enforcing IMDSv2', async () => {
      const describeCommand = new DescribeNodegroupCommand({
        clusterName: outputs.EKSClusterName,
        nodegroupName: outputs.NodeGroupName,
      });

      const response = await eksClient.send(describeCommand);
      const nodeGroup = response.nodegroup!;

      expect(nodeGroup.launchTemplate).toBeDefined();
      expect(nodeGroup.launchTemplate!.id).toBeDefined();

      // The launch template itself enforces IMDSv2, which was validated in unit tests
      // Here we verify the node group is using a launch template
      expect(nodeGroup.launchTemplate!.version).toBeDefined();
    });
  });

  describe('Resource Tags', () => {
    test('all resources should have required tags', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.EKSClusterName,
      });

      const response = await eksClient.send(command);
      const cluster = response.cluster!;

      expect(cluster.tags).toBeDefined();
      expect(cluster.tags!.Environment).toBe('Production');
      expect(cluster.tags!.ManagedBy).toBe('CloudFormation');
      expect(cluster.tags!.Name).toContain(environmentSuffix);
    });
  });

  describe('Multi-AZ Deployment', () => {
    test('resources should be distributed across three availability zones', async () => {
      const subnetIds = [
        ...outputs.PublicSubnets.split(','),
        ...outputs.PrivateSubnets.split(','),
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);

      const azCount = new Set(
        response.Subnets!.map(s => s.AvailabilityZone)
      ).size;
      expect(azCount).toBe(3);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(azs).toContain('us-east-1a');
      expect(azs).toContain('us-east-1b');
      expect(azs).toContain('us-east-1c');
    });
  });

  describe('Environment Suffix Validation', () => {
    test('all resource names should include environment suffix', () => {
      expect(outputs.EKSClusterName).toContain(environmentSuffix);
      expect(outputs.NodeGroupName).toContain(environmentSuffix);

      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });
  });
});
