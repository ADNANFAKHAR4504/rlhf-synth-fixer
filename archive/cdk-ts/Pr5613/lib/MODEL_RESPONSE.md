### Reasoning Trace
---

Alright, I need to create a comprehensive AWS CDK TypeScript program that implements a multi-stage CI/CD pipeline with all the specified requirements. Let me break down what I need to include:

1. **CodePipeline with stages:**
   - Source (CodeCommit)
   - Build
   - Test (parallel unit and integration tests)
   - Security scan
   - Staging deploy
   - Production deploy

2. **Key components:**
   - CodeCommit repository with branch triggers
   - Multiple CodeBuild projects (unit tests, integration tests, SAST)
   - Lambda for security scan result parsing
   - S3 buckets for staging and production
   - SNS topics for notifications
   - Manual approval actions
   - IAM roles with least privilege
   - CloudWatch alarms
   - KMS keys for encryption

3. **Constraints to implement:**
   - Keep last 5 successful artifacts
   - Block on OWASP Top 10 vulnerabilities
   - Separate KMS keys per environment
   - 90-day log retention
   - Different SNS topics for different environments
   - Build caching for <5 minute builds

Let me structure this properly:

**main.ts** - Simple CDK app initialization
**tapstack.ts** - The complete stack with all resources

I'll organize the stack logically:
1. KMS keys
2. S3 buckets
3. SNS topics
4. CodeCommit repository
5. IAM roles
6. CodeBuild projects
7. Lambda function
8. CodePipeline
9. CloudWatch alarms

Let me start coding...
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

