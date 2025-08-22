import fs from 'fs';

type CfnTemplate = {
  AWSTemplateFormatVersion: string;
  Description?: string;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

describe('TapStack Unit Tests (from JSON)', () => {
  let template: CfnTemplate;

  beforeAll(() => {
    const raw = fs.readFileSync('lib/TapStack.json', 'utf8');
    template = JSON.parse(raw);
  });

  it('has valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  describe('KMS Key', () => {
    it('creates a KMS key with rotation', () => {
      const key = template.Resources['S3EncryptionKey'];
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe(
        'KMS key for S3 bucket encryption'
      );
      // EnableKeyRotation may be undefined if not specified; treat missing as failure
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    it('creates a KMS alias', () => {
      const alias = template.Resources['S3EncryptionKeyAlias'];
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain(
        '-s3-encryption-key'
      );
    });
  });

  describe('S3 Bucket', () => {
    it('is encrypted with KMS and blocks public access', () => {
      const bucket = template.Resources['ProcessedDataBucket'];
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const enc =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(enc.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(enc.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
      expect(enc.BucketKeyEnabled).toBe(true);
      const pab = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });

    it('has versioning and lifecycle rules', () => {
      const bucket = template.Resources['ProcessedDataBucket'];
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      const hasIncomplete = rules.some(
        (r: any) =>
          r.Id === 'DeleteIncompleteMultipartUploads' && r.Status === 'Enabled'
      );
      const hasOldVersions = rules.some(
        (r: any) => r.Id === 'DeleteOldVersions' && r.Status === 'Enabled'
      );
      expect(hasIncomplete).toBe(true);
      expect(hasOldVersions).toBe(true);
    });
  });

  describe('CloudWatch Log Group', () => {
    it('creates log group with 14-day retention', () => {
      const lg = template.Resources['LambdaLogGroup'];
      expect(lg).toBeDefined();
      expect(lg.Type).toBe('AWS::Logs::LogGroup');
      expect(lg.Properties.RetentionInDays).toBe(14);
    });
  });

  describe('IAM Role', () => {
    it('creates execution role with basic policy', () => {
      const role = template.Resources['LambdaExecutionRole'];
      expect(role.Type).toBe('AWS::IAM::Role');
      const assume = role.Properties.AssumeRolePolicyDocument;
      expect(assume.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      const managed = role.Properties.ManagedPolicyArns || [];
      expect(managed).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    it('has least-privilege S3 and KMS inline policies', () => {
      const role = template.Resources['LambdaExecutionRole'];
      const policies = role.Properties.Policies.map(
        (p: any) => p.PolicyDocument
      );
      const statements = policies.flatMap((pd: any) => pd.Statement);
      const s3Objects = statements.find(
        (s: any) => Array.isArray(s.Action) && s.Action.includes('s3:PutObject')
      );
      const s3List = statements.find(
        (s: any) =>
          Array.isArray(s.Action) && s.Action.includes('s3:ListBucket')
      );
      const kmsUse = statements.find(
        (s: any) => Array.isArray(s.Action) && s.Action.includes('kms:Decrypt')
      );
      expect(s3Objects).toBeDefined();
      expect(s3List).toBeDefined();
      expect(kmsUse).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    it('configured for API proxy and S3 use', () => {
      const fn = template.Resources['LambdaFunction'];
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.12');
      expect(fn.Properties.Handler).toBe('index.lambda_handler');
      expect(fn.Properties.Timeout).toBe(30);
      expect(fn.Properties.MemorySize).toBe(256);
      expect(fn.Properties.Environment.Variables.S3_BUCKET_NAME).toBeDefined();
      expect(fn.Properties.Environment.Variables.KMS_KEY_ID).toBeDefined();
      expect(fn.Properties.Code.ZipFile).toContain('lambda_handler');
    });
  });

  describe('API Gateway', () => {
    it('REST API and proxy methods exist', () => {
      const api = template.Resources['ApiGateway'];
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      const proxyMethod = template.Resources['ApiGatewayMethod'];
      const rootMethod = template.Resources['ApiGatewayRootMethod'];
      expect(proxyMethod.Properties.HttpMethod).toBe('ANY');
      expect(proxyMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(rootMethod.Properties.HttpMethod).toBe('ANY');
      expect(rootMethod.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    it('has proxy resource and deployment', () => {
      const resource = template.Resources['ApiGatewayResource'];
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('{proxy+}');

      const deployment = template.Resources['ApiGatewayDeployment'];
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBeDefined();
    });
  });

  describe('Lambda Permissions', () => {
    it('grants API Gateway invoke permissions with proper SourceArn', () => {
      const perm1 = template.Resources['LambdaApiGatewayPermission'];
      const perm2 = template.Resources['LambdaApiGatewayRootPermission'];
      expect(perm1.Type).toBe('AWS::Lambda::Permission');
      expect(perm1.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(perm1.Properties.SourceArn['Fn::Sub']).toContain(
        'arn:aws:execute-api'
      );
      expect(perm2.Properties.SourceArn['Fn::Sub']).toContain(
        'arn:aws:execute-api'
      );
    });
  });

  describe('CloudWatch Alarms', () => {
    it('creates error and duration alarms on the Lambda function', () => {
      const err = template.Resources['LambdaErrorAlarm'];
      const dur = template.Resources['LambdaDurationAlarm'];
      expect(err.Properties.MetricName).toBe('Errors');
      expect(err.Properties.Namespace).toBe('AWS/Lambda');
      expect(dur.Properties.MetricName).toBe('Duration');
      expect(dur.Properties.Namespace).toBe('AWS/Lambda');
    });

    it('creates invocation alarm on the Lambda function', () => {
      const inv = template.Resources['LambdaInvocationAlarm'];
      expect(inv).toBeDefined();
      expect(inv.Type).toBe('AWS::CloudWatch::Alarm');
      expect(inv.Properties.MetricName).toBe('Invocations');
      expect(inv.Properties.Namespace).toBe('AWS/Lambda');
    });
  });

  describe('Outputs', () => {
    it('includes required outputs', () => {
      expect(template.Outputs).toBeDefined();
      const outputs = template.Outputs!;
      expect(outputs['ApiGatewayUrl']).toBeDefined();
      expect(outputs['LambdaFunctionArn']).toBeDefined();
      expect(outputs['S3BucketName']).toBeDefined();
      expect(outputs['KMSKeyId']).toBeDefined();
      expect(outputs['KMSKeyAlias']).toBeDefined();
    });
  });
});
