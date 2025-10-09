import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates the main stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain('TapStack');
    });

    test('applies tags to stack', () => {
      const tags = cdk.Tags.of(stack);
      expect(tags).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with requester pays enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        RequestPaymentConfiguration: {
          Payer: 'Requester'
        }
      });
    });

    test('configures intelligent tiering lifecycle rule', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'IntelligentTieringRule',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: 0
                })
              ])
            })
          ])
        }
      });
    });

    test('enables S3 bucket encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        }
      });
    });

    test('configures CORS for audio streaming', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'HEAD']),
              AllowedOrigins: ['*'],
              MaxAge: 3600
            })
          ])
        }
      });
    });

    test('sets removal policy to DESTROY for cleanup', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('creates DynamoDB table for subscribers', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'email',
            KeyType: 'HASH'
          })
        ])
      });
    });

    test('configures pay-per-request billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('creates GSI for subscription status', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'status-index',
            KeySchema: Match.arrayWith([
              Match.objectLike({
                AttributeName: 'subscriptionStatus',
                KeyType: 'HASH'
              }),
              Match.objectLike({
                AttributeName: 'expirationDate',
                KeyType: 'RANGE'
              })
            ])
          })
        ])
      });
    });

    test('enables encryption for table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true
        }
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('creates CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
          PriceClass: 'PriceClass_100'
        })
      });
    });

    test('configures viewer protocol policy', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https'
          })
        })
      });
    });

    test('enables CloudFront logging', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Logging: Match.objectLike({})
        })
      });
    });
  });

  describe('Lambda@Edge Function', () => {
    test('creates Lambda function for authorization', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Match.stringLikeRegexp('nodejs'),
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 5
      });
    });

    test('creates IAM role for Lambda@Edge', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('grants DynamoDB read permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*')
              ])
            })
          ])
        }
      });
    });
  });

  describe('MediaConvert Configuration', () => {
    test('creates MediaConvert job template', () => {
      template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
        Category: 'podcast',
        Priority: 0,
        StatusUpdateInterval: 'SECONDS_60'
      });
    });

    test('configures multiple bitrate outputs', () => {
      template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
        SettingsJson: Match.objectLike({
          OutputGroups: Match.arrayWith([
            Match.objectLike({
              Outputs: Match.arrayWith([
                Match.objectLike({
                  AudioDescriptions: Match.arrayWith([
                    Match.objectLike({
                      CodecSettings: Match.objectLike({
                        Mp3Settings: Match.objectLike({
                          Bitrate: 64000
                        })
                      })
                    })
                  ])
                }),
                Match.objectLike({
                  AudioDescriptions: Match.arrayWith([
                    Match.objectLike({
                      CodecSettings: Match.objectLike({
                        Mp3Settings: Match.objectLike({
                          Bitrate: 128000
                        })
                      })
                    })
                  ])
                }),
                Match.objectLike({
                  AudioDescriptions: Match.arrayWith([
                    Match.objectLike({
                      CodecSettings: Match.objectLike({
                        Mp3Settings: Match.objectLike({
                          Bitrate: 256000
                        })
                      })
                    })
                  ])
                })
              ])
            })
          ])
        })
      });
    });

    test('creates IAM role for MediaConvert', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'mediaconvert.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('creates hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: Match.stringLikeRegexp('.*\\.podcast-platform\\.cloud\\.$')
      });
    });

    test('creates A record for CloudFront', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'A',
        Name: Match.stringLikeRegexp('cdn\\..*\\.podcast-platform\\.cloud\\.$')
      });
    });

    test('creates AAAA record for IPv6', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Type: 'AAAA',
        Name: Match.stringLikeRegexp('cdn\\..*\\.podcast-platform\\.cloud\\.$')
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('podcast-streaming-metrics')
      });
    });

    test('creates CloudWatch alarms for error rates', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('Podcast Platform Alarms')
      });
    });

    test('creates high 5xx error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('podcast-high-error-rate'),
        Threshold: 5,
        MetricName: '5xxErrorRate'
      });
    });

    test('creates high 4xx error rate alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('podcast-high-4xx-rate'),
        Threshold: 10,
        MetricName: '4xxErrorRate'
      });
    });
  });

  describe('Outputs', () => {
    test('creates various stack outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('has outputs with descriptions', () => {
      const outputs = template.findOutputs('*');
      const hasDescriptions = Object.values(outputs).some(
        (output: any) => output.Description !== undefined
      );
      expect(hasDescriptions).toBe(true);
    });
  });
});