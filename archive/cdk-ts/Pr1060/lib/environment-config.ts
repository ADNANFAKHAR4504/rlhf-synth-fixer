export interface EnvironmentConfig {
  environmentName: string;
  lambdaMemorySize: number;
  lambdaTimeout: number;
  apiGatewayStageName: string;
  s3BucketRetentionDays: number;
  enableLogging: boolean;
  enableTracing: boolean;
  autoDeleteObjects: boolean;
}

export class EnvironmentConfigs {
  private static configs: Record<string, EnvironmentConfig> = {
    dev: {
      environmentName: 'dev',
      lambdaMemorySize: 256,
      lambdaTimeout: 30,
      apiGatewayStageName: 'dev',
      s3BucketRetentionDays: 7,
      enableLogging: true,
      enableTracing: false,
      autoDeleteObjects: true,
    },
    staging: {
      environmentName: 'staging',
      lambdaMemorySize: 512,
      lambdaTimeout: 60,
      apiGatewayStageName: 'staging',
      s3BucketRetentionDays: 30,
      enableLogging: true,
      enableTracing: true,
      autoDeleteObjects: false,
    },
    prod: {
      environmentName: 'prod',
      lambdaMemorySize: 1024,
      lambdaTimeout: 120,
      apiGatewayStageName: 'prod',
      s3BucketRetentionDays: 365,
      enableLogging: true,
      enableTracing: true,
      autoDeleteObjects: false,
    },
  };

  public static getConfig(environment: string): EnvironmentConfig {
    const config = this.configs[environment];
    if (!config) {
      throw new Error(
        `Unknown environment: ${environment}. Supported environments: ${Object.keys(this.configs).join(', ')}`
      );
    }
    return config;
  }

  public static validateEnvironment(environment: string): boolean {
    return Object.keys(this.configs).includes(environment);
  }

  public static getSupportedEnvironments(): string[] {
    return Object.keys(this.configs);
  }
}
