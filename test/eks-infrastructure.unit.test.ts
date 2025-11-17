import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before any imports
class MockResourceMonitor {
  public resources: any[] = [];
  public outputs: Map<string, any> = new Map();

  supportsFeature(_: any): boolean {
    return true;
  }

  registerResource(type: string, name: string, _custom: boolean, _remote: boolean, props: any): { urn: string; id: string; object: any } {
    const urn = `urn:pulumi:test::test::${type}::${name}`;
    const id = `${name}-id`;

    // Create mock outputs based on resource type
    const outputs: Record<string, any> = {
      ...props,
      id,
      urn,
      name,
    };

    // Special handling for specific resource types
    if (type.includes('Vpc')) {
      outputs.cidrBlock = props.cidrBlock || '10.0.0.0/16';
    } else if (type.includes('Subnet')) {
      outputs.availabilityZone = 'us-east-1a';
    } else if (type.includes('Cluster')) {
      outputs.name = `${name}`;
      outputs.endpoint = 'https://test.eks.amazonaws.com';
      outputs.version = '1.28';
      outputs.eksCluster = {
        name: `${name}-eksCluster`,
        endpoint: 'https://test.eks.amazonaws.com',
        version: '1.28',
      };
      outputs.core = {
        oidcProvider: pulumi.output({
          url: 'https://oidc.eks.us-east-1.amazonaws.com/id/TEST',
          arn: 'arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/TEST',
        }),
      };
      outputs.kubeconfig = pulumi.output(JSON.stringify({ apiVersion: 'v1', kind: 'Config' }));
    }

    this.resources.push({ type, name, props, outputs });
    this.outputs.set(name, outputs);

    return { urn, id, object: outputs };
  }

  invoke(_token: string, _args: any, _provider?: string): { failures?: any; return: any } {
    if (_token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        return: pulumi.output({
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
        }),
      };
    } else if (_token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        return: pulumi.output({
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        }),
      };
    }
    return { return: _args };
  }

  call(_token: string, _args: any, _provider?: string): { failures?: any; return: any } {
    return this.invoke(_token, _args, _provider);
  }

  readResource(_type: string, name: string, _id: string, _parent: any, _props: any, _options: any): { urn: string; id: string; object: any } {
    return {
      urn: `urn:pulumi:test::test::${_type}::${name}`,
      id: `${name}-id`,
      object: _props,
    };
  }

  registerResourceOutputs(_urn: string, _outputs: any): void {
    // no-op
  }
}

// Set up mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.name,
    };

    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
    } else if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.availabilityZone = 'us-east-1a';
    } else if (args.type === 'eks:index:Cluster') {
      outputs.eksCluster = {
        name: `${args.name}-eksCluster`,
        endpoint: 'https://test.eks.amazonaws.com',
        version: '1.28',
      };
      outputs.core = {
        oidcProvider: pulumi.output({
          url: 'https://oidc.eks.us-east-1.amazonaws.com/id/TEST',
          arn: 'arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/TEST',
        }),
      };
      outputs.kubeconfig = pulumi.output(JSON.stringify({ apiVersion: 'v1', kind: 'Config' }));
    } else if (args.type === 'aws:eks/nodeGroup:NodeGroup') {
      outputs.nodeGroupName = args.inputs.nodeGroupName || `${args.name}-ng`;
    } else if (args.type === 'aws:eks/fargateProfile:FargateProfile') {
      outputs.fargateProfileName = args.inputs.fargateProfileName || `${args.name}-profile`;
    }

    return { id: outputs.id, state: outputs };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    } else if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return args.inputs;
  },
});

// Set required config BEFORE importing
pulumi.runtime.setConfig('environmentSuffix', 'test');
pulumi.runtime.setConfig('aws:region', 'us-east-1');

// Now import the infrastructure
import * as infra from '../lib/index';

