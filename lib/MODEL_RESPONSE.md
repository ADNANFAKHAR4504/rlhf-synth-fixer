```typescript
// bin/tap.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { EnvironmentConfig } from '../lib/config/environment-config';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';
const config = EnvironmentConfig.getConfig(environment);

new TapStack(app, `TapStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  config,
  environment,
  tags: {
    Environment: environment,
    Department: config.department,
    Project: 'TAP',
    ManagedBy: 'CDK'
  }
});
```

```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './constructs/vpc-construct';
import { CognitoConstruct } from './constructs/cognito-construct';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { IEnvironmentConfig } from './config/environment-config';

export interface TapStackProps extends cdk.StackProps {
  config: IEnvironmentConfig;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const vpc = new VpcConstruct(this, 'VPC', {
      environment: props.environment,
      config: props.config.vpc
    });

    const cognito = new CognitoConstruct(this, 'Cognito', {
      environment: props.environment,
      config: props.config.cognito
    });

    const dynamodb = new DynamoDBConstruct(this, 'DynamoDB', {
      environment: props.environment,
      config: props.config.dynamodb,
      budgetLimit: props.config.budgetLimit
    });

    const lambda = new LambdaConstruct(this, 'Lambda', {
      environment: props.environment,
      vpc: vpc.vpc,
      tables: dynamodb.tables,
      config: props.config.lambda,
      environmentVariables: props.config.environmentVariables
    });

    const apiGateway = new ApiGatewayConstruct(this, 'APIGateway', {
      environment: props.environment,
      lambdaFunctions: lambda.functions,
      userPool: cognito.userPool,
      config: props.config.apiGateway,
      domainConfig: props.config.customDomain
    });

    new MonitoringConstruct(this, 'Monitoring', {
      environment: props.environment,
      lambdaFunctions: lambda.functions,
      apiGateway: apiGateway.api,
      tables: dynamodb.tables,
      config: props.config.monitoring
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: apiGateway.api.url,
      description: 'API Gateway URL'
    });

    if (apiGateway.customDomainName) {
      new cdk.CfnOutput(this, 'CustomApiUrl', {
        value: `https://${apiGateway.customDomainName}`,
        description: 'Custom API Domain URL'
      });
    }
  }
}
```

```typescript
// lib/config/environment-config.ts
export interface IVpcConfig {
  enableVpcPeering: boolean;
  peeringVpcId?: string;
  peeringRegion?: string;
  maxAzs: number;
}

export interface ICognitoConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireDigits: boolean;
    requireSymbols: boolean;
  };
}

export interface IDynamoDBConfig {
  tables: Array<{
    name: string;
    partitionKey: string;
    sortKey?: string;
    readCapacity: number;
    writeCapacity: number;
    enableAutoScaling: boolean;
    maxReadCapacity?: number;
    maxWriteCapacity?: number;
  }>;
}

export interface ILambdaConfig {
  functions: Array<{
    name: string;
    handler: string;
    runtime: string;
    memorySize: number;
    timeout: number;
    reservedConcurrentExecutions?: number;
  }>;
  enableVersioning: boolean;
  aliasName: string;
}

export interface IApiGatewayConfig {
  stageName: string;
  throttleRateLimit: number;
  throttleBurstLimit: number;
  quotaLimit?: number;
  quotaPeriod?: 'DAY' | 'WEEK' | 'MONTH';
}

export interface ICustomDomainConfig {
  domainName: string;
  certificateArn: string;
}

export interface IMonitoringConfig {
  alarmEmail: string;
  lambdaErrorThreshold: number;
  lambdaDurationThreshold: number;
}

export interface IEnvironmentConfig {
  department: string;
  budgetLimit: number;
  vpc: IVpcConfig;
  cognito: ICognitoConfig;
  dynamodb: IDynamoDBConfig;
  lambda: ILambdaConfig;
  apiGateway: IApiGatewayConfig;
  customDomain?: ICustomDomainConfig;
  monitoring: IMonitoringConfig;
  environmentVariables: { [key: string]: string };
}

