import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';
  const projectName = 'trainr241';

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: environmentSuffix
      }
    });
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket for pipeline artifacts', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([Match.stringLikeRegexp(`${projectName}-${environmentSuffix}-pipeline-artifacts-`)])
          ])
        }),
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      });
    });

    test('should have lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              }
            }),
            Match.objectLike({
              Id: 'abort-incomplete-uploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 1
              }
            })
          ])
        }
      });
    });
  });

  describe('IAM Roles Configuration', () => {
    test('should create CodeBuild service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.anyValue()
          })
        ])
      });
    });

    test('should create CodePipeline service role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        })
      });
    });

    test('CodeBuild role should have S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com'
              }
            })
          ])
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3Access',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject'
                  ])
                })
              ])
            })
          })
        ])
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create log groups for staging and production', () => {
      ['staging', 'production'].forEach(env => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/codebuild/${projectName}-${environmentSuffix}-${env}-build`,
          RetentionInDays: 14
        });
      });
    });
  });

  describe('CodeBuild Projects', () => {
    test('should create build projects for each environment', () => {
      ['staging', 'production'].forEach(env => {
        template.hasResourceProperties('AWS::CodeBuild::Project', {
          Name: `${projectName}-${environmentSuffix}-${env}-build`,
          Environment: {
            ComputeType: 'BUILD_GENERAL1_SMALL',
            Image: 'aws/codebuild/standard:7.0',
            Type: 'LINUX_CONTAINER',
            EnvironmentVariables: Match.arrayWith([
              Match.objectLike({
                Name: 'ENVIRONMENT',
                Value: env
              }),
              Match.objectLike({
                Name: 'PROJECT_NAME',
                Value: projectName
              })
            ])
          },
          TimeoutInMinutes: 30
        });
      });
    });

    test('should create test project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: `${projectName}-${environmentSuffix}-test`,
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
          Image: 'aws/codebuild/standard:7.0',
          Type: 'LINUX_CONTAINER'
        },
        TimeoutInMinutes: 15
      });
    });

    test('build projects should have caching enabled', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp(`${projectName}-${environmentSuffix}-(staging|production)-build`),
        Cache: {
          Type: 'LOCAL',
          Modes: Match.arrayWith(['LOCAL_CUSTOM_CACHE'])
        }
      });
    });

    test('build projects should have proper build spec', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp(`${projectName}-${environmentSuffix}-(staging|production)-build`),
        Source: {
          BuildSpec: Match.stringLikeRegexp('version.*0.2')
        }
      });
    });
  });

  describe('CodePipeline Configuration', () => {
    test('should create pipelines for each environment', () => {
      ['staging', 'production'].forEach(env => {
        template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
          Name: `${projectName}-${environmentSuffix}-${env}-pipeline`,
          Stages: Match.arrayWith([
            Match.objectLike({
              Name: 'Source'
            }),
            Match.objectLike({
              Name: 'Test'
            }),
            Match.objectLike({
              Name: 'Build'
            }),
            Match.objectLike({
              Name: 'Deploy'
            })
          ])
        });
      });
    });

    test('pipelines should have 4 stages', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp(`${projectName}-${environmentSuffix}-(staging|production)-pipeline`),
        Stages: Match.arrayEquals([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Test' }),
          Match.objectLike({ Name: 'Build' }),
          Match.objectLike({ Name: 'Deploy' })
        ])
      });
    });

    test('pipelines should use the artifacts bucket', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        ArtifactStore: {
          Type: 'S3',
          Location: Match.objectLike({
            Ref: Match.stringLikeRegexp('PipelineArtifacts')
          })
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming pattern', () => {
      // Check S3 bucket naming
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([Match.stringLikeRegexp(`${projectName}-${environmentSuffix}-`)])
          ])
        })
      });

      // Check CodeBuild project naming
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: Match.stringLikeRegexp(`^${projectName}-${environmentSuffix}-`)
      });

      // Check CodePipeline naming
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: Match.stringLikeRegexp(`^${projectName}-${environmentSuffix}-`)
      });

      // Check Log Group naming
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/codebuild/${projectName}-${environmentSuffix}-`)
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output artifacts bucket name', () => {
      template.hasOutput('ArtifactsBucketName', {
        Description: 'Name of the S3 bucket for pipeline artifacts',
        Export: {
          Name: Match.stringLikeRegexp('ArtifactsBucketName$')
        }
      });
    });

    test('should output CodeBuild project names', () => {
      template.hasOutput('CodeBuildProjects', {
        Description: 'CodeBuild project names',
        Export: {
          Name: Match.stringLikeRegexp('CodeBuildProjects$')
        }
      });
    });

    test('should output test project name', () => {
      template.hasOutput('TestProjectName', {
        Description: 'Name of the test CodeBuild project',
        Export: {
          Name: Match.stringLikeRegexp('TestProjectName$')
        }
      });
    });

    test('should output environment suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for resources',
        Value: environmentSuffix,
        Export: {
          Name: Match.stringLikeRegexp('EnvironmentSuffix$')
        }
      });
    });

    test('should output pipeline console URLs', () => {
      ['staging', 'production'].forEach(env => {
        template.hasOutput(`${env}PipelineConsoleUrl`, {
          Description: `Console URL for ${env} pipeline`
        });
      });
    });

    test('should output pipeline names', () => {
      ['staging', 'production'].forEach(env => {
        template.hasOutput(`${env}PipelineName`, {
          Description: `Name of the ${env} pipeline`,
          Value: `${projectName}-${environmentSuffix}-${env}-pipeline`,
          Export: {
            Name: Match.stringLikeRegexp(`${env}PipelineName$`)
          }
        });
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use environment suffix in all resource names', () => {
      const resourceCount = template.toJSON();
      
      // Count S3 buckets with correct naming
      template.resourceCountIs('AWS::S3::Bucket', 1);
      
      // Count CodeBuild projects (2 for environments + 1 test)
      template.resourceCountIs('AWS::CodeBuild::Project', 3);
      
      // Count CodePipeline pipelines (2 for environments)
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 2);
      
      // Count IAM roles (1 CodeBuild + 1 CodePipeline + 8 CodePipeline action roles + 1 Lambda)
      template.resourceCountIs('AWS::IAM::Role', 11);
      
      // Count CloudWatch Log Groups (2 for environments)
      template.resourceCountIs('AWS::Logs::LogGroup', 2);
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256'
            }
          }]
        }
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      // Check CodeBuild role has only necessary S3 permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'codebuild.amazonaws.com'
              }
            })
          ])
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.not(Match.arrayWith(['s3:*'])) // Should not have wildcard permissions
                })
              ])
            })
          })
        ])
      });
    });
  });
  test('should use ENVIRONMENT_SUFFIX from environment when context is missing', () => {
    process.env.ENVIRONMENT_SUFFIX = 'envSuffix';
    const appNoContext = new cdk.App(); // no context
    const stackNoContext = new TapStack(appNoContext, 'StackNoContext');
    const tmpl = Template.fromStack(stackNoContext);

    tmpl.hasOutput('EnvironmentSuffix', {
      Value: 'envSuffix'
    });

    delete process.env.ENVIRONMENT_SUFFIX; // cleanup
  });
  test('should use default environmentSuffix when neither context nor env var is set', () => {
    delete process.env.ENVIRONMENT_SUFFIX;
    const appNoContextNoEnv = new cdk.App();
    const stackDefault = new TapStack(appNoContextNoEnv, 'StackDefault');
    const tmpl = Template.fromStack(stackDefault);

    tmpl.hasOutput('EnvironmentSuffix', {
      Value: 'dev'
    });
  });
});