import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Test against the JSON version generated from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production Infrastructure - Highly Available and Secure Environment'
      );
    });
  });

  describe('Parameters', () => {
    test('should have core infrastructure parameters', () => {
      expect(template.Parameters.VPCCidr).toBeDefined();
      expect(template.Parameters.PublicSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet2Cidr).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBName).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DomainName).toBeDefined();
    });

    test('VPCCidr parameter should have correct properties', () => {
      const param = template.Parameters.VPCCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBe('CIDR block for VPC');
    });

    test('InstanceType parameter should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('should have exactly 10 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });
  });

  describe('Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have VPC and networking resources', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have security groups', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have RDS database', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('should have S3 bucket for static content', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudFront distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('should have ElastiCache cluster', () => {
      expect(template.Resources.ElastiCacheCluster).toBeDefined();
      expect(template.Resources.ElastiCacheCluster.Type).toBe('AWS::ElastiCache::CacheCluster');
    });

    test('should have SNS topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have Route53 hosted zone', () => {
      expect(template.Resources.HostedZone).toBeDefined();
      expect(template.Resources.HostedZone.Type).toBe('AWS::Route53::HostedZone');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'CloudFrontURL',
        'ALBDNSName',
        'S3BucketName',
        'RDSEndpoint',
        'ElastiCacheEndpoint',
        'SNSTopicArn',
        'HostedZoneId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDNSName should reference ALB', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('Application Load Balancer DNS name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('RDSEndpoint should reference RDS', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address']
      });
    });
  });

  describe('Security Configuration', () => {
    test('KMS key should have proper permissions', () => {
      const kmsKey = template.Resources.KMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeInstanceOf(Array);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('S3 bucket should have encryption', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('Security groups should have restrictive rules', () => {
      const webSG = template.Resources.EC2SecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSG.Properties.SecurityGroupIngress).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have substantial number of resources for production infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Complex infrastructure should have many resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Cost Optimization Features', () => {
    test('should have Auto Scaling for cost efficiency', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
    });

    test('should use cost-effective instance types by default', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
    });

    test('should use cost-effective RDS instance class by default', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Default).toBe('db.t3.micro');
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multi-AZ subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('Load Balancer should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.Subnets.length).toBeGreaterThan(1);
    });
  });
});
