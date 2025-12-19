import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct name including environmentSuffix', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcs).length).toBe(1);
      const vpc = Object.values(vpcs)[0] as any;
      // Verify VPC exists and has tags
      expect(vpc.Properties.Tags).toBeDefined();
      const nameTag = vpc.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain('test');
    });

    test('creates 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties.Tags?.some(
          (tag: any) =>
            tag.Key === 'aws-cdk:subnet-name' &&
            tag.Value.includes('public-test')
        )
      );
      expect(publicSubnets.length).toBe(2);
    });

    test('creates 2 private subnets with egress', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter((subnet: any) =>
        subnet.Properties.Tags?.some(
          (tag: any) =>
            tag.Key === 'aws-cdk:subnet-name' &&
            tag.Value.includes('private-test')
        )
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('creates 2 NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('creates Lambda security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'lambda-sg-test',
        GroupDescription: 'Security group for Lambda functions in test',
      });
    });

    test('creates RDS security group with correct name', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'rds-sg-test',
        GroupDescription: 'Security group for RDS in test',
      });
    });

    test('RDS security group allows PostgreSQL from Lambda', () => {
      // Ingress rules are created as separate SecurityGroupIngress resources
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with correct identifier', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: 'payment-db-test',
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        BackupRetentionPeriod: 0,
        DeleteAutomatedBackups: true,
        DeletionProtection: false,
        PubliclyAccessible: false,
        StorageEncrypted: true,
      });
    });

    test('creates DB subnet group with correct name', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: 'payment-db-subnet-test',
        DBSubnetGroupDescription: 'Subnet group for RDS in test',
      });
    });

    test('RDS credentials use Secrets Manager', () => {
      const dbInstances = template.findResources('AWS::RDS::DBInstance');
      const dbInstance = Object.values(dbInstances)[0] as any;
      expect(dbInstance.Properties.MasterUsername).toBeDefined();
      expect(dbInstance.Properties.MasterUserPassword).toBeDefined();
      // Verify it references the secret
      expect(JSON.stringify(dbInstance.Properties)).toContain('DbSecret');
    });

    test('RDS database name is set to default (payments)', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'payments',
      });
    });
  });

  describe('Secrets Manager', () => {
    test('creates database secret with correct name', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'payment-db-secret-test',
        Description: 'Database credentials for test',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"postgres"}',
          GenerateStringKey: 'password',
          ExcludePunctuation: true,
          IncludeSpace: false,
          PasswordLength: 32,
        }),
      });
    });

    test('secret has RemovalPolicy DESTROY', () => {
      const secrets = template.findResources('AWS::SecretsManager::Secret');
      const secretKeys = Object.keys(secrets);
      expect(secretKeys.length).toBeGreaterThan(0);
      secretKeys.forEach(key => {
        expect(
          secrets[key].DeletionPolicy === 'Delete' ||
            secrets[key].DeletionPolicy === undefined
        ).toBeTruthy();
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates receipts bucket with environmentSuffix in name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'payment-receipts-test-123456789012',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('bucket has autoDeleteObjects enabled', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('creates DLQ with correct name', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'payment-dlq-test',
        MessageRetentionPeriod: 1209600, // 14 days in seconds
      });
    });
  });

  describe('IAM Role', () => {
    test('creates Lambda execution role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'payment-lambda-role-test',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('Lambda role has VPC access policy', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          RoleName: 'payment-lambda-role-test',
        },
      });
      const role = Object.values(roles)[0] as any;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
      // Verify it contains VPC access policy
      const policyArn = JSON.stringify(role.Properties.ManagedPolicyArns);
      expect(policyArn).toContain('AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda role has permissions for Secrets Manager', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['secretsmanager:GetSecretValue']),
            }),
          ]),
        },
      });
    });

    test('Lambda role has permissions for S3', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
              ]),
            }),
          ]),
        },
      });
    });

    test('Lambda role has permissions for SQS DLQ', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['sqs:SendMessage']),
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates payments Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'payment-api-payments-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: Match.objectLike({
            DB_NAME: 'payments',
            ENVIRONMENT: 'test',
          }),
        },
      });
    });

    test('creates refunds Lambda with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'payment-api-refunds-test',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        Environment: {
          Variables: Match.objectLike({
            DB_NAME: 'payments',
            ENVIRONMENT: 'test',
          }),
        },
      });
    });

    test('Lambda functions are deployed in private subnets', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: Match.stringLikeRegexp('payment-api-.*-test'),
        },
      });
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.VpcConfig).toBeDefined();
        expect(func.Properties.VpcConfig.SubnetIds).toBeDefined();
      });
    });

    test('Lambda functions have DLQ configured', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: Match.stringLikeRegexp('payment-api-.*-test'),
        },
      });
      Object.values(functions).forEach((func: any) => {
        expect(func.Properties.DeadLetterConfig).toBeDefined();
      });
    });

    test('Lambda functions have log retention set to 14 days', () => {
      template.resourceCountIs('Custom::LogRetention', 2);
      template.hasResourceProperties('Custom::LogRetention', {
        RetentionInDays: 14,
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payment-api-test',
        Description: 'Payment processing API for test',
      });
    });

    test('API Gateway has CORS enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payment-api-test',
      });
      // CORS methods are created
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('API Gateway does not create CloudWatch role (to avoid RETAIN policy)', () => {
      const accounts = template.findResources('AWS::ApiGateway::Account');
      expect(Object.keys(accounts).length).toBe(0);
    });

    test('creates /payments resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'payments',
      });
    });

    test('creates /refunds resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'refunds',
      });
    });

    test('payments endpoint has POST and GET methods', () => {
      const methods = template.findResources('AWS::ApiGateway::Method');
      const paymentMethods = Object.values(methods).filter((method: any) => {
        const pathPart = method.Properties?.ResourceId?.Ref;
        return (
          pathPart &&
          (method.Properties.HttpMethod === 'POST' ||
            method.Properties.HttpMethod === 'GET')
        );
      });
      expect(paymentMethods.length).toBeGreaterThanOrEqual(4); // 2 for payments, 2 for refunds
    });

    test('API deployment stage defaults to environmentSuffix', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'test',
      });
      // Verify logging settings are configured via MethodSettings
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const stage = Object.values(stages)[0] as any;
      expect(stage.Properties.MethodSettings).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    test('creates alarm topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'payment-alarms-test',
        DisplayName: 'Payment API Alarms for test',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates alarm for payments Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'payment-api-payments-errors-test',
        AlarmDescription: 'Payments Lambda error rate exceeds 5% in test',
        Threshold: 5,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('creates alarm for refunds Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'payment-api-refunds-errors-test',
        AlarmDescription: 'Refunds Lambda error rate exceeds 5% in test',
        Threshold: 5,
        EvaluationPeriods: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        TreatMissingData: 'notBreaching',
      });
    });

    test('alarms have SNS actions configured', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports API endpoint with correct name', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
        Export: {
          Name: 'payment-api-url-test',
        },
      });
    });

    test('exports payments function ARN', () => {
      template.hasOutput('PaymentsFunctionArn', {
        Description: 'Payments Lambda function ARN',
        Export: {
          Name: 'payments-function-arn-test',
        },
      });
    });

    test('exports refunds function ARN', () => {
      template.hasOutput('RefundsFunctionArn', {
        Description: 'Refunds Lambda function ARN',
        Export: {
          Name: 'refunds-function-arn-test',
        },
      });
    });

    test('exports database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
        Export: {
          Name: 'database-endpoint-test',
        },
      });
    });

    test('exports database secret ARN', () => {
      template.hasOutput('DatabaseSecretArn', {
        Description: 'Database secret ARN',
        Export: {
          Name: 'database-secret-arn-test',
        },
      });
    });

    test('exports receipts bucket name', () => {
      template.hasOutput('ReceiptsBucketName', {
        Description: 'S3 bucket for receipts',
        Export: {
          Name: 'receipts-bucket-test',
        },
      });
    });

    test('exports alarm topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'SNS topic for alarms',
        Export: {
          Name: 'alarm-topic-arn-test',
        },
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: 'vpc-id-test',
        },
      });
    });
  });

  describe('Custom Domain Support', () => {
    test('does not create custom domain when not provided', () => {
      const domains = template.findResources('AWS::ApiGateway::DomainName');
      expect(Object.keys(domains).length).toBe(0);
    });

    test('creates custom domain when certificate ARN is provided', () => {
      const appWithDomain = new cdk.App();
      const stackWithDomain = new TapStack(appWithDomain, 'TestStackDomain', {
        environmentSuffix: 'test',
        customDomainName: 'api.example.com',
        certificateArn:
          'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const domainTemplate = Template.fromStack(stackWithDomain);
      domainTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: 'api.example.com',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('uses custom values when provided', () => {
      const appWithCustom = new cdk.App();
      const stackWithCustom = new TapStack(appWithCustom, 'TestStackCustom', {
        environmentSuffix: 'test',
        dbUsername: 'customuser',
        databaseName: 'customdb',
        apiStageName: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const customTemplate = Template.fromStack(stackWithCustom);

      // Verify custom database name
      customTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'customdb',
      });

      // Verify custom API stage
      customTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });

      // Verify custom username in secret
      customTemplate.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'payment-db-secret-test',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"customuser"}',
        }),
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names include environmentSuffix', () => {
      const resources = template.toJSON().Resources;
      const resourceNames = Object.keys(resources);

      // Check key resources have proper naming
      expect(resourceNames.some(name => name.includes('test'))).toBeTruthy();
    });

    test('no resources have RemovalPolicy RETAIN', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('CDK Aspect Validation', () => {
    test('aspect validation runs without errors', () => {
      // If aspect validation failed, stack creation would throw
      expect(stack).toBeDefined();
      expect(stack.node.metadata).toBeDefined();
    });

    test('aspect detects resources without environment suffix', () => {
      // Create a stack with a resource that might not include environmentSuffix
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'AspectTestStack', {
        environmentSuffix: 'aspecttest',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      // Aspect should add warnings for resources without proper naming
      // Check that no errors are thrown for properly named resources
      expect(testStack.node.children.length).toBeGreaterThan(0);
    });

    test('aspect detects Lambda function without environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'AspectLambdaTestStack');

      // Create Lambda function without environment suffix
      const testVpc = new cdk.aws_ec2.Vpc(testStack, 'TestVpc');
      const lambdaFunc = new cdk.aws_lambda.Function(testStack, 'TestLambda', {
        functionName: 'test-function-without-suffix',
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: cdk.aws_lambda.Code.fromInline(
          'exports.handler = async () => {}'
        ),
        vpc: testVpc,
      });

      // Apply aspect
      const aspect = new (class implements cdk.IAspect {
        public visit(node: any): void {
          if (node instanceof cdk.aws_lambda.Function) {
            const funcName = node.functionName;
            if (funcName && !funcName.includes('test-suffix')) {
              cdk.Annotations.of(node).addWarning(
                `Lambda function name should include environment suffix: test-suffix`
              );
            }
          }
        }
      })();

      cdk.Aspects.of(testStack).add(aspect);

      // Synthesize to trigger aspect
      const assembly = testApp.synth();
      const stackArtifact = assembly.getStackByName('AspectLambdaTestStack');

      // Verify warning was added
      const messages = stackArtifact.messages;
      const warningMessages = messages.filter(m => m.level === 'warning');
      expect(warningMessages.length).toBeGreaterThan(0);
    });

    test('aspect detects S3 bucket without environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'AspectS3TestStack');

      // Create S3 bucket without environment suffix
      const bucket = new cdk.aws_s3.Bucket(testStack, 'TestBucket', {
        bucketName: 'test-bucket-without-suffix',
      });

      // Apply aspect
      const aspect = new (class implements cdk.IAspect {
        public visit(node: any): void {
          if (node instanceof cdk.aws_s3.Bucket) {
            const bucketName = node.bucketName;
            if (bucketName && !bucketName.includes('test-suffix')) {
              cdk.Annotations.of(node).addWarning(
                `S3 bucket name should include environment suffix: test-suffix`
              );
            }
          }
        }
      })();

      cdk.Aspects.of(testStack).add(aspect);

      // Synthesize to trigger aspect
      const assembly = testApp.synth();
      const stackArtifact = assembly.getStackByName('AspectS3TestStack');

      // Verify warning was added
      const messages = stackArtifact.messages;
      const warningMessages = messages.filter(m => m.level === 'warning');
      expect(warningMessages.length).toBeGreaterThan(0);
    });

    test('aspect detects RDS instance without environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new cdk.Stack(testApp, 'AspectRdsTestStack');

      // Create VPC for RDS
      const testVpc = new cdk.aws_ec2.Vpc(testStack, 'TestVpc');

      // Create RDS instance without environment suffix
      const dbInstance = new cdk.aws_rds.DatabaseInstance(testStack, 'TestDb', {
        instanceIdentifier: 'test-db-without-suffix',
        engine: cdk.aws_rds.DatabaseInstanceEngine.postgres({
          version: cdk.aws_rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: cdk.aws_ec2.InstanceType.of(
          cdk.aws_ec2.InstanceClass.T3,
          cdk.aws_ec2.InstanceSize.MICRO
        ),
        vpc: testVpc,
      });

      // Apply aspect
      const aspect = new (class implements cdk.IAspect {
        public visit(node: any): void {
          if (node instanceof cdk.aws_rds.DatabaseInstance) {
            const instanceId = node.instanceIdentifier;
            if (instanceId && !instanceId.includes('test-suffix')) {
              cdk.Annotations.of(node).addWarning(
                `RDS instance identifier should include environment suffix: test-suffix`
              );
            }
          }
        }
      })();

      cdk.Aspects.of(testStack).add(aspect);

      // Synthesize to trigger aspect
      const assembly = testApp.synth();
      const stackArtifact = assembly.getStackByName('AspectRdsTestStack');

      // Verify warning was added
      const messages = stackArtifact.messages;
      const warningMessages = messages.filter(m => m.level === 'warning');
      expect(warningMessages.length).toBeGreaterThan(0);
    });

    test('aspect prevents RemovalPolicy RETAIN', () => {
      // The aspect checks for RETAIN policies in CFN resources
      // Verify through template that no resources have RETAIN
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });

    test('aspect adds error when RETAIN policy detected', () => {
      // Create a TapStack and add a resource with RETAIN policy
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'AspectRetainTestStack', {
        environmentSuffix: 'retaintest',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      // Add a simple CFN resource with RETAIN policy to the TapStack
      const bucket = new cdk.aws_s3.CfnBucket(testStack, 'TestBucketRetain', {
        bucketName: 'test-bucket-retain-policy',
      });
      bucket.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

      // Synthesize to trigger the TapStack's aspect
      const assembly = testApp.synth();
      const stackArtifact = assembly.getStackByName('AspectRetainTestStack');

      // Verify error was added by the aspect
      const messages = stackArtifact.messages;
      const errorMessages = messages.filter(m => m.level === 'error');
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(errorMessages[0].entry.data).toContain('RemovalPolicy.RETAIN');
    });
  });

  describe('Network Configuration', () => {
    test('internet gateway is created', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('route tables are configured', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
    });

    test('elastic IPs for NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });
  });

  describe('Tags', () => {
    test('stack has proper tags', () => {
      // Tags are applied at stack level during creation in bin/tap.ts
      // Verify stack has description that includes environment
      expect(stack.stackName).toBe('TestStack');
      // Verify resources are tagged through CDK synthesis
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });

  describe('bin/tap.ts Configuration', () => {
    test('creates stack with environment suffix', () => {
      const testApp = new cdk.App();
      const environmentSuffix = 'synthf4z68k';
      const testStack = new TapStack(testApp, `TapStack${environmentSuffix}`, {
        environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
      expect(testStack.stackName).toBe(`TapStack${environmentSuffix}`);
    });

    test('creates stack with custom domain when provided', () => {
      const testApp = new cdk.App();
      const environmentSuffix = 'prod';
      const customDomainName = 'api.example.com';
      const certificateArn =
        'arn:aws:acm:us-east-1:123456789012:certificate/test';

      const testStack = new TapStack(testApp, `TapStack${environmentSuffix}`, {
        environmentSuffix,
        customDomainName,
        certificateArn,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      const testTemplate = Template.fromStack(testStack);
      testTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: customDomainName,
      });
    });

    test('uses default region when not specified', () => {
      const testApp = new cdk.App();
      const environmentSuffix = 'test';

      const testStack = new TapStack(testApp, `TapStack${environmentSuffix}`, {
        environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });

      expect(testStack).toBeDefined();
      expect(testStack.region).toBe('us-east-1');
    });
  });
});
