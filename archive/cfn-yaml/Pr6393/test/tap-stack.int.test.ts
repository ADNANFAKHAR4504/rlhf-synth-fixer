import fs from 'fs';
import path from 'path';
import { EKS } from '@aws-sdk/client-eks';
import { IAM } from '@aws-sdk/client-iam';

const defaultRegion = (() => {
  try {
    const regionFile = path.join(__dirname, '../lib/AWS_REGION');
    return fs.readFileSync(regionFile, 'utf8').trim();
  } catch {
    return 'us-east-1';
  }
})();

const region = process.env.AWS_REGION || defaultRegion;
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth101912514';

const eksClient = new EKS({ region });
const iamClient = new IAM({ region });

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
      expect(arn).toMatch(new RegExp(`^arn:aws:eks:${region}:\\d+:cluster/`));
      expect(arn).toContain(environmentSuffix);
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

    test('should have cluster role with required managed policies', async () => {
      const roleName = `eks-cluster-role-${environmentSuffix}`;
      const { AttachedPolicies } = await iamClient.listAttachedRolePolicies({
        RoleName: roleName
      });

      const policyArns = AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSClusterPolicy');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonEKSVPCResourceController');
    });
  });

  describe('Security Validation', () => {
    test('cluster should not be publicly accessible', async () => {
      const clusterName = outputs.ClusterName;
      const { cluster } = await eksClient.describeCluster({ name: clusterName });

      expect(cluster.resourcesVpcConfig?.endpointPublicAccess).toBe(false);
      expect(cluster.resourcesVpcConfig?.publicAccessCidrs ?? []).toHaveLength(0);
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
});
