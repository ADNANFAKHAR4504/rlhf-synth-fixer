import fs from 'fs';
import path from 'path';

describe('IaC-AWS-Nova-Model-Breaking CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // NOTE: This test assumes you have synthesized the CloudFormation stack to a JSON file.
    // In a CDK project, you might run `cdk synth > template.json`
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Adjust to your synthesized template path
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Parameters', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a correct description', () => {
      expect(template.Description).toContain(
        'Secure multi-tier web application infrastructure'
      );
    });

    // ExistingCertificateArn parameter not supported in LocalStack (ALBListener requires ACM certificate)
    // test('should define the ExistingCertificateArn parameter correctly', () => {
    //   const param = template.Parameters.ExistingCertificateArn;
    //   expect(param).toBeDefined();
    //   expect(param.Type).toBe('String');
    // });

    test('should define the NotificationEmail parameter for alarms', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.ConstraintDescription).toContain('Must be a valid email address');
    });
  });

  describe('Networking Resources', () => {
    test('MainVPC should be defined with correct CIDR block', () => {
      const vpc = template.Resources.MainVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should define two public and four private subnets', () => {
      const resources = template.Resources;
      const subnets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      const publicSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.filter(
        (s: any) => !s.Properties.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(4);
    });
  });

  describe('Security Groups', () => {
    test('ALBSecurityGroup should allow public HTTP and HTTPS traffic', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 80 }),
          expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 443 }),
        ])
      );
    });

    test('DatabaseSecurityGroup should only allow MySQL traffic from the WebSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'WebSecurityGroup' });
    });
  });

  describe('IAM and Data Security', () => {
    test('EC2InstanceRole should grant access to Secrets Manager', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');

      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'secretsmanager:GetSecretValue'
      );
    });

    test('ApplicationDataBucket should have server-side encryption enabled', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Database and Application Components', () => {
    test('DatabaseInstance should use a supported MySQL engine and be encrypted', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.EngineVersion).toMatch(/^8\.0\.\d+/);
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    // ALBListener not supported in LocalStack (requires ACM certificate)
    // test('ALBListener should use the existing certificate from parameters', () => {
    //   const listener = template.Resources.ALBListener;
    //   const certificate = listener.Properties.Certificates[0];
    //   expect(certificate.CertificateArn).toEqual({ Ref: 'ExistingCertificateArn' });
    // });
  });

  describe('Security and Monitoring Enhancements', () => {
    test('CloudTrail trail should be multi-region and enabled', () => {
      const trail = template.Resources.MainCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailLogBucket' });
    });

    test('CloudTrailLogBucket should block all public access', () => {
      const bucket = template.Resources.CloudTrailLogBucket;
      expect(bucket).toBeDefined();
      const pubAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pubAccess.BlockPublicAcls).toBe(true);
      expect(pubAccess.BlockPublicPolicy).toBe(true);
      expect(pubAccess.IgnorePublicAcls).toBe(true);
      expect(pubAccess.RestrictPublicBuckets).toBe(true);
    });

    test('RDSCPUAlarm should monitor CPU and have a threshold of 80', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'AlarmNotificationTopic' }]);
    });

    test('MFAAdminRole should enforce MFA on assume role', () => {
      const role = template.Resources.MFAAdminRole;
      expect(role).toBeDefined();
      // Should NOT have a RoleName property (CloudFormation will generate it)
      expect(role.Properties.RoleName).toBeUndefined();
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      const condition = assumeRolePolicy.Statement[0].Condition;
      expect(condition.Bool['aws:MultiFactorAuthPresent']).toBe('true');
    });
  });
});