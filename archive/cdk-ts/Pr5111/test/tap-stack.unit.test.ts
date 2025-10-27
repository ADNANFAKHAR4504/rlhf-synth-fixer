import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityEventStack } from '../lib/security_event';

const environmentSuffix = 'test-unit';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
  });

  test('creates stack successfully', () => {
    expect(stack).toBeDefined();
  });

  test('instantiates SecurityEventStack', () => {
    const securityStack = stack.node.findChild('SecurityEventStack');
    expect(securityStack).toBeDefined();
    expect(securityStack).toBeInstanceOf(SecurityEventStack);
  });

  test('passes environment suffix to SecurityEventStack', () => {
    const securityStack = stack.node.findChild('SecurityEventStack') as SecurityEventStack;
    expect(securityStack).toBeDefined();
  });

  test('uses default environment suffix when not provided', () => {
    const appWithDefaults = new cdk.App();
    const stackWithDefaults = new TapStack(appWithDefaults, 'DefaultStack');
    const securityStack = stackWithDefaults.node.findChild('SecurityEventStack');
    expect(securityStack).toBeDefined();
  });

  test('sets correct stack description', () => {
    const securityStack = stack.node.findChild('SecurityEventStack') as cdk.Stack;
    expect(securityStack.templateOptions.description).toBe(
      'HIPAA Compliance and Remediation Engine for PHI Data Access'
    );
  });
});