describe('EKS Infrastructure Unit Tests', () => {
  describe('VPC Configuration', () => {
    it('should export vpcId', (done) => {
      infra.vpcId.apply((id) => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export public subnet IDs as array', (done) => {
      infra.publicSubnetIds.apply((ids) => {
        expect(ids).toBeDefined();
        expect(Array.isArray(ids)).toBe(true);
        expect(ids.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should export private subnet IDs as array', (done) => {
      infra.privateSubnetIds.apply((ids) => {
        expect(ids).toBeDefined();
        expect(Array.isArray(ids)).toBe(true);
        expect(ids.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('EKS Cluster Configuration', () => {
    it('should export cluster name', (done) => {
      infra.clusterName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export cluster endpoint', (done) => {
      infra.clusterEndpoint.apply((endpoint) => {
        expect(endpoint).toBeDefined();
        done();
      });
    });

    it('should export cluster version', (done) => {
      infra.clusterVersion.apply((version) => {
        expect(version).toBeDefined();
        done();
      });
    });

    it('should export kubeconfig', (done) => {
      infra.kubeconfig.apply((config) => {
        expect(config).toBeDefined();
        done();
      });
    });
  });

  describe('OIDC Provider Configuration', () => {
    it('should export OIDC provider URL', (done) => {
      infra.oidcProviderUrl.apply((url) => {
        expect(url).toBeDefined();
        done();
      });
    });

    it('should export OIDC provider ARN', (done) => {
      infra.oidcProviderArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Node Group Configuration', () => {
    it('should export on-demand node group name', (done) => {
      infra.onDemandNodeGroupName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export spot node group name', (done) => {
      infra.spotNodeGroupName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export node group role ARN', (done) => {
      infra.nodeGroupRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Fargate Profile Configuration', () => {
    it('should export Fargate profile name', (done) => {
      infra.fargateProfileName.apply((name) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export Fargate role ARN', (done) => {
      infra.fargateRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Environment IAM Roles', () => {
    it('should export dev role ARN', (done) => {
      infra.devRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should export staging role ARN', (done) => {
      infra.stagingRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });

    it('should export prod role ARN', (done) => {
      infra.prodRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Cluster Autoscaler Configuration', () => {
    it('should export cluster autoscaler role ARN', (done) => {
      infra.clusterAutoscalerRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('ALB Controller Configuration', () => {
    it('should export ALB controller role ARN', (done) => {
      infra.albControllerRoleArn.apply((arn) => {
        expect(arn).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use environment suffix in cluster name', (done) => {
      infra.clusterName.apply((name) => {
        expect(name).toContain('test');
        done();
      });
    });

    it('should use environment suffix in node group names', (done) => {
      pulumi.all([infra.onDemandNodeGroupName, infra.spotNodeGroupName]).apply(([onDemand, spot]) => {
        expect(onDemand).toContain('test');
        expect(spot).toContain('test');
        done();
      });
    });
  });

  describe('Output Validation', () => {
    it('should have all required outputs defined', () => {
      const requiredOutputs = [
        'vpcId',
        'publicSubnetIds',
        'privateSubnetIds',
        'clusterName',
        'clusterEndpoint',
        'clusterVersion',
        'oidcProviderUrl',
        'oidcProviderArn',
        'kubeconfig',
        'onDemandNodeGroupName',
        'spotNodeGroupName',
        'nodeGroupRoleArn',
        'fargateProfileName',
        'fargateRoleArn',
        'devRoleArn',
        'stagingRoleArn',
        'prodRoleArn',
        'clusterAutoscalerRoleArn',
        'albControllerRoleArn',
      ];

      requiredOutputs.forEach((output) => {
        expect((infra as any)[output]).toBeDefined();
        expect(pulumi.Output.isInstance((infra as any)[output])).toBe(true);
      });
    });

    it('should export proper Pulumi Output types', () => {
      expect(pulumi.Output.isInstance(infra.vpcId)).toBe(true);
      expect(pulumi.Output.isInstance(infra.clusterName)).toBe(true);
      expect(pulumi.Output.isInstance(infra.clusterEndpoint)).toBe(true);
    });
  });
});
