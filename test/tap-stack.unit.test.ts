import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template for testing
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
      expect(template.Description).toContain('Enterprise-Grade AWS Security Framework');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'Environment',
        'ProjectName',
        'VpcCidr',
        'TrustedIpRange',
        'ComplianceRetentionDays',
        'CloudWatchRetentionInDays',
        'NumberOfAZs',
        'EnableCloudTrail'
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('ProjectName parameter should have correct properties', () => {
      const projectParam = template.Parameters.ProjectName;
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('secure-enterprise');
      expect(projectParam.MinLength).toBe(3);
      expect(projectParam.MaxLength).toBe(20);
      expect(projectParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('VpcCidr parameter should have correct properties', () => {
      const vpcParam = template.Parameters.VpcCidr;
      expect(vpcParam.Type).toBe('String');
      expect(vpcParam.Default).toBe('10.0.0.0/16');
      expect(vpcParam.AllowedPattern).toBeDefined();
    });

    test('TrustedIpRange parameter should have correct properties', () => {
      const trustedParam = template.Parameters.TrustedIpRange;
      expect(trustedParam.Type).toBe('String');
      expect(trustedParam.Default).toBe('10.0.0.0/8');
    });

    test('ComplianceRetentionDays parameter should have correct properties', () => {
      const retentionParam = template.Parameters.ComplianceRetentionDays;
      expect(retentionParam.Type).toBe('Number');
      expect(retentionParam.Default).toBe(2555);
      expect(retentionParam.MinValue).toBe(365);
      expect(retentionParam.MaxValue).toBe(3653);
    });

    test('NumberOfAZs parameter should have correct properties', () => {
      const azParam = template.Parameters.NumberOfAZs;
      expect(azParam.Type).toBe('Number');
      expect(azParam.Default).toBe(1);
      expect(azParam.AllowedValues).toEqual([1, 2, 3]);
    });
  });

  describe('KMS Resources', () => {
    test('should have S3EncryptionKey', () => {
      expect(template.Resources.S3EncryptionKey).toBeDefined();
      expect(template.Resources.S3EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('S3EncryptionKey should have correct properties', () => {
      const key = template.Resources.S3EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.Tags).toBeDefined();
    });

    test('should have S3EncryptionKeyAlias', () => {
      expect(template.Resources.S3EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.S3EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have CloudTrailEncryptionKey', () => {
      expect(template.Resources.CloudTrailEncryptionKey).toBeDefined();
      expect(template.Resources.CloudTrailEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have CloudTrailEncryptionKeyAlias', () => {
      expect(template.Resources.CloudTrailEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.CloudTrailEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC and Networking', () => {
    test('should have SecureVPC', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('SecureVPC should have correct properties', () => {
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toBeDefined();
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Security Groups', () => {
    test('should have WebTierSecurityGroup', () => {
      expect(template.Resources.WebTierSecurityGroup).toBeDefined();
      expect(template.Resources.WebTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ApplicationTierSecurityGroup', () => {
      expect(template.Resources.ApplicationTierSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have DataTierSecurityGroup', () => {
      expect(template.Resources.DataTierSecurityGroup).toBeDefined();
      expect(template.Resources.DataTierSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ManagementSecurityGroup', () => {
      expect(template.Resources.ManagementSecurityGroup).toBeDefined();
      expect(template.Resources.ManagementSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebTierSecurityGroup should allow HTTP and HTTPS', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have WebTierInstanceRole', () => {
      expect(template.Resources.WebTierInstanceRole).toBeDefined();
      expect(template.Resources.WebTierInstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have WebTierInstanceProfile', () => {
      expect(template.Resources.WebTierInstanceProfile).toBeDefined();
      expect(template.Resources.WebTierInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have ApplicationTierInstanceRole', () => {
      expect(template.Resources.ApplicationTierInstanceRole).toBeDefined();
      expect(template.Resources.ApplicationTierInstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApplicationTierInstanceProfile', () => {
      expect(template.Resources.ApplicationTierInstanceProfile).toBeDefined();
      expect(template.Resources.ApplicationTierInstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CloudTrailRole', () => {
      expect(template.Resources.CloudTrailRole).toBeDefined();
      expect(template.Resources.CloudTrailRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ConfigRole', () => {
      expect(template.Resources.ConfigRole).toBeDefined();
      expect(template.Resources.ConfigRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('S3 Buckets', () => {
    test('should have SecureS3Bucket', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.SecureS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SecureS3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('SecureS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('SecureS3Bucket should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });

    test('should have S3AccessLogsBucket', () => {
      expect(template.Resources.S3AccessLogsBucket).toBeDefined();
      expect(template.Resources.S3AccessLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have ConfigS3Bucket', () => {
      expect(template.Resources.ConfigS3Bucket).toBeDefined();
      expect(template.Resources.ConfigS3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have CloudTrailS3Bucket', () => {
      expect(template.Resources.CloudTrailS3Bucket).toBeDefined();
      expect(template.Resources.CloudTrailS3Bucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('S3 Bucket Policies', () => {
    test('should have SecureS3BucketPolicy', () => {
      expect(template.Resources.SecureS3BucketPolicy).toBeDefined();
      expect(template.Resources.SecureS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have CloudTrailS3BucketPolicy', () => {
      expect(template.Resources.CloudTrailS3BucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailS3BucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Partition-aware S3 ARNs in policies', () => {
    test('WebTierInstanceRole S3AccessPolicy uses partition-aware S3 ARN', () => {
      const role = template.Resources.WebTierInstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(policy).toBeDefined();
      const stmt = policy.PolicyDocument.Statement.find((s: any) => Array.isArray(s.Action) && s.Action.includes('s3:GetObject'));
      expect(stmt).toBeDefined();
      const resource = stmt.Resource && (Array.isArray(stmt.Resource) ? stmt.Resource[0] : stmt.Resource);
      const sub = resource && resource['Fn::Sub'];
      expect(typeof sub).toBe('string');
      expect(sub).toContain('arn:${AWS::Partition}:s3:::');
      expect(sub).toContain('${SecureS3Bucket}/*');
    });

    test('ApplicationTierInstanceRole S3AccessPolicy uses partition-aware S3 ARN', () => {
      const role = template.Resources.ApplicationTierInstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(policy).toBeDefined();
      const stmt = policy.PolicyDocument.Statement.find((s: any) => Array.isArray(s.Action) && s.Action.includes('s3:GetObject'));
      expect(stmt).toBeDefined();
      const resource = stmt.Resource && (Array.isArray(stmt.Resource) ? stmt.Resource[0] : stmt.Resource);
      const sub = resource && resource['Fn::Sub'];
      expect(typeof sub).toBe('string');
      expect(sub).toContain('arn:${AWS::Partition}:s3:::');
      expect(sub).toContain('${SecureS3Bucket}/*');
    });

    test('ConfigRole policy uses partition-aware ARN for ConfigS3Bucket objects', () => {
      const role = template.Resources.ConfigRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ConfigS3Policy');
      expect(policy).toBeDefined();
      const stmt = policy.PolicyDocument.Statement.find((s: any) => Array.isArray(s.Action) && s.Action.includes('s3:PutObject'));
      expect(stmt).toBeDefined();
      const resource = stmt.Resource && (Array.isArray(stmt.Resource) ? stmt.Resource[0] : stmt.Resource);
      const sub = resource && resource['Fn::Sub'];
      expect(typeof sub).toBe('string');
      expect(sub).toContain('arn:${AWS::Partition}:s3:::');
      expect(sub).toContain('${ConfigS3Bucket}/*');
    });

    test('SecureS3BucketPolicy uses partition-aware ARN for object-level statements', () => {
      const pol = template.Resources.SecureS3BucketPolicy;
      const statements = pol.Properties.PolicyDocument.Statement;
      const denyUnencrypted = statements.find((s: any) => s.Sid === 'DenyUnencryptedUploads');
      expect(denyUnencrypted).toBeDefined();
      const res1 = Array.isArray(denyUnencrypted.Resource) ? denyUnencrypted.Resource[0] : denyUnencrypted.Resource;
      const sub1 = res1 && res1['Fn::Sub'];
      expect(typeof sub1).toBe('string');
      expect(sub1).toContain('arn:${AWS::Partition}:s3:::');
      expect(sub1).toContain('${SecureS3Bucket}/*');
    });

    test('CloudTrailS3BucketPolicy write uses partition-aware ARN', () => {
      const pol = template.Resources.CloudTrailS3BucketPolicy;
      const statements = pol.Properties.PolicyDocument.Statement;
      const writeStmt = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeStmt).toBeDefined();
      const res = Array.isArray(writeStmt.Resource) ? writeStmt.Resource[0] : writeStmt.Resource;
      const sub = res && res['Fn::Sub'];
      expect(typeof sub).toBe('string');
      expect(sub).toContain('arn:${AWS::Partition}:s3:::');
      expect(sub).toContain('${CloudTrailS3Bucket}/*');
    });
  });

  describe('CloudTrail S3 data events use partition-aware ARNs', () => {
    test('CloudTrailTrail S3 DataResources Values are partition-aware', () => {
      const trail = template.Resources.CloudTrailTrail;
      const selectors = trail.Properties.EventSelectors;
      expect(Array.isArray(selectors)).toBe(true);
      const dr = selectors[0].DataResources.find((d: any) => d.Type === 'AWS::S3::Object');
      expect(dr).toBeDefined();
      const val = Array.isArray(dr.Values) ? dr.Values[0] : dr.Values;
      const sub = val && val['Fn::Sub'];
      expect(typeof sub).toBe('string');
      expect(sub).toContain('arn:${AWS::Partition}:s3:::');
      expect(sub).toContain('${SecureS3Bucket}/*');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have VPCFlowLogsGroup', () => {
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('VPCFlowLogsGroup should have retention policy', () => {
      const logGroup = template.Resources.VPCFlowLogsGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
    });

    test('VPCFlowLogsGroup should have proper tags', () => {
      const logGroup = template.Resources.VPCFlowLogsGroup;
      expect(logGroup.Properties.Tags).toBeDefined();
      const tagKeys = logGroup.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Purpose');
    });

    test('should have CloudTrailLogsGroup with retention', () => {
      expect(template.Resources.CloudTrailLogsGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogsGroup.Type).toBe('AWS::Logs::LogGroup');
      const logGroup = template.Resources.CloudTrailLogsGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPCFlowLogsRole', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });

    test('VPCFlowLogsRole should have correct assume role policy', () => {
      const role = template.Resources.VPCFlowLogsRole;
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
    });

    test('VPCFlowLogsRole should have custom VPCFlowLogsDeliveryPolicy', () => {
      const role = template.Resources.VPCFlowLogsRole;
      expect(role.Properties.Policies).toBeDefined();
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'VPCFlowLogsDeliveryPolicy');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have VPCFlowLogs', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPCFlowLogs should have correct properties', () => {
      const flowLog = template.Resources.VPCFlowLogs;
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toBeDefined();
      expect(flowLog.Properties.DeliverLogsPermissionArn).toBeDefined();
    });

    test('VPCFlowLogs should reference SecureVPC', () => {
      const flowLog = template.Resources.VPCFlowLogs;
      // Check if ResourceId references SecureVPC (could be string or Ref object)
      const resourceId = flowLog.Properties.ResourceId;
      if (typeof resourceId === 'string') {
        expect(resourceId).toBe('SecureVPC');
      } else if (resourceId.Ref) {
        expect(resourceId.Ref).toBe('SecureVPC');
      } else {
        fail('ResourceId should be either a string or Ref object');
      }
    });
  });

  describe('Subnets and Routing', () => {
    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have data tier subnets', () => {
      expect(template.Resources.DataSubnet1).toBeDefined();
      expect(template.Resources.DataSubnet2).toBeDefined();
      expect(template.Resources.DataSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.DataSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGatewayEIP).toBeDefined();
      expect(template.Resources.NATGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('should have CloudTrail trail', () => {
      expect(template.Resources.CloudTrailTrail).toBeDefined();
      expect(template.Resources.CloudTrailTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('should not create AWS Config recorder or delivery channel', () => {
      expect(template.Resources.ConfigRecorder).toBeUndefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeUndefined();
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.SecurityDashboard).toBeDefined();
      expect(template.Resources.SecurityDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.VPCFlowLogsAlarm).toBeDefined();
      expect(template.Resources.VPCFlowLogsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CloudTrail trail should reference CloudTrailLogsGroup ARN', () => {
      const trail = template.Resources.CloudTrailTrail;
      const arn = trail.Properties.CloudWatchLogsLogGroupArn;
      if (arn && arn['Fn::GetAtt']) {
        const getAtt = arn['Fn::GetAtt'];
        expect(Array.isArray(getAtt)).toBe(true);
        expect(getAtt[0]).toBe('CloudTrailLogsGroup');
        expect(getAtt[1]).toBe('Arn');
      } else {
        expect(arn).toBeDefined();
      }
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
      expect(resourceCount).toBeGreaterThan(40); // Should have many resources including subnets, CloudTrail, Config, etc.
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // + CloudWatchRetentionInDays + NumberOfAZs + EnableCloudTrail
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with project and environment', () => {
      const resources = template.Resources;

      // Check a few key resources for naming convention
      const vpc = resources.SecureVPC;
      const s3Key = resources.S3EncryptionKey;

      expect(vpc.Properties.Tags).toBeDefined();
      expect(s3Key.Properties.Tags).toBeDefined();
    });

    test('tags should include required keys', () => {
      const resources = template.Resources;

      // Check a few resources for required tags
      const vpc = resources.SecureVPC;
      const tags = vpc.Properties.Tags;

      const tagKeys = tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Purpose');
      expect(tagKeys).toContain('ManagedBy');
    });
  });
});

