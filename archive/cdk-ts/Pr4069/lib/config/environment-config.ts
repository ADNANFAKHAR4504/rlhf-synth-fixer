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
  private static defaultConfig: IEnvironmentConfig = {
    department: 'Engineering',
    budgetLimit: 100,
    vpc: {
      enableVpcPeering: false,
      maxAzs: 2,
    },
    cognito: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    },
    dynamodb: {
      tables: [
        {
          name: 'UserTable',
          partitionKey: 'userId',
          readCapacity: 5,
          writeCapacity: 5,
          enableAutoScaling: false,
        },
      ],
    },
    lambda: {
      functions: [
        {
          name: 'UserHandler',
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          memorySize: 256,
          timeout: 30,
        },
      ],
      enableVersioning: true,
      aliasName: 'default',
    },
    apiGateway: {
      stageName: 'default',
      throttleRateLimit: 100,
      throttleBurstLimit: 200,
    },
    monitoring: {
      alarmEmail: 'alerts@example.com',
      lambdaErrorThreshold: 5,
      lambdaDurationThreshold: 3000,
    },
    environmentVariables: {
      LOG_LEVEL: 'INFO',
      API_VERSION: 'v1',
    },
  };

  private static configs: { [key: string]: IEnvironmentConfig } = {
    dev: {
      department: 'Engineering',
      budgetLimit: 100,
      vpc: {
        enableVpcPeering: false,
        maxAzs: 2,
      },
      cognito: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: false,
        },
      },
      dynamodb: {
        tables: [
          {
            name: 'UserTable',
            partitionKey: 'userId',
            readCapacity: 5,
            writeCapacity: 5,
            enableAutoScaling: false,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'UserHandler',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            memorySize: 256,
            timeout: 30,
          },
        ],
        enableVersioning: true,
        aliasName: 'dev',
      },
      apiGateway: {
        stageName: 'dev',
        throttleRateLimit: 100,
        throttleBurstLimit: 200,
      },
      monitoring: {
        alarmEmail: 'dev-alerts@example.com',
        lambdaErrorThreshold: 5,
        lambdaDurationThreshold: 3000,
      },
      environmentVariables: {
        LOG_LEVEL: 'DEBUG',
        API_VERSION: 'v1',
      },
    },
    staging: {
      department: 'Engineering',
      budgetLimit: 500,
      vpc: {
        enableVpcPeering: true,
        peeringVpcId: 'vpc-12345678',
        peeringRegion: 'us-east-1',
        maxAzs: 2,
      },
      cognito: {
        passwordPolicy: {
          minLength: 10,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
      },
      dynamodb: {
        tables: [
          {
            name: 'UserTable',
            partitionKey: 'userId',
            readCapacity: 10,
            writeCapacity: 10,
            enableAutoScaling: true,
            maxReadCapacity: 50,
            maxWriteCapacity: 50,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'UserHandler',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            memorySize: 512,
            timeout: 60,
            reservedConcurrentExecutions: 10,
          },
        ],
        enableVersioning: true,
        aliasName: 'staging',
      },
      apiGateway: {
        stageName: 'staging',
        throttleRateLimit: 500,
        throttleBurstLimit: 1000,
        quotaLimit: 10000,
        quotaPeriod: 'DAY',
      },
      monitoring: {
        alarmEmail: 'staging-alerts@example.com',
        lambdaErrorThreshold: 10,
        lambdaDurationThreshold: 5000,
      },
      environmentVariables: {
        LOG_LEVEL: 'INFO',
        API_VERSION: 'v1',
      },
    },
    production: {
      department: 'Engineering',
      budgetLimit: 2000,
      vpc: {
        enableVpcPeering: true,
        peeringVpcId: 'vpc-87654321',
        peeringRegion: 'us-east-1',
        maxAzs: 3,
      },
      cognito: {
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
      },
      dynamodb: {
        tables: [
          {
            name: 'UserTable',
            partitionKey: 'userId',
            readCapacity: 25,
            writeCapacity: 25,
            enableAutoScaling: true,
            maxReadCapacity: 100,
            maxWriteCapacity: 100,
          },
        ],
      },
      lambda: {
        functions: [
          {
            name: 'UserHandler',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            memorySize: 1024,
            timeout: 120,
            reservedConcurrentExecutions: 50,
          },
        ],
        enableVersioning: true,
        aliasName: 'production',
      },
      apiGateway: {
        stageName: 'production',
        throttleRateLimit: 1000,
        throttleBurstLimit: 2000,
        quotaLimit: 100000,
        quotaPeriod: 'DAY',
      },
      customDomain: {
        domainName: 'api.example.com',
        certificateArn:
          'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
      },
      monitoring: {
        alarmEmail: 'production-alerts@example.com',
        lambdaErrorThreshold: 25,
        lambdaDurationThreshold: 10000,
      },
      environmentVariables: {
        LOG_LEVEL: 'WARN',
        API_VERSION: 'v1',
      },
    },
  };

  static getConfig(environment: string): IEnvironmentConfig {
    const config = this.configs[environment];
    if (!config) {
      console.warn(
        `Configuration for environment '${environment}' not found. Using default configuration.`
      );
      return this.defaultConfig;
    }
    return config;
  }
}
