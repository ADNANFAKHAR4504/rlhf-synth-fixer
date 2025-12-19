import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        id: `${args.name}_id`,
        name: args.name,
        dnsName: `${args.name}.elb.amazonaws.com`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs): { [key: string]: any } => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['eu-south-1a', 'eu-south-1b', 'eu-south-1c'],
      };
    }
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        architecture: 'x86_64',
      };
    }
    return {};
  },
});

describe('TapStack', () => {
  describe('Constructor and Initialization', () => {
    it('should instantiate successfully with default values', () => {
      const stack = new TapStack('test-stack-default', {});
      
      expect(stack).toBeDefined();
      expect(stack.primaryVpcId).toBeDefined();
      expect(stack.standbyVpcId).toBeDefined();
      expect(stack.primaryAlbDns).toBeDefined();
      expect(stack.standbyAlbDns).toBeDefined();
      expect(stack.primaryAsgName).toBeDefined();
      expect(stack.standbyAsgName).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.primarySnsTopicArn).toBeDefined();
      expect(stack.standbySnsTopicArn).toBeDefined();
      expect(stack.primaryHealthCheckId).toBeDefined();
      expect(stack.applicationUrl).toBeDefined();
    });

    it('should instantiate successfully with custom environment suffix', () => {
      const stack = new TapStack('test-stack-prod', {
        environmentSuffix: 'prod',
      });
      
      expect(stack).toBeDefined();
    });

    it('should instantiate successfully with custom tags', () => {
      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'Staging',
          Team: 'Trading',
          CostCenter: 'Engineering',
        },
      });
      
      expect(stack).toBeDefined();
    });

    it('should use "dev" as default environment suffix when not provided', () => {
      const stack = new TapStack('test-default-env', {});
      
      expect(stack.primaryVpcId).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });

    it('should accept empty tags object', () => {
      const stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'test',
        tags: {},
      });
      
      expect(stack).toBeDefined();
    });
  });

  describe('Output Properties', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'test',
      });
    });

    it('should expose primaryVpcId output', (done) => {
      pulumi.output(stack.primaryVpcId).apply(vpcId => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    it('should expose standbyVpcId output', (done) => {
      pulumi.output(stack.standbyVpcId).apply(vpcId => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    it('should expose primaryAlbDns output', (done) => {
      pulumi.output(stack.primaryAlbDns).apply(albDns => {
        expect(albDns).toBeDefined();
        expect(typeof albDns).toBe('string');
        done();
      });
    });

    it('should expose standbyAlbDns output', (done) => {
      pulumi.output(stack.standbyAlbDns).apply(albDns => {
        expect(albDns).toBeDefined();
        expect(typeof albDns).toBe('string');
        done();
      });
    });

    it('should expose primaryAsgName output', (done) => {
      pulumi.output(stack.primaryAsgName).apply(asgName => {
        expect(asgName).toBeDefined();
        expect(typeof asgName).toBe('string');
        done();
      });
    });

    it('should expose standbyAsgName output', (done) => {
      pulumi.output(stack.standbyAsgName).apply(asgName => {
        expect(asgName).toBeDefined();
        expect(typeof asgName).toBe('string');
        done();
      });
    });

    it('should expose dynamoTableName output', (done) => {
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toBeDefined();
        expect(typeof tableName).toBe('string');
        done();
      });
    });

    it('should expose primarySnsTopicArn output', (done) => {
      pulumi.output(stack.primarySnsTopicArn).apply(topicArn => {
        expect(topicArn).toBeDefined();
        expect(typeof topicArn).toBe('string');
        done();
      });
    });

    it('should expose standbySnsTopicArn output', (done) => {
      pulumi.output(stack.standbySnsTopicArn).apply(topicArn => {
        expect(topicArn).toBeDefined();
        expect(typeof topicArn).toBe('string');
        done();
      });
    });

    it('should expose primaryHealthCheckId output', (done) => {
      pulumi.output(stack.primaryHealthCheckId).apply(healthCheckId => {
        expect(healthCheckId).toBeDefined();
        expect(typeof healthCheckId).toBe('string');
        done();
      });
    });

    it('should expose applicationUrl output with http protocol and ALB DNS', (done) => {
      pulumi.output(stack.applicationUrl).apply(appUrl => {
        expect(appUrl).toBeDefined();
        expect(typeof appUrl).toBe('string');
        expect(appUrl).toContain('http://');
        expect(appUrl).toContain('.elb.amazonaws.com');
        done();
      });
    });
  });

  describe('Multi-Region Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-regions', {
        environmentSuffix: 'multiregion',
      });
    });

    it('should create resources in primary region (eu-south-1)', () => {
      expect(stack.primaryVpcId).toBeDefined();
    });

    it('should create resources in standby region (eu-central-1)', () => {
      expect(stack.standbyVpcId).toBeDefined();
    });

    it('should have different VPC IDs for primary and standby', (done) => {
      pulumi.all([stack.primaryVpcId, stack.standbyVpcId]).apply(([primaryVpcId, standbyVpcId]) => {
        expect(primaryVpcId).not.toBe(standbyVpcId);
        done();
      });
    });

    it('should have different ALB DNS names for primary and standby', (done) => {
      pulumi.all([stack.primaryAlbDns, stack.standbyAlbDns]).apply(([primaryAlbDns, standbyAlbDns]) => {
        expect(primaryAlbDns).not.toBe(standbyAlbDns);
        done();
      });
    });
  });

  describe('TapStackArgs Interface', () => {
    it('should accept environmentSuffix as string', () => {
      const args = {
        environmentSuffix: 'production',
      };
      
      const stack = new TapStack('test-env-suffix', args);
      expect(stack).toBeDefined();
    });

    it('should accept tags as object', () => {
      const args = {
        tags: {
          Owner: 'DevOps',
          Project: 'Trading',
        },
      };
      
      const stack = new TapStack('test-tags-type', args);
      expect(stack).toBeDefined();
    });

    it('should accept both environmentSuffix and tags', () => {
      const args = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'Production',
        },
      };
      
      const stack = new TapStack('test-both-args', args);
      expect(stack).toBeDefined();
    });

    it('should handle undefined environmentSuffix', () => {
      const args = {
        tags: { Test: 'Value' },
      };
      
      const stack = new TapStack('test-undefined-env', args);
      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const args = {
        environmentSuffix: 'test',
      };
      
      const stack = new TapStack('test-undefined-tags', args);
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should create resources with environment suffix in prod', (done) => {
      const stack = new TapStack('test-naming-prod', {
        environmentSuffix: 'prod',
      });
      
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toContain('prod');
        done();
      });
    });

    it('should create resources with environment suffix in dev', (done) => {
      const stack = new TapStack('test-naming-dev', {
        environmentSuffix: 'dev',
      });
      
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toContain('dev');
        done();
      });
    });

    it('should create resources with environment suffix in staging', (done) => {
      const stack = new TapStack('test-naming-staging', {
        environmentSuffix: 'staging',
      });
      
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toContain('staging');
        done();
      });
    });
  });

  describe('Infrastructure Components', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-infrastructure', {
        environmentSuffix: 'infra',
        tags: {
          Component: 'InfraTest',
        },
      });
    });

    it('should create primary VPC with valid configuration', (done) => {
      pulumi.output(stack.primaryVpcId).apply(vpcId => {
        expect(vpcId).toBeDefined();
        expect(vpcId).toBeTruthy();
        done();
      });
    });

    it('should create standby VPC with valid configuration', (done) => {
      pulumi.output(stack.standbyVpcId).apply(vpcId => {
        expect(vpcId).toBeDefined();
        expect(vpcId).toBeTruthy();
        done();
      });
    });

    it('should create primary ALB with DNS name', (done) => {
      pulumi.output(stack.primaryAlbDns).apply(albDns => {
        expect(albDns).toBeDefined();
        expect(albDns.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should create standby ALB with DNS name', (done) => {
      pulumi.output(stack.standbyAlbDns).apply(albDns => {
        expect(albDns).toBeDefined();
        expect(albDns.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should create DynamoDB table', (done) => {
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toBeDefined();
        expect(tableName).toContain('trading-sessions');
        done();
      });
    });

    it('should create primary SNS topic', (done) => {
      pulumi.output(stack.primarySnsTopicArn).apply(topicArn => {
        expect(topicArn).toBeDefined();
        expect(topicArn).toBeTruthy();
        done();
      });
    });

    it('should create standby SNS topic', (done) => {
      pulumi.output(stack.standbySnsTopicArn).apply(topicArn => {
        expect(topicArn).toBeDefined();
        expect(topicArn).toBeTruthy();
        done();
      });
    });

    it('should create health check for primary region', (done) => {
      pulumi.output(stack.primaryHealthCheckId).apply(healthCheckId => {
        expect(healthCheckId).toBeDefined();
        expect(healthCheckId).toBeTruthy();
        done();
      });
    });

    it('should create application URL based on ALB DNS', (done) => {
      pulumi.output(stack.applicationUrl).apply((appUrl) => {
        expect(appUrl).toContain('.elb.amazonaws.com');
        expect(appUrl).toMatch(/^http:\/\//);
        done();
      });
    });
  });

  describe('Auto Scaling Groups', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-asg', {
        environmentSuffix: 'asg-test',
      });
    });

    it('should create primary ASG with valid name', (done) => {
      pulumi.output(stack.primaryAsgName).apply(asgName => {
        expect(asgName).toBeDefined();
        expect(asgName).toContain('primary-asg');
        done();
      });
    });

    it('should create standby ASG with valid name', (done) => {
      pulumi.output(stack.standbyAsgName).apply(asgName => {
        expect(asgName).toBeDefined();
        expect(asgName).toContain('standby-asg');
        done();
      });
    });

    it('should have different ASG names for primary and standby', (done) => {
      pulumi.all([stack.primaryAsgName, stack.standbyAsgName]).apply(([primaryAsg, standbyAsg]) => {
        expect(primaryAsg).not.toBe(standbyAsg);
        done();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty string environment suffix', () => {
      const stack = new TapStack('test-empty-env', {
        environmentSuffix: '',
      });
      
      expect(stack).toBeDefined();
    });

    it('should handle very long environment suffix', () => {
      const longSuffix = 'very-long-environment-suffix-name-that-exceeds-normal-length';
      const stack = new TapStack('test-long-env', {
        environmentSuffix: longSuffix,
      });
      
      expect(stack).toBeDefined();
    });

    it('should handle special characters in tags', () => {
      const stack = new TapStack('test-special-chars', {
        environmentSuffix: 'test',
        tags: {
          'Special:Tag': 'Value/With:Special@Chars',
        },
      });
      
      expect(stack).toBeDefined();
    });

    it('should handle multiple tag entries', () => {
      const stack = new TapStack('test-many-tags', {
        environmentSuffix: 'test',
        tags: {
          Tag1: 'Value1',
          Tag2: 'Value2',
          Tag3: 'Value3',
          Tag4: 'Value4',
          Tag5: 'Value5',
        },
      });
      
      expect(stack).toBeDefined();
    });

    it('should handle numeric values in environment suffix', () => {
      const stack = new TapStack('test-numeric-env', {
        environmentSuffix: 'env123',
      });
      
      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Behavior', () => {
    it('should extend pulumi.ComponentResource', () => {
      const stack = new TapStack('test-component', {
        environmentSuffix: 'component',
      });
      
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct URN type', (done) => {
      const stack = new TapStack('test-urn', {
        environmentSuffix: 'urn-test',
      });
      
      pulumi.output(stack.urn).apply(urn => {
        expect(urn).toContain('tap:stack:TapStack');
        done();
      });
    });

    it('should support parent option', () => {
      const parent = new pulumi.ComponentResource('custom:parent:Parent', 'parent-resource', {});
      const stack = new TapStack('test-with-parent', {
        environmentSuffix: 'child',
      }, { parent });
      
      expect(stack).toBeDefined();
    });

    it('should register all outputs', (done) => {
      const stack = new TapStack('test-outputs-registered', {
        environmentSuffix: 'output-test',
      });

      pulumi.all([
        stack.primaryVpcId,
        stack.standbyVpcId,
        stack.primaryAlbDns,
        stack.standbyAlbDns,
        stack.primaryAsgName,
        stack.standbyAsgName,
        stack.dynamoTableName,
        stack.primarySnsTopicArn,
        stack.standbySnsTopicArn,
        stack.primaryHealthCheckId,
        stack.applicationUrl,
      ]).apply(() => {
        done();
      });
    });
  });

  describe('DynamoDB Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-dynamo', {
        environmentSuffix: 'dynamo-test',
      });
    });

    it('should create DynamoDB table with correct naming pattern', (done) => {
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toMatch(/^trading-sessions-/);
        done();
      });
    });

    it('should include environment suffix in table name', (done) => {
      pulumi.output(stack.dynamoTableName).apply(tableName => {
        expect(tableName).toContain('dynamo-test');
        done();
      });
    });
  });

  describe('SNS Topics Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-sns', {
        environmentSuffix: 'sns-test',
      });
    });

    it('should create primary SNS topic ARN', (done) => {
      pulumi.output(stack.primarySnsTopicArn).apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should create standby SNS topic ARN', (done) => {
      pulumi.output(stack.standbySnsTopicArn).apply(arn => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should have different ARNs for primary and standby topics', (done) => {
      pulumi.all([stack.primarySnsTopicArn, stack.standbySnsTopicArn]).apply(([primaryArn, standbyArn]) => {
        expect(primaryArn).not.toBe(standbyArn);
        done();
      });
    });
  });

  describe('Health Check Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-health', {
        environmentSuffix: 'health-test',
      });
    });

    it('should create Route53 health check', (done) => {
      pulumi.output(stack.primaryHealthCheckId).apply(healthCheckId => {
        expect(healthCheckId).toBeDefined();
        expect(healthCheckId.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Application URL Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-url', {
        environmentSuffix: 'url-test',
      });
    });

    it('should create application URL with HTTP protocol', (done) => {
      pulumi.output(stack.applicationUrl).apply(url => {
        expect(url).toMatch(/^http:\/\/.+/);
        done();
      });
    });

    it('should not use HTTPS protocol', (done) => {
      pulumi.output(stack.applicationUrl).apply(url => {
        expect(url).not.toMatch(/^https:\/\//);
        done();
      });
    });

    it('should use ALB DNS name in application URL', (done) => {
      pulumi.output(stack.applicationUrl).apply((url) => {
        expect(url).toContain('.elb.amazonaws.com');
        done();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should create complete infrastructure with all components', (done) => {
      const stack = new TapStack('test-integration', {
        environmentSuffix: 'integration',
        tags: {
          TestType: 'Integration',
          Environment: 'Test',
        },
      });

      pulumi.all([
        stack.primaryVpcId,
        stack.standbyVpcId,
        stack.primaryAlbDns,
        stack.standbyAlbDns,
        stack.primaryAsgName,
        stack.standbyAsgName,
        stack.dynamoTableName,
        stack.primarySnsTopicArn,
        stack.standbySnsTopicArn,
        stack.primaryHealthCheckId,
        stack.applicationUrl,
      ]).apply(([
        primaryVpcId,
        standbyVpcId,
        primaryAlbDns,
        standbyAlbDns,
        primaryAsgName,
        standbyAsgName,
        dynamoTableName,
        primarySnsTopicArn,
        standbySnsTopicArn,
        primaryHealthCheckId,
        applicationUrl,
      ]) => {
        expect(primaryVpcId).toBeDefined();
        expect(standbyVpcId).toBeDefined();
        expect(primaryAlbDns).toBeDefined();
        expect(standbyAlbDns).toBeDefined();
        expect(primaryAsgName).toBeDefined();
        expect(standbyAsgName).toBeDefined();
        expect(dynamoTableName).toBeDefined();
        expect(primarySnsTopicArn).toBeDefined();
        expect(standbySnsTopicArn).toBeDefined();
        expect(primaryHealthCheckId).toBeDefined();
        expect(applicationUrl).toBeDefined();
        done();
      });
    });

    it('should maintain consistency across multiple instantiations', (done) => {
      const stack1 = new TapStack('test-consistency-1', {
        environmentSuffix: 'test1',
      });
      const stack2 = new TapStack('test-consistency-2', {
        environmentSuffix: 'test2',
      });

      expect(stack1.primaryVpcId).toBeDefined();
      expect(stack2.primaryVpcId).toBeDefined();
      
      pulumi.all([stack1.primaryVpcId, stack2.primaryVpcId]).apply(([vpc1, vpc2]) => {
        expect(vpc1).not.toBe(vpc2);
        done();
      });
    });
  });
});
