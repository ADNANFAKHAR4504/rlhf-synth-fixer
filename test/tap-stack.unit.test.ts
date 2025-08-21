import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const accountId = '718240086340';
  const primaryRegion = 'us-east-1';
  const backupRegion = 'us-west-2';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix,
        primaryRegion,
        backupRegion,
      },
    });
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: accountId,
        region: primaryRegion,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with correct naming convention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `corp-data-${environmentSuffix}-${primaryRegion}-${accountId}`,
      });
    });

    test('enables versioning on the bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('configures S3-managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('enforces SSL connections', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('sets bucket ownership to BUCKET_OWNER_ENFORCED', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        OwnershipControls: {
          Rules: [
            {
              ObjectOwnership: 'BucketOwnerEnforced',
            },
          ],
        },
      });
    });

    test('has auto-delete objects enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          },
        ]),
      });
    });

    test('has deletion policy set to Delete', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
        Properties: Match.objectLike({
          BucketName: Match.anyValue(),
        }),
      });
    });
  });

  describe('SSM Parameter', () => {
    test('creates SSM parameter with correct path', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/corp/tap/${environmentSuffix}/${primaryRegion}/bucket-name`,
        Type: 'String',
        Value: Match.objectLike({
          Ref: Match.anyValue(),
        }),
      });
    });

    test('SSM parameter has correct description', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Description: 'Bucket name for this region used by cross-region sync',
      });
    });

    test('SSM parameter has deletion policy set to Delete', () => {
      template.hasResource('AWS::SSM::Parameter', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with correct name', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `Corp-S3Sync-${primaryRegion}-${environmentSuffix}`,
      });
    });

    test('uses Node.js 18 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
      });
    });

    test('has 5 minute timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 300,
      });
    });

    test('has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DEST_PARAM_PATH: `/corp/tap/${environmentSuffix}/${backupRegion}/bucket-name`,
            DEST_REGION: backupRegion,
          },
        },
      });
    });

    test('has inline code with correct handler', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Code: {
          ZipFile: Match.stringLikeRegexp('exports.handler'),
        },
      });
    });

    test('has correct description', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Description: 'Copies newly created S3 objects to the peer region bucket',
      });
    });
  });

  describe('Lambda IAM Permissions', () => {
    test('grants read permissions on source bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
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

    test('grants write permissions on peer bucket', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowWriteToPeerBucket',
              Effect: 'Allow',
              Action: [
                's3:PutObject',
                's3:AbortMultipartUpload',
                's3:ListBucket',
                's3:ListBucketMultipartUploads',
              ],
              Resource: [
                `arn:aws:s3:::corp-data-${environmentSuffix}-${backupRegion}-${accountId}`,
                `arn:aws:s3:::corp-data-${environmentSuffix}-${backupRegion}-${accountId}/*`,
              ],
            }),
          ]),
        },
      });
    });

    test('grants SSM parameter read permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowReadPeerBucketParam',
              Effect: 'Allow',
              Action: ['ssm:GetParameter'],
              Resource: [
                `arn:aws:ssm:${backupRegion}:${accountId}:parameter/corp/tap/${environmentSuffix}/${backupRegion}/bucket-name`,
              ],
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Event Notifications', () => {
    test('configures PUT event notification', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: ['s3:ObjectCreated:Put'],
              LambdaFunctionArn: Match.objectLike({
                'Fn::GetAtt': Match.arrayWith([
                  Match.stringLikeRegexp('CorpS3SyncFunction'),
                  'Arn',
                ]),
              }),
            }),
          ]),
        },
      });
    });

    test('configures multipart upload complete event notification', () => {
      template.hasResourceProperties('Custom::S3BucketNotifications', {
        NotificationConfiguration: {
          LambdaFunctionConfigurations: Match.arrayWith([
            Match.objectLike({
              Events: ['s3:ObjectCreated:CompleteMultipartUpload'],
              LambdaFunctionArn: Match.objectLike({
                'Fn::GetAtt': Match.arrayWith([
                  Match.stringLikeRegexp('CorpS3SyncFunction'),
                  'Arn',
                ]),
              }),
            }),
          ]),
        },
      });
    });

    test('grants Lambda permission to be invoked by S3', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 's3.amazonaws.com',
        SourceAccount: accountId,
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('creates log group with correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/Corp-S3Sync-${primaryRegion}-${environmentSuffix}`,
      });
    });

    test('sets retention to one week', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('has deletion policy set to Delete', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates dashboard with correct name', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `Corp-Replication-${environmentSuffix}-${primaryRegion}-${accountId}`,
      });
    });

    test('dashboard has deletion policy set to Delete', () => {
      template.hasResource('AWS::CloudWatch::Dashboard', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('dashboard contains expected metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.stringLikeRegexp('NumberOfObjects'),
      });
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.stringLikeRegexp('BucketSizeBytes'),
      });
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: Match.stringLikeRegexp('AWS/Lambda'),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports bucket name', () => {
      template.hasOutput('CorpBucketName', {
        Export: {
          Name: `Corp-BucketName-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });

    test('exports sync function name', () => {
      template.hasOutput('CorpSyncFunctionName', {
        Export: {
          Name: `Corp-SyncFunctionName-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });

    test('exports sync function ARN', () => {
      template.hasOutput('CorpSyncFunctionArn', {
        Export: {
          Name: `Corp-SyncFunctionArn-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });

    test('exports SSM parameter name', () => {
      template.hasOutput('CorpLocalBucketParamName', {
        Export: {
          Name: `Corp-LocalBucketParam-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });

    test('exports dashboard name', () => {
      template.hasOutput('CorpDashboardName', {
        Export: {
          Name: `Corp-DashboardName-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });

    test('exports dashboard URL', () => {
      template.hasOutput('CorpDashboardUrl', {
        Value: Match.stringLikeRegexp('console.aws.amazon.com/cloudwatch'),
        Export: {
          Name: `Corp-DashboardUrl-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });

    test('exports peer region', () => {
      template.hasOutput('CorpPeerRegion', {
        Value: backupRegion,
        Export: {
          Name: `Corp-PeerRegion-${environmentSuffix}-${primaryRegion}`,
        },
      });
    });
  });

  describe('Stack Instantiation Variations', () => {
    test('can be instantiated with minimal props', () => {
      const newApp = new cdk.App();
      const minimalStack = new TapStack(newApp, 'MinimalStack', {
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      expect(minimalStack).toBeDefined();
      const minimalTemplate = Template.fromStack(minimalStack);
      minimalTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      minimalTemplate.resourceCountIs('AWS::Lambda::Function', 2); // sync function + auto-delete
    });

    test('uses provided environment suffix', () => {
      const newApp = new cdk.App();
      const customSuffix = 'custom-env';
      const customStack = new TapStack(newApp, 'CustomStack', {
        environmentSuffix: customSuffix,
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      const customTemplate = Template.fromStack(customStack);
      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`corp-data-${customSuffix}`),
      });
    });

    test('defaults to dev environment suffix', () => {
      const newApp = new cdk.App();
      const defaultStack = new TapStack(newApp, 'DefaultStack', {
        env: {
          account: accountId,
          region: 'us-west-2',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('corp-data-dev'),
      });
    });

    test('handles context-based configuration', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
          primaryRegion: 'eu-west-1',
          backupRegion: 'eu-central-1',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: {
          account: accountId,
          region: 'eu-west-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);
      contextTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DEST_REGION: 'eu-central-1',
          },
        },
      });
    });
  });

  describe('Cross-Region Configuration', () => {
    test('correctly determines peer region when in primary region', () => {
      const primaryStack = new TapStack(app, 'PrimaryStack', {
        environmentSuffix,
        env: {
          account: accountId,
          region: primaryRegion,
        },
      });
      const primaryTemplate = Template.fromStack(primaryStack);
      primaryTemplate.hasOutput('CorpPeerRegion', {
        Value: backupRegion,
      });
    });

    test('correctly determines peer region when in backup region', () => {
      const backupStack = new TapStack(app, 'BackupStack', {
        environmentSuffix,
        env: {
          account: accountId,
          region: backupRegion,
        },
      });
      const backupTemplate = Template.fromStack(backupStack);
      backupTemplate.hasOutput('CorpPeerRegion', {
        Value: primaryRegion,
      });
    });

    test('generates correct peer bucket name', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Resource: Match.arrayWith([
                `arn:aws:s3:::corp-data-${environmentSuffix}-${backupRegion}-${accountId}`,
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources follow Corp- naming convention', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('^Corp-'),
      });
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('^Corp-'),
      });
    });

    test('bucket names are lowercase and DNS-compliant', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('^corp-data-[a-z0-9-]+$'),
      });
    });

    test('all resource names include environment suffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources have Retain deletion policy', () => {
      const allResources = template.toJSON().Resources;
      Object.values(allResources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('S3 bucket enforces SSL', () => {
      const policies = template.findResources('AWS::S3::BucketPolicy');
      Object.values(policies).forEach((policy) => {
        const statements = policy.Properties?.PolicyDocument?.Statement as any[];
        const sslDenyStatement = statements?.find(
          (s) =>
            s.Effect === 'Deny' &&
            s.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
        expect(sslDenyStatement).toBeDefined();
      });
    });

    test('Lambda function has least-privilege permissions', () => {
      // Verify Lambda only has specific required permissions
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy) => {
        const statements = policy.Properties?.PolicyDocument?.Statement as any[];
        statements?.forEach((statement) => {
          if (statement.Sid === 'AllowWriteToPeerBucket') {
            // Should only have minimal S3 actions
            expect(statement.Action).toHaveLength(4);
          }
          if (statement.Sid === 'AllowReadPeerBucketParam') {
            // Should only have GetParameter
            expect(statement.Action).toEqual(['ssm:GetParameter']);
          }
        });
      });
    });
  });

  describe('Auto-Delete Resources', () => {
    test('creates auto-delete Lambda for S3 bucket', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const autoDeleteLambda = Object.values(lambdas).find(
        (lambda) =>
          lambda.Properties?.Handler === 'index.handler' &&
          lambda.Properties?.Description?.includes('Lambda to cleanup')
      );
      expect(autoDeleteLambda).toBeDefined();
    });

    test('auto-delete Lambda has appropriate timeout', () => {
      const lambdas = template.findResources('AWS::Lambda::Function');
      const autoDeleteLambda = Object.values(lambdas).find(
        (lambda) => lambda.Properties?.Description?.includes('Lambda to cleanup')
      );
      expect(autoDeleteLambda?.Properties?.Timeout).toBe(900);
    });
  });
});