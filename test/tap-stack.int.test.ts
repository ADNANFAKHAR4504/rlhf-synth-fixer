/**
 * Integration Tests for TAP Stack Deployment
 *
 * These tests validate the actual deployment outputs from cfn-outputs/flat-outputs.json
 * against expected values and infrastructure requirements. No AWS API calls are made.
 */
import * as fs from 'fs';
import * as path from 'path';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  let deploymentSummary: any;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Deployment outputs not found at ${outputsPath}. Run deployment first.`);
    }

    const rawData = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(rawData);

    // Parse deployment summary JSON string
    if (outputs.deploymentSummary) {
      deploymentSummary = JSON.parse(outputs.deploymentSummary);
    }
  });

  describe('Deployment Metadata', () => {
    test('should have valid deployment environment', () => {
      expect(outputs.deploymentEnvironment).toBeDefined();
      expect(typeof outputs.deploymentEnvironment).toBe('string');
      expect(outputs.deploymentEnvironment.length).toBeGreaterThan(0);
    });

    test('should have valid deployment region', () => {
      expect(outputs.deploymentRegion).toBeDefined();
      expect(outputs.deploymentRegion).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
    });

    test('should have valid deployment timestamp', () => {
      expect(outputs.deploymentTimestamp).toBeDefined();
      const timestamp = new Date(outputs.deploymentTimestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('should have deployment author information', () => {
      expect(outputs.deploymentAuthor).toBeDefined();
      expect(typeof outputs.deploymentAuthor).toBe('string');
    });

    test('should have repository information', () => {
      expect(outputs.deploymentRepository).toBeDefined();
      expect(typeof outputs.deploymentRepository).toBe('string');
    });

    test('should have deployment team information', () => {
      expect(outputs.deploymentTeam).toBeDefined();
      expect(typeof outputs.deploymentTeam).toBe('string');
    });

    test('should have PR number information', () => {
      expect(outputs.deploymentPRNumber).toBeDefined();
      expect(typeof outputs.deploymentPRNumber).toBe('string');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have valid VPC ID', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });

    test('should have correct VPC CIDR block', () => {
      expect(outputs.vpcCidr).toBe('10.0.0.0/16');
    });

    test('should have VPC information in deployment summary', () => {
      expect(deploymentSummary.vpc).toBeDefined();
      expect(deploymentSummary.vpc.vpcId).toBe(outputs.vpcId);
      expect(deploymentSummary.vpc.cidr).toBe('10.0.0.0/16');
    });
  });

  describe('EKS Cluster Configuration', () => {
    test('should have valid cluster name', () => {
      expect(outputs.clusterName).toBeDefined();
      expect(outputs.clusterName).toMatch(/^eks-cluster-/);
      expect(outputs.clusterName).toContain(outputs.deploymentEnvironment);
    });

    test('should have valid cluster endpoint', () => {
      expect(outputs.clusterEndpoint).toBeDefined();
      expect(outputs.clusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.clusterEndpoint).toContain('.eks.');
      expect(outputs.clusterEndpoint).toContain('.amazonaws.com');
    });

    test('should have valid cluster security group', () => {
      expect(outputs.clusterSecurityGroup).toBeDefined();
      expect(outputs.clusterSecurityGroup).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have valid OIDC provider ARN', () => {
      expect(outputs.clusterOidcProviderArn).toBeDefined();
      expect(outputs.clusterOidcProviderArn).toMatch(/^arn:aws:iam::\d{12}:oidc-provider\//);
      expect(outputs.clusterOidcProviderArn).toContain('oidc.eks.');
    });

    test('should have correct Kubernetes version', () => {
      expect(outputs.clusterVersion).toBe('1.28');
    });

    test('should have public endpoint access enabled', () => {
      expect(outputs.clusterEndpointPublicAccess).toBe('true');
    });

    test('should have private endpoint access enabled', () => {
      expect(outputs.clusterEndpointPrivateAccess).toBe('true');
    });

    test('should have cluster logging enabled', () => {
      expect(outputs.clusterLoggingEnabled).toBe('true');
    });

    test('should have correct cluster log types', () => {
      const logTypes = JSON.parse(outputs.clusterLogTypes);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
      expect(logTypes).toContain('authenticator');
      expect(logTypes).toHaveLength(3);
    });

    test('should have valid kubectl config command', () => {
      expect(outputs.kubectlConfigCommand).toBeDefined();
      expect(outputs.kubectlConfigCommand).toContain('aws eks update-kubeconfig');
      expect(outputs.kubectlConfigCommand).toContain(outputs.deploymentRegion);
      expect(outputs.kubectlConfigCommand).toContain(outputs.clusterName);
    });
  });

  describe('General Node Group Configuration', () => {
    test('should have valid general node group name', () => {
      expect(outputs.generalNodeGroupName).toBeDefined();
      expect(outputs.generalNodeGroupName).toMatch(/^general-/);
      expect(outputs.generalNodeGroupName).toContain(outputs.deploymentEnvironment);
    });

    test('should have correct general node group instance type', () => {
      expect(outputs.generalNodeGroupInstanceType).toBe('t3.large');
    });

    test('should have valid general node group min size', () => {
      const minSize = parseInt(outputs.generalNodeGroupMinSize);
      expect(minSize).toBe(2);
      expect(minSize).toBeGreaterThan(0);
    });

    test('should have valid general node group max size', () => {
      const maxSize = parseInt(outputs.generalNodeGroupMaxSize);
      expect(maxSize).toBe(10);
      expect(maxSize).toBeGreaterThanOrEqual(parseInt(outputs.generalNodeGroupMinSize));
    });

    test('should have valid general node group desired size', () => {
      const desiredSize = parseInt(outputs.generalNodeGroupDesiredSize);
      const minSize = parseInt(outputs.generalNodeGroupMinSize);
      const maxSize = parseInt(outputs.generalNodeGroupMaxSize);

      expect(desiredSize).toBe(2);
      expect(desiredSize).toBeGreaterThanOrEqual(minSize);
      expect(desiredSize).toBeLessThanOrEqual(maxSize);
    });

    test('should have general node group in deployment summary', () => {
      expect(deploymentSummary.nodeGroups.general).toBeDefined();
      expect(deploymentSummary.nodeGroups.general.name).toBe(outputs.generalNodeGroupName);
      expect(deploymentSummary.nodeGroups.general.instanceType).toBe('t3.large');
      expect(deploymentSummary.nodeGroups.general.minSize).toBe(2);
      expect(deploymentSummary.nodeGroups.general.maxSize).toBe(10);
      expect(deploymentSummary.nodeGroups.general.desiredSize).toBe(2);
    });
  });

  describe('Compute Node Group Configuration', () => {
    test('should have valid compute node group name', () => {
      expect(outputs.computeNodeGroupName).toBeDefined();
      expect(outputs.computeNodeGroupName).toMatch(/^compute-/);
      expect(outputs.computeNodeGroupName).toContain(outputs.deploymentEnvironment);
    });

    test('should have correct compute node group instance type', () => {
      expect(outputs.computeNodeGroupInstanceType).toBe('c5.2xlarge');
    });

    test('should have valid compute node group min size', () => {
      const minSize = parseInt(outputs.computeNodeGroupMinSize);
      expect(minSize).toBe(1);
      expect(minSize).toBeGreaterThan(0);
    });

    test('should have valid compute node group max size', () => {
      const maxSize = parseInt(outputs.computeNodeGroupMaxSize);
      expect(maxSize).toBe(5);
      expect(maxSize).toBeGreaterThanOrEqual(parseInt(outputs.computeNodeGroupMinSize));
    });

    test('should have valid compute node group desired size', () => {
      const desiredSize = parseInt(outputs.computeNodeGroupDesiredSize);
      const minSize = parseInt(outputs.computeNodeGroupMinSize);
      const maxSize = parseInt(outputs.computeNodeGroupMaxSize);

      expect(desiredSize).toBe(1);
      expect(desiredSize).toBeGreaterThanOrEqual(minSize);
      expect(desiredSize).toBeLessThanOrEqual(maxSize);
    });

    test('should have compute node group in deployment summary', () => {
      expect(deploymentSummary.nodeGroups.compute).toBeDefined();
      expect(deploymentSummary.nodeGroups.compute.name).toBe(outputs.computeNodeGroupName);
      expect(deploymentSummary.nodeGroups.compute.instanceType).toBe('c5.2xlarge');
      expect(deploymentSummary.nodeGroups.compute.minSize).toBe(1);
      expect(deploymentSummary.nodeGroups.compute.maxSize).toBe(5);
      expect(deploymentSummary.nodeGroups.compute.desiredSize).toBe(1);
    });
  });

  describe('Add-ons and Controllers', () => {
    test('should have Calico CNI version specified', () => {
      expect(outputs.calicoVersion).toBe('3.26.4');
    });

    test('should have Calico networking enabled', () => {
      expect(outputs.calicoNetworkingEnabled).toBe('true');
    });

    test('should have AWS Load Balancer Controller version', () => {
      expect(outputs.awsLoadBalancerControllerVersion).toBe('1.6.2');
    });

    test('should have cluster autoscaler enabled', () => {
      expect(outputs.clusterAutoscalerEnabled).toBe('true');
    });

    test('should have network policies enabled', () => {
      expect(outputs.networkPoliciesEnabled).toBe('true');
    });

    test('should have all add-ons in deployment summary', () => {
      expect(deploymentSummary.addons).toBeDefined();

      // Calico
      expect(deploymentSummary.addons.calico).toBeDefined();
      expect(deploymentSummary.addons.calico.version).toBe('3.26.4');
      expect(deploymentSummary.addons.calico.enabled).toBe(true);

      // AWS Load Balancer Controller
      expect(deploymentSummary.addons.awsLoadBalancerController).toBeDefined();
      expect(deploymentSummary.addons.awsLoadBalancerController.version).toBe('1.6.2');
      expect(deploymentSummary.addons.awsLoadBalancerController.enabled).toBe(true);

      // Cluster Autoscaler
      expect(deploymentSummary.addons.clusterAutoscaler).toBeDefined();
      expect(deploymentSummary.addons.clusterAutoscaler.enabled).toBe(true);

      // Network Policies
      expect(deploymentSummary.addons.networkPolicies).toBeDefined();
      expect(deploymentSummary.addons.networkPolicies.enabled).toBe(true);
    });
  });

  describe('Resource Tags', () => {
    test('should have resource tags defined', () => {
      expect(outputs.resourceTags).toBeDefined();
    });

    test('should have valid resource tags structure', () => {
      const tags = JSON.parse(outputs.resourceTags);

      expect(tags.Environment).toBe(outputs.deploymentEnvironment);
      expect(tags.Repository).toBe(outputs.deploymentRepository);
      expect(tags.Author).toBe(outputs.deploymentAuthor);
      expect(tags.PRNumber).toBe(outputs.deploymentPRNumber);
      expect(tags.Team).toBe(outputs.deploymentTeam);
      expect(tags.CreatedAt).toBe(outputs.deploymentTimestamp);
    });

    test('should have all required tag keys', () => {
      const tags = JSON.parse(outputs.resourceTags);
      const requiredKeys = ['Environment', 'Repository', 'Author', 'PRNumber', 'Team', 'CreatedAt'];

      requiredKeys.forEach(key => {
        expect(tags).toHaveProperty(key);
      });
    });
  });

  describe('Deployment Summary Validation', () => {
    test('should have valid deployment summary structure', () => {
      expect(deploymentSummary).toBeDefined();
      expect(deploymentSummary.deployment).toBeDefined();
      expect(deploymentSummary.vpc).toBeDefined();
      expect(deploymentSummary.cluster).toBeDefined();
      expect(deploymentSummary.nodeGroups).toBeDefined();
      expect(deploymentSummary.addons).toBeDefined();
    });

    test('should have consistent deployment information', () => {
      expect(deploymentSummary.deployment.environment).toBe(outputs.deploymentEnvironment);
      expect(deploymentSummary.deployment.region).toBe(outputs.deploymentRegion);
      expect(deploymentSummary.deployment.timestamp).toBe(outputs.deploymentTimestamp);
      expect(deploymentSummary.deployment.repository).toBe(outputs.deploymentRepository);
      expect(deploymentSummary.deployment.prNumber).toBe(outputs.deploymentPRNumber);
      expect(deploymentSummary.deployment.author).toBe(outputs.deploymentAuthor);
      expect(deploymentSummary.deployment.team).toBe(outputs.deploymentTeam);
    });

    test('should have consistent cluster information', () => {
      expect(deploymentSummary.cluster.name).toBe(outputs.clusterName);
      expect(deploymentSummary.cluster.endpoint).toBe(outputs.clusterEndpoint);
      expect(deploymentSummary.cluster.version).toBe(outputs.clusterVersion);
      expect(deploymentSummary.cluster.oidcProviderArn).toBe(outputs.clusterOidcProviderArn);
      expect(deploymentSummary.cluster.securityGroup).toBe(outputs.clusterSecurityGroup);
      expect(deploymentSummary.cluster.publicAccess).toBe(true);
      expect(deploymentSummary.cluster.privateAccess).toBe(true);
    });

    test('should have correct logging configuration', () => {
      expect(deploymentSummary.cluster.logging).toContain('api');
      expect(deploymentSummary.cluster.logging).toContain('audit');
      expect(deploymentSummary.cluster.logging).toContain('authenticator');
    });
  });

  describe('Naming Conventions', () => {
    test('should follow consistent naming pattern for cluster', () => {
      expect(outputs.clusterName).toMatch(/^eks-cluster-[a-z0-9]+$/);
    });

    test('should follow consistent naming pattern for node groups', () => {
      expect(outputs.generalNodeGroupName).toMatch(/^general-[a-z0-9]+$/);
      expect(outputs.computeNodeGroupName).toMatch(/^compute-[a-z0-9]+$/);
    });

    test('should use same environment suffix across resources', () => {
      const envSuffix = outputs.deploymentEnvironment;

      expect(outputs.clusterName).toContain(envSuffix);
      expect(outputs.generalNodeGroupName).toContain(envSuffix);
      expect(outputs.computeNodeGroupName).toContain(envSuffix);
    });
  });

  describe('Security Configuration', () => {
    test('should have both public and private endpoint access', () => {
      expect(outputs.clusterEndpointPublicAccess).toBe('true');
      expect(outputs.clusterEndpointPrivateAccess).toBe('true');
    });

    test('should have cluster logging enabled with audit logs', () => {
      expect(outputs.clusterLoggingEnabled).toBe('true');
      const logTypes = JSON.parse(outputs.clusterLogTypes);
      expect(logTypes).toContain('audit');
    });

    test('should have network policies enabled for pod isolation', () => {
      expect(outputs.networkPoliciesEnabled).toBe('true');
    });

    test('should have valid security group ID format', () => {
      expect(outputs.clusterSecurityGroup).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });
  });

  describe('Scalability Configuration', () => {
    test('should have cluster autoscaler enabled', () => {
      expect(outputs.clusterAutoscalerEnabled).toBe('true');
    });

    test('should have scalable general node group', () => {
      const min = parseInt(outputs.generalNodeGroupMinSize);
      const max = parseInt(outputs.generalNodeGroupMaxSize);

      expect(max).toBeGreaterThan(min);
      expect(max - min).toBeGreaterThanOrEqual(8); // Should have good scaling range
    });

    test('should have scalable compute node group', () => {
      const min = parseInt(outputs.computeNodeGroupMinSize);
      const max = parseInt(outputs.computeNodeGroupMaxSize);

      expect(max).toBeGreaterThan(min);
      expect(max - min).toBeGreaterThanOrEqual(4); // Should have good scaling range
    });
  });

  describe('Output Completeness', () => {
    test('should have all required deployment outputs', () => {
      const requiredOutputs = [
        'deploymentEnvironment',
        'deploymentRegion',
        'deploymentTimestamp',
        'deploymentRepository',
        'deploymentPRNumber',
        'deploymentAuthor',
        'deploymentTeam',
        'vpcId',
        'vpcCidr',
        'clusterName',
        'clusterEndpoint',
        'clusterSecurityGroup',
        'clusterVersion',
        'clusterOidcProviderArn',
        'kubectlConfigCommand',
        'generalNodeGroupName',
        'generalNodeGroupInstanceType',
        'generalNodeGroupMinSize',
        'generalNodeGroupMaxSize',
        'generalNodeGroupDesiredSize',
        'computeNodeGroupName',
        'computeNodeGroupInstanceType',
        'computeNodeGroupMinSize',
        'computeNodeGroupMaxSize',
        'computeNodeGroupDesiredSize',
        'calicoVersion',
        'awsLoadBalancerControllerVersion',
        'clusterAutoscalerEnabled',
        'calicoNetworkingEnabled',
        'networkPoliciesEnabled',
        'clusterEndpointPublicAccess',
        'clusterEndpointPrivateAccess',
        'clusterLoggingEnabled',
        'clusterLogTypes',
        'resourceTags',
        'deploymentSummary',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    test('should not have undefined or null outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
      });
    });

    test('should not have empty string outputs', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('AWS Resource Format Validation', () => {
    test('should have valid AWS resource ID formats', () => {
      // VPC ID
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);

      // Security Group ID
      expect(outputs.clusterSecurityGroup).toMatch(/^sg-[a-f0-9]{8,17}$/);
    });

    test('should have valid AWS ARN format', () => {
      expect(outputs.clusterOidcProviderArn).toMatch(/^arn:aws:[a-z-]+:[a-z0-9-]*:\d{12}:[a-zA-Z0-9-_\/:.]+$/);
    });

    test('should have valid AWS region format', () => {
      expect(outputs.deploymentRegion).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
      expect(['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']).toContain(outputs.deploymentRegion);
    });

    test('should have valid EKS endpoint URL', () => {
      const url = new URL(outputs.clusterEndpoint);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toContain('eks.');
      expect(url.hostname).toContain('amazonaws.com');
    });
  });

  describe('JSON Structure Validation', () => {
    test('should have valid JSON in deploymentSummary', () => {
      expect(() => JSON.parse(outputs.deploymentSummary)).not.toThrow();
    });

    test('should have valid JSON in resourceTags', () => {
      expect(() => JSON.parse(outputs.resourceTags)).not.toThrow();
    });

    test('should have valid JSON in clusterLogTypes', () => {
      expect(() => JSON.parse(outputs.clusterLogTypes)).not.toThrow();
      const logTypes = JSON.parse(outputs.clusterLogTypes);
      expect(Array.isArray(logTypes)).toBe(true);
    });
  });

  describe('Integration Consistency', () => {
    test('should have matching environment suffix across all resources', () => {
      const envSuffix = outputs.deploymentEnvironment;

      expect(outputs.clusterName).toContain(envSuffix);
      expect(outputs.generalNodeGroupName).toContain(envSuffix);
      expect(outputs.computeNodeGroupName).toContain(envSuffix);
      expect(deploymentSummary.deployment.environment).toBe(envSuffix);
    });

    test('should have matching region across all resources', () => {
      const region = outputs.deploymentRegion;

      expect(outputs.clusterEndpoint).toContain(region);
      expect(outputs.kubectlConfigCommand).toContain(region);
      expect(deploymentSummary.deployment.region).toBe(region);
    });

    test('should have consistent cluster references', () => {
      const clusterName = outputs.clusterName;

      expect(outputs.kubectlConfigCommand).toContain(clusterName);
      expect(deploymentSummary.cluster.name).toBe(clusterName);
    });
  });
});
