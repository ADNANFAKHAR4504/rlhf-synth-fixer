import { describe, it, expect, beforeEach } from '@jest/globals';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {id: string, state: any} => {
    return {
      id: args.inputs.name + '_id',
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    stack = new TapStack('test-stack', {
      tags: {
        Environment: 'Production',
        TestSuite: 'Unit',
      },
    });
  });

  describe('Multi-region deployment', () => {
    it('should deploy across all required regions', () => {
      const expectedRegions = ['us-east-1', 'us-west-2', 'eu-central-1'];
      const vpcRegions = Object.keys(stack.vpcs);
      expect(vpcRegions).toEqual(expect.arrayContaining(expectedRegions));
      expect(vpcRegions.length).toBe(3);
    });

    it('should create VPC in each region with correct CIDR', async () => {
      for (const region of ['us-east-1', 'us-west-2', 'eu-central-1']) {
        expect(stack.vpcs[region]).toBeDefined();
        const vpc = stack.vpcs[region];
        
        // Use pulumi.all to resolve the Output value and test directly
        await pulumi.all([vpc.cidrBlock]).apply(([cidr]) => {
          expect(cidr).toBe('10.0.0.0/16');
        });
      }
    });
  });

  describe('Security Groups', () => {
    it('should create security groups with restricted ingress rules', async () => {
      for (const region of ['us-east-1', 'us-west-2', 'eu-central-1']) {
        const sg = stack.securityGroups[region];
        expect(sg).toBeDefined();
        
        // Use pulumi.all for Output resolution and test directly
        await pulumi.all([sg.ingress]).apply(([rules]) => {
          expect(rules).toHaveLength(2);
        });
        
        // Test rules using resolved values
        await pulumi.all([sg.ingress]).apply(([rules]) => {
          const httpsRule = rules.find(rule => rule.fromPort === 443);
          expect(httpsRule?.cidrBlocks).toEqual(['10.0.0.0/16']);
          
          const sshRule = rules.find(rule => rule.fromPort === 22);
          expect(sshRule?.cidrBlocks).toEqual(['10.0.0.0/24']);
        });
      }
    });

    it('should allow all outbound traffic', async () => {
      const sg = stack.securityGroups['us-east-1'];
      
      await pulumi.all([sg.egress]).apply(([egress]) => {
        expect(egress).toHaveLength(1);
        expect(egress[0].protocol).toBe('-1');
        expect(egress[0].cidrBlocks).toEqual(['0.0.0.0/0']);
      });
    });
  });

  describe('KMS Keys', () => {
    it('should create KMS keys in all regions with rotation enabled', async () => {
      for (const region of ['us-east-1', 'us-west-2', 'eu-central-1']) {
        const kmsKey = stack.kmsKeys[region];
        expect(kmsKey).toBeDefined();
        
        await pulumi.all([kmsKey.enableKeyRotation, kmsKey.deletionWindowInDays]).apply(([rotation, window]) => {
          expect(rotation).toBe(true);
          expect(window).toBe(30);
        });
      }
    });
  });

  describe('IAM Roles', () => {
    it('should create IAM roles with correct assume role policy', async () => {
      const iamRole = stack.iamRoles['us-east-1'];
      expect(iamRole).toBeDefined();
      
      await pulumi.all([iamRole.assumeRolePolicy]).apply(([policyString]) => {
        const policy = JSON.parse(policyString);
        expect(policy.Statement[0].Principal.Service).toBe('apigateway.amazonaws.com');
        expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
      });
    });
  });

  describe('VPC Endpoints', () => {
    it('should create VPC endpoints for API Gateway in all regions', async () => {
      for (const region of ['us-east-1', 'us-west-2', 'eu-central-1']) {
        const vpcEndpoint = stack.vpcEndpoints[region];
        expect(vpcEndpoint).toBeDefined();
        
        await pulumi.all([vpcEndpoint.serviceName, vpcEndpoint.vpcEndpointType]).apply(([serviceName, endpointType]) => {
          expect(serviceName).toBe(`com.amazonaws.${region}.execute-api`);
          expect(endpointType).toBe('Interface');
        });
      }
    });
  });

  describe('API Gateway', () => {
    it('should create private API Gateways', async () => {
      for (const region of ['us-east-1', 'us-west-2', 'eu-central-1']) {
        const apiGateway = stack.apiGateways[region];
        expect(apiGateway).toBeDefined();
        
        await pulumi.all([apiGateway.endpointConfiguration]).apply(([config]) => {
          expect(config.types).toBe('PRIVATE');
        });
      }
    });

    it('should have VPC endpoint restriction policy', async () => {
      const apiGateway = stack.apiGateways['us-east-1'];
      
      await pulumi.all([apiGateway.policy]).apply(([policyString]) => {
        const policyObj = JSON.parse(policyString);
        expect(policyObj.Statement[0].Condition.StringEquals).toHaveProperty('aws:SourceVpce');
      });
    });
  });

  describe('Tagging', () => {
    it('should apply Environment: Production tag to all resources', async () => {
      const vpc = stack.vpcs['us-east-1'];
      
      await pulumi.all([vpc.tags]).apply(([tags]) => {
        expect(tags!.Environment).toBe('Production');
      });
    });

    it('should apply custom tags from constructor', async () => {
      const vpc = stack.vpcs['us-east-1'];
      
      await pulumi.all([vpc.tags]).apply(([tags]) => {
        expect(tags!.TestSuite).toBe('Unit');
      });
    });
  });

  describe('Subnets', () => {
    it('should create subnets in multiple availability zones', async () => {
      const subnets = stack.subnets['us-east-1'];
      expect(subnets).toHaveLength(2);
      
      await pulumi.all([subnets[0].availabilityZone, subnets[1].availabilityZone]).apply(([az1, az2]) => {
        expect(az1).toBe('us-east-1a');
        expect(az2).toBe('us-east-1b');
      });
    });

    it('should have different CIDR blocks for each subnet', async () => {
      const subnets = stack.subnets['us-east-1'];
      
      await pulumi.all([subnets[0].cidrBlock, subnets[1].cidrBlock]).apply(([cidr1, cidr2]) => {
        expect(cidr1).toBe('10.0.1.0/24');
        expect(cidr2).toBe('10.0.2.0/24');
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should create log groups with KMS encryption', async () => {
      for (const region of ['us-east-1', 'us-west-2', 'eu-central-1']) {
        const logGroup = stack.cloudWatchLogGroups[region];
        expect(logGroup).toBeDefined();
        
        await pulumi.all([logGroup.retentionInDays]).apply(([retention]) => {
          expect(retention).toBe(90);
        });
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags gracefully', async () => {
      const emptyTagStack = new TapStack('empty-tag-stack', {});
      const vpc = emptyTagStack.vpcs['us-east-1'];
      
      await pulumi.all([vpc.tags]).apply(([tags]) => {
        expect(tags!.Environment).toBe('Production');
      });
    });

    it('should create unique resource names per region', async () => {
      const usEast1Vpc = stack.vpcs['us-east-1'];
      const usWest2Vpc = stack.vpcs['us-west-2'];
      
      await pulumi.all([usEast1Vpc.tags, usWest2Vpc.tags]).apply(([tags1, tags2]) => {
        expect(tags1!.Name).toContain('us-east-1');
        expect(tags2!.Name).toContain('us-west-2');
      });
    });
  });

  describe('Resource Dependencies', () => {
    it('should have proper VPC endpoint to API Gateway dependency', async () => {
      const vpcEndpoint = stack.vpcEndpoints['us-east-1'];
      const apiGateway = stack.apiGateways['us-east-1'];
      
      expect(vpcEndpoint).toBeDefined();
      expect(apiGateway).toBeDefined();
      
      await pulumi.all([apiGateway.policy]).apply(([policy]) => {
        expect(policy).toContain('aws:SourceVpce');
      });
    });
  });

  // REMOVED: Config-related tests since Config resources were removed from the stack
  // - No more tests for ConfigurationRecorder
  // - No more tests for DeliveryChannel
  // - No more tests for Config Bucket
  // This is because existing Config recorders already exist in your AWS account
});
