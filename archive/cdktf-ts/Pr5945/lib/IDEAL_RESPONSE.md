## modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { Fn } from 'cdktf';

// VPC Module with optimized networking for serverless
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly natGateway: aws.natGateway.NatGateway;
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      cidrBlock: string;
      azCount: number;
      region: string;
      environment: string;
    }
  ) {
    super(scope, id);

    // Create VPC with DNS support for improved Lambda performance
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.environment}-vpc`,
        Environment: config.environment,
      },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.environment}-igw`,
        },
      }
    );

    // Get availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
      this,
      'azs',
      {
        state: 'available',
      }
    );

    this.publicSubnets = [];
    this.privateSubnets = [];

    // Create subnets across multiple AZs for high availability
    for (let i = 0; i < config.azCount; i++) {
      const availabilityZone = Fn.element(azs.names, i);
      // Public subnets
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: availabilityZone,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.environment}-public-subnet-${i}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnets for Lambda
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZone,
        tags: {
          Name: `${config.environment}-private-subnet-${i}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Elastic IP for NAT Gateway
    const eip = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${config.environment}-nat-eip`,
      },
    });

    // NAT Gateway for Lambda internet access
    const firstPublicSubnet = this.publicSubnets[0];
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat', {
      allocationId: eip.id,
      subnetId: firstPublicSubnet.id,
      tags: {
        Name: `${config.environment}-nat`,
      },
    });

    // Route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-public-rt`,
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    const privateRouteTable = new aws.routeTable.RouteTable(
      this,
      'private-rt',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.environment}-private-rt`,
        },
      }
    );

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate route tables
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Security group for Lambda
    this.securityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'lambda-sg',
      {
        vpcId: this.vpc.id,
        name: `${config.environment}-lambda-sg`,
        description: 'Security group for Lambda functions',
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${config.environment}-lambda-sg`,
        },
      }
    );
  }
}

// S3 Module with security best practices
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketOwnershipControls: aws.s3BucketOwnershipControls.S3BucketOwnershipControls;

  public readonly bucketVersioning: aws.s3BucketVersioning.S3BucketVersioningA;
  public readonly bucketEncryption: aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;
  public readonly bucketPolicy?: aws.s3BucketPolicy.S3BucketPolicy;

  constructor(
    scope: Construct,
    id: string,
    config: {
      bucketName: string;
      environment: string;
      enableCors?: boolean;
      lifecycleRules?: any[];
    }
  ) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: config.bucketName,
      tags: {
        Environment: config.environment,
        ManagedBy: 'CDKTF',
      },
    });

    // Add Bucket Ownership Controls instead of ACL
    this.bucketOwnershipControls =
      new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
        this,
        'ownership-controls',
        {
          bucket: this.bucket.id,
          rule: {
            objectOwnership: 'BucketOwnerEnforced', // This replaces ACLs
          },
        }
      );

    // Enable versioning
    this.bucketVersioning = new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      'versioning',
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable server-side encryption with AES256
    this.bucketEncryption =
      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
        this,
        'encryption',
        {
          bucket: this.bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

    // Block all public access
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        'public-access-block',
        {
          bucket: this.bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

    // Add lifecycle rules if provided - FIXED: Added status field
    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
        this,
        'lifecycle',
        {
          bucket: this.bucket.id,
          rule: config.lifecycleRules.map(rule => ({
            ...rule,
            status: rule.status || (rule.enabled ? 'Enabled' : 'Disabled'), // Convert enabled to status
          })),
        }
      );
    }

    // CORS configuration for CloudFront
    if (config.enableCors) {
      new aws.s3BucketCorsConfiguration.S3BucketCorsConfiguration(
        this,
        'cors',
        {
          bucket: this.bucket.id,
          corsRule: [
            {
              allowedHeaders: ['*'],
              allowedMethods: ['GET', 'HEAD'],
              allowedOrigins: ['*'],
              exposeHeaders: ['ETag'],
              maxAgeSeconds: 3000,
            },
          ],
        }
      );
    }
  }
}

