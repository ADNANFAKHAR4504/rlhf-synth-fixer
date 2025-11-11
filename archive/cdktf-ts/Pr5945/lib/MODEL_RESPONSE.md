## modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { TerraformAsset, AssetType } from 'cdktf';
import * as path from 'path';
import * as fs from 'fs';
import * as archiver from 'archiver';

// VPC Module with optimized networking for serverless
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly natGateway: aws.natGateway.NatGateway;
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: {
    cidrBlock: string;
    azCount: number;
    region: string;
    environment: string;
  }) {
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
    this.internetGateway = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-igw`,
      },
    });

    // Get availability zones
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    this.publicSubnets = [];
    this.privateSubnets = [];

    // Create subnets across multiple AZs for high availability
    for (let i = 0; i < config.azCount; i++) {
      // Public subnets
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `${azs.names.get(i)}`,
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
        availabilityZone: `${azs.names.get(i)}`,
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
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
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

    const privateRouteTable = new aws.routeTable.RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-private-rt`,
      },
    });

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate route tables
    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security group for Lambda
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'lambda-sg', {
      vpcId: this.vpc.id,
      name: `${config.environment}-lambda-sg`,
      description: 'Security group for Lambda functions',
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: {
        Name: `${config.environment}-lambda-sg`,
      },
    });
  }
}

// S3 Module with security best practices
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketAcl: aws.s3BucketAcl.S3BucketAcl;
  public readonly bucketVersioning: aws.s3BucketVersioningV2.S3BucketVersioningV2;
  public readonly bucketEncryption: aws.s3BucketServerSideEncryptionConfigurationV2.S3BucketServerSideEncryptionConfigurationV2;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;

  constructor(scope: Construct, id: string, config: {
    bucketName: string;
    environment: string;
    enableCors?: boolean;
    lifecycleRules?: any[];
  }) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: config.bucketName,
      tags: {
        Environment: config.environment,
        ManagedBy: 'CDKTF',
      },
    });

    // Enable versioning
    this.bucketVersioning = new aws.s3BucketVersioningV2.S3BucketVersioningV2(this, 'versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption with AES256
    this.bucketEncryption = new aws.s3BucketServerSideEncryptionConfigurationV2.S3BucketServerSideEncryptionConfigurationV2(
      this,
      'encryption',
      {
        bucket: this.bucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        }],
      }
    );

    // Block all public access
    this.bucketPublicAccessBlock = new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
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

    // Set bucket ACL to private
    this.bucketAcl = new aws.s3BucketAcl.S3BucketAcl(this, 'acl', {
      bucket: this.bucket.id,
      acl: 'private',
      dependsOn: [this.bucketPublicAccessBlock],
    });

    // Add lifecycle rules if provided
    if (config.lifecycleRules && config.lifecycleRules.length > 0) {
      new aws.s3BucketLifecycleConfigurationV2.S3BucketLifecycleConfigurationV2(
        this,
        'lifecycle',
        {
          bucket: this.bucket.id,
          rule: config.lifecycleRules,
        }
      );
    }

    // CORS configuration for CloudFront
    if (config.enableCors) {
      new aws.s3BucketCorsConfigurationV2.S3BucketCorsConfigurationV2(this, 'cors', {
        bucket: this.bucket.id,
        corsRule: [{
          allowedHeaders: ['*'],
          allowedMethods: ['GET', 'HEAD'],
          allowedOrigins: ['*'],
          exposeHeaders: ['ETag'],
          maxAgeSeconds: 3000,
        }],
      });
    }
  }
}

// Lambda Module with optimization for cold starts
export class LambdaModule extends Construct {
  public readonly function: aws.lambdaFunction.LambdaFunction;
  public readonly role: aws.iamRole.IamRole;
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;
  public readonly alias: aws.lambdaAlias.LambdaAlias;

