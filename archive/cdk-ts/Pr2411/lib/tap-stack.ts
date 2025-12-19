import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as xray from 'aws-cdk-lib/aws-xray';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  projectName?: string;
  environment?: string;
  domainName?: string;
  hostedZoneId?: string;
  dynamoDbReadCapacity?: number;
  dynamoDbWriteCapacity?: number;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: props.env?.account,
        region: 'us-west-2',
      },
    });

    const {
      environmentSuffix,
      projectName = 'tap',
      environment = environmentSuffix,
      domainName,
      hostedZoneId,
      dynamoDbReadCapacity = 500,
      dynamoDbWriteCapacity = 500,
      githubOwner,
      githubRepo,
      githubBranch = 'main',
    } = props;

    // Apply tags to the stack
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Generate random suffix for unique resource naming
    const randomSuffix = Math.random().toString(36).substring(2, 8);

    // Helper function to generate resource names with randomness
    const getResourceName = (resourceType: string): string => {
      return `${projectName}-${environmentSuffix}-${resourceType}-${randomSuffix}`;
    };

    // VPC Configuration
    const vpc = new ec2.Vpc(this, getResourceName('vpc'), {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // KMS Keys for encryption
    const kmsKey = new kms.Key(this, getResourceName('kms-key'), {
      alias: getResourceName('kms-key'),
      description: `KMS key for ${projectName} ${environment} encryption`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // Secrets Manager for storing sensitive configuration
    const appSecrets = new secretsmanager.Secret(
      this,
      getResourceName('secrets'),
      {
        secretName: getResourceName('app-secrets'),
        description: `Application secrets for ${projectName} ${environment}`,
        encryptionKey: kmsKey,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      }
    );

    // DynamoDB Table with KMS encryption and backup
    const dynamoTable = new dynamodb.Table(
      this,
      getResourceName('dynamodb-table'),
      {
        tableName: getResourceName('data-table'),
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: dynamoDbReadCapacity,
        writeCapacity: dynamoDbWriteCapacity,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: kmsKey,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      }
    );

    // Enable auto-scaling for DynamoDB
    const readScaling = dynamoTable.autoScaleReadCapacity({
      minCapacity: dynamoDbReadCapacity,
      maxCapacity: dynamoDbReadCapacity * 10,
    });
    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    const writeScaling = dynamoTable.autoScaleWriteCapacity({
      minCapacity: dynamoDbWriteCapacity,
      maxCapacity: dynamoDbWriteCapacity * 10,
    });
    writeScaling.scaleOnUtilization({
      targetUtilizationPercent: 70,
    });

    // S3 Bucket for static content with versioning and KMS encryption
    const s3Bucket = new s3.Bucket(this, getResourceName('s3-bucket'), {
      bucketName: getResourceName('static-content'),
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // CloudWatch Log Groups
    const lambdaLogGroup = new logs.LogGroup(
      this,
      getResourceName('lambda-logs'),
      {
        logGroupName: `/aws/lambda/${getResourceName('api-handler')}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // IAM Role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, getResourceName('lambda-role'), {
      roleName: getResourceName('lambda-execution-role'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [dynamoTable.tableArn],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${s3Bucket.bucketArn}/*`],
            }),
          ],
        }),
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [appSecrets.secretArn],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Lambda Security Group
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      getResourceName('lambda-sg'),
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Lambda Function with retry logic and proper configuration
    const lambdaFunction = new lambda.Function(
      this,
      getResourceName('lambda-function'),
      {
        functionName: getResourceName('api-handler'),
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const AWSXRay = require('aws-xray-sdk-core');
        const aws = AWSXRay.captureAWS(AWS);
        
        const dynamodb = new aws.DynamoDB.DocumentClient();
        const s3 = new aws.S3();
        const secretsManager = new aws.SecretsManager();
        
        exports.handler = async (event, context) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
            // Retry logic wrapper
            const retryOperation = async (operation, maxRetries = 3) => {
              for (let i = 0; i < maxRetries; i++) {
                try {
                  return await operation();
                } catch (error) {
                  console.log(\`Attempt \${i + 1} failed:\`, error);
                  if (i === maxRetries - 1) throw error;
                  await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                }
              }
            };
            
            const response = await retryOperation(async () => {
              // Sample DynamoDB operation
              const params = {
                TableName: '${dynamoTable.tableName}',
                Item: {
                  id: context.requestId,
                  timestamp: Date.now(),
                  data: event.body || 'Hello from Lambda!'
                }
              };
              
              await dynamodb.put(params).promise();
              
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                  message: 'Success',
                  requestId: context.requestId,
                  timestamp: new Date().toISOString()
                })
              };
            });
            
            return response;
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Internal Server Error',
                error: error.message
              })
            };
          }
        };
      `),
        environment: {
          DYNAMODB_TABLE_NAME: dynamoTable.tableName,
          S3_BUCKET_NAME: s3Bucket.bucketName,
          SECRETS_ARN: appSecrets.secretArn,
          KMS_KEY_ID: kmsKey.keyId,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        reservedConcurrentExecutions: 100,
        retryAttempts: 2,
        tracing: lambda.Tracing.ACTIVE,
        logGroup: lambdaLogGroup,
      }
    );

    // API Gateway with proper configuration
    const api = new apigateway.RestApi(this, getResourceName('api-gateway'), {
      restApiName: getResourceName('api'),
      description: `API Gateway for ${projectName} ${environment}`,
      deployOptions: {
        stageName: environment,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Create usage plan for API throttling (correct approach)
    const usagePlan = new apigateway.UsagePlan(
      this,
      getResourceName('usage-plan'),
      {
        name: getResourceName('api-usage-plan'),
        description: `Usage plan for ${projectName} ${environment}`,
        throttle: {
          rateLimit: 1000, // 1000 requests per second
          burstLimit: 2000, // 2000 concurrent requests
        },
        quota: {
          limit: 1000000, // 1 million requests per month
          period: apigateway.Period.MONTH,
        },
      }
    );

    // Associate usage plan with API stage
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // API Gateway integration with Lambda
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const apiResource = api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');
    v1Resource.addMethod('GET', lambdaIntegration);
    v1Resource.addMethod('POST', lambdaIntegration);

    // WAF for API Gateway security
    const webAcl = new wafv2.CfnWebACL(this, getResourceName('waf-acl'), {
      name: getResourceName('api-waf'),
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: `WAF for ${projectName} ${environment} API Gateway`,
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: getResourceName('waf-metric'),
      },
    });

    // Associate WAF with API Gateway - add explicit dependency
    const wafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      getResourceName('waf-association'),
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${environment}`,
        webAclArn: webAcl.attrArn,
      }
    );

    // Ensure WebACL is created before association
    wafAssociation.addDependency(webAcl);
    // Ensure API deployment is complete before WAF association
    wafAssociation.node.addDependency(api.deploymentStage);

    // CloudFront Distribution
    let certificate: certificatemanager.ICertificate | undefined;
    let hostedZone: route53.IHostedZone | undefined;

    if (domainName && hostedZoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        getResourceName('hosted-zone'),
        {
          hostedZoneId: hostedZoneId,
          zoneName: domainName,
        }
      );

      certificate = new certificatemanager.Certificate(
        this,
        getResourceName('certificate'),
        {
          domainName: `api.${domainName}`,
          validation:
            certificatemanager.CertificateValidation.fromDns(hostedZone),
        }
      );
    }

    const distribution = new cloudfront.Distribution(
      this,
      getResourceName('cloudfront'),
      {
        defaultBehavior: {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
        domainNames: certificate ? [`api.${domainName}`] : undefined,
        certificate: certificate,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enabled: true,
        comment: `CloudFront distribution for ${projectName} ${environment}`,
      }
    );

    // Route 53 record for custom domain
    if (hostedZone && domainName) {
      new route53.ARecord(this, getResourceName('api-record'), {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromAlias(
          new targets.CloudFrontTarget(distribution)
        ),
      });
    }

    // X-Ray Tracing Configuration - Fixed sampling rule
    new xray.CfnSamplingRule(this, getResourceName('xray-sampling'), {
      samplingRule: {
        ruleName: getResourceName('sampling-rule'),
        priority: 9000,
        fixedRate: 0.1,
        reservoirSize: 1,
        serviceName: '*',
        serviceType: '*',
        host: '*',
        httpMethod: '*',
        urlPath: '*',
        resourceArn: '*',
        version: 1,
      },
    });

    // CloudWatch Alarms and Monitoring
    new cloudwatch.Alarm(this, getResourceName('api-error-alarm'), {
      alarmName: getResourceName('api-gateway-errors'),
      metric: api.metricServerError(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, getResourceName('lambda-error-alarm'), {
      alarmName: getResourceName('lambda-errors'),
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, getResourceName('dynamodb-throttle-alarm'), {
      alarmName: getResourceName('dynamodb-throttles'),
      metric: dynamoTable.metricThrottledRequestsForOperation('GetItem'),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // CI/CD Pipeline
    if (githubOwner && githubRepo) {
      // CodeCommit repository (alternative to GitHub)
      const codeRepo = new codecommit.Repository(
        this,
        getResourceName('code-repo'),
        {
          repositoryName: getResourceName('source-code'),
          description: `Source code repository for ${projectName} ${environment}`,
        }
      );

      // CodeBuild project
      const buildProject = new codebuild.Project(
        this,
        getResourceName('build-project'),
        {
          projectName: getResourceName('build'),
          source: codebuild.Source.codeCommit({ repository: codeRepo }),
          environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            computeType: codebuild.ComputeType.SMALL,
            privileged: true,
          },
          buildSpec: codebuild.BuildSpec.fromObject({
            version: '0.2',
            phases: {
              install: {
                'runtime-versions': {
                  nodejs: '18',
                },
                commands: ['npm install -g aws-cdk', 'npm install'],
              },
              pre_build: {
                commands: ['npm run test', 'npm run lint'],
              },
              build: {
                commands: ['npm run build', 'cdk synth'],
              },
              post_build: {
                commands: ['cdk deploy --require-approval never'],
              },
            },
            artifacts: {
              files: ['**/*'],
            },
          }),
          environmentVariables: {
            AWS_DEFAULT_REGION: { value: this.region },
            AWS_ACCOUNT_ID: { value: this.account },
          },
        }
      );

      // Grant necessary permissions to CodeBuild
      buildProject.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['*'],
          resources: ['*'], // In production, restrict this to specific resources
        })
      );

      // CodePipeline
      const sourceOutput = new codepipeline.Artifact();
      const buildOutput = new codepipeline.Artifact();

      new codepipeline.Pipeline(this, getResourceName('pipeline'), {
        pipelineName: getResourceName('deployment-pipeline'),
        stages: [
          {
            stageName: 'Source',
            actions: [
              new codepipelineActions.CodeCommitSourceAction({
                actionName: 'CodeCommit',
                repository: codeRepo,
                branch: githubBranch,
                output: sourceOutput,
              }),
            ],
          },
          {
            stageName: 'Build',
            actions: [
              new codepipelineActions.CodeBuildAction({
                actionName: 'CodeBuild',
                project: buildProject,
                input: sourceOutput,
                outputs: [buildOutput],
              }),
            ],
          },
        ],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `${getResourceName('api-url')}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `${getResourceName('cloudfront-url')}`,
    });

    if (domainName) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://api.${domainName}`,
        description: 'Custom Domain URL',
        exportName: `${getResourceName('custom-domain-url')}`,
      });
    }

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
      exportName: `${getResourceName('dynamodb-table-name')}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${getResourceName('s3-bucket-name')}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `${getResourceName('lambda-function-name')}`,
    });

    new cdk.CfnOutput(this, 'UsagePlanId', {
      value: usagePlan.usagePlanId,
      description: 'API Gateway Usage Plan ID',
      exportName: `${getResourceName('usage-plan-id')}`,
    });
  }
}

// Example usage and deployment script
export class TapApp extends cdk.App {
  constructor() {
    super();

    new TapStack(this, 'TapStack', {
      environmentSuffix: 'dev',
      projectName: 'myproject',
      environment: 'dev',
      // domainName: 'example.com', // Uncomment and provide your domain
      // hostedZoneId: 'Z1234567890', // Uncomment and provide your hosted zone ID
      dynamoDbReadCapacity: 500,
      dynamoDbWriteCapacity: 500,
      // githubOwner: 'your-github-username', // Uncomment for GitHub integration
      // githubRepo: 'your-repo-name', // Uncomment for GitHub integration
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
    });
  }
}

// If running this file directly
if (require.main === module) {
  const app = new TapApp();
  app.synth();
}