// Lambda Module with optimization for cold starts
export class LambdaModule extends Construct {
  public readonly function: aws.lambdaFunction.LambdaFunction;
  public readonly role: aws.iamRole.IamRole;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly alias: aws.lambdaAlias.LambdaAlias;

  constructor(
    scope: Construct,
    id: string,
    config: {
      functionName: string;
      handler: string;
      runtime: string;
      memorySize: number;
      timeout: number;
      sourceBucket: string;
      sourceKey: string;
      environment: string;
      vpcConfig?: {
        subnetIds: string[];
        securityGroupIds: string[];
      };
      environmentVariables?: { [key: string]: string };
      reservedConcurrentExecutions?: number;
      layers?: string[];
    }
  ) {
    super(scope, id);

    // CloudWatch Log Group with retention
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'log-group',
      {
        name: `/aws/lambda/${config.functionName}`,
        retentionInDays: 14,
        tags: {
          Environment: config.environment,
        },
      }
    );

    // IAM role with least privilege
    this.role = new aws.iamRole.IamRole(this, 'role', {
      name: `${config.functionName}-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Environment: config.environment,
      },
    });

    // Attach managed policies for VPC and CloudWatch
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'vpc-policy',
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      }
    );

    // Custom policy for CloudWatch Logs
    new aws.iamRolePolicy.IamRolePolicy(this, 'logs-policy', {
      name: `${config.functionName}-logs`,
      role: this.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:*:*:log-group:/aws/lambda/${config.functionName}*`,
          },
        ],
      }),
    });

    // Lambda function with optimizations
    this.function = new aws.lambdaFunction.LambdaFunction(this, 'function', {
      functionName: config.functionName,
      role: this.role.arn,
      handler: config.handler,
      runtime: config.runtime,
      memorySize: config.memorySize,
      timeout: config.timeout,
      s3Bucket: config.sourceBucket,
      s3Key: config.sourceKey,
      reservedConcurrentExecutions: config.reservedConcurrentExecutions || 100,
      environment: config.environmentVariables
        ? {
            variables: config.environmentVariables,
          }
        : undefined,
      vpcConfig: config.vpcConfig,
      layers: config.layers,
      tracingConfig: {
        mode: 'Active',
      },
      tags: {
        Environment: config.environment,
        ManagedBy: 'CDKTF',
      },
      dependsOn: [this.logGroup],
    });

    // Create alias for blue-green deployments
    this.alias = new aws.lambdaAlias.LambdaAlias(this, 'alias', {
      name: 'live',
      functionName: this.function.functionName,
      functionVersion: '$LATEST',
    });

    // Add auto-scaling for Lambda (provisioned concurrency for critical functions)
    if (
      config.reservedConcurrentExecutions &&
      config.reservedConcurrentExecutions > 100
    ) {
      new aws.lambdaProvisionedConcurrencyConfig.LambdaProvisionedConcurrencyConfig(
        this,
        'provisioned-concurrency',
        {
          functionName: this.function.functionName,
          provisionedConcurrentExecutions: 10,
          qualifier: this.alias.name,
        }
      );
    }
  }
}