  constructor(scope: Construct, id: string, config: {
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
  }) {
    super(scope, id);

    // CloudWatch Log Group with retention
    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/${config.functionName}`,
      retentionInDays: 14,
      tags: {
        Environment: config.environment,
      },
    });

    // IAM role with least privilege
    this.role = new aws.iamRole.IamRole(this, 'role', {
      name: `${config.functionName}-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: {
        Environment: config.environment,
      },
    });

    // Attach managed policies for VPC and CloudWatch
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(this, 'vpc-policy', {
      role: this.role.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Custom policy for CloudWatch Logs
    new aws.iamRolePolicy.IamRolePolicy(this, 'logs-policy', {
      name: `${config.functionName}-logs`,
      role: this.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: `arn:aws:logs:*:*:log-group:/aws/lambda/${config.functionName}*`,
        }],
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
      reservedConcurrentExecutions: config.reservedConcurrentExecutions || 100,
      environment: config.environmentVariables ? {
        variables: config.environmentVariables,
      } : undefined,
      vpcConfig: config.vpcConfig,
      layers: config.layers,
      tracingConfig: {
        mode: 'Active',
      },
      deadLetterConfig: {
        targetArn: this.createDeadLetterQueue(config.functionName).arn,
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
    if (config.reservedConcurrentExecutions && config.reservedConcurrentExecutions > 100) {
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
    // Create package.json for dependencies
    const packageJson = {
      name: functionName,
      version: '1.0.0',
      dependencies: {
        'aws-sdk': '2.1000.0'
      }
    };
    fs.writeFileSync('/tmp/package.json', JSON.stringify(packageJson, null, 2));

    // Create zip file
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.file('/tmp/index.js', { name: 'index.js' });
    archive.file('/tmp/package.json', { name: 'package.json' });
    archive.finalize();

    return zipPath;
  }

  private getFileHash(filePath: string): string {
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('base64');
  }

  private createDeadLetterQueue(functionName: string): aws.sqsQueue.SqsQueue {
    return new aws.sqsQueue.SqsQueue(this, 'dlq', {
      name: `${functionName}-dlq`,
      messageRetentionSeconds: 1209600, // 14 days
      tags: {
        Purpose: 'DeadLetterQueue',
        Function: functionName,
      },
    });
  }
}

// CloudFront Module for content delivery
export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly originAccessControl: aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl;

  constructor(scope: Construct, id: string, config: {
    s3BucketDomainName: string;
    s3BucketId: string;
    environment: string;
    priceClass?: string;
    customDomain?: string;
    certificateArn?: string;
  }) {
    super(scope, id);

    // Origin Access Control for S3
    this.originAccessControl = new aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl(
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
        
        origin: [{
          domainName: config.s3BucketDomainName,
          originId: `S3-${config.s3BucketId}`,
          originAccessControlId: this.originAccessControl.id,
          s3OriginConfig: {
            originAccessIdentity: '',
          },
        }],
        
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
            headers: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
            cookies: {
              forward: 'none',
            },
          },
          
          functionAssociation: [{
            eventType: 'viewer-response',
            functionArn: this.createCachingFunction().arn,
          }],
        },
        
        orderedCacheBehavior: [{
          pathPattern: '/api/*',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: `S3-${config.s3BucketId}`,
          viewerProtocolPolicy: 'https-only',
          compress: true,
          minTtl: 0,
          defaultTtl: 0,
          maxTtl: 0,
          
          forwardedValues: {
            queryString: true,
            headers: ['*'],
            cookies: {
              forward: 'all',
            },
          },
        }],
        
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
        
        viewerCertificate: config.certificateArn ? {
          acmCertificateArn: config.certificateArn,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        } : {
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

    return new aws.cloudfrontFunction.CloudfrontFunction(this, 'security-headers', {
      name: 'security-headers-function',
      runtime: 'cloudfront-js-1.0',
      code: code,
      comment: 'Add security headers to responses',
    });
  }

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
            rateBasedStatement: {
              limit: 2000, // 2000 requests per 5 minutes
              aggregateKeyType: 'IP',
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
            managedRuleGroupStatement: {
              vendorName: 'AWS',
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

  constructor(scope: Construct, id: string, config: {
    secretName: string;
    description: string;
    environment: string;
    secretData: { [key: string]: string };
    rotationDays?: number;
  }) {
    super(scope, id);

    this.secret = new aws.secretsmanagerSecret.SecretsmanagerSecret(this, 'secret', {
      name: config.secretName,
      description: config.description,
      rotationRules: config.rotationDays ? {
        automaticallyAfterDays: config.rotationDays,
      } : undefined,
      tags: {
        Environment: config.environment,
        ManagedBy: 'CDKTF',
      },
    });

    this.secretVersion = new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
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

  constructor(scope: Construct, id: string, config: {
    apiName: string;
    environment: string;
    lambdaFunctionArn: string;
    lambdaFunctionName: string;
    throttleSettings?: {
      rateLimit: number;
      burstLimit: number;
    };
  }) {
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
      throttleSettings: config.throttleSettings || {
        rateLimit: 1000,
        burstLimit: 2000,
      },
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

  private createApiLogGroup(apiName: string): aws.cloudwatchLogGroup.CloudwatchLogGroup {
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

  constructor(scope: Construct, id: string, config: {
    environment: string;
    lambdaFunctionName: string;
    apiId: string;
    snsTopicArn?: string;
  }) {
    super(scope, id);

    this.alarms = [];

    // Lambda error rate alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'lambda-error-alarm', {
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
      })
    );

    // Lambda concurrent executions alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'lambda-concurrent-alarm', {
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
      })
    );

    // Lambda duration alarm
    this.alarms.push(
      new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'lambda-duration-alarm', {
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
      })
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `${config.environment}-serverless-dashboard`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { stat: 'Sum', label: 'Invocations' }],
                ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
                ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
                ['.', 'ConcurrentExecutions', { stat: 'Maximum', label: 'Concurrent' }],
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
                ['AWS/ApiGateway', 'Count', { stat: 'Sum', label: 'API Requests' }],
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
    });
  }
}
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules here
import {
  VpcModule,
  S3Module,
  LambdaModule,
  CloudFrontModule,
  SecretsModule,
  ApiGatewayModule,
  MonitoringModule,
} from './modules';

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
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

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

    // Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    
    // Create a comprehensive serverless infrastructure stack
    new ServerlessInfrastructureStack(this, 'serverless-infra', {
      environment: environmentSuffix,
      region: awsRegion,
    });
  }
}

