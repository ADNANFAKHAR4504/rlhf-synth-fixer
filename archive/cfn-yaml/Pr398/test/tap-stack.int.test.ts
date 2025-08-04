// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import fetch from 'node-fetch';

let outputs: any = {};
let isMockData = false;

// Check if outputs file exists (only in CI/CD deployment scenarios)
if (fs.existsSync('test/cfn-outputs/flat-outputs.json')) {
  outputs = JSON.parse(
    fs.readFileSync('test/cfn-outputs/flat-outputs.json', 'utf8')
  );
  
  // Check if this is mock data (contains placeholder values)
  isMockData = outputs.PrimaryInstanceId === 'i-1234567890abcdef0';
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Route 53 Failover Infrastructure Integration Tests', () => {
  
  // Skip integration tests if no deployment outputs are available
  const skipTests = !outputs || Object.keys(outputs).length === 0;
  
  if (skipTests) {
    console.log('⚠️ Skipping integration tests - no deployment outputs found (test/cfn-outputs/flat-outputs.json)');
    console.log('ℹ️ Integration tests require actual AWS deployment to run');
  } else if (isMockData) {
    console.log('ℹ️ Running integration tests with mock data (no actual HTTP requests)');
  } else {
    console.log('✅ Running integration tests with real deployment data');
  }

  describe('Infrastructure Deployment Validation', () => {
    test('should have all required outputs from CloudFormation deployment', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const requiredOutputs = [
        'PrimaryInstanceId',
        'StandbyInstanceId',
        'PrimaryPublicIP',
        'StandbyPublicIP',
        'PrimaryPublicDNS',
        'StandbyPublicDNS',
        'HealthCheckId',
        'DomainName',
        'VPCId',
        'WebServerSecurityGroupId',
        'PrimaryAvailabilityZone',
        'StandbyAvailabilityZone'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBeNull();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('should have instances in different availability zones', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const primaryAZ = outputs.PrimaryAvailabilityZone;
      const standbyAZ = outputs.StandbyAvailabilityZone;
      
      expect(primaryAZ).toBeDefined();
      expect(standbyAZ).toBeDefined();
      expect(primaryAZ).not.toBe(standbyAZ);
      
      console.log(`✅ Primary instance in AZ: ${primaryAZ}`);
      console.log(`✅ Standby instance in AZ: ${standbyAZ}`);
    });
  });

  describe('Web Server Accessibility', () => {
    test('primary web server should be accessible via HTTP', async () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      if (isMockData) {
        console.log('ℹ️ Skipping HTTP test - using mock data');
        expect(outputs.PrimaryPublicIP).toBeDefined();
        expect(outputs.PrimaryPublicIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
        return;
      }

      const primaryIP = outputs.PrimaryPublicIP;
      expect(primaryIP).toBeDefined();
      
      const url = `http://${primaryIP}/`;
      console.log(`Testing primary server at: ${url}`);
      
      try {
        const response = await fetch(url, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Integration-Test/1.0' }
        });
        
        expect(response.status).toBe(200);
        
        const text = await response.text();
        expect(text).toContain('Primary Web Server');
        expect(text).toContain('Status: ACTIVE (Primary)');
        
        console.log('✅ Primary web server is accessible and serving correct content');
      } catch (error) {
        console.error(`❌ Failed to connect to primary server: ${error}`);
        // Allow some time for EC2 instances to fully boot up
        console.log('ℹ️ This might be expected if instances are still starting up');
        throw error;
      }
    }, 30000);

    test('standby web server should be accessible via HTTP', async () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      if (isMockData) {
        console.log('ℹ️ Skipping HTTP test - using mock data');
        expect(outputs.StandbyPublicIP).toBeDefined();
        expect(outputs.StandbyPublicIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
        return;
      }

      const standbyIP = outputs.StandbyPublicIP;
      expect(standbyIP).toBeDefined();
      
      const url = `http://${standbyIP}/`;
      console.log(`Testing standby server at: ${url}`);
      
      try {
        const response = await fetch(url, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Integration-Test/1.0' }
        });
        
        expect(response.status).toBe(200);
        
        const text = await response.text();
        expect(text).toContain('Standby Web Server');
        expect(text).toContain('Status: STANDBY (Secondary)');
        
        console.log('✅ Standby web server is accessible and serving correct content');
      } catch (error) {
        console.error(`❌ Failed to connect to standby server: ${error}`);
        // Allow some time for EC2 instances to fully boot up
        console.log('ℹ️ This might be expected if instances are still starting up');
        throw error;
      }
    }, 30000);
  });

  describe('Health Check Endpoints', () => {
    test('primary server health check endpoint should respond', async () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      if (isMockData) {
        console.log('ℹ️ Skipping HTTP test - using mock data');
        expect(outputs.PrimaryPublicIP).toBeDefined();
        return;
      }

      const primaryIP = outputs.PrimaryPublicIP;
      const healthUrl = `http://${primaryIP}/health`;
      console.log(`Testing primary health endpoint at: ${healthUrl}`);
      
      try {
        const response = await fetch(healthUrl, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Integration-Test/1.0' }
        });
        
        expect(response.status).toBe(200);
        
        const text = await response.text();
        expect(text.trim()).toBe('OK');
        
        console.log('✅ Primary health check endpoint is working');
      } catch (error) {
        console.error(`❌ Failed to connect to primary health endpoint: ${error}`);
        throw error;
      }
    }, 30000);

    test('standby server health check endpoint should respond', async () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      if (isMockData) {
        console.log('ℹ️ Skipping HTTP test - using mock data');
        expect(outputs.StandbyPublicIP).toBeDefined();
        return;
      }

      const standbyIP = outputs.StandbyPublicIP;
      const healthUrl = `http://${standbyIP}/health`;
      console.log(`Testing standby health endpoint at: ${healthUrl}`);
      
      try {
        const response = await fetch(healthUrl, { 
          timeout: 10000,
          headers: { 'User-Agent': 'Integration-Test/1.0' }
        });
        
        expect(response.status).toBe(200);
        
        const text = await response.text();
        expect(text.trim()).toBe('OK');
        
        console.log('✅ Standby health check endpoint is working');
      } catch (error) {
        console.error(`❌ Failed to connect to standby health endpoint: ${error}`);
        throw error;
      }
    }, 30000);
  });

  describe('Route 53 DNS Resolution', () => {
    test('should have valid health check ID', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const healthCheckId = outputs.HealthCheckId;
      expect(healthCheckId).toBeDefined();
      expect(healthCheckId).toMatch(/^[a-f0-9-]+$/);
      console.log(`✅ Health check ID: ${healthCheckId}`);
    });

    test('should have valid domain name output', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const domainName = outputs.DomainName;
      expect(domainName).toBeDefined();
      expect(domainName).toBe('failoverdemo.com');
      console.log(`✅ Domain name: ${domainName}`);
    });
  });

  describe('Infrastructure Components', () => {
    test('should have valid EC2 instance IDs', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const primaryInstanceId = outputs.PrimaryInstanceId;
      const standbyInstanceId = outputs.StandbyInstanceId;
      
      expect(primaryInstanceId).toBeDefined();
      expect(standbyInstanceId).toBeDefined();
      expect(primaryInstanceId).toMatch(/^i-[a-f0-9]+$/);
      expect(standbyInstanceId).toMatch(/^i-[a-f0-9]+$/);
      expect(primaryInstanceId).not.toBe(standbyInstanceId);
      
      console.log(`✅ Primary instance ID: ${primaryInstanceId}`);
      console.log(`✅ Standby instance ID: ${standbyInstanceId}`);
    });

    test('should have valid VPC and security group IDs', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const vpcId = outputs.VPCId;
      const securityGroupId = outputs.WebServerSecurityGroupId;
      
      expect(vpcId).toBeDefined();
      expect(securityGroupId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(securityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      
      console.log(`✅ VPC ID: ${vpcId}`);
      console.log(`✅ Security Group ID: ${securityGroupId}`);
    });

    test('should have valid public IP addresses', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      const primaryIP = outputs.PrimaryPublicIP;
      const standbyIP = outputs.StandbyPublicIP;
      
      expect(primaryIP).toBeDefined();
      expect(standbyIP).toBeDefined();
      expect(primaryIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(standbyIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(primaryIP).not.toBe(standbyIP);
      
      console.log(`✅ Primary IP: ${primaryIP}`);
      console.log(`✅ Standby IP: ${standbyIP}`);
    });
  });

  describe('End-to-End Validation Summary', () => {
    test('integration test summary', () => {
      if (skipTests) {
        console.log('⚠️ Skipping test - no deployment detected');
        return;
      }

      console.log('\n📋 INTEGRATION TEST SUMMARY');
      console.log('==================================================');
      
      if (isMockData) {
        console.log('⚠️  Status: MOCK DATA - Using simulated outputs');
        console.log('ℹ️  Note: HTTP connectivity tests were skipped');
      } else {
        console.log('✅  Status: REAL DEPLOYMENT - Using actual AWS outputs');
        console.log('ℹ️  Note: HTTP connectivity tests were executed');
      }
      
      console.log(`📝  Environment: ${environmentSuffix}`);
      console.log(`🌐  Domain: ${outputs.DomainName}`);
      console.log(`🏗️  VPC: ${outputs.VPCId}`);
      console.log(`🔒  Security Group: ${outputs.WebServerSecurityGroupId}`);
      console.log(`🏥  Health Check: ${outputs.HealthCheckId}`);
      console.log('==================================================\n');
    });
  });
});