// CloudFront Module for content delivery
export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly originAccessControl: aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl;

  constructor(
    scope: Construct,
    id: string,
    config: {
      s3BucketDomainName: string;
      s3BucketId: string;
      environment: string;
      priceClass?: string;
      customDomain?: string;
      certificateArn?: string;
    }
  ) {
    super(scope, id);

    // Origin Access Control for S3
    this.originAccessControl =
      new aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl(
        this,
        'oac',
        {
          name: `${config.environment}-s3-oac`,
          description: 'Origin Access Control for S3',
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
        }
      );

    // CloudFront distribution optimized for performance
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      'distribution',
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: `${config.environment} CloudFront Distribution`,
        defaultRootObject: 'index.html',
        priceClass: config.priceClass || 'PriceClass_100',
        httpVersion: 'http2and3',

        origin: [
          {
            domainName: config.s3BucketDomainName,
            originId: `S3-${config.s3BucketId}`,
            originAccessControlId: this.originAccessControl.id,
            s3OriginConfig: {
              originAccessIdentity: '',
            },
          },
        ],

        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          targetOriginId: `S3-${config.s3BucketId}`,
          viewerProtocolPolicy: 'redirect-to-https',
          compress: true,
          minTtl: 0,
          defaultTtl: 86400,
          maxTtl: 31536000,

          forwardedValues: {
            queryString: true,
            headers: [
              'Origin',
              'Access-Control-Request-Method',
              'Access-Control-Request-Headers',
            ],
            cookies: {
              forward: 'none',
            },
          },

          functionAssociation: [
            {
              eventType: 'viewer-response',
              functionArn: this.createCachingFunction().arn,
            },
          ],
        },

        orderedCacheBehavior: [
          {
            pathPattern: '/api/*',
            allowedMethods: [
              'GET',
              'HEAD',
              'OPTIONS',
              'PUT',
              'POST',
              'PATCH',
              'DELETE',
            ],
            cachedMethods: ['GET', 'HEAD'],
            targetOriginId: `S3-${config.s3BucketId}`,
            viewerProtocolPolicy: 'https-only',
            compress: true,
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 0,

            forwardedValues: {
              queryString: true,
              headers: [
                'Origin',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers',
              ],
              cookies: {
                forward: 'all',
              },
            },
          },
        ],

        customErrorResponse: [
          {
            errorCode: 404,
            errorCachingMinTtl: 10,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
          {
            errorCode: 403,
            errorCachingMinTtl: 10,
            responseCode: 200,
            responsePagePath: '/index.html',
          },
        ],

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: config.certificateArn
          ? {
              acmCertificateArn: config.certificateArn,
              sslSupportMethod: 'sni-only',
              minimumProtocolVersion: 'TLSv1.2_2021',
            }
          : {
              cloudfrontDefaultCertificate: true,
            },

        aliases: config.customDomain ? [config.customDomain] : undefined,

        webAclId: this.createWafAcl(config.environment).arn,

        tags: {
          Environment: config.environment,
          ManagedBy: 'CDKTF',
        },
      }
    );
  }

  private createCachingFunction(): aws.cloudfrontFunction.CloudfrontFunction {
    const code = `
function handler(event) {
  var response = event.response;
  var headers = response.headers;
  
  // Security headers
  headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload' };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-xss-protection'] = { value: '1; mode=block' };
  headers['referrer-policy'] = { value: 'strict-origin-when-cross-origin' };
  
  return response;
}`;

    return new aws.cloudfrontFunction.CloudfrontFunction(
      this,
      'security-headers',
      {
        name: 'security-headers-function',
        runtime: 'cloudfront-js-1.0',
        code: code,
        comment: 'Add security headers to responses',
      }
    );
  }

  // FIXED: Changed aggregateKeyType to aggregate_key_type and vendorName to vendor_name
  private createWafAcl(environment: string): aws.wafv2WebAcl.Wafv2WebAcl {
    return new aws.wafv2WebAcl.Wafv2WebAcl(this, 'waf', {
      name: `${environment}-waf-acl`,
      scope: 'CLOUDFRONT',

      defaultAction: {
        allow: {},
      },

      rule: [
        {
          name: 'RateLimitRule',
          priority: 1,

          statement: {
            rate_based_statement: {
              limit: 2000, // 2000 requests per 5 minutes
              aggregate_key_type: 'IP', // FIXED: Changed to snake_case
            },
          },

          action: {
            block: {},
          },

          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,

          statement: {
            managed_rule_group_statement: {
              vendor_name: 'AWS', // FIXED: Changed to snake_case
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },

          overrideAction: {
            none: {},
          },

          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],

      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${environment}-waf-metric`,
        sampledRequestsEnabled: true,
      },

      tags: {
        Environment: environment,
        ManagedBy: 'CDKTF',
      },
    });
  }
}

// Secrets Manager Module
export class SecretsModule extends Construct {
  public readonly secret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly secretVersion: aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion;

  constructor(
    scope: Construct,
    id: string,
    config: {
      secretName: string;
      description: string;
      environment: string;
      secretData: { [key: string]: string };
      rotationDays?: number;
    }
  ) {
    super(scope, id);

    this.secret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'secret',
      {
        name: config.secretName,
        description: config.description,
        tags: {
          Environment: config.environment,
          ManagedBy: 'CDKTF',
        },
      }
    );

    this.secretVersion =
      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'secret-version',
        {
          secretId: this.secret.id,
          secretString: JSON.stringify(config.secretData),
        }
      );
  }
}

// API Gateway Module for Lambda integration
export class ApiGatewayModule extends Construct {
  public readonly api: aws.apigatewayv2Api.Apigatewayv2Api;
  public readonly stage: aws.apigatewayv2Stage.Apigatewayv2Stage;
  public readonly integration: aws.apigatewayv2Integration.Apigatewayv2Integration;

  constructor(
    scope: Construct,
    id: string,
    config: {
      apiName: string;
      environment: string;
      lambdaFunctionArn: string;
      lambdaFunctionName: string;
      throttleSettings?: {
        rateLimit: number;
        burstLimit: number;
      };
    }
  ) {
    super(scope, id);

    // HTTP API for better Lambda cold start performance
    this.api = new aws.apigatewayv2Api.Apigatewayv2Api(this, 'api', {
      name: config.apiName,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['*'],
        maxAge: 300,
      },
      tags: {
        Environment: config.environment,
        ManagedBy: 'CDKTF',
      },
    });

    // Lambda integration
    this.integration = new aws.apigatewayv2Integration.Apigatewayv2Integration(
      this,
      'integration',
      {
        apiId: this.api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: config.lambdaFunctionArn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
        connectionType: 'INTERNET',
      }
    );

    // Routes
    new aws.apigatewayv2Route.Apigatewayv2Route(this, 'default-route', {
      apiId: this.api.id,
      routeKey: '$default',
      target: `integrations/${this.integration.id}`,
    });

    // Stage with throttling
    this.stage = new aws.apigatewayv2Stage.Apigatewayv2Stage(this, 'stage', {
      apiId: this.api.id,
      name: config.environment,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: this.createApiLogGroup(config.apiName).arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          sourceIp: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          error: '$context.error.message',
          integrationError: '$context.integrationErrorMessage',
        }),
      },
      tags: {
        Environment: config.environment,
        ManagedBy: 'CDKTF',
      },
    });

    // Lambda permission for API Gateway
    new aws.lambdaPermission.LambdaPermission(this, 'api-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: config.lambdaFunctionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.api.executionArn}/*/*`,
    });
  }

  private createApiLogGroup(
    apiName: string
  ): aws.cloudwatchLogGroup.CloudwatchLogGroup {
    return new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'api-logs', {
      name: `/aws/apigateway/${apiName}`,
      retentionInDays: 7,
    });
  }
}

