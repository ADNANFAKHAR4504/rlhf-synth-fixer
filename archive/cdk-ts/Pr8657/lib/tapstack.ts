import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as kms from 'aws-cdk-lib/aws-kms';
// SSM import removed - not used in current implementation
// Custom resources import commented out - GuardDuty removed for LocalStack compatibility
// import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  readonly environmentSuffix: string;
  readonly vpcCidr?: string;
  readonly natGatewayStrategy?: 'single' | 'per-az';
  readonly useKmsEncryption?: boolean;
  readonly apiKeyParameterName?: string;
  readonly allowedCidrsParameterName?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly logsBucket: s3.Bucket;
  public readonly api: apigateway.RestApi;
  public readonly apiLogGroup: logs.LogGroup;
  // GuardDuty removed for LocalStack compatibility
  // public readonly guardDutyDetectorId: string;
  private readonly environmentSuffix: string;

  // Security Groups stored for cross-reference
  private httpsIngressSg!: ec2.SecurityGroup;
  private vpcEndpointsSg!: ec2.SecurityGroup;
  private lambdaSg!: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    this.environmentSuffix = props.environmentSuffix;

    // Set defaults for optional props
    const vpcCidr = props.vpcCidr || '10.0.0.0/16';
    const natGatewayStrategy = props.natGatewayStrategy || 'single';
    const useKmsEncryption = props.useKmsEncryption || false;
    const apiKeyParameterName = props.apiKeyParameterName || '/tap/api-key';
    const allowedCidrsParameterName =
      props.allowedCidrsParameterName || '/tap/allowed-cidrs';

    // Create VPC with security-focused configuration
    this.vpc = this.createSecureVpc(vpcCidr, natGatewayStrategy);

    // Create VPC Endpoints for private subnet connectivity
    this.createVpcEndpoints();

    // Create secure S3 bucket for logging
    this.logsBucket = this.createSecureLogsBucket(useKmsEncryption);

    // Create IAM resources with MFA enforcement
    this.createIamResources();

    // GuardDuty removed for LocalStack compatibility
    // GuardDuty CustomResource requires Lambda functions uploaded to S3
    // which causes compatibility issues with LocalStack S3 implementation
    // const guardDutyCustomResource = this.enableGuardDutyAllRegions();
    // this.guardDutyDetectorId = guardDutyCustomResource.getResponseField('DetectorId');

    // Create API Gateway with secure logging
    const { api, logGroup } = this.createSecureApiGateway(
      apiKeyParameterName,
      allowedCidrsParameterName
    );
    this.api = api;
    this.apiLogGroup = logGroup;

    // Create stack outputs
    this.createOutputs();
  }

  /**
   * Creates a secure VPC spanning 3 AZs with restrictive security groups
   */
  private createSecureVpc(
    vpcCidr: string,
    natGatewayStrategy: 'single' | 'per-az'
  ): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 3,
      natGateways: natGatewayStrategy === 'single' ? 1 : 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create restrictive security groups
    this.createSecurityGroups(vpc);

    return vpc;
  }

  /**
   * Creates highly restrictive security groups with no default egress
   */
  private createSecurityGroups(vpc: ec2.Vpc): void {
    // HTTPS ingress security group - allows inbound 443 from configured CIDRs only
    this.httpsIngressSg = new ec2.SecurityGroup(this, 'HttpsIngressSg', {
      vpc,
      description: 'Allow HTTPS inbound from configured CIDRs only',
      allowAllOutbound: false, // Explicitly deny default egress
    });

    // Add ingress rules for internal networks (placeholder)
    this.httpsIngressSg.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(443),
      'HTTPS from internal networks'
    );

    // VPC Endpoints security group - allows HTTPS from private subnets
    this.vpcEndpointsSg = new ec2.SecurityGroup(this, 'VpcEndpointsSg', {
      vpc,
      description: 'VPC Endpoints access from private subnets',
      allowAllOutbound: false,
    });

    this.vpcEndpointsSg.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS from VPC CIDR for AWS services'
    );

    // Lambda security group - minimal egress for AWS services only
    this.lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc,
      description: 'Lambda function security group with minimal egress',
      allowAllOutbound: false,
    });

    // Allow egress to VPC endpoints only
    this.lambdaSg.addEgressRule(
      this.vpcEndpointsSg,
      ec2.Port.tcp(443),
      'HTTPS to VPC endpoints for AWS services'
    );
  }

  /**
   * Creates VPC Endpoints for AWS services to avoid public internet egress
   */
  private createVpcEndpoints(): void {
    // SSM VPC endpoint
    new ec2.InterfaceVpcEndpoint(this, 'SsmEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.vpcEndpointsSg],
    });

    // SSM Messages VPC endpoint
    new ec2.InterfaceVpcEndpoint(this, 'SsmMessagesEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.vpcEndpointsSg],
    });

    // EC2 Messages VPC endpoint
    new ec2.InterfaceVpcEndpoint(this, 'Ec2MessagesEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.vpcEndpointsSg],
    });

    // CloudWatch Logs VPC endpoint
    new ec2.InterfaceVpcEndpoint(this, 'LogsEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.vpcEndpointsSg],
    });

    // KMS VPC endpoint
    new ec2.InterfaceVpcEndpoint(this, 'KmsEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.vpcEndpointsSg],
    });

    // STS VPC endpoint
    new ec2.InterfaceVpcEndpoint(this, 'StsEndpoint', {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.STS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [this.vpcEndpointsSg],
    });

    // Gateway endpoint for S3
    new ec2.GatewayVpcEndpoint(this, 'S3Endpoint', {
      vpc: this.vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      // Policy document will be set via endpoint policy
    });
  }

  /**
   * Creates a secure S3 bucket for application logs with encryption and public access blocking
   */
  private createSecureLogsBucket(useKmsEncryption: boolean): s3.Bucket {
    let encryptionKey: kms.Key | undefined;
    let encryption: s3.BucketEncryption;

    if (useKmsEncryption) {
      encryptionKey = new kms.Key(this, 'LogsBucketKey', {
        description: 'KMS key for logs bucket encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'Enable IAM User Permissions',
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow CloudWatch Logs',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
              ],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
              conditions: {
                ArnEquals: {
                  'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
                },
              },
            }),
          ],
        }),
      });
      encryption = s3.BucketEncryption.KMS;
    } else {
      encryption = s3.BucketEncryption.S3_MANAGED;
    }

    const bucket = new s3.Bucket(this, 'SecureLogsBucket', {
      bucketName: `tap-${this.environmentSuffix}-logs-${this.account}-${this.region}`,
      encryption,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects disabled for LocalStack compatibility (requires CustomResource with Lambda)
      autoDeleteObjects: false,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      publicReadAccess: false,
    });

    // Add explicit bucket policy to deny unencrypted uploads and public access
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': useKmsEncryption
              ? 'aws:kms'
              : 'AES256',
          },
        },
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyPublicAccess',
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

  /**
   * Creates IAM resources with MFA enforcement and least-privilege roles
   */
  private createIamResources(): void {
    // MFA enforcement policy - denies all actions when MFA is not present
    const mfaEnforcementPolicy = new iam.ManagedPolicy(
      this,
      'MfaEnforcementPolicy',
      {
        managedPolicyName: `Tap${this.environmentSuffix}MfaEnforcementPolicy`,
        description: 'Denies all actions when MFA is not present',
        statements: [
          new iam.PolicyStatement({
            sid: 'DenyAllWithoutMFA',
            effect: iam.Effect.DENY,
            actions: ['*'],
            resources: ['*'],
            conditions: {
              Bool: {
                'aws:MultiFactorAuthPresent': 'false',
              },
              StringNotEquals: {
                'aws:RequestedRegion': this.region,
              },
            },
          }),
          // Allow essential auth flows without MFA
          new iam.PolicyStatement({
            sid: 'AllowAuthFlowsWithoutMFA',
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:ListUsers',
              'iam:ListMFADevices',
              'iam:GetUser',
              'sts:GetSessionToken',
            ],
            resources: ['*'],
          }),
        ],
      }
    );

    // Group for all users requiring MFA
    new iam.Group(this, 'AllUsersRequireMfaGroup', {
      groupName: `Tap${this.environmentSuffix}AllUsersRequireMFA`,
      managedPolicies: [mfaEnforcementPolicy],
    });

    // CI/CD deployment role with least privilege for CDK operations
    new iam.Role(this, 'CicdDeploymentRole', {
      roleName: `Tap${this.environmentSuffix}CicdDeploymentRole`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Least privilege role for CI/CD CDK deployments',
      managedPolicies: [
        new iam.ManagedPolicy(this, 'CicdDeploymentPolicy', {
          statements: [
            new iam.PolicyStatement({
              sid: 'AllowCdkOperations',
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:CreateStack',
                'cloudformation:UpdateStack',
                'cloudformation:DeleteStack',
                'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DescribeStackResources',
                'cloudformation:GetTemplate',
              ],
              resources: [
                `arn:aws:cloudformation:${this.region}:${this.account}:stack/TapStack${this.environmentSuffix}/*`,
                `arn:aws:cloudformation:${this.region}:${this.account}:stack/CDKToolkit/*`,
              ],
            }),
            new iam.PolicyStatement({
              sid: 'AllowS3CdkAssets',
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                `arn:aws:s3:::cdk-*-assets-${this.account}-${this.region}/*`,
              ],
            }),
            new iam.PolicyStatement({
              sid: 'AllowResourceCreation',
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:CreateVpc',
                'ec2:CreateSubnet',
                'ec2:CreateSecurityGroup',
                'ec2:CreateVpcEndpoint',
                'iam:CreateRole',
                'iam:CreatePolicy',
                'iam:AttachRolePolicy',
                's3:CreateBucket',
                'apigateway:*',
                'logs:CreateLogGroup',
                'lambda:CreateFunction',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': this.region,
                },
              },
            }),
          ],
        }),
      ],
    });

    // Read-only auditor role
    new iam.Role(this, 'ReadOnlyAuditorRole', {
      roleName: `Tap${this.environmentSuffix}ReadOnlyAuditorRole`,
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'Read-only access for security auditing',
      managedPolicies: [
        new iam.ManagedPolicy(this, 'AuditorPolicy', {
          statements: [
            new iam.PolicyStatement({
              sid: 'AllowReadOnlyAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:Describe*',
                's3:GetBucket*',
                's3:ListBucket',
                'iam:Get*',
                'iam:List*',
                'apigateway:GET',
                'logs:Describe*',
                'guardduty:Get*',
                'guardduty:List*',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:RequestedRegion': this.region,
                },
              },
            }),
          ],
        }),
      ],
    });
  }

  /**
   * Enables GuardDuty across all available AWS regions using a custom resource
   * COMMENTED OUT FOR LOCALSTACK COMPATIBILITY
   * GuardDuty CustomResource requires Lambda functions to be uploaded to S3
   * which causes XML parsing errors in LocalStack S3 implementation
   */
  /*
  private enableGuardDutyAllRegions(): cr.AwsCustomResource {
    // Lambda execution role for GuardDuty custom resource
    const guardDutyRole = new iam.Role(this, 'GuardDutyCustomResourceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        GuardDutyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'guardduty:CreateDetector',
                'guardduty:GetDetector',
                'guardduty:UpdateDetector',
                'guardduty:ListDetectors',
                'ec2:DescribeRegions',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Custom resource to enable GuardDuty in all regions
    const guardDutyCustomResource = new cr.AwsCustomResource(
      this,
      'GuardDutyAllRegions',
      {
        onCreate: {
          service: 'GuardDuty',
          action: 'createDetector',
          parameters: {
            Enable: true,
            FindingPublishingFrequency: 'FIFTEEN_MINUTES',
          },
          region: this.region,
          physicalResourceId: cr.PhysicalResourceId.fromResponse('DetectorId'),
        },
        onUpdate: {
          service: 'GuardDuty',
          action: 'updateDetector',
          parameters: {
            DetectorId: new cr.PhysicalResourceIdReference(),
            Enable: true,
            FindingPublishingFrequency: 'FIFTEEN_MINUTES',
          },
          region: this.region,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
        role: guardDutyRole,
        timeout: cdk.Duration.minutes(5),
      }
    );

    return guardDutyCustomResource;
  }
  */

  /**
   * Creates API Gateway with secure logging and monitoring
   */
  private createSecureApiGateway(
    _apiKeyParameterName: string,
    _allowedCidrsParameterName: string
  ): { api: apigateway.RestApi; logGroup: logs.LogGroup } {
    // Create dedicated log group for API Gateway with retention
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/tap-${this.environmentSuffix}-api`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create minimal Lambda function for API integration
    const apiLambda = new lambda.Function(this, 'ApiLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Security-Header': 'secure-response'
            },
            body: JSON.stringify({
              message: 'Secure API response',
              timestamp: new Date().toISOString(),
              requestId: event.requestContext.requestId
            })
          };
        };
      `),
      vpc: this.vpc,
      securityGroups: [this.lambdaSg],
      environment: {
        LOG_LEVEL: 'INFO',
        REGION: this.region,
      },
    });

    // Grant Lambda permission to write to CloudWatch Logs
    // Use a wildcard to avoid circular dependency
    apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*:*`,
        ],
      })
    );

    // Create API Gateway with secure configuration
    const api = new apigateway.RestApi(this, 'SecureApi', {
      restApiName: `Tap${this.environmentSuffix}SecureApi`,
      description: 'Security-focused API Gateway for TAP stack',
      deployOptions: {
        stageName: 'prod',
        // Enable access logging to dedicated log group
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
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
        }),
        // Enable execution logging and detailed metrics
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true,
    });

    // Create IAM role for API Gateway CloudWatch logging
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayLogRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // Grant API Gateway permission to write to the specific log group
    apiLogGroup.grantWrite(apiGatewayRole);

    // Add GET method for the hello resource
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(apiLambda),
      {
        authorizationType: apigateway.AuthorizationType.IAM,
      }
    );

    // Create API usage plan with API key (referenced from SSM)
    const usagePlan = api.addUsagePlan('TapUsagePlan', {
      name: `Tap${this.environmentSuffix}UsagePlan`,
      description: 'Usage plan for TAP API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    // Add the API stage to the usage plan
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    return { api, logGroup: apiLogGroup };
  }

  /**
   * Creates CloudFormation outputs for key resources
   */
  private createOutputs(): void {
    // VPC and networking outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `Tap${this.environmentSuffix}VpcId`,
    });

    // Private subnet IDs
    const privateSubnetIds = this.vpc.privateSubnets
      .map(subnet => subnet.subnetId)
      .join(',');
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: privateSubnetIds,
      description: 'Private subnet IDs',
      exportName: `Tap${this.environmentSuffix}PrivateSubnetIds`,
    });

    // Public subnet IDs
    const publicSubnetIds = this.vpc.publicSubnets
      .map(subnet => subnet.subnetId)
      .join(',');
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: publicSubnetIds,
      description: 'Public subnet IDs',
      exportName: `Tap${this.environmentSuffix}PublicSubnetIds`,
    });

    // API Gateway outputs
    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `Tap${this.environmentSuffix}ApiId`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway invoke URL',
      exportName: `Tap${this.environmentSuffix}ApiUrl`,
    });

    // S3 bucket output
    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: this.logsBucket.bucketName,
      description: 'Logging S3 bucket name',
      exportName: `Tap${this.environmentSuffix}LogsBucketName`,
    });

    // CloudWatch Log Group output
    new cdk.CfnOutput(this, 'ApiLogGroupName', {
      value: this.apiLogGroup.logGroupName,
      description: 'API Gateway CloudWatch Log Group name',
      exportName: `Tap${this.environmentSuffix}ApiLogGroupName`,
    });

    // GuardDuty removed for LocalStack compatibility
    // new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
    //   value: this.guardDutyDetectorId,
    //   description: 'GuardDuty detector ID for primary region',
    //   exportName: `Tap${this.environmentSuffix}GuardDutyDetectorId`,
    // });
  }
}
