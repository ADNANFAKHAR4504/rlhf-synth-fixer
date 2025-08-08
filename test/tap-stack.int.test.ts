// test/tap-stack.int.test.ts
import outputs from '../lib/TapStack.json';

describe('Infrastructure Integration Tests', () => {

  describe('Load Balancer', () => {
    test('should have a valid LoadBalancerDNS', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toMatch(/^[a-zA-Z0-9-]+\.elb\.amazonaws\.com$/);
    });

    test('should have a valid LoadBalancerURL', () => {
      expect(outputs.LoadBalancerURL).toBeDefined();
      expect(outputs.LoadBalancerURL).toMatch(/^http:\/\/[a-zA-Z0-9-]+\.elb\.amazonaws\.com$/);
    });
  });

  describe('Networking', () => {
    test('should have a valid VPC ID', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });
  });

  describe('Stack Metadata', () => {
    test('should have the stack name defined', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    test('should have environment suffix defined', () => {
      expect(outputs.EnvironmentSuffix).toBeDefined();
      expect(outputs.EnvironmentSuffix).toMatch(/^[a-z0-9-]+$/);
    });
  });

});