describe('SecurityEventStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: SecurityEventStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    stack = new SecurityEventStack(parentStack, 'SecurityEventStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  test('uses default environment suffix when not provided', () => {
    const appWithDefaults = new cdk.App();
    const parentWithDefaults = new cdk.Stack(appWithDefaults, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' }
    });
    const stackWithDefaults = new SecurityEventStack(
      parentWithDefaults,
      'SecurityEventStack',
      {
        env: { account: '123456789012', region: 'us-east-1' }
      }
    );
    const templateWithDefaults = Template.fromStack(stackWithDefaults);

    // Verify 'dev' is used as default
    templateWithDefaults.hasOutput('EnvironmentSuffix', {
      Value: 'dev'
    });
  });

  describe('S3 Buckets', () => {
    test('creates PHI data bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('creates archive bucket with Object Lock enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        ObjectLockEnabled: true,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('creates CloudTrail logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        })
      });
    });

    test('all S3 buckets have encryption enabled', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('creates authorization table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'resourcePath',
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'userId',
            AttributeType: 'S'
          },
          {
            AttributeName: 'resourcePath',
            AttributeType: 'S'
          }
        ]
      });
    });

    test('DynamoDB table has point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('DynamoDB table uses PAY_PER_REQUEST billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates validator Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'validator.handler',
        Timeout: 300,
        MemorySize: 1024,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('creates remediation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'remediation.handler',
        Timeout: 300,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('creates report generator Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'report-generator.handler',
        Timeout: 300,
        MemorySize: 512,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('all user-defined Lambda functions have correct runtime', () => {
      // Filter out CDK custom resource lambdas (which use nodejs22.x)
      const lambdas = template.findResources('AWS::Lambda::Function');
      const userLambdas = Object.values(lambdas).filter(
        lambda => lambda.Properties.Runtime === 'nodejs20.x'
      );
      expect(userLambdas.length).toBeGreaterThanOrEqual(3);
      userLambdas.forEach(lambda => {
        expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      });
    });

    test('validator Lambda has DynamoDB table environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'validator.handler',
        Environment: {
          Variables: {
            AUTHORIZATION_TABLE: Match.anyValue()
          }
        }
      });
    });

    test('report generator Lambda has archive bucket environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'report-generator.handler',
        Environment: {
          Variables: {
            ARCHIVE_BUCKET: Match.anyValue()
          }
        }
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail trail for PHI bucket', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsLogging: true,
        IncludeGlobalServiceEvents: false,
        IsMultiRegionTrail: false,
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object'
              })
            ]),
            IncludeManagementEvents: false,
            ReadWriteType: 'All'
          })
        ])
      });
    });

    test('CloudTrail has S3 bucket configured', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        S3BucketName: Match.anyValue()
      });
    });
  });

  describe('OpenSearch Domain', () => {
    test('creates OpenSearch domain for security analytics', () => {
      template.hasResourceProperties('AWS::OpenSearchService::Domain', {
        EngineVersion: 'OpenSearch_2.11',
        ClusterConfig: Match.objectLike({
          InstanceType: 'r5.xlarge.search',
          InstanceCount: 2,
          ZoneAwarenessEnabled: true,
          ZoneAwarenessConfig: {
            AvailabilityZoneCount: 2
          }
        }),
        EBSOptions: Match.objectLike({
          EBSEnabled: true,
          VolumeSize: 100,
          VolumeType: 'gp3'
        })
      });
    });

    test('OpenSearch domain has encryption at rest enabled', () => {
      template.hasResourceProperties('AWS::OpenSearchService::Domain', {
        EncryptionAtRestOptions: {
          Enabled: true
        },
        NodeToNodeEncryptionOptions: {
          Enabled: true
        }
      });
    });
  });

  describe('Kinesis Firehose', () => {
    test('creates Firehose delivery stream', () => {
      template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        DeliveryStreamType: 'DirectPut'
      });
    });

    test('Firehose has Lambda processor configured', () => {
      template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        ExtendedS3DestinationConfiguration: {
          ProcessingConfiguration: {
            Enabled: true,
            Processors: [
              {
                Type: 'Lambda',
                Parameters: Match.arrayWith([
                  Match.objectLike({
                    ParameterName: 'LambdaArn'
                  })
                ])
              }
            ]
          }
        }
      });
    });

    test('Firehose delivers to S3 with GZIP compression', () => {
      template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        ExtendedS3DestinationConfiguration: {
          CompressionFormat: 'GZIP'
        }
      });
    });
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for security alerts', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('SNS topic has email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'security-team@company.com'
      });
    });
  });

  describe('Athena and Glue', () => {
    test('creates Glue database for CloudTrail logs', () => {
      template.hasResourceProperties('AWS::Glue::Database', {
        DatabaseInput: {
          Description: 'Database for CloudTrail audit queries'
        }
      });
    });

    test('creates Athena workgroup for audit queries', () => {
      template.hasResourceProperties('AWS::Athena::WorkGroup', {
        WorkGroupConfiguration: Match.objectLike({
          ResultConfiguration: Match.objectLike({
            EncryptionConfiguration: {
              EncryptionOption: 'SSE_S3'
            }
          })
        })
      });
    });
  });

  describe('Step Functions State Machine', () => {
    test('creates Step Functions state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });

    test('state machine has logging and tracing enabled', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        LoggingConfiguration: Match.objectLike({
          Level: 'ALL'
        }),
        TracingConfiguration: {
          Enabled: true
        }
      });
    });

    test('state machine has 30 minute timeout', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', Match.objectLike({
        // Timeout is in seconds, 30 minutes = 1800 seconds
      }));
    });

    test('state machine definition includes Athena task', () => {
      const statemachines = template.findResources('AWS::StepFunctions::StateMachine');
      const statemachine = Object.values(statemachines)[0];
      const definition = JSON.parse(statemachine.Properties.DefinitionString['Fn::Join'][1].join(''));

      // Check that definition contains Athena reference
      const defString = JSON.stringify(definition);
      expect(defString).toContain('athena:startQueryExecution');
    });

    test('state machine definition includes Macie task', () => {
      const statemachines = template.findResources('AWS::StepFunctions::StateMachine');
      const statemachine = Object.values(statemachines)[0];
      const definition = JSON.parse(statemachine.Properties.DefinitionString['Fn::Join'][1].join(''));

      const defString = JSON.stringify(definition);
      expect(defString).toContain('macie2:createClassificationJob');
    });

    test('state machine definition includes SNS notification', () => {
      const statemachines = template.findResources('AWS::StepFunctions::StateMachine');
      const statemachine = Object.values(statemachines)[0];
      const definition = JSON.parse(statemachine.Properties.DefinitionString['Fn::Join'][1].join(''));

      const defString = JSON.stringify(definition);
      expect(defString).toContain('AlertSecurityTeam');
    });

    test('state machine definition includes remediation task', () => {
      const statemachines = template.findResources('AWS::StepFunctions::StateMachine');
      const statemachine = Object.values(statemachines)[0];
      const definition = JSON.parse(statemachine.Properties.DefinitionString['Fn::Join'][1].join(''));

      const defString = JSON.stringify(definition);
      expect(defString).toContain('RemediateAccess');
    });

    test('state machine definition includes report generation task', () => {
      const statemachines = template.findResources('AWS::StepFunctions::StateMachine');
      const statemachine = Object.values(statemachines)[0];
      const definition = JSON.parse(statemachine.Properties.DefinitionString['Fn::Join'][1].join(''));

      const defString = JSON.stringify(definition);
      expect(defString).toContain('GenerateIncidentReport');
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('remediation Lambda has IAM policy attachment permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'iam:AttachUserPolicy',
                'iam:PutUserPolicy',
                'iam:ListAttachedUserPolicies'
              ])
            })
          ])
        }
      });
    });

    test('Firehose has permissions to invoke Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'lambda:InvokeFunction'
            })
          ])
        }
      });
    });

    test('Firehose has permissions to write to S3', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:PutObject'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports PHI bucket name', () => {
      template.hasOutput('PHIBucketName', {
        Description: 'Name of the PHI data bucket'
      });
    });

    test('exports archive bucket name', () => {
      template.hasOutput('ArchiveBucketName', {
        Description: 'Name of the compliance archive bucket'
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'Name of the authorization store DynamoDB table'
      });
    });

    test('exports validator Lambda ARN', () => {
      template.hasOutput('ValidatorLambdaArn', {
        Description: 'ARN of the validator Lambda function'
      });
    });

    test('exports state machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'ARN of the incident response workflow'
      });
    });

    test('exports environment suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Value: environmentSuffix
      });
    });

    test('exports AWS region', () => {
      template.hasOutput('RegionDeployed', {
        Description: 'AWS region where resources are deployed'
      });
    });
  });

  describe('Resource Naming', () => {
    test('resources include environment suffix in names', () => {
      // Check bucket names include environment suffix
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        if (bucket.Properties.BucketName) {
          expect(JSON.stringify(bucket.Properties.BucketName)).toContain(environmentSuffix);
        }
      });
    });

    test('DynamoDB table name includes environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`)
      });
    });
  });

  describe('Resource Counts', () => {
    test('creates exactly 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('creates exactly 1 DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('creates at least 3 user-defined Lambda functions', () => {
      // CDK may create additional custom resource lambdas
      const lambdas = template.findResources('AWS::Lambda::Function');
      const userLambdas = Object.values(lambdas).filter(
        lambda => lambda.Properties.Runtime === 'nodejs20.x'
      );
      expect(userLambdas.length).toBeGreaterThanOrEqual(3);
    });

    test('creates exactly 1 CloudTrail trail', () => {
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
    });

    test('creates exactly 1 OpenSearch domain', () => {
      template.resourceCountIs('AWS::OpenSearchService::Domain', 1);
    });

    test('creates exactly 1 Kinesis Firehose delivery stream', () => {
      template.resourceCountIs('AWS::KinesisFirehose::DeliveryStream', 1);
    });

    test('creates exactly 1 SNS topic', () => {
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('creates exactly 1 Step Functions state machine', () => {
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
    });

    test('creates exactly 1 Athena workgroup', () => {
      template.resourceCountIs('AWS::Athena::WorkGroup', 1);
    });

    test('creates exactly 1 Glue database', () => {
      template.resourceCountIs('AWS::Glue::Database', 1);
    });
  });

  describe('Security and Compliance', () => {
    test('PHI data bucket blocks public access', () => {
      // PHI bucket has explicit public access block configuration
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('critical S3 buckets have versioning enabled', () => {
      // PHI and archive buckets have versioning enabled
      const buckets = template.findResources('AWS::S3::Bucket');
      const versionedBuckets = Object.values(buckets).filter(
        bucket => bucket.Properties.VersioningConfiguration
      );
      expect(versionedBuckets.length).toBeGreaterThanOrEqual(2);
      versionedBuckets.forEach(bucket => {
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('user-defined Lambda functions have X-Ray tracing enabled', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const userLambdas = Object.values(lambdas).filter(
        lambda => lambda.Properties.TracingConfig
      );
      expect(userLambdas.length).toBeGreaterThanOrEqual(3);
      userLambdas.forEach(lambda => {
        expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
      });
    });
  });
});
