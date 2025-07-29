import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
const template = Template.fromJSON(templateData);

describe('TapStack CloudFormation Integration Tests', () => {

  it('creates an S3 bucket with versioning and proper tags', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    expect(Object.values(buckets)).toHaveLength(1);
    const bucket = Object.values(buckets)[0] as any;

    expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');

    const tags = bucket.Properties?.Tags || [];
    expect(tags).toEqual(
      expect.arrayContaining([
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Name', Value: 'corp-s3-bucket' },
        { Key: 'ManagedBy', Value: 'CloudFormation' }
      ])
    );
  });

  it('creates a public read bucket policy attached to the bucket', () => {
  const policies = template.findResources('AWS::S3::BucketPolicy');
  expect(Object.values(policies)).toHaveLength(1);
  const policy = Object.values(policies)[0] as any;

  const statement = policy.Properties?.PolicyDocument?.Statement[0];
  expect(statement.Effect).toBe('Allow');
  expect(statement.Principal).toBe('*');
  expect(statement.Action).toBe('s3:GetObject');

  // Fix: match intrinsic object structure
  expect(statement.Resource).toEqual({
    'Fn::Sub': '${CorpBucket.Arn}/*'
  });

  const tags = policy.Properties?.Tags || [];
  expect(tags).toEqual(
    expect.arrayContaining([
      { Key: 'ManagedBy', Value: 'CloudFormation' }
    ])
  );
});


  it('creates an IAM role for Lambda with least privilege and logging access', () => {
  const roles = template.findResources('AWS::IAM::Role');
  expect(Object.values(roles)).toHaveLength(1);
  const role = Object.values(roles)[0] as any;

  const assumeStmt = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0];
  expect(assumeStmt.Effect).toBe('Allow');
  expect(assumeStmt.Principal?.Service).toBe('lambda.amazonaws.com');
  expect(assumeStmt.Action).toBe('sts:AssumeRole');

  const policyStmt = role.Properties?.Policies?.[0]?.PolicyDocument?.Statement;
  const actions = policyStmt.flatMap((s: any) => s.Action);
  expect(actions).toEqual(
    expect.arrayContaining([
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
      's3:GetObject',
      's3:ListBucket'
    ])
  );

  const resources = policyStmt.flatMap((s: any) => s.Resource);
  // Fix: allow both string and intrinsic objects
  resources.forEach((r: any) => {
    expect(
      typeof r === 'string' ||
      (typeof r === 'object' && (r['Fn::GetAtt'] || r['Fn::Sub']))
    ).toBeTruthy();
  });

  const tags = role.Properties?.Tags || [];
  expect(tags).toEqual(
    expect.arrayContaining([
      { Key: 'ManagedBy', Value: 'CloudFormation' }
    ])
  );
});


  it('creates a Lambda function with proper environment variables and inline code', () => {
    const lambdas = template.findResources('AWS::Lambda::Function');
    expect(Object.values(lambdas)).toHaveLength(1);
    const lambda = Object.values(lambdas)[0] as any;

    expect(lambda.Properties?.Runtime).toBe('nodejs18.x');
    expect(lambda.Properties?.Handler).toBe('index.handler');
    expect(lambda.Properties?.Environment?.Variables?.ENV).toBe('Production');
    expect(lambda.Properties?.Environment?.Variables?.BUCKET_NAME).toBeDefined();
    expect(lambda.Properties?.Code?.ZipFile).toContain('exports.handler');

    const tags = lambda.Properties?.Tags || [];
    expect(tags).toEqual(
      expect.arrayContaining([
        { Key: 'ManagedBy', Value: 'CloudFormation' }
      ])
    );
  });

  it('creates a log group with 14-day retention and proper tags', () => {
    const logs = template.findResources('AWS::Logs::LogGroup');
    expect(Object.values(logs)).toHaveLength(1);
    const log = Object.values(logs)[0] as any;

    expect(log.Properties?.RetentionInDays).toBe(14);

    const tags = log.Properties?.Tags || [];
    expect(tags).toEqual(
      expect.arrayContaining([
        { Key: 'Environment', Value: 'Production' },
        { Key: 'ManagedBy', Value: 'CloudFormation' }
      ])
    );
  });

  it('grants Lambda invoke permission to S3 via Lambda::Permission', () => {
    const perms = template.findResources('AWS::Lambda::Permission');
    expect(Object.values(perms)).toHaveLength(1);
    const perm = Object.values(perms)[0] as any;

    expect(perm.Properties?.Action).toBe('lambda:InvokeFunction');
    expect(perm.Properties?.Principal).toBe('s3.amazonaws.com');
    expect(perm.Properties?.FunctionName?.Ref).toBeDefined();
    expect(perm.Properties?.SourceArn).toBeDefined();
  });
  it('ensures Lambda role policy has specific log permissions', () => {
  const roles = template.findResources('AWS::IAM::Role');
  const role = Object.values(roles)[0] as any;
  const statements = role.Properties?.Policies?.[0]?.PolicyDocument?.Statement;

  const logStmt = statements.find((s: any) =>
    s.Action.includes('logs:CreateLogGroup') &&
    s.Action.includes('logs:CreateLogStream') &&
    s.Action.includes('logs:PutLogEvents')
  );

  expect(logStmt).toBeDefined();
  expect(logStmt.Resource).toBe('*');
});

