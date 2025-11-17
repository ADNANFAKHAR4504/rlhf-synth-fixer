import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 🔹 KMS Keys for encryption
    const pipelineKmsKey = new kms.Key(this, 'PipelineKmsKey', {
      enableKeyRotation: true,
      alias: `tap-pipeline-key-${environmentSuffix}`,
      description: 'KMS key for pipeline artifacts',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const stagingKmsKey = new kms.Key(this, 'StagingKmsKey', {
      enableKeyRotation: true,
      alias: `tap-staging-key-${environmentSuffix}`,
      description: 'KMS key for staging environment',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const productionKmsKey = new kms.Key(this, 'ProductionKmsKey', {
      enableKeyRotation: true,
      alias: `tap-production-key-${environmentSuffix}`,
      description: 'KMS key for production environment',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 🔹 S3 Buckets for artifacts
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

    // 🔹 SNS Topics for notifications
    const pipelineNotificationTopic = new sns.Topic(
      this,
      'PipelineNotificationTopic',
      {
        topicName: `tap-pipeline-notifications-${environmentSuffix}`,
        masterKey: pipelineKmsKey,
      }
    );
    pipelineNotificationTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const stagingApprovalTopic = new sns.Topic(this, 'StagingApprovalTopic', {
      topicName: `tap-staging-approval-${environmentSuffix}`,
      masterKey: stagingKmsKey,
    });
    stagingApprovalTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const productionApprovalTopic = new sns.Topic(
      this,
      'ProductionApprovalTopic',
      {
        topicName: `tap-production-approval-${environmentSuffix}`,
        masterKey: productionKmsKey,
      }
    );
    productionApprovalTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 Source Configuration (using S3 instead of CodeCommit)
    // Note: CodeCommit requires an existing repository in the account
    // Using S3 as source for this deployment

    // 🔹 IAM Roles
    const codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AWSCodeBuildDeveloperAccess'
        ),
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
    codePipelineRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const lambdaExecutionRole = new iam.Role(this, 'SecurityScanLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
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
              actions: [
                'codepipeline:PutJobSuccessResult',
                'codepipeline:PutJobFailureResult',
              ],
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
    lambdaExecutionRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 CodeBuild Projects
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `tap-build-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      cache: codebuild.Cache.bucket(pipelineArtifactsBucket, {
        prefix: 'build-cache',
      }),
      role: codeBuildRole,
      logging: {
        cloudWatch: {
          logGroup: new logs.LogGroup(this, 'BuildLogGroup', {
            logGroupName: `/aws/codebuild/tap-build-${environmentSuffix}`,
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
              nodejs: 18,
            },
            commands: ['npm install -g npm@latest', 'npm ci'],
          },
          build: {
            commands: ['npm run build', 'npm run package'],
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
    buildProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const unitTestProject = new codebuild.PipelineProject(
      this,
      'UnitTestProject',
      {
        projectName: `tap-unit-test-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        role: codeBuildRole,
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'UnitTestLogGroup', {
              logGroupName: `/aws/codebuild/tap-unit-test-${environmentSuffix}`,
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
      }
    );
    unitTestProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const integrationTestProject = new codebuild.PipelineProject(
      this,
      'IntegrationTestProject',
      {
        projectName: `tap-integration-test-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.MEDIUM,
        },
        role: codeBuildRole,
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'IntegrationTestLogGroup', {
              logGroupName: `/aws/codebuild/tap-integration-test-${environmentSuffix}`,
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
      }
    );
    integrationTestProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const securityScanProject = new codebuild.PipelineProject(
      this,
      'SecurityScanProject',
      {
        projectName: `tap-security-scan-${environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.MEDIUM,
        },
        role: codeBuildRole,
        logging: {
          cloudWatch: {
            logGroup: new logs.LogGroup(this, 'SecurityScanLogGroup', {
              logGroupName: `/aws/codebuild/tap-security-scan-${environmentSuffix}`,
              retention: logs.RetentionDays.THREE_MONTHS,
            }),
          },
        },
        encryptionKey: pipelineKmsKey,
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              commands: ['npm install -g snyk', 'npm audit'],
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
      }
    );
    securityScanProject.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 Lambda Function for Security Scan Analysis
    const securityScanAnalysisLambda = new lambda.Function(
      this,
      'SecurityScanAnalysisLambda',
      {
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
      }
    );
    securityScanAnalysisLambda.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 🔹 CodePipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `tap-microservices-pipeline-${environmentSuffix}`,
      artifactBucket: pipelineArtifactsBucket,
      role: codePipelineRole,
      restartExecutionOnUpdate: false,
    });
    pipeline.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Source artifacts
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const securityScanOutput = new codepipeline.Artifact('SecurityScanOutput');

    // 🔹 Source Stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.S3SourceAction({
          actionName: 'S3_Source',
          bucket: pipelineArtifactsBucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
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
          additionalInformation:
            'Please review test results and approve staging deployment',
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
          additionalInformation:
            'Please review staging validation and approve production deployment',
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
    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `tap-pipeline-failure-${environmentSuffix}`,
        alarmDescription: 'Alert when pipeline execution fails',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionFailed',
          dimensionsMap: {
            PipelineName: pipeline.pipelineName,
          },
        }),
        threshold: 1,
        evaluationPeriods: 1,
      }
    );
    pipelineFailureAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationTopic)
    );

    const pipelineStuckAlarm = new cloudwatch.Alarm(
      this,
      'PipelineStuckAlarm',
      {
        alarmName: `tap-pipeline-stuck-${environmentSuffix}`,
        alarmDescription: 'Alert when pipeline execution exceeds 30 minutes',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/CodePipeline',
          metricName: 'PipelineExecutionDuration',
          dimensionsMap: {
            PipelineName: pipeline.pipelineName,
          },
          statistic: 'Maximum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1800000, // 30 minutes in milliseconds
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    pipelineStuckAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    pipelineStuckAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(pipelineNotificationTopic)
    );

    // 🔹 Pipeline State Change Notifications
    const pipelineStateChangeRule = new events.Rule(
      this,
      'PipelineStateChangeRule',
      {
        eventPattern: {
          source: ['aws.codepipeline'],
          detailType: ['CodePipeline Pipeline Execution State Change'],
          detail: {
            pipeline: [pipeline.pipelineName],
            state: ['FAILED', 'SUCCEEDED', 'SUPERSEDED'],
          },
        },
      }
    );
    pipelineStateChangeRule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    pipelineStateChangeRule.addTarget(
      new events_targets.SnsTopic(pipelineNotificationTopic)
    );

    // 🔹 Develop Branch Pipeline Trigger (removed - using S3 source instead of CodeCommit)

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

    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: pipelineArtifactsBucket.bucketName,
      description: 'Name of the S3 bucket used as source',
    });

    new cdk.CfnOutput(this, 'PipelineNotificationTopicArn', {
      value: pipelineNotificationTopic.topicArn,
      description: 'ARN of the pipeline notification topic',
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
