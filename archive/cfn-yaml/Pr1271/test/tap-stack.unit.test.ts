import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
    });
    test('should have Parameters, Resources, and Outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });
    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
    });
    test('should have AllowedIPRange parameter', () => {
      expect(template.Parameters.AllowedIPRange).toBeDefined();
    });
    test('should have DatabaseUsername parameter', () => {
      expect(template.Parameters.DatabaseUsername).toBeDefined();
    });
  });

  describe('Security Controls', () => {
    test('should define a KMS key for EBS encryption', () => {
      expect(template.Resources.EBSEncryptionKey).toBeDefined();
      expect(template.Resources.EBSEncryptionKey.Type).toBe('AWS::KMS::Key');
    });
    test('should define a CloudTrail resource with IsLogging true', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(template.Resources.CloudTrail.Properties.IsLogging).toBe(true);
    });
    test('should define a VPC and VPC Flow Logs', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });
    test('should define a WebSecurityGroup with restrictive ingress', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      const sg = template.Resources.WebSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 443 }),
          expect.objectContaining({ FromPort: 80 })
        ])
      );
    });
    test('should define an IAM role for SSM', () => {
      expect(template.Resources.EC2SSMRole).toBeDefined();
      expect(template.Resources.EC2SSMRole.Type).toBe('AWS::IAM::Role');
    });
    test('should define a Secrets Manager secret and rotation', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DatabaseSecretRotation).toBeDefined();
      expect(template.Resources.DatabaseSecretRotation.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });
    test('should define an RDS instance with encryption and not public', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      const rds = template.Resources.RDSDatabase.Properties;
      expect(rds.StorageEncrypted).toBe(true);
      expect(rds.PubliclyAccessible).toBe(false);
    });
    test('should define a WAF WebACL', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });
    test('should define an Application Load Balancer and stickiness', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const attrs = template.Resources.ALBTargetGroup.Properties.TargetGroupAttributes;
      expect(attrs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'stickiness.enabled', Value: 'true' })
        ])
      );
    });
    test('should define a CloudFront distribution with HTTPS enforced', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      const dist = template.Resources.CloudFrontDistribution.Properties.DistributionConfig;
      expect(dist.DefaultCacheBehavior.ViewerProtocolPolicy).toMatch(/https/);
    });
    test('should define a Config rule for root user MFA', () => {
      expect(template.Resources.RootUserMFAConfigRule).toBeDefined();
      expect(template.Resources.RootUserMFAConfigRule.Type).toBe('AWS::Config::ConfigRule');
    });
    test('should define an IAM policy to restrict unencrypted AMI usage', () => {
      expect(template.Resources.EC2EncryptedAMIPolicy).toBeDefined();
      expect(template.Resources.EC2EncryptedAMIPolicy.Type).toBe('AWS::IAM::Policy');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'DatabaseEndpoint',
        'LoadBalancerDNS',
        'CloudFrontDomainName',
        'SecretArn',
        'WebACLArn',
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });
  });
});
