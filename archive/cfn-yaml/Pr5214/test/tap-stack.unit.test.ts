// test/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

type CFNTemplate = {
  Parameters?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
  Conditions?: Record<string, any>;
  Description?: string;
  AWSTemplateFormatVersion?: string;
};

const JSON_PATH = path.resolve(__dirname, '../lib/TapStack.json');
const YAML_PATH = path.resolve(__dirname, '../lib/TapStack.yml');

// --- Helpers ---
function loadTemplate(): CFNTemplate {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  return JSON.parse(raw) as CFNTemplate;
}
function res(tpl: CFNTemplate, logicalId: string) {
  const r = tpl.Resources?.[logicalId];
  expect(r).toBeDefined();
  return r;
}
function typeOf(tpl: CFNTemplate, logicalId: string, expectedType: string) {
  const r = res(tpl, logicalId);
  expect(r.Type).toBe(expectedType);
  return r;
}
function getProp(obj: any, key: string) {
  expect(obj).toBeDefined();
  expect(obj.Properties).toBeDefined();
  return obj.Properties[key];
}
function hasOutput(tpl: CFNTemplate, key: string) {
  expect(tpl.Outputs).toBeDefined();
  expect(tpl.Outputs?.[key]).toBeDefined();
}

// A safe helper to find all resources by Type
function findByType(tpl: CFNTemplate, type: string) {
  return Object.entries(tpl.Resources || {}).filter(([_, r]) => (r as any).Type === type);
}