export class EnvironmentConfig {
  private static configs: { [key: string]: IEnvironmentConfig } = {
    dev: {
      department: 'Engineering',
      budgetLimit: 100,
      vpc: {
        enableVpcPeering: false,
        maxAzs: 2
      },
      cognito: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: false
        }
      },
      dynamodb: {
        tables: [{
          name: 'UserTable',
          partitionKey: 'userId',
          readCapacity: 5,
          writeCapacity: 5,
          enableAutoScaling: false
        }]
      },
      lambda: {
        functions: [{
          name: 'UserHandler',
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          memorySize: 256,
          timeout: 30
        }],
        enableVersioning: true,
        aliasName: 'dev'
      },
      apiGateway: {
        stageName: 'dev',
        throttleRateLimit: 100,
        throttleBurstLimit: 200
      },
      monitoring: {
        alarmEmail: 'dev-alerts@example.com',
        lambdaErrorThreshold: 5,
        lambdaDurationThreshold: 3000
      },
      environmentVariables: {
        LOG_LEVEL: 'DEBUG',
        API_VERSION: 'v1'
      }
    },
    staging: {
      department: 'Engineering',
      budgetLimit: 500,
      vpc: {
        enableVpcPeering: true,
        peeringVpcId: 'vpc-12345678',
        peeringRegion: 'us-east-1',
        maxAzs: 2
      },
      cognito: {
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: true
        }
      },
      dynamodb: {
        tables: [{
          name: 'UserTable',
          partitionKey: 'userId',
          readCapacity: 10,
          writeCapacity: 10,
          enableAutoScaling: true,
          maxReadCapacity: 50,
          maxWriteCapacity: 50
        }]
      },
      lambda: {
        functions: [{
          name: 'UserHandler',
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          memorySize: 512,
          timeout: 60,
          reservedConcurrentExecutions: 10
        }],
        enableVersioning: true,
        aliasName: 'staging'
      },
      apiGateway: {
        stageName: 'staging',
        throttleRateLimit: 500,
        throttleBurstLimit: 1000,
        quotaLimit: 10000,
        quotaPeriod: 'DAY'
      },
      monitoring: {
        alarmEmail: 'staging-alerts@example.com',
        lambdaErrorThreshold: 10,
        lambdaDurationThreshold: 5000
      },
      environmentVariables: {
        LOG_LEVEL: 'INFO',
        API_VERSION: 'v1'
      }
    },
    production: {
      department: 'Engineering',
      budgetLimit: 2000,
      vpc: {
        enableVpcPeering: true,
        peeringVpcId: 'vpc-87654321',
        peeringRegion: 'us-east-1',
        maxAzs: 3
      },
      cognito: {
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: true
        }
      },
      dynamodb: {
        tables: [{
          name: 'UserTable',
          partitionKey: 'userId',
          readCapacity: 25,
          writeCapacity: 25,
          enableAutoScaling: true,
          maxReadCapacity: 100,
          maxWriteCapacity: 100
        }]
      },
      lambda: {
        functions: [{
          name: 'UserHandler',
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          memorySize: 1024,
          timeout: 120,
          reservedConcurrentExecutions: 50
        }],
        enableVersioning: true,
        aliasName: 'production'
      },
      apiGateway: {
        stageName: 'production',
        throttleRateLimit: 1000,
        throttleBurstLimit: 2000,
        quotaLimit: 100000,
        quotaPeriod: 'DAY'
      },
      customDomain: {
        domainName: 'api.example.com',
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
      },
      monitoring: {
        alarmEmail: 'production-alerts@example.com',
        lambdaErrorThreshold: 25,
        lambdaDurationThreshold: 10000
      },
      environmentVariables: {
        LOG_LEVEL: 'WARN',
        API_VERSION: 'v1'
      }
    }
  };

  static getConfig(environment: string): IEnvironmentConfig {
    const config = this.configs[environment];
    if (!config) {
      throw new Error(`Configuration for environment '${environment}' not found`);
    }
    return config;
  }
}
```

```typescript
// lib/constructs/vpc-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { IVpcConfig } from '../config/environment-config';

