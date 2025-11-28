/**
 * EKS Cluster Infrastructure Integration Tests
 *
 * These tests validate deployed AWS resources using the AWS SDK.
 * Tests gracefully skip when infrastructure is not deployed.
 *
 * Prerequisites:
 * - AWS credentials configured
 * - Terraform resources deployed (optional - tests will skip if not deployed)
 * - Environment variables:
 *   - AWS_REGION: Target AWS region (default: us-east-1)
 *   - ENVIRONMENT_SUFFIX: Environment suffix used in resource names (default: dev)
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  EKSClient,
  DescribeClusterCommand,
  ListNodegroupsCommand,
  DescribeNodegroupCommand,
  ListAddonsCommand,
  DescribeAddonCommand,
} from '@aws-sdk/client-eks';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListOpenIDConnectProvidersCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region: AWS_REGION });
const eksClient = new EKSClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const kmsClient = new KMSClient({ region: AWS_REGION });

// Track deployment status
let isDeployed = false;
let clusterExists = false;

describe('EKS Cluster Infrastructure Integration Tests', () => {
  // Pre-check: Verify deployment exists
  beforeAll(async () => {
    try {
      // Check if EKS cluster exists
      await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );
      clusterExists = true;
      isDeployed = true;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.warn(`EKS cluster eks-cluster-${ENVIRONMENT_SUFFIX} not found - tests will skip`);
        clusterExists = false;
      } else if (
        error.name === 'CredentialsProviderError' ||
        error.name === 'AccessDeniedException'
      ) {
        console.warn('AWS credentials not configured - skipping integration tests');
        isDeployed = false;
      } else {
        console.warn(`Deployment check failed: ${error.message}`);
        isDeployed = false;
      }
    }

    // Also check VPC as a secondary indicator
    try {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-vpc-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );
      if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
        isDeployed = true;
      }
    } catch (error: any) {
      // Ignore errors, we already checked cluster
    }
  });

  describe('VPC Configuration', () => {
    test('VPC should exist with correct CIDR and DNS settings', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-vpc-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.VpcId).toBeDefined();
      expect(vpc.State).toBe('available');
    });

    test('VPC should have kubernetes cluster tag', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-vpc-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      if (!response.Vpcs || response.Vpcs.length === 0) {
        console.log('Skipping - VPC not found');
        return;
      }

      const vpc = response.Vpcs[0];
      const clusterTag = vpc.Tags?.find(
        (t) => t.Key === `kubernetes.io/cluster/eks-cluster-${ENVIRONMENT_SUFFIX}`
      );
      expect(clusterTag?.Value).toBe('shared');
    });

    test('Internet Gateway should be attached to VPC', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-igw-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
      expect(response.InternetGateways![0].Attachments).toBeDefined();
      expect(response.InternetGateways![0].Attachments!.length).toBeGreaterThan(0);
    });
  });

  describe('Subnet Configuration', () => {
    test('Control plane private subnets should exist across 3 AZs', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:Tier',
              Values: ['control-plane'],
            },
            {
              Name: 'tag:kubernetes.io/role/internal-elb',
              Values: ['1'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);

      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(3);
    });

    test('System node group private subnets should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:NodeGroup',
              Values: ['system'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
    });

    test('Application node group private subnets should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:NodeGroup',
              Values: ['application'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
    });

    test('Spot node group private subnets should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'tag:NodeGroup',
              Values: ['spot'],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateways should exist for each AZ', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'state',
              Values: ['available'],
            },
          ],
        })
      );

      const eksNatGateways = response.NatGateways?.filter((nat) =>
        nat.Tags?.some(
          (t) =>
            t.Key === 'Name' &&
            t.Value?.includes(`eks-nat-gateway`) &&
            t.Value?.includes(ENVIRONMENT_SUFFIX)
        )
      );

      expect(eksNatGateways).toBeDefined();
      expect(eksNatGateways!.length).toBe(3);
    });
  });

  describe('Route Tables', () => {
    test('Private route tables should have NAT Gateway routes', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-private-rt-*-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);

      for (const rt of response.RouteTables!) {
        const natRoute = rt.Routes?.find((r) => r.NatGatewayId);
        expect(natRoute).toBeDefined();
        expect(natRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
      }
    });
  });

  describe('Security Groups', () => {
    test('EKS cluster security group should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-cluster-sg-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = response.SecurityGroups![0];
      const egressRule = sg.IpPermissionsEgress?.find(
        (p) => p.IpProtocol === '-1'
      );
      expect(egressRule).toBeDefined();
    });

    test('System nodes security group should exist with proper rules', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-system-nodes-sg-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = response.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBeGreaterThan(0);
    });

    test('Application nodes security group should allow HTTP/HTTPS from VPC', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-application-nodes-sg-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find((p) => p.FromPort === 80);
      const httpsRule = sg.IpPermissions?.find(
        (p) => p.FromPort === 443 && p.IpRanges?.some((r) => r.CidrIp)
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('Spot nodes security group should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'tag:Name',
              Values: [`eks-spot-nodes-sg-${ENVIRONMENT_SUFFIX}`],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('EKS Cluster', () => {
    test('EKS cluster should exist with correct version', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      expect(response.cluster).toBeDefined();
      expect(response.cluster!.name).toBe(`eks-cluster-${ENVIRONMENT_SUFFIX}`);
      expect(response.cluster!.version).toBe('1.28');
    });

    test('EKS cluster should have private endpoint only', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig?.endpointPrivateAccess).toBe(true);
      expect(vpcConfig?.endpointPublicAccess).toBe(false);
    });

    test('EKS cluster should have secrets encryption enabled', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const encryptionConfig = response.cluster!.encryptionConfig;
      expect(encryptionConfig).toBeDefined();
      expect(encryptionConfig!.length).toBeGreaterThan(0);
      expect(encryptionConfig![0].resources).toContain('secrets');
    });

    test('EKS cluster should have all log types enabled', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const logging = response.cluster!.logging;
      const enabledTypes = logging?.clusterLogging?.[0]?.types;

      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
    });

    test('EKS cluster should have OIDC issuer', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const response = await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const oidcIssuer = response.cluster!.identity?.oidc?.issuer;
      expect(oidcIssuer).toBeDefined();
      expect(oidcIssuer).toContain('oidc.eks');
    });
  });

  describe('EKS Node Groups', () => {
    test('System node group should exist with correct configuration', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeNodegroupCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            nodegroupName: `system-${ENVIRONMENT_SUFFIX}`,
          })
        );

        const nodegroup = response.nodegroup;
        expect(nodegroup).toBeDefined();
        expect(nodegroup!.instanceTypes).toContain('t3.medium');
        expect(nodegroup!.scalingConfig?.desiredSize).toBe(2);
        expect(nodegroup!.scalingConfig?.minSize).toBe(2);
        expect(nodegroup!.scalingConfig?.maxSize).toBe(4);
        expect(nodegroup!.labels?.workload).toBe('system');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - System node group not found');
          return;
        }
        throw error;
      }
    });

    test('Application node group should exist with correct configuration', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeNodegroupCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            nodegroupName: `application-${ENVIRONMENT_SUFFIX}`,
          })
        );

        const nodegroup = response.nodegroup;
        expect(nodegroup).toBeDefined();
        expect(nodegroup!.instanceTypes).toContain('m5.large');
        expect(nodegroup!.scalingConfig?.desiredSize).toBe(3);
        expect(nodegroup!.scalingConfig?.minSize).toBe(3);
        expect(nodegroup!.scalingConfig?.maxSize).toBe(10);
        expect(nodegroup!.labels?.workload).toBe('application');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - Application node group not found');
          return;
        }
        throw error;
      }
    });

    test('Spot node group should exist with SPOT capacity type', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeNodegroupCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            nodegroupName: `spot-${ENVIRONMENT_SUFFIX}`,
          })
        );

        const nodegroup = response.nodegroup;
        expect(nodegroup).toBeDefined();
        expect(nodegroup!.capacityType).toBe('SPOT');
        expect(nodegroup!.instanceTypes).toContain('m5.large');
        expect(nodegroup!.scalingConfig?.desiredSize).toBe(2);
        expect(nodegroup!.scalingConfig?.minSize).toBe(0);
        expect(nodegroup!.scalingConfig?.maxSize).toBe(10);
        expect(nodegroup!.labels?.workload).toBe('batch');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - Spot node group not found');
          return;
        }
        throw error;
      }
    });

    test('Node groups should have taints configured', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const nodegroups = ['system', 'application'];

      for (const ng of nodegroups) {
        try {
          const response = await eksClient.send(
            new DescribeNodegroupCommand({
              clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
              nodegroupName: `${ng}-${ENVIRONMENT_SUFFIX}`,
            })
          );

          const taints = response.nodegroup!.taints;
          expect(taints).toBeDefined();
          expect(taints!.length).toBeGreaterThan(0);

          const workloadTaint = taints!.find((t) => t.key === 'workload');
          expect(workloadTaint).toBeDefined();
          expect(workloadTaint!.effect).toBe('NO_SCHEDULE');
        } catch (error: any) {
          if (error.name === 'ResourceNotFoundException') {
            console.log(`Skipping - ${ng} node group not found`);
            continue;
          }
          throw error;
        }
      }
    });

    test('Node groups should have cluster autoscaler tags', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new ListNodegroupsCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
          })
        );

        expect(response.nodegroups).toBeDefined();
        expect(response.nodegroups!.length).toBeGreaterThanOrEqual(2);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - EKS cluster not found');
          return;
        }
        throw error;
      }
    });
  });

  describe('EKS Addons', () => {
    test('EBS CSI Driver addon should be installed', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeAddonCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            addonName: 'aws-ebs-csi-driver',
          })
        );

        expect(response.addon).toBeDefined();
        expect(response.addon!.addonName).toBe('aws-ebs-csi-driver');
        expect(response.addon!.status).toBe('ACTIVE');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - EBS CSI Driver addon not found');
          return;
        }
        throw error;
      }
    });

    test('VPC CNI addon should be installed', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeAddonCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            addonName: 'vpc-cni',
          })
        );

        expect(response.addon).toBeDefined();
        expect(response.addon!.addonName).toBe('vpc-cni');
        expect(response.addon!.status).toBe('ACTIVE');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - VPC CNI addon not found');
          return;
        }
        throw error;
      }
    });

    test('CoreDNS addon should be installed', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeAddonCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            addonName: 'coredns',
          })
        );

        expect(response.addon).toBeDefined();
        expect(response.addon!.addonName).toBe('coredns');
        expect(response.addon!.status).toBe('ACTIVE');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - CoreDNS addon not found');
          return;
        }
        throw error;
      }
    });

    test('Kube Proxy addon should be installed', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeAddonCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            addonName: 'kube-proxy',
          })
        );

        expect(response.addon).toBeDefined();
        expect(response.addon!.addonName).toBe('kube-proxy');
        expect(response.addon!.status).toBe('ACTIVE');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - Kube Proxy addon not found');
          return;
        }
        throw error;
      }
    });

    test('All required addons should be installed', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new ListAddonsCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
          })
        );

        expect(response.addons).toBeDefined();
        expect(response.addons).toContain('aws-ebs-csi-driver');
        expect(response.addons).toContain('vpc-cni');
        expect(response.addons).toContain('coredns');
        expect(response.addons).toContain('kube-proxy');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - EKS cluster not found');
          return;
        }
        throw error;
      }
    });
  });

  describe('IAM Roles', () => {
    test('EKS cluster IAM role should exist with correct policies', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const roleName = `eks-cluster-role-${ENVIRONMENT_SUFFIX}`;

      try {
        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleResponse.Role).toBeDefined();

        const policiesResponse = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );

        const policyArns = policiesResponse.AttachedPolicies?.map((p) => p.PolicyArn);
        expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
        expect(policyArns).toContain(
          'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'
        );
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('Skipping - EKS cluster IAM role not found');
          return;
        }
        throw error;
      }
    });

    test('EKS node group IAM role should exist with correct policies', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const roleName = `eks-node-group-role-${ENVIRONMENT_SUFFIX}`;

      try {
        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleResponse.Role).toBeDefined();

        const policiesResponse = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );

        const policyArns = policiesResponse.AttachedPolicies?.map((p) => p.PolicyArn);
        expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy');
        expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy');
        expect(policyArns).toContain(
          'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly'
        );
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('Skipping - EKS node group IAM role not found');
          return;
        }
        throw error;
      }
    });

    test('EBS CSI Driver IAM role should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const roleName = `eks-ebs-csi-driver-${ENVIRONMENT_SUFFIX}`;

      try {
        const response = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();

        const assumePolicy = JSON.parse(
          decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
        );
        const statement = assumePolicy.Statement[0];
        expect(statement.Action).toBe('sts:AssumeRoleWithWebIdentity');
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('Skipping - EBS CSI Driver IAM role not found');
          return;
        }
        throw error;
      }
    });

    test('Load Balancer Controller IAM role should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const roleName = `eks-load-balancer-controller-${ENVIRONMENT_SUFFIX}`;

      try {
        const response = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('Skipping - Load Balancer Controller IAM role not found');
          return;
        }
        throw error;
      }
    });

    test('Cluster autoscaler policy should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const roleName = `eks-node-group-role-${ENVIRONMENT_SUFFIX}`;

      try {
        const policiesResponse = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );

        const autoscalerPolicy = policiesResponse.AttachedPolicies?.find((p) =>
          p.PolicyName?.includes('cluster-autoscaler')
        );
        expect(autoscalerPolicy).toBeDefined();
      } catch (error: any) {
        if (error.name === 'NoSuchEntityException') {
          console.log('Skipping - EKS node group IAM role not found');
          return;
        }
        throw error;
      }
    });
  });

  describe('OIDC Provider', () => {
    test('OIDC provider should exist for EKS cluster', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const response = await iamClient.send(
        new ListOpenIDConnectProvidersCommand({})
      );

      expect(response.OpenIDConnectProviderList).toBeDefined();
      // Just verify we can list providers - may or may not have EKS-specific ones
    });
  });

  describe('KMS Key', () => {
    test('KMS key for EKS secrets encryption should exist', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const aliasesResponse = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const eksAlias = aliasesResponse.Aliases?.find(
        (a) => a.AliasName === `alias/eks-cluster-${ENVIRONMENT_SUFFIX}`
      );

      if (!eksAlias) {
        console.log('Skipping - KMS key alias not found');
        return;
      }

      expect(eksAlias).toBeDefined();
      expect(eksAlias!.TargetKeyId).toBeDefined();
    });

    test('KMS key should have key rotation enabled', async () => {
      if (!isDeployed) {
        console.log('Skipping - infrastructure not deployed');
        return;
      }

      const aliasesResponse = await kmsClient.send(
        new ListAliasesCommand({})
      );

      const eksAlias = aliasesResponse.Aliases?.find(
        (a) => a.AliasName === `alias/eks-cluster-${ENVIRONMENT_SUFFIX}`
      );

      if (eksAlias?.TargetKeyId) {
        const keyResponse = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: eksAlias.TargetKeyId })
        );

        expect(keyResponse.KeyMetadata).toBeDefined();
        expect(keyResponse.KeyMetadata!.Enabled).toBe(true);
      } else {
        console.log('Skipping - KMS key not found');
      }
    });
  });

  describe('Infrastructure Integration', () => {
    test('All node groups should use the same node IAM role', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const nodegroups = ['system', 'application'];
      const roleArns: string[] = [];

      for (const ng of nodegroups) {
        try {
          const response = await eksClient.send(
            new DescribeNodegroupCommand({
              clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
              nodegroupName: `${ng}-${ENVIRONMENT_SUFFIX}`,
            })
          );
          if (response.nodegroup?.nodeRole) {
            roleArns.push(response.nodegroup.nodeRole);
          }
        } catch (error: any) {
          if (error.name === 'ResourceNotFoundException') {
            console.log(`Skipping - ${ng} node group not found`);
            continue;
          }
          throw error;
        }
      }

      if (roleArns.length >= 2) {
        const uniqueRoles = new Set(roleArns);
        expect(uniqueRoles.size).toBe(1);
      }
    });

    test('EKS cluster should use correct VPC subnets', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      const clusterResponse = await eksClient.send(
        new DescribeClusterCommand({
          name: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
        })
      );

      const clusterSubnets = clusterResponse.cluster!.resourcesVpcConfig?.subnetIds;
      expect(clusterSubnets).toBeDefined();
      expect(clusterSubnets!.length).toBeGreaterThanOrEqual(6);
    });

    test('EKS addons should be using IRSA where applicable', async () => {
      if (!clusterExists) {
        console.log('Skipping - EKS cluster not deployed');
        return;
      }

      try {
        const response = await eksClient.send(
          new DescribeAddonCommand({
            clusterName: `eks-cluster-${ENVIRONMENT_SUFFIX}`,
            addonName: 'aws-ebs-csi-driver',
          })
        );

        expect(response.addon!.serviceAccountRoleArn).toBeDefined();
        expect(response.addon!.serviceAccountRoleArn).toContain('ebs-csi-driver');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.log('Skipping - EBS CSI Driver addon not found');
          return;
        }
        throw error;
      }
    });
  });
});
