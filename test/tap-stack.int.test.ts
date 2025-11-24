import * as fs from 'fs';
import * as path from 'path';
import { EKSClient, DescribeClusterCommand } from '@aws-sdk/client-eks';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { EC2Client, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

describe('EKS Cluster Integration Tests', () => {
  let outputs: Record<string, any>;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please deploy the infrastructure first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('EKS Cluster Deployment', () => {
    it('should have deployed EKS cluster with correct version', async () => {
      const eksClient = new EKSClient({ region });
      const clusterName = outputs.clusterName;

      expect(clusterName).toBeDefined();
      expect(clusterName).toMatch(/eks-cluster-/);

      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster?.version).toBe('1.29');
      expect(response.cluster?.status).toBe('ACTIVE');
    });

    it('should have private endpoint access enabled', async () => {
      const eksClient = new EKSClient({ region });
      const clusterName = outputs.clusterName;

      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.resourcesVpcConfig?.endpointPrivateAccess).toBe(
        true
      );
      expect(response.cluster?.resourcesVpcConfig?.endpointPublicAccess).toBe(
        false
      );
    });

    it('should have encryption enabled with KMS', async () => {
      const eksClient = new EKSClient({ region });
      const clusterName = outputs.clusterName;

      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      expect(response.cluster?.encryptionConfig).toBeDefined();
      expect(response.cluster?.encryptionConfig?.length).toBeGreaterThan(0);
      expect(response.cluster?.encryptionConfig?.[0].resources).toContain(
        'secrets'
      );
    });

    it('should have all control plane log types enabled', async () => {
      const eksClient = new EKSClient({ region });
      const clusterName = outputs.clusterName;

      const command = new DescribeClusterCommand({ name: clusterName });
      const response = await eksClient.send(command);

      const enabledLogTypes =
        response.cluster?.logging?.clusterLogging?.[0]?.types || [];
      expect(enabledLogTypes).toContain('api');
      expect(enabledLogTypes).toContain('audit');
      expect(enabledLogTypes).toContain('authenticator');
      expect(enabledLogTypes).toContain('controllerManager');
      expect(enabledLogTypes).toContain('scheduler');
    });
  });

  describe('VPC Configuration', () => {
    it('should have created VPC with correct configuration', async () => {
      const vpcId = outputs.vpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/vpc-/);
    });

    it('should have 3 private subnets', async () => {
      const privateSubnetIds = outputs.privateSubnetIds;
      expect(privateSubnetIds).toBeDefined();
      expect(privateSubnetIds.length).toBe(3);

      const ec2Client = new EC2Client({ region });
      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBe(3);
      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should have 3 public subnets', async () => {
      const publicSubnetIds = outputs.publicSubnetIds;
      expect(publicSubnetIds).toBeDefined();
      expect(publicSubnetIds.length).toBe(3);

      const ec2Client = new EC2Client({ region });
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets?.length).toBe(3);
      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('KMS Encryption', () => {
    it('should have KMS key with rotation enabled', async () => {
      const kmsKeyId = outputs.kmsKeyId;
      expect(kmsKeyId).toBeDefined();

      const kmsClient = new KMSClient({ region });
      const command = new DescribeKeyCommand({ KeyId: kmsKeyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
    });

    it('should export KMS key ARN', () => {
      const kmsKeyArn = outputs.kmsKeyArn;
      expect(kmsKeyArn).toBeDefined();
      expect(kmsKeyArn).toMatch(/arn:aws:kms:/);
    });
  });

  describe('IRSA Configuration', () => {
    it('should have OIDC provider configured', () => {
      const oidcIssuerUrl = outputs.oidcIssuerUrl;
      expect(oidcIssuerUrl).toBeDefined();
      expect(oidcIssuerUrl).toMatch(/https:\/\//);
      expect(oidcIssuerUrl).toMatch(/oidc/);
    });

    it('should have S3 service account role created', async () => {
      const roleArn = outputs.s3ServiceAccountRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/arn:aws:iam:/);

      const iamClient = new IAMClient({ region });
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have DynamoDB service account role created', async () => {
      const roleArn = outputs.dynamodbServiceAccountRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/arn:aws:iam:/);

      const iamClient = new IAMClient({ region });
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should have cluster autoscaler role created', async () => {
      const roleArn = outputs.clusterAutoscalerRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/arn:aws:iam:/);

      const iamClient = new IAMClient({ region });
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });

  describe('EKS Add-ons', () => {
    it('should have correct CoreDNS version', () => {
      const version = outputs.coreDnsAddonVersion;
      expect(version).toBeDefined();
      expect(version).toMatch(/v1\.11\.1/);
    });

    it('should have correct kube-proxy version', () => {
      const version = outputs.kubeProxyAddonVersion;
      expect(version).toBeDefined();
      expect(version).toMatch(/v1\.29\.0/);
    });

    it('should have correct vpc-cni version', () => {
      const version = outputs.vpcCniAddonVersion;
      expect(version).toBeDefined();
      expect(version).toMatch(/v1\.16\.0/);
    });
  });

  describe('Kubernetes Resources', () => {
    it('should have service account names exported', () => {
      expect(outputs.s3ServiceAccountName).toBe('s3-access-sa');
      expect(outputs.dynamodbServiceAccountName).toBe('dynamodb-access-sa');
    });

    it('should have cluster autoscaler deployment name', () => {
      expect(outputs.clusterAutoscalerDeploymentName).toBe(
        'cluster-autoscaler'
      );
    });

    it('should have Container Insights DaemonSet name', () => {
      expect(outputs.containerInsightsDaemonSetName).toBe('cloudwatch-agent');
    });

    it('should have pod security standards configured', () => {
      const labels = outputs.defaultNamespacePSSLabels;
      expect(labels).toBeDefined();
      expect(labels['pod-security.kubernetes.io/enforce']).toBe('restricted');
      expect(labels['pod-security.kubernetes.io/audit']).toBe('restricted');
      expect(labels['pod-security.kubernetes.io/warn']).toBe('restricted');
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in all resource names', () => {
      expect(outputs.clusterName).toMatch(/eks-cluster-/);
      expect(outputs.vpcId).toMatch(/eks-vpc-/);
      expect(outputs.kmsKeyId).toMatch(/eks-secrets-key-/);
      expect(outputs.kmsKeyAliasName).toMatch(/alias\/eks-secrets-/);
    });
  });

  describe('Kubeconfig', () => {
    it('should export valid kubeconfig', () => {
      const kubeconfig = outputs.kubeconfig;
      expect(kubeconfig).toBeDefined();

      const config = JSON.parse(kubeconfig);
      expect(config.apiVersion).toBe('v1');
      expect(config.kind).toBe('Config');
      expect(config.clusters).toBeDefined();
      expect(config.clusters.length).toBeGreaterThan(0);
      expect(config.contexts).toBeDefined();
      expect(config.users).toBeDefined();
      expect(config['current-context']).toBe('aws');
    });

    it('should have cluster endpoint in kubeconfig', () => {
      const kubeconfig = JSON.parse(outputs.kubeconfig);
      const clusterEndpoint = kubeconfig.clusters[0].cluster.server;
      expect(clusterEndpoint).toBeDefined();
      expect(clusterEndpoint).toMatch(/https:\/\//);
      expect(clusterEndpoint).toBe(outputs.clusterEndpoint);
    });
  });
});
