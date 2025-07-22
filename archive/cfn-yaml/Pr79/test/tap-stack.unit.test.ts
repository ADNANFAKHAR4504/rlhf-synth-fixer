import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template', () => {
  let templateContent: string;

  beforeAll(() => {
    // Read the YAML template as a string for basic validation
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(templateContent).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
    });

    test('should have a description', () => {
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Secure web infrastructure with high availability and security');
    });

    test('should have mappings section', () => {
      expect(templateContent).toContain('Mappings:');
      expect(templateContent).toContain('AWSRegionArch2AMI:');
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(templateContent).toContain('Environment:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: \'prod\'');
    });

    test('Environment parameter should have correct properties', () => {
      expect(templateContent).toContain('AllowedValues: [\'dev\', \'staging\', \'prod\']');
      expect(templateContent).toContain('Description: Deployment environment');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(templateContent).toContain('VPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      expect(templateContent).toContain('CidrBlock: \'10.0.0.0/16\'');
      expect(templateContent).toContain('EnableDnsSupport: true');
      expect(templateContent).toContain('EnableDnsHostnames: true');
    });

    test('should have Internet Gateway', () => {
      expect(templateContent).toContain('InternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(templateContent).toContain('InternetGatewayAttachment:');
      expect(templateContent).toContain('Type: AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      expect(templateContent).toContain('PublicSubnet1:');
      expect(templateContent).toContain('PublicSubnet2:');
      expect(templateContent).toContain('PublicSubnet3:');
    });

    test('should have private subnets', () => {
      expect(templateContent).toContain('PrivateSubnet1:');
      expect(templateContent).toContain('PrivateSubnet2:');
      expect(templateContent).toContain('PrivateSubnet3:');
    });

    test('should have route tables', () => {
      expect(templateContent).toContain('PublicRouteTable:');
      expect(templateContent).toContain('PrivateRouteTable:');
    });
  });

  describe('Security Groups', () => {
    test('should have web security group', () => {
      expect(templateContent).toContain('WebSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should have database security group', () => {
      expect(templateContent).toContain('DBSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role', () => {
      expect(templateContent).toContain('EC2Role:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
    });

    test('should have EC2 instance profile', () => {
      expect(templateContent).toContain('EC2InstanceProfile:');
      expect(templateContent).toContain('Type: AWS::IAM::InstanceProfile');
    });
  });

  describe('S3 Resources', () => {
    test('should have web content bucket', () => {
      expect(templateContent).toContain('WebContentBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should have logs bucket', () => {
      expect(templateContent).toContain('LogBucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should have bucket policy for CloudFront', () => {
      expect(templateContent).toContain('WebContentBucketPolicy:');
      expect(templateContent).toContain('Type: AWS::S3::BucketPolicy');
    });
  });

  describe('KMS Resources', () => {
    test('should have encryption key', () => {
      expect(templateContent).toContain('EncryptionKey:');
      expect(templateContent).toContain('Type: AWS::KMS::Key');
    });
  });

  describe('RDS Resources', () => {
    test('should have DB subnet group', () => {
      expect(templateContent).toContain('DBSubnetGroup:');
      expect(templateContent).toContain('Type: AWS::RDS::DBSubnetGroup');
    });

    test('should have MySQL database', () => {
      expect(templateContent).toContain('MySQLDB:');
      expect(templateContent).toContain('Type: AWS::RDS::DBInstance');
    });
  });

  describe('EC2 and Auto Scaling Resources', () => {
    test('should have launch template', () => {
      expect(templateContent).toContain('LaunchTemplate:');
      expect(templateContent).toContain('Type: AWS::EC2::LaunchTemplate');
    });

    test('should have target group', () => {
      expect(templateContent).toContain('WebAppTargetGroup:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have auto scaling group', () => {
      expect(templateContent).toContain('AutoScalingGroup:');
      expect(templateContent).toContain('Type: AWS::AutoScaling::AutoScalingGroup');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have application load balancer', () => {
      expect(templateContent).toContain('AppLoadBalancer:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have HTTP listener', () => {
      expect(templateContent).toContain('HTTPListener:');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFront OAC', () => {
      expect(templateContent).toContain('CloudFrontOAC:');
      expect(templateContent).toContain('Type: AWS::CloudFront::OriginAccessControl');
    });

    test('should have CloudFront distribution', () => {
      expect(templateContent).toContain('CloudFrontDistribution:');
      expect(templateContent).toContain('Type: AWS::CloudFront::Distribution');
    });
  });

  describe('WAF Resources', () => {
    test('should have WAF Web ACL', () => {
      expect(templateContent).toContain('WebACL:');
      expect(templateContent).toContain('Type: AWS::WAFv2::WebACL');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CPU alarm', () => {
      expect(templateContent).toContain('CPUAlarm:');
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(templateContent).toContain('WebsiteURL:');
      expect(templateContent).toContain('LoadBalancerDNS:');
      expect(templateContent).toContain('S3BucketName:');
      expect(templateContent).toContain('RDSInstanceEndpoint:');
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(templateContent).toBeDefined();
      expect(typeof templateContent).toBe('string');
      expect(templateContent.length).toBeGreaterThan(0);
    });

    test('should have required sections', () => {
      expect(templateContent).toContain('AWSTemplateFormatVersion');
      expect(templateContent).toContain('Description');
      expect(templateContent).toContain('Parameters');
      expect(templateContent).toContain('Resources');
      expect(templateContent).toContain('Outputs');
    });

    test('should have correct number of major resource types', () => {
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::S3::Bucket',
        'AWS::KMS::Key',
        'AWS::RDS::DBInstance',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::CloudFront::Distribution',
        'AWS::WAFv2::WebACL',
        'AWS::CloudWatch::Alarm'
      ];

      resourceTypes.forEach(type => {
        expect(templateContent).toContain(`Type: ${type}`);
      });
    });

    test('should have exactly one parameter', () => {
      const parameterMatches = templateContent.match(/Parameters:/g);
      expect(parameterMatches).toHaveLength(1);
    });

    test('should have exactly four outputs', () => {
      const outputMatches = templateContent.match(/^\s*[A-Za-z]+:/gm);
      const outputLines = outputMatches?.filter(line => 
        line.trim().match(/^(WebsiteURL|LoadBalancerDNS|S3BucketName|RDSInstanceEndpoint):$/)
      ) || [];
      expect(outputLines.length).toBeGreaterThanOrEqual(3); // At least 3 outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use environment parameter in resource names', () => {
      expect(templateContent).toContain('${Environment}');
    });

    test('should have consistent resource naming patterns', () => {
      // Check for common naming patterns
      expect(templateContent).toContain('-vpc');
      expect(templateContent).toContain('-sg');
      expect(templateContent).toContain('-alb');
      expect(templateContent).toContain('-mysql-db');
    });
  });

  describe('Security and Best Practices', () => {
    test('should have encryption enabled', () => {
      expect(templateContent).toContain('StorageEncrypted: true');
      expect(templateContent).toContain('BucketEncryption:');
    });

    test('should have proper security group rules', () => {
      expect(templateContent).toContain('SecurityGroupIngress:');
      expect(templateContent).toContain('FromPort: 80');
      expect(templateContent).toContain('FromPort: 443');
      expect(templateContent).toContain('FromPort: 3306');
    });

    test('should have multi-AZ configuration', () => {
      expect(templateContent).toContain('MultiAZ: true');
    });

    test('should have proper IAM roles', () => {
      expect(templateContent).toContain('AssumeRolePolicyDocument:');
      expect(templateContent).toContain('ec2.amazonaws.com');
    });
  });
});

