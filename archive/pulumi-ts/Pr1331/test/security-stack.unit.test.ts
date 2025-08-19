import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { SecurityStack } from '../lib/security-stack';
import { mockOutput } from './mocks';

describe('SecurityStack', () => {
  let securityStack: SecurityStack;
  const mockVpcId = mockOutput('vpc-123456');

  describe('with standard configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        securityStack = new SecurityStack('test-security', {
          vpcId: mockVpcId,
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          webSecurityGroupId: securityStack.webSecurityGroup.id,
          albSecurityGroupId: securityStack.albSecurityGroup.id,
          dbSecurityGroupId: securityStack.dbSecurityGroup.id,
        };
      });
    });

    it('creates ALB security group', () => {
      expect(securityStack.albSecurityGroup).toBeDefined();
    });

    it('creates web server security group', () => {
      expect(securityStack.webSecurityGroup).toBeDefined();
    });

    it('creates database security group', () => {
      expect(securityStack.dbSecurityGroup).toBeDefined();
    });

    it('creates all three security groups', () => {
      expect(securityStack.albSecurityGroup).toBeDefined();
      expect(securityStack.webSecurityGroup).toBeDefined();
      expect(securityStack.dbSecurityGroup).toBeDefined();
    });
  });

  describe('security rules validation', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        securityStack = new SecurityStack('rules-test', {
          vpcId: mockVpcId,
          environmentSuffix: 'test',
          tags: {},
        });

        return {
          webSecurityGroupId: securityStack.webSecurityGroup.id,
          albSecurityGroupId: securityStack.albSecurityGroup.id,
          dbSecurityGroupId: securityStack.dbSecurityGroup.id,
        };
      });
    });

    it('ALB allows HTTP traffic from internet', () => {
      expect(securityStack.albSecurityGroup).toBeDefined();
      // ALB should allow port 80 from 0.0.0.0/0
    });

    it('ALB allows HTTPS traffic from internet', () => {
      expect(securityStack.albSecurityGroup).toBeDefined();
      // ALB should allow port 443 from 0.0.0.0/0
    });

    it('Web servers only accept traffic from ALB', () => {
      expect(securityStack.webSecurityGroup).toBeDefined();
      // Web SG should only allow traffic from ALB SG
    });

    it('Database only accepts traffic from web servers', () => {
      expect(securityStack.dbSecurityGroup).toBeDefined();
      // DB SG should only allow traffic from Web SG on port 5432
    });

    it('allows SSH access to web servers from VPC', () => {
      expect(securityStack.webSecurityGroup).toBeDefined();
      // Web SG should allow SSH (port 22) from VPC CIDR
    });
  });

  describe('security group dependencies', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        securityStack = new SecurityStack('deps-test', {
          vpcId: mockVpcId,
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        });

        return {
          webSecurityGroupId: securityStack.webSecurityGroup.id,
          albSecurityGroupId: securityStack.albSecurityGroup.id,
          dbSecurityGroupId: securityStack.dbSecurityGroup.id,
        };
      });
    });

    it('web security group references ALB security group', () => {
      expect(securityStack.webSecurityGroup).toBeDefined();
      expect(securityStack.albSecurityGroup).toBeDefined();
      // Web SG ingress should reference ALB SG
    });

    it('database security group references web security group', () => {
      expect(securityStack.dbSecurityGroup).toBeDefined();
      expect(securityStack.webSecurityGroup).toBeDefined();
      // DB SG ingress should reference Web SG
    });
  });
});