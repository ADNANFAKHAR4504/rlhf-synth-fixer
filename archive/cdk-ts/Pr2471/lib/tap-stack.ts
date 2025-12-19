import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = 'Production';
    const costCenter = 'Engineering';
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const stackBaseName = `TapStack${environmentSuffix}`;

    // Use a simpler approach - create VPC instead of lookup to avoid context issues
    const vpc = new ec2.Vpc(this, `${stackBaseName}-vpc`, {
      maxAzs: 2,
      natGateways: 0, // Use public subnets only to reduce cost
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const lambdaRole = new iam.Role(this, `${stackBaseName}-lambda-role`, {
      roleName: `${stackBaseName}-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${stackBaseName}-*`,
              ],
            }),
          ],
        }),
      },
    });

    const lambdaFunction = new lambda.Function(
      this,
      `${stackBaseName}-function`,
      {
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
        role: lambdaRole,
        functionName: `${stackBaseName}-function`,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        environment: {
          ENVIRONMENT: environment,
          COST_CENTER: costCenter,
        },
        allowPublicSubnet: true,
      }
    );

    const vpcEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      `${stackBaseName}-api-gateway-endpoint`,
      {
        vpc: vpc,
        service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
        subnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    const api = new apigateway.RestApi(this, `${stackBaseName}-api`, {
      restApiName: `${stackBaseName}-api`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.PRIVATE],
        vpcEndpoints: [vpcEndpoint],
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
                'aws:sourceVpc': vpc.vpcId,
              },
            },
          }),
        ],
      }),
    });

    api.root.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction));

    const artifactsBucket = new s3.Bucket(
      this,
      `${stackBaseName}-artifacts-bucket`,
      {
        bucketName: `${stackBaseName.toLowerCase()}-artifacts-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const buildRole = new iam.Role(this, `${stackBaseName}-build-role`, {
      roleName: `${stackBaseName}-build-role`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        BuildPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/codebuild/${stackBaseName}-*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [artifactsBucket.arnForObjects('*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
            }),
          ],
        }),
      },
    });

    const buildProject = new codebuild.Project(
      this,
      `${stackBaseName}-build-project`,
      {
        projectName: `${stackBaseName}-build`,
        role: buildRole,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '18',
              },
            },
            build: {
              commands: ['echo "Build completed on `date`"'],
            },
          },
          artifacts: {
            files: ['**/*'],
          },
        }),
      }
    );

    const pipelineRole = new iam.Role(this, `${stackBaseName}-pipeline-role`, {
      roleName: `${stackBaseName}-pipeline-role`,
      assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
      inlinePolicies: {
        PipelinePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:GetBucketVersioning',
              ],
              resources: [
                artifactsBucket.bucketArn,
                artifactsBucket.arnForObjects('*'),
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['codebuild:BatchGetBuilds', 'codebuild:StartBuild'],
              resources: [buildProject.projectArn],
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
                'cloudformation:ValidateTemplate',
              ],
              resources: [
                `arn:aws:cloudformation:${this.region}:${this.account}:stack/${stackBaseName}-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sts:AssumeRole'],
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
            }),
          ],
        }),
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    new codepipeline.Pipeline(this, `${stackBaseName}-pipeline`, {
      pipelineName: `${stackBaseName}-pipeline`,
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
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy',
              templatePath: buildOutput.atPath(
                `cdk.out/${stackBaseName}-template.json`
              ),
              stackName: `${stackBaseName}`,
              adminPermissions: true,
            }),
          ],
        },
      ],
    });

    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('CostCenter', costCenter);
    cdk.Tags.of(this).add('Project', `${stackBaseName}`);

    // Stack Outputs for Integration Tests
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${stackBaseName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `${stackBaseName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda execution role ARN',
      exportName: `${stackBaseName}-LambdaRoleArn`,
    });

    new cdk.CfnOutput(this, 'BuildRoleArn', {
      value: buildRole.roleArn,
      description: 'CodeBuild service role ARN',
      exportName: `${stackBaseName}-BuildRoleArn`,
    });

    new cdk.CfnOutput(this, 'PipelineRoleArn', {
      value: pipelineRole.roleArn,
      description: 'CodePipeline service role ARN',
      exportName: `${stackBaseName}-PipelineRoleArn`,
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'S3 bucket for pipeline artifacts',
      exportName: `${stackBaseName}-ArtifactsBucketName`,
    });

    new cdk.CfnOutput(this, 'CodePipelineArn', {
      value: `arn:aws:codepipeline:${this.region}:${this.account}:${stackBaseName}-pipeline`,
      description: 'CodePipeline ARN',
      exportName: `${stackBaseName}-CodePipelineArn`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${stackBaseName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcPublicSubnets', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: `${stackBaseName}-VpcPublicSubnets`,
    });
  }
}
