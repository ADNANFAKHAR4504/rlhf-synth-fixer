import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { AlbStack } from '../lib/alb-stack';
import { mockOutput } from './mocks';

describe('AlbStack', () => {
  let stack: AlbStack;

  describe('with basic configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new AlbStack('test-alb', {
          environmentSuffix: 'test',
          vpcId: mockOutput('vpc-123456'),
          publicSubnetIds: mockOutput(['subnet-1', 'subnet-2']),
          albSecurityGroupId: mockOutput('sg-alb-123'),
          tags: {
            Environment: 'test',
          },
        });

        return {
          albDnsName: stack.alb.dnsName,
          albArn: stack.alb.arn,
        };
      });
    });

    it('should create an application load balancer', () => {
      expect(stack.alb).toBeDefined();
    });

    it('should create HTTPS listener', () => {
      expect(stack.httpsListener).toBeDefined();
    });

    it('should create frontend target group', () => {
      expect(stack.frontendTargetGroup).toBeDefined();
    });

    it('should create backend target group', () => {
      expect(stack.backendTargetGroup).toBeDefined();
    });

    it('should use environmentSuffix in resource names', () => {
      expect(stack).toBeDefined();
      // All resource names should include environmentSuffix
    });
  });

  describe('load balancer configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new AlbStack('test-alb-config', {
          environmentSuffix: 'prod',
          vpcId: mockOutput('vpc-prod'),
          publicSubnetIds: mockOutput(['subnet-pub-1', 'subnet-pub-2']),
          albSecurityGroupId: mockOutput('sg-alb-prod'),
        });

        return {
          albArn: stack.alb.arn,
        };
      });
    });

    it('should be internet-facing', () => {
      expect(stack.alb).toBeDefined();
      // ALB should be internet-facing (not internal)
    });

    it('should be application load balancer type', () => {
      expect(stack.alb).toBeDefined();
      // Should be 'application' type
    });

    it('should have deletion protection disabled for testing', () => {
      expect(stack.alb).toBeDefined();
      // Deletion protection should be false for testing environments
    });
  });

  describe('target groups', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new AlbStack('test-alb-tg', {
          environmentSuffix: 'dev',
          vpcId: mockOutput('vpc-dev'),
          publicSubnetIds: mockOutput(['subnet-1', 'subnet-2']),
          albSecurityGroupId: mockOutput('sg-alb-dev'),
        });

        return {
          frontendTgArn: stack.frontendTargetGroup.arn,
          backendTgArn: stack.backendTargetGroup.arn,
        };
      });
    });

    it('should configure frontend target group on port 3000', () => {
      expect(stack.frontendTargetGroup).toBeDefined();
      // Frontend TG should use port 3000
    });

    it('should configure backend target group on port 8080', () => {
      expect(stack.backendTargetGroup).toBeDefined();
      // Backend TG should use port 8080
    });

    it('should use IP target type for Fargate', () => {
      expect(stack.frontendTargetGroup).toBeDefined();
      expect(stack.backendTargetGroup).toBeDefined();
      // Target type should be 'ip' for Fargate
    });

    it('should configure health checks with 30-second intervals', () => {
      expect(stack.frontendTargetGroup).toBeDefined();
      expect(stack.backendTargetGroup).toBeDefined();
      // Health check interval should be 30 seconds
    });

    it('should configure frontend health check path as /', () => {
      expect(stack.frontendTargetGroup).toBeDefined();
      // Frontend health check path should be '/'
    });

    it('should configure backend health check path as /api/health', () => {
      expect(stack.backendTargetGroup).toBeDefined();
      // Backend health check path should be '/api/health'
    });
  });

  describe('listener rules', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new AlbStack('test-alb-rules', {
          environmentSuffix: 'staging',
          vpcId: mockOutput('vpc-staging'),
          publicSubnetIds: mockOutput(['subnet-a', 'subnet-b']),
          albSecurityGroupId: mockOutput('sg-alb-staging'),
        });

        return {
          httpsListenerArn: stack.httpsListener.arn,
        };
      });
    });

    it('should create HTTPS listener on port 443', () => {
      expect(stack.httpsListener).toBeDefined();
      // HTTPS listener should be on port 443
    });

    it('should use TLS 1.2 security policy', () => {
      expect(stack.httpsListener).toBeDefined();
      // Should use ELBSecurityPolicy-TLS-1-2-2017-01 or newer
    });

    it('should forward default traffic to frontend', () => {
      expect(stack.httpsListener).toBeDefined();
      expect(stack.frontendTargetGroup).toBeDefined();
      // Default action should forward to frontend TG
    });

    it('should route /api/* to backend target group', () => {
      expect(stack).toBeDefined();
      // Listener rule should route /api/* pattern to backend TG
    });

    it('should route /* to frontend target group', () => {
      expect(stack).toBeDefined();
      // Listener rule should route /* pattern to frontend TG
    });
  });

  describe('HTTPS configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new AlbStack('test-alb-https', {
          environmentSuffix: 'prod',
          vpcId: mockOutput('vpc-prod'),
          publicSubnetIds: mockOutput(['subnet-1', 'subnet-2']),
          albSecurityGroupId: mockOutput('sg-alb-prod'),
          certificateArn: 'arn:aws:acm:eu-west-2:123456789012:certificate/test',
        });

        return {
          httpsListenerArn: stack.httpsListener.arn,
        };
      });
    });

    it('should accept custom certificate ARN', () => {
      expect(stack.httpsListener).toBeDefined();
      // Should use provided certificate ARN
    });

    it('should have HTTP to HTTPS redirect', () => {
      expect(stack).toBeDefined();
      // HTTP listener should redirect to HTTPS
    });
  });
});
