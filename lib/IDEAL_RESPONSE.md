# Ideal Response - CI/CD Pipeline Implementation

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 
  process.env.ENVIRONMENT_SUFFIX || 
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'Fintech-CICD');
cdk.Tags.of(app).add('Environment', environmentSuffix);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // 🔹 KMS Keys for Encryption
    const pipelineKmsKey = new kms.Key(this, 'PipelineKmsKey', {
      description: 'KMS key for pipeline artifacts',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const stagingKmsKey = new kms.Key(this, 'StagingKmsKey', {
      description: 'KMS key for staging environment',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const productionKmsKey = new kms.Key(this, 'ProductionKmsKey', {
      description: 'KMS key for production environment',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create KMS aliases
    new kms.Alias(this, 'PipelineKmsKeyAlias', {
      aliasName: `alias/tap-pipeline-key-${environmentSuffix}`,
      targetKey: pipelineKmsKey,
    });

    new kms.Alias(this, 'StagingKmsKeyAlias', {
      aliasName: `alias/tap-staging-key-${environmentSuffix}`,
      targetKey: stagingKmsKey,
    });

    new kms.Alias(this, 'ProductionKmsKeyAlias', {
      aliasName: `alias/tap-production-key-${environmentSuffix}`,
      targetKey: productionKmsKey,
    });

    // 🔹 S3 Buckets for Artifacts
    const pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: `tap-pipeline-artifacts-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: pipelineKmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'RetainNonCurrentVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          noncurrentVersionsToRetain: 5,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const stagingBucket = new s3.Bucket(this, 'StagingBucket', {
      bucketName: `tap-staging-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: stagingKmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'RetainNonCurrentVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          noncurrentVersionsToRetain: 5,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const productionBucket = new s3.Bucket(this, 'ProductionBucket', {
      bucketName: `tap-production-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: productionKmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'RetainNonCurrentVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          noncurrentVersionsToRetain: 5,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 🔹 SNS Topics for Notifications
    const pipelineNotificationTopic = new sns.Topic(this, 'PipelineNotificationTopic', {
      topicName: `tap-pipeline-notifications-${environmentSuffix}`,
      masterKey: pipelineKmsKey,
    });
    pipelineNotificationTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const stagingApprovalTopic = new sns.Topic(this, 'StagingApprovalTopic', {
      topicName: `tap-staging-approval-${environmentSuffix}`,
      masterKey: stagingKmsKey,
    });
    stagingApprovalTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const productionApprovalTopic = new sns.Topic(this, 'ProductionApprovalTopic', {
      topicName: `tap-production-approval-${environmentSuffix}`,
      masterKey: productionKmsKey,
    });
    productionApprovalTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 IAM Roles
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
                's3:GetBucketVersioning',
                's3:GetBucketLocation',
              ],
              resources: [
                pipelineArtifactsBucket.bucketArn,
                `${pipelineArtifactsBucket.bucketArn}/*`,
                stagingBucket.bucketArn,
                `${stagingBucket.bucketArn}/*`,
                productionBucket.bucketArn,
                `${productionBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              resources: [
                pipelineKmsKey.keyArn,
                stagingKmsKey.keyArn,
                productionKmsKey.keyArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
    codeBuildRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        CodePipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketVersioning',
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:PutObjectAcl',
                's3:ListBucket',
                's3:GetBucketLocation',
                's3:ListBucketMultipartUploads',
                's3:AbortMultipartUpload',
                's3:ListMultipartUploadParts',
              ],
              resources: [
                pipelineArtifactsBucket.bucketArn,
                `${pipelineArtifactsBucket.bucketArn}/*`,
                stagingBucket.bucketArn,
                `${stagingBucket.bucketArn}/*`,
                productionBucket.bucketArn,
                `${productionBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
                'codebuild:StopBuild',
                'codebuild:ListBuilds',
                'codebuild:ListProjects',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:PassRole',
              ],
              resources: [codeBuildRole.roleArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              resources: [
                pipelineKmsKey.keyArn,
                stagingKmsKey.keyArn,
                productionKmsKey.keyArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish',
              ],
              resources: [
                pipelineNotificationTopic.topicArn,
                stagingApprovalTopic.topicArn,
                productionApprovalTopic.topicArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:InvokeFunction',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
              ],
              resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
              ],
            }),
          ],
        }),
      },
    });
    codePipelineRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const lambdaExecutionRole = new iam.Role(this, 'SecurityScanLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        SecurityScanPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codepipeline:PutJobSuccessResult',
                'codepipeline:PutJobFailureResult',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
              ],
              resources: [
                pipelineArtifactsBucket.bucketArn,
                `${pipelineArtifactsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });
    lambdaExecutionRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `tap-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.BUILD_GENERAL1_MEDIUM,
        privileged: false,
      },
      environmentVariables: {
        PIPELINE_BUCKET: {
          value: pipelineArtifactsBucket.bucketName,
        },
        STAGING_BUCKET: {
          value: stagingBucket.bucketName,
        },
        PRODUCTION_BUCKET: {
          value: productionBucket.bucketName,
        },
      },
      artifacts: codebuild.Artifacts.codepipeline({
        bucket: pipelineArtifactsBucket,
        encryptionKey: pipelineKmsKey,
      }),
      cache: codebuild.Cache.bucket(pipelineArtifactsBucket, {
        prefix: 'build-cache',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Writing image definitions file...',
              'printf \'[{"name":"%s","imageUri":"%s"}]\' $CONTAINER_NAME $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: [
            'imagedefinitions.json',
          ],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
    });
    buildProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const unitTestProject = new codebuild.Project(this, 'UnitTestProject', {
      projectName: `tap-unit-test-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.BUILD_GENERAL1_SMALL,
        privileged: false,
      },
      artifacts: codebuild.Artifacts.codepipeline({
        bucket: pipelineArtifactsBucket,
        encryptionKey: pipelineKmsKey,
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing dependencies...',
              'npm install',
            ],
          },
          pre_build: {
            commands: [
              'echo Running unit tests...',
            ],
          },
          build: {
            commands: [
              'npm run test:unit',
              'npm run test:coverage',
            ],
          },
        },
        artifacts: {
          files: [
            'coverage/**/*',
            'test-results.xml',
          ],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
            logGroupName: `/aws/codebuild/tap-unit-test-${environmentSuffix}`,
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
    });
    unitTestProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const integrationTestProject = new codebuild.Project(this, 'IntegrationTestProject', {
      projectName: `tap-integration-test-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.BUILD_GENERAL1_SMALL,
        privileged: false,
      },
      artifacts: codebuild.Artifacts.codepipeline({
        bucket: pipelineArtifactsBucket,
        encryptionKey: pipelineKmsKey,
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing dependencies...',
              'npm install',
            ],
          },
          pre_build: {
            commands: [
              'echo Running integration tests...',
            ],
          },
          build: {
            commands: [
              'npm run test:integration',
            ],
          },
        },
        artifacts: {
          files: [
            'integration-test-results.xml',
          ],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
            logGroupName: `/aws/codebuild/tap-integration-test-${environmentSuffix}`,
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
    });
    integrationTestProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const securityScanProject = new codebuild.Project(this, 'SecurityScanProject', {
      projectName: `tap-security-scan-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.BUILD_GENERAL1_SMALL,
        privileged: false,
      },
      artifacts: codebuild.Artifacts.codepipeline({
        bucket: pipelineArtifactsBucket,
        encryptionKey: pipelineKmsKey,
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'echo Installing security scanning tools...',
              'pip install bandit safety',
              'npm install -g snyk',
            ],
          },
          pre_build: {
            commands: [
              'echo Running security scans...',
            ],
          },
          build: {
            commands: [
              'echo Running SAST scan with Bandit...',
              'bandit -r . -f json -o bandit-report.json || true',
              'echo Running dependency scan with Safety...',
              'safety check --json --output safety-report.json || true',
              'echo Running Snyk scan...',
              'snyk test --json > snyk-report.json || true',
            ],
          },
        },
        artifacts: {
          files: [
            'bandit-report.json',
            'safety-report.json',
            'snyk-report.json',
          ],
        },
      }),
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'SecurityScanLogGroup', {
            logGroupName: `/aws/codebuild/tap-security-scan-${environmentSuffix}`,
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
    });
    securityScanProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 Lambda Function for Security Scan Analysis
    const securityScanAnalysisLambda = new lambda.Function(this, 'SecurityScanAnalysisLambda', {
      functionName: `tap-security-scan-analysis-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      logGroup: new logs.LogGroup(this, 'SecurityScanLambdaLogGroup', {
        logGroupName: `/aws/lambda/tap-security-scan-analysis-${environmentSuffix}`,
        retention: logs.RetentionDays.THREE_MONTHS,
      }),
      environment: {
        CRITICAL_VULNERABILITY_THRESHOLD: '0',
        OWASP_TOP_10_CHECK: 'true',
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const codepipeline = new AWS.CodePipeline();
        
        exports.handler = async (event) => {
          console.log('Security scan analysis started:', JSON.stringify(event, null, 2));
          
          try {
            // Parse security scan results
            const banditResults = JSON.parse(event.banditResults || '{}');
            const safetyResults = JSON.parse(event.safetyResults || '{}');
            const snykResults = JSON.parse(event.snykResults || '{}');
            
            let criticalVulnerabilities = 0;
            let owaspTop10Issues = 0;
            
            // Check Bandit results for OWASP Top 10 issues
            if (banditResults.results) {
              banditResults.results.forEach(result => {
                if (result.issue_severity === 'HIGH' || result.issue_severity === 'MEDIUM') {
                  criticalVulnerabilities++;
                  if (isOwaspTop10Issue(result.test_id)) {
                    owaspTop10Issues++;
                  }
                }
              });
            }
            
            // Check Safety results
            if (safetyResults.vulnerabilities) {
              criticalVulnerabilities += safetyResults.vulnerabilities.length;
            }
            
            // Check Snyk results
            if (snykResults.vulnerabilities) {
              criticalVulnerabilities += snykResults.vulnerabilities.length;
            }
            
            console.log(\`Found \${criticalVulnerabilities} critical vulnerabilities\`);
            console.log(\`Found \${owaspTop10Issues} OWASP Top 10 issues\`);
            
            // Determine if pipeline should continue
            const shouldContinue = criticalVulnerabilities === 0 && owaspTop10Issues === 0;
            
            if (shouldContinue) {
              console.log('Security scan passed - continuing pipeline');
              await codepipeline.putJobSuccessResult({
                jobId: event.jobId
              }).promise();
            } else {
              console.log('Security scan failed - stopping pipeline');
              await codepipeline.putJobFailureResult({
                jobId: event.jobId,
                failureDetails: {
                  type: 'JobFailed',
                  message: \`Security scan failed: \${criticalVulnerabilities} critical vulnerabilities, \${owaspTop10Issues} OWASP Top 10 issues\`
                }
              }).promise();
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                criticalVulnerabilities,
                owaspTop10Issues,
                shouldContinue
              })
            };
            
          } catch (error) {
            console.error('Error in security scan analysis:', error);
            await codepipeline.putJobFailureResult({
              jobId: event.jobId,
              failureDetails: {
                type: 'JobFailed',
                message: \`Security scan analysis failed: \${error.message}\`
              }
            }).promise();
            
            throw error;
          }
        };
        
        function isOwaspTop10Issue(testId) {
          const owaspTop10Tests = [
            'B201', // SQL injection
            'B301', // Command injection
            'B302', // Hardcoded password
            'B303', // Use of insecure MD2, MD4, or MD5 hash function
            'B304', // Use of insecure random function
            'B305', // Use of insecure cipher
            'B306', // Use of insecure cipher mode
            'B307', // Use of insecure cipher algorithm
            'B308', // Use of insecure cipher key
            'B309', // Use of insecure cipher padding
          ];
          return owaspTop10Tests.includes(testId);
        }
      `),
    });
    securityScanAnalysisLambda.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 CodePipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const testOutput = new codepipeline.Artifact('TestOutput');
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `tap-microservices-pipeline-${environmentSuffix}`,
      role: codePipelineRole,
      artifactBucket: pipelineArtifactsBucket,
      stages: [
        // Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'S3_Source',
              bucket: pipelineArtifactsBucket,
              bucketKey: 'source.zip',
              output: sourceOutput,
            }),
          ],
        },
        // Build Stage
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_Application',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        // Test Stage
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Unit_Tests',
              project: unitTestProject,
              input: sourceOutput,
              outputs: [testOutput],
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Integration_Tests',
              project: integrationTestProject,
              input: sourceOutput,
            }),
          ],
        },
        // Security Scan Stage
        {
          stageName: 'SecurityScan',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'SAST_Security_Scan',
              project: securityScanProject,
              input: sourceOutput,
              outputs: [securityScanOutput],
            }),
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'Analyze_Security_Results',
              lambda: securityScanAnalysisLambda,
              inputs: [securityScanOutput],
              userParameters: {
                banditResults: securityScanOutput.atPath('bandit-report.json'),
                safetyResults: securityScanOutput.atPath('safety-report.json'),
                snykResults: securityScanOutput.atPath('snyk-report.json'),
              },
            }),
          ],
        },
        // Staging Deploy Stage
        {
          stageName: 'StagingDeploy',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Approve_Staging_Deploy',
              notificationTopic: stagingApprovalTopic,
              additionalInformation: 'Please review the staging deployment and approve if ready.',
              externalEntityLink: 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines',
            }),
            new codepipeline_actions.S3DeployAction({
              actionName: 'Deploy_To_Staging',
              bucket: stagingBucket,
              input: buildOutput,
              extract: true,
            }),
          ],
        },
        // Production Deploy Stage
        {
          stageName: 'ProductionDeploy',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Approve_Production_Deploy',
              notificationTopic: productionApprovalTopic,
              additionalInformation: 'Please review the production deployment and approve if ready.',
              externalEntityLink: 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines',
            }),
            new codepipeline_actions.S3DeployAction({
              actionName: 'Deploy_To_Production',
              bucket: productionBucket,
              input: buildOutput,
              extract: true,
            }),
          ],
        },
      ],
    });
    pipeline.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 CloudWatch Alarms
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: `tap-pipeline-failure-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionFailed',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    pipelineFailureAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const pipelineStuckAlarm = new cloudwatch.Alarm(this, 'PipelineStuckAlarm', {
      alarmName: `tap-pipeline-stuck-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionDuration',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
      }),
      threshold: 1800, // 30 minutes
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    pipelineStuckAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Add SNS notifications to alarms
    pipelineFailureAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(pipelineNotificationTopic));
    pipelineStuckAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(pipelineNotificationTopic));

    // 🔹 EventBridge Rules
    const pipelineStateChangeRule = new events.Rule(this, 'PipelineStateChangeRule', {
      ruleName: `tap-pipeline-state-change-${environmentSuffix}`,
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          state: ['FAILED', 'SUCCEEDED', 'SUPERSEDED'],
        },
      },
    });
    pipelineStateChangeRule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    pipelineStateChangeRule.addTarget(new targets.SnsTopic(pipelineNotificationTopic));

    // 🔹 Stack Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
    });

    new cdk.CfnOutput(this, 'PipelineNotificationTopicArn', {
      value: pipelineNotificationTopic.topicArn,
      description: 'ARN of the pipeline notification topic',
    });

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: pipelineArtifactsBucket.bucketName,
      description: 'Name of the S3 bucket used as source',
    });

    new cdk.CfnOutput(this, 'StagingBucketName', {
      value: stagingBucket.bucketName,
      description: 'Name of the staging S3 bucket',
    });

    new cdk.CfnOutput(this, 'ProductionBucketName', {
      value: productionBucket.bucketName,
      description: 'Name of the production S3 bucket',
    });
  }
}
```