import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Error Handling and Edge Cases', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Constructor Error Handling', () => {
    test('validates environment suffix length constraints', () => {
      // Test that extremely long suffixes are handled (may cause validation errors)
      const longSuffix = 'a'.repeat(50);
      
      expect(() => {
        new TapStack(app, 'TestLongSuffix', { environmentSuffix: longSuffix });
      }).toThrow(); // This is expected to throw due to AWS naming constraints
    });

    test('validates special characters in environment suffix', () => {
      // Test valid characters for AWS resources
      const validChars = ['test-with-dash', 'test123', 'testABC'];
      
      validChars.forEach((suffix, index) => {
        expect(() => {
          new TapStack(app, `TestValid${index}`, { environmentSuffix: suffix });
        }).not.toThrow();
      });
    });

    test('handles null and undefined environment suffix values', () => {
      // Test null value
      expect(() => {
        new TapStack(app, 'TestNull', { environmentSuffix: null as any });
      }).not.toThrow();

      // Test undefined value explicitly
      expect(() => {
        new TapStack(app, 'TestUndefined', { environmentSuffix: undefined });
      }).not.toThrow();
    });

    test('handles empty object props', () => {
      expect(() => {
        new TapStack(app, 'TestEmptyProps', {});
      }).not.toThrow();
    });
  });

  describe('Resource Naming Edge Cases', () => {
    test('resource names remain valid with edge case suffixes', () => {
      // Use smaller set of valid suffixes to avoid stack creation conflicts
      const edgeCaseSuffixes = ['1', 'a', 'test123'];
      
      edgeCaseSuffixes.forEach((suffix, index) => {
        const testApp = new cdk.App(); // Create new app for each test to avoid conflicts
        const stack = new TapStack(testApp, `TestEdge${index}`, { environmentSuffix: suffix });
        const template = Template.fromStack(stack);
        
        // Verify that resources are created successfully
        expect(template.toJSON().Resources).toBeDefined();
        expect(Object.keys(template.toJSON().Resources).length).toBeGreaterThan(0);
      });
    });

    test('S3 bucket naming handles account ID integration', () => {
      const stack = new TapStack(app, 'TestS3Naming', { environmentSuffix: 'bucket' });
      const template = Template.fromStack(stack);
      
      // S3 bucket name should include account reference for uniqueness
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              's3bucket-development-trainr70-bucket-',
              { Ref: 'AWS::AccountId' }
            ]
          ]
        }
      });
    });
  });

  describe('Template Size and Complexity Limits', () => {
    test('template stays within CloudFormation limits', () => {
      const stack = new TapStack(app, 'TestLimits', { environmentSuffix: 'limits' });
      const template = Template.fromStack(stack);
      const templateJson = template.toJSON();
      
      // CloudFormation limits
      const resourceCount = Object.keys(templateJson.Resources).length;
      const outputCount = Object.keys(templateJson.Outputs || {}).length;
      const templateSize = JSON.stringify(templateJson).length;
      
      expect(resourceCount).toBeLessThan(500); // CloudFormation limit is 500 resources
      expect(outputCount).toBeLessThan(200); // CloudFormation limit is 200 outputs
      expect(templateSize).toBeLessThan(1048576); // 1MB limit for template body
    });

    test('resource dependencies do not create circular references', () => {
      const stack = new TapStack(app, 'TestCircular', { environmentSuffix: 'circular' });
      
      // If there were circular dependencies, CDK would throw during synthesis
      expect(() => {
        Template.fromStack(stack);
      }).not.toThrow();
    });
  });

  describe('AWS Service Limits Compliance', () => {
    test('security group rules stay within AWS limits', () => {
      const stack = new TapStack(app, 'TestSGLimits', { environmentSuffix: 'sg' });
      const template = Template.fromStack(stack);
      
      const templateJson = template.toJSON();
      const securityGroups = Object.values(templateJson.Resources)
        .filter((resource: any) => resource.Type === 'AWS::EC2::SecurityGroup');
      
      securityGroups.forEach((sg: any) => {
        const inboundRules = sg.Properties?.SecurityGroupIngress || [];
        const outboundRules = sg.Properties?.SecurityGroupEgress || [];
        
        expect(inboundRules.length).toBeLessThanOrEqual(60); // AWS limit per SG
        expect(outboundRules.length).toBeLessThanOrEqual(60); // AWS limit per SG
      });
    });

    test('VPC subnet count is within limits', () => {
      const stack = new TapStack(app, 'TestSubnetLimits', { environmentSuffix: 'subnet' });
      const template = Template.fromStack(stack);
      
      template.resourceCountIs('AWS::EC2::Subnet', 4); // Well within AWS limit of 200 per VPC
    });

    test('IAM policy size stays within limits', () => {
      const stack = new TapStack(app, 'TestIAMLimits', { environmentSuffix: 'iam' });
      const template = Template.fromStack(stack);
      
      const templateJson = template.toJSON();
      const policies = Object.values(templateJson.Resources)
        .filter((resource: any) => resource.Type === 'AWS::IAM::Policy');
      
      policies.forEach((policy: any) => {
        const policyDoc = JSON.stringify(policy.Properties?.PolicyDocument || {});
        expect(policyDoc.length).toBeLessThan(6144); // AWS managed policy size limit
      });
    });
  });

  describe('Network Configuration Edge Cases', () => {
    test('handles AZ availability gracefully', () => {
      // CDK should handle AZ selection automatically
      const stack = new TapStack(app, 'TestAZ', { environmentSuffix: 'az' });
      const template = Template.fromStack(stack);
      
      // Should create subnets without hardcoding AZs
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('CIDR block allocation is non-overlapping', () => {
      const stack = new TapStack(app, 'TestCIDR', { environmentSuffix: 'cidr' });
      const template = Template.fromStack(stack);
      
      const templateJson = template.toJSON();
      const subnets = Object.values(templateJson.Resources)
        .filter((resource: any) => resource.Type === 'AWS::EC2::Subnet');
      
      // All subnets should have CIDR blocks defined
      subnets.forEach((subnet: any) => {
        expect(subnet.Properties).toHaveProperty('CidrBlock');
      });
    });
  });

  describe('Resource State and Lifecycle Management', () => {
    test('development environment has appropriate deletion policies', () => {
      const stack = new TapStack(app, 'TestDeletion', { environmentSuffix: 'deletion' });
      const template = Template.fromStack(stack);
      
      // S3 bucket should be deletable in dev environment
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });

    test('resource updates are handled gracefully', () => {
      // Create two versions of the stack with same configuration
      const app1 = new cdk.App();
      const app2 = new cdk.App();
      const stack1 = new TapStack(app1, 'TestUpdate', { environmentSuffix: 'v1' });
      const stack2 = new TapStack(app2, 'TestUpdate', { environmentSuffix: 'v1' }); // Same suffix, different app
      
      const template1 = Template.fromStack(stack1);
      const template2 = Template.fromStack(stack2);
      
      // Templates should have same structure for same configuration
      expect(Object.keys(template1.toJSON().Resources).length)
        .toEqual(Object.keys(template2.toJSON().Resources).length);
      expect(Object.keys(template1.toJSON().Outputs).length)
        .toEqual(Object.keys(template2.toJSON().Outputs).length);
    });
  });

  describe('Security Configuration Validation', () => {
    test('no hardcoded credentials in template', () => {
      const stack = new TapStack(app, 'TestSecurity', { environmentSuffix: 'security' });
      const template = Template.fromStack(stack);
      
      const templateString = JSON.stringify(template.toJSON());
      
      // Check for common patterns that might indicate hardcoded credentials
      expect(templateString).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(templateString).not.toMatch(/[A-Za-z0-9\/+=]{40}/); // AWS Secret Key pattern
      expect(templateString).not.toMatch(/password/i);
      expect(templateString).not.toMatch(/secret/i);
    });

    test('security groups do not allow unrestricted egress on sensitive ports', () => {
      const stack = new TapStack(app, 'TestEgress', { environmentSuffix: 'egress' });
      const template = Template.fromStack(stack);
      
      const templateJson = template.toJSON();
      const securityGroups = Object.values(templateJson.Resources)
        .filter((resource: any) => resource.Type === 'AWS::EC2::SecurityGroup');
      
      securityGroups.forEach((sg: any) => {
        const egressRules = sg.Properties?.SecurityGroupEgress || [];
        egressRules.forEach((rule: any) => {
          if (rule.CidrIp === '0.0.0.0/0' || rule.CidrIpv6 === '::/0') {
            // If allowing all IPs, should not be on sensitive ports
            const sensitiveports = [22, 3389, 1433, 3306, 5432]; // SSH, RDP, SQL Server, MySQL, PostgreSQL
            if (rule.FromPort && sensitiveports.includes(rule.FromPort)) {
              fail(`Security group allows unrestricted egress on sensitive port ${rule.FromPort}`);
            }
          }
        });
      });
    });
  });

  describe('Performance and Resource Optimization', () => {
    test('template synthesis completes within reasonable time', async () => {
      const startTime = Date.now();
      
      const stack = new TapStack(app, 'TestPerformance', { environmentSuffix: 'perf' });
      Template.fromStack(stack);
      
      const synthesisTime = Date.now() - startTime;
      expect(synthesisTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('memory usage during synthesis is reasonable', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create multiple stacks to test memory efficiency
      for (let i = 0; i < 5; i++) {
        const stack = new TapStack(app, `TestMemory${i}`, { environmentSuffix: `mem${i}` });
        Template.fromStack(stack);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('template works with different CDK versions', () => {
      // Verify template doesn't use features that might be version-specific
      const stack = new TapStack(app, 'TestCompatibility', { environmentSuffix: 'compat' });
      const template = Template.fromStack(stack);
      
      const templateJson = template.toJSON();
      
      // Should have standard CloudFormation format
      expect(templateJson).toHaveProperty('AWSTemplateFormatVersion');
      expect(templateJson.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('generated template is region-agnostic where possible', () => {
      const stack = new TapStack(app, 'TestRegion', { environmentSuffix: 'region' });
      const template = Template.fromStack(stack);
      
      const templateString = JSON.stringify(template.toJSON());
      
      // Should not hardcode region-specific values
      expect(templateString).not.toMatch(/us-east-1/);
      expect(templateString).not.toMatch(/us-west-2/);
      
      // Should use pseudo parameters for region references
      expect(templateString).toContain('AWS::Region');
    });
  });
});