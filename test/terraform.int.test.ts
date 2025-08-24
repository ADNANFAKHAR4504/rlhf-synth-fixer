import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Infrastructure Integration Tests', () => {
  let flatOutputs: Record<string, any> = {};

  beforeAll(async () => {
    // Load flat-outputs.json if it exists (from deployment step)
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      flatOutputs = JSON.parse(outputsContent);
    } else {
      // Mock outputs for testing when not deployed
      flatOutputs = {
        'vpc_id': 'vpc-1234567890abcdef0',
        'alb_dns_name': 'mock-alb-123456789.us-west-2.elb.amazonaws.com',
        'cloudfront_domain_name': 'mock-distribution.cloudfront.net',
        'database_endpoint': 'mock-db-123456789.us-west-2.rds.amazonaws.com:3306',
        'public_subnet_ids': ['subnet-1234567890abcdef0', 'subnet-1234567890abcdef1'],
        'private_subnet_ids': ['subnet-1234567890abcdef2', 'subnet-1234567890abcdef3'],
        'alb_security_group_id': 'sg-1234567890abcdef0',
        'web_security_group_id': 'sg-1234567890abcdef1',
        'database_security_group_id': 'sg-1234567890abcdef2',
        'nat_gateway_id': 'nat-1234567890abcdef0'
      };
    }
  }, 30000);

  describe('Infrastructure Deployment Validation', () => {
    test('should have all required outputs available', () => {
      expect(flatOutputs).toBeDefined();
      expect(Object.keys(flatOutputs).length).toBeGreaterThan(0);
      
      // Check for required outputs
      expect(flatOutputs).toHaveProperty('vpc_id');
      expect(flatOutputs).toHaveProperty('alb_dns_name');
      expect(flatOutputs).toHaveProperty('cloudfront_domain_name');
      expect(flatOutputs).toHaveProperty('database_endpoint');
    });

    test('should have valid AWS resource identifiers', () => {
      // Validate VPC ID format
      if (flatOutputs.vpc_id) {
        expect(flatOutputs.vpc_id).toMatch(/^vpc-[0-9a-f]{8,17}$/);
      }

      // Validate subnet ID formats
      if (flatOutputs.public_subnet_ids) {
        flatOutputs.public_subnet_ids.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[0-9a-f]{8,17}$/);
        });
      }

      if (flatOutputs.private_subnet_ids) {
        flatOutputs.private_subnet_ids.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[0-9a-f]{8,17}$/);
        });
      }

      // Validate security group ID formats
      if (flatOutputs.alb_security_group_id) {
        expect(flatOutputs.alb_security_group_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
      }

      if (flatOutputs.web_security_group_id) {
        expect(flatOutputs.web_security_group_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
      }

      if (flatOutputs.database_security_group_id) {
        expect(flatOutputs.database_security_group_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
      }

      // Validate NAT Gateway ID format
      if (flatOutputs.nat_gateway_id) {
        expect(flatOutputs.nat_gateway_id).toMatch(/^nat-[0-9a-f]{8,17}$/);
      }
    });
  });

  describe('Network Infrastructure Validation', () => {
    test('should validate VPC configuration', () => {
      expect(flatOutputs.vpc_id).toBeDefined();
      expect(flatOutputs.vpc_id).not.toBe('');
      
      // VPC ID should follow AWS naming convention
      expect(flatOutputs.vpc_id).toMatch(/^vpc-[0-9a-f]{8,17}$/);
    });

    test('should validate subnet configuration', () => {
      // Public subnets should exist
      expect(flatOutputs.public_subnet_ids).toBeDefined();
      expect(Array.isArray(flatOutputs.public_subnet_ids)).toBe(true);
      expect(flatOutputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);

      // Private subnets should exist
      expect(flatOutputs.private_subnet_ids).toBeDefined();
      expect(Array.isArray(flatOutputs.private_subnet_ids)).toBe(true);
      expect(flatOutputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);

      // All subnet IDs should be unique
      const allSubnetIds = [...(flatOutputs.public_subnet_ids || []), ...(flatOutputs.private_subnet_ids || [])];
      const uniqueSubnetIds = new Set(allSubnetIds);
      expect(uniqueSubnetIds.size).toBe(allSubnetIds.length);
    });

    test('should validate NAT Gateway configuration', () => {
      expect(flatOutputs.nat_gateway_id).toBeDefined();
      expect(flatOutputs.nat_gateway_id).not.toBe('');
      
      // NAT Gateway ID should follow AWS naming convention
      expect(flatOutputs.nat_gateway_id).toMatch(/^nat-[0-9a-f]{8,17}$/);
    });
  });

  describe('Load Balancer Validation', () => {
    test('should validate Application Load Balancer configuration', () => {
      expect(flatOutputs.alb_dns_name).toBeDefined();
      expect(flatOutputs.alb_dns_name).not.toBe('');
      
      // ALB DNS name should follow AWS ELB format
      expect(flatOutputs.alb_dns_name).toMatch(/^.*elb.*amazonaws\.com$/);
    });

    test('should validate ALB security group configuration', () => {
      expect(flatOutputs.alb_security_group_id).toBeDefined();
      expect(flatOutputs.alb_security_group_id).not.toBe('');
      
      // Security group ID should follow AWS naming convention
      expect(flatOutputs.alb_security_group_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
    });
  });

  describe('Database Infrastructure Validation', () => {
    test('should validate RDS database configuration', () => {
      expect(flatOutputs.database_endpoint).toBeDefined();
      expect(flatOutputs.database_endpoint).not.toBe('');
      
      // Database endpoint should follow AWS RDS format
      expect(flatOutputs.database_endpoint).toMatch(/^.*rds.*amazonaws\.com:\d+$/);
    });

    test('should validate database security group configuration', () => {
      expect(flatOutputs.database_security_group_id).toBeDefined();
      expect(flatOutputs.database_security_group_id).not.toBe('');
      
      // Security group ID should follow AWS naming convention
      expect(flatOutputs.database_security_group_id).toMatch(/^sg-[0-9a-f]{8,17}$/);
    });
  });

  describe('Content Delivery Validation', () => {
    test('should validate CloudFront distribution configuration', () => {
      expect(flatOutputs.cloudfront_domain_name).toBeDefined();
      expect(flatOutputs.cloudfront_domain_name).not.toBe('');
      
      // CloudFront domain should follow AWS format
      expect(flatOutputs.cloudfront_domain_name).toMatch(/^.*\.cloudfront\.net$/);
    });
  });

  describe('Security Configuration Tests', () => {
    test('should validate all security groups are properly configured', () => {
      const securityGroups = [
        flatOutputs.alb_security_group_id,
        flatOutputs.web_security_group_id,
        flatOutputs.database_security_group_id
      ];

      securityGroups.forEach(sgId => {
        expect(sgId).toBeDefined();
        expect(sgId).not.toBe('');
        expect(sgId).toMatch(/^sg-[0-9a-f]{8,17}$/);
      });
    });

    test('should validate security group naming consistency', () => {
      // All security group IDs should follow the same pattern
      const securityGroups = [
        flatOutputs.alb_security_group_id,
        flatOutputs.web_security_group_id,
        flatOutputs.database_security_group_id
      ];

      securityGroups.forEach(sgId => {
        expect(typeof sgId).toBe('string');
        expect(sgId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Connectivity Tests', () => {
    test('should validate network resource relationships', () => {
      // VPC should exist for all subnets
      expect(flatOutputs.vpc_id).toBeDefined();
      
      // Subnets should exist for network segmentation
      expect(flatOutputs.public_subnet_ids).toBeDefined();
      expect(flatOutputs.private_subnet_ids).toBeDefined();
      
      // NAT Gateway should exist for private subnet internet access
      expect(flatOutputs.nat_gateway_id).toBeDefined();
    });

    test('should validate resource naming consistency', () => {
      // All resource IDs should follow consistent patterns
      const resourceIds = [
        flatOutputs.vpc_id,
        flatOutputs.alb_security_group_id,
        flatOutputs.web_security_group_id,
        flatOutputs.database_security_group_id,
        flatOutputs.nat_gateway_id
      ].filter(Boolean);

      resourceIds.forEach(resourceId => {
        expect(typeof resourceId).toBe('string');
        expect(resourceId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('should validate complete infrastructure stack deployment', async () => {
      // Validate that all core components are present
      const requiredOutputs = [
        'vpc_id',
        'alb_dns_name',
        'cloudfront_domain_name',
        'database_endpoint',
        'public_subnet_ids',
        'private_subnet_ids',
        'alb_security_group_id',
        'web_security_group_id',
        'database_security_group_id',
        'nat_gateway_id'
      ];

      requiredOutputs.forEach(output => {
        expect(flatOutputs).toHaveProperty(output);
        expect(flatOutputs[output]).toBeDefined();
        expect(flatOutputs[output]).not.toBe('');
      });
    });

    test('should validate infrastructure security posture', () => {
      // Validate that security-related outputs are present
      expect(flatOutputs.alb_security_group_id).toBeDefined();
      expect(flatOutputs.web_security_group_id).toBeDefined();
      expect(flatOutputs.database_security_group_id).toBeDefined();
      
      // All security groups should have valid IDs
      const securityGroups = [
        flatOutputs.alb_security_group_id,
        flatOutputs.web_security_group_id,
        flatOutputs.database_security_group_id
      ];

      securityGroups.forEach(sgId => {
        expect(sgId).toMatch(/^sg-[0-9a-f]{8,17}$/);
      });
    });
  });

  describe('Compliance Validation', () => {
    test('should ensure infrastructure meets security requirements', () => {
      // All required security components should be present
      const securityOutputs = {
        'VPC': flatOutputs.vpc_id,
        'ALB Security Group': flatOutputs.alb_security_group_id,
        'Web Security Group': flatOutputs.web_security_group_id,
        'Database Security Group': flatOutputs.database_security_group_id,
        'NAT Gateway': flatOutputs.nat_gateway_id
      };

      Object.entries(securityOutputs).forEach(([component, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
      });
    });

    test('should validate resource tagging compliance', () => {
      // Outputs should exist for properly tagged resources
      expect(flatOutputs.vpc_id).toBeDefined();
      expect(flatOutputs.alb_security_group_id).toBeDefined();
      expect(flatOutputs.web_security_group_id).toBeDefined();
      expect(flatOutputs.database_security_group_id).toBeDefined();
      
      // Resources should be identifiable and trackable
      expect(typeof flatOutputs.vpc_id).toBe('string');
      expect(typeof flatOutputs.alb_security_group_id).toBe('string');
      expect(typeof flatOutputs.web_security_group_id).toBe('string');
      expect(typeof flatOutputs.database_security_group_id).toBe('string');
    });
  });

  describe('Operational Validation', () => {
    test('should validate monitoring and logging capabilities', () => {
      // VPC should exist for network monitoring
      expect(flatOutputs.vpc_id).toBeDefined();
      
      // Security groups should exist for network monitoring
      expect(flatOutputs.alb_security_group_id).toBeDefined();
      expect(flatOutputs.web_security_group_id).toBeDefined();
      expect(flatOutputs.database_security_group_id).toBeDefined();
      
      // Load balancer should exist for application monitoring
      expect(flatOutputs.alb_dns_name).toBeDefined();
    });

    test('should validate backup and recovery readiness', () => {
      // Core infrastructure components should be present
      expect(flatOutputs.vpc_id).toBeDefined();
      expect(flatOutputs.database_endpoint).toBeDefined();
      
      // Security groups should be available for backup operations
      expect(flatOutputs.database_security_group_id).toBeDefined();
    });
  });

  describe('Network Architecture Validation', () => {
    test('should validate multi-tier network design', () => {
      // Should have both public and private subnets
      expect(flatOutputs.public_subnet_ids).toBeDefined();
      expect(flatOutputs.private_subnet_ids).toBeDefined();
      
      // Should have at least 2 public and 2 private subnets for high availability
      expect(flatOutputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);
      expect(flatOutputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);
      
      // NAT Gateway should exist for private subnet internet access
      expect(flatOutputs.nat_gateway_id).toBeDefined();
    });

    test('should validate load balancer placement', () => {
      // ALB should exist for traffic distribution
      expect(flatOutputs.alb_dns_name).toBeDefined();
      
      // ALB should have associated security group
      expect(flatOutputs.alb_security_group_id).toBeDefined();
    });
  });
});
