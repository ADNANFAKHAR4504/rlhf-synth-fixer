// Configuration - These are coming from CloudFormation outputs after deploy
import fs from 'fs';

let outputs: any = {};

// Check if outputs file exists (only present when a stack has been deployed)
if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests (Outputs validation)', () => {
  const skipTests = !outputs || Object.keys(outputs).length === 0;

  if (skipTests) {
    console.log('⚠️ Skipping integration tests - no deployment outputs found (test/cfn-outputs/flat-outputs.json)');
    console.log('ℹ️ Integration tests require actual CloudFormation deployment to run');
  } else {
    console.log('✅ Running integration tests with deployment outputs');
  }

  describe('Infrastructure Deployment Validation', () => {
    test('should have all required outputs from CloudFormation deployment', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const requiredOutputs = [
        'VPC',
        'PublicSubnets',
        'WebServerSecurityGroup',
        'ALBSecurityGroup',
        'WebServer1PublicIP',
        'WebServer2PublicIP',
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'LoadBalancerHostedZone'
      ];

      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBeNull();
        expect(String(outputs[key])).not.toBe('');
      });
    });
  });

  describe('Output Format Validation', () => {
    test('public IPs should look like IPv4 addresses', () => {
      if (skipTests) return;
      const ipRegex = /^\d+\.\d+\.\d+\.\d+$/;
      expect(outputs.WebServer1PublicIP).toMatch(ipRegex);
      expect(outputs.WebServer2PublicIP).toMatch(ipRegex);
    });

    test('ALB DNS and URL should be valid-looking strings', () => {
      if (skipTests) return;
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).not.toBe('');
      expect(outputs.LoadBalancerURL).toMatch(/^https:\/\//);
    });

    test('security group and VPC IDs should look like AWS IDs', () => {
      if (skipTests) return;
      expect(outputs.VPC).toMatch(/^vpc-[a-z0-9]+$/);
      expect(outputs.WebServerSecurityGroup).toMatch(/^sg-[a-z0-9]+$/);
      expect(outputs.ALBSecurityGroup).toMatch(/^sg-[a-z0-9]+$/);
    });
  });

  describe('Integration Test Summary', () => {
    test('summary', () => {
      if (skipTests) {
        console.log('⚠️ Summary: No deployment detected; outputs-based tests skipped');
        return;
      }

      console.log('\n📋 INTEGRATION TEST SUMMARY');
      console.log('==================================================');
      console.log(`📝  Environment: ${environmentSuffix}`);
      console.log(`🏗️  VPC: ${outputs.VPC}`);
      console.log(`🌐  Public Subnets: ${outputs.PublicSubnets}`);
      console.log(`🔒  Web SG: ${outputs.WebServerSecurityGroup}`);
      console.log(`🔒  ALB SG: ${outputs.ALBSecurityGroup}`);
      console.log(`🌍  ALB DNS: ${outputs.LoadBalancerDNS}`);
      console.log(`🔗  ALB URL: ${outputs.LoadBalancerURL}`);
      console.log(`🆔  ALB Hosted Zone: ${outputs.LoadBalancerHostedZone}`);
      console.log('==================================================\n');
    });
  });
});
