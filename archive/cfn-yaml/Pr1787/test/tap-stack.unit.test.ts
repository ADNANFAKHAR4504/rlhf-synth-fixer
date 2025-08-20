import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Security Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive security description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Security Infrastructure');
      expect(template.Description).toContain('KMS');
      expect(template.Description).toContain('VPC');
      expect(template.Description).toContain('CloudTrail');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.TrustedAccountId).toBeDefined();
      expect(template.Parameters.AdminIPRange).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('TrustedAccountId parameter should validate AWS account format', () => {
      const trustedAccParam = template.Parameters.TrustedAccountId;
      expect(trustedAccParam.Type).toBe('String');
      expect(trustedAccParam.AllowedPattern).toBe('^[0-9]{12}$');
      expect(trustedAccParam.Default).toBeDefined();
    });

    test('AdminIPRange parameter should validate CIDR format', () => {
      const ipRangeParam = template.Parameters.AdminIPRange;
      expect(ipRangeParam.Type).toBe('String');
      expect(ipRangeParam.Default).toBe('10.0.0.0/16');
      expect(ipRangeParam.AllowedPattern).toContain('[0-9]');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper deletion policies', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      expect(kmsKey.DeletionPolicy).toBe('Delete');
      expect(kmsKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('KMS key should have key rotation enabled', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy for services', () => {
      const kmsKey = template.Resources.SecurityKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      
      // Check for root account access
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      
      // Check for CloudTrail access
      const cloudTrailStatement = statements.find((s: any) => s.Sid === 'Allow CloudTrail to encrypt logs');
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      
      // Check for Config access
      const configStatement = statements.find((s: any) => s.Sid === 'Allow Config to encrypt data');
      expect(configStatement).toBeDefined();
      expect(configStatement.Principal.Service).toBe('config.amazonaws.com');

      // Check for CloudWatch Logs access
      const logsStatement = statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs to encrypt logs');
      expect(logsStatement).toBeDefined();
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.SecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with proper configuration', () => {
      expect(template.Resources.SecurityVPC).toBeDefined();
      expect(template.Resources.SecurityVPC.Type).toBe('AWS::EC2::VPC');
      
      const vpcProps = template.Resources.SecurityVPC.Properties;
      expect(vpcProps.CidrBlock).toBe('10.0.0.0/16');
      expect(vpcProps.EnableDnsHostnames).toBe(true);
      expect(vpcProps.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet).toBeDefined();
      expect(template.Resources.PublicSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      
      expect(template.Resources.PrivateSubnet).toBeDefined();
      expect(template.Resources.PrivateSubnet.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have Internet Gateway and proper attachments', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have web security group with restricted access', () => {
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      expect(template.Resources.WebSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should restrict SSH, HTTP, and HTTPS access', () => {
      const sgIngress = template.Resources.WebSecurityGroup.Properties.SecurityGroupIngress;
      
      // Check SSH rule
      const sshRule = sgIngress.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      
      // Check HTTP rule
      const httpRule = sgIngress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      
      // Check HTTPS rule
      const httpsRule = sgIngress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Logs configured', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });

    test('VPC Flow Logs should monitor all traffic', () => {
      const flowLogsProps = template.Resources.VPCFlowLogs.Properties;
      expect(flowLogsProps.TrafficType).toBe('ALL');
      expect(flowLogsProps.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should have IAM role for VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CloudWatch Log Group for VPC Flow Logs', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.VPCFlowLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('S3 Bucket for Logs', () => {
    test('should have S3 bucket for security logs', () => {
      expect(template.Resources.SecurityLogsBucket).toBeDefined();
      expect(template.Resources.SecurityLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucketProps = template.Resources.SecurityLogsBucket.Properties;
      expect(bucketProps.BucketEncryption).toBeDefined();
      expect(bucketProps.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 bucket should block public access', () => {
      const publicAccess = template.Resources.SecurityLogsBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucketProps = template.Resources.SecurityLogsBucket.Properties;
      expect(bucketProps.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 bucket policy for CloudTrail and Config', () => {
      expect(template.Resources.SecurityLogsBucketPolicy).toBeDefined();
      expect(template.Resources.SecurityLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('IAM Roles', () => {
    test('should have trusted service role with strict assume policy', () => {
      expect(template.Resources.TrustedServiceRole).toBeDefined();
      expect(template.Resources.TrustedServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('trusted service role should have multiple trust relationships', () => {
      const assumePolicy = template.Resources.TrustedServiceRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement).toHaveLength(2);
      
      // Check for trusted account access
      const accountTrust = assumePolicy.Statement.find((s: any) => 
        s.Principal.AWS && typeof s.Principal.AWS === 'object'
      );
      expect(accountTrust).toBeDefined();
      expect(accountTrust.Condition).toBeDefined();
      
      // Check for service trust
      const serviceTrust = assumePolicy.Statement.find((s: any) => 
        s.Principal.Service
      );
      expect(serviceTrust).toBeDefined();
      expect(serviceTrust.Principal.Service).toContain('ec2.amazonaws.com');
      expect(serviceTrust.Principal.Service).toContain('lambda.amazonaws.com');
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail configured', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should have comprehensive audit settings', () => {
      const trailProps = template.Resources.CloudTrail.Properties;
      expect(trailProps.IsLogging).toBe(true);
      expect(trailProps.IsMultiRegionTrail).toBe(true);
      expect(trailProps.EnableLogFileValidation).toBe(true);
      expect(trailProps.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should use KMS encryption', () => {
      const trailProps = template.Resources.CloudTrail.Properties;
      expect(trailProps.KMSKeyId).toBeDefined();
    });

    test('CloudTrail should have event selectors for S3', () => {
      const trailProps = template.Resources.CloudTrail.Properties;
      expect(trailProps.EventSelectors).toBeDefined();
      expect(trailProps.EventSelectors[0].ReadWriteType).toBe('All');
      expect(trailProps.EventSelectors[0].IncludeManagementEvents).toBe(true);
    });
  });

  describe('AWS Config', () => {
    test('should have Config service role', () => {
      expect(template.Resources.ConfigServiceRole).toBeDefined();
      expect(template.Resources.ConfigServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Config delivery channel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel.Type).toBe('AWS::Config::DeliveryChannel');
    });

    test('should have Config recorder', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.ConfigurationRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
    });

    test('Config recorder should record all resources', () => {
      const recorderProps = template.Resources.ConfigurationRecorder.Properties;
      expect(recorderProps.RecordingGroup.AllSupported).toBe(true);
      expect(recorderProps.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have Config rules for security best practices', () => {
      expect(template.Resources.S3BucketPublicReadProhibitedRule).toBeDefined();
      expect(template.Resources.S3BucketPublicWriteProhibitedRule).toBeDefined();
      expect(template.Resources.SecurityGroupSSHRestrictedRule).toBeDefined();
      expect(template.Resources.CloudTrailEnabledRule).toBeDefined();
    });
  });

  describe('Security Hub', () => {
    test('should have Security Hub configured', () => {
      expect(template.Resources.SecurityHub).toBeDefined();
      expect(template.Resources.SecurityHub.Type).toBe('AWS::SecurityHub::Hub');
    });

    test('Security Hub should have proper tags', () => {
      const hubProps = template.Resources.SecurityHub.Properties;
      expect(hubProps.Tags).toBeDefined();
      expect(hubProps.Tags.Name).toBeDefined();
      expect(hubProps.Tags.Environment).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all critical outputs defined', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.SecurityKMSKeyId).toBeDefined();
      expect(template.Outputs.SecurityKMSKeyArn).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnetId).toBeDefined();
      expect(template.Outputs.PrivateSubnetId).toBeDefined();
      expect(template.Outputs.WebSecurityGroupId).toBeDefined();
      expect(template.Outputs.SecurityLogsBucketName).toBeDefined();
      expect(template.Outputs.CloudTrailArn).toBeDefined();
      expect(template.Outputs.TrustedServiceRoleArn).toBeDefined();
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      const resources = Object.keys(template.Resources);
      
      resources.forEach((resourceKey) => {
        const resource = template.Resources[resourceKey];
        
        // Check if resource has Name tag
        if (resource.Properties && resource.Properties.Tags) {
          const tags = Array.isArray(resource.Properties.Tags) 
            ? resource.Properties.Tags 
            : Object.entries(resource.Properties.Tags).map(([k, v]) => ({Key: k, Value: v}));
          
          const nameTag = tags.find((t: any) => t.Key === 'Name' || t.Name);
          if (nameTag) {
            const nameValue = nameTag.Value || nameTag.Name;
            if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
              expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
            }
          }
        }
      });
    });
  });

  describe('Security Requirements Validation', () => {
    test('should meet requirement 1: IAM roles with strict assume policies', () => {
      const iamRoles = Object.values(template.Resources).filter((r: any) => r.Type === 'AWS::IAM::Role');
      expect(iamRoles.length).toBeGreaterThan(0);
      
      iamRoles.forEach((role: any) => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
      });
    });

    test('should meet requirement 2: Customer-managed KMS keys', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should meet requirement 3: VPC with Flow Logs', () => {
      expect(template.Resources.SecurityVPC).toBeDefined();
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Properties.TrafficType).toBe('ALL');
    });

    test('should meet requirement 4: Restricted Security Groups', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg).toBeDefined();
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      ingressRules.forEach((rule: any) => {
        expect([22, 80, 443]).toContain(rule.FromPort);
        expect(rule.CidrIp).toBeDefined();
      });
    });

    test('should meet requirement 5: AWS Config for compliance', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
      
      // Check for Config rules
      const configRules = Object.keys(template.Resources).filter(k => k.includes('Rule'));
      expect(configRules.length).toBeGreaterThan(0);
    });

    test('should meet requirement 6: CloudTrail for audit logging', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Properties.S3BucketName).toBeDefined();
      expect(template.Resources.CloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should meet requirement 7: S3 buckets with encryption', () => {
      const s3Buckets = Object.values(template.Resources).filter((r: any) => r.Type === 'AWS::S3::Bucket');
      
      s3Buckets.forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all stateful resources should have Delete policy for testing', () => {
      const statefulResourceTypes = [
        'AWS::S3::Bucket',
        'AWS::KMS::Key',
        'AWS::EC2::VPC',
        'AWS::CloudTrail::Trail',
        'AWS::SecurityHub::Hub'
      ];

      Object.entries(template.Resources).forEach(([key, resource]: [string, any]) => {
        if (statefulResourceTypes.includes(resource.Type)) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });
});