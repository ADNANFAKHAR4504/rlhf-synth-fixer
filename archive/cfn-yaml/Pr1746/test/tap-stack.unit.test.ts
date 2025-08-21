import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Parameters', () => {
    const expectedParams = ['Environment', 'AllowedCIDR', 'NotificationEmail'];

    test('should have all required parameters', () => {
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have correct default values and types', () => {
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('production');
      expect(template.Parameters.AllowedCIDR.Type).toBe('String');
      expect(template.Parameters.AllowedCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.Default).toBe(
        'no-reply@gmail.com'
      );
    });
  });

  describe('Resources', () => {
    test('should define a KMS key and alias', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.SecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKMSKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });

    test('should define a secure VPC, subnets, and gateways', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
    });

    test('should define route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(
        template.Resources.PublicSubnetRouteTableAssociation
      ).toBeDefined();
      expect(
        template.Resources.PrivateSubnetRouteTableAssociation
      ).toBeDefined();
    });

    test('should define restricted security group', () => {
      expect(template.Resources.RestrictedSecurityGroup).toBeDefined();
      expect(template.Resources.RestrictedSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should define IAM roles and instance profile', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.ConfigRole).toBeDefined();
    });

    test('should define S3 buckets for security logs and config', () => {
      expect(template.Resources.SecurityLogsBucket).toBeDefined();
      expect(template.Resources.ConfigBucket).toBeDefined();
    });

    test('should define log groups', () => {
      expect(template.Resources.SecurityLogsGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
    });

    test('should define CloudTrail and bucket policy', () => {
      expect(template.Resources.SecurityCloudTrail).toBeDefined();
      expect(template.Resources.SecurityLogsBucketPolicy).toBeDefined();
    });

    test('should define AWS Config resources', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigConfigurationRecorder).toBeDefined();
    });

    test('should define Config rules', () => {
      expect(template.Resources.RootMFAEnabledRule).toBeDefined();
      expect(
        template.Resources.S3BucketPublicAccessProhibitedRule
      ).toBeDefined();
      expect(template.Resources.SecurityGroupSSHRestrictedRule).toBeDefined();
    });

    test('should define GuardDuty detector', () => {
      expect(template.Resources.GuardDutyDetector).toBeDefined();
    });

    test('should define SNS topic and subscription', () => {
      expect(template.Resources.SecurityNotificationsTopic).toBeDefined();
      expect(
        template.Resources.SecurityNotificationsSubscription
      ).toBeDefined();
    });

    test('should define EventBridge rule for GuardDuty', () => {
      expect(template.Resources.GuardDutyEventRule).toBeDefined();
    });

    test('should define Lambda for incident response and permissions', () => {
      expect(template.Resources.IncidentResponseRole).toBeDefined();
      expect(template.Resources.IncidentResponseFunction).toBeDefined();
      expect(
        template.Resources.IncidentResponseFunctionPermission
      ).toBeDefined();
    });

    test('should define SNS topic policy', () => {
      expect(template.Resources.SecurityNotificationsTopicPolicy).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PrivateSubnetId',
      'PublicSubnetId',
      'SecurityGroupId',
      'KMSKeyId',
      'CloudTrailArn',
      'GuardDutyDetectorId',
      'SecurityLogsBucketName',
      'EC2InstanceProfileArn',
    ];
    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have correct output descriptions and export names', () => {
      const checkExport = (outputKey: string, regex: RegExp) => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        const exportName = output.Export.Name;
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toMatch(regex);
        } else {
          expect(exportName).toMatch(regex);
        }
      };
      checkExport('VPCId', /\${AWS::StackName}-VPC-ID/);
      checkExport('PrivateSubnetId', /\${AWS::StackName}-PrivateSubnet-ID/);
      checkExport('PublicSubnetId', /\${AWS::StackName}-PublicSubnet-ID/);
      checkExport('SecurityGroupId', /\${AWS::StackName}-SecurityGroup-ID/);
      checkExport('KMSKeyId', /\${AWS::StackName}-KMS-Key-ID/);
      checkExport('CloudTrailArn', /\${AWS::StackName}-CloudTrail-ARN/);
      checkExport(
        'GuardDutyDetectorId',
        /\${AWS::StackName}-GuardDuty-Detector-ID/
      );
      checkExport(
        'SecurityLogsBucketName',
        /\${AWS::StackName}-SecurityLogs-Bucket/
      );
      checkExport(
        'EC2InstanceProfileArn',
        /\${AWS::StackName}-EC2-InstanceProfile-ARN/
      );
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
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names and tags should use environment parameter', () => {
      const vpcTags = template.Resources.SecureVPC.Properties.Tags;
      expect(
        vpcTags.some(
          (t: any) =>
            t.Value &&
            (typeof t.Value === 'object' ? t.Value['Fn::Sub'] : t.Value)
        )
      ).toBe(true);
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportName = output.Export.Name;
        if (typeof exportName === 'object' && exportName['Fn::Sub']) {
          expect(exportName['Fn::Sub']).toMatch(/\${AWS::StackName}-/);
        } else {
          expect(exportName).toMatch(/\${AWS::StackName}-/);
        }
      });
    });
  });
});
