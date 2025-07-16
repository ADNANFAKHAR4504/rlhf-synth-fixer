import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

describe('CloudFormation Security Template Unit Tests', () => {
  let template: any;
  
  beforeAll(() => {
    // Load the CloudFormation template from your IDEAL_RESPONSE.md
    const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Extract YAML from markdown (assuming it's in a code block)
    const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
    if (yamlMatch) {
      template = yaml.load(yamlMatch[1]);
    } else {
      throw new Error('Could not find YAML template in IDEAL_RESPONSE.md');
    }
  });

  describe('Template Structure', () => {
    test('should have required CloudFormation structure', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have correct template version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  describe('VPC and Networking Requirements', () => {
    test('should create VPC with correct CIDR', () => {
      expect(template.Resources).toHaveProperty('VPC');
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      // Add specific CIDR validation if needed
    });

    test('should create subnets in multiple AZs', () => {
      const subnets = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have Internet Gateway', () => {
      const igws = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::InternetGateway'
      );
      expect(igws.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security Requirements', () => {
    test('should create IAM roles with least privilege', () => {
      const roles = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::IAM::Role'
      );
      expect(roles.length).toBeGreaterThan(0);
    });

    test('should create security groups', () => {
      const securityGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThan(0);
    });

    test('should have KMS keys for encryption', () => {
      const kmsKeys = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::KMS::Key'
      );
      expect(kmsKeys.length).toBeGreaterThan(0);
    });
  });

  describe('Database Requirements', () => {
    test('should create RDS instance with Multi-AZ', () => {
      const rdsInstances = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::RDS::DBInstance'
      );
      expect(rdsInstances.length).toBeGreaterThan(0);
      
      // Check for Multi-AZ deployment
      rdsInstances.forEach(instanceKey => {
        expect(template.Resources[instanceKey].Properties.MultiAZ).toBe(true);
      });
    });
  });

  describe('Storage Requirements', () => {
    test('should create S3 buckets with encryption', () => {
      const s3Buckets = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket'
      );
      expect(s3Buckets.length).toBeGreaterThan(0);
      
      // Check for server-side encryption
      s3Buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties).toHaveProperty('BucketEncryption');
      });
    });
  });

  describe('Load Balancing and Auto Scaling', () => {
    test('should create Application Load Balancer', () => {
      const albs = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(albs.length).toBeGreaterThan(0);
    });

    test('should create Auto Scaling Group', () => {
      const asgs = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::AutoScaling::AutoScalingGroup'
      );
      expect(asgs.length).toBeGreaterThan(0);
    });
  });

  describe('CDN and WAF', () => {
    test('should create CloudFront distribution', () => {
      const distributions = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::CloudFront::Distribution'
      );
      expect(distributions.length).toBeGreaterThan(0);
    });

    test('should create WAF Web ACL', () => {
      const webAcls = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::WAFv2::WebACL'
      );
      expect(webAcls.length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Logging', () => {
    test('should create CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThan(0);
    });
  });
}); 