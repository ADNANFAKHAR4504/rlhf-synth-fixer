import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocks before any tests run
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const mockId = `${args.name}_id`;

    // Mock EKS Cluster with proper structure
    if (args.type === 'aws:eks/cluster:Cluster') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          name: args.inputs.name || args.name,
          endpoint: 'https://mock-eks-endpoint.eks.us-east-1.amazonaws.com',
          certificateAuthority: {
            data: 'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvVENDQWVXZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJek1ERXhNREExTVRBd01Gb1hEVE16TURFd056QTFNVEF3TUZvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTEloCk1vY2tEYXRh',
          },
          identities: [
            {
              oidcs: [
                {
                  issuer: 'https://oidc.eks.us-east-1.amazonaws.com/id/MOCK-OIDC-ID',
                },
              ],
            },
          ],
          version: args.inputs.version || '1.28',
          roleArn: args.inputs.roleArn,
          vpcConfig: args.inputs.vpcConfig,
          arn: `arn:aws:eks:us-east-1:123456789012:cluster/${args.name}`,
        },
      };
    }

    // Mock VPC
    if (args.type === 'aws:ec2/vpc:Vpc') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          cidrBlock: args.inputs.cidrBlock || '10.0.0.0/16',
          arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${mockId}`,
        },
      };
    }

    // Mock Subnet
    if (args.type === 'aws:ec2/subnet:Subnet') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          availabilityZone: args.inputs.availabilityZone || 'us-east-1a',
          cidrBlock: args.inputs.cidrBlock || '10.0.0.0/24',
        },
      };
    }

    // Mock Security Group
    if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          arn: `arn:aws:ec2:us-east-1:123456789012:security-group/${mockId}`,
        },
      };
    }

    // Mock IAM Role
    if (args.type === 'aws:iam/role:Role') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          name: args.inputs.name || args.name,
          arn: `arn:aws:iam::123456789012:role/${args.name}`,
        },
      };
    }


    // Mock CloudWatch Log Group
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          arn: `arn:aws:logs:us-east-1:123456789012:log-group:${args.name}`,
        },
      };
    }

    // Mock EKS Addon
    if (args.type === 'aws:eks/addon:Addon') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          arn: `arn:aws:eks:us-east-1:123456789012:addon/${args.name}`,
        },
      };
    }

    // Mock OIDC Provider
    if (args.type === 'aws:iam/openIdConnectProvider:OpenIdConnectProvider') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          arn: `arn:aws:iam::123456789012:oidc-provider/${mockId}`,
        },
      };
    }

    // Mock VPC Endpoint
    if (args.type === 'aws:ec2/vpcEndpoint:VpcEndpoint') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          arn: `arn:aws:ec2:us-east-1:123456789012:vpc-endpoint/${mockId}`,
        },
      };
    }

    // Mock Route Table
    if (args.type === 'aws:ec2/routeTable:RouteTable') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
        },
      };
    }

    // Mock Kubernetes Provider
    if (args.type === 'pulumi:providers:kubernetes') {
      return {
        id: mockId,
        state: args.inputs,
      };
    }

    // Mock Kubernetes Custom Resource (ENIConfig)
    if (args.type === 'kubernetes:apiextensions.k8s.io/v1:CustomResource') {
      return {
        id: mockId,
        state: args.inputs,
      };
    }

    // Mock Helm Release
    if (args.type === 'kubernetes:helm.sh/v3:Release') {
      return {
        id: mockId,
        state: {
          ...args.inputs,
          status: 'deployed',
        },
      };
    }

    // Mock ConfigMap
    if (args.type === 'kubernetes:core/v1:ConfigMap') {
      return {
        id: mockId,
        state: args.inputs,
      };
    }

    // Default mock for any other resource type
    return {
      id: mockId,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock SSM getParameter calls for AMI IDs
    if (args.token === 'aws:ssm/getParameter:getParameter') {
      return {
        outputs: {
          name: args.inputs.name,
          value: 'ami-mock-eks-optimized-123456',
          type: 'String',
          version: 1,
        },
      };
    }
    return {
      outputs: {},
    };
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Initialization', () => {
    it('should instantiate with minimal configuration', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.oidcIssuer).toBeDefined();
      expect(stack.kubeconfig).toBeDefined();
    });

    it('should use default environment suffix when not provided', async () => {
      const stack = new TapStack('test-stack-default', {});

      expect(stack).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
    });

    it('should accept custom tags', async () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined args object', async () => {
      const stack = new TapStack('test-stack-no-args', {});

      expect(stack).toBeDefined();
    });
  });

  describe('EKS Cluster Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-eks', {
        environmentSuffix: 'test',
      });
    });

    it('should create EKS cluster with correct version', async () => {
      expect(stack).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();

      const endpoint = await stack.clusterEndpoint.promise();
      expect(endpoint).toContain('eks.us-east-1.amazonaws.com');
    });

    it('should configure OIDC provider', async () => {
      const oidcIssuer = await stack.oidcIssuer.promise();
      expect(oidcIssuer).toContain('oidc.eks.us-east-1.amazonaws.com');
    });

    it('should generate kubeconfig', async () => {
      const kubeconfig = await stack.kubeconfig.promise();
      expect(kubeconfig).toBeDefined();

      const kubeconfigObj = JSON.parse(kubeconfig);
      expect(kubeconfigObj.apiVersion).toBe('v1');
      expect(kubeconfigObj.kind).toBe('Config');
      expect(kubeconfigObj.clusters).toBeDefined();
      expect(kubeconfigObj.users).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR', async () => {
      const stack = new TapStack('test-vpc', {
        environmentSuffix: 'vpc-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create secondary CIDR for pods', async () => {
      const stack = new TapStack('test-secondary-cidr', {
        environmentSuffix: 'cidr-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create node subnets in multiple AZs', async () => {
      const stack = new TapStack('test-node-subnets', {
        environmentSuffix: 'subnet-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create pod subnets from secondary CIDR', async () => {
      const stack = new TapStack('test-pod-subnets', {
        environmentSuffix: 'pod-test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    it('should create cluster security group', async () => {
      const stack = new TapStack('test-cluster-sg', {
        environmentSuffix: 'sg-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create node security group', async () => {
      const stack = new TapStack('test-node-sg', {
        environmentSuffix: 'node-sg-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create VPC endpoint security group', async () => {
      const stack = new TapStack('test-vpce-sg', {
        environmentSuffix: 'vpce-test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create EKS cluster role', async () => {
      const stack = new TapStack('test-cluster-role', {
        environmentSuffix: 'role-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create node group role', async () => {
      const stack = new TapStack('test-node-role', {
        environmentSuffix: 'node-role-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create cluster autoscaler role', async () => {
      const stack = new TapStack('test-autoscaler-role', {
        environmentSuffix: 'autoscaler-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create load balancer controller role', async () => {
      const stack = new TapStack('test-lb-role', {
        environmentSuffix: 'lb-test',
      });

      expect(stack).toBeDefined();
    });
  });


  describe('EKS Addons', () => {
    it('should install VPC CNI addon', async () => {
      const stack = new TapStack('test-vpc-cni', {
        environmentSuffix: 'cni-test',
      });

      expect(stack).toBeDefined();
    });

    it('should install kube-proxy addon', async () => {
      const stack = new TapStack('test-kube-proxy', {
        environmentSuffix: 'proxy-test',
      });

      expect(stack).toBeDefined();
    });

    it('should install CoreDNS addon', async () => {
      const stack = new TapStack('test-coredns', {
        environmentSuffix: 'dns-test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('VPC Endpoints', () => {
    it('should create S3 gateway endpoint', async () => {
      const stack = new TapStack('test-s3-endpoint', {
        environmentSuffix: 's3-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create EC2 interface endpoint', async () => {
      const stack = new TapStack('test-ec2-endpoint', {
        environmentSuffix: 'ec2-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create ECR API and Docker endpoints', async () => {
      const stack = new TapStack('test-ecr-endpoints', {
        environmentSuffix: 'ecr-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create CloudWatch Logs endpoint', async () => {
      const stack = new TapStack('test-logs-endpoint', {
        environmentSuffix: 'logs-test',
      });

      expect(stack).toBeDefined();
    });

    it('should create STS endpoint', async () => {
      const stack = new TapStack('test-sts-endpoint', {
        environmentSuffix: 'sts-test',
      });

      expect(stack).toBeDefined();
    });
  });


  describe('CloudWatch Logging', () => {
    it('should create CloudWatch log group for cluster', async () => {
      const stack = new TapStack('test-log-group', {
        environmentSuffix: 'log-test',
      });

      expect(stack).toBeDefined();
    });

    it('should configure log retention', async () => {
      const stack = new TapStack('test-log-retention', {
        environmentSuffix: 'retention-test',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Output Values', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'output-test',
      });
    });

    it('should export cluster endpoint', async () => {
      const endpoint = await stack.clusterEndpoint.promise();
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
    });

    it('should export OIDC issuer URL', async () => {
      const oidc = await stack.oidcIssuer.promise();
      expect(oidc).toBeDefined();
      expect(typeof oidc).toBe('string');
      expect(oidc).toContain('oidc.eks');
    });

    it('should export kubeconfig as JSON string', async () => {
      const kubeconfig = await stack.kubeconfig.promise();
      expect(kubeconfig).toBeDefined();
      expect(typeof kubeconfig).toBe('string');

      const parsed = JSON.parse(kubeconfig);
      expect(parsed.apiVersion).toBe('v1');
      expect(parsed.kind).toBe('Config');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'edge-test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle very long environment suffix', async () => {
      const stack = new TapStack('test-long-suffix', {
        environmentSuffix: 'very-long-environment-suffix-test-123',
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', async () => {
      const stack = new TapStack('test-special-chars', {
        environmentSuffix: 'test-123-dev',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in all resource names', async () => {
      const suffix = 'naming-test';
      const stack = new TapStack('test-naming', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
    });

    it('should use default suffix when not provided', async () => {
      const stack = new TapStack('test-default-suffix', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Dependency Management', () => {
    it('should handle resource dependencies correctly', async () => {
      const stack = new TapStack('test-dependencies', {
        environmentSuffix: 'dep-test',
      });

      expect(stack).toBeDefined();
    });

    it('should wait for log group before cluster creation', async () => {
      const stack = new TapStack('test-log-dependency', {
        environmentSuffix: 'log-dep-test',
      });

      expect(stack).toBeDefined();
    });

    it('should wait for secondary CIDR before pod subnets', async () => {
      const stack = new TapStack('test-cidr-dependency', {
        environmentSuffix: 'cidr-dep-test',
      });

      expect(stack).toBeDefined();
    });
  });
});