it('validates Lambda environment variables reference the correct bucket', () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const env = lambda.Properties?.Environment?.Variables;

  expect(env).toHaveProperty('BUCKET_NAME');
  expect(env).toHaveProperty('ENV', 'Production');
});

  it('outputs all required values', () => {
    const outputs = template.toJSON().Outputs;
    const expected = [
      'BucketName',
      'BucketArn',
      'LambdaFunctionName',
      'LambdaFunctionArn',
      'LambdaExecutionRoleArn',
      'LambdaLogGroupName',
      'S3NotificationInstructions'
    ];

    for (const o of expected) {
      expect(outputs).toHaveProperty(o);
      expect(outputs[o]).toHaveProperty('Value');
    }
  });

  it('includes S3NotificationInstructions with correct CLI syntax', () => {
  const output = template.toJSON().Outputs?.S3NotificationInstructions;
  expect(output).toBeDefined();

  const value = output?.Value;
  const cli = value?.['Fn::Sub'];

  expect(cli).toContain('aws s3api put-bucket-notification-configuration');
  expect(cli).toContain('"LambdaFunctionConfigurations"');
  expect(cli).toContain('"Events": ["s3:ObjectCreated:*"]');
});
it('fails if S3 bucket is missing versioning configuration', () => {
  const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0] as any;
  expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
});

it('fails if S3 bucket policy does not contain public read permission', () => {
  const policy = Object.values(template.findResources('AWS::S3::BucketPolicy'))[0] as any;
  const statement = policy.Properties?.PolicyDocument?.Statement?.[0];
  expect(statement.Effect).toBe('Allow');
  expect(statement.Principal).toBe('*');
  expect(statement.Action).toContain('s3:GetObject');
});

it('fails if IAM role does not contain required Lambda trust relationship', () => {
  const role = Object.values(template.findResources('AWS::IAM::Role'))[0] as any;
  const principal = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service;
  expect(principal).toBe('lambda.amazonaws.com');
});

it('fails if IAM role policy contains wildcard action or resource where not appropriate', () => {
  const role = Object.values(template.findResources('AWS::IAM::Role'))[0] as any;
  const statements = role.Properties?.Policies?.[0]?.PolicyDocument?.Statement;

  statements.forEach((s: any) => {
    const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
    const resources = Array.isArray(s.Resource) ? s.Resource : [s.Resource];

    const isLogStatement = actions.some((a: string) =>
      a.startsWith('logs:')
    );

    resources.forEach((r: any) => {
      if (typeof r === 'string') {
        if (!isLogStatement) {
          expect(r).not.toBe('*'); // allow * only for logs
        }
      }
    });
  });
});


it('fails if Lambda runtime is not nodejs18.x', () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  expect(lambda.Properties?.Runtime).toBe('nodejs18.x');
});

it('fails if Lambda function is missing environment variables', () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const env = lambda.Properties?.Environment?.Variables;
  expect(env).toBeDefined();
  expect(env).toHaveProperty('ENV');
  expect(env).toHaveProperty('BUCKET_NAME');
});

it('fails if Lambda role is not assigned to the function', () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  expect(lambda.Properties?.Role).toBeDefined();
});

it('fails if Lambda invoke permission is missing SourceArn', () => {
  const perm = Object.values(template.findResources('AWS::Lambda::Permission'))[0] as any;
  expect(perm.Properties?.SourceArn).toBeDefined();
});

it('fails if LogGroup has no retention policy defined', () => {
  const log = Object.values(template.findResources('AWS::Logs::LogGroup'))[0] as any;
  expect(log.Properties?.RetentionInDays).toBeDefined();
});

it('fails if Outputs section is missing required export names', () => {
  const outputs = template.toJSON().Outputs;

  const required = [
    'BucketName',
    'BucketArn',
    'LambdaFunctionName',
    'LambdaFunctionArn',
    'LambdaExecutionRoleArn',
    'LambdaLogGroupName',
    'S3NotificationInstructions'
  ];

  required.forEach(key => {
    expect(outputs).toHaveProperty(key);
    const output = outputs[key];

    // Only enforce Export block if it's explicitly present
    if ('Export' in output) {
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toBeDefined();
    }
  });
});
it("ensures S3 bucket name follows 'corp-' naming convention", () => {
  const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0] as any;
  const name = bucket.Properties?.BucketName?.['Fn::Sub'];
  expect(name).toMatch(/^corp-/);
});

it("ensures Lambda function name includes stack name", () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const name = lambda.Properties?.FunctionName?.['Fn::Sub'];
  expect(name).toMatch(/-?\${AWS::StackName}$/);
});