// Monitoring Module for comprehensive observability
export class MonitoringModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;
  public readonly alarms: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm[];

  constructor(
    scope: Construct,
    id: string,
    config: {
      environment: string;
      lambdaFunctionName: string;
      apiId: string;
      snsTopicArn?: string;
    }
  ) {
    super(scope, id);

    this.alarms = [];

    // Lambda error rate alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'lambda-error-alarm',
        {
          alarmName: `${config.lambdaFunctionName}-error-rate`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'Errors',
          namespace: 'AWS/Lambda',
          period: 300,
          statistic: 'Sum',
          threshold: 10,
          alarmDescription: 'Lambda function error rate is too high',
          dimensions: {
            FunctionName: config.lambdaFunctionName,
          },
          alarmActions: config.snsTopicArn ? [config.snsTopicArn] : undefined,
        }
      )
    );

    // Lambda concurrent executions alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'lambda-concurrent-alarm',
        {
          alarmName: `${config.lambdaFunctionName}-concurrent-executions`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'ConcurrentExecutions',
          namespace: 'AWS/Lambda',
          period: 60,
          statistic: 'Maximum',
          threshold: 900,
          alarmDescription: 'Lambda concurrent executions approaching limit',
          dimensions: {
            FunctionName: config.lambdaFunctionName,
          },
          alarmActions: config.snsTopicArn ? [config.snsTopicArn] : undefined,
        }
      )
    );

    // Lambda duration alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
        this,
        'lambda-duration-alarm',
        {
          alarmName: `${config.lambdaFunctionName}-duration`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'Duration',
          namespace: 'AWS/Lambda',
          period: 300,
          statistic: 'Average',
          threshold: 3000,
          alarmDescription: 'Lambda function duration is too high',
          dimensions: {
            FunctionName: config.lambdaFunctionName,
          },
          alarmActions: config.snsTopicArn ? [config.snsTopicArn] : undefined,
        }
      )
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: `${config.environment}-serverless-dashboard`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/Lambda',
                    'Invocations',
                    { stat: 'Sum', label: 'Invocations' },
                  ],
                  ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
                  ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
                  [
                    '.',
                    'ConcurrentExecutions',
                    { stat: 'Maximum', label: 'Concurrent' },
                  ],
                ],
                view: 'timeSeries',
                stacked: false,
                region: 'us-east-1',
                title: 'Lambda Metrics',
                period: 300,
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/ApiGateway',
                    'Count',
                    { stat: 'Sum', label: 'API Requests' },
                  ],
                  ['.', '4XXError', { stat: 'Sum', label: '4XX Errors' }],
                  ['.', '5XXError', { stat: 'Sum', label: '5XX Errors' }],
                  ['.', 'Latency', { stat: 'Average', label: 'Avg Latency' }],
                ],
                view: 'timeSeries',
                stacked: false,
                region: 'us-east-1',
                title: 'API Gateway Metrics',
                period: 300,
              },
            },
          ],
        }),
      }
    );
  }
}