export interface VpcConstructProps {
  environment: string;
  config: IVpcConfig;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly vpcPeering?: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: props.config.maxAzs,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    if (props.config.enableVpcPeering && props.config.peeringVpcId) {
      this.vpcPeering = new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
        vpcId: this.vpc.vpcId,
        peerVpcId: props.config.peeringVpcId,
        peerRegion: props.config.peeringRegion
      });

      cdk.Tags.of(this.vpcPeering).add('Name', `${props.environment}-vpc-peering`);
    }

    cdk.Tags.of(this.vpc).add('Name', `${props.environment}-vpc`);
  }
}
```

```typescript
// lib/constructs/cognito-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { ICognitoConfig } from '../config/environment-config';

export interface CognitoConstructProps {
  environment: string;
  config: ICognitoConfig;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${props.environment}-user-pool`,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email',
        emailBody: 'Please verify your email by clicking {##Verify Email##}',
        emailStyle: cognito.VerificationEmailStyle.LINK
      },
      signInAliases: {
        email: true,
        username: false
      },
      passwordPolicy: {
        minLength: props.config.passwordPolicy.minLength,
        requireUppercase: props.config.passwordPolicy.requireUppercase,
        requireLowercase: props.config.passwordPolicy.requireLowercase,
        requireDigits: props.config.passwordPolicy.requireDigits,
        requireSymbols: props.config.passwordPolicy.requireSymbols
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      generateSecret: false,
      preventUserExistenceErrors: true
    });

    cdk.Tags.of(this.userPool).add('Name', `${props.environment}-cognito`);
  }
}
```

```typescript
// lib/constructs/dynamodb-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import { Construct } from 'constructs';
import { IDynamoDBConfig } from '../config/environment-config';

export interface DynamoDBConstructProps {
  environment: string;
  config: IDynamoDBConfig;
  budgetLimit: number;
}

export class DynamoDBConstruct extends Construct {
  public readonly tables: { [key: string]: dynamodb.Table } = {};

  constructor(scope: Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);

    props.config.tables.forEach(tableConfig => {
      const table = new dynamodb.Table(this, tableConfig.name, {
        tableName: `${props.environment}-${tableConfig.name}`,
        partitionKey: {
          name: tableConfig.partitionKey,
          type: dynamodb.AttributeType.STRING
        },
        sortKey: tableConfig.sortKey ? {
          name: tableConfig.sortKey,
          type: dynamodb.AttributeType.STRING
        } : undefined,
        billingMode: dynamodb.BillingMode.PROVISIONED,
        readCapacity: tableConfig.readCapacity,
        writeCapacity: tableConfig.writeCapacity,
        pointInTimeRecovery: props.environment === 'production',
        removalPolicy: props.environment === 'production' 
          ? cdk.RemovalPolicy.RETAIN 
          : cdk.RemovalPolicy.DESTROY,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
      });

      if (tableConfig.enableAutoScaling) {
        const readScaling = table.autoScaleReadCapacity({
          minCapacity: tableConfig.readCapacity,
          maxCapacity: tableConfig.maxReadCapacity || tableConfig.readCapacity * 10
        });

        readScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60)
        });

        const writeScaling = table.autoScaleWriteCapacity({
          minCapacity: tableConfig.writeCapacity,
          maxCapacity: tableConfig.maxWriteCapacity || tableConfig.writeCapacity * 10
        });

        writeScaling.scaleOnUtilization({
          targetUtilizationPercent: 70,
          scaleInCooldown: cdk.Duration.seconds(60),
          scaleOutCooldown: cdk.Duration.seconds(60)
        });
      }

      this.tables[tableConfig.name] = table;
      cdk.Tags.of(table).add('Name', `${props.environment}-${tableConfig.name}`);
    });

    new budgets.CfnBudget(this, 'DynamoDBBudget', {
      budget: {
        budgetName: `${props.environment}-dynamodb-budget`,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: props.budgetLimit,
          unit: 'USD'
        },
        costFilters: {
          Service: ['Amazon DynamoDB'],
          TagKeyValue: [`user:Department$Engineering`]
        }
      },
      notificationsWithSubscribers: [{
        notification: {
          notificationType: 'ACTUAL',
          comparisonOperator: 'GREATER_THAN',
          threshold: 80,
          thresholdType: 'PERCENTAGE'
        },
        subscribers: [{
          subscriptionType: 'EMAIL',
          address: 'budget-alerts@example.com'
        }]
      }]
    });
  }
}
```

```typescript
// lib/constructs/lambda-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { ILambdaConfig } from '../config/environment-config';

export interface LambdaConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  tables: { [key: string]: dynamodb.Table };
  config: ILambdaConfig;
  environmentVariables: { [key: string]: string };
}

export class LambdaConstruct extends Construct {
  public readonly functions: { [key: string]: lambda.Function } = {};
  public readonly aliases: { [key: string]: lambda.Alias } = {};

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    props.config.functions.forEach(functionConfig => {
      const logGroup = new logs.LogGroup(this, `${functionConfig.name}LogGroup`, {
        logGroupName: `/aws/lambda/${props.environment}-${functionConfig.name}`,
        retention: logs.RetentionDays.THIRTY_DAYS,
        removalPolicy: props.environment === 'production' 
          ? cdk.RemovalPolicy.RETAIN 
          : cdk.RemovalPolicy.DESTROY
      });

      const functionRole = new iam.Role(this, `${functionConfig.name}Role`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: `Role for ${functionConfig.name} Lambda function`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
        ],
        inlinePolicies: {
          LambdaExecutionPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents'
                ],
                resources: [logGroup.logGroupArn]
              }),
              new iam.PolicyStatement({
                actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                resources: ['*']
              })
            ]
          })
        }
      });

      const fn = new lambda.Function(this, functionConfig.name, {
        functionName: `${props.environment}-${functionConfig.name}`,
        runtime: new lambda.Runtime(functionConfig.runtime),
        code: lambda.Code.fromAsset('lambda'),
        handler: functionConfig.handler,
        memorySize: functionConfig.memorySize,
        timeout: cdk.Duration.seconds(functionConfig.timeout),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        environment: {
          ENVIRONMENT: props.environment,
          ...props.environmentVariables,
          ...Object.entries(props.tables).reduce((acc, [name, table]) => ({
            ...acc,
            [`${name.toUpperCase()}_TABLE_NAME`]: table.tableName
          }), {})
        },
        reservedConcurrentExecutions: functionConfig.reservedConcurrentExecutions,
        tracing: lambda.Tracing.ACTIVE,
        role: functionRole,
        logGroup: logGroup
      });

      Object.values(props.tables).forEach(table => {
        table.grantReadWriteData(fn);
      });

      if (props.config.enableVersioning) {
        const version = fn.currentVersion;
        
        const alias = new lambda.Alias(this, `${functionConfig.name}Alias`, {
          aliasName: props.config.aliasName,
          version: version,
          provisionedConcurrentExecutions: props.environment === 'production' ? 1 : undefined
        });

        new lambda.CfnCodeSigningConfig(this, `${functionConfig.name}CodeSigning`, {
          allowedPublishers: {
            signingProfileVersionArns: []
          },
          codeSigningPolicies: {
            untrustedArtifactOnDeployment: 'Warn'
          }
        });

        this.aliases[functionConfig.name] = alias;
        this.functions[functionConfig.name] = fn;
      } else {
        this.functions[functionConfig.name] = fn;
      }

      cdk.Tags.of(fn).add('Name', `${props.environment}-${functionConfig.name}`);
    });
  }
}
```

```typescript
// lib/constructs/api-gateway-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { IApiGatewayConfig, ICustomDomainConfig } from '../config/environment-config';

export interface ApiGatewayConstructProps {
  environment: string;
  lambdaFunctions: { [key: string]: lambda.Function };
  userPool: cognito.UserPool;
  config: IApiGatewayConfig;
  domainConfig?: ICustomDomainConfig;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly customDomainName?: string;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: `${props.environment}-authorizer`,
      identitySource: 'method.request.header.Authorization'
    });

    const logGroup = new cdk.aws_logs.LogGroup(this, 'ApiLogGroup', {
      retention: cdk.aws_logs.RetentionDays.THIRTY_DAYS
    });

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${props.environment}-api`,
      deployOptions: {
        stageName: props.config.stageName,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: props.environment !== 'production',
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.clf()
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `${props.environment}-usage-plan`,
      apiStages: [{
        api: this.api,
        stage: this.api.deploymentStage
      }],
      throttle: {
        rateLimit: props.config.throttleRateLimit,
        burstLimit: props.config.throttleBurstLimit
      },
      quota: props.config.quotaLimit ? {
        limit: props.config.quotaLimit,
        period: apigateway.Period[props.config.quotaPeriod!]
      } : undefined
    });

    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `${props.environment}-api-key`
    });

    usagePlan.addApiKey(apiKey);

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      const resource = this.api.root.addResource(name.toLowerCase());
      const integration = new apigateway.LambdaIntegration(fn, {
        proxy: true
      });

      resource.addMethod('GET', integration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
        apiKeyRequired: true
      });

      resource.addMethod('POST', integration, {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer,
        apiKeyRequired: true
      });
    });

    if (props.domainConfig) {
      const domainName = new apigateway.DomainName(this, 'CustomDomain', {
        domainName: props.domainConfig.domainName,
        certificate: certificatemanager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.domainConfig.certificateArn
        ),
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2
      });

      domainName.addBasePathMapping(this.api, {
        basePath: props.environment === 'production' ? '' : props.environment
      });

      this.customDomainName = props.domainConfig.domainName;

      new cdk.CfnOutput(this, 'ApiKeyId', {
        value: apiKey.keyId,
        description: 'API Key ID'
      });
    }

    cdk.Tags.of(this.api).add('Name', `${props.environment}-api`);
  }
}
```

```typescript
// lib/constructs/monitoring-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { IMonitoringConfig } from '../config/environment-config';

