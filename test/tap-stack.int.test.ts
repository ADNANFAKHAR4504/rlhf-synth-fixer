import fs from 'fs';
import { execSync } from 'child_process';

// Load outputs from deployed stack
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

function awsCli(command: string): any {
  try {
    const result = execSync(`aws ${command} --region ${awsRegion} --output json`, {
      encoding: 'utf8'
    });
    return JSON.parse(result);
  } catch (error: any) {
    throw new Error(`AWS CLI command failed: ${error.message}`);
  }
}

describe('EKS Cluster Integration Tests', () => {
  describe('EKS Cluster Status', () => {
    test('EKS cluster should exist and be active', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);

      expect(cluster.cluster).toBeDefined();
      expect(cluster.cluster.status).toBe('ACTIVE');
      expect(cluster.cluster.name).toBe(outputs.ClusterName);
    });

    test('EKS cluster should have correct Kubernetes version', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);

      expect(cluster.cluster.version).toBeDefined();
      expect(cluster.cluster.version).toMatch(/^1\.(2[6-8])$/);
    });

    test('EKS cluster should have control plane logging enabled', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);
      const logging = cluster.cluster.logging.clusterLogging[0];

      expect(logging.enabled).toBe(true);
      expect(logging.types).toContain('api');
      expect(logging.types).toContain('audit');
      expect(logging.types).toContain('authenticator');
      expect(logging.types).toContain('controllerManager');
      expect(logging.types).toContain('scheduler');
    });

    test('EKS cluster should have encryption enabled', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);
      const encryptionConfig = cluster.cluster.encryptionConfig;

      expect(encryptionConfig).toBeDefined();
      expect(encryptionConfig.length).toBeGreaterThan(0);
      expect(encryptionConfig[0].resources).toContain('secrets');
    });

    test('EKS cluster endpoint should be accessible', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);

      expect(cluster.cluster.endpoint).toBeDefined();
      expect(cluster.cluster.endpoint).toBe(outputs.ClusterEndpoint);
      expect(cluster.cluster.endpoint).toMatch(/^https:\/\//);
    });

    test('EKS cluster should have both private and public endpoint access', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);
      const vpcConfig = cluster.cluster.resourcesVpcConfig;

      expect(vpcConfig.endpointPrivateAccess).toBe(true);
      expect(vpcConfig.endpointPublicAccess).toBe(true);
    });
  });

  describe('EKS Node Group Status', () => {
    test('node group should exist and be active', () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');
      const nodegroup = awsCli(
        `eks describe-nodegroup --cluster-name ${clusterName} --nodegroup-name ${nodegroupName}`
      );

      expect(nodegroup.nodegroup).toBeDefined();
      expect(nodegroup.nodegroup.status).toBe('ACTIVE');
    });

    test('node group should have correct scaling configuration', () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');
      const nodegroup = awsCli(
        `eks describe-nodegroup --cluster-name ${clusterName} --nodegroup-name ${nodegroupName}`
      );
      const scalingConfig = nodegroup.nodegroup.scalingConfig;

      expect(scalingConfig.minSize).toBeGreaterThanOrEqual(1);
      expect(scalingConfig.maxSize).toBeGreaterThanOrEqual(scalingConfig.minSize);
      expect(scalingConfig.desiredSize).toBeGreaterThanOrEqual(scalingConfig.minSize);
      expect(scalingConfig.desiredSize).toBeLessThanOrEqual(scalingConfig.maxSize);
    });

    test('node group should use AL2 AMI type', () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');
      const nodegroup = awsCli(
        `eks describe-nodegroup --cluster-name ${clusterName} --nodegroup-name ${nodegroupName}`
      );

      expect(nodegroup.nodegroup.amiType).toBe('AL2_x86_64');
    });

    test('node group should be deployed in private subnets', () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');
      const nodegroup = awsCli(
        `eks describe-nodegroup --cluster-name ${clusterName} --nodegroup-name ${nodegroupName}`
      );
      const subnets = nodegroup.nodegroup.subnets;

      expect(subnets).toContain(outputs.PrivateSubnet1Id);
      expect(subnets).toContain(outputs.PrivateSubnet2Id);
      expect(subnets.length).toBe(2);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist with correct configuration', () => {
      const vpcs = awsCli(`ec2 describe-vpcs --vpc-ids ${outputs.VpcId}`);

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs.length).toBe(1);
      expect(vpcs.Vpcs[0].VpcId).toBe(outputs.VpcId);
      expect(vpcs.Vpcs[0].State).toBe('available');
    });

    test('VPC should have DNS support and DNS hostnames enabled', () => {
      const dnsSupport = awsCli(
        `ec2 describe-vpc-attribute --vpc-id ${outputs.VpcId} --attribute enableDnsSupport`
      );
      const dnsHostnames = awsCli(
        `ec2 describe-vpc-attribute --vpc-id ${outputs.VpcId} --attribute enableDnsHostnames`
      );

      expect(dnsSupport.EnableDnsSupport.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames.Value).toBe(true);
    });

    test('all four subnets should exist and be available', () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      const subnets = awsCli(`ec2 describe-subnets --subnet-ids ${subnetIds.join(' ')}`);

      expect(subnets.Subnets.length).toBe(4);
      subnets.Subnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VpcId);
      });
    });

    test('public subnets should auto-assign public IPs', () => {
      const subnets = awsCli(
        `ec2 describe-subnets --subnet-ids ${outputs.PublicSubnet1Id} ${outputs.PublicSubnet2Id}`
      );

      subnets.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('subnets should be in different availability zones', () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id
      ];

      const subnets = awsCli(`ec2 describe-subnets --subnet-ids ${subnetIds.join(' ')}`);
      const azs = [...new Set(subnets.Subnets.map((s: any) => s.AvailabilityZone))];

      expect(azs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('NAT Gateways and Routing', () => {
    test('two NAT Gateways should exist and be available', () => {
      const nats = awsCli(
        `ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${outputs.VpcId}" "Name=state,Values=available"`
      );

      expect(nats.NatGateways.length).toBe(2);
    });

    test('NAT Gateways should be in public subnets', () => {
      const nats = awsCli(`ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${outputs.VpcId}"`);
      const natSubnets = nats.NatGateways.map((nat: any) => nat.SubnetId);

      expect(natSubnets).toContain(outputs.PublicSubnet1Id);
      expect(natSubnets).toContain(outputs.PublicSubnet2Id);
    });

    test('private subnets should have routes to NAT Gateways', () => {
      const routeTables = awsCli(
        `ec2 describe-route-tables --filters "Name=vpc-id,Values=${outputs.VpcId}"`
      );

      const privateRTs = routeTables.RouteTables.filter((rt: any) =>
        rt.Associations.some(
          (assoc: any) =>
            assoc.SubnetId === outputs.PrivateSubnet1Id ||
            assoc.SubnetId === outputs.PrivateSubnet2Id
        )
      );

      expect(privateRTs.length).toBeGreaterThanOrEqual(1);

      privateRTs.forEach((rt: any) => {
        const natRoute = rt.Routes.find(
          (route: any) => route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
        );
        expect(natRoute).toBeDefined();
      });
    });
  });

  describe('Security Groups', () => {
    test('cluster security group should exist', () => {
      const sgs = awsCli(`ec2 describe-security-groups --group-ids ${outputs.ClusterSecurityGroupId}`);

      expect(sgs.SecurityGroups.length).toBe(1);
      expect(sgs.SecurityGroups[0].GroupId).toBe(outputs.ClusterSecurityGroupId);
      expect(sgs.SecurityGroups[0].VpcId).toBe(outputs.VpcId);
    });

    test('security groups should have proper ingress rules for EKS communication', () => {
      const sgs = awsCli(`ec2 describe-security-groups --filters "Name=vpc-id,Values=${outputs.VpcId}"`);

      expect(sgs.SecurityGroups.length).toBeGreaterThanOrEqual(2);

      const hasNodeToNode = sgs.SecurityGroups.some((sg: any) =>
        sg.IpPermissions.some((rule: any) =>
          rule.UserIdGroupPairs.some((pair: any) => pair.GroupId === sg.GroupId)
        )
      );

      expect(hasNodeToNode).toBe(true);
    });
  });

  describe('CloudWatch Logging', () => {
    test('CloudWatch log group should exist for EKS cluster', () => {
      const logGroups = awsCli(
        `logs describe-log-groups --log-group-name-prefix ${outputs.ClusterLogGroupName}`
      );

      expect(logGroups.logGroups.length).toBeGreaterThanOrEqual(1);
      expect(logGroups.logGroups[0].logGroupName).toBe(outputs.ClusterLogGroupName);
    });

    test('log group should have retention policy configured', () => {
      const logGroups = awsCli(
        `logs describe-log-groups --log-group-name-prefix ${outputs.ClusterLogGroupName}`
      );
      const logGroup = logGroups.logGroups[0];

      expect(logGroup.retentionInDays).toBeDefined();
      expect(logGroup.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', () => {
      const key = awsCli(`kms describe-key --key-id ${outputs.KMSKeyId}`);

      expect(key.KeyMetadata).toBeDefined();
      expect(key.KeyMetadata.KeyState).toBe('Enabled');
      expect(key.KeyMetadata.KeyId).toBe(outputs.KMSKeyId);
    });

    test('KMS key should be customer managed', () => {
      const key = awsCli(`kms describe-key --key-id ${outputs.KMSKeyId}`);

      expect(key.KeyMetadata.KeyManager).toBe('CUSTOMER');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('EKS cluster should be using the deployed VPC', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);

      expect(cluster.cluster.resourcesVpcConfig.vpcId).toBe(outputs.VpcId);
    });

    test('EKS cluster should be using all deployed subnets', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);
      const clusterSubnets = cluster.cluster.resourcesVpcConfig.subnetIds;

      expect(clusterSubnets).toContain(outputs.PublicSubnet1Id);
      expect(clusterSubnets).toContain(outputs.PublicSubnet2Id);
      expect(clusterSubnets).toContain(outputs.PrivateSubnet1Id);
      expect(clusterSubnets).toContain(outputs.PrivateSubnet2Id);
    });

    test('EKS cluster should be using the deployed security group', () => {
      const cluster = awsCli(`eks describe-cluster --name ${outputs.ClusterName}`);
      const clusterSGs = cluster.cluster.resourcesVpcConfig.securityGroupIds;

      expect(clusterSGs).toContain(outputs.ClusterSecurityGroupId);
    });

    test('all resources should have correct tags with environmentSuffix', () => {
      const vpcs = awsCli(`ec2 describe-vpcs --vpc-ids ${outputs.VpcId}`);
      const vpcTags = vpcs.Vpcs[0].Tags;

      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toContain(environmentSuffix);
    });
  });
});
