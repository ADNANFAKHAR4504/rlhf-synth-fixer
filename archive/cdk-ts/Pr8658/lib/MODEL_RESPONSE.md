## Project Files

### bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tapstack';

const app = new cdk.App();

// Get project name from context with default
const projectName =
  app.node.tryGetContext('projectName') || 'IaC - AWS Nova Model Breaking';

new TapStack(app, 'TapStack', {
  projectName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: `${projectName} - Security baseline infrastructure stack`,
});
```

### lib/tapstack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  projectName: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly logsBucket: s3.Bucket;
  public readonly apiGateway: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Global tags for all resources
    const globalTags = {
      Project: props.projectName,
      Owner: 'Platform',
      Environment: 'SecurityBaseline',
    };

    // Apply tags to the stack
    Object.entries(globalTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create KMS key for encryption (Parameter Store and S3)
    this.kmsKey = this.createKmsKey();

    // Create VPC with strict security
    this.vpc = this.createSecureVpc();

    // Create VPC endpoints to keep traffic private
    this.createVpcEndpoints();

    // Create S3 bucket for logs/artifacts with strict security
    this.logsBucket = this.createSecureS3Bucket();

    // Create SSM Parameter Store entries
    this.createSsmParameters();

    // Set up IAM account password policy and MFA enforcement
    this.setupIamSecurity();

    // Create API Gateway with Lambda for demonstration
    this.apiGateway = this.createApiGatewayWithLambda();

    // Enable GuardDuty across multiple regions
    this.enableGuardDuty();

    // Create stack outputs
    this.createOutputs();
  }

  private createKmsKey(): kms.Key {
    // Create KMS key with least-privilege key policy
    const key = new kms.Key(this, 'NovaKmsKey', {
      description: 'KMS key for Nova project encryption (Parameter Store, S3)',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account admin access
          new iam.PolicyStatement({
            sid: 'EnableRootAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow SSM service to use the key for Parameter Store
          new iam.PolicyStatement({
            sid: 'AllowSSMParameterStore',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('ssm.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:CreateGrant',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': [`ssm.${this.region}.amazonaws.com`],
              },
            },
          }),
          // Allow S3 service to use the key
          new iam.PolicyStatement({
            sid: 'AllowS3Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': [`s3.${this.region}.amazonaws.com`],
              },
            },
          }),
        ],
      }),
    });

    // Create alias for easier reference
    new kms.Alias(this, 'NovaKmsKeyAlias', {
      aliasName: 'alias/nova-security-baseline',
      targetKey: key,
    });

    return key;
  }

  private createSecureVpc(): ec2.Vpc {
    // Create VPC across 3 AZs with only private and isolated subnets
    // No public subnets to minimize attack surface
    // No NAT gateways to reduce costs and force use of VPC endpoints
    const vpc = new ec2.Vpc(this, 'NovaVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      // Disable NAT gateways to force use of VPC endpoints
      // This reduces costs and improves security by keeping all traffic within AWS
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Modify default security group to be restrictive
    const defaultSg = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'DefaultSG',
      vpc.vpcDefaultSecurityGroup
    );

    // Remove default egress rule and add restrictive rules
    // Note: CDK doesn't allow modifying default SG rules directly,
    // so we create a custom security group for our resources

    return vpc;
  }

  private createVpcEndpoints(): void {
    // Create security group for VPC endpoints
    // Only allow HTTPS traffic from private subnets
    const endpointSg = new ec2.SecurityGroup(this, 'VpcEndpointSG', {
      vpc: this.vpc,
      description: 'Security group for VPC endpoints',
      allowAllOutbound: false, // Explicit deny all egress
    });

    // Allow HTTPS ingress from private subnets only
    this.vpc.privateSubnets.forEach((subnet, index) => {
      endpointSg.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(443),
        `Allow HTTPS from private subnet ${index + 1}`
      );
    });

    // Interface endpoints for AWS services
    const interfaceEndpoints = [
      'ssm',
      'ssmmessages',
      'ec2messages',
      'monitoring', // CloudWatch
      'logs',       // CloudWatch Logs
      'kms',
    ];

    interfaceEndpoints.forEach(service => {
      new ec2.InterfaceVpcEndpoint(this, `${service}Endpoint`, {
        vpc: this.vpc,
        service: ec2.InterfaceVpcEndpointAwsService.of(service),
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [endpointSg],
        policyDocument: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.AnyPrincipal()],
              actions: ['*'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:PrincipalAccount': this.account,
                },
              },
            }),
          ],
        }),
      });
    });

    // Gateway endpoints for S3 and DynamoDB
    new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      policyDocument: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['s3:*'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:PrincipalAccount': this.account,
              },
            },
          }),
        ],
      }),
    });

    new ec2.GatewayVpcEndpoint(this, 'DynamoDbEndpoint', {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      policyDocument: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['dynamodb:*'],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'aws:PrincipalAccount': this.account,
              },
            },
          }),
        ],
      }),
    });
  }

  private createSecureS3Bucket(): s3.Bucket {
    // Create S3 bucket with maximum security settings
    const bucket = new s3.Bucket(this, 'NovaLogsBucket', {
      bucketName: undefined, // Let CDK generate unique name
      // Block all public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Enable versioning
      versioned: true,
      // Server-side encryption with KMS
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      bucketKeyEnabled: true,
      // Lifecycle rule for noncurrent versions
      lifecycleRules: [
        {
          id: 'DeleteNoncurrentVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      // Enforce SSL/TLS
      enforceSSL: true,
      // Remove objects on stack deletion (for demo purposes)
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add explicit bucket policy to deny unencrypted uploads and non-TLS access
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyNonTLSAccess',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    return bucket;
  }

  private createSsmParameters(): void {
    // Create placeholder parameters in Parameter Store
    // These would be populated with actual values outside of CDK
    new ssm.StringParameter(this, 'DbPasswordParam', {
      parameterName: '/nova/api/secrets/dbPassword',
      description: 'Database password for Nova API',
      stringValue: 'PLACEHOLDER_VALUE_UPDATE_MANUALLY',
      type: ssm.ParameterType.SECURE_STRING,
      keyId: this.kmsKey,
    });

    new ssm.StringParameter(this, 'ApiKeyParam', {
      parameterName: '/nova/api/secrets/apiKey',
      description: 'API key for Nova external integrations',
      stringValue: 'PLACEHOLDER_VALUE_UPDATE_MANUALLY',
      type: ssm.ParameterType.SECURE_STRING,
      keyId: this.kmsKey,
    });
  }

  private setupIamSecurity(): void {
    // Create account password policy
    new iam.CfnAccountPasswordPolicy(this, 'AccountPasswordPolicy', {
      minimumPasswordLength: 14,
      requireUppercaseCharacters: true,
      requireLowercaseCharacters: true,
      requireNumbers: true,
      requireSymbols: true,
      maxPasswordAge: 90,
      passwordReusePrevention: 12,
      allowUsersToChangePassword: true,
      hardExpiry: false,
    });

    // Create IAM group with MFA enforcement policy
    const mfaRequiredGroup = new iam.Group(this, 'MfaRequiredGroup', {
      groupName: 'MfaRequiredGroup',
    });

    // Policy that denies all actions unless MFA is present
    // Includes exceptions for MFA device management and password changes
    const mfaEnforcementPolicy = new iam.Policy(this, 'MfaEnforcementPolicy', {
      policyName: 'MfaEnforcementPolicy',
      statements: [
        // Allow MFA device management without MFA (bootstrap scenario)
        new iam.PolicyStatement({
          sid: 'AllowMfaDeviceManagement',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'iam:DeactivateMFADevice',
            'iam:DeleteVirtualMFADevice',
          ],
          resources: ['*'],
        }),
        // Allow password changes without MFA
        new iam.PolicyStatement({
          sid: 'AllowPasswordChange',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:ChangePassword',
            'iam:GetAccountPasswordPolicy',
          ],
          resources: ['*'],
        }),
        // Allow getting session token (for MFA)
        new iam.PolicyStatement({
          sid: 'AllowGetSessionToken',
          effect: iam.Effect.ALLOW,
          actions: ['sts:GetSessionToken'],
          resources: ['*'],
        }),
        // Allow viewing own user info
        new iam.PolicyStatement({
          sid: 'AllowViewOwnUserInfo',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:GetUser',
            'iam:ListAttachedUserPolicies',
            'iam:ListGroupsForUser',
            'iam:ListUserPolicies',
          ],
          resources: ['arn:aws:iam::*:user/${aws:username}'],
        }),
        // Deny all other actions unless MFA is present
        new iam.PolicyStatement({
          sid: 'DenyAllUnlessMfaPresent',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'iam:ChangePassword',
            'iam:GetAccountPasswordPolicy',
            'sts:GetSessionToken',
            'iam:GetUser',
            'iam:ListAttachedUserPolicies',
            'iam:ListGroupsForUser',
            'iam:ListUserPolicies',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    mfaRequiredGroup.attachInlinePolicy(mfaEnforcementPolicy);

    // Add guidance comment as a CloudFormation description
    new cdk.CfnResource(this, 'MfaGroupGuidance', {
      type: 'AWS::CloudFormation::WaitConditionHandle',
      properties: {},
    }).addMetadata('Guidance',
      'To attach users to MfaRequiredGroup: aws iam add-user-to-group --group-name MfaRequiredGroup --user-name <username>'
    );
  }

  private createApiGatewayWithLambda(): apigateway.RestApi {
    // Create CloudWatch Log Group for API Gateway access logs
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      logGroupName: '/aws/apigateway/nova-api-access-logs',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create security group for Lambda (if it needs VPC access)
    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Lambda function',
      allowAllOutbound: false, // Explicit deny all egress
    });

    // Allow Lambda to reach VPC endpoints for CloudWatch Logs
    lambdaSg.addEgressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS to VPC endpoints for logging'
    );

    // Create IAM role for Lambda with minimal permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Nova health check Lambda',
      managedPolicies: [
        // Basic Lambda execution (CloudWatch Logs)
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        ParameterStoreAccess: new iam.PolicyDocument({
          statements: [
            // Allow reading specific SSM parameters only
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/nova/api/*`,
              ],
            }),
            // Allow KMS decryption for Parameter Store
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
              ],
              resources: [this.kmsKey.keyArn],
              conditions: {
                StringEquals: {
                  'kms:ViaService': [`ssm.${this.region}.amazonaws.com`],
                },
              },
            }),
          ],
        }),
      },
    });

    // Create Lambda function
    const healthCheckLambda = new lambda.Function(this, 'HealthCheckLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

        exports.handler = async (event) => {
          console.log('Health check request:', JSON.stringify(event, null, 2));

          try {
            // Example of accessing Parameter Store (optional)
            // const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
            // const command = new GetParameterCommand({
            //   Name: '/nova/api/secrets/apiKey',
            //   WithDecryption: true
            // });
            // const parameter = await ssmClient.send(command);

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': event.requestContext?.requestId || 'unknown'
              },
              body: JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                region: process.env.AWS_REGION
              })
            };
          } catch (error) {
            console.error('Health check error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'error',
                message: 'Internal server error'
              })
            };
          }
        };
      `),
      description: 'Health check endpoint for Nova API',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSg],
    });

    // Create IAM role for API Gateway CloudWatch Logs
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Role for API Gateway to write to CloudWatch Logs',
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
                'logs:PutLogEvents',
                'logs:GetLogEvents',
                'logs:FilterLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/apigateway/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create REST API Gateway
    const api = new apigateway.RestApi(this, 'NovaApi', {
      restApiName: 'Nova Security Baseline API',
      description: 'API Gateway for Nova project with security baseline',
      deployOptions: {
        stageName: 'prod',
        // Enable access logging with structured JSON format
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
          requestId: true,
          extendedRequestId: true,
          xrayTraceId: true,
        }),
        // Enable execution logging
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      // Set CloudWatch role for the account (required for logging)
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create /health resource
    const healthResource = api.root.addResource('health');

    // Add GET method to /health
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthCheckL
```