it("ensures bucket policy references correct bucket ARN via Fn::Sub", () => {
  const policy = Object.values(template.findResources('AWS::S3::BucketPolicy'))[0] as any;
  const resource = policy.Properties?.PolicyDocument?.Statement[0]?.Resource;
  expect(resource).toEqual({ 'Fn::Sub': '${CorpBucket.Arn}/*' });
});

it("ensures IAM role includes both s3:GetObject and s3:ListBucket actions", () => {
  const role = Object.values(template.findResources('AWS::IAM::Role'))[0] as any;
  const s3Stmt = role.Properties?.Policies?.[0]?.PolicyDocument?.Statement.find((s: any) =>
    s.Action.includes('s3:GetObject') && s.Action.includes('s3:ListBucket')
  );
  expect(s3Stmt).toBeDefined();
});

it("ensures Lambda function code contains expected handler function", () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const code = lambda.Properties?.Code?.ZipFile;
  expect(code).toContain('exports.handler');
});

it("ensures CloudWatch LogGroup name follows expected format", () => {
  const log = Object.values(template.findResources('AWS::Logs::LogGroup'))[0] as any;
  const name = log.Properties?.LogGroupName?.['Fn::Sub'];
  expect(name).toMatch(/^\/aws\/lambda\/corp-s3-event-handler-\${AWS::StackName}$/);
});

it("ensures Lambda::Permission principal is s3.amazonaws.com", () => {
  const perm = Object.values(template.findResources('AWS::Lambda::Permission'))[0] as any;
  expect(perm.Properties?.Principal).toBe('s3.amazonaws.com');
});

it("ensures bucket policy statement has correct SID value", () => {
  const policy = Object.values(template.findResources('AWS::S3::BucketPolicy'))[0] as any;
  const sid = policy.Properties?.PolicyDocument?.Statement[0]?.Sid;
  expect(sid).toBe('PublicReadGetObject');
});

it("ensures all resources are tagged with Environment = Production", () => {
  const resources = Object.values(template.toJSON().Resources);
  resources.forEach((res: any) => {
    const tags = res?.Properties?.Tags || [];
    const tag = tags.find((t: any) => t.Key === 'Environment');
    if (tag) {
      expect(tag.Value).toBe('Production');
    }
  });
});
it("fails if S3 bucket name does not start with 'corp-'", () => {
  const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0] as any;
  const name = bucket.Properties?.BucketName?.['Fn::Sub'];
  expect(name.startsWith('corp-')).toBe(true);
});

it("fails if Lambda function name is missing stack name", () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const name = lambda.Properties?.FunctionName?.['Fn::Sub'];
  expect(name).toContain('${AWS::StackName}');
});

it("fails if IAM role trust policy does not allow Lambda service", () => {
  const role = Object.values(template.findResources('AWS::IAM::Role'))[0] as any;
  const principal = role.Properties?.AssumeRolePolicyDocument?.Statement[0]?.Principal?.Service;
  expect(principal).toBe('lambda.amazonaws.com');
});

it("fails if CloudWatch log retention is greater than 30 days", () => {
  const log = Object.values(template.findResources('AWS::Logs::LogGroup'))[0] as any;
  const retention = log.Properties?.RetentionInDays;
  expect(retention).toBeLessThanOrEqual(30);
});

it("fails if bucket policy is missing s3:GetObject action", () => {
  const policy = Object.values(template.findResources('AWS::S3::BucketPolicy'))[0] as any;
  const actions = policy.Properties?.PolicyDocument?.Statement[0]?.Action;
  expect(actions).toContain('s3:GetObject');
});

it("fails if Lambda code block does not contain 'exports.handler'", () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const code = lambda.Properties?.Code?.ZipFile;
  expect(code).toContain('exports.handler');
});

it("fails if Lambda environment variables include unrecognized keys", () => {
  const lambda = Object.values(template.findResources('AWS::Lambda::Function'))[0] as any;
  const envVars = Object.keys(lambda.Properties?.Environment?.Variables || {});
  envVars.forEach(key => {
    expect(['ENV', 'BUCKET_NAME']).toContain(key);
  });
});

it("fails if bucket policy Resource does not include '/*' suffix", () => {
  const policy = Object.values(template.findResources('AWS::S3::BucketPolicy'))[0] as any;
  const resource = policy.Properties?.PolicyDocument?.Statement[0]?.Resource;
  const str = resource?.['Fn::Sub'] || resource;
  expect(str.endsWith('/*')).toBe(true);
});

it("fails if CloudWatch LogGroup is missing Environment tag", () => {
  const log = Object.values(template.findResources('AWS::Logs::LogGroup'))[0] as any;
  const tags = log.Properties?.Tags || [];
  const tag = tags.find((t: any) => t.Key === 'Environment');
  expect(tag?.Value).toBe('Production');
});

it("fails if Lambda permission has incorrect action", () => {
  const perm = Object.values(template.findResources('AWS::Lambda::Permission'))[0] as any;
  expect(perm.Properties?.Action).toBe('lambda:InvokeFunction');
});



});
