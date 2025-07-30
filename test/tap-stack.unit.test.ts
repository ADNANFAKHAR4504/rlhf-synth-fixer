import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Web Application Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
        'CloudFormation template to deploy a secure, high-availability web application stack.'
      );
    });
  });

  describe('Parameters', () => {
    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('webappadmin');
    });


    test('should have SSLCertificateArn parameter', () => {
      expect(template.Parameters.SSLCertificateArn).toBeDefined();
      expect(template.Parameters.SSLCertificateArn.Type).toBe('String');
      expect(template.Parameters.SSLCertificateArn.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('should have HasSSLCertificate condition', () => {
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have WebAppVPC resource', () => {
      expect(template.Resources.WebAppVPC).toBeDefined();
      expect(template.Resources.WebAppVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have separate route tables for private subnets', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      expect(ingress.find((rule: any) => rule.FromPort === 80)).toBeDefined();
      expect(ingress.find((rule: any) => rule.FromPort === 443)).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have RDS subnet group', () => {
      expect(template.Resources.RDSSubnetGroup).toBeDefined();
      expect(template.Resources.RDSSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS password secret', () => {
      expect(template.Resources.RDSPasswordSecret).toBeDefined();
      expect(template.Resources.RDSPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.RDSPasswordSecret.Properties.GenerateSecretString).toBeDefined();
    });

    test('RDS should be PostgreSQL', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('postgres');
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS should use Secrets Manager for password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword).toBeDefined();
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('{{resolve:secretsmanager:${RDSPasswordSecret}:SecretString:password}}');
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have HTTP Listener', () => {
      expect(template.Resources.HTTPListener).toBeDefined();
      expect(template.Resources.HTTPListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('should have conditional HTTPS Listener', () => {
      expect(template.Resources.HTTPSListener).toBeDefined();
      expect(template.Resources.HTTPSListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.HTTPSListener.Condition).toBe('HasSSLCertificate');
    });
  });

  describe('Auto Scaling', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Launch Template should use latest Amazon Linux 2 AMI', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });
  });

  describe('S3 and CloudFront', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudFront distribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('should have CloudFront Origin Access Identity', () => {
      expect(template.Resources.CloudFrontOAI).toBeDefined();
      expect(template.Resources.CloudFrontOAI.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('S3 bucket should have public access blocked', () => {
      const s3 = template.Resources.S3Bucket;
      const publicAccessBlock = s3.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Instance Role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('EC2 role should allow S3 access', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies[0].PolicyName).toBe('S3AccessPolicy');
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have Project tag', () => {
      const vpc = template.Resources.WebAppVPC;
      const tags = vpc.Properties.Tags;
      expect(tags.find((tag: any) => tag.Key === 'Project' && tag.Value === 'WebApp')).toBeDefined();
    });

    test('subnets should have Project tag', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const tags = publicSubnet1.Properties.Tags;
      expect(tags.find((tag: any) => tag.Key === 'Project' && tag.Value === 'WebApp')).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have WebsiteURL output', () => {
      expect(template.Outputs.WebsiteURL).toBeDefined();
      expect(template.Outputs.WebsiteURL.Description).toBe('URL for the CloudFront distribution');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // We have many resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3); // VpcCidr, DBMasterUsername, SSLCertificateArn
    });
  });
});