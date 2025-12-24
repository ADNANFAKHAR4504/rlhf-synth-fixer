import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Custom YAML schema that handles CloudFormation intrinsic functions
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data: string) => ({ Ref: data }),
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAtt': data.split('.') }),
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Join': data }),
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Select': data }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAZs': data || '' }),
  }),
]);

describe('CloudFormation Template Unit Tests', () => {
  let template: any;
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: CF_SCHEMA }) as any;
  });

  describe('Template Structure', () => {
    test('should have the correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a Description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toContain('Security Configuration');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toContain('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('prod');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
    });

    test('should have AllowedIpRange parameter', () => {
      expect(template.Parameters.AllowedIpRange).toBeDefined();
      expect(template.Parameters.AllowedIpRange.Type).toBe('String');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toContain('conflicts');
    });
  });

  describe('Security Resources', () => {
    test('should have KMS Key with rotation enabled', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.SecurityKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have VPC resource', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      expect(template.Resources.SecureVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.SecureVPC.Properties.CidrBlock).toBeDefined();
    });

    test('should have Security Group with restricted access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = template.Resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
      expect(Array.isArray(ingress)).toBe(true);
      
      // Check for SSH and HTTPS rules
      const sshRule = ingress.find((r: any) => r.FromPort === 22);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      
      expect(sshRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedIpRange' });
    });

    test('should have S3 bucket with encryption', () => {
      expect(template.Resources.DataLakeS3Bucket).toBeDefined();
      expect(template.Resources.DataLakeS3Bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = template.Resources.DataLakeS3Bucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBeDefined();
    });

    test('should have S3 bucket with public access blocked', () => {
      const bucket = template.Resources.DataLakeS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccess).toBeDefined();
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have IAM policy for limited S3 access', () => {
      expect(template.Resources.S3LimitedAccessPolicy).toBeDefined();
      expect(template.Resources.S3LimitedAccessPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
      
      const statement = template.Resources.S3LimitedAccessPolicy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('s3:ListBucket');
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).not.toContain('s3:PutObject');
      expect(statement.Action).not.toContain('s3:DeleteObject');
    });

    test('should have API Gateway with IP restrictions', () => {
      expect(template.Resources.APIGateway).toBeDefined();
      expect(template.Resources.APIGateway.Type).toBe('AWS::ApiGateway::RestApi');
      
      const policy = template.Resources.APIGateway.Properties.Policy;
      expect(policy).toBeDefined();
      expect(policy.Statement[0].Condition).toBeDefined();
      expect(policy.Statement[0].Condition.IpAddress).toBeDefined();
    });

    test('should have CloudWatch Log Group with retention', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(90);
    });
  });

  describe('Resource Naming', () => {
    test('should use EnvironmentSuffix in resource names', () => {
      // Check S3 bucket name
      const bucketName = template.Resources.DataLakeS3Bucket.Properties.BucketName;
      expect(JSON.stringify(bucketName)).toContain('EnvironmentSuffix');
      
      // Check VPC name tag
      const vpcTags = template.Resources.SecureVPC.Properties.Tags;
      const nameTag = vpcTags.find((t: any) => t.Key === 'Name');
      expect(JSON.stringify(nameTag.Value)).toContain('EnvironmentSuffix');
      
      // Check API Gateway name
      const apiName = template.Resources.APIGateway.Properties.Name;
      expect(JSON.stringify(apiName)).toContain('EnvironmentSuffix');
    });
  });

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'SecureVPC' });
    });

    test('should output KMS Key ID', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toEqual({ Ref: 'SecurityKMSKey' });
    });

    test('should output S3 bucket name', () => {
      expect(template.Outputs.DataLakeS3BucketName).toBeDefined();
      expect(template.Outputs.DataLakeS3BucketName.Value).toEqual({ Ref: 'DataLakeS3Bucket' });
    });

    test('should output API Gateway URL', () => {
      expect(template.Outputs.APIGatewayURL).toBeDefined();
      expect(JSON.stringify(template.Outputs.APIGatewayURL.Value)).toContain('APIGateway');
      expect(JSON.stringify(template.Outputs.APIGatewayURL.Value)).toContain('execute-api');
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded credentials', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/password\s*[:=]\s*["'][^"']+["']/i);
      expect(templateStr).not.toMatch(/secret\s*[:=]\s*["'][^"']+["']/i);
      expect(templateStr).not.toMatch(/api[_-]?key\s*[:=]\s*["'][^"']+["']/i);
    });

    test('should use secure transport protocols', () => {
      const securityGroup = template.Resources.EC2SecurityGroup;
      const ingress = securityGroup.Properties.SecurityGroupIngress;
      
      // Check that HTTPS (443) is allowed but not HTTP (80)
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeUndefined();
    });

    test('should have versioning enabled on S3 bucket', () => {
      const bucket = template.Resources.DataLakeS3Bucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle rules on S3 bucket', () => {
      const bucket = template.Resources.DataLakeS3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });
});