new TapStack(app, 'TapCICDPipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Multi-stage CI/CD pipeline with security scanning and approval workflows'
});

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔹 KMS Keys for encryption
    const stagingKmsKey = new kms.Key(this, 'StagingKmsKey', {
      enableKeyRotation: true,
      alias: 'tap-pipeline-staging-key',
      description: 'KMS key for staging environment artifacts',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const productionKmsKey = new kms.Key(this, 'ProductionKmsKey', {
      enableKeyRotation: true,
      alias: 'tap-pipeline-production-key',
      description: 'KMS key for production environment artifacts',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const pipelineKmsKey = new kms.Key(this, 'PipelineKmsKey', {
      enableKeyRotation: true,
      alias: 'tap-pipeline-artifacts-key',
      description: 'KMS key for pipeline artifacts',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 🔹 S3 Buckets for artifacts
    const pipelineArtifactsBucket = new s3.Bucket(this, 'PipelineArtifactsBucket', {
      bucketName: `tap-pipeline-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: pipelineKmsKey,
      versioned: true,
      lifecycleRules: [{
        id: 'retain-5-versions',
        noncurrentVersionsToRetain: 5,
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const stagingBucket = new s3.Bucket(this, 'StagingBucket', {
      bucketName: `tap-staging-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: stagingKmsKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const productionBucket = new s3.Bucket(this, 'ProductionBucket', {
      bucketName: `tap-production-artifacts-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: productionKmsKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 🔹 SNS Topics for notifications
    const pipelineNotificationTopic = new sns.Topic(this, 'PipelineNotificationTopic', {
      topicName: 'tap-pipeline-notifications',
      masterKey: kms.Alias.fromAliasName(this, 'SnsKey', 'alias/aws/sns'),
    });

    const stagingApprovalTopic = new sns.Topic(this, 'StagingApprovalTopic', {
      topicName: 'tap-staging-approval-notifications',
      masterKey: kms.Alias.fromAliasName(this, 'StagingSnsKey', 'alias/aws/sns'),
    });

    const productionApprovalTopic = new sns.Topic(this, 'ProductionApprovalTopic', {
      topicName: 'tap-production-approval-notifications',
      masterKey: kms.Alias.fromAliasName(this, 'ProductionSnsKey', 'alias/aws/sns'),
    });

    // 🔹 CodeCommit Repository
    const repository = new codecommit.Repository(this, 'SourceRepository', {
      repositoryName: 'tap-microservices-repo',
      description: 'Repository for microservices application code',
    });

    // 🔹 IAM Roles
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildDeveloperAccess')
      ],
      inlinePolicies: {
        CodeBuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${pipelineArtifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
              resources: [pipelineKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    const codePipelineRole = new iam.Role(this, 'CodePipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipelineFullAccess')
      ],
    });

    const lambdaExecutionRole = new iam.Role(this, 'SecurityScanLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        LambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: [`${pipelineArtifactsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codepipeline:PutJobSuccessResult', 'codepipeline:PutJobFailureResult'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt'],
              resources: [pipelineKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: 'tap-build-project',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      cache: codebuild.Cache.s3(pipelineArtifactsBucket, {
        prefix: 'build-cache',
      }),
      role: codeBuildRole,
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: '/aws/codebuild/tap-build-project',
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
      encryptionKey: pipelineKmsKey,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: 14,
            },
            commands: [
              'npm install -g npm@latest',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm run package',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
          name: 'BuildArtifact',
        },
        cache: {
          paths: ['node_modules/**/*'],
        },
      }),
    });

    const unitTestProject = new codebuild.PipelineProject(this, 'UnitTestProject', {
      projectName: 'tap-unit-test-project',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      role: codeBuildRole,
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
            logGroupName: '/aws/codebuild/tap-unit-test-project',
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
      encryptionKey: pipelineKmsKey,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm ci'],
          },
          build: {
            commands: ['npm run test:unit'],
          },
        },
        reports: {
          UnitTestReport: {
            files: ['test-results/unit/**/*.xml'],
            'file-format': 'JunitXml',
          },
        },
      }),
    });

    const integrationTestProject = new codebuild.PipelineProject(this, 'IntegrationTestProject', {
      projectName: 'tap-integration-test-project',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      role: codeBuildRole,
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
            logGroupName: '/aws/codebuild/tap-integration-test-project',
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
      encryptionKey: pipelineKmsKey,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['npm ci'],
          },
          build: {
            commands: ['npm run test:integration'],
          },
        },
        reports: {
          IntegrationTestReport: {
            files: ['test-results/integration/**/*.xml'],
            'file-format': 'JunitXml',
          },
        },
      }),
    });

    const securityScanProject = new codebuild.PipelineProject(this, 'SecurityScanProject', {
      projectName: 'tap-security-scan-project',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      role: codeBuildRole,
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'SecurityScanLogGroup', {
            logGroupName: '/aws/codebuild/tap-security-scan-project',
            retention: logs.RetentionDays.THREE_MONTHS,
          }),
        },
      },
      encryptionKey: pipelineKmsKey,
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm install -g snyk',
              'npm audit',
            ],
          },
          build: {
            commands: [
              'snyk test --severity-threshold=high --json > security-scan-results.json || true',
              'npm run lint:security',
            ],
          },
        },
        artifacts: {
          files: ['security-scan-results.json'],
          name: 'SecurityScanResults',
        },
      }),
    });

    // 🔹 Lambda Function for Security Scan Analysis
    const securityScanAnalysisLambda = new lambda.Function(this, 'SecurityScanAnalysisLambda', {
      functionName: 'tap-security-scan-analysis',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      logRetention: logs.RetentionDays.THREE_MONTHS,
      environment: {
        CRITICAL_VULNERABILITY_THRESHOLD: '0',
        OWASP_TOP_10_CHECK: 'true',
      },
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const codepipeline = new AWS.CodePipeline();
        
        exports.handler = async (event) => {
          const job = event['CodePipeline.job'];
          const jobId = job.id;
          const inputBucket = job.data.inputArtifacts[0].location.s3Location.bucketName;
          const inputKey = job.data.inputArtifacts[0].location.s3Location.objectKey;
          
          try {
            // Get security scan results
            const scanResults = await s3.getObject({
              Bucket: inputBucket,
              Key: inputKey + '/security-scan-results.json'
            }).promise();
            
            const results = JSON.parse(scanResults.Body.toString());
            
            // Check for OWASP Top 10 vulnerabilities
            const owaspVulnerabilities = [
              'SQL Injection',
              'Broken Authentication',
              'Sensitive Data Exposure',
              'XML External Entities',
              'Broken Access Control',
              'Security Misconfiguration',
              'Cross-Site Scripting',
              'Insecure Deserialization',
              'Using Components with Known Vulnerabilities',
              'Insufficient Logging & Monitoring'
            ];
            
            let criticalFound = false;
            let owaspFound = false;
            
            if (results.vulnerabilities) {
              results.vulnerabilities.forEach(vuln => {
                if (vuln.severity === 'critical' || vuln.severity === 'high') {
                  criticalFound = true;
                }
                
                owaspVulnerabilities.forEach(owasp => {
                  if (vuln.title && vuln.title.toLowerCase().includes(owasp.toLowerCase())) {
                    owaspFound = true;
                  }
                });
              });
            }
            
            if (criticalFound || owaspFound) {
              await codepipeline.putJobFailureResult({
                jobId: jobId,
                failureDetails: {
                  message: \`Security scan failed: \${criticalFound ? 'Critical vulnerabilities found. ' : ''}\${owaspFound ? 'OWASP Top 10 vulnerabilities detected.' : ''}\`
                }
              }).promise();
            } else {
              await codepipeline.putJobSuccessResult({
                jobId: jobId,
                outputVariables: {
                  SecurityScanPassed: 'true'
                }
              }).promise();
            }
          } catch (error) {
            console.error('Error processing security scan:', error);
            await codepipeline.putJobFailureResult({
              jobId: jobId,
              failureDetails: {
                message: 'Error processing security scan results: ' + error.message
              }
            }).promise();
          }
        };
      `),
    });

    // 🔹 CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'tap-microservices-pipeline',
      artifactBucket: pipelineArtifactsBucket,
      role: codePipelineRole,
      restartExecutionOnUpdate: false,
    });

    // Source artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');

    // 🔹 Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit_Source',
          repository: repository,
          branch: 'main',
          output: sourceOutput,
          trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
        }),
      ],
    });

    // 🔹 Build Stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build_Application',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // 🔹 Test Stage (Parallel)
    pipeline.addStage({
      stageName: 'Test',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Unit_Tests',
          project: unitTestProject,
          input: sourceOutput,
          runOrder: 1,
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Integration_Tests',
          project: integrationTestProject,
          input: sourceOutput,
          runOrder: 1,
        }),
      ],
    });

    // 🔹 Security Scan Stage
    pipeline.addStage({
      stageName: 'SecurityScan',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'SAST_Security_Scan',
          project: securityScanProject,
          input: sourceOutput,
          outputs: [securityScanOutput],
          runOrder: 1,
        }),
        new codepipeline_actions.LambdaInvokeAction({
          actionName: 'Analyze_Security_Results',
          lambda: securityScanAnalysisLambda,
          inputs: [securityScanOutput],
          runOrder: 2,
        }),
      ],
    });

    // 🔹 Staging Deploy Stage
    pipeline.addStage({
      stageName: 'StagingDeploy',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Approve_Staging_Deploy',
          notificationTopic: stagingApprovalTopic,
          additionalInformation: 'Please review test results and approve staging deployment',
          runOrder: 1,
        }),
        new codepipeline_actions.S3DeployAction({
          actionName: 'Deploy_To_Staging',
          bucket: stagingBucket,
          input: buildOutput,
          extract: true,
          objectKey: 'staging-deploy',
          runOrder: 2,
        }),
      ],
    });

    // 🔹 Production Deploy Stage
    pipeline.addStage({
      stageName: 'ProductionDeploy',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'Approve_Production_Deploy',
          notificationTopic: productionApprovalTopic,
          additionalInformation: 'Please review staging validation and approve production deployment',
          externalEntityLink: 'https://staging.example.com',
          runOrder: 1,
        }),
        new codepipeline_actions.S3DeployAction({
          actionName: 'Deploy_To_Production',
          bucket: productionBucket,
          input: buildOutput,
          extract: true,
          objectKey: 'production-deploy',
          runOrder: 2,
        }),
      ],
    });

    // 🔹 CloudWatch Alarms
    const pipelineFailureAlarm = new cloudwatch.Alarm(this, 'PipelineFailureAlarm', {
      alarmName: 'tap-pipeline-failure-alarm',
      alarmDescription: 'Alert when pipeline execution fails',
      metric: pipeline.metricPipelineFailed(),
      threshold: 1,
      evaluationPeriods: 1,
    });

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationTopic)
    );

    const pipelineStuckAlarm = new cloudwatch.Alarm(this, 'PipelineStuckAlarm', {
      alarmName: 'tap-pipeline-stuck-alarm',
      alarmDescription: 'Alert when pipeline execution exceeds 30 minutes',
      metric: pipeline.metricDuration({
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1800000, // 30 minutes in milliseconds
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    pipelineStuckAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationTopic)
    );

    // 🔹 Pipeline State Change Notifications
    const pipelineStateChangeRule = new events.Rule(this, 'PipelineStateChangeRule', {
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          pipeline: [pipeline.pipelineName],
          state: ['FAILED', 'SUCCEEDED', 'SUPERSEDED'],
        },
      },
    });

    pipelineStateChangeRule.addTarget(
      new events_targets.SnsTopic(pipelineNotificationTopic)
    );

    // 🔹 Develop Branch Pipeline Trigger
    new events.Rule(this, 'DevelopBranchTrigger', {
      eventPattern: {
        source: ['aws.codecommit'],
        detailType: ['CodeCommit Repository State Change'],
        detail: {
          repositoryName: [repository.repositoryName],
          referenceType: ['branch'],
          referenceName: ['develop'],
        },
      },
      targets: [
        new events_targets.CodePipeline(pipeline, {
          eventRole: new iam.Role(this, 'DevelopBranchTriggerRole', {
            assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
            inlinePolicies: {
              StartPipelinePolicy: new iam.PolicyDocument({
                statements: [
                  new iam.PolicyStatement({
                    actions: ['codepipeline:StartPipelineExecution'],
                    resources: [pipeline.pipelineArn],
                  }),
                ],
              }),
            },
          }),
        }),
      ],
    });

    // 🔹 Grant permissions
    pipelineArtifactsBucket.grantReadWrite(codeBuildRole);
    pipelineArtifactsBucket.grantRead(lambdaExecutionRole);
    stagingBucket.grantWrite(codePipelineRole);
    productionBucket.grantWrite(codePipelineRole);
    pipelineKmsKey.grantEncryptDecrypt(codeBuildRole);
    pipelineKmsKey.grantDecrypt(lambdaExecutionRole);
    stagingKmsKey.grantEncryptDecrypt(codePipelineRole);
    productionKmsKey.grantEncryptDecrypt(codePipelineRole);

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'Name of the CI/CD pipeline',
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
      value: repository.repositoryCloneUrlHttp,
      description: 'Clone URL for the CodeCommit repository',
    });

    new cdk.CfnOutput(this, 'PipelineNotificationTopicArn', {
      value: pipelineNotificationTopic.topicArn,
      description: 'ARN of the pipeline notification topic',
    });
  }
}
```