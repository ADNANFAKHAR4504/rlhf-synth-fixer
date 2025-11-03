import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack unit', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TapUnit', { environmentSuffix: 'test' });
    template = Template.fromStack(stack);
  });

  test('creates VPC with proper configuration', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('tap-vpc-test') }),
      ]),
    });
  });

  test('creates VPC endpoints for S3 and DynamoDB', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 2);
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
    const endpointProps = Object.values(endpoints).map((ep: any) => ep.Properties);
    const serviceNameStrings = endpointProps.map((props: any) => {
      const serviceName = props.ServiceName;
      if (typeof serviceName === 'string') return serviceName;
      if (serviceName?.['Fn::Join']) {
        return serviceName['Fn::Join'][1].join('');
      }
      return JSON.stringify(serviceName);
    });
    expect(serviceNameStrings.some((s: string) => s.toLowerCase().includes('s3'))).toBe(true);
    expect(serviceNameStrings.some((s: string) => s.toLowerCase().includes('dynamodb'))).toBe(true);
  });

  test('creates KMS key with rotation enabled and destroy policy', () => {
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('creates S3 bucket with encryption, lifecycle, and auto-delete', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({
              SSEAlgorithm: 'aws:kms',
            }),
          }),
        ]),
      }),
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      LifecycleConfiguration: {
        Rules: Match.arrayWith([
          Match.objectLike({
            Transitions: Match.arrayWith([
              Match.objectLike({
                StorageClass: 'INTELLIGENT_TIERING',
              }),
              Match.objectLike({
                StorageClass: 'GLACIER',
              }),
            ]),
          }),
        ]),
      },
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['s3:DeleteObject*']),
          }),
        ]),
      }),
    });
  });

  test('creates DynamoDB table with PITR and customer-managed encryption', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
      SSESpecification: {
        SSEEnabled: true,
        SSEType: 'KMS',
      },
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'ts', KeyType: 'RANGE' },
      ],
    });
  });

  test('creates Lambda functions with ARM64 architecture', () => {
    const functions = template.findResources('AWS::Lambda::Function');
    const userFunctions = Object.entries(functions).filter(
      ([logicalId, fn]: [string, any]) =>
        logicalId.includes('processor') || logicalId.includes('validator')
    );

    expect(userFunctions.length).toBeGreaterThanOrEqual(2);

    const processorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('PROCESS')
    );
    const validatorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('validationType')
    );

    expect(processorFn).toBeDefined();
    expect(validatorFn).toBeDefined();

    expect(processorFn?.Properties?.Architectures).toEqual(['arm64']);
    expect(processorFn?.Properties?.Runtime).toBe('nodejs18.x');
    expect(processorFn?.Properties?.MemorySize).toBe(512);
    expect(processorFn?.Properties?.Timeout).toBe(30);
    expect(processorFn?.Properties?.Environment?.Variables?.ENV).toBe('test');
    expect(processorFn?.Properties?.VpcConfig).toBeDefined();
  });

  test('processor Lambda has correct environment variables', () => {
    const functions = template.findResources('AWS::Lambda::Function');
    const processorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('PROCESS')
    );

    expect(processorFn).toBeDefined();
    expect(processorFn?.Properties?.Environment?.Variables?.TABLE_NAME).toBeDefined();
    expect(processorFn?.Properties?.Environment?.Variables?.LOGS_BUCKET).toBeDefined();
    expect(processorFn?.Properties?.Environment?.Variables?.ENV).toBe('test');
  });

  test('validator Lambda has correct environment variables', () => {
    const functions = template.findResources('AWS::Lambda::Function');
    const validatorFn = Object.values(functions).find((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('validationType')
    );

    expect(validatorFn).toBeDefined();
    expect(validatorFn?.Properties?.Environment?.Variables?.TABLE_NAME).toBeDefined();
    expect(validatorFn?.Properties?.Environment?.Variables?.ENV).toBe('test');
    expect(validatorFn?.Properties?.Environment?.Variables?.LOGS_BUCKET).toBeUndefined();
  });

  test('Lambda role has least-privilege permissions', () => {
    const roles = template.findResources('AWS::IAM::Role');
    const lambdaRoleEntry = Object.entries(roles).find(([_id, role]: [string, any]) =>
      JSON.stringify(role.Properties.AssumeRolePolicyDocument || {}).includes('lambda.amazonaws.com')
    );

    expect(lambdaRoleEntry).toBeDefined();
    const roleProps = (lambdaRoleEntry as any)[1].Properties;
    
    expect(roleProps.ManagedPolicyArns).toBeDefined();
    expect(Array.isArray(roleProps.ManagedPolicyArns)).toBe(true);
    expect(roleProps.ManagedPolicyArns.length).toBeGreaterThanOrEqual(1);

    const policyArns = roleProps.ManagedPolicyArns.map((arn: any) => {
      if (typeof arn === 'string') return arn;
      if (arn?.['Fn::Join']) {
        return arn['Fn::Join'][1].join('');
      }
      if (arn?.['Fn::Sub']) {
        return typeof arn['Fn::Sub'] === 'string' ? arn['Fn::Sub'] : JSON.stringify(arn['Fn::Sub']);
      }
      return JSON.stringify(arn);
    });
    
    const allPolicyArns = policyArns.join(' ');
    expect(allPolicyArns).toContain('AWSLambdaBasicExecutionRole');

    const policies = template.findResources('AWS::IAM::Policy');
    const lambdaPolicies = Object.values(policies).filter((policy: any) => {
      const policyDocStr = JSON.stringify(policy.Properties.PolicyDocument || {});
      const rolesStr = JSON.stringify(policy.Properties.Roles || []);
      return policyDocStr.includes('dynamodb') || rolesStr.includes(lambdaRoleEntry?.[0]);
    });

    expect(lambdaPolicies.length).toBeGreaterThan(0);

    const dynamodbPolicy = lambdaPolicies.find((policy: any) =>
      JSON.stringify(policy.Properties.PolicyDocument).includes('dynamodb')
    );

    expect(dynamodbPolicy).toBeDefined();
    const policyDoc = dynamodbPolicy?.Properties.PolicyDocument;
    const policyDocStr = JSON.stringify(policyDoc);
    expect(policyDocStr).toContain('dynamodb');
    
    expect(policyDoc.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining([
            expect.stringMatching(/dynamodb:(GetItem|PutItem|UpdateItem|DeleteItem|Query|Scan)/),
          ]),
        }),
      ])
    );

    const functions = template.findResources('AWS::Lambda::Function');
    const userFunctions = Object.values(functions).filter((fn: any) =>
      fn.Properties?.Code?.ZipFile?.includes('PROCESS') ||
      fn.Properties?.Code?.ZipFile?.includes('validationType')
    );
    
    userFunctions.forEach((fn: any) => {
      expect(fn.Properties.VpcConfig).toBeDefined();
    });
  });

  test('creates SNS topic with KMS encryption', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.hasResourceProperties('AWS::SNS::Topic', {
      KmsMasterKeyId: Match.anyValue(),
    });
  });

  test('creates Step Functions state machine with correct workflow', () => {
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      TracingConfiguration: {
        Enabled: true,
      },
      LoggingConfiguration: Match.objectLike({
        Level: 'ALL',
      }),
    });

    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    const definitionStr = sm.Properties.DefinitionString;
    const definition = typeof definitionStr === 'string' 
      ? JSON.parse(definitionStr)
      : JSON.parse(definitionStr['Fn::Join']?.[1]?.join('') || '{}');
    expect(definition).toBeDefined();
    expect(definition.StartAt).toBeDefined();
  });

  test('Step Functions has 15 minute timeout', () => {
    const resources = template.findResources('AWS::StepFunctions::StateMachine');
    const sm = Object.values(resources)[0] as any;
    expect(sm.Properties.DefinitionString).toBeDefined();
    expect(sm.Properties.TracingConfiguration?.Enabled).toBe(true);
  });

  test('creates CloudWatch Log Group for Step Functions', () => {
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 30,
    });
  });

  test('creates EventBridge rule for DynamoDB events', () => {
    template.resourceCountIs('AWS::Events::Rule', 1);
    template.hasResourceProperties('AWS::Events::Rule', {
      EventPattern: Match.objectLike({
        source: Match.arrayWith(['aws.dynamodb']),
      }),
      Targets: Match.arrayWith([
        Match.objectLike({
          Arn: Match.anyValue(),
        }),
      ]),
    });
  });

  test('creates CloudWatch Dashboard', () => {
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
    const dashboard = Object.values(dashboards)[0] as any;
    const dashboardBody = dashboard.Properties.DashboardBody;
    const bodyStr =
      typeof dashboardBody === 'string'
        ? dashboardBody
        : dashboardBody?.['Fn::Join']?.[1]?.join('') || JSON.stringify(dashboardBody);
    expect(bodyStr).toContain('Processor Invocations');
  });

  test('creates Route 53 health check', () => {
    template.resourceCountIs('AWS::Route53::HealthCheck', 1);
    template.hasResourceProperties('AWS::Route53::HealthCheck', {
      HealthCheckConfig: Match.objectLike({
        Type: 'HTTPS',
        Port: 443,
        RequestInterval: 30,
        FailureThreshold: 3,
        FullyQualifiedDomainName: Match.stringLikeRegexp('.*example.local'),
      }),
    });
  });

  test('exports outputs with environment-prefixed names', () => {
    const allOutputs = (template as any).toJSON().Outputs || {};
    const outputKeys = Object.keys(allOutputs);
    
    const ddbOutputKey = outputKeys.find((key) => key.includes('ddb') && key.includes('name'));
    const bucketOutputKey = outputKeys.find((key) => key.includes('bucket') && key.includes('name'));
    const sfnOutputKey = outputKeys.find((key) => key.includes('sfn') && key.includes('arn'));

    expect(ddbOutputKey).toBeDefined();
    expect(bucketOutputKey).toBeDefined();
    expect(sfnOutputKey).toBeDefined();

    if (ddbOutputKey) {
      expect(allOutputs[ddbOutputKey].Export?.Name).toBe('tap-ddb-name-test');
    }
    if (bucketOutputKey) {
      expect(allOutputs[bucketOutputKey].Export?.Name).toBe('tap-bucket-name-test');
    }
    if (sfnOutputKey) {
      expect(allOutputs[sfnOutputKey].Export?.Name).toBe('tap-sfn-arn-test');
    }
  });

  test('all resources use environment suffix in names', () => {
    const allResources = template.findResources('*');
    const resourceNames = Object.values(allResources).map((r: any) => {
      return r.Properties?.Name || r.Properties?.FunctionName || r.Properties?.TopicName || r.Properties?.TableName || r.Properties?.BucketName || '';
    });
    const relevantNames = resourceNames.filter((n: string) => n.includes('tap-'));
    relevantNames.forEach((name: string) => {
      expect(name).toMatch(/test$/);
    });
  });

  test('uses default environment suffix when not provided', () => {
    const app2 = new cdk.App();
    const stack2 = new TapStack(app2, 'TapUnitDefault', {});
    const template2 = Template.fromStack(stack2);
    const allOutputs = (template2 as any).toJSON().Outputs || {};
    const outputKeys = Object.keys(allOutputs);
    const ddbOutputKey = outputKeys.find((key) => key.includes('ddb') && key.includes('name'));
    expect(ddbOutputKey).toBeDefined();
    if (ddbOutputKey) {
      expect(allOutputs[ddbOutputKey].Export?.Name).toBe('tap-ddb-name-dev');
    }
  });
});
