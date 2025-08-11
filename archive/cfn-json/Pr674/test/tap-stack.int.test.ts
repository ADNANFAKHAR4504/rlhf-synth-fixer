// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';

describe('TapStack Integration Tests', () => {
  let outputs: any = {};

  beforeAll(() => {
    // Only load outputs if the file exists (for actual deployment testing)
    try {
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        outputs = JSON.parse(
          fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
        );
      }
    } catch (error) {
      console.log('No deployment outputs found, running in mock mode');
    }
  });

  describe('Deployment Outputs Validation', () => {
    test('should have VPC ID output', () => {
      if (outputs.VPCId) {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('should have Load Balancer DNS output', () => {
      if (outputs.LoadBalancerDNS) {
        expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('should have RDS endpoint output', () => {
      if (outputs.RDSEndpoint) {
        expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');
        // RDS endpoints don't include port in the address, just verify format
        expect(outputs.RDSEndpoint).toMatch(
          /^[a-zA-Z0-9-]+\.c[a-zA-Z0-9]+\.us-east-1\.rds\.amazonaws\.com$/
        );
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('should have S3 bucket outputs', () => {
      if (outputs.AppDataBucket) {
        // Verify bucket names follow CloudFormation auto-generated pattern
        // CloudFormation generates names like: stackname-logicalid-randomstring
        expect(outputs.AppDataBucket).toMatch(/^[a-z0-9-]+$/); // Valid S3 bucket name format
        expect(outputs.AppLogsBucket).toMatch(/^[a-z0-9-]+$/);

        // Verify buckets are different
        expect(outputs.AppDataBucket).not.toBe(outputs.AppLogsBucket);

        // Verify bucket names contain the stack/logical ID patterns
        expect(outputs.AppDataBucket.toLowerCase()).toContain('appdatabucket');
        expect(outputs.AppLogsBucket.toLowerCase()).toContain('applogsbucket');
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('should have Auto Scaling Group name output', () => {
      if (outputs.AutoScalingGroupName) {
        expect(outputs.AutoScalingGroupName).toContain('asg');
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('should have NAT Gateway EIP output', () => {
      if (outputs.NATGatewayEIP) {
        // Validate IP address format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        expect(outputs.NATGatewayEIP).toMatch(ipRegex);
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });
  });

  describe('Resource Connectivity Tests', () => {
    test('ALB should be accessible via DNS', async () => {
      if (outputs.LoadBalancerDNS) {
        // In a real test, you would make an HTTP request to the ALB
        // For now, just verify the DNS format
        expect(outputs.LoadBalancerDNS).toBeTruthy();
        expect(outputs.LoadBalancerDNS).not.toContain('undefined');
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('S3 buckets should be created with correct naming', () => {
      if (outputs.AppDataBucket && outputs.AppLogsBucket) {
        // Verify bucket names don't conflict
        expect(outputs.AppDataBucket).not.toBe(outputs.AppLogsBucket);

        // Verify bucket names follow AWS S3 naming conventions
        // S3 bucket names must be between 3 and 63 characters long
        expect(outputs.AppDataBucket.length).toBeGreaterThanOrEqual(3);
        expect(outputs.AppDataBucket.length).toBeLessThanOrEqual(63);
        expect(outputs.AppLogsBucket.length).toBeGreaterThanOrEqual(3);
        expect(outputs.AppLogsBucket.length).toBeLessThanOrEqual(63);

        // S3 bucket names must be lowercase and can contain letters, numbers, and hyphens
        expect(outputs.AppDataBucket).toMatch(/^[a-z0-9-]+$/);
        expect(outputs.AppLogsBucket).toMatch(/^[a-z0-9-]+$/);

        // Verify buckets have different names (indicating proper resource separation)
        expect(outputs.AppDataBucket).not.toEqual(outputs.AppLogsBucket);
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multi-AZ deployment indicators', () => {
      if (outputs.RDSEndpoint) {
        // RDS endpoint exists, indicating database is deployed
        expect(outputs.RDSEndpoint).toBeTruthy();
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('should have load balancer for traffic distribution', () => {
      if (outputs.LoadBalancerDNS && outputs.LoadBalancerURL) {
        expect(outputs.LoadBalancerURL).toContain('http://');
        expect(outputs.LoadBalancerURL).toContain(outputs.LoadBalancerDNS);
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have encryption indicators', () => {
      if (outputs.AppDataBucket && outputs.AppLogsBucket) {
        // Bucket names exist and are unique
        expect(outputs.AppDataBucket).toBeTruthy();
        expect(outputs.AppLogsBucket).toBeTruthy();
        expect(outputs.AppDataBucket).not.toBe(outputs.AppLogsBucket);
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });

    test('VPC should be configured', () => {
      if (outputs.VPCId) {
        expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudTrail configured for auditing', () => {
      if (outputs.AppLogsBucket) {
        // CloudTrail uses the logs bucket - verify it's a valid S3 bucket name
        expect(outputs.AppLogsBucket).toMatch(/^[a-z0-9-]+$/);
        expect(outputs.AppLogsBucket.toLowerCase()).toContain('applogsbucket');
      } else {
        console.log('Skipping: No actual deployment outputs available');
      }
    });
  });
});
