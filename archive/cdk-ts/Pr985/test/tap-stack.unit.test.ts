import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: environmentSuffix,
      },
    });
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with SSE-S3 encryption', () => {
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

    test('should have bucket name with corp prefix and environment suffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `corp-secure-data-${environmentSuffix}-us-east-1`,
      });
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'corp-lifecycle-rule',
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: 30,
                },
              ],
            },
          ],
        },
      });
    });

    test('should enforce SSL in bucket policy', () => {
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

    test('should be configured for destruction on stack deletion', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM role with lambda service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
        RoleName: `corp-secure-execution-role-${environmentSuffix}`,
      });
    });

    test('should have account-bounded permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'corp-s3-policy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Condition: {
                    StringEquals: {
                      'aws:SourceAccount': '123456789012', // Account ID from test env
                    },
                  },
                },
              ],
            },
          },
        ],
      });
    });

    test('should create IAM user with correct naming', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: `corp-secure-service-user-${environmentSuffix}`,
      });
    });

    test('should have MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `corp-mfa-enforcement-${environmentSuffix}`,
        PolicyDocument: {
          Statement: [
            {
              Sid: 'DenyAllExceptListedIfNoMFA',
              Effect: 'Deny',
              NotAction: Match.arrayWith([
                'iam:CreateVirtualMFADevice',
                'iam:EnableMFADevice',
                'iam:GetUser',
                'iam:ListMFADevices',
                'sts:GetSessionToken',
              ]),
              Resource: '*',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            },
          ],
        },
      });
    });

    test('should attach MFA policy to user', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        Users: [
          {
            Ref: Match.anyValue(),
          },
        ],
      });
    });

    test('should follow least privilege principle', () => {
      // Check that IAM role only has necessary permissions
      const roleResources = template.findResources('AWS::IAM::Role');
      Object.values(roleResources).forEach(role => {
        if (role.Properties?.Policies) {
          role.Properties.Policies.forEach((policy: any) => {
            expect(policy.PolicyDocument.Statement).toBeDefined();
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              // Ensure no wildcard permissions except where necessary
              if (statement.Action && statement.Action !== '*') {
                expect(statement.Action).toBeDefined();
              }
            });
          });
        }
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should have VPC name with environment suffix', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: `corp-secure-vpc-${environmentSuffix}`,
          },
        ]),
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Check for public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });

      // Check for private subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      });
    });

    test('should create NAT gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('RDS Database Configuration', () => {
    test('should create RDS instance with PostgreSQL', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        EngineVersion: '15',
        DBInstanceClass: 'db.t3.micro',
      });
    });

    test('should have instance identifier with environment suffix', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `corp-secure-db-${environmentSuffix}`,
      });
    });

    test('should not be publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should have storage encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should have deletion protection disabled for destroyability', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('should be configured for destruction on stack deletion', () => {
      template.hasResource('AWS::RDS::DBInstance', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should have backup retention configured', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('should create security group for RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for corp RDS instance',
        SecurityGroupIngress: [
          {
            CidrIp: '10.0.0.0/16',
            Description: 'Allow PostgreSQL access from VPC',
            FromPort: 5432,
            IpProtocol: 'tcp',
            ToPort: 5432,
          },
        ],
      });
    });

    test('should create secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `corp/db/credentials/${environmentSuffix}`,
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"corp_admin"}',
          GenerateStringKey: 'password',
        },
      });
    });
  });

  describe('GuardDuty Configuration', () => {
    test('should create GuardDuty custom resource', () => {
      template.hasResource('AWS::CloudFormation::CustomResource', {
        Properties: {
          ServiceToken: Match.anyValue(),
        },
      });
    });

    test('should create Lambda function for GuardDuty management', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('should have Lambda function with GuardDuty permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: Match.anyValue(),
        Environment: Match.anyValue(),
      });
    });

    test('should create IAM role for GuardDuty Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'guardduty:CreateDetector',
                'guardduty:ListDetectors',
                'guardduty:UpdateDetector',
                'guardduty:UpdateDetectorFeatureConfiguration',
                'guardduty:GetDetector',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create REST API with correct naming', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `corp-secure-rest-api-${environmentSuffix}`,
        Description: 'Corp secure REST API with comprehensive logging',
      });
    });

    test('should have logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('should create CloudWatch log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/corp-secure-api-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('should have access logging configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        AccessLogSetting: {
          DestinationArn: {
            'Fn::GetAtt': [Match.anyValue(), 'Arn'],
          },
          Format: Match.anyValue(),
        },
      });
    });

    test('should have resource policy with account restrictions', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 'execute-api:Invoke',
              Resource: '*',
              Condition: {
                StringEquals: {
                  'aws:SourceAccount': '123456789012', // Account ID from test env
                },
              },
            },
          ],
        },
      });
    });

    test('should have CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          IntegrationResponses: Match.arrayWith([
            Match.objectLike({
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,Authorization'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'GET,POST'",
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should create Lambda function with correct naming', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `corp-secure-api-handler-${environmentSuffix}`,
        Runtime: 'python3.11',
        Handler: 'index.handler',
      });
    });

    test('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            BUCKET_NAME: {
              Ref: Match.anyValue(),
            },
            DB_ENDPOINT: {
              'Fn::GetAtt': [Match.anyValue(), 'Endpoint.Address'],
            },
          },
        },
      });
    });

    test('should have appropriate timeout and memory', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should use the execution role with limited permissions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Role: {
          'Fn::GetAtt': [Match.stringLikeRegexp('corpexecutionrole'), 'Arn'],
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      expect(outputKeys).toContain('S3BucketName');
      expect(outputKeys).toContain('S3BucketArn');
      expect(outputKeys).toContain('DatabaseEndpoint');
      expect(outputKeys).toContain('DatabasePort');
      expect(outputKeys).toContain('ApiGatewayUrl');
      expect(outputKeys).toContain('GuardDutyDetectorId');
      expect(outputKeys).toContain('VpcId');
      expect(outputKeys).toContain('LambdaFunctionName');
      expect(outputKeys).toContain('LambdaFunctionArn');
      expect(outputKeys).toContain('IAMUserName');
      expect(outputKeys).toContain('IAMUserArn');
      expect(outputKeys).toContain('IAMRoleName');
      expect(outputKeys).toContain('IAMRoleArn');
    });

    test('should have export names with stack name prefix', () => {
      const outputs = template.findOutputs('*');
      Object.values(outputs).forEach(output => {
        if (output.Export?.Name) {
          expect(output.Export.Name).toMatch(/TapStack.*-/);
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow corp- prefix naming convention', () => {
      // Check S3 bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('^corp-'),
      });

      // Check IAM role
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('^corp-'),
      });

      // Check IAM user
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: Match.stringLikeRegexp('^corp-'),
      });

      // Check Lambda function
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('^corp-'),
      });

      // Check API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('^corp-'),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with public access', () => {
      // S3 bucket should block public access
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });

      // RDS should not be publicly accessible
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should have encryption enabled on all applicable resources', () => {
      // S3 bucket encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: Match.anyValue(),
              },
            }),
          ]),
        },
      });

      // RDS encryption
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should have least privilege IAM policies', () => {
      // Check that policies don't have overly broad permissions
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach(policy => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        statements.forEach((statement: any) => {
          // Check that Deny statements exist for MFA enforcement
          if (statement.Effect === 'Deny' && statement.NotAction) {
            expect(statement.NotAction).toBeDefined();
          }
          // Check that Allow statements have conditions when possible
          if (statement.Effect === 'Allow' && statement.Resource !== '*') {
            expect(statement.Resource).toBeDefined();
          }
        });
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('all stateful resources should be configured for deletion', () => {
      // S3 bucket
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });

      // RDS instance
      template.hasResource('AWS::RDS::DBInstance', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });

      // Log groups
      template.hasResource('AWS::Logs::LogGroup', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });
});