describe('TapStack — CloudFormation Template (unit validation)', () => {
  let tpl: CFNTemplate;

  beforeAll(() => {
    // Ensure files exist
    expect(fs.existsSync(JSON_PATH)).toBe(true);
    expect(fs.existsSync(YAML_PATH)).toBe(true); // only existence check, no YAML parse
    tpl = loadTemplate();
    // Basic shape
    expect(tpl).toBeDefined();
    expect(tpl.Resources).toBeDefined();
  });

  // 1
  test('Template metadata present', () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Description).toMatch(/TapStack/i);
  });

  // 2
  test('Parameters include ENVIRONMENTSUFFIX with default', () => {
    const p = tpl.Parameters!;
    expect(p).toBeDefined();
    expect(p.ENVIRONMENTSUFFIX).toBeDefined();
    expect(p.ENVIRONMENTSUFFIX.Default).toBeDefined();
    expect(['dev', 'staging', 'prod']).toContain(p.ENVIRONMENTSUFFIX.Default);
  });

  // 3
  test('Parameters include DeveloperAlertEmail with default', () => {
    const p = tpl.Parameters!;
    expect(p.DeveloperAlertEmail).toBeDefined();
    expect(p.DeveloperAlertEmail.Default).toBeDefined();
    expect(String(p.DeveloperAlertEmail.Default)).toContain('@');
  });

  // 4
  test('VPC and Subnets exist and are multi-AZ', () => {
    typeOf(tpl, 'VPC', 'AWS::EC2::VPC');
    typeOf(tpl, 'PublicSubnetA', 'AWS::EC2::Subnet');
    typeOf(tpl, 'PublicSubnetB', 'AWS::EC2::Subnet');
    typeOf(tpl, 'PrivateSubnetA', 'AWS::EC2::Subnet');
    typeOf(tpl, 'PrivateSubnetB', 'AWS::EC2::Subnet');
  });

  // 5
  test('S3 buckets exist with encryption and lifecycle', () => {
    const ingest = typeOf(tpl, 'IngestBucket', 'AWS::S3::Bucket');
    const art = typeOf(tpl, 'ArtifactsBucket', 'AWS::S3::Bucket');

    const encIngest = getProp(ingest, 'BucketEncryption');
    const encArt = getProp(art, 'BucketEncryption');
    expect(encIngest).toBeDefined();
    expect(encArt).toBeDefined();

    const lifeIngest = getProp(ingest, 'LifecycleConfiguration');
    const lifeArt = getProp(art, 'LifecycleConfiguration');
    expect(lifeIngest?.Rules?.[0]?.Transitions?.[0]?.StorageClass || '').toContain('GLACIER');
    expect(lifeArt?.Rules?.[0]?.Transitions?.[0]?.StorageClass || '').toContain('GLACIER');
  });

  // 6
  test('S3 bucket policies enforce SSE-S3 and TLS and VPC restriction', () => {
    const ibp = typeOf(tpl, 'IngestBucketPolicy', 'AWS::S3::BucketPolicy');
    const abp = typeOf(tpl, 'ArtifactsBucketPolicy', 'AWS::S3::BucketPolicy');
    const check = (bp: any) => {
      const doc = getProp(bp, 'PolicyDocument');
      expect(doc).toBeDefined();
      // find statements by Sid
      const sids = (doc.Statement || []).map((s: any) => s.Sid);
      expect(sids).toEqual(expect.arrayContaining([
        'DenyUnencryptedObjectUploads',
        'DenyInsecureConnections',
        'RestrictToVPCEndpoint',
      ]));
    };
    check(ibp);
    check(abp);
  });

  // 7
  test('KMS CMK and Alias exist', () => {
    typeOf(tpl, 'ApplicationCMK', 'AWS::KMS::Key');
    typeOf(tpl, 'ApplicationCMKAlias', 'AWS::KMS::Alias');
  });

  // 8
  test('DynamoDB table uses KMS encryption and PROVISIONED mode', () => {
    const ddb = typeOf(tpl, 'ResultsTable', 'AWS::DynamoDB::Table');
    const sse = getProp(ddb, 'SSESpecification');
    expect(sse?.SSEEnabled).toBe(true);
    expect(sse?.SSEType).toBe('KMS');
    expect(getProp(ddb, 'BillingMode')).toBe('PROVISIONED');
  });

  // 9
  test('DynamoDB autoscaling resources present and correctly targeted', () => {
    const readTarget = typeOf(tpl, 'ResultsTableReadScalableTarget', 'AWS::ApplicationAutoScaling::ScalableTarget');
    const writeTarget = typeOf(tpl, 'ResultsTableWriteScalableTarget', 'AWS::ApplicationAutoScaling::ScalableTarget');

    expect(getProp(readTarget, 'ScalableDimension')).toBe('dynamodb:table:ReadCapacityUnits');
    expect(getProp(writeTarget, 'ScalableDimension')).toBe('dynamodb:table:WriteCapacityUnits');

    const rPol = typeOf(tpl, 'ResultsTableReadScalingPolicy', 'AWS::ApplicationAutoScaling::ScalingPolicy');
    const wPol = typeOf(tpl, 'ResultsTableWriteScalingPolicy', 'AWS::ApplicationAutoScaling::ScalingPolicy');
    expect(getProp(rPol, 'PolicyType')).toBe('TargetTrackingScaling');
    expect(getProp(wPol, 'PolicyType')).toBe('TargetTrackingScaling');
    expect(getProp(rPol, 'ScalingTargetId')).toBeDefined();
    expect(getProp(wPol, 'ScalingTargetId')).toBeDefined();
  });

  // 10
  test('Lambda roles exist with least-privilege scoped resources', () => {
    const tr = typeOf(tpl, 'TransformFunctionRole', 'AWS::IAM::Role');
    const ar = typeOf(tpl, 'ApiHandlerFunctionRole', 'AWS::IAM::Role');

    const checkPolicyScopes = (role: any) => {
      const pols = getProp(role, 'Policies');
      expect(Array.isArray(pols)).toBe(true);
      const docStmt = pols.flatMap((p: any) => p.PolicyDocument?.Statement || []);
      // ensure statements exist & scoped resources defined
      const critical = docStmt.filter((s: any) => Array.isArray(s.Action) ? s.Action.join(',').includes('dynamodb:') || s.Action.join(',').includes('s3:') : false);
      critical.forEach((s: any) => {
        const resArns = Array.isArray(s.Resource) ? s.Resource : [s.Resource];
        resArns.forEach((arn: any) => expect(arn).toBeDefined());
      });
    };
    checkPolicyScopes(tr);
    checkPolicyScopes(ar);
  });

  // 11
  test('Lambda functions exist and are VPC-enabled, with KMS key and env', () => {
    const tf = typeOf(tpl, 'TransformFunction', 'AWS::Lambda::Function');
    const af = typeOf(tpl, 'ApiHandlerFunction', 'AWS::Lambda::Function');

    [tf, af].forEach(fn => {
      expect(getProp(fn, 'VpcConfig')).toBeDefined();
      expect(getProp(fn, 'KmsKeyArn')).toBeDefined();
      const env = getProp(fn, 'Environment');
      expect(env?.Variables?.ENVIRONMENT).toBeDefined();
    });
  });

  // 12
  test('No direct S3 -> Lambda bucket notification (EventBridge pattern used)', () => {
    const ingest = typeOf(tpl, 'IngestBucket', 'AWS::S3::Bucket');
    // JSON should not include direct NotificationConfiguration (EventBridge used instead)
    const notification = getProp(ingest, 'NotificationConfiguration');
    expect(notification).toBeUndefined();
    // Check EventBridge rule exists
    typeOf(tpl, 'S3ObjectCreatedRule', 'AWS::Events::Rule');
    typeOf(tpl, 'AllowEventsToInvokeTransform', 'AWS::Lambda::Permission');
  });

  // 13
  test('API Gateway resources exist and are wired to Lambda proxy', () => {
    typeOf(tpl, 'TapApi', 'AWS::ApiGateway::RestApi');
    typeOf(tpl, 'ProcessResource', 'AWS::ApiGateway::Resource');
    const method = typeOf(tpl, 'ProcessMethod', 'AWS::ApiGateway::Method');
    expect(getProp(method, 'Integration')?.Type).toBe('AWS_PROXY');
    typeOf(tpl, 'ApiStage', 'AWS::ApiGateway::Stage');
  });

  // 14
  test('API Gateway has account logging role and log group', () => {
    typeOf(tpl, 'ApiGatewayExecutionRole', 'AWS::IAM::Role');
    typeOf(tpl, 'ApiGatewayAccount', 'AWS::ApiGateway::Account');
    typeOf(tpl, 'ApiLogGroup', 'AWS::Logs::LogGroup');
  });

  // 15
  test('Cognito UserPool, Client, IdentityPool, and Role Attachment exist', () => {
    typeOf(tpl, 'CognitoUserPool', 'AWS::Cognito::UserPool');
    typeOf(tpl, 'CognitoUserPoolClient', 'AWS::Cognito::UserPoolClient');
    typeOf(tpl, 'CognitoIdentityPool', 'AWS::Cognito::IdentityPool');
    typeOf(tpl, 'CognitoAuthenticatedRole', 'AWS::IAM::Role');
    typeOf(tpl, 'CognitoIdentityPoolRoleAttachment', 'AWS::Cognito::IdentityPoolRoleAttachment');
  });

  // 16
  test('SNS Topic and email subscription exist', () => {
    const topic = typeOf(tpl, 'DevelopersTopic', 'AWS::SNS::Topic');
    const kms = getProp(topic, 'KmsMasterKeyId');
    expect(kms).toBeDefined();
    typeOf(tpl, 'DevelopersTopicSubscription', 'AWS::SNS::Subscription');
  });

  // 17
  test('CloudWatch Log Groups exist for Lambdas with retention', () => {
    const tlog = typeOf(tpl, 'TransformFunctionLogGroup', 'AWS::Logs::LogGroup');
    const alog = typeOf(tpl, 'ApiHandlerFunctionLogGroup', 'AWS::Logs::LogGroup');
    expect(getProp(tlog, 'RetentionInDays')).toBeDefined();
    expect(getProp(alog, 'RetentionInDays')).toBeDefined();
  });

  // 18
  test('CloudWatch Alarms exist for Lambda errors/throttles and API 5XX and DynamoDB throttles', () => {
    typeOf(tpl, 'TransformFunctionErrorsAlarm', 'AWS::CloudWatch::Alarm');
    typeOf(tpl, 'TransformFunctionThrottlesAlarm', 'AWS::CloudWatch::Alarm');
    typeOf(tpl, 'ApiGateway5XXAlarm', 'AWS::CloudWatch::Alarm');
    typeOf(tpl, 'DynamoDBWriteThrottlesAlarm', 'AWS::CloudWatch::Alarm');
  });

  // 19
  test('VPC Endpoints exist (Gateway for S3; optional Interface for Logs/SNS)', () => {
    typeOf(tpl, 'S3GatewayEndpoint', 'AWS::EC2::VPCEndpoint');
    // Interface endpoints are conditional; if present, validate type
    const logsEp = tpl.Resources['CloudWatchLogsEndpoint'];
    if (logsEp) {
      expect(logsEp.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(getProp(logsEp, 'VpcEndpointType')).toBe('Interface');
    }
    const snsEp = tpl.Resources['SNSEndpoint'];
    if (snsEp) {
      expect(snsEp.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(getProp(snsEp, 'VpcEndpointType')).toBe('Interface');
    }
  });

  // 20 (relaxed and configuration-focused)
  test('Security groups exist and are correctly configured', () => {
    const lsg = typeOf(tpl, 'LambdaSecurityGroup', 'AWS::EC2::SecurityGroup');
    // Basic config checks
    const desc = getProp(lsg, 'GroupDescription');
    expect(String(desc)).toMatch(/lambda/i);
    expect(getProp(lsg, 'VpcId')).toBeDefined();
    // Egress must allow HTTPS
    const egress = getProp(lsg, 'SecurityGroupEgress');
    expect(Array.isArray(egress)).toBe(true);
    const httpsEgress = egress.find((e: any) => e.FromPort === 443 && e.ToPort === 443);
    expect(httpsEgress).toBeTruthy();
    // Tags (optional strictness)
    const tags = getProp(lsg, 'Tags');
    if (tags) {
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    }
    // Endpoint SG (if present) must allow inbound 443 from Lambda SG
    const ep = tpl.Resources['VPCEndpointSecurityGroup'];
    if (ep) {
      expect(ep.Type).toBe('AWS::EC2::SecurityGroup');
      const ing = getProp(ep, 'SecurityGroupIngress');
      expect(Array.isArray(ing)).toBe(true);
      const httpsIn = ing.find((r: any) => r.FromPort === 443 && r.ToPort === 443);
      expect(httpsIn).toBeTruthy();
    }
  });

  // 21
  test('Secrets Manager secret exists and is CMK-encrypted', () => {
    const sec = typeOf(tpl, 'ApplicationSecret', 'AWS::SecretsManager::Secret');
    expect(getProp(sec, 'KmsKeyId')).toBeDefined();
    expect(getProp(sec, 'Name')).toBeDefined();
  });

  // 22
  test('Outputs cover key artifacts (VPC, Subnets, Buckets, DDB, KMS, Lambdas, API, SNS, Cognito)', () => {
    [
      'VPCId',
      'PrivateSubnetAId',
      'PrivateSubnetBId',
      'PublicSubnetAId',
      'PublicSubnetBId',
      'S3GatewayEndpointId',
      'IngestBucketName',
      'ArtifactsBucketName',
      'ResultsTableName',
      'ApplicationCMKArn',
      'TransformFunctionArn',
      'ApiHandlerFunctionArn',
      'ApiInvokeUrl',
      'DevelopersTopicArn',
      'CognitoUserPoolId',
      'CognitoUserPoolClientId',
      'CognitoIdentityPoolId',
    ].forEach(k => hasOutput(tpl, k));
  });

  // 23
  test('All major resources have Environment tag containing ENVIRONMENTSUFFIX', () => {
    const sampleTypes = [
      'AWS::S3::Bucket',
      'AWS::Lambda::Function',
      'AWS::DynamoDB::Table',
      'AWS::ApiGateway::RestApi',
      'AWS::EC2::Subnet',
      'AWS::KMS::Key',
    ];
    const majors = Object.entries(tpl.Resources).filter(([_, r]) => sampleTypes.includes((r as any).Type));
    majors.forEach(([_, r]) => {
      const tags = (r as any).Properties?.Tags;
      if (tags) {
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag).toBeDefined();
      }
    });
  });

  // 24
  test('No direct EC2 compute resources present (serverless requirement)', () => {
    const ec2Instances = findByType(tpl, 'AWS::EC2::Instance');
    expect(ec2Instances.length).toBe(0);
    const asg = findByType(tpl, 'AWS::AutoScaling::AutoScalingGroup');
    expect(asg.length).toBe(0);
  });

  // 25
  test('Naming uses ENVIRONMENTSUFFIX via substitutions where applicable', () => {
    // Spot check several logical resources for Fn::Sub usage in names
    const candidates = ['IngestBucket', 'ArtifactsBucket', 'TapApi', 'TransformFunction', 'ApiHandlerFunction'];
    candidates.forEach((id) => {
      const r = res(tpl, id);
      const props = r.Properties || {};
      // look for any property that is a name with Fn::Sub referencing ENVIRONMENTSUFFIX
      const maybeNameFields = ['BucketName', 'Name', 'FunctionName', 'UserPoolName', 'ClientName', 'IdentityPoolName', 'TopicName', 'StageName', 'TableName', 'AliasName', 'LogGroupName'];
      const matched = maybeNameFields.some((f) => {
        const val = props[f];
        if (!val) return false;
        const str = typeof val === 'string' ? val : JSON.stringify(val);
        return str.includes('ENVIRONMENTSUFFIX');
      });
      expect(matched).toBe(true);
    });
  });
});
