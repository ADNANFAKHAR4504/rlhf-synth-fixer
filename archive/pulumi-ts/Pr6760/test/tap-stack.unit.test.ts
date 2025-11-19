import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const mockOutputs: Record<string, any> = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}-id`,
    };

    // Mock specific resource outputs
    switch (args.type) {
      case 'aws:eks/cluster:Cluster':
        mockOutputs.endpoint = 'https://mock-eks-endpoint.eks.amazonaws.com';
        mockOutputs.version = '1.28';
        mockOutputs.certificateAuthority = {
          data: 'mock-certificate-data',
        };
        mockOutputs.identities = [
          {
            oidcs: [
              {
                issuer: 'https://oidc.eks.us-east-1.amazonaws.com/id/MOCK',
              },
            ],
          },
        ];
        mockOutputs.vpcConfig = {
          clusterSecurityGroupId: 'sg-mock-cluster',
          // Cluster uses both public and private subnets (6 total for HA)
          subnetIds: [
            'subnet-private-1', 'subnet-private-2', 'subnet-private-3',
            'subnet-public-1', 'subnet-public-2', 'subnet-public-3'
          ],
        };
        break;
      case 'awsx:ec2:Vpc':
        mockOutputs.vpcId = 'vpc-mock';
        mockOutputs.privateSubnetIds = ['subnet-private-1', 'subnet-private-2', 'subnet-private-3'];
        mockOutputs.publicSubnetIds = ['subnet-public-1', 'subnet-public-2', 'subnet-public-3'];
        break;
      case 'aws:iam/role:Role':
        mockOutputs.name = args.name;
        break;
      case 'aws:eks/nodeGroup:NodeGroup':
        mockOutputs.arn = `arn:aws:eks:us-east-1:123456789012:nodegroup/${args.name}`;
        break;
      case 'aws:eks/addon:Addon':
        mockOutputs.addonName = args.inputs.addonName;
        mockOutputs.status = 'ACTIVE';
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        mockOutputs.retentionInDays = args.inputs.retentionInDays || 90;
        break;
    }

    return {
      id: mockOutputs.id,
      state: mockOutputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    return {};
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-eks-cluster', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        ManagedBy: 'Pulumi',
      },
    });
  });

  describe('Stack Creation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required output properties', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.clusterOidcIssuer).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
      expect(stack.clusterSecurityGroupId).toBeDefined();
      expect(stack.nodeGroupArns).toBeDefined();
    });

    it('should create a TapStack instance without tags', () => {
      const stackWithoutTags = new TapStack('test-eks-cluster-no-tags', {
        environmentSuffix: 'test-no-tags',
      });
      expect(stackWithoutTags).toBeDefined();
      expect(stackWithoutTags).toBeInstanceOf(TapStack);
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct naming convention', (done) => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toContain('vpc-mock');
        done();
      });
    });
  });

  describe('EKS Cluster Configuration', () => {
    it('should create cluster with environmentSuffix in name', (done) => {
      pulumi.all([stack.clusterName]).apply(([clusterName]) => {
        expect(clusterName).toContain('test');
        done();
      });
    });

    it('should have valid cluster endpoint', (done) => {
      pulumi.all([stack.clusterEndpoint]).apply(([endpoint]) => {
        expect(endpoint).toContain('https://');
        expect(endpoint).toContain('eks.amazonaws.com');
        done();
      });
    });

    it('should have OIDC issuer configured', (done) => {
      pulumi.all([stack.clusterOidcIssuer]).apply(([issuer]) => {
        expect(issuer).toContain('https://oidc.eks');
        done();
      });
    });

    it('should have kubeconfig with required fields', (done) => {
      pulumi.all([stack.kubeconfig]).apply(([kubeconfig]) => {
        const config = JSON.parse(kubeconfig);
        expect(config).toHaveProperty('apiVersion');
        expect(config).toHaveProperty('clusters');
        expect(config).toHaveProperty('contexts');
        expect(config).toHaveProperty('users');
        expect(config.apiVersion).toBe('v1');
        done();
      });
    });
  });

  describe('Node Groups', () => {
    it('should create two node groups', (done) => {
      pulumi.all([stack.nodeGroupArns]).apply(([arns]) => {
        expect(arns).toHaveLength(2);
        done();
      });
    });

    it('should have node group ARNs with correct format', (done) => {
      pulumi.all([stack.nodeGroupArns]).apply(([arns]) => {
        arns.forEach((arn) => {
          expect(arn).toContain('arn:aws:eks');
          expect(arn).toContain('nodegroup');
        });
        done();
      });
    });
  });

  describe('Security Configuration', () => {
    it('should have cluster security group', (done) => {
      pulumi.all([stack.clusterSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toContain('sg-');
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in cluster name', (done) => {
      pulumi.all([stack.clusterName]).apply(([name]) => {
        expect(name).toMatch(/eks-cluster-test/);
        done();
      });
    });
  });
});
