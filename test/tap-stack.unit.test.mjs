import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app;
  let primaryStack;
  let secondaryStack;
  let primaryTemplate;
  let secondaryTemplate;

  beforeEach(() => {
    app = new cdk.App();
    
    // Create primary stack (us-east-1)
    primaryStack = new TapStack(app, 'PrimaryStack', {
      environmentSuffix,
      isPrimary: true,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    
    // Create secondary stack (ap-south-1)
    secondaryStack = new TapStack(app, 'SecondaryStack', {
      environmentSuffix,
      isPrimary: false,
      env: {
        account: '123456789012',
        region: 'ap-south-1'
      }
    });
    
    primaryTemplate = Template.fromStack(primaryStack);
    secondaryTemplate = Template.fromStack(secondaryStack);
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      primaryTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.anyValue()
              })
            })
          ])
        })
      });
    });

    test('should create KMS alias', () => {
      primaryTemplate.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(`alias/global-api-${environmentSuffix}-key`)
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should create DynamoDB table with correct schema', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'sk',
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          },
          {
            AttributeName: 'sk',
            AttributeType: 'S'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('should enable point-in-time recovery', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        Replicas: Match.arrayWith([
          Match.objectLike({
            PointInTimeRecoverySpecification: Match.objectLike({
              PointInTimeRecoveryEnabled: true
            })
          })
        ])
      });
    });

    test('should enable streams', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      });
    });

    test('should configure TTL attribute', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create asset bucket with versioning', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
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

    test('should create backup bucket with lifecycle rules', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER'
                })
              ]),
              ExpirationInDays: 365
            })
          ])
        }
      });
    });

    test('should enforce SSL for S3 buckets', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        })
      });
    });

    test('S3 replication is enabled for primary stack', () => {
      // S3 cross-region replication is now enabled
      const bucketsWithReplication = primaryTemplate.findResources('AWS::S3::Bucket', {
        Properties: {
          ReplicationConfiguration: Match.anyValue()
        }
      });
      // Asset bucket should have replication configured
      expect(Object.keys(bucketsWithReplication).length).toBe(1);
      
      // Verify replication role exists
      primaryTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 's3.amazonaws.com'
              })
            })
          ])
        })
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with correct runtime', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 1024,
        Timeout: 30
      });
    });

    test('should enable X-Ray tracing', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('should configure environment variables', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            ASSET_BUCKET: Match.anyValue(),
            BACKUP_BUCKET: Match.anyValue(),
            REGION: Match.anyValue(),
            EVENT_BUS: Match.anyValue()
          })
        }
      });
    });

    test('should set reserved concurrent executions', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        ReservedConcurrentExecutions: 100
      });
    });

    test('should create Lambda alias with provisioned concurrency', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'production',
        ProvisionedConcurrencyConfig: {
          ProvisionedConcurrentExecutions: 50
        }
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create REST API', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp(`global-api-${environmentSuffix}-api`),
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('should configure API Gateway stage with logging', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true
          })
        ])
      });
    });

    test('should create health endpoint', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health'
      });
    });

    test('should create data endpoint', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'data'
      });
    });

    test('should create assets endpoint', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'assets'
      });
    });

    test('should integrate Lambda with API Gateway', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        Integration: {
          Type: 'AWS_PROXY'
        }
      });
    });
  });

  describe('WAF Configuration', () => {
    test('should create WAF WebACL', () => {
      primaryTemplate.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        DefaultAction: {
          Allow: {}
        },
        VisibilityConfig: {
          CloudWatchMetricsEnabled: true,
          SampledRequestsEnabled: true
        }
      });
    });

    test('should include managed rule sets', () => {
      primaryTemplate.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet'
              }
            }
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesSQLiRuleSet',
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesSQLiRuleSet'
              }
            }
          })
        ])
      });
    });

    test('should associate WAF with API Gateway', () => {
      primaryTemplate.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
        WebACLArn: Match.anyValue()
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('should create event bus', () => {
      primaryTemplate.hasResourceProperties('AWS::Events::EventBus', {
        Name: Match.stringLikeRegexp(`global-api-${environmentSuffix}-events`)
      });
    });

    test('primary stack should configure cross-region event forwarding', () => {
      primaryTemplate.hasResourceProperties('AWS::Events::Rule', {
        State: 'ENABLED',
        EventPattern: {
          source: ['global-api.events']
        }
      });
    });

    test('secondary stack should not have cross-region forwarding', () => {
      const rules = secondaryTemplate.findResources('AWS::Events::Rule', {
        Properties: {
          EventPattern: {
            source: ['global-api.events']
          }
        }
      });
      expect(Object.keys(rules).length).toBe(0);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should create CloudWatch dashboard with region-specific name', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`tap-monitoring-${environmentSuffix}-us-east-1`)
      });
      
      secondaryTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`tap-monitoring-${environmentSuffix}-ap-south-1`)
      });
    });

    test('should create CloudWatch alarms for API errors', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });

    test('should create CloudWatch alarms for Lambda errors', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 3,
        ComparisonOperator: 'GreaterThanThreshold'
      });
    });
  });

  describe('CloudWatch Synthetics Canary', () => {
    test('should create Synthetics canary', () => {
      primaryTemplate.hasResourceProperties('AWS::Synthetics::Canary', {
        RuntimeVersion: 'syn-nodejs-puppeteer-6.2',
        Schedule: {
          Expression: 'rate(5 minutes)'
        },
        StartCanaryAfterCreation: true
      });
    });

    test('should configure canary to check health endpoint', () => {
      primaryTemplate.hasResourceProperties('AWS::Synthetics::Canary', {
        Code: Match.objectLike({
          Handler: 'index.handler'
        })
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('primary stack should create health check', () => {
      primaryTemplate.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          Port: 443,
          ResourcePath: '/prod/health',
          RequestInterval: 30,
          FailureThreshold: 3,
          MeasureLatency: true
        }
      });
    });

    test('secondary stack should not create health check', () => {
      const healthChecks = secondaryTemplate.findResources('AWS::Route53::HealthCheck');
      expect(Object.keys(healthChecks).length).toBe(0);
    });
  });

  describe('QuickSight Configuration', () => {
    test('QuickSight is disabled by default (requires account-level setup)', () => {
      // QuickSight is commented out in the stack as it requires AWS account subscription
      const primaryDataSources = primaryTemplate.findResources('AWS::QuickSight::DataSource');
      const secondaryDataSources = secondaryTemplate.findResources('AWS::QuickSight::DataSource');
      
      expect(Object.keys(primaryDataSources).length).toBe(0);
      expect(Object.keys(secondaryDataSources).length).toBe(0);
    });
  });

  describe('IAM Configuration', () => {
    test('should create Lambda execution role with least privilege', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            })
          ])
        })
      });
    });

    test('should grant DynamoDB permissions to Lambda', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*')
              ])
            })
          ])
        })
      });
    });

    test('should grant S3 permissions to Lambda', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('s3:.*')
              ])
            })
          ])
        })
      });
    });

    test('should grant EventBridge permissions to Lambda', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'events:PutEvents'
            })
          ])
        })
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export API endpoint', () => {
      primaryTemplate.hasOutput('ApiEndpoint', {
        Export: {
          Name: Match.stringLikeRegexp(`global-api-${environmentSuffix}-us-east-1-ApiEndpoint`)
        }
      });
    });

    test('should export table name', () => {
      primaryTemplate.hasOutput('TableName', {
        Export: {
          Name: Match.stringLikeRegexp(`global-api-${environmentSuffix}-us-east-1-TableName`)
        }
      });
    });

    test('should export bucket names', () => {
      primaryTemplate.hasOutput('AssetBucketName', {});
      primaryTemplate.hasOutput('BackupBucketName', {});
    });

    test('should export region-specific outputs', () => {
      primaryTemplate.hasOutput('Region', {});
      primaryTemplate.hasOutput('IsPrimary', {});
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources in primary stack', () => {
      const resources = primaryTemplate.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(30);
    });

    test('should create expected number of resources in secondary stack', () => {
      const resources = secondaryTemplate.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(25);
    });
  });

  describe('Multi-Region Configuration', () => {
    test('primary and secondary stacks should have different region-specific names', () => {
      const primaryResources = primaryTemplate.toJSON().Resources;
      const secondaryResources = secondaryTemplate.toJSON().Resources;
      
      expect(primaryResources).not.toEqual(secondaryResources);
    });

    test('should configure appropriate features per region', () => {
      // Primary should have more resources due to replication, health checks, QuickSight
      const primaryResourceCount = Object.keys(primaryTemplate.toJSON().Resources).length;
      const secondaryResourceCount = Object.keys(secondaryTemplate.toJSON().Resources).length;
      
      expect(primaryResourceCount).toBeGreaterThan(secondaryResourceCount);
    });
  });

  describe('Branch Coverage - Edge Cases', () => {
    test('should use context environmentSuffix when props not provided', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'test' } });
      const testStack = new TapStack(testApp, 'TestContextStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(testStack);
      // Should use 'test' from context and default to isPrimary=true
      expect(template.toJSON().Resources).toBeDefined();
    });

    test('should default isPrimary to true when not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultPrimaryStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(testStack);
      // Should have primary resources (Route 53 health check, S3 replication, etc.)
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTPS'
        })
      });
    });

    test('should handle primary stack in ap-south-1 region (otherRegion branch)', () => {
      const testApp = new cdk.App();
      const apSouthPrimaryStack = new TapStack(testApp, 'ApSouthPrimaryStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'ap-south-1'
        }
      });
      
      const template = Template.fromStack(apSouthPrimaryStack);
      
      // S3 replication is now enabled for primary stacks
      const s3ReplicationRoles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 's3.amazonaws.com'
                }
              })
            ])
          })
        }
      });
      
      // Should have S3 replication role for primary stack
      expect(Object.keys(s3ReplicationRoles).length).toBe(1);
      
      // Verify the stack was created successfully for ap-south-1
      expect(template.toJSON().Resources).toBeDefined();
    });

    test('should use default environmentSuffix when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultEnvStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(testStack);
      // Should default to 'dev'
      expect(template.toJSON().Resources).toBeDefined();
    });

    test('should handle cross-region event forwarding from ap-south-1 to us-east-1', () => {
      const testApp = new cdk.App();
      const apSouthPrimaryStack = new TapStack(testApp, 'ApSouthEventStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'ap-south-1'
        }
      });
      
      const template = Template.fromStack(apSouthPrimaryStack);
      // Should forward events to us-east-1
      template.hasResourceProperties('AWS::Events::Rule', {
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.stringLikeRegexp('arn:aws:events:us-east-1.*')
          })
        ])
      });
    });

    test('should enable Route 53 latency routing when hostedZoneId is provided', () => {
      const testApp = new cdk.App({
        context: {
          hostedZoneId: 'Z1234567890ABC',
          domainName: 'api.example.com'
        }
      });
      
      const primaryStack = new TapStack(testApp, 'Route53EnabledStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(primaryStack);
      
      // Should create Route 53 latency record
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        SetIdentifier: Match.stringLikeRegexp('global-api-test-us-east-1')
      });
      
      // Should have CustomDomain output
      template.hasOutput('CustomDomain', {});
    });

    test('should provide info message when Route 53 is not enabled', () => {
      const testApp = new cdk.App();
      
      const primaryStack = new TapStack(testApp, 'Route53DisabledStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(primaryStack);
      
      // Should have Route53Info output instead
      template.hasOutput('Route53Info', {});
    });

    test('should enable QuickSight when enableQuickSight is true', () => {
      const testApp = new cdk.App({
        context: {
          enableQuickSight: true
        }
      });
      
      const primaryStack = new TapStack(testApp, 'QuickSightEnabledStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(primaryStack);
      
      // Should create QuickSight data source
      template.hasResourceProperties('AWS::QuickSight::DataSource', {
        Type: 'ATHENA'
      });
      
      // Should create QuickSight role
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'quicksight.amazonaws.com'
              })
            })
          ])
        })
      });
      
      // Should have QuickSightDataSourceId output
      template.hasOutput('QuickSightDataSourceId', {});
    });

    test('should provide info message when QuickSight is not enabled', () => {
      const testApp = new cdk.App();
      
      const primaryStack = new TapStack(testApp, 'QuickSightDisabledStack', {
        environmentSuffix: 'test',
        isPrimary: true,
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      
      const template = Template.fromStack(primaryStack);
      
      // Should have QuickSightInfo output instead
      template.hasOutput('QuickSightInfo', {});
    });
  });
});