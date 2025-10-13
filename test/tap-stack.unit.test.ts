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

  // Helper utils
  const getRes = (id: string) => template.Resources?.[id];
  const getOut = (id: string) => template.Outputs?.[id];
  const hasSubString = (obj: any, substr: string) => {
    if (!obj) return false;
    if (typeof obj === 'string') return obj.includes(substr);
    if (obj['Fn::Sub']) {
      const v = obj['Fn::Sub'];
      if (typeof v === 'string') return v.includes(substr);
      if (Array.isArray(v) && typeof v[0] === 'string') return v[0].includes(substr);
    }
    return false;
  };
  const hasIf = (obj: any) => !!(obj && obj['Fn::If']);

  // Basic kebab (fallback) – used when we don't have an explicit override
  const toKebab = (s: string) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Za-z])([0-9])/g, '$1-$2')
      .replace(/([0-9])([A-Za-z])/g, '$1-$2')
      .toLowerCase();

  // Explicit suffixes matching your template's export names
  const EXPORT_NAME_OVERRIDES: Record<string, string> = {
    // short forms
    InternetGatewayId: 'igw-id',
    NatGateway1Id: 'nat-1-id',
    NatGateway2Id: 'nat-2-id',
    DbPasswordSecretArn: 'db-secret-arn',
    // numeric/initialism tokens
    S3BucketName: 's3-bucket-name',
    S3BucketArn: 's3-bucket-arn',
    // AWS-ism (DynamoDb -> dynamodb)
    DynamoDbTableName: 'dynamodb-table-name',
    DynamoDbTableArn: 'dynamodb-table-arn',
  };

  const expectedExportSuffixFor = (key: string) =>
    EXPORT_NAME_OVERRIDES[key] ?? toKebab(key);

  describe('Write Integration TESTS', () => {
    test('template loads for integration tests', async () => {
      expect(template).toBeDefined();
      expect(Object.keys(template)).toContain('Resources');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Multi-environment AWS infrastructure stack for dev and prod environments'
      );
    });

    test('should have required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define all expected parameters and not define DbPassword', () => {
      const p = template.Parameters;
      const expected = [
        'Environment', 'ProjectName', 'AlertEmail', 'VpcCidr',
        'PublicSubnet1Cidr', 'PublicSubnet2Cidr', 'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr',
        'DbInstanceClass', 'RdsEngine', 'RdsEngineVersion', 'DbAllocatedStorage',
        'DbName', 'DbUsername', 'PkAttributeName', 'SkAttributeName',
        'RdsCpuAlarmThreshold', 'RdsFreeStorageAlarmThreshold'
      ];
      expected.forEach(k => expect(p[k]).toBeDefined());
      expect(p.DbPassword).toBeUndefined();
    });

    test('Environment should have dev/prod allowed values', () => {
      const env = template.Parameters.Environment;
      expect(env.Type).toBe('String');
      expect(env.AllowedValues).toEqual(['dev', 'prod']);
      expect(env.Default).toBe('dev');
    });

    test('RdsEngineVersion should allow -r tagged versions', () => {
      const v = template.Parameters.RdsEngineVersion;
      expect(v.Type).toBe('String');
      expect(v.AllowedPattern).toBe('^([0-9]+(\\.[0-9]+)*)(-r[0-9]+)?$');
      expect(typeof v.Default).toBe('string');
    });
  });

  describe('Resources', () => {
    test('VPC and subnets exist with AZ discovery and proper tags', () => {
      expect(getRes('Vpc')?.Type).toBe('AWS::EC2::VPC');

      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(id => {
        const s = getRes(id);
        expect(s).toBeDefined();
        expect(s.Type).toBe('AWS::EC2::Subnet');
        // Availability zones discovered dynamically
        expect(s.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
        // Naming convention includes region/account/env
        const nameTag = (s.Properties.Tags || []).find((t: any) => t.Key === 'Name')?.Value;
        expect(hasSubString(nameTag, '${AWS::Region}')).toBe(true);
        expect(hasSubString(nameTag, '${AWS::AccountId}')).toBe(true);
      });
    });

    test('InternetGateway, routes, and NAT gateways (conditional second) are configured', () => {
      expect(getRes('InternetGateway')?.Type).toBe('AWS::EC2::InternetGateway');
      expect(getRes('PublicRoute')?.Type).toBe('AWS::EC2::Route');

      const nat1 = getRes('NatGateway1');
      expect(nat1?.Type).toBe('AWS::EC2::NatGateway');

      const nat2 = getRes('NatGateway2');
      // NatGateway2 should be conditionally created
      expect(nat2?.Condition).toBe('CreateSecondNatGateway');
    });

    test('S3 bucket is versioned, encrypted and blocks public access with TLS-only policy', () => {
      const bucket = getRes('S3Bucket');
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      const enc = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('AES256');

      const pab = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const policy = getRes('S3BucketPolicy');
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const stmt = policy.Properties.PolicyDocument.Statement.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(stmt).toBeDefined();
      expect(stmt.Effect).toBe('Deny');
      expect(stmt.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('DynamoDB table uses PAY_PER_REQUEST and environment-aware name', () => {
      const tbl = getRes('DynamoDbTable');
      expect(tbl.Type).toBe('AWS::DynamoDB::Table');
      expect(tbl.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(hasSubString(tbl.Properties.TableName, '${Environment}')).toBe(true);
      // Optional PITR enabled via condition for prod
      expect(hasIf(tbl.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled)).toBe(true);
    });

    test('Lambda role has least-privilege style permissions and partition-aware ARNs', () => {
      const role = getRes('LambdaExecutionRole');
      expect(role.Type).toBe('AWS::IAM::Role');

      // Managed policy is partition-aware
      const managed = role.Properties.ManagedPolicyArns?.[0];
      expect(hasSubString(managed, 'arn:${AWS::Partition}:iam::aws:policy')).toBe(true);

      const stmts = role.Properties.Policies[0].PolicyDocument.Statement;
      const createGroup = stmts.find((s: any) => s.Action === 'logs:CreateLogGroup');
      expect(createGroup.Resource).toBe('*'); // recommended for CreateLogGroup
      const ddbStmt = stmts.find((s: any) => Array.isArray(s.Action) && s.Action.includes('dynamodb:PutItem'));
      expect(ddbStmt.Resource).toBeDefined();

      const s3ObjStmt = stmts.find((s: any) => Array.isArray(s.Action) && s.Action.includes('s3:GetObject'));
      expect(hasSubString(s3ObjStmt.Resource, '${BucketArn}/*')).toBe(true);
    });

    test('Lambda function uses env vars and runs in private subnets', () => {
      const fn = getRes('LambdaFunction');
      expect(fn.Type).toBe('AWS::Lambda::Function');

      const env = fn.Properties.Environment.Variables;
      expect(env.ENV).toBeDefined();
      expect(env.TABLE_NAME).toBeDefined();
      expect(env.BUCKET_NAME).toBeDefined();

      const vpc = fn.Properties.VpcConfig;
      expect(Array.isArray(vpc.SubnetIds)).toBe(true);
      expect(vpc.SubnetIds.length).toBe(2);
    });

    test('Secrets Manager dynamic reference is used for DB password (no DbPassword param)', () => {
      const secret = getRes('DbPasswordSecret');
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');

      const rds = getRes('RdsInstance');
      const mup = rds.Properties.MasterUserPassword;
      expect(typeof mup['Fn::Sub']).toBe('string');
      expect(mup['Fn::Sub']).toContain('{{resolve:secretsmanager:');
    });

    test('RDS instance is HA-capable, encrypted, not public, and engine version parameterized', () => {
      const rds = getRes('RdsInstance');
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      // MultiAZ is conditional on env
      expect(hasIf(rds.Properties.MultiAZ)).toBe(true);
      // EngineVersion ties to parameter
      expect(rds.Properties.EngineVersion).toEqual({ Ref: 'RdsEngineVersion' });
    });

    test('DB Security Group port is conditional on engine (postgres 5432 / mysql 3306)', () => {
      const sg = getRes('DbSecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress?.[0];
      expect(hasIf(ingress.FromPort)).toBe(true);
      expect(hasIf(ingress.ToPort)).toBe(true);
    });

    test('CloudWatch alarms exist for Lambda, RDS and DynamoDB', () => {
      const alarms = [
        'LambdaErrorAlarm', 'LambdaThrottleAlarm', 'RdsCpuAlarm', 'RdsFreeStorageAlarm',
        'DynamoDbReadThrottleAlarm', 'DynamoDbWriteThrottleAlarm'
      ];
      alarms.forEach(a => expect(getRes(a)?.Type).toBe('AWS::CloudWatch::Alarm'));

      const alarm = getRes('LambdaErrorAlarm');
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'AlarmTopic' });
    });

    test('No hardcoded region in names; uses ${AWS::Region} via Fn::Sub on key resources', () => {
      const ids = ['S3Bucket', 'DynamoDbTable', 'LambdaFunction', 'RdsInstance'];
      ids.forEach(id => {
        const res = getRes(id);
        // check any name-like property uses Fn::Sub with Region
        const maybeName =
          res.Properties.BucketName ||
          res.Properties.TableName ||
          res.Properties.FunctionName ||
          res.Properties.DBInstanceIdentifier;
        expect(hasSubString(maybeName, '${AWS::Region}')).toBe(true);
      });
    });
  });

  describe('Outputs', () => {
    test('should have all expected outputs', () => {
      const expected = [
        'VpcId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'InternetGatewayId', 'NatGateway1Id', 'S3BucketName', 'S3BucketArn', 'DynamoDbTableName',
        'DynamoDbTableArn', 'LambdaFunctionName', 'LambdaFunctionArn', 'RdsEndpoint', 'RdsPort',
        'SnsTopicArn', 'DbPasswordSecretArn'
      ];
      expected.forEach(o => expect(getOut(o)).toBeDefined());
    });

    test('each output should export with ${AWS::StackName}-<suffix> pattern (supports overrides)', () => {
      Object.keys(template.Outputs).forEach(k => {
        const out = template.Outputs[k];
        if (out.Export?.Name) {
          const suffix = expectedExportSuffixFor(k);
          expect(out.Export.Name).toEqual({ 'Fn::Sub': `\${AWS::StackName}-${suffix}` });
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('required sections are not null', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('resource coverage: contains networking, data, compute, db, monitoring', () => {
      const mustHave = [
        'Vpc', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'S3Bucket', 'DynamoDbTable', 'LambdaFunction', 'DbPasswordSecret', 'RdsInstance',
        'AlarmTopic', 'LambdaErrorAlarm'
      ];
      mustHave.forEach(id => expect(getRes(id)).toBeDefined());
    });
  });

  describe('Resource Naming Convention', () => {
    test('S3 bucket name uses project, environment, account and region', () => {
      const bucket = getRes('S3Bucket').Properties.BucketName;
      expect(hasSubString(bucket, '${ProjectName}')).toBe(true);
      expect(hasSubString(bucket, '${Environment}')).toBe(true);
      expect(hasSubString(bucket, '${AWS::AccountId}')).toBe(true);
      expect(hasSubString(bucket, '${AWS::Region}')).toBe(true);
    });

    test('export names should follow naming convention (with overrides)', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export?.Name) {
          const suffix = expectedExportSuffixFor(outputKey);
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${suffix}`,
          });
        }
      });
    });
  });
});
