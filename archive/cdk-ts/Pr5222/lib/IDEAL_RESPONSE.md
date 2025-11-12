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

    // 🔹 S3 Buckets for Artifacts
    const pipelineArtifactsBucket = new s3.Bucket(
      this,
      'PipelineArtifactsBucket',
      {
        bucketName: `tap-pipeline-artifacts-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: pipelineKmsKey,
        versioned: true,
        lifecycleRules: [
          {
            id: 'retain-5-versions',
            noncurrentVersionsToRetain: 5,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        enforceSSL: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }
    );

    const stagingBucket = new s3.Bucket(this, 'StagingBucket', {
      bucketName: `tap-staging-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: stagingKmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'retain-5-versions',
          noncurrentVersionsToRetain: 5,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const productionBucket = new s3.Bucket(this, 'ProductionBucket', {
      bucketName: `tap-production-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: productionKmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'retain-5-versions',
          noncurrentVersionsToRetain: 5,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 🔹 SNS Topics for Notifications
    const pipelineNotificationTopic = new sns.Topic(
      this,
      'PipelineNotificationTopic',
      {
        topicName: `tap-pipeline-notifications-${environmentSuffix}`,
        masterKey: pipelineKmsKey,
      }
    );

    const stagingApprovalTopic = new sns.Topic(
      this,
      'StagingApprovalTopic',
      {
        topicName: `tap-staging-approval-${environmentSuffix}`,
        masterKey: stagingKmsKey,
      }
    );

    const productionApprovalTopic = new sns.Topic(
      this,
      'ProductionApprovalTopic',
      {
        topicName: `tap-production-approval-${environmentSuffix}`,
        masterKey: productionKmsKey,
      }
    );

    // 🔹 IAM Roles
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildDeveloperAccess'),
      ],
    });

    // Grant permissions to CodeBuild role
    pipelineArtifactsBucket.grantReadWrite(codeBuildRole);
    stagingBucket.grantReadWrite(codeBuildRole);
    productionBucket.grantReadWrite(codeBuildRole);
    pipelineKmsKey.grantEncryptDecrypt(codeBuildRole);
    stagingKmsKey.grantEncryptDecrypt(codeBuildRole);
    productionKmsKey.grantEncryptDecrypt(codeBuildRole);

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
              actions: ['iam:PassRole'],
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
              actions: ['sns:Publish'],
              resources: [
                pipelineNotificationTopic.topicArn,
                stagingApprovalTopic.topicArn,
                productionApprovalTopic.topicArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*`,
              ],
            }),
          ],
        }),
      },
    });

    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant additional permissions to Lambda role
    pipelineArtifactsBucket.grantRead(lambdaExecutionRole);
    pipelineKmsKey.grantDecrypt(lambdaExecutionRole);

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `tap-build-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      environmentVariables: {
        ENVIRONMENT_SUFFIX: {
          value: environmentSuffix,
        },
      },
      source: codebuild.Source.s3({
        bucket: pipelineArtifactsBucket,
        path: 'source.zip',
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: pipelineArtifactsBucket,
        name: 'build-artifacts.zip',
      }),
      cache: codebuild.Cache.bucket(pipelineArtifactsBucket, {
        prefix: 'cache',
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
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
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

    const unitTestProject = new codebuild.Project(this, 'UnitTestProject', {
      projectName: `tap-unit-test-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      source: codebuild.Source.s3({
        bucket: pipelineArtifactsBucket,
        path: 'source.zip',
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: pipelineArtifactsBucket,
        name: 'unit-test-results.zip',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'echo Installing dependencies...',
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Unit tests started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Running unit tests...',
              'npm run test:unit',
            ],
          },
          post_build: {
            commands: [
              'echo Unit tests completed on `date`',
            ],
          },
        },
        artifacts: {
          files: ['test-results/**/*', 'coverage/**/*'],
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

    const integrationTestProject = new codebuild.Project(this, 'IntegrationTestProject', {
      projectName: `tap-integration-test-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: false,
      },
      source: codebuild.Source.s3({
        bucket: pipelineArtifactsBucket,
        path: 'source.zip',
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: pipelineArtifactsBucket,
        name: 'integration-test-results.zip',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'echo Installing dependencies...',
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'echo Integration tests started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration',
            ],
          },
          post_build: {
            commands: [
              'echo Integration tests completed on `date`',
            ],
          },
        },
        artifacts: {
          files: ['test-results/**/*', 'coverage/**/*'],
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

    const securityScanProject = new codebuild.Project(this, 'SecurityScanProject', {
      projectName: `tap-security-scan-${environmentSuffix}`,
      role: codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true, // Required for Docker-in-Docker
      },
      source: codebuild.Source.s3({
        bucket: pipelineArtifactsBucket,
        path: 'source.zip',
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket: pipelineArtifactsBucket,
        name: 'security-scan-results.zip',
      }),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18',
            },
            commands: [
              'echo Installing security scanning tools...',
              'npm install -g @snyk/cli',
              'pip install safety bandit',
              'curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin',
            ],
          },
          pre_build: {
            commands: [
              'echo Security scan started on `date`',
            ],
          },
          build: {
            commands: [
              'echo Running security scans...',
              'echo "=== Snyk vulnerability scan ==="',
              'snyk test --json > snyk-results.json || true',
              'echo "=== Safety Python security scan ==="',
              'safety check --json > safety-results.json || true',
              'echo "=== Bandit Python security scan ==="',
              'bandit -r . -f json -o bandit-results.json || true',
              'echo "=== Trivy container scan ==="',
              'trivy image --format json --output trivy-results.json nginx:alpine || true',
            ],
          },
          post_build: {
            commands: [
              'echo Security scan completed on `date`',
              'echo "=== Security scan summary ==="',
              'ls -la *-results.json',
            ],
          },
        },
        artifacts: {
          files: ['*-results.json'],
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
            const snykResults = event.snykResults || {};
            const safetyResults = event.safetyResults || {};
            const banditResults = event.banditResults || {};
            const trivyResults = event.trivyResults || {};
            
            let hasCriticalVulnerabilities = false;
            let hasOWASPTop10 = false;
            const issues = [];
            
            // Check Snyk results
            if (snykResults.vulnerabilities) {
              const criticalVulns = snykResults.vulnerabilities.filter(v => v.severity === 'high' || v.severity === 'critical');
              if (criticalVulns.length > 0) {
                hasCriticalVulnerabilities = true;
                issues.push(\`Found \${criticalVulns.length} critical/high vulnerabilities in dependencies\`);
              }
            }
            
            // Check Safety results
            if (safetyResults.length > 0) {
              hasCriticalVulnerabilities = true;
              issues.push(\`Found \${safetyResults.length} Python security issues\`);
            }
            
            // Check Bandit results
            if (banditResults.results) {
              const highConfidenceIssues = banditResults.results.filter(r => r.issue_confidence === 'HIGH');
              if (highConfidenceIssues.length > 0) {
                hasOWASPTop10 = true;
                issues.push(\`Found \${highConfidenceIssues.length} high-confidence security issues\`);
              }
            }
            
            // Check Trivy results
            if (trivyResults.Results) {
              const criticalIssues = trivyResults.Results.filter(r => r.Vulnerabilities && r.Vulnerabilities.some(v => v.Severity === 'CRITICAL'));
              if (criticalIssues.length > 0) {
                hasCriticalVulnerabilities = true;
                issues.push(\`Found \${criticalIssues.length} critical container vulnerabilities\`);
              }
            }
            
            // Determine if pipeline should fail
            const shouldFail = hasCriticalVulnerabilities || hasOWASPTop10;
            
            console.log('Security analysis results:', {
              hasCriticalVulnerabilities,
              hasOWASPTop10,
              shouldFail,
              issues
            });
            
            // Report back to CodePipeline
            const params = {
              jobId: event.jobId,
              status: shouldFail ? 'FAILED' : 'SUCCEEDED',
              failureDetails: shouldFail ? {
                type: 'JobFailed',
                message: issues.join('; ')
              } : undefined
            };
            
            await codepipeline.putJobSuccessResult(params).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Security scan analysis completed',
                shouldFail,
                issues
              })
            };
            
          } catch (error) {
            console.error('Error in security scan analysis:', error);
            
            // Report failure to CodePipeline
            await codepipeline.putJobFailureResult({
              jobId: event.jobId,
              failureDetails: {
                type: 'JobFailed',
                message: error.message
              }
            }).promise();
            
            throw error;
          }
        };
      `),
    });

    // 🔹 CodePipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const unitTestOutput = new codepipeline.Artifact('UnitTestOutput');
    const integrationTestOutput = new codepipeline.Artifact('IntegrationTestOutput');
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `tap-microservices-pipeline-${environmentSuffix}`,
      role: codePipelineRole,
      artifactBucket: pipelineArtifactsBucket,
      stages: [
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
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Unit_Tests',
              project: unitTestProject,
              input: sourceOutput,
              outputs: [unitTestOutput],
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Integration_Tests',
              project: integrationTestProject,
              input: sourceOutput,
              outputs: [integrationTestOutput],
            }),
          ],
        },
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
                jobId: '#{codepipeline.PipelineExecutionId}',
                snykResults: '#{SecurityScanOutput}',
              },
            }),
          ],
        },
        {
          stageName: 'StagingDeploy',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Approve_Staging_Deploy',
              notificationTopic: stagingApprovalTopic,
              additionalInformation: 'Please review the staging deployment and approve to proceed.',
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
        {
          stageName: 'ProductionDeploy',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Approve_Production_Deploy',
              notificationTopic: productionApprovalTopic,
              additionalInformation: 'Please review the production deployment and approve to proceed.',
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

    const pipelineStuckAlarm = new cloudwatch.Alarm(this, 'PipelineStuckAlarm', {
      alarmName: `tap-pipeline-stuck-${environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CodePipeline',
        metricName: 'PipelineExecutionDuration',
        dimensionsMap: {
          PipelineName: pipeline.pipelineName,
        },
      }),
      threshold: 30, // 30 minutes
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add SNS actions to alarms
    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationTopic)
    );
    pipelineStuckAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationTopic)
    );

    // 🔹 EventBridge Rules
    const pipelineStateChangeRule = new events.Rule(this, 'PipelineStateChangeRule', {
      ruleName: `tap-pipeline-state-change-${environmentSuffix}`,
      description: 'Trigger notifications on pipeline state changes',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED', 'SUCCEEDED', 'SUPERSEDED'],
          pipeline: [pipeline.pipelineName],
        },
      },
    });

    pipelineStateChangeRule.addTarget(
      new targets.SnsTopic(pipelineNotificationTopic)
    );

    // Apply removal policies
    pipelineNotificationTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    stagingApprovalTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    productionApprovalTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    codeBuildRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    codePipelineRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    lambdaExecutionRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    buildProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    unitTestProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    integrationTestProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    securityScanProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    securityScanAnalysisLambda.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    pipeline.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    pipelineFailureAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    pipelineStuckAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    pipelineStateChangeRule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

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

Now let me update the todo list to reflect this fix:
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
todo_write