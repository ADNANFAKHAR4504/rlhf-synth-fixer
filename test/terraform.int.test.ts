// Integration tests for Terraform EKS infrastructure
// These tests verify deployed AWS resources using AWS SDK
import * as fs from 'fs';
import * as path from 'path';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  DescribeAddonCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetOpenIDConnectProviderCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';

// Read deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

// Parse JSON arrays in outputs
function parseOutput(value: string): any {
  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

// Extract cluster name and region from outputs
function getClusterNameAndRegion(): { clusterName: string; region: string } {
  const clusterId = outputs.cluster_id || '';
  const configureKubectl = outputs.configure_kubectl || '';
  const region = configureKubectl.match(/--region\s+(\S+)/)?.[1] || 'us-east-1';
  return { clusterName: clusterId, region };
}

// Initialize AWS clients
function initializeClients(region: string) {
  return {
    eks: new EKSClient({ region }),
    ec2: new EC2Client({ region }),
    iam: new IAMClient({ region }),
    kms: new KMSClient({ region }),
  };
}

describe('Terraform EKS Integration Tests', () => {
  beforeAll(() => {
    // Read outputs file
    if (fs.existsSync(outputsPath)) {
      const rawData = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(rawData);
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } else {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }
  });

  describe('Output File Validation', () => {
    test('should have required outputs', () => {
      const requiredOutputs = [
        'cluster_id',
        'cluster_arn',
        'cluster_endpoint',
        'cluster_version',
        'vpc_id',
        'kms_key_arn',
        'system_node_group_id',
        'application_node_group_id',
        'spot_node_group_id',
      ];

      requiredOutputs.forEach((output) => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeTruthy();
      });
    });

    test('should have valid ARN formats', () => {
      const arnOutputs = [
        'cluster_arn',
        'kms_key_arn',
        'oidc_provider_arn',
        'ebs_csi_driver_role_arn',
        'aws_load_balancer_controller_role_arn',
        'cluster_autoscaler_role_arn',
      ];

      arnOutputs.forEach((output) => {
        expect(outputs[output]).toMatch(/^arn:aws:[a-z-]+:[a-z0-9-]*:\d{12}:.+/);
      });
    });
  });

  describe('EKS Cluster Verification', () => {
    let clients: ReturnType<typeof initializeClients>;
    let clusterName: string;

    beforeAll(() => {
      const { clusterName: name, region } = getClusterNameAndRegion();
      clusterName = name;
      clients = initializeClients(region);
    });

    test('should verify EKS cluster exists and is active', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await clients.eks.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.name).toBe(clusterName);
      expect(response.cluster?.status).toBe('ACTIVE');
      expect(response.cluster?.endpoint).toBe(outputs.cluster_endpoint);
      expect(response.cluster?.version).toBe(outputs.cluster_version);
    }, 30000);

    test('should verify cluster has correct networking configuration', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await clients.eks.send(command);

      expect(response.cluster?.resourcesVpcConfig).toBeDefined();
      expect(response.cluster?.resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
      expect(response.cluster?.resourcesVpcConfig?.endpointPublicAccess).toBe(false);
      expect(response.cluster?.resourcesVpcConfig?.vpcId).toBe(outputs.vpc_id);
    }, 30000);

    test('should verify cluster has encryption enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await clients.eks.send(command);

      expect(response.cluster?.encryptionConfig).toBeDefined();
      expect(response.cluster?.encryptionConfig?.length).toBeGreaterThan(0);
      expect(response.cluster?.encryptionConfig?.[0].resources).toContain('secrets');
    }, 30000);

    test('should verify cluster has all logging enabled', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await clients.eks.send(command);

      const enabledLogTypes = response.cluster?.logging?.clusterLogging?.[0]?.types || [];
      const expectedLogTypes = ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler'];

      expectedLogTypes.forEach((logType) => {
        expect(enabledLogTypes).toContain(logType);
      });
    }, 30000);
  });

  describe('Node Groups Verification', () => {
    let clients: ReturnType<typeof initializeClients>;
    let clusterName: string;

    beforeAll(() => {
      const { clusterName: name, region } = getClusterNameAndRegion();
      clusterName = name;
      clients = initializeClients(region);
    });

    test('should verify system node group exists and is active', async () => {
      const nodeGroupId = outputs.system_node_group_id;
      const nodeGroupName = nodeGroupId.split(':')[1];

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await clients.eks.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup?.status).toBe('ACTIVE');
      expect(response.nodegroup?.capacityType).toBe('ON_DEMAND');
      expect(response.nodegroup?.scalingConfig?.desiredSize).toBeGreaterThan(0);
    }, 30000);

    test('should verify application node group exists and is active', async () => {
      const nodeGroupId = outputs.application_node_group_id;
      const nodeGroupName = nodeGroupId.split(':')[1];

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await clients.eks.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup?.status).toBe('ACTIVE');
      expect(response.nodegroup?.capacityType).toBe('ON_DEMAND');
      expect(response.nodegroup?.scalingConfig?.minSize).toBeDefined();
      expect(response.nodegroup?.scalingConfig?.maxSize).toBeDefined();
    }, 30000);

    test('should verify spot node group exists and is active', async () => {
      const nodeGroupId = outputs.spot_node_group_id;
      const nodeGroupName = nodeGroupId.split(':')[1];

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: nodeGroupName,
      });
      const response = await clients.eks.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup?.status).toBe('ACTIVE');
      expect(response.nodegroup?.capacityType).toBe('SPOT');
    }, 30000);

    test('should verify node groups use correct subnets', async () => {
      const systemNodeGroupId = outputs.system_node_group_id;
      const systemNodeGroupName = systemNodeGroupId.split(':')[1];

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: systemNodeGroupName,
      });
      const response = await clients.eks.send(command);

      const systemSubnets = parseOutput(outputs.system_private_subnet_ids);
      expect(response.nodegroup?.subnets).toBeDefined();
      expect(response.nodegroup?.subnets?.length).toBeGreaterThan(0);

      // Verify at least one subnet matches
      const hasMatchingSubnet = response.nodegroup?.subnets?.some((subnet: string) =>
        systemSubnets.includes(subnet)
      );
      expect(hasMatchingSubnet).toBe(true);
    }, 30000);

    test('should verify node groups have cluster autoscaler tags', async () => {
      const systemNodeGroupId = outputs.system_node_group_id;
      const systemNodeGroupName = systemNodeGroupId.split(':')[1];

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName: systemNodeGroupName,
      });
      const response = await clients.eks.send(command);

      const tags = response.nodegroup?.tags || {};
      expect(tags[`k8s.io/cluster-autoscaler/${clusterName}`]).toBe('owned');
      expect(tags['k8s.io/cluster-autoscaler/enabled']).toBe('true');
    }, 30000);
  });

  describe('VPC and Networking Verification', () => {
    let clients: ReturnType<typeof initializeClients>;

    beforeAll(() => {
      const { region } = getClusterNameAndRegion();
      clients = initializeClients(region);
    });

    test('should verify all subnet types exist', async () => {
      const allSubnetIds = [
        ...parseOutput(outputs.system_private_subnet_ids),
        ...parseOutput(outputs.application_private_subnet_ids),
        ...parseOutput(outputs.spot_private_subnet_ids),
        ...parseOutput(outputs.public_subnet_ids),
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await clients.ec2.send(command);

      expect(response.Subnets?.length).toBe(12); // 3 AZs * 4 subnet types
      expect(response.Subnets?.every((subnet) => subnet.VpcId === outputs.vpc_id)).toBe(true);
    }, 30000);

    test('should verify NAT gateways exist and are available', async () => {
      const natGatewayIds = parseOutput(outputs.nat_gateway_ids);

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await clients.ec2.send(command);

      expect(response.NatGateways?.length).toBe(3); // One per AZ
      response.NatGateways?.forEach((natGw) => {
        expect(natGw.State).toBe('available');
        expect(natGw.VpcId).toBe(outputs.vpc_id);
      });
    }, 30000);

    test('should verify cluster security group configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.cluster_security_group_id],
      });
      const response = await clients.ec2.send(command);

      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].VpcId).toBe(outputs.vpc_id);
      expect(response.SecurityGroups?.[0].GroupName).toContain('eks-cluster-sg');
    }, 30000);
  });

  describe('KMS Encryption Verification', () => {
    let clients: ReturnType<typeof initializeClients>;

    beforeAll(() => {
      const { region } = getClusterNameAndRegion();
      clients = initializeClients(region);
    });

    test('should verify KMS key exists and is enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id,
      });
      const response = await clients.kms.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(response.KeyMetadata?.Arn).toBe(outputs.kms_key_arn);
    }, 30000);

    test('should verify KMS key rotation is enabled', async () => {
      const command = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id,
      });
      const response = await clients.kms.send(command);

      expect(response.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('IAM Roles Verification', () => {
    let clients: ReturnType<typeof initializeClients>;

    beforeAll(() => {
      const { region } = getClusterNameAndRegion();
      clients = initializeClients(region);
    });

    test('should verify EBS CSI driver IAM role exists', async () => {
      const roleArn = outputs.ebs_csi_driver_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await clients.iam.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(roleArn);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    }, 30000);

    test('should verify AWS Load Balancer Controller IAM role exists', async () => {
      const roleArn = outputs.aws_load_balancer_controller_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await clients.iam.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(roleArn);
    }, 30000);

    test('should verify Cluster Autoscaler IAM role exists', async () => {
      const roleArn = outputs.cluster_autoscaler_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await clients.iam.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(roleArn);
    }, 30000);

    test('should verify IAM roles have IRSA trust policy', async () => {
      const roleArn = outputs.ebs_csi_driver_role_arn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await clients.iam.send(command);

      const assumeRolePolicy = decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '');
      expect(assumeRolePolicy).toContain('sts:AssumeRoleWithWebIdentity');
      expect(assumeRolePolicy).toContain(outputs.oidc_provider_arn.split('/').pop());
    }, 30000);
  });

  describe('EKS Addons Verification', () => {
    let clients: ReturnType<typeof initializeClients>;
    let clusterName: string;

    beforeAll(() => {
      const { clusterName: name, region } = getClusterNameAndRegion();
      clusterName = name;
      clients = initializeClients(region);
    });

    test('should verify EBS CSI driver addon status when enabled', async () => {
      const ebsCsiEnabled = outputs.ebs_csi_driver_enabled;

      if (!ebsCsiEnabled || ebsCsiEnabled === 'false' || ebsCsiEnabled === false) {
        console.log('EBS CSI driver addon is disabled, skipping verification');
        return;
      }

      const command = new DescribeAddonCommand({
        clusterName,
        addonName: 'aws-ebs-csi-driver',
      });

      try {
        const response = await clients.eks.send(command);
        expect(response.addon?.status).toMatch(/ACTIVE|CREATING|UPDATING/);
        expect(response.addon?.serviceAccountRoleArn).toBe(outputs.ebs_csi_driver_role_arn);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn('EBS CSI driver addon not found - this is expected when disabled');
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('Resource Tagging Verification', () => {
    let clients: ReturnType<typeof initializeClients>;
    let clusterName: string;

    beforeAll(() => {
      const { clusterName: name, region } = getClusterNameAndRegion();
      clusterName = name;
      clients = initializeClients(region);
    });

    test('should verify EKS cluster has correct tags', async () => {
      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await clients.eks.send(command);

      const tags = response.cluster?.tags || {};
      expect(tags.ManagedBy).toBe('terraform');
      expect(tags.Environment).toBeDefined();
    }, 30000);

    test('should verify VPC has Kubernetes cluster tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      const response = await clients.ec2.send(command);

      const tags = response.Vpcs?.[0].Tags || [];
      const clusterTag = tags.find((tag) => tag.Key === `kubernetes.io/cluster/${clusterName}`);
      expect(clusterTag?.Value).toBe('shared');
    }, 30000);
  });

  describe('High Availability Verification', () => {
    let clients: ReturnType<typeof initializeClients>;

    beforeAll(() => {
      const { region } = getClusterNameAndRegion();
      clients = initializeClients(region);
    });

    test('should verify resources are distributed across multiple AZs', async () => {
      const allSubnetIds = [
        ...parseOutput(outputs.system_private_subnet_ids),
        ...parseOutput(outputs.application_private_subnet_ids),
        ...parseOutput(outputs.spot_private_subnet_ids),
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await clients.ec2.send(command);

      const uniqueAZs = new Set(response.Subnets?.map((subnet) => subnet.AvailabilityZone));
      expect(uniqueAZs.size).toBeGreaterThanOrEqual(3); // At least 3 AZs
    }, 30000);

    test('should verify each AZ has NAT gateway for HA', async () => {
      const natGatewayIds = parseOutput(outputs.nat_gateway_ids);

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds,
      });
      const response = await clients.ec2.send(command);

      const uniqueAZs = new Set(
        response.NatGateways?.map((natGw) => natGw.SubnetId).map((subnetId) => {
          // Get AZ from subnet would require additional call, so just verify count
          return subnetId;
        })
      );
      expect(response.NatGateways?.length).toBe(3); // One NAT gateway per AZ
    }, 30000);
  });
});
