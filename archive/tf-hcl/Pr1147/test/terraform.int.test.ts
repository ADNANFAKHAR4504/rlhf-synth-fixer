import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    // Read the deployment outputs from cfn-outputs
    const outputsPath = path.join(
      __dirname,
      '..',
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        'Deployment outputs not found. Please run deployment first.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);

    // Parse JSON string arrays into actual arrays
    const arrayFields = [
      'public_subnet_ids',
      'private_subnet_ids',
      'nat_gateway_ids',
      'elastic_ip_addresses',
    ];

    arrayFields.forEach(field => {
      if (outputs[field] && typeof outputs[field] === 'string') {
        try {
          outputs[field] = JSON.parse(outputs[field]);
        } catch (error) {
          console.warn(`Failed to parse ${field} as JSON array:`, error);
        }
      }
    });
  });

  describe('VPC and Networking', () => {
    test('should have created VPC', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have created public subnets', () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);

      outputs.public_subnet_ids.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('should have created private subnets', () => {
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);

      outputs.private_subnet_ids.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('should have created NAT gateways', () => {
      expect(outputs.nat_gateway_ids).toBeDefined();
      expect(Array.isArray(outputs.nat_gateway_ids)).toBe(true);
      expect(outputs.nat_gateway_ids.length).toBeGreaterThanOrEqual(2);

      outputs.nat_gateway_ids.forEach((natId: string) => {
        expect(natId).toMatch(/^nat-[a-f0-9]+$/);
      });
    });

    test('should have allocated Elastic IPs', () => {
      expect(outputs.elastic_ip_addresses).toBeDefined();
      expect(Array.isArray(outputs.elastic_ip_addresses)).toBe(true);
      expect(outputs.elastic_ip_addresses.length).toBeGreaterThanOrEqual(2);

      outputs.elastic_ip_addresses.forEach((eip: string) => {
        // Check if it's a valid IP address
        expect(eip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      });
    });
  });

  describe('Load Balancer', () => {
    test('should have created Application Load Balancer', () => {
      expect(outputs.load_balancer_dns).toBeDefined();
      expect(outputs.load_balancer_dns).toContain('.elb.amazonaws.com');
      expect(outputs.load_balancer_dns).toContain('prod-alb');
    });

    test('should have HTTP URL configured', () => {
      expect(outputs.load_balancer_url_http).toBeDefined();
      expect(outputs.load_balancer_url_http).toMatch(
        /^http:\/\/.+\.elb\.amazonaws\.com$/
      );
    });

    test('should have HTTPS URL configured', () => {
      expect(outputs.load_balancer_url_https).toBeDefined();
      expect(outputs.load_balancer_url_https).toMatch(
        /^https:\/\/.+\.elb\.amazonaws\.com$/
      );
    });

    test('should have created target group', () => {
      expect(outputs.target_group_arn).toBeDefined();
      expect(outputs.target_group_arn).toMatch(
        /^arn:aws:elasticloadbalancing:[^:]+:[^:]+:targetgroup\/prod-tg/
      );
    });
  });

  describe('Security Groups', () => {
    test('should have created ALB security group', () => {
      expect(outputs.alb_security_group_id).toBeDefined();
      expect(outputs.alb_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('should have created EC2 security group', () => {
      expect(outputs.ec2_security_group_id).toBeDefined();
      expect(outputs.ec2_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('security groups should be different', () => {
      expect(outputs.alb_security_group_id).not.toBe(
        outputs.ec2_security_group_id
      );
    });
  });

  describe('Auto Scaling', () => {
    test('should have created Auto Scaling Group', () => {
      expect(outputs.autoscaling_group_name).toBeDefined();
      expect(outputs.autoscaling_group_name).toContain('prod-asg');
    });

    test('should include environment suffix in ASG name', () => {
      if (outputs.environment_suffix && outputs.environment_suffix !== '') {
        expect(outputs.autoscaling_group_name).toContain(
          outputs.environment_suffix
        );
      }
    });
  });

  describe('S3 Buckets', () => {
    test('should have created application data bucket', () => {
      expect(outputs.data_bucket_name).toBeDefined();
      expect(outputs.data_bucket_name).toContain('prod-app-data');
      // S3 bucket names must be globally unique, so they should have a random suffix
      expect(outputs.data_bucket_name.length).toBeGreaterThan(
        'prod-app-data'.length
      );
    });

    test('should have created logs bucket', () => {
      expect(outputs.logs_bucket_name).toBeDefined();
      expect(outputs.logs_bucket_name).toContain('prod-logs');
      // S3 bucket names must be globally unique, so they should have a random suffix
      expect(outputs.logs_bucket_name.length).toBeGreaterThan(
        'prod-logs'.length
      );
    });

    test('buckets should be different', () => {
      expect(outputs.data_bucket_name).not.toBe(outputs.logs_bucket_name);
    });

    test('buckets should include environment suffix if provided', () => {
      if (outputs.environment_suffix && outputs.environment_suffix !== '') {
        expect(outputs.data_bucket_name).toContain(outputs.environment_suffix);
        expect(outputs.logs_bucket_name).toContain(outputs.environment_suffix);
      }
    });
  });

  // Certificate tests removed - test environment uses HTTP only

  describe('Environment Configuration', () => {
    test('should have environment suffix output', () => {
      expect(outputs.environment_suffix).toBeDefined();
    });

    test('all resource names should follow naming convention', () => {
      // Check that resource names contain 'prod' prefix where applicable
      expect(outputs.load_balancer_dns).toContain('prod-alb');
      expect(outputs.autoscaling_group_name).toContain('prod-asg');
      expect(outputs.data_bucket_name).toContain('prod-app-data');
      expect(outputs.logs_bucket_name).toContain('prod-logs');
    });
  });

  describe('High Availability', () => {
    test('should have resources in multiple availability zones', () => {
      // Check we have at least 2 public and 2 private subnets (multi-AZ)
      expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);
      expect(outputs.nat_gateway_ids.length).toBeGreaterThanOrEqual(2);
    });

    test('should have redundant NAT gateways', () => {
      // Each AZ should have its own NAT gateway for high availability
      expect(outputs.nat_gateway_ids.length).toBe(
        outputs.public_subnet_ids.length
      );
      expect(outputs.elastic_ip_addresses.length).toBe(
        outputs.nat_gateway_ids.length
      );
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('should have load balancer connected to VPC', () => {
      // Load balancer DNS should be present and properly formatted
      expect(outputs.load_balancer_dns).toBeDefined();
      expect(outputs.load_balancer_dns).not.toBe('');
    });

    test('should have proper URL formatting', () => {
      const httpUrl = outputs.load_balancer_url_http;
      const httpsUrl = outputs.load_balancer_url_https;
      const lbDns = outputs.load_balancer_dns;

      expect(httpUrl).toBe(`http://${lbDns}`);
      expect(httpsUrl).toBe(`https://${lbDns}`);
    });

    test('should have ASG connected to target group', () => {
      expect(outputs.target_group_arn).toBeDefined();
      expect(outputs.autoscaling_group_name).toBeDefined();

      // Both should exist for the connection to work
      expect(outputs.target_group_arn).not.toBe('');
      expect(outputs.autoscaling_group_name).not.toBe('');
    });
  });

  describe('Resource Tagging and Organization', () => {
    test('should have consistent resource naming', () => {
      const suffix = outputs.environment_suffix || '';

      // If we have a suffix, check it's consistently applied
      if (suffix) {
        const resourcesWithSuffix = [
          outputs.autoscaling_group_name,
          outputs.data_bucket_name,
          outputs.logs_bucket_name,
          outputs.load_balancer_dns,
        ];

        resourcesWithSuffix.forEach(resourceName => {
          if (resourceName && typeof resourceName === 'string') {
            expect(resourceName.toLowerCase()).toContain(suffix.toLowerCase());
          }
        });
      }
    });
  });

  describe('Deployment Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'vpc_id',
        'load_balancer_dns',
        'load_balancer_url_http',
        'load_balancer_url_https',
        'data_bucket_name',
        'logs_bucket_name',
        'public_subnet_ids',
        'private_subnet_ids',
        'alb_security_group_id',
        'ec2_security_group_id',
        'autoscaling_group_name',
        'target_group_arn',
        'nat_gateway_ids',
        'elastic_ip_addresses',
        'environment_suffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe(null);
      });
    });

    test('should have valid AWS resource IDs', () => {
      // VPC ID validation
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);

      // Security Group ID validation
      expect(outputs.alb_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.ec2_security_group_id).toMatch(/^sg-[a-f0-9]+$/);

      // ARN validation
      expect(outputs.target_group_arn).toMatch(/^arn:aws:/);
    });
  });
});