// Serverless Infrastructure Stack - A complete serverless application setup
export class ServerlessInfrastructureStack extends Construct {
  private vpc: VpcModule;
  private contentBucket: S3Module;
  private lambdaBucket: S3Module;
  private lambda: LambdaModule;
  private cloudfront: CloudFrontModule;
  private secrets: SecretsModule;
  private apiGateway: ApiGatewayModule;
  private monitoring: MonitoringModule;

  constructor(
    scope: Construct,
    id: string,
    config: {
      environment: string;
      region: string;
    }
  ) {
    super(scope, id);

    // 1. Network Infrastructure
    this.vpc = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      azCount: 2, // Multi-AZ for high availability
      region: config.region,
      environment: config.environment,
    });

    // 2. Lambda Deployment Bucket
    this.lambdaBucket = new S3Module(this, 'lambda-bucket', {
      bucketName: `${config.environment}-lambda-deployments-${Date.now()}`,
      environment: config.environment,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
          },
        },
      ],
    });

    // 3. Content Storage Bucket (for static assets)
    this.contentBucket = new S3Module(this, 'content-bucket', {
      bucketName: `${config.environment}-static-content-${Date.now()}`,
      environment: config.environment,
      enableCors: true,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
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

    // 4. Secrets Management
    this.secrets = new SecretsModule(this, 'api-secrets', {
      secretName: `${config.environment}/api/credentials`,
      description: 'API credentials and configuration',
      environment: config.environment,
      secretData: {
        apiKey: 'replace-with-actual-key',
        dbConnectionString: 'replace-with-actual-connection',
        jwtSecret: 'replace-with-actual-secret',
      },
      rotationDays: 90,
    });

    // 5. Lambda Function
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
        ENVIRONMENT: config.environment,
        SECRET_ARN: this.secrets.secret.arn,
        CONTENT_BUCKET: this.contentBucket.bucket.id,
      },
      reservedConcurrentExecutions: config.environment === 'prod' ? 200 : 50,
    });

    // 6. API Gateway
    this.apiGateway = new ApiGatewayModule(this, 'api-gateway', {
      apiName: `${config.environment}-serverless-api`,
      environment: config.environment,
      lambdaFunctionArn: this.lambda.function.arn,
      lambdaFunctionName: this.lambda.function.functionName,
      throttleSettings: {
        rateLimit: config.environment === 'prod' ? 1000 : 100,
        burstLimit: config.environment === 'prod' ? 2000 : 200,
      },
    });

    // 7. CloudFront Distribution
    this.cloudfront = new CloudFrontModule(this, 'cdn', {
      s3BucketDomainName: this.contentBucket.bucket.bucketRegionalDomainName,
      s3BucketId: this.contentBucket.bucket.id,
      environment: config.environment,
      priceClass: config.environment === 'prod' 
        ? 'PriceClass_All' 
        : 'PriceClass_100',
      // Uncomment and configure for custom domain
      // customDomain: 'api.example.com',
      // certificateArn: 'arn:aws:acm:us-east-1:...',
    });

    // 8. Monitoring and Alerting
    this.monitoring = new MonitoringModule(this, 'monitoring', {
      environment: config.environment,
      lambdaFunctionName: this.lambda.function.functionName,
      apiId: this.apiGateway.api.id,
      // Configure SNS topic for alerts in production
      // snsTopicArn: 'arn:aws:sns:...',
    });

    // Grant Lambda permissions to access resources
    this.grantLambdaPermissions();

    // Update S3 bucket policy for CloudFront access
    this.configureS3BucketPolicyForCloudFront();
  }

  private grantLambdaPermissions(): void {
    // Grant Lambda permission to read secrets
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-secrets-policy', {
      name: `${this.lambda.function.functionName}-secrets`,
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

    // Grant Lambda permission to access S3 content bucket
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-s3-policy', {
      name: `${this.lambda.function.functionName}-s3`,
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
            Resource: [
              this.contentBucket.bucket.arn,
              `${this.contentBucket.bucket.arn}/*`,
            ],
          },
        ],
      }),
    });
  }

  private configureS3BucketPolicyForCloudFront(): void {
    // Update S3 bucket policy to allow CloudFront OAC access
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'cloudfront-bucket-policy', {
      bucket: this.contentBucket.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${this.contentBucket.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': this.cloudfront.distribution.arn,
              },
            },
          },
        ],
      }),
    });
  }
}

```