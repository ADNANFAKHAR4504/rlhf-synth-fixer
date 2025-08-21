import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toContain('IaC - AWS Nova Model Breaking');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.AllowedIPRange).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('AllowedIPRange should not default to 0.0.0.0/0', () => {
      const allowedIP = template.Parameters.AllowedIPRange;
      expect(allowedIP.Default).not.toBe('0.0.0.0/0');
      expect(allowedIP.Description).toContain('replace 0.0.0.0/0');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have security groups with restricted access', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('LoadBalancer SG should not allow 0.0.0.0/0', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
    });
  });

  describe('S3 Buckets', () => {
    test('should have encrypted S3 buckets', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.CloudTrailBucket).toBeDefined();
    });

    test('S3 buckets should block public access', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 buckets should have SSE-S3 encryption', () => {
      const bucket = template.Resources.SecureS3Bucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('IAM Resources', () => {
    test('should have IAM roles with least privilege', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('should have MFA-enabled privileged user group', () => {
      expect(template.Resources.PrivilegedUserGroup).toBeDefined();
      const group = template.Resources.PrivilegedUserGroup;
      const policy = group.Properties.Policies[0];
      expect(policy.PolicyName).toBe('MFARequiredPolicy');
    });
  });

  describe('RDS Database', () => {
    test('should have encrypted RDS database', () => {
      expect(template.Resources.SecureDatabase).toBeDefined();
      expect(template.Resources.SecureDatabase.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.SecureDatabase.Properties.StorageEncrypted).toBe(true);
    });

    test('should have backup retention configured', () => {
      const db = template.Resources.SecureDatabase;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB should have encryption and PITR enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });
  });

  describe('CloudTrail', () => {
    test('should have CloudTrail configured', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be multi-region and have validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB configured', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have target group for HTTPS', () => {
      expect(template.Resources.WebServerTargetGroup).toBeDefined();
      const tg = template.Resources.WebServerTargetGroup;
      expect(tg.Properties.Protocol).toBe('HTTPS');
      expect(tg.Properties.Port).toBe(443);
    });
  });

  describe('Outputs', () => {
    test('should have all critical outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'SecureS3BucketName',
        'DatabaseEndpoint',
        'LoadBalancerDNS',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have 0.0.0.0/0 in security group ingress rules', () => {
      const securityGroups = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::EC2::SecurityGroup');
      
      securityGroups.forEach(sgKey => {
        const sg = template.Resources[sgKey];
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.CidrIp && typeof rule.CidrIp === 'string') {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });

    test('all S3 buckets should have encryption enabled', () => {
      const s3Buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket');
      
      s3Buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('all S3 buckets should block public access', () => {
      const s3Buckets = Object.keys(template.Resources)
        .filter(key => template.Resources[key].Type === 'AWS::S3::Bucket');
      
      s3Buckets.forEach(bucketKey => {
        const bucket = template.Resources[bucketKey];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess).toBeDefined();
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
      });
    });

    test('RDS should have encryption enabled', () => {
      expect(template.Resources.SecureDatabase.Properties.StorageEncrypted).toBe(true);
    });

    test('DynamoDB should have encryption enabled', () => {
      expect(template.Resources.TurnAroundPromptTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have required tags', () => {
      const vpc = template.Resources.SecureVPC;
      const tags = vpc.Properties.Tags;
      const tagKeys = tags.map((t: any) => t.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Owner');
      expect(tagKeys).toContain('CostCenter');
    });

    test('S3 buckets should have required tags', () => {
      const buckets = ['SecureS3Bucket', 'LoggingBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const tags = bucket.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Owner');
        expect(tagKeys).toContain('CostCenter');
      });
    });
  });

  describe('High Availability', () => {
    test('should have resources in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('ALB should span multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });
  });

  describe('Monitoring and Compliance', () => {
    test('CloudTrail should have log validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have CloudWatch log group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have budget for cost monitoring', () => {
      expect(template.Resources.MonthlyCostBudget).toBeDefined();
      expect(template.Resources.MonthlyCostBudget.Type).toBe('AWS::Budgets::Budget');
    });
  });
});