export interface MonitoringConstructProps {
  environment: string;
  lambdaFunctions: { [key: string]: lambda.Function };
  apiGateway: apigateway.RestApi;
  tables: { [key: string]: dynamodb.Table };
  config: IMonitoringConfig;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${props.environment}-alarms`,
      displayName: `${props.environment} CloudWatch Alarms`
    });

    alarmTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.config.alarmEmail)
    );

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
        alarmName: `${props.environment}-${name}-errors`,
        metric: fn.metricErrors(),
        threshold: props.config.lambdaErrorThreshold,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      new cloudwatch.Alarm(this, `${name}DurationAlarm`, {
        alarmName: `${props.environment}-${name}-duration`,
        metric: fn.metricDuration(),
        threshold: props.config.lambdaDurationThreshold,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

      new cloudwatch.Alarm(this, `${name}ThrottlesAlarm`, {
        alarmName: `${props.environment}-${name}-throttles`,
        metric: fn.metricThrottles(),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    new cloudwatch.Alarm(this, 'Api4XXAlarm', {
      alarmName: `${props.environment}-api-4xx`,
      metric: props.apiGateway.metricClientError(),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    new cloudwatch.Alarm(this, 'Api5XXAlarm', {
      alarmName: `${props.environment}-api-5xx`,
      metric: props.apiGateway.metricServerError(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    Object.entries(props.tables).forEach(([name, table]) => {
      new cloudwatch.Alarm(this, `${name}ReadThrottleAlarm`, {
        alarmName: `${props.environment}-${name}-read-throttles`,
        metric: table.metricUserErrors({
          statistic: 'Sum'
        }),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      }).addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    });

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${props.environment}-dashboard`,
      defaultInterval: cdk.Duration.hours(6)
    });

    Object.entries(props.lambdaFunctions).forEach(([name, fn]) => {
      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${name} Metrics`,
          left: [fn.metricInvocations()],
          right: [fn.metricErrors()],
          width: 12
        }),
        new cloudwatch.GraphWidget({
          title: `${name} Duration`,
          left: [fn.metricDuration()],
          width: 12
        })
      );
    });
  }
}
```