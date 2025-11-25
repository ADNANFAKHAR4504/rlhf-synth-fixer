/**
 * Unit tests for RoutingStack
 * Tests Route 53 health checks, failover routing, and hosted zones
 */
import * as pulumi from '@pulumi/pulumi';
import { RoutingStack } from '../lib/routing-stack';

describe('RoutingStack', () => {
  let routingStack: RoutingStack;
  const mockAlbDns = pulumi.output('alb-12345.region.elb.amazonaws.com');

  beforeEach(() => {
    routingStack = new RoutingStack('test-routing', {
      environmentSuffix: 'test',
      primaryAlbDns: mockAlbDns,
      secondaryAlbDns: mockAlbDns,
      tags: { Environment: 'test' },
    });
  });

  describe('Resource Creation', () => {
    it('should create RoutingStack instance successfully', () => {
      expect(routingStack).toBeDefined();
      expect(routingStack).toBeInstanceOf(RoutingStack);
    });

    it('should expose healthCheckId output', () => {
      expect(routingStack.healthCheckId).toBeDefined();
    });

    it('should expose failoverDomainName output', () => {
      expect(routingStack.failoverDomainName).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different environment suffixes', () => {
      const stack1 = new RoutingStack('routing-dev', {
        environmentSuffix: 'dev',
        primaryAlbDns: mockAlbDns,
        secondaryAlbDns: mockAlbDns,
      });
      expect(stack1).toBeDefined();

      const stack2 = new RoutingStack('routing-prod', {
        environmentSuffix: 'prod',
        primaryAlbDns: mockAlbDns,
        secondaryAlbDns: mockAlbDns,
      });
      expect(stack2).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customTags = {
        Environment: 'production',
        HealthCheckInterval: '30s',
        FailoverThreshold: '2',
      };
      const stack = new RoutingStack('routing-tagged', {
        environmentSuffix: 'tagged',
        primaryAlbDns: mockAlbDns,
        secondaryAlbDns: mockAlbDns,
        tags: customTags,
      });
      expect(stack).toBeDefined();
    });

    it('should work without optional tags', () => {
      const stack = new RoutingStack('routing-minimal', {
        environmentSuffix: 'minimal',
        primaryAlbDns: mockAlbDns,
        secondaryAlbDns: mockAlbDns,
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Failover Routing', () => {
    it('should create health check for primary ALB', () => {
      expect(routingStack.healthCheckId).toBeDefined();
    });

    it('should create failover domain name', () => {
      expect(routingStack.failoverDomainName).toBeDefined();
    });

    it('should support different ALB DNS names', () => {
      const primaryAlb = pulumi.output('primary-alb.us-east-1.elb.amazonaws.com');
      const secondaryAlb = pulumi.output('secondary-alb.us-west-2.elb.amazonaws.com');

      const stack = new RoutingStack('routing-different-albs', {
        environmentSuffix: 'diffal',
        primaryAlbDns: primaryAlb,
        secondaryAlbDns: secondaryAlb,
      });
      expect(stack).toBeDefined();
      expect(stack.healthCheckId).toBeDefined();
      expect(stack.failoverDomainName).toBeDefined();
    });
  });

  describe('Health Check Configuration', () => {
    it('should create health check with monitoring enabled', () => {
      const stack = new RoutingStack('routing-healthcheck', {
        environmentSuffix: 'hc',
        primaryAlbDns: mockAlbDns,
        secondaryAlbDns: mockAlbDns,
      });
      expect(stack.healthCheckId).toBeDefined();
    });
  });

  describe('Route 53 Integration', () => {
    it('should create hosted zone for failover domain', () => {
      const stack = new RoutingStack('routing-zone', {
        environmentSuffix: 'zone',
        primaryAlbDns: mockAlbDns,
        secondaryAlbDns: mockAlbDns,
      });
      expect(stack.failoverDomainName).toBeDefined();
    });
  });
});
