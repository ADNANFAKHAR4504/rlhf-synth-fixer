**bin/tap.ts**
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'CompanyName-ProjectName-Production', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-west-2' 
  },
});
```

**lib/tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') || 'production';
    const costCenter = this.node.tryGetContext('costCenter') || 'engineering';

    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      isDefault: true
    });

    const lambdaRole = new iam.Role(this, 'CompanyName-ProjectName-LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
      ],
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/CompanyName-ProjectName-*`]
            })
          ]
        })
      }
    });

    const lambdaFunction = new lambda.Function(this, 'CompanyName-ProjectName-Function', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Hello from Lambda!' })
          };
        };
      `),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      environment: {
        ENVIRONMENT: environment,
        COST_CENTER: costCenter
      }
    });

    const vpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'CompanyName-ProjectName-ApiGatewayEndpoint', {
      vpc: vpc,
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    const api = new apigateway.RestApi(this, 'CompanyName-ProjectName-Api', {
      restApiName: 'CompanyName-ProjectName-Api',
      endpointConfiguration: {
        types: [apigateway.EndpointType.PRIVATE],
        vpcEndpoints: [vpcEndpoint]
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:sourceVpc': vpc.vpcId
              }
            }
          })
        ]
      })
    });

    api.root.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction));

    const artifactsBucket = new cdk.aws_s3.Bucket(this, 'CompanyName-ProjectName-PipelineArtifacts', {
      bucketName: `cp-proj-artifacts-${this.account}-${this.region}`,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const buildRole = new iam.Role(this, 'CompanyName-ProjectName-BuildRole', {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        BuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/CompanyName-ProjectName-*`]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject'
              ],
              resources: [artifactsBucket.arnForObjects('*')]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`]
            })
          ]
        })
      }
    });

    const buildProject = new codebuild.Project(this, 'CompanyName-ProjectName-BuildProject', {
      projectName: 'CompanyName-ProjectName-Build',
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18'
            },
            commands: [
              'npm install -g aws-cdk',
              'npm ci'
            ]
          },
          build: {
            commands: [
              'npm run build',
              'cdk synth'
            ]
          }
        },
        artifacts: {
          files: [
            '**/*'
          ]
        }
      })
    });

    const pipelineRole = new iam.Role(this, 'CompanyName-ProjectName-PipelineRole', {
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:GetBucketVersioning'
              ],
              resources: [
                artifactsBucket.bucketArn,
                artifactsBucket.arnForObjects('*')
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild'
              ],
              resources: [buildProject.projectArn]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:CreateStack',
                'cloudformation:DeleteStack',
                'cloudformation:DescribeStacks',
                'cloudformation:UpdateStack',
                'cloudformation:CreateChangeSet',
                'cloudformation:DeleteChangeSet',
                'cloudformation:DescribeChangeSet',
                'cloudformation:ExecuteChangeSet',
                'cloudformation:SetStackPolicy',
                'cloudformation:ValidateTemplate'
              ],
              resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/CompanyName-ProjectName-*/*`]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`]
            })
          ]
        })
      }
    });

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    new codepipeline.Pipeline(this, 'CompanyName-ProjectName-Pipeline', {
      pipelineName: 'CompanyName-ProjectName-Pipeline',
      role: pipelineRole,
      artifactBucket: artifactsBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.S3SourceAction({
              actionName: 'Source',
              bucket: artifactsBucket,
              bucketKey: 'source.zip',
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput]
            })
          ]
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy',
              templatePath: buildOutput.atPath('cdk.out/CompanyName-ProjectName-Production.template.json'),
              stackName: 'CompanyName-ProjectName-Production',
              adminPermissions: true
            })
          ]
        }
      ]
    });

    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('CostCenter', costCenter);
    cdk.Tags.of(this).add('Project', 'CompanyName-ProjectName');
  }
}
```

**cdk.json**
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-northamerica:includeApiGatewayAccountConfig": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceActions": true
  }
}
```