```

## modules.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  VpcModule,
  S3Module,
  LambdaModule,
  CloudFrontModule,
  SecretsModule,
  ApiGatewayModule,
  MonitoringModule,
} from './modules';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  // Expose modules for cross-stack references if needed
  public readonly vpc: VpcModule;
  public readonly storage: S3Module;
  public readonly lambda: LambdaModule;
  public readonly cdn: CloudFrontModule;
  public readonly api: ApiGatewayModule;
  public readonly secrets: SecretsModule;
  public readonly monitoring: MonitoringModule;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags
      ? [props.defaultTags]
      : [
          {
            tags: {
              Environment: environmentSuffix,
              ManagedBy: 'CDKTF',
              Stack: id,
              Project: 'ServerlessApp',
            },
          },
        ];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ========================================
    // STACK INSTANTIATIONS
    // ========================================

    // 1. VPC Module - Network foundation for Lambda
    this.vpc = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      azCount: 2, // Use 2 AZs for HA
      region: awsRegion,
      environment: environmentSuffix,
    });

    // 2. Secrets Module - Store application secrets
    this.secrets = new SecretsModule(this, 'secrets', {
      secretName: `${environmentSuffix}-app-secrets`,
      description: 'Application secrets for serverless app',
      environment: environmentSuffix,
      secretData: {
        apiKey: 'YOUR_API_KEY_HERE',
        dbConnectionString: 'YOUR_CONNECTION_STRING_HERE',
        jwtSecret: 'YOUR_JWT_SECRET_HERE',
      },
      rotationDays: 90,
    });

    // 3. S3 Module - Content storage bucket
    // FIXED: Changed lifecycle rule format to use 'status' field
    this.storage = new S3Module(this, 'content-storage', {
      bucketName: `${environmentSuffix}-serverless-content-${Date.now()}`,
      environment: environmentSuffix,
      enableCors: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          status: 'Enabled', // FIXED: Changed from 'enabled: true' to 'status: "Enabled"'
          prefix: 'logs/',
          expiration: {
            days: 30,
          },
        },
        {
          id: 'transition-to-ia',
          status: 'Enabled', // FIXED: Changed from 'enabled: true' to 'status: "Enabled"'
          prefix: 'archives/',
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // 4. Lambda Module - Serverless compute
    this.lambda = new LambdaModule(this, 'api-lambda', {
      functionName: `${environmentSuffix}-api-handler`,
      handler: 'index.handler',
      runtime: 'python3.9',
      memorySize: 1024, // Optimized for performance
      timeout: 30,
      sourceBucket: 'lambda-zip-b',
      sourceKey: 'security-lambda.zip', // You'll need to upload your code here
      environment: environmentSuffix,
      vpcConfig: {
        subnetIds: this.vpc.privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [this.vpc.securityGroup.id],
      },
      environmentVariables: {
        ENVIRONMENT: environmentSuffix,
        SECRET_ARN: this.secrets.secret.arn,
        S3_BUCKET: this.storage.bucket.id,
        REGION: awsRegion,
      },
      reservedConcurrentExecutions: environmentSuffix === 'prod' ? 200 : 50,
    });

    // Grant Lambda permissions to access S3 and Secrets
    this.addLambdaPermissions();

    // 5. API Gateway Module - HTTP API endpoint
    this.api = new ApiGatewayModule(this, 'http-api', {
      apiName: `${environmentSuffix}-serverless-api`,
      environment: environmentSuffix,
      lambdaFunctionArn: this.lambda.function.arn,
      lambdaFunctionName: this.lambda.function.functionName,
      throttleSettings: {
        rateLimit: environmentSuffix === 'prod' ? 10000 : 1000,
        burstLimit: environmentSuffix === 'prod' ? 5000 : 500,
      },
    });

    // 6. CloudFront Module - CDN for content delivery
    this.cdn = new CloudFrontModule(this, 'cdn', {
      s3BucketDomainName: this.storage.bucket.bucketRegionalDomainName,
      s3BucketId: this.storage.bucket.id,
      environment: environmentSuffix,
      priceClass:
        environmentSuffix === 'prod' ? 'PriceClass_All' : 'PriceClass_100',
      // Uncomment if you have a custom domain and certificate
      // customDomain: 'app.example.com',
      // certificateArn: 'arn:aws:acm:us-east-1:...',
    });

    // Update S3 bucket policy to allow CloudFront access
    this.updateS3BucketPolicyForCloudFront();

    // 7. Monitoring Module - Observability
    this.monitoring = new MonitoringModule(this, 'monitoring', {
      environment: environmentSuffix,
      lambdaFunctionName: this.lambda.function.functionName,
      apiId: this.api.api.id,
      // Create SNS topic for alarms if needed
      // snsTopicArn: this.createSnsAlarmTopic().arn,
    });

    // ========================================
    // OUTPUT IMPORTANT VALUES
    // ========================================
    this.createOutputs();
  }

  /**
   * Add necessary IAM permissions for Lambda
   */
  private addLambdaPermissions(): void {
    // S3 access policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-s3-policy', {
      name: `${this.lambda.function.functionName}-s3-access`,
      role: this.lambda.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [this.storage.bucket.arn, `${this.storage.bucket.arn}/*`],
          },
        ],
      }),
    });

    // Secrets Manager access policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-secrets-policy', {
      name: `${this.lambda.function.functionName}-secrets-access`,
      role: this.lambda.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: this.secrets.secret.arn,
          },
        ],
      }),
    });

    // X-Ray tracing policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-xray-policy', {
      name: `${this.lambda.function.functionName}-xray-access`,
      role: this.lambda.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
          },
        ],
      }),
    });
  }

  /**
   * Update S3 bucket policy to allow CloudFront OAC access
   */
  private updateS3BucketPolicyForCloudFront(): void {
    new aws.s3BucketPolicy.S3BucketPolicy(this, 's3-cloudfront-policy', {
      bucket: this.storage.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAC',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${this.storage.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': this.cdn.distribution.arn,
              },
            },
          },
        ],
      }),
    });
  }

  /**
   * Create Terraform outputs for important values
   */
  private createOutputs(): void {
    new TerraformOutput(this, 'api-endpoint', {
      value: this.api.stage.invokeUrl,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'cloudfront-domain', {
      value: this.cdn.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: this.cdn.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: this.storage.bucket.id,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: this.lambda.function.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: this.lambda.function.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'monitoring-dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${this.monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}

```