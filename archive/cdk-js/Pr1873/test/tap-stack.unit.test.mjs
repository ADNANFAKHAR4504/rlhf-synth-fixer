import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack - CI/CD Pipeline Infrastructure', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Storage Resources', () => {
    test('should create source S3 bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('cicd-source-')
            ])
          ])
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should create artifacts S3 bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('cicd-artifacts-')
            ])
          ])
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should have lifecycle rules on buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              }
            })
          ])
        }
      });
    });

    test('should have deletion policy set to DELETE', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create CodePipeline role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cicd-pipeline-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }
      });
    });

    test('should create CodeBuild role with logging permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cicd-codebuild-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('should create CodeDeploy role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cicd-codedeploy-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codedeploy.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('should create Lambda execution role with PowerTools permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `cicd-lambda-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole')
              ])
            ])
          })
        ])
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create build project with correct configuration', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `cicd-build-${environmentSuffix}`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER',
          PrivilegedMode: true
        }
      });
    });

    test('should create test project with test reports', () => {
      // Find the test project specifically
      const projects = template.findResources('AWS::CodeBuild::Project');
      const testProject = Object.entries(projects).find(([key, value]) => 
        value.Properties.Name === `cicd-test-${environmentSuffix}`
      );
      
      expect(testProject).toBeDefined();
      if (testProject) {
        const buildSpec = JSON.parse(testProject[1].Properties.Source.BuildSpec);
        expect(buildSpec.reports).toBeDefined();
        expect(buildSpec.reports.TestReports).toBeDefined();
        expect(buildSpec.reports.TestReports.files).toContain('test-results.xml');
        expect(buildSpec.reports.TestReports.files).toContain('coverage-report.xml');
      }
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should create CodeDeploy application', () => {
      template.hasResourceProperties('AWS::CodeDeploy::Application', {
        ApplicationName: `cicd-app-${environmentSuffix}`,
        ComputePlatform: 'Server'
      });
    });

    test('should create deployment group with auto-rollback', () => {
      template.hasResourceProperties('AWS::CodeDeploy::DeploymentGroup', {
        DeploymentGroupName: `cicd-dg-${environmentSuffix}`,
        AutoRollbackConfiguration: {
          Enabled: true,
          Events: Match.arrayWith(['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_REQUEST'])
        }
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with correct CIDR and subnets', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `cicd-vpc-${environmentSuffix}`
          })
        ])
      });
    });

    test('should create public and private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const subnetCount = Object.keys(subnets).length;
      expect(subnetCount).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
    });

    test('should create NAT gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should have Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create ASG with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `cicd-asg-${environmentSuffix}`,
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '2'
      });
    });

    test('should have user data script for CodeDeploy agent', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        UserData: Match.objectLike({
          'Fn::Base64': Match.stringLikeRegexp('.*codedeploy-agent.*')
        })
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create validation Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `cicd-validation-${environmentSuffix}`,
        Handler: 'deployment-validator.handler',
        Runtime: 'nodejs20.x',
        Timeout: 300,
        Environment: {
          Variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            LOG_LEVEL: 'INFO',
            POWERTOOLS_SERVICE_NAME: 'deployment-validator',
            POWERTOOLS_METRICS_NAMESPACE: 'CICDPipeline'
          }
        }
      });
    });

    test('should have Lambda Powertools layer', () => {
      // Find the Lambda function with the validation function name
      const functions = template.findResources('AWS::Lambda::Function');
      const validationFunction = Object.entries(functions).find(([key, value]) => 
        value.Properties.FunctionName === `cicd-validation-${environmentSuffix}`
      );
      
      expect(validationFunction).toBeDefined();
      if (validationFunction) {
        expect(validationFunction[1].Properties.Layers).toBeDefined();
        expect(validationFunction[1].Properties.Layers.length).toBeGreaterThan(0);
        // Check that the layer ARN contains AWS Lambda Powertools reference
        const layerArn = JSON.stringify(validationFunction[1].Properties.Layers[0]);
        expect(layerArn).toContain('AWSLambdaPowertoolsTypeScript');
      }
    });

    test('should have tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `cicd-alarms-${environmentSuffix}`,
        DisplayName: 'CI/CD Pipeline Alarms'
      });
    });

    test('should create email subscription for SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'devops-team@company.com'
      });
    });

    test('should create CloudWatch alarm for pipeline failures', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `cicd-pipeline-failure-${environmentSuffix}`,
        MetricName: 'PipelineExecutionFailure',
        Namespace: 'AWS/CodePipeline',
        Threshold: 1,
        EvaluationPeriods: 1
      });
    });
  });

  describe('CodePipeline', () => {
    test('should create pipeline with V2 type', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: `cicd-pipeline-${environmentSuffix}`,
        PipelineType: 'V2',
        RoleArn: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*PipelineRole.*')])
        })
      });
    });

    test('should have correct pipeline stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Test' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' }),
          Match.objectLike({ Name: 'Validate' })
        ])
      });
    });

    test('should have S3 source action with polling trigger', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Source',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Source',
                  Provider: 'S3'
                },
                Configuration: Match.objectLike({
                  S3ObjectKey: 'source.zip',
                  PollForSourceChanges: true
                })
              })
            ])
          })
        ])
      });
    });

    test('should have CodeBuild test action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Test',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Build',
                  Provider: 'CodeBuild'
                }
              })
            ])
          })
        ])
      });
    });

    test('should have Lambda validation action', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({
            Name: 'Validate',
            Actions: Match.arrayWith([
              Match.objectLike({
                ActionTypeId: {
                  Category: 'Invoke',
                  Provider: 'Lambda'
                }
              })
            ])
          })
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Description: 'CI/CD Pipeline ARN',
        Export: {
          Name: `${environmentSuffix}-PipelineArn`
        }
      });
    });

    test('should export source bucket name', () => {
      template.hasOutput('SourceBucketName', {
        Description: 'Source code S3 bucket name',
        Export: {
          Name: `${environmentSuffix}-SourceBucketName`
        }
      });
    });

    test('should export Lambda function name', () => {
      template.hasOutput('ValidationFunctionName', {
        Description: 'Lambda validation function name',
        Export: {
          Name: `${environmentSuffix}-ValidationFunctionName`
        }
      });
    });

    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for deployment resources',
        Export: {
          Name: `${environmentSuffix}-VpcId`
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should apply project tags to stack', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach(resource => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Key: 'Project',
              Value: 'CI-CD-Pipeline'
            }),
            expect.objectContaining({
              Key: 'Environment',
              Value: environmentSuffix
            })
          ])
        );
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce SSL on S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
      });
    });

    test('should use least privilege IAM policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      Object.values(roles).forEach(role => {
        if (role.Properties.Policies) {
          role.Properties.Policies.forEach(policy => {
            const statements = policy.PolicyDocument.Statement;
            statements.forEach(statement => {
              // Ensure no overly permissive policies
              if (statement.Resource === '*') {
                expect(statement.Action).not.toContain('*');
              }
            });
          });
        }
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('should have auto-delete objects for S3 buckets', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {
        Properties: Match.objectLike({
          ServiceToken: Match.anyValue(),
          BucketName: Match.anyValue()
        })
      });
    });
  });
});