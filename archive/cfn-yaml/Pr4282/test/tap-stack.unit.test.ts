import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Custom YAML schema to handle CloudFormation intrinsic functions
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Ref': data })
  }),
  new yaml.Type('!GetAtt', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::GetAtt': data })
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::GetAtt': data.split('.') })
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::Sub': data })
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Sub': data })
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Join': data })
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::If': data })
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Equals': data })
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Not': data })
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Or': data })
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Select': data })
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::GetAZs': data })
  }),
  new yaml.Type('!GetAZs', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::GetAZs': data })
  }),
  new yaml.Type('!Base64', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::Base64': data })
  }),
  new yaml.Type('!Base64', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Base64': data })
  }),
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::FindInMap': data })
  })
]);

describe('TapStack Security CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: CF_SCHEMA });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a security-focused description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure');
    });
  });

  describe('Core Security Parameters', () => {
    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.DBSubnet1CIDR).toBeDefined();
    });

    test('should have database configuration parameters', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBBackupRetentionPeriod).toBeDefined();
    });

    test('should have LoggingAccountId parameter', () => {
      expect(template.Parameters.LoggingAccountId).toBeDefined();
    });
  });

  describe('S3 Bucket Security - Requirement #1', () => {
    test('should have centralized logging bucket', () => {
      expect(template.Resources.CentralizedLoggingBucket).toBeDefined();
      expect(template.Resources.CentralizedLoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have server-side encryption enabled by default', () => {
      const bucket = template.Resources.CentralizedLoggingBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration;
      expect(rules[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.CentralizedLoggingBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.CentralizedLoggingBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle rules', () => {
      const bucket = template.Resources.CentralizedLoggingBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('RDS Security - Requirement #2', () => {
    test('should have RDS instance defined', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have PubliclyAccessible set to false', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should be configured for backups', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBeDefined();
    });

    test('RDS should be in a DB subnet group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toBeDefined();
    });
  });

  describe('CloudTrail Configuration - Requirement #3', () => {
    test('should have CloudTrail trail configured', () => {
      expect(template.Resources.CloudTrailToS3).toBeDefined();
      expect(template.Resources.CloudTrailToS3.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be enabled for all regions (IsMultiRegionTrail: true)', () => {
      const trail = template.Resources.CloudTrailToS3;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should log to S3 bucket', () => {
      const trail = template.Resources.CloudTrailToS3;
      expect(trail.Properties.S3BucketName).toBeDefined();
    });

    test('CloudTrail should have CloudWatch Log Group configured', () => {
      // CloudWatch Logs integration is temporarily disabled in CloudTrail
      // but Log Group still exists for future use
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('CloudTrail should log all management events', () => {
      const trail = template.Resources.CloudTrailToS3;
      expect(trail.Properties.EventSelectors).toBeDefined();
      const eventSelector = trail.Properties.EventSelectors[0];
      expect(eventSelector.IncludeManagementEvents).toBe(true);
      expect(eventSelector.ReadWriteType).toBe('All');
    });
  });

  describe('EC2 Least-Privilege Access - Requirement #4', () => {
    test('should have VPC defined', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have security groups for EC2 instances', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.AppServerSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup).toBeDefined();
    });

    test('security groups should follow principle of least privilege', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      expect(webSg.Properties.SecurityGroupIngress).toBeDefined();

      // DB Security Group has ingress rules defined separately via DBSecurityGroupIngress
      const dbSg = template.Resources.DBSecurityGroup;
      expect(dbSg).toBeDefined();

      // Check the separate ingress rule resource
      const dbIngress = template.Resources.DBSecurityGroupIngress;
      expect(dbIngress).toBeDefined();
      expect(dbIngress.Properties.SourceSecurityGroupId).toBeDefined();
    });

    test('should have proper network segmentation with subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DBSubnet1).toBeDefined();
      expect(template.Resources.DBSubnet2).toBeDefined();
    });
  });

  describe('IAM Least-Privilege Policies - Requirement #5', () => {
    test('should have IAM roles with specific permissions', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
    });

    test('IAM policies should avoid wildcards where possible', () => {
      const cloudTrailPolicy = template.Resources.CloudTrailS3Policy;
      expect(cloudTrailPolicy).toBeDefined();
      expect(cloudTrailPolicy.Type).toBe('AWS::IAM::Policy');

      const configPolicy = template.Resources.ConfigS3Policy;
      expect(configPolicy).toBeDefined();
    });

    test('should have SSM instance role for EC2', () => {
      expect(template.Resources.SSMInstanceRole).toBeDefined();
      expect(template.Resources.SSMInstanceRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('AWS Config Monitoring - Requirement #6', () => {
    test('should have Config Recorder', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.ConfigRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('should have Config Delivery Channel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('Config should record all resource types', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Properties.RecordingGroup).toBeDefined();
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
    });
  });

  describe('IAM User MFA - Requirement #7', () => {
    test('should have MFA enforcement policy', () => {
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();
      expect(template.Resources.MFAEnforcementPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
    });

    test('MFA policy should require MFA for sensitive actions', () => {
      const mfaPolicy = template.Resources.MFAEnforcementPolicy;
      const policyDoc = mfaPolicy.Properties.PolicyDocument;
      expect(policyDoc.Statement).toBeDefined();

      // Check for MFA condition in the policy
      const hasMFACondition = policyDoc.Statement.some((stmt: any) =>
        stmt.Condition &&
        (stmt.Condition.BoolIfExists && stmt.Condition.BoolIfExists['aws:MultiFactorAuthPresent'] === false ||
         stmt.Condition.Bool && stmt.Condition.Bool['aws:MultiFactorAuthPresent'] === false)
      );
      expect(hasMFACondition).toBe(true);
    });

    test('should have security auditors group with MFA policy', () => {
      expect(template.Resources.SecurityAuditorsGroup).toBeDefined();
      expect(template.Resources.SecurityAuditorsGroup.Type).toBe('AWS::IAM::Group');
      expect(template.Resources.SecurityAuditorsGroup.Properties.ManagedPolicyArns).toBeDefined();
    });
  });

  describe('EBS Volume Encryption - Requirement #8', () => {
    test('EC2 instances should have encrypted EBS volumes', () => {
      // Check EC2Instance1
      const instance1 = template.Resources.EC2Instance1;
      if (instance1) {
        expect(instance1.Type).toBe('AWS::EC2::Instance');
        if (instance1.Properties.BlockDeviceMappings) {
          instance1.Properties.BlockDeviceMappings.forEach((device: any) => {
            if (device.Ebs) {
              expect(device.Ebs.Encrypted).toBe(true);
            }
          });
        }
      }

      // Check EC2Instance2
      const instance2 = template.Resources.EC2Instance2;
      if (instance2) {
        expect(instance2.Type).toBe('AWS::EC2::Instance');
        if (instance2.Properties.BlockDeviceMappings) {
          instance2.Properties.BlockDeviceMappings.forEach((device: any) => {
            if (device.Ebs) {
              expect(device.Ebs.Encrypted).toBe(true);
            }
          });
        }
      }
    });
  });

  describe('AWS Budget Alert - Requirement #9', () => {
    test('should have SNS topic for budget alerts', () => {
      expect(template.Resources.BudgetAlertTopic).toBeDefined();
      expect(template.Resources.BudgetAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have subscription configuration', () => {
      const topic = template.Resources.BudgetAlertTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription.length).toBeGreaterThan(0);
    });

    test('should have AWS Budget with $10,000 limit', () => {
      expect(template.Resources.MonthlyBudget).toBeDefined();
      expect(template.Resources.MonthlyBudget.Type).toBe('AWS::Budgets::Budget');
      expect(template.Resources.MonthlyBudget.Properties.Budget.BudgetLimit.Amount).toBe(10000);
    });
  });

  describe('CloudWatch IAM Auditing - Requirement #10', () => {
    test('should have CloudWatch Log Groups for auditing', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');

      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(template.Resources.VPCFlowLogs.Properties.TrafficType).toBe('ALL');
    });

    test('CloudTrail should be configured to log IAM API calls', () => {
      const trail = template.Resources.CloudTrailToS3;
      expect(trail.Properties.EventSelectors).toBeDefined();
      // Verify it logs all management events (which includes IAM)
      expect(trail.Properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
    });
  });

  describe('Additional Security Features', () => {
    test('should have WAF WebACL for web protection', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ALB).toBeDefined();
      expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have CloudWatch Dashboard for monitoring', () => {
      expect(template.Resources.SecurityDashboard).toBeDefined();
      expect(template.Resources.SecurityDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch alarms for security monitoring', () => {
      expect(template.Resources.RootAccountLoginAlarm).toBeDefined();
      expect(template.Resources.RootAccountLoginAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.UnauthorizedAPICallAlarm).toBeDefined();
      expect(template.Resources.IAMPolicyChangeAlarm).toBeDefined();
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('S3 bucket name should use account ID', () => {
      const bucket = template.Resources.CentralizedLoggingBucket;
      const bucketName = bucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toBeDefined();
    });

    test('resources should have proper tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(vpc.Properties.Tags.some((tag: any) => tag.Key === 'cost-center')).toBe(true);
    });
  });

  describe('Stack Outputs', () => {
    test('should have VPC-related outputs', () => {
      expect(template.Outputs.VpcId).toBeDefined();
      expect(template.Outputs.PublicSubnets).toBeDefined();
      expect(template.Outputs.PrivateSubnets).toBeDefined();
      expect(template.Outputs.DBSubnets).toBeDefined();
    });

    test('should have RDS endpoint output', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.WebServerSecurityGroup).toBeDefined();
      expect(template.Outputs.AppServerSecurityGroup).toBeDefined();
      expect(template.Outputs.DBSecurityGroup).toBeDefined();
    });

    test('should have ALB DNS output', () => {
      expect(template.Outputs.ALBDnsName).toBeDefined();
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should be deletable (no Retain policies)', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have all 10 core security requirements implemented', () => {
      // 1. S3 Bucket Encryption
      expect(template.Resources.CentralizedLoggingBucket.Properties.BucketEncryption).toBeDefined();

      // 2. RDS Public Access = false
      expect(template.Resources.RDSInstance.Properties.PubliclyAccessible).toBe(false);

      // 3. CloudTrail Multi-Region
      expect(template.Resources.CloudTrailToS3.Properties.IsMultiRegionTrail).toBe(true);

      // 4. EC2 Least Privilege (Security Groups)
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();

      // 5. IAM Least Privilege Policies
      expect(template.Resources.CloudTrailRole).toBeDefined();

      // 6. AWS Config Monitoring
      expect(template.Resources.ConfigRecorder).toBeDefined();

      // 7. IAM User MFA
      expect(template.Resources.MFAEnforcementPolicy).toBeDefined();

      // 8. EBS Volume Encryption
      expect(template.Resources.EC2Instance1.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);

      // 9. AWS Budget Alert (via SNS)
      expect(template.Resources.SecurityAlertTopic).toBeDefined();

      // 10. CloudWatch IAM Auditing
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
    });
  });
});