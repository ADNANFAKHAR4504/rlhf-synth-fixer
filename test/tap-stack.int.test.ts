import fs from 'fs';
import yaml from 'js-yaml';

// Use the same custom schema as your unit tests
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Join', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!FindInMap', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!ImportValue', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Split', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Base64', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Condition', { kind: 'scalar', construct: (data) => data }),
]);

const template = yaml.load(fs.readFileSync('lib/TapStack.yml', 'utf8'), { schema: CF_SCHEMA }) as any;

describe('TapStack CloudFormation Integration Tests', () => {
  it('should configure S3 bucket with KMS encryption and logging', () => {
    const s3 = template.Resources.SecureS3Bucket;
    expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(s3.Properties.LoggingConfiguration).toBeDefined();
    expect(s3.Properties.LoggingConfiguration.DestinationBucketName).toBeDefined();
  });

  it('should configure CloudTrail to use the log bucket', () => {
    const trail = template.Resources.CloudTrail;
    expect(trail).toBeDefined();
    expect(trail.Properties.S3BucketName).toBeDefined();
    expect(trail.Properties.IsLogging).toBe(true);
  });

  it('should configure RDS with Multi-AZ and encrypted storage', () => {
    const rds = template.Resources.RDSInstance;
    expect(rds.Properties.MultiAZ).toBe(true);
    expect(rds.Properties.StorageEncrypted).toBe(true);
    // Password is now handled by conditional logic (auto-generated or provided)
    expect(rds.Properties.MasterUserPassword).toBeDefined();
  });

  it('should configure AutoScalingGroup with rolling update policy', () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Properties.MinSize).toBe(1);
    expect(asg.UpdatePolicy).toBeDefined();
    expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
  });

  it('should ensure all major resources are tagged with Environment', () => {
    const resources = [
      'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'RouteTable', 'WebSecurityGroup',
      'ApplicationELB', 'TargetGroup', 'AutoScalingGroup', 'RDSInstance', 'SecureS3Bucket',
      'S3ProcessingLambda', 'CloudFrontDistribution', 'AppDynamoTable', 'NotificationTopic'
    ];
    resources.forEach((key) => {
      const res = template.Resources[key];
      expect(res).toBeDefined();
      const tags = res.Properties?.Tags || res.Tags;
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' })
        ])
      );
    });
  });

  it('should configure S3 bucket notification for Lambda', () => {
    const s3 = template.Resources.SecureS3Bucket;
    expect(s3.Properties.NotificationConfiguration).toBeDefined();
    expect(s3.Properties.NotificationConfiguration.LambdaConfigurations[0].Function).toBeDefined();
  });

  it('should grant S3 permission to invoke Lambda', () => {
    const perm = template.Resources.S3InvokeLambdaPermission;
    expect(perm).toBeDefined();
    expect(perm.Type).toBe('AWS::Lambda::Permission');
    expect(perm.Properties.Principal).toBe('s3.amazonaws.com');
  });
});