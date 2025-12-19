# Overview

Please find solution files below.

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment from context or default to dev
const targetEnv = app.node.tryGetContext('env') || 'dev';
const environmentConfig = EnvironmentConfigurations.getByName(targetEnv);

// Get environmentSuffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  environmentConfig.name;

// Create single TapStack with all resources
new TapStack(app, 'TapStack', {
  environmentConfig: environmentConfig,
  stackName: `TapStack${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: environmentConfig.env,
});

app.synth();

```

## ./lib/config/environment-config.ts

```typescript
import { Environment } from 'aws-cdk-lib';

export interface EnvironmentConfig {
  name: string;
  env: Environment;
  vpcConfig: VpcConfig;
  lambdaConfig: LambdaConfig;
  dynamoConfig: DynamoConfig;
  apiGatewayConfig: ApiGatewayConfig;
  s3Config: S3Config;
  sqsConfig: SqsConfig;
  tags: { [key: string]: string };
}

export interface VpcConfig {
  cidr: string;
  maxAzs: number;
  natGateways: number;
}

export interface LambdaConfig {
  memorySize: number;
  reservedConcurrentExecutions: number;
  timeout: number;
}

export interface DynamoConfig {
  readCapacity: number;
  writeCapacity: number;
  pointInTimeRecovery: boolean;
}

export interface ApiGatewayConfig {
  throttleRateLimit: number;
  throttleBurstLimit: number;
}

export interface S3Config {
  lifecycleDays: number | undefined; // undefined means indefinite
  versioning: boolean;
}

export interface SqsConfig {
  messageRetentionSeconds: number;
  visibilityTimeoutSeconds: number;
  maxReceiveCount: number;
}

export class EnvironmentConfigurations {
  static readonly DEV: EnvironmentConfig = {
    name: 'dev',
    env: {
      account: process.env.CDK_DEV_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    vpcConfig: {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 0,
    },
    lambdaConfig: {
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      timeout: 30,
    },
    dynamoConfig: {
      readCapacity: 5,
      writeCapacity: 5,
      pointInTimeRecovery: false,
    },
    apiGatewayConfig: {
      throttleRateLimit: 100,
      throttleBurstLimit: 200,
    },
    s3Config: {
      lifecycleDays: 30,
      versioning: false,
    },
    sqsConfig: {
      messageRetentionSeconds: 345600, // 4 days
      visibilityTimeoutSeconds: 30,
      maxReceiveCount: 3,
    },
    tags: {
      Environment: 'dev',
      CostCenter: 'engineering',
      ManagedBy: 'cdk',
    },
  };

  static readonly STAGING: EnvironmentConfig = {
    name: 'staging',
    env: {
      account:
        process.env.CDK_STAGING_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-2',
    },
    vpcConfig: {
      cidr: '10.1.0.0/16',
      maxAzs: 3,
      natGateways: 2,
    },
    lambdaConfig: {
      memorySize: 1024,
      reservedConcurrentExecutions: 50,
      timeout: 60,
    },
    dynamoConfig: {
      readCapacity: 10,
      writeCapacity: 10,
      pointInTimeRecovery: false,
    },
    apiGatewayConfig: {
      throttleRateLimit: 500,
      throttleBurstLimit: 1000,
    },
    s3Config: {
      lifecycleDays: 90,
      versioning: true,
    },
    sqsConfig: {
      messageRetentionSeconds: 864000, // 10 days
      visibilityTimeoutSeconds: 60,
      maxReceiveCount: 5,
    },
    tags: {
      Environment: 'staging',
      CostCenter: 'engineering',
      ManagedBy: 'cdk',
    },
  };

  static readonly PROD: EnvironmentConfig = {
    name: 'prod',
    env: {
      account: process.env.CDK_PROD_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    vpcConfig: {
      cidr: '10.2.0.0/16',
      maxAzs: 3,
      natGateways: 3,
    },
    lambdaConfig: {
      memorySize: 2048,
      reservedConcurrentExecutions: 200,
      timeout: 90,
    },
    dynamoConfig: {
      readCapacity: 25,
      writeCapacity: 25,
      pointInTimeRecovery: true,
    },
    apiGatewayConfig: {
      throttleRateLimit: 2000,
      throttleBurstLimit: 4000,
    },
    s3Config: {
      lifecycleDays: undefined, // Indefinite retention
      versioning: true,
    },
    sqsConfig: {
      messageRetentionSeconds: 1209600, // 14 days (max)
      visibilityTimeoutSeconds: 90,
      maxReceiveCount: 10,
    },
    tags: {
      Environment: 'prod',
      CostCenter: 'operations',
      ManagedBy: 'cdk',
    },
  };

  static getAll(): EnvironmentConfig[] {
    return [this.DEV, this.STAGING, this.PROD];
  }

  static getByName(name: string): EnvironmentConfig {
    const configs = { dev: this.DEV, staging: this.STAGING, prod: this.PROD };
    const config = configs[name as keyof typeof configs];
    if (!config) {
      throw new Error(`Unknown environment: ${name}`);
    }
    return config;
  }
}

```

## ./lib/lambda/order-processing/package-lock.json

```json
{
  "name": "order-processing-lambda",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "order-processing-lambda",
      "version": "1.0.0",
      "dependencies": {
        "@aws-sdk/client-dynamodb": "^3.450.0",
        "@aws-sdk/client-s3": "^3.450.0",
        "@aws-sdk/client-sqs": "^3.450.0"
      }
    },
    "node_modules/@aws-crypto/crc32": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/crc32/-/crc32-5.2.0.tgz",
      "integrity": "sha512-nLbCWqQNgUiwwtFsen1AdzAtvuLRsQS8rYgMuxCrdKf9kOssamGLuPwyTY9wyYblNr9+1XM8v6zoDTPPSIeANg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/util": "^5.2.0",
        "@aws-sdk/types": "^3.222.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@aws-crypto/crc32c": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/crc32c/-/crc32c-5.2.0.tgz",
      "integrity": "sha512-+iWb8qaHLYKrNvGRbiYRHSdKRWhto5XlZUEBwDjYNf+ly5SVYG6zEoYIdxvf5R3zyeP16w4PLBn3rH1xc74Rag==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/util": "^5.2.0",
        "@aws-sdk/types": "^3.222.0",
        "tslib": "^2.6.2"
      }
    },
    "node_modules/@aws-crypto/sha1-browser": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/sha1-browser/-/sha1-browser-5.2.0.tgz",
      "integrity": "sha512-OH6lveCFfcDjX4dbAvCFSYUjJZjDr/3XJ3xHtjn3Oj5b9RjojQo8npoLeA/bNwkOkrSQ0wgrHzXk4tDRxGKJeg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/supports-web-crypto": "^5.2.0",
        "@aws-crypto/util": "^5.2.0",
        "@aws-sdk/types": "^3.222.0",
        "@aws-sdk/util-locate-window": "^3.0.0",
        "@smithy/util-utf8": "^2.0.0",
        "tslib": "^2.6.2"
      }
    },
    "node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/is-array-buffer": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/is-array-buffer/-/is-array-buffer-2.2.0.tgz",
      "integrity": "sha512-GGP3O9QFD24uGeAXYUjwSTXARoqpZykHadOmA8G5vfJPK0/DC67qa//0qvqrJzL1xc8WQWX7/yc7fwudjPHPhA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-buffer-from": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-buffer-from/-/util-buffer-from-2.2.0.tgz",
      "integrity": "sha512-IJdWBbTcMQ6DA0gdNhh/BwrLkDR+ADW5Kr1aZmd4k3DIF6ezMV4R2NIAmT08wQJ3yUK82thHWmC/TnK/wpMMIA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/is-array-buffer": "^2.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-utf8/-/util-utf8-2.3.0.tgz",
      "integrity": "sha512-R8Rdn8Hy72KKcebgLiv8jQcQkXoLMOGGv5uI1/k0l+snqkOzQ1R0ChUBCxWMlBsFMekWjq0wRudIweFs7sKT5A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/util-buffer-from": "^2.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/sha256-browser": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/sha256-browser/-/sha256-browser-5.2.0.tgz",
      "integrity": "sha512-AXfN/lGotSQwu6HNcEsIASo7kWXZ5HYWvfOmSNKDsEqC4OashTp8alTmaz+F7TC2L083SFv5RdB+qU3Vs1kZqw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/sha256-js": "^5.2.0",
        "@aws-crypto/supports-web-crypto": "^5.2.0",
        "@aws-crypto/util": "^5.2.0",
        "@aws-sdk/types": "^3.222.0",
        "@aws-sdk/util-locate-window": "^3.0.0",
        "@smithy/util-utf8": "^2.0.0",
        "tslib": "^2.6.2"
      }
    },
    "node_modules/@aws-crypto/sha256-browser/node_modules/@smithy/is-array-buffer": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/is-array-buffer/-/is-array-buffer-2.2.0.tgz",
      "integrity": "sha512-GGP3O9QFD24uGeAXYUjwSTXARoqpZykHadOmA8G5vfJPK0/DC67qa//0qvqrJzL1xc8WQWX7/yc7fwudjPHPhA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/sha256-browser/node_modules/@smithy/util-buffer-from": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-buffer-from/-/util-buffer-from-2.2.0.tgz",
      "integrity": "sha512-IJdWBbTcMQ6DA0gdNhh/BwrLkDR+ADW5Kr1aZmd4k3DIF6ezMV4R2NIAmT08wQJ3yUK82thHWmC/TnK/wpMMIA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/is-array-buffer": "^2.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/sha256-browser/node_modules/@smithy/util-utf8": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-utf8/-/util-utf8-2.3.0.tgz",
      "integrity": "sha512-R8Rdn8Hy72KKcebgLiv8jQcQkXoLMOGGv5uI1/k0l+snqkOzQ1R0ChUBCxWMlBsFMekWjq0wRudIweFs7sKT5A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/util-buffer-from": "^2.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/sha256-js": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/sha256-js/-/sha256-js-5.2.0.tgz",
      "integrity": "sha512-FFQQyu7edu4ufvIZ+OadFpHHOt+eSTBaYaki44c+akjg7qZg9oOQeLlk77F6tSYqjDAFClrHJk9tMf0HdVyOvA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/util": "^5.2.0",
        "@aws-sdk/types": "^3.222.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/@aws-crypto/supports-web-crypto": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/supports-web-crypto/-/supports-web-crypto-5.2.0.tgz",
      "integrity": "sha512-iAvUotm021kM33eCdNfwIN//F77/IADDSs58i+MDaOqFrVjZo9bAal0NK7HurRuWLLpF1iLX7gbWrjHjeo+YFg==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      }
    },
    "node_modules/@aws-crypto/util": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@aws-crypto/util/-/util-5.2.0.tgz",
      "integrity": "sha512-4RkU9EsI6ZpBve5fseQlGNUWKMa1RLPQ1dnjnQoe07ldfIzcsGb5hC5W0Dm7u423KWzawlrpbjXBrXCEv9zazQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "^3.222.0",
        "@smithy/util-utf8": "^2.0.0",
        "tslib": "^2.6.2"
      }
    },
    "node_modules/@aws-crypto/util/node_modules/@smithy/is-array-buffer": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/is-array-buffer/-/is-array-buffer-2.2.0.tgz",
      "integrity": "sha512-GGP3O9QFD24uGeAXYUjwSTXARoqpZykHadOmA8G5vfJPK0/DC67qa//0qvqrJzL1xc8WQWX7/yc7fwudjPHPhA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/util/node_modules/@smithy/util-buffer-from": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-buffer-from/-/util-buffer-from-2.2.0.tgz",
      "integrity": "sha512-IJdWBbTcMQ6DA0gdNhh/BwrLkDR+ADW5Kr1aZmd4k3DIF6ezMV4R2NIAmT08wQJ3yUK82thHWmC/TnK/wpMMIA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/is-array-buffer": "^2.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-utf8/-/util-utf8-2.3.0.tgz",
      "integrity": "sha512-R8Rdn8Hy72KKcebgLiv8jQcQkXoLMOGGv5uI1/k0l+snqkOzQ1R0ChUBCxWMlBsFMekWjq0wRudIweFs7sKT5A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/util-buffer-from": "^2.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@aws-sdk/client-dynamodb": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/client-dynamodb/-/client-dynamodb-3.931.0.tgz",
      "integrity": "sha512-Pfs5SRoKhRuW+xD0/lCQ1ROROk9OkybhHOyoN8E3uOOWgMZyvn87Yl49oX+tV/3gmfYpYJlAfDXhscfO6n4SRg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/credential-provider-node": "3.931.0",
        "@aws-sdk/middleware-endpoint-discovery": "3.930.0",
        "@aws-sdk/middleware-host-header": "3.930.0",
        "@aws-sdk/middleware-logger": "3.930.0",
        "@aws-sdk/middleware-recursion-detection": "3.930.0",
        "@aws-sdk/middleware-user-agent": "3.931.0",
        "@aws-sdk/region-config-resolver": "3.930.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-endpoints": "3.930.0",
        "@aws-sdk/util-user-agent-browser": "3.930.0",
        "@aws-sdk/util-user-agent-node": "3.931.0",
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/core": "^3.18.2",
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/hash-node": "^4.2.5",
        "@smithy/invalid-dependency": "^4.2.5",
        "@smithy/middleware-content-length": "^4.2.5",
        "@smithy/middleware-endpoint": "^4.3.9",
        "@smithy/middleware-retry": "^4.4.9",
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/middleware-stack": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-body-length-browser": "^4.2.0",
        "@smithy/util-body-length-node": "^4.2.1",
        "@smithy/util-defaults-mode-browser": "^4.3.8",
        "@smithy/util-defaults-mode-node": "^4.2.11",
        "@smithy/util-endpoints": "^3.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-retry": "^4.2.5",
        "@smithy/util-utf8": "^4.2.0",
        "@smithy/util-waiter": "^4.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/client-s3": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/client-s3/-/client-s3-3.931.0.tgz",
      "integrity": "sha512-p+ZSRvmylk/pNImGDvLt3lOkILOexNcYvsCjvN2TR9X8RvxvPURISVp2qdGKdwUr/zkshteg1x/30GYlcTKs5g==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/sha1-browser": "5.2.0",
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/credential-provider-node": "3.931.0",
        "@aws-sdk/middleware-bucket-endpoint": "3.930.0",
        "@aws-sdk/middleware-expect-continue": "3.930.0",
        "@aws-sdk/middleware-flexible-checksums": "3.931.0",
        "@aws-sdk/middleware-host-header": "3.930.0",
        "@aws-sdk/middleware-location-constraint": "3.930.0",
        "@aws-sdk/middleware-logger": "3.930.0",
        "@aws-sdk/middleware-recursion-detection": "3.930.0",
        "@aws-sdk/middleware-sdk-s3": "3.931.0",
        "@aws-sdk/middleware-ssec": "3.930.0",
        "@aws-sdk/middleware-user-agent": "3.931.0",
        "@aws-sdk/region-config-resolver": "3.930.0",
        "@aws-sdk/signature-v4-multi-region": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-endpoints": "3.930.0",
        "@aws-sdk/util-user-agent-browser": "3.930.0",
        "@aws-sdk/util-user-agent-node": "3.931.0",
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/core": "^3.18.2",
        "@smithy/eventstream-serde-browser": "^4.2.5",
        "@smithy/eventstream-serde-config-resolver": "^4.3.5",
        "@smithy/eventstream-serde-node": "^4.2.5",
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/hash-blob-browser": "^4.2.6",
        "@smithy/hash-node": "^4.2.5",
        "@smithy/hash-stream-node": "^4.2.5",
        "@smithy/invalid-dependency": "^4.2.5",
        "@smithy/md5-js": "^4.2.5",
        "@smithy/middleware-content-length": "^4.2.5",
        "@smithy/middleware-endpoint": "^4.3.9",
        "@smithy/middleware-retry": "^4.4.9",
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/middleware-stack": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-body-length-browser": "^4.2.0",
        "@smithy/util-body-length-node": "^4.2.1",
        "@smithy/util-defaults-mode-browser": "^4.3.8",
        "@smithy/util-defaults-mode-node": "^4.2.11",
        "@smithy/util-endpoints": "^3.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-retry": "^4.2.5",
        "@smithy/util-stream": "^4.5.6",
        "@smithy/util-utf8": "^4.2.0",
        "@smithy/util-waiter": "^4.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/client-sqs": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/client-sqs/-/client-sqs-3.931.0.tgz",
      "integrity": "sha512-i/kbGJv//iLBj8aEoX34cW7ctAXoFZxdzu5rFsZB2D8LQbx0DQQJeD0JwfhQfMXFdey20fb00U/YBbJMmEk2SA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/credential-provider-node": "3.931.0",
        "@aws-sdk/middleware-host-header": "3.930.0",
        "@aws-sdk/middleware-logger": "3.930.0",
        "@aws-sdk/middleware-recursion-detection": "3.930.0",
        "@aws-sdk/middleware-sdk-sqs": "3.930.0",
        "@aws-sdk/middleware-user-agent": "3.931.0",
        "@aws-sdk/region-config-resolver": "3.930.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-endpoints": "3.930.0",
        "@aws-sdk/util-user-agent-browser": "3.930.0",
        "@aws-sdk/util-user-agent-node": "3.931.0",
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/core": "^3.18.2",
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/hash-node": "^4.2.5",
        "@smithy/invalid-dependency": "^4.2.5",
        "@smithy/md5-js": "^4.2.5",
        "@smithy/middleware-content-length": "^4.2.5",
        "@smithy/middleware-endpoint": "^4.3.9",
        "@smithy/middleware-retry": "^4.4.9",
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/middleware-stack": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-body-length-browser": "^4.2.0",
        "@smithy/util-body-length-node": "^4.2.1",
        "@smithy/util-defaults-mode-browser": "^4.3.8",
        "@smithy/util-defaults-mode-node": "^4.2.11",
        "@smithy/util-endpoints": "^3.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-retry": "^4.2.5",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/client-sso": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/client-sso/-/client-sso-3.931.0.tgz",
      "integrity": "sha512-GM/CARsIUQGEspM9VhZaftFVXnNtFNUUXjpM1ePO4CHk1J/VFvXcsQr3SHWIs0F4Ll6pvy5LpcRlWW5pK7T4aQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/middleware-host-header": "3.930.0",
        "@aws-sdk/middleware-logger": "3.930.0",
        "@aws-sdk/middleware-recursion-detection": "3.930.0",
        "@aws-sdk/middleware-user-agent": "3.931.0",
        "@aws-sdk/region-config-resolver": "3.930.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-endpoints": "3.930.0",
        "@aws-sdk/util-user-agent-browser": "3.930.0",
        "@aws-sdk/util-user-agent-node": "3.931.0",
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/core": "^3.18.2",
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/hash-node": "^4.2.5",
        "@smithy/invalid-dependency": "^4.2.5",
        "@smithy/middleware-content-length": "^4.2.5",
        "@smithy/middleware-endpoint": "^4.3.9",
        "@smithy/middleware-retry": "^4.4.9",
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/middleware-stack": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-body-length-browser": "^4.2.0",
        "@smithy/util-body-length-node": "^4.2.1",
        "@smithy/util-defaults-mode-browser": "^4.3.8",
        "@smithy/util-defaults-mode-node": "^4.2.11",
        "@smithy/util-endpoints": "^3.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-retry": "^4.2.5",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/core": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/core/-/core-3.931.0.tgz",
      "integrity": "sha512-l/b6AQbto4TuXL2FIm7Z+tbVjrp0LN7ESm97Sf3nneB0vjKtB6R0TS/IySzCYMgyOC3Hxz+Ka34HJXZk9eXTFw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/xml-builder": "3.930.0",
        "@smithy/core": "^3.18.2",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/signature-v4": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-env": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-env/-/credential-provider-env-3.931.0.tgz",
      "integrity": "sha512-dTNBpkKXyBdcpEjyfgkE/EFU/0NRoukLs+Pj0S8K1Dg216J9uIijpi6CaBBN+HvnaTlEItm2tzXiJpPVI+TqHQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-http": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-http/-/credential-provider-http-3.931.0.tgz",
      "integrity": "sha512-7Ge26fhMDn51BTbHgopx5+uOl4I47k15BDzYc4YT6zyjS99uycYNCA7zB500DGTTn2HK27ZDTyAyhTKZGxRxbA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-stream": "^4.5.6",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-ini": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-ini/-/credential-provider-ini-3.931.0.tgz",
      "integrity": "sha512-uzicpP7IHBxvAMjwGdmeke2bGTxjsKCSW7N48zuv0t0d56hmGHfcZIK5p4ry2OBJxzScp182OUAdAEG8wuSuuA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/credential-provider-env": "3.931.0",
        "@aws-sdk/credential-provider-http": "3.931.0",
        "@aws-sdk/credential-provider-process": "3.931.0",
        "@aws-sdk/credential-provider-sso": "3.931.0",
        "@aws-sdk/credential-provider-web-identity": "3.931.0",
        "@aws-sdk/nested-clients": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/credential-provider-imds": "^4.2.5",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-node": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-node/-/credential-provider-node-3.931.0.tgz",
      "integrity": "sha512-eO8mfWNHz0dyYdVfPLVzmqXaSA3agZF/XvBO9/fRU90zCb8lKlXfgUmghGW7LhDkiv2v5uuizUiag7GsKoIcJw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/credential-provider-env": "3.931.0",
        "@aws-sdk/credential-provider-http": "3.931.0",
        "@aws-sdk/credential-provider-ini": "3.931.0",
        "@aws-sdk/credential-provider-process": "3.931.0",
        "@aws-sdk/credential-provider-sso": "3.931.0",
        "@aws-sdk/credential-provider-web-identity": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/credential-provider-imds": "^4.2.5",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-process": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-process/-/credential-provider-process-3.931.0.tgz",
      "integrity": "sha512-8Mu9r+5BUKqmKSI/WYHl5o4GeoonEb51RmoLEqG6431Uz4Y8C6gzAT69yjOJ+MwoWQ2Os37OZLOTv7SgxyOgrQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-sso": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-sso/-/credential-provider-sso-3.931.0.tgz",
      "integrity": "sha512-FP31lfMgNMDG4ZDX4NUZ+uoHWn76etcG8UWEgzZb4YOPV4M8a7gwU95iD+RBaK4lV3KvwH2tu68Hmne1qQpFqQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/client-sso": "3.931.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/token-providers": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/credential-provider-web-identity": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/credential-provider-web-identity/-/credential-provider-web-identity-3.931.0.tgz",
      "integrity": "sha512-hfX0Buw2+ie0FBiSFMmnXfugQc9fO0KvEojnNnzhk4utlWjZobMcUprOQ/VKUueg0Kga1b1xu8gEP6g1aEh3zw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/nested-clients": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/endpoint-cache": {
      "version": "3.893.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/endpoint-cache/-/endpoint-cache-3.893.0.tgz",
      "integrity": "sha512-KSwTfyLZyNLszz5f/yoLC+LC+CRKpeJii/+zVAy7JUOQsKhSykiRUPYUx7o2Sdc4oJfqqUl26A/jSttKYnYtAA==",
      "license": "Apache-2.0",
      "dependencies": {
        "mnemonist": "0.38.3",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-bucket-endpoint": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-bucket-endpoint/-/middleware-bucket-endpoint-3.930.0.tgz",
      "integrity": "sha512-cnCLWeKPYgvV4yRYPFH6pWMdUByvu2cy2BAlfsPpvnm4RaVioztyvxmQj5PmVN5fvWs5w/2d6U7le8X9iye2sA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-arn-parser": "3.893.0",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-config-provider": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-endpoint-discovery": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-endpoint-discovery/-/middleware-endpoint-discovery-3.930.0.tgz",
      "integrity": "sha512-OnYrqT4lUA6X9PjB7l89dlIt/iYglrd3J9iEL/L/S41W/OD7wC70ZLGqMxKn6kUTK7ORr6BGcFyT349KgBRISw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/endpoint-cache": "3.893.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-expect-continue": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-expect-continue/-/middleware-expect-continue-3.930.0.tgz",
      "integrity": "sha512-5HEQ+JU4DrLNWeY27wKg/jeVa8Suy62ivJHOSUf6e6hZdVIMx0h/kXS1fHEQNNiLu2IzSEP/bFXsKBaW7x7s0g==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-flexible-checksums": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-flexible-checksums/-/middleware-flexible-checksums-3.931.0.tgz",
      "integrity": "sha512-eYWwUKeEommCrrm0Ro6fGDwVO0x2bL3niOmSnHIlIdpu7ruzAGaphj+2MekCxaSPORzkZ3yheHUzV45D8Qj63A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/crc32": "5.2.0",
        "@aws-crypto/crc32c": "5.2.0",
        "@aws-crypto/util": "5.2.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/is-array-buffer": "^4.2.0",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-stream": "^4.5.6",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-host-header": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-host-header/-/middleware-host-header-3.930.0.tgz",
      "integrity": "sha512-x30jmm3TLu7b/b+67nMyoV0NlbnCVT5DI57yDrhXAPCtdgM1KtdLWt45UcHpKOm1JsaIkmYRh2WYu7Anx4MG0g==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-location-constraint": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-location-constraint/-/middleware-location-constraint-3.930.0.tgz",
      "integrity": "sha512-QIGNsNUdRICog+LYqmtJ03PLze6h2KCORXUs5td/hAEjVP5DMmubhtrGg1KhWyctACluUH/E/yrD14p4pRXxwA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-logger": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-logger/-/middleware-logger-3.930.0.tgz",
      "integrity": "sha512-vh4JBWzMCBW8wREvAwoSqB2geKsZwSHTa0nSt0OMOLp2PdTYIZDi0ZiVMmpfnjcx9XbS6aSluLv9sKx4RrG46A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-recursion-detection": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-recursion-detection/-/middleware-recursion-detection-3.930.0.tgz",
      "integrity": "sha512-gv0sekNpa2MBsIhm2cjP3nmYSfI4nscx/+K9u9ybrWZBWUIC4kL2sV++bFjjUz4QxUIlvKByow3/a9ARQyCu7Q==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@aws/lambda-invoke-store": "^0.1.1",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-sdk-s3": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-sdk-s3/-/middleware-sdk-s3-3.931.0.tgz",
      "integrity": "sha512-uWF78ht8Wgxljn6y0cEcIWfbeTVnJ0cE1Gha9ScCqscmuBCpHuFMSd/p53w3whoDhpQL3ln9mOyY3tfST/NUQA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-arn-parser": "3.893.0",
        "@smithy/core": "^3.18.2",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/signature-v4": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-config-provider": "^4.2.0",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-stream": "^4.5.6",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-sdk-sqs": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-sdk-sqs/-/middleware-sdk-sqs-3.930.0.tgz",
      "integrity": "sha512-Sk/VgUC9LTLloWUJHSLw9EkGukQHb/54rF1p9qJgJByQJLPmBd4oKiEGmKImVyUo/RN9BUPgNlNLWPUON6ySmQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-hex-encoding": "^4.2.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-ssec": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-ssec/-/middleware-ssec-3.930.0.tgz",
      "integrity": "sha512-N2/SvodmaDS6h7CWfuapt3oJyn1T2CBz0CsDIiTDv9cSagXAVFjPdm2g4PFJqrNBeqdDIoYBnnta336HmamWHg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/middleware-user-agent": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/middleware-user-agent/-/middleware-user-agent-3.931.0.tgz",
      "integrity": "sha512-Ftd+f3+y5KNYKzLXaGknwJ9hCkFWshi5C9TLLsz+fEohWc1FvIKU7MlXTeFms2eN76TTVHuG8N2otaujl6CuHg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-endpoints": "3.930.0",
        "@smithy/core": "^3.18.2",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/nested-clients": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/nested-clients/-/nested-clients-3.931.0.tgz",
      "integrity": "sha512-6/dXrX2nWgiWdHxooEtmKpOErms4+79AQawEvhhxpLPpa+tixl4i/MSFgHk9sjkGv5a1/P3DbnedpZWl+2wMOg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/sha256-browser": "5.2.0",
        "@aws-crypto/sha256-js": "5.2.0",
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/middleware-host-header": "3.930.0",
        "@aws-sdk/middleware-logger": "3.930.0",
        "@aws-sdk/middleware-recursion-detection": "3.930.0",
        "@aws-sdk/middleware-user-agent": "3.931.0",
        "@aws-sdk/region-config-resolver": "3.930.0",
        "@aws-sdk/types": "3.930.0",
        "@aws-sdk/util-endpoints": "3.930.0",
        "@aws-sdk/util-user-agent-browser": "3.930.0",
        "@aws-sdk/util-user-agent-node": "3.931.0",
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/core": "^3.18.2",
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/hash-node": "^4.2.5",
        "@smithy/invalid-dependency": "^4.2.5",
        "@smithy/middleware-content-length": "^4.2.5",
        "@smithy/middleware-endpoint": "^4.3.9",
        "@smithy/middleware-retry": "^4.4.9",
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/middleware-stack": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/smithy-client": "^4.9.5",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-body-length-browser": "^4.2.0",
        "@smithy/util-body-length-node": "^4.2.1",
        "@smithy/util-defaults-mode-browser": "^4.3.8",
        "@smithy/util-defaults-mode-node": "^4.2.11",
        "@smithy/util-endpoints": "^3.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-retry": "^4.2.5",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/region-config-resolver": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/region-config-resolver/-/region-config-resolver-3.930.0.tgz",
      "integrity": "sha512-KL2JZqH6aYeQssu1g1KuWsReupdfOoxD6f1as2VC+rdwYFUu4LfzMsFfXnBvvQWWqQ7rZHWOw1T+o5gJmg7Dzw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/signature-v4-multi-region": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/signature-v4-multi-region/-/signature-v4-multi-region-3.931.0.tgz",
      "integrity": "sha512-EGYYDSSk7k1xbSHtb8MfEMILf5achdNnnsYKgFk0+Oul3tPQ4xUmOt5qRP6sOO3/LQHF37gBYHUF9OSA/+uVCw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/middleware-sdk-s3": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/signature-v4": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/token-providers": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/token-providers/-/token-providers-3.931.0.tgz",
      "integrity": "sha512-dr+02X9oxqmXG0856odFJ7wAXy12pr/tq2Zg+IS0TDThFvgtvx4yChkpqmc89wGoW+Aly47JPfPUXh0IMpGzIg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/core": "3.931.0",
        "@aws-sdk/nested-clients": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/types": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/types/-/types-3.930.0.tgz",
      "integrity": "sha512-we/vaAgwlEFW7IeftmCLlLMw+6hFs3DzZPJw7lVHbj/5HJ0bz9gndxEsS2lQoeJ1zhiiLqAqvXxmM43s0MBg0A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/util-arn-parser": {
      "version": "3.893.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/util-arn-parser/-/util-arn-parser-3.893.0.tgz",
      "integrity": "sha512-u8H4f2Zsi19DGnwj5FSZzDMhytYF/bCh37vAtBsn3cNDL3YG578X5oc+wSX54pM3tOxS+NY7tvOAo52SW7koUA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/util-endpoints": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/util-endpoints/-/util-endpoints-3.930.0.tgz",
      "integrity": "sha512-M2oEKBzzNAYr136RRc6uqw3aWlwCxqTP1Lawps9E1d2abRPvl1p1ztQmmXp1Ak4rv8eByIZ+yQyKQ3zPdRG5dw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-endpoints": "^3.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/util-locate-window": {
      "version": "3.893.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/util-locate-window/-/util-locate-window-3.893.0.tgz",
      "integrity": "sha512-T89pFfgat6c8nMmpI8eKjBcDcgJq36+m9oiXbcUzeU55MP9ZuGgBomGjGnHaEyF36jenW9gmg3NfZDm0AO2XPg==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws-sdk/util-user-agent-browser": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/util-user-agent-browser/-/util-user-agent-browser-3.930.0.tgz",
      "integrity": "sha512-q6lCRm6UAe+e1LguM5E4EqM9brQlDem4XDcQ87NzEvlTW6GzmNCO0w1jS0XgCFXQHjDxjdlNFX+5sRbHijwklg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/types": "3.930.0",
        "@smithy/types": "^4.9.0",
        "bowser": "^2.11.0",
        "tslib": "^2.6.2"
      }
    },
    "node_modules/@aws-sdk/util-user-agent-node": {
      "version": "3.931.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/util-user-agent-node/-/util-user-agent-node-3.931.0.tgz",
      "integrity": "sha512-j5if01rt7JCGYDVXck39V7IUyKAN73vKUPzmu+jp1apU3Q0lLSTZA/HCfL2HkMUKVLE67ibjKb+NCoEg0QhujA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-sdk/middleware-user-agent": "3.931.0",
        "@aws-sdk/types": "3.930.0",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      },
      "peerDependencies": {
        "aws-crt": ">=1.0.0"
      },
      "peerDependenciesMeta": {
        "aws-crt": {
          "optional": true
        }
      }
    },
    "node_modules/@aws-sdk/xml-builder": {
      "version": "3.930.0",
      "resolved": "https://registry.npmjs.org/@aws-sdk/xml-builder/-/xml-builder-3.930.0.tgz",
      "integrity": "sha512-YIfkD17GocxdmlUVc3ia52QhcWuRIUJonbF8A2CYfcWNV3HzvAqpcPeC0bYUhkK+8e8YO1ARnLKZQE0TlwzorA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "fast-xml-parser": "5.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@aws/lambda-invoke-store": {
      "version": "0.1.1",
      "resolved": "https://registry.npmjs.org/@aws/lambda-invoke-store/-/lambda-invoke-store-0.1.1.tgz",
      "integrity": "sha512-RcLam17LdlbSOSp9VxmUu1eI6Mwxp+OwhD2QhiSNmNCzoDb0EeUXTD2n/WbcnrAYMGlmf05th6QYq23VqvJqpA==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/abort-controller": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/abort-controller/-/abort-controller-4.2.5.tgz",
      "integrity": "sha512-j7HwVkBw68YW8UmFRcjZOmssE77Rvk0GWAIN1oFBhsaovQmZWYCIcGa9/pwRB0ExI8Sk9MWNALTjftjHZea7VA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/chunked-blob-reader": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/chunked-blob-reader/-/chunked-blob-reader-5.2.0.tgz",
      "integrity": "sha512-WmU0TnhEAJLWvfSeMxBNe5xtbselEO8+4wG0NtZeL8oR21WgH1xiO37El+/Y+H/Ie4SCwBy3MxYWmOYaGgZueA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/chunked-blob-reader-native": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@smithy/chunked-blob-reader-native/-/chunked-blob-reader-native-4.2.1.tgz",
      "integrity": "sha512-lX9Ay+6LisTfpLid2zZtIhSEjHMZoAR5hHCR4H7tBz/Zkfr5ea8RcQ7Tk4mi0P76p4cN+Btz16Ffno7YHpKXnQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/util-base64": "^4.3.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/config-resolver": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/@smithy/config-resolver/-/config-resolver-4.4.3.tgz",
      "integrity": "sha512-ezHLe1tKLUxDJo2LHtDuEDyWXolw8WGOR92qb4bQdWq/zKenO5BvctZGrVJBK08zjezSk7bmbKFOXIVyChvDLw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-config-provider": "^4.2.0",
        "@smithy/util-endpoints": "^3.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/core": {
      "version": "3.18.3",
      "resolved": "https://registry.npmjs.org/@smithy/core/-/core-3.18.3.tgz",
      "integrity": "sha512-qqpNskkbHOSfrbFbjhYj5o8VMXO26fvN1K/+HbCzUNlTuxgNcPRouUDNm+7D6CkN244WG7aK533Ne18UtJEgAA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-body-length-browser": "^4.2.0",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-stream": "^4.5.6",
        "@smithy/util-utf8": "^4.2.0",
        "@smithy/uuid": "^1.1.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/credential-provider-imds": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/credential-provider-imds/-/credential-provider-imds-4.2.5.tgz",
      "integrity": "sha512-BZwotjoZWn9+36nimwm/OLIcVe+KYRwzMjfhd4QT7QxPm9WY0HiOV8t/Wlh+HVUif0SBVV7ksq8//hPaBC/okQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/eventstream-codec": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/eventstream-codec/-/eventstream-codec-4.2.5.tgz",
      "integrity": "sha512-Ogt4Zi9hEbIP17oQMd68qYOHUzmH47UkK7q7Gl55iIm9oKt27MUGrC5JfpMroeHjdkOliOA4Qt3NQ1xMq/nrlA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@aws-crypto/crc32": "5.2.0",
        "@smithy/types": "^4.9.0",
        "@smithy/util-hex-encoding": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/eventstream-serde-browser": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/eventstream-serde-browser/-/eventstream-serde-browser-4.2.5.tgz",
      "integrity": "sha512-HohfmCQZjppVnKX2PnXlf47CW3j92Ki6T/vkAT2DhBR47e89pen3s4fIa7otGTtrVxmj7q+IhH0RnC5kpR8wtw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/eventstream-serde-universal": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/eventstream-serde-config-resolver": {
      "version": "4.3.5",
      "resolved": "https://registry.npmjs.org/@smithy/eventstream-serde-config-resolver/-/eventstream-serde-config-resolver-4.3.5.tgz",
      "integrity": "sha512-ibjQjM7wEXtECiT6my1xfiMH9IcEczMOS6xiCQXoUIYSj5b1CpBbJ3VYbdwDy8Vcg5JHN7eFpOCGk8nyZAltNQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/eventstream-serde-node": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/eventstream-serde-node/-/eventstream-serde-node-4.2.5.tgz",
      "integrity": "sha512-+elOuaYx6F2H6x1/5BQP5ugv12nfJl66GhxON8+dWVUEDJ9jah/A0tayVdkLRP0AeSac0inYkDz5qBFKfVp2Gg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/eventstream-serde-universal": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/eventstream-serde-universal": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/eventstream-serde-universal/-/eventstream-serde-universal-4.2.5.tgz",
      "integrity": "sha512-G9WSqbST45bmIFaeNuP/EnC19Rhp54CcVdX9PDL1zyEB514WsDVXhlyihKlGXnRycmHNmVv88Bvvt4EYxWef/Q==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/eventstream-codec": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/fetch-http-handler": {
      "version": "5.3.6",
      "resolved": "https://registry.npmjs.org/@smithy/fetch-http-handler/-/fetch-http-handler-5.3.6.tgz",
      "integrity": "sha512-3+RG3EA6BBJ/ofZUeTFJA7mHfSYrZtQIrDP9dI8Lf7X6Jbos2jptuLrAAteDiFVrmbEmLSuRG/bUKzfAXk7dhg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/querystring-builder": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-base64": "^4.3.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/hash-blob-browser": {
      "version": "4.2.6",
      "resolved": "https://registry.npmjs.org/@smithy/hash-blob-browser/-/hash-blob-browser-4.2.6.tgz",
      "integrity": "sha512-8P//tA8DVPk+3XURk2rwcKgYwFvwGwmJH/wJqQiSKwXZtf/LiZK+hbUZmPj/9KzM+OVSwe4o85KTp5x9DUZTjw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/chunked-blob-reader": "^5.2.0",
        "@smithy/chunked-blob-reader-native": "^4.2.1",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/hash-node": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/hash-node/-/hash-node-4.2.5.tgz",
      "integrity": "sha512-DpYX914YOfA3UDT9CN1BM787PcHfWRBB43fFGCYrZFUH0Jv+5t8yYl+Pd5PW4+QzoGEDvn5d5QIO4j2HyYZQSA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "@smithy/util-buffer-from": "^4.2.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/hash-stream-node": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/hash-stream-node/-/hash-stream-node-4.2.5.tgz",
      "integrity": "sha512-6+do24VnEyvWcGdHXomlpd0m8bfZePpUKBy7m311n+JuRwug8J4dCanJdTymx//8mi0nlkflZBvJe+dEO/O12Q==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/invalid-dependency": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/invalid-dependency/-/invalid-dependency-4.2.5.tgz",
      "integrity": "sha512-2L2erASEro1WC5nV+plwIMxrTXpvpfzl4e+Nre6vBVRR2HKeGGcvpJyyL3/PpiSg+cJG2KpTmZmq934Olb6e5A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/is-array-buffer": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/is-array-buffer/-/is-array-buffer-4.2.0.tgz",
      "integrity": "sha512-DZZZBvC7sjcYh4MazJSGiWMI2L7E0oCiRHREDzIxi/M2LY79/21iXt6aPLHge82wi5LsuRF5A06Ds3+0mlh6CQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/md5-js": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/md5-js/-/md5-js-4.2.5.tgz",
      "integrity": "sha512-Bt6jpSTMWfjCtC0s79gZ/WZ1w90grfmopVOWqkI2ovhjpD5Q2XRXuecIPB9689L2+cCySMbaXDhBPU56FKNDNg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/middleware-content-length": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/middleware-content-length/-/middleware-content-length-4.2.5.tgz",
      "integrity": "sha512-Y/RabVa5vbl5FuHYV2vUCwvh/dqzrEY/K2yWPSqvhFUwIY0atLqO4TienjBXakoy4zrKAMCZwg+YEqmH7jaN7A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/middleware-endpoint": {
      "version": "4.3.10",
      "resolved": "https://registry.npmjs.org/@smithy/middleware-endpoint/-/middleware-endpoint-4.3.10.tgz",
      "integrity": "sha512-SoAag3QnWBFoXjwa1jenEThkzJYClidZUyqsLKwWZ8kOlZBwehrLBp4ygVDjNEM2a2AamCQ2FBA/HuzKJ/LiTA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/core": "^3.18.3",
        "@smithy/middleware-serde": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "@smithy/url-parser": "^4.2.5",
        "@smithy/util-middleware": "^4.2.5",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/middleware-retry": {
      "version": "4.4.10",
      "resolved": "https://registry.npmjs.org/@smithy/middleware-retry/-/middleware-retry-4.4.10.tgz",
      "integrity": "sha512-6fOwX34gXxcqKa3bsG0mR0arc2Cw4ddOS6tp3RgUD2yoTrDTbQ2aVADnDjhUuxaiDZN2iilxndgGDhnpL/XvJA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/service-error-classification": "^4.2.5",
        "@smithy/smithy-client": "^4.9.6",
        "@smithy/types": "^4.9.0",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-retry": "^4.2.5",
        "@smithy/uuid": "^1.1.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/middleware-serde": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/middleware-serde/-/middleware-serde-4.2.5.tgz",
      "integrity": "sha512-La1ldWTJTZ5NqQyPqnCNeH9B+zjFhrNoQIL1jTh4zuqXRlmXhxYHhMtI1/92OlnoAtp6JoN7kzuwhWoXrBwPqg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/middleware-stack": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/middleware-stack/-/middleware-stack-4.2.5.tgz",
      "integrity": "sha512-bYrutc+neOyWxtZdbB2USbQttZN0mXaOyYLIsaTbJhFsfpXyGWUxJpEuO1rJ8IIJm2qH4+xJT0mxUSsEDTYwdQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/node-config-provider": {
      "version": "4.3.5",
      "resolved": "https://registry.npmjs.org/@smithy/node-config-provider/-/node-config-provider-4.3.5.tgz",
      "integrity": "sha512-UTurh1C4qkVCtqggI36DGbLB2Kv8UlcFdMXDcWMbqVY2uRg0XmT9Pb4Vj6oSQ34eizO1fvR0RnFV4Axw4IrrAg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/property-provider": "^4.2.5",
        "@smithy/shared-ini-file-loader": "^4.4.0",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/node-http-handler": {
      "version": "4.4.5",
      "resolved": "https://registry.npmjs.org/@smithy/node-http-handler/-/node-http-handler-4.4.5.tgz",
      "integrity": "sha512-CMnzM9R2WqlqXQGtIlsHMEZfXKJVTIrqCNoSd/QpAyp+Dw0a1Vps13l6ma1fH8g7zSPNsA59B/kWgeylFuA/lw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/abort-controller": "^4.2.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/querystring-builder": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/property-provider": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/property-provider/-/property-provider-4.2.5.tgz",
      "integrity": "sha512-8iLN1XSE1rl4MuxvQ+5OSk/Zb5El7NJZ1td6Tn+8dQQHIjp59Lwl6bd0+nzw6SKm2wSSriH2v/I9LPzUic7EOg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/protocol-http": {
      "version": "5.3.5",
      "resolved": "https://registry.npmjs.org/@smithy/protocol-http/-/protocol-http-5.3.5.tgz",
      "integrity": "sha512-RlaL+sA0LNMp03bf7XPbFmT5gN+w3besXSWMkA8rcmxLSVfiEXElQi4O2IWwPfxzcHkxqrwBFMbngB8yx/RvaQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/querystring-builder": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/querystring-builder/-/querystring-builder-4.2.5.tgz",
      "integrity": "sha512-y98otMI1saoajeik2kLfGyRp11e5U/iJYH/wLCh3aTV/XutbGT9nziKGkgCaMD1ghK7p6htHMm6b6scl9JRUWg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "@smithy/util-uri-escape": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/querystring-parser": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/querystring-parser/-/querystring-parser-4.2.5.tgz",
      "integrity": "sha512-031WCTdPYgiQRYNPXznHXof2YM0GwL6SeaSyTH/P72M1Vz73TvCNH2Nq8Iu2IEPq9QP2yx0/nrw5YmSeAi/AjQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/service-error-classification": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/service-error-classification/-/service-error-classification-4.2.5.tgz",
      "integrity": "sha512-8fEvK+WPE3wUAcDvqDQG1Vk3ANLR8Px979te96m84CbKAjBVf25rPYSzb4xU4hlTyho7VhOGnh5i62D/JVF0JQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/shared-ini-file-loader": {
      "version": "4.4.0",
      "resolved": "https://registry.npmjs.org/@smithy/shared-ini-file-loader/-/shared-ini-file-loader-4.4.0.tgz",
      "integrity": "sha512-5WmZ5+kJgJDjwXXIzr1vDTG+RhF9wzSODQBfkrQ2VVkYALKGvZX1lgVSxEkgicSAFnFhPj5rudJV0zoinqS0bA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/signature-v4": {
      "version": "5.3.5",
      "resolved": "https://registry.npmjs.org/@smithy/signature-v4/-/signature-v4-5.3.5.tgz",
      "integrity": "sha512-xSUfMu1FT7ccfSXkoLl/QRQBi2rOvi3tiBZU2Tdy3I6cgvZ6SEi9QNey+lqps/sJRnogIS+lq+B1gxxbra2a/w==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/is-array-buffer": "^4.2.0",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-hex-encoding": "^4.2.0",
        "@smithy/util-middleware": "^4.2.5",
        "@smithy/util-uri-escape": "^4.2.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/smithy-client": {
      "version": "4.9.6",
      "resolved": "https://registry.npmjs.org/@smithy/smithy-client/-/smithy-client-4.9.6.tgz",
      "integrity": "sha512-hGz42hggqReicRRZUvrKDQiAmoJnx1Q+XfAJnYAGu544gOfxQCAC3hGGD7+Px2gEUUxB/kKtQV7LOtBRNyxteQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/core": "^3.18.3",
        "@smithy/middleware-endpoint": "^4.3.10",
        "@smithy/middleware-stack": "^4.2.5",
        "@smithy/protocol-http": "^5.3.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-stream": "^4.5.6",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/types": {
      "version": "4.9.0",
      "resolved": "https://registry.npmjs.org/@smithy/types/-/types-4.9.0.tgz",
      "integrity": "sha512-MvUbdnXDTwykR8cB1WZvNNwqoWVaTRA0RLlLmf/cIFNMM2cKWz01X4Ly6SMC4Kks30r8tT3Cty0jmeWfiuyHTA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/url-parser": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/url-parser/-/url-parser-4.2.5.tgz",
      "integrity": "sha512-VaxMGsilqFnK1CeBX+LXnSuaMx4sTL/6znSZh2829txWieazdVxr54HmiyTsIbpOTLcf5nYpq9lpzmwRdxj6rQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/querystring-parser": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-base64": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-base64/-/util-base64-4.3.0.tgz",
      "integrity": "sha512-GkXZ59JfyxsIwNTWFnjmFEI8kZpRNIBfxKjv09+nkAWPt/4aGaEWMM04m4sxgNVWkbt2MdSvE3KF/PfX4nFedQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/util-buffer-from": "^4.2.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-body-length-browser": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-body-length-browser/-/util-body-length-browser-4.2.0.tgz",
      "integrity": "sha512-Fkoh/I76szMKJnBXWPdFkQJl2r9SjPt3cMzLdOB6eJ4Pnpas8hVoWPYemX/peO0yrrvldgCUVJqOAjUrOLjbxg==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-body-length-node": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/@smithy/util-body-length-node/-/util-body-length-node-4.2.1.tgz",
      "integrity": "sha512-h53dz/pISVrVrfxV1iqXlx5pRg3V2YWFcSQyPyXZRrZoZj4R4DeWRDo1a7dd3CPTcFi3kE+98tuNyD2axyZReA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-buffer-from": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-buffer-from/-/util-buffer-from-4.2.0.tgz",
      "integrity": "sha512-kAY9hTKulTNevM2nlRtxAG2FQ3B2OR6QIrPY3zE5LqJy1oxzmgBGsHLWTcNhWXKchgA0WHW+mZkQrng/pgcCew==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/is-array-buffer": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-config-provider": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-config-provider/-/util-config-provider-4.2.0.tgz",
      "integrity": "sha512-YEjpl6XJ36FTKmD+kRJJWYvrHeUvm5ykaUS5xK+6oXffQPHeEM4/nXlZPe+Wu0lsgRUcNZiliYNh/y7q9c2y6Q==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-defaults-mode-browser": {
      "version": "4.3.9",
      "resolved": "https://registry.npmjs.org/@smithy/util-defaults-mode-browser/-/util-defaults-mode-browser-4.3.9.tgz",
      "integrity": "sha512-Bh5bU40BgdkXE2BcaNazhNtEXi1TC0S+1d84vUwv5srWfvbeRNUKFzwKQgC6p6MXPvEgw+9+HdX3pOwT6ut5aw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/property-provider": "^4.2.5",
        "@smithy/smithy-client": "^4.9.6",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-defaults-mode-node": {
      "version": "4.2.12",
      "resolved": "https://registry.npmjs.org/@smithy/util-defaults-mode-node/-/util-defaults-mode-node-4.2.12.tgz",
      "integrity": "sha512-EHZwe1E9Q7umImIyCKQg/Cm+S+7rjXxCRvfGmKifqwYvn7M8M4ZcowwUOQzvuuxUUmdzCkqL0Eq0z1m74Pq6pw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/config-resolver": "^4.4.3",
        "@smithy/credential-provider-imds": "^4.2.5",
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/property-provider": "^4.2.5",
        "@smithy/smithy-client": "^4.9.6",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-endpoints": {
      "version": "3.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/util-endpoints/-/util-endpoints-3.2.5.tgz",
      "integrity": "sha512-3O63AAWu2cSNQZp+ayl9I3NapW1p1rR5mlVHcF6hAB1dPZUQFfRPYtplWX/3xrzWthPGj5FqB12taJJCfH6s8A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/node-config-provider": "^4.3.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-hex-encoding": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-hex-encoding/-/util-hex-encoding-4.2.0.tgz",
      "integrity": "sha512-CCQBwJIvXMLKxVbO88IukazJD9a4kQ9ZN7/UMGBjBcJYvatpWk+9g870El4cB8/EJxfe+k+y0GmR9CAzkF+Nbw==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-middleware": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/util-middleware/-/util-middleware-4.2.5.tgz",
      "integrity": "sha512-6Y3+rvBF7+PZOc40ybeZMcGln6xJGVeY60E7jy9Mv5iKpMJpHgRE6dKy9ScsVxvfAYuEX4Q9a65DQX90KaQ3bA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-retry": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/util-retry/-/util-retry-4.2.5.tgz",
      "integrity": "sha512-GBj3+EZBbN4NAqJ/7pAhsXdfzdlznOh8PydUijy6FpNIMnHPSMO2/rP4HKu+UFeikJxShERk528oy7GT79YiJg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/service-error-classification": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-stream": {
      "version": "4.5.6",
      "resolved": "https://registry.npmjs.org/@smithy/util-stream/-/util-stream-4.5.6.tgz",
      "integrity": "sha512-qWw/UM59TiaFrPevefOZ8CNBKbYEP6wBAIlLqxn3VAIo9rgnTNc4ASbVrqDmhuwI87usnjhdQrxodzAGFFzbRQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/fetch-http-handler": "^5.3.6",
        "@smithy/node-http-handler": "^4.4.5",
        "@smithy/types": "^4.9.0",
        "@smithy/util-base64": "^4.3.0",
        "@smithy/util-buffer-from": "^4.2.0",
        "@smithy/util-hex-encoding": "^4.2.0",
        "@smithy/util-utf8": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-uri-escape": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-uri-escape/-/util-uri-escape-4.2.0.tgz",
      "integrity": "sha512-igZpCKV9+E/Mzrpq6YacdTQ0qTiLm85gD6N/IrmyDvQFA4UnU3d5g3m8tMT/6zG/vVkWSU+VxeUyGonL62DuxA==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-utf8": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/@smithy/util-utf8/-/util-utf8-4.2.0.tgz",
      "integrity": "sha512-zBPfuzoI8xyBtR2P6WQj63Rz8i3AmfAaJLuNG8dWsfvPe8lO4aCPYLn879mEgHndZH1zQ2oXmG8O1GGzzaoZiw==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/util-buffer-from": "^4.2.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/util-waiter": {
      "version": "4.2.5",
      "resolved": "https://registry.npmjs.org/@smithy/util-waiter/-/util-waiter-4.2.5.tgz",
      "integrity": "sha512-Dbun99A3InifQdIrsXZ+QLcC0PGBPAdrl4cj1mTgJvyc9N2zf7QSxg8TBkzsCmGJdE3TLbO9ycwpY0EkWahQ/g==",
      "license": "Apache-2.0",
      "dependencies": {
        "@smithy/abort-controller": "^4.2.5",
        "@smithy/types": "^4.9.0",
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/@smithy/uuid": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@smithy/uuid/-/uuid-1.1.0.tgz",
      "integrity": "sha512-4aUIteuyxtBUhVdiQqcDhKFitwfd9hqoSDYY2KRXiWtgoWJ9Bmise+KfEPDiVHWeJepvF8xJO9/9+WDIciMFFw==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.6.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/bowser": {
      "version": "2.12.1",
      "resolved": "https://registry.npmjs.org/bowser/-/bowser-2.12.1.tgz",
      "integrity": "sha512-z4rE2Gxh7tvshQ4hluIT7XcFrgLIQaw9X3A+kTTRdovCz5PMukm/0QC/BKSYPj3omF5Qfypn9O/c5kgpmvYUCw==",
      "license": "MIT"
    },
    "node_modules/fast-xml-parser": {
      "version": "5.2.5",
      "resolved": "https://registry.npmjs.org/fast-xml-parser/-/fast-xml-parser-5.2.5.tgz",
      "integrity": "sha512-pfX9uG9Ki0yekDHx2SiuRIyFdyAr1kMIMitPvb0YBo8SUfKvia7w7FIyd/l6av85pFYRhZscS75MwMnbvY+hcQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/NaturalIntelligence"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "strnum": "^2.1.0"
      },
      "bin": {
        "fxparser": "src/cli/cli.js"
      }
    },
    "node_modules/mnemonist": {
      "version": "0.38.3",
      "resolved": "https://registry.npmjs.org/mnemonist/-/mnemonist-0.38.3.tgz",
      "integrity": "sha512-2K9QYubXx/NAjv4VLq1d1Ly8pWNC5L3BrixtdkyTegXWJIqY+zLNDhhX/A+ZwWt70tB1S8H4BE8FLYEFyNoOBw==",
      "license": "MIT",
      "dependencies": {
        "obliterator": "^1.6.1"
      }
    },
    "node_modules/obliterator": {
      "version": "1.6.1",
      "resolved": "https://registry.npmjs.org/obliterator/-/obliterator-1.6.1.tgz",
      "integrity": "sha512-9WXswnqINnnhOG/5SLimUlzuU1hFJUc8zkwyD59Sd+dPOMf05PmnYG/d6Q7HZ+KmgkZJa1PxRso6QdM3sTNHig==",
      "license": "MIT"
    },
    "node_modules/strnum": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/strnum/-/strnum-2.1.1.tgz",
      "integrity": "sha512-7ZvoFTiCnGxBtDqJ//Cu6fWtZtc7Y3x+QOirG15wztbdngGSkht27o2pyGWrVy0b4WAy3jbKmnoK6g5VlVNUUw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/NaturalIntelligence"
        }
      ],
      "license": "MIT"
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    }
  }
}

```

## ./lib/lambda/order-processing/package.json

```json
{
  "name": "order-processing-lambda",
  "version": "1.0.0",
  "description": "Order processing Lambda function for trading platform",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.450.0",
    "@aws-sdk/client-sqs": "^3.450.0",
    "@aws-sdk/client-s3": "^3.450.0"
  }
}

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './config/environment-config';

export interface TapStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly tradeDataBucket: s3.Bucket;
  public readonly ordersTable: dynamodb.Table;
  public readonly orderProcessingQueue: sqs.Queue;
  public readonly orderProcessingFunction: lambda.Function;
  public readonly api: apigateway.RestApi;

  private readonly environmentConfig: EnvironmentConfig;
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    this.environmentConfig = props.environmentConfig;
    this.environmentSuffix = props.environmentSuffix;

    // Create VPC
    this.vpc = this.createVpc();

    // Create S3 bucket
    this.tradeDataBucket = this.createS3Bucket();

    // Create DynamoDB table
    this.ordersTable = this.createDynamoDbTable();

    // Create SQS queues
    this.orderProcessingQueue = this.createSqsQueues();

    // Create Lambda function
    this.orderProcessingFunction = this.createLambdaFunction();

    // Create API Gateway
    this.api = this.createApiGateway();

    // Create monitoring resources
    this.createMonitoring();

    // Export API endpoint
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `trading-api-endpoint-${this.environmentSuffix}`,
    });
  }

  private getResourceName(resourceName: string): string {
    return `${resourceName}-${this.environmentSuffix}`;
  }

  private exportToParameterStore(name: string, value: string): void {
    new ssm.StringParameter(this, `Param${name.replace(/-/g, '')}`, {
      parameterName: `/${this.environmentSuffix}/${name}`,
      stringValue: value,
      description: `${name} for ${this.environmentSuffix} environment`,
    });
  }

  private createVpc(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'TradingVpc', {
      vpcName: this.getResourceName('trading-vpc'),
      ipAddresses: ec2.IpAddresses.cidr(this.environmentConfig.vpcConfig.cidr),
      maxAzs: this.environmentConfig.vpcConfig.maxAzs,
      natGateways: this.environmentConfig.vpcConfig.natGateways,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Export VPC ID
    this.exportToParameterStore('vpc-id', vpc.vpcId);

    // Export subnet IDs
    vpc.privateSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(
        `private-subnet-${index + 1}-id`,
        subnet.subnetId
      );
    });

    vpc.publicSubnets.forEach((subnet, index) => {
      this.exportToParameterStore(
        `public-subnet-${index + 1}-id`,
        subnet.subnetId
      );
    });

    return vpc;
  }

  private createS3Bucket(): s3.Bucket {
    const bucket = new s3.Bucket(this, 'TradeDataBucket', {
      bucketName: this.getResourceName('trade-data'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: this.environmentConfig.s3Config.versioning,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      lifecycleRules: this.getS3LifecycleRules(),
    });

    // Export bucket details
    this.exportToParameterStore('trade-data-bucket-name', bucket.bucketName);
    this.exportToParameterStore('trade-data-bucket-arn', bucket.bucketArn);

    return bucket;
  }

  private getS3LifecycleRules(): s3.LifecycleRule[] {
    const rules: s3.LifecycleRule[] = [];

    // Add transition to Intelligent-Tiering after 30 days
    rules.push({
      id: 'IntelligentTiering',
      enabled: true,
      transitions: [
        {
          storageClass: s3.StorageClass.INTELLIGENT_TIERING,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });

    // Add environment-specific expiration policy
    if (this.environmentConfig.s3Config.lifecycleDays !== undefined) {
      rules.push({
        id: 'Expiration',
        enabled: true,
        expiration: cdk.Duration.days(
          this.environmentConfig.s3Config.lifecycleDays
        ),
      });
    }

    // Clean up incomplete multipart uploads
    rules.push({
      id: 'CleanupMultipartUploads',
      enabled: true,
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
    });

    return rules;
  }

  private createDynamoDbTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'OrdersTable', {
      tableName: this.getResourceName('orders'),
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery:
        this.environmentConfig.dynamoConfig.pointInTimeRecovery,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for status queries
    table.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Export table details
    this.exportToParameterStore('orders-table-name', table.tableName);
    this.exportToParameterStore('orders-table-arn', table.tableArn);

    return table;
  }

  private createSqsQueues(): sqs.Queue {
    // Create DLQ
    const dlq = new sqs.Queue(this, 'OrderProcessingDlq', {
      queueName: this.getResourceName('order-processing-dlq'),
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    this.exportToParameterStore('order-processing-dlq-url', dlq.queueUrl);
    this.exportToParameterStore('order-processing-dlq-arn', dlq.queueArn);

    // Create main queue
    const queue = new sqs.Queue(this, 'OrderProcessingQueue', {
      queueName: this.getResourceName('order-processing'),
      visibilityTimeout: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.visibilityTimeoutSeconds
      ),
      retentionPeriod: cdk.Duration.seconds(
        this.environmentConfig.sqsConfig.messageRetentionSeconds
      ),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: this.environmentConfig.sqsConfig.maxReceiveCount,
      },
    });

    this.exportToParameterStore('order-processing-queue-url', queue.queueUrl);
    this.exportToParameterStore('order-processing-queue-arn', queue.queueArn);

    return queue;
  }

  private createLambdaFunction(): lambda.Function {
    // Create execution role
    const executionRole = new iam.Role(this, 'OrderProcessingRole', {
      roleName: this.getResourceName('order-processing-role'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Add least-privilege permissions
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [this.ordersTable.tableArn],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
        resources: [this.orderProcessingQueue.queueArn],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`${this.tradeDataBucket.bucketArn}/*`],
      })
    );

    // Create Lambda function (without VPC due to EIP limit)
    const lambdaFunction = new lambda.Function(
      this,
      'OrderProcessingFunction',
      {
        functionName: this.getResourceName('order-processing'),
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/order-processing'),
        memorySize: this.environmentConfig.lambdaConfig.memorySize,
        timeout: cdk.Duration.seconds(
          this.environmentConfig.lambdaConfig.timeout
        ),
        reservedConcurrentExecutions:
          this.environmentConfig.lambdaConfig.reservedConcurrentExecutions,
        role: executionRole,
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          DYNAMODB_TABLE: this.ordersTable.tableName,
          SQS_QUEUE: this.orderProcessingQueue.queueName,
          S3_BUCKET: this.tradeDataBucket.bucketName,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Export Lambda function ARN
    this.exportToParameterStore(
      'order-processing-function-arn',
      lambdaFunction.functionArn
    );

    return lambdaFunction;
  }

  private createApiGateway(): apigateway.RestApi {
    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${this.getResourceName('trading-api')}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API
    const api = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: this.getResourceName('trading-api'),
      description: `Trading Platform API for ${this.environmentSuffix} environment`,
      deployOptions: {
        stageName: this.environmentSuffix,
        throttlingRateLimit:
          this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        throttlingBurstLimit:
          this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
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
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create Lambda integration
    const integration = new apigateway.LambdaIntegration(
      this.orderProcessingFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        proxy: true,
      }
    );

    // Create /orders resource
    const orders = api.root.addResource('orders');

    // POST /orders endpoint
    orders.addMethod('POST', integration, {
      apiKeyRequired: false,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // GET /orders endpoint
    orders.addMethod('GET', integration, {
      apiKeyRequired: false,
    });

    // Create usage plan
    const plan = api.addUsagePlan('UsagePlan', {
      name: this.getResourceName('usage-plan'),
      throttle: {
        rateLimit: this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        burstLimit: this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
      },
      quota: {
        limit:
          this.environmentConfig.apiGatewayConfig.throttleRateLimit * 86400,
        period: apigateway.Period.DAY,
      },
    });

    plan.addApiStage({
      stage: api.deploymentStage,
    });

    // Export API details
    this.exportToParameterStore('api-endpoint', api.url);
    this.exportToParameterStore('api-id', api.restApiId);

    return api;
  }

  private createMonitoring(): void {
    // Create SNS topic for drift detection
    const driftTopic = new sns.Topic(this, 'DriftDetectionTopic', {
      topicName: this.getResourceName('drift-detection'),
      displayName: 'CloudFormation Drift Detection Alerts',
    });

    // Add email subscription
    driftTopic.addSubscription(
      new subscriptions.EmailSubscription(
        `ops-${this.environmentSuffix}@example.com`
      )
    );

    // Create CloudWatch alarm for drift detection
    const driftAlarm = new cloudwatch.Alarm(this, 'DriftDetectionAlarm', {
      alarmName: this.getResourceName('drift-detection-alarm'),
      alarmDescription: 'Triggers when CloudFormation stack drift is detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudFormation',
        metricName: 'StackDriftDetectionStatus',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    driftAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(driftTopic));

    // Create dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      'TradingPlatformDashboard',
      {
        dashboardName: this.getResourceName('trading-platform'),
      }
    );

    // Add widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedReadCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/DynamoDB',
            metricName: 'ConsumedWriteCapacityUnits',
            statistic: 'Sum',
            period: cdk.Duration.minutes(5),
          }),
        ],
      })
    );

    // Export monitoring resources
    this.exportToParameterStore('drift-topic-arn', driftTopic.topicArn);
    this.exportToParameterStore('dashboard-name', dashboard.dashboardName);
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
/**
 * Integration Tests for Trading Platform Infrastructure
 *
 * These tests verify the deployed infrastructure against live AWS resources.
 * Tests use flat-outputs.json to discover resource names dynamically.
 *
 * Prerequisites:
 * - Run ./scripts/generate-flat-outputs.sh before running these tests
 * - AWS credentials must be configured (AWS_PROFILE=turing)
 * - Environment variables: AWS_REGION, ENVIRONMENT_SUFFIX
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetResourcesCommand,
} from '@aws-sdk/client-api-gateway';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';

// Load flat-outputs.json
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

function loadOutputs() {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(
      `flat-outputs.json not found at ${outputsPath}. Run ./scripts/generate-flat-outputs.sh first.`
    );
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get credentials explicitly to avoid dynamic import issues
const getCredentials = () => {
  try {
    return fromEnv();
  } catch (e) {
    return undefined;
  }
};

describe('Trading Platform Infrastructure - Integration Tests', () => {
  let outputs: any;
  let region: string;
  let environmentSuffix: string;

  beforeAll(() => {
    outputs = loadOutputs();
    region = outputs.region || process.env.AWS_REGION || 'us-east-1';
    environmentSuffix =
      outputs.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    console.log(`\n🧪 Running integration tests for environment: ${environmentSuffix}`);
    console.log(`📍 Region: ${region}\n`);
  });

  describe('VPC Resources', () => {
    test('VPC ID should be exported', () => {
      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);
    });

    test('should export subnet IDs', () => {
      const publicSubnet1 = outputs['public-subnet-1-id'];
      const publicSubnet2 = outputs['public-subnet-2-id'];
      const privateSubnet1 = outputs['private-subnet-1-id'];
      const privateSubnet2 = outputs['private-subnet-2-id'];

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();

      expect(publicSubnet1).toMatch(/^subnet-/);
      expect(publicSubnet2).toMatch(/^subnet-/);
      expect(privateSubnet1).toMatch(/^subnet-/);
      expect(privateSubnet2).toMatch(/^subnet-/);
    });
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have encryption enabled', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have lifecycle policies configured', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const hasIntelligentTiering = response.Rules!.some((rule) =>
        rule.Transitions?.some((t) => t.StorageClass === 'INTELLIGENT_TIERING')
      );
      expect(hasIntelligentTiering).toBe(true);
    });

    test('should support PUT and GET operations', async () => {
      const s3Client = new S3Client({ region });
      const bucketName = outputs['trade-data-bucket-name'];
      const testKey = `integration-test-${Date.now()}.json`;
      const testData = { message: 'Integration test', timestamp: Date.now() };

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: JSON.stringify(testData),
        ContentType: 'application/json',
      });
      const putResponse = await s3Client.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      expect(getResponse.$metadata.httpStatusCode).toBe(200);

      const body = await getResponse.Body!.transformToString();
      const retrievedData = JSON.parse(body);
      expect(retrievedData.message).toBe(testData.message);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('DynamoDB Table', () => {
    test('should exist with correct configuration', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const tableName = outputs['orders-table-name'];
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableName).toBe(tableName);
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct partition and sort keys', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const tableName = outputs['orders-table-name'];
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const keySchema = response.Table!.KeySchema!;
      expect(keySchema).toHaveLength(2);

      const partitionKey = keySchema.find((k) => k.KeyType === 'HASH');
      const sortKey = keySchema.find((k) => k.KeyType === 'RANGE');

      expect(partitionKey!.AttributeName).toBe('orderId');
      expect(sortKey!.AttributeName).toBe('timestamp');
    });

    test('should support CRUD operations', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const tableName = outputs['orders-table-name'];
      const testOrderId = `test-order-${Date.now()}`;

      const testTimestamp = new Date().toISOString();
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          orderId: { S: testOrderId },
          timestamp: { S: testTimestamp },
          status: { S: 'PENDING' },
          amount: { N: '100.50' },
          symbol: { S: 'AAPL' },
        },
      });
      const putResponse = await dynamoClient.send(putCommand);
      expect(putResponse.$metadata.httpStatusCode).toBe(200);

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: testOrderId },
          timestamp: { S: testTimestamp },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.orderId.S).toBe(testOrderId);

      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: testOrderId },
          timestamp: { S: testTimestamp },
        },
      });
      await dynamoClient.send(deleteCommand);
    });
  });

  describe('SQS Queues', () => {
    test('should have main queue with correct configuration', async () => {
      const sqsClient = new SQSClient({ region });
      const queueUrl = outputs['order-processing-queue-url'];
      expect(queueUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.QueueArn).toContain(
        `order-processing-${environmentSuffix}`
      );
      expect(response.Attributes!.SqsManagedSseEnabled).toBe('true');
    });

    test('should have redrive policy configured', async () => {
      const sqsClient = new SQSClient({ region });
      const queueUrl = outputs['order-processing-queue-url'];
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['RedrivePolicy'],
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes?.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toContain('order-processing-dlq');
    });

    test('should support send and receive operations', async () => {
      const sqsClient = new SQSClient({ region });
      const queueUrl = outputs['order-processing-queue-url'];
      const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const testMessage = {
        orderId: uniqueId,
        type: 'integration-test',
        timestamp: Date.now(),
      };

      const sendCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(testMessage),
      });
      const sendResponse = await sqsClient.send(sendCommand);
      expect(sendResponse.MessageId).toBeDefined();

      // Wait a bit for message to be available
      await new Promise(resolve => setTimeout(resolve, 1000));

      const receiveCommand = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 5,
      });
      const receiveResponse = await sqsClient.send(receiveCommand);

      expect(receiveResponse.Messages).toBeDefined();
      expect(receiveResponse.Messages!.length).toBeGreaterThan(0);

      // Find our specific message
      const ourMessage = receiveResponse.Messages!.find(msg => {
        try {
          const body = JSON.parse(msg.Body!);
          return body.orderId === uniqueId;
        } catch {
          return false;
        }
      });

      if (ourMessage) {
        const body = JSON.parse(ourMessage.Body!);
        expect(body.type).toBe('integration-test');
        expect(body.orderId).toBe(uniqueId);

        const deleteCommand = new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: ourMessage.ReceiptHandle!,
        });
        await sqsClient.send(deleteCommand);
      }
    });
  });

  describe('Lambda Function', () => {
    test('should have correct memory and timeout settings', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = `order-processing-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.MemorySize).toBe(512);
      expect(response.Timeout).toBe(30);
    });

    test('should have environment variables configured', async () => {
      const lambdaClient = new LambdaClient({ region });
      const functionName = `order-processing-${environmentSuffix}`;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment!.Variables!.ENVIRONMENT).toBe(environmentSuffix);
      expect(response.Environment!.Variables!.DYNAMODB_TABLE).toBeDefined();
      expect(response.Environment!.Variables!.SQS_QUEUE).toBeDefined();
      expect(response.Environment!.Variables!.S3_BUCKET).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should export API ID and endpoint', () => {
      const apiId = outputs['api-id'];
      const apiEndpoint = outputs['api-endpoint'] || outputs['ApiEndpoint'];

      expect(apiId).toBeDefined();
      expect(apiId).toMatch(/^[a-z0-9]+$/);
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\//);
      expect(apiEndpoint).toContain(apiId);
      expect(apiEndpoint).toContain(environmentSuffix);
    });
  });

  describe('Monitoring Resources', () => {
    test('should export monitoring resource identifiers', () => {
      const dashboardName = outputs['dashboard-name'];
      const driftTopicArn = outputs['drift-topic-arn'];

      expect(dashboardName).toBeDefined();
      expect(dashboardName).toContain('trading-platform');
      expect(dashboardName).toContain(environmentSuffix);

      expect(driftTopicArn).toBeDefined();
      expect(driftTopicArn).toMatch(/^arn:aws:sns:/);
      expect(driftTopicArn).toContain('drift-detection');
      expect(driftTopicArn).toContain(environmentSuffix);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should support complete order processing workflow', async () => {
      const dynamoClient = new DynamoDBClient({ region });
      const sqsClient = new SQSClient({ region });
      const s3Client = new S3Client({ region });

      const orderId = `e2e-test-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const tableName = outputs['orders-table-name'];
      const queueUrl = outputs['order-processing-queue-url'];
      const bucketName = outputs['trade-data-bucket-name'];

      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          orderId: { S: orderId },
          timestamp: { S: timestamp },
          status: { S: 'PENDING' },
          symbol: { S: 'TSLA' },
          quantity: { N: '100' },
          price: { N: '250.75' },
        },
      });
      await dynamoClient.send(putCommand);

      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          orderId,
          action: 'process',
          timestamp,
        }),
      });
      await sqsClient.send(sendMessageCommand);

      const s3Key = `trades/${orderId}.json`;
      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: JSON.stringify({
          orderId,
          timestamp,
          details: 'End-to-end integration test',
        }),
        ContentType: 'application/json',
      });
      await s3Client.send(putObjectCommand);

      const getCommand = new GetItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: orderId },
          timestamp: { S: timestamp },
        },
      });
      const getResponse = await dynamoClient.send(getCommand);
      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item!.orderId.S).toBe(orderId);

      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      const s3Response = await s3Client.send(getObjectCommand);
      const s3Body = await s3Response.Body!.transformToString();
      const s3Data = JSON.parse(s3Body);
      expect(s3Data.orderId).toBe(orderId);

      const deleteItemCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          orderId: { S: orderId },
          timestamp: { S: timestamp },
        },
      });
      await dynamoClient.send(deleteItemCommand);

      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      });
      await s3Client.send(deleteObjectCommand);
    });
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { EnvironmentConfigurations } from '../lib/config/environment-config';
import { TapStack } from '../lib/tap-stack';

describe('Trading Platform Infrastructure - Unit Tests', () => {
  let app: cdk.App;
  const testSuffix = 'test';
  const envConfig = EnvironmentConfigurations.DEV;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Environment Configurations', () => {
    test('should have all three environments defined', () => {
      expect(EnvironmentConfigurations.DEV).toBeDefined();
      expect(EnvironmentConfigurations.STAGING).toBeDefined();
      expect(EnvironmentConfigurations.PROD).toBeDefined();
    });

    test('should return environment by name', () => {
      const devConfig = EnvironmentConfigurations.getByName('dev');
      expect(devConfig.name).toBe('dev');
      expect(devConfig.lambdaConfig.memorySize).toBe(512);
    });

    test('should throw error for unknown environment', () => {
      expect(() => EnvironmentConfigurations.getByName('invalid')).toThrow(
        'Unknown environment: invalid'
      );
    });

    test('should return all environments', () => {
      const all = EnvironmentConfigurations.getAll();
      expect(all).toHaveLength(3);
    });

    test('dev environment should have correct configuration', () => {
      expect(envConfig.name).toBe('dev');
      expect(envConfig.lambdaConfig.memorySize).toBe(512);
      expect(envConfig.apiGatewayConfig.throttleRateLimit).toBe(100);
      expect(envConfig.dynamoConfig.pointInTimeRecovery).toBe(false);
      expect(envConfig.s3Config.lifecycleDays).toBe(30);
      expect(envConfig.vpcConfig.natGateways).toBe(0);
    });

    test('staging environment should have correct configuration', () => {
      const staging = EnvironmentConfigurations.STAGING;
      expect(staging.lambdaConfig.memorySize).toBe(1024);
      expect(staging.apiGatewayConfig.throttleRateLimit).toBe(500);
      expect(staging.s3Config.lifecycleDays).toBe(90);
    });

    test('prod environment should have correct configuration', () => {
      const prod = EnvironmentConfigurations.PROD;
      expect(prod.lambdaConfig.memorySize).toBe(2048);
      expect(prod.apiGatewayConfig.throttleRateLimit).toBe(2000);
      expect(prod.dynamoConfig.pointInTimeRecovery).toBe(true);
      expect(prod.s3Config.lifecycleDays).toBeUndefined();
    });
  });

  describe('TapStack', () => {
    let tapStack: TapStack;

    beforeEach(() => {
      tapStack = new TapStack(app, 'TestTapStack', {
        environmentConfig: envConfig,
        environmentSuffix: testSuffix,
      });
    });

    test('should create stack with correct name', () => {
      expect(tapStack.stackName).toBeDefined();
    });

    describe('VPC Resources', () => {
      test('should create VPC with correct CIDR', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: envConfig.vpcConfig.cidr,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
        });
      });

      test('should create correct number of NAT gateways', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs(
          'AWS::EC2::NatGateway',
          envConfig.vpcConfig.natGateways
        );
      });

      test('should create public and private subnets', () => {
        const template = Template.fromStack(tapStack);
        const resources = template.findResources('AWS::EC2::Subnet');
        expect(Object.keys(resources).length).toBeGreaterThanOrEqual(2);
      });

      test('should export VPC ID to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/vpc-id`,
          Type: 'String',
        });
      });

      test('should export subnet IDs to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: Match.stringLikeRegexp(`/${testSuffix}/(private|public)-subnet-\\d+-id`),
        });
      });
    });

    describe('S3 Resources', () => {
      test('should create S3 bucket with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketName: `trade-data-${testSuffix}`,
        });
      });

      test('should enable encryption', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: Match.arrayWith([
              Match.objectLike({
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              }),
            ]),
          },
        });
      });

      test('should block public access', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        });
      });

      test('should have lifecycle rules with intelligent tiering', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'IntelligentTiering',
                Status: 'Enabled',
                Transitions: Match.arrayWith([
                  Match.objectLike({
                    StorageClass: 'INTELLIGENT_TIERING',
                    TransitionInDays: 30,
                  }),
                ]),
              }),
            ]),
          },
        });
      });

      test('should have lifecycle expiration for dev environment', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'Expiration',
                Status: 'Enabled',
                ExpirationInDays: 30,
              }),
            ]),
          },
        });
      });

      test('should have multipart upload cleanup rule', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::Bucket', {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'CleanupMultipartUploads',
                Status: 'Enabled',
                AbortIncompleteMultipartUpload: {
                  DaysAfterInitiation: 7,
                },
              }),
            ]),
          },
        });
      });

      test('should export S3 bucket details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/trade-data-bucket-name`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/trade-data-bucket-arn`,
        });
      });

      test('should enforce SSL for S3 bucket', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::S3::BucketPolicy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Deny',
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              }),
            ]),
          },
        });
      });
    });

    describe('DynamoDB Resources', () => {
      test('should create DynamoDB table with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          TableName: `orders-${testSuffix}`,
        });
      });

      test('should use PAY_PER_REQUEST billing mode', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          BillingMode: 'PAY_PER_REQUEST',
        });
      });

      test('should have partition and sort keys', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          KeySchema: Match.arrayWith([
            Match.objectLike({ AttributeName: 'orderId', KeyType: 'HASH' }),
            Match.objectLike({ AttributeName: 'timestamp', KeyType: 'RANGE' }),
          ]),
        });
      });

      test('should create Global Secondary Index', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'StatusIndex',
              KeySchema: Match.arrayWith([
                Match.objectLike({
                  AttributeName: 'status',
                  KeyType: 'HASH',
                }),
                Match.objectLike({
                  AttributeName: 'timestamp',
                  KeyType: 'RANGE',
                }),
              ]),
            }),
          ]),
        });
      });

      test('should enable point-in-time recovery for dev', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: envConfig.dynamoConfig.pointInTimeRecovery,
          },
        });
      });

      test('should enable encryption', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          SSESpecification: {
            SSEEnabled: true,
          },
        });
      });

      test('should enable streams', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          },
        });
      });

      test('should export table details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/orders-table-name`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/orders-table-arn`,
        });
      });
    });

    describe('SQS Resources', () => {
      test('should create main queue with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          QueueName: `order-processing-${testSuffix}`,
        });
      });

      test('should create dead letter queue', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          QueueName: `order-processing-dlq-${testSuffix}`,
        });
      });

      test('should configure message retention', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          MessageRetentionPeriod: envConfig.sqsConfig.messageRetentionSeconds,
          VisibilityTimeout: envConfig.sqsConfig.visibilityTimeoutSeconds,
        });
      });

      test('should configure redrive policy', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SQS::Queue', {
          RedrivePolicy: Match.objectLike({
            maxReceiveCount: envConfig.sqsConfig.maxReceiveCount,
          }),
        });
      });

      test('should enable encryption for queues', () => {
        const template = Template.fromStack(tapStack);
        const queues = template.findResources('AWS::SQS::Queue');
        Object.values(queues).forEach((queue: any) => {
          expect(queue.Properties.SqsManagedSseEnabled).toBe(true);
        });
      });

      test('should export queue details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/order-processing-queue-url`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/order-processing-queue-arn`,
        });
      });
    });

    describe('Lambda Resources', () => {
      test('should create Lambda function with correct configuration', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          FunctionName: `order-processing-${testSuffix}`,
          Runtime: 'nodejs18.x',
          Handler: 'index.handler',
          MemorySize: envConfig.lambdaConfig.memorySize,
          Timeout: envConfig.lambdaConfig.timeout,
        });
      });

      test('should configure reserved concurrent executions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          ReservedConcurrentExecutions:
            envConfig.lambdaConfig.reservedConcurrentExecutions,
        });
      });

      test('should create IAM role with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `order-processing-role-${testSuffix}`,
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: 'sts:AssumeRole',
                Principal: { Service: 'lambda.amazonaws.com' },
              }),
            ]),
          }),
        });
      });

      test('should have environment variables', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          Environment: {
            Variables: Match.objectLike({
              ENVIRONMENT: testSuffix,
              DYNAMODB_TABLE: Match.anyValue(),
              SQS_QUEUE: Match.anyValue(),
              S3_BUCKET: Match.anyValue(),
            }),
          },
        });
      });

      test('should enable X-Ray tracing', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          TracingConfig: {
            Mode: 'Active',
          },
        });
      });

      test('should have DynamoDB permissions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:Query',
                ],
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });

      test('should have SQS permissions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });

      test('should have S3 permissions', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::IAM::Policy', {
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Action: ['s3:PutObject', 's3:GetObject'],
                Effect: 'Allow',
              }),
            ]),
          },
        });
      });

      test('should export Lambda ARN to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/order-processing-function-arn`,
        });
      });
    });

    describe('API Gateway Resources', () => {
      test('should create REST API with correct name', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
          Name: `trading-api-${testSuffix}`,
        });
      });

      test('should create deployment with correct stage', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          StageName: testSuffix,
        });
      });

      test('should enable logging', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          MethodSettings: Match.arrayWith([
            Match.objectLike({
              LoggingLevel: 'INFO',
              DataTraceEnabled: true,
              MetricsEnabled: true,
            }),
          ]),
        });
      });

      test('should configure throttling', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          MethodSettings: Match.arrayWith([
            Match.objectLike({
              ThrottlingRateLimit: envConfig.apiGatewayConfig.throttleRateLimit,
              ThrottlingBurstLimit:
                envConfig.apiGatewayConfig.throttleBurstLimit,
            }),
          ]),
        });
      });

      test('should create usage plan', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
          UsagePlanName: `usage-plan-${testSuffix}`,
          Throttle: {
            RateLimit: envConfig.apiGatewayConfig.throttleRateLimit,
            BurstLimit: envConfig.apiGatewayConfig.throttleBurstLimit,
          },
        });
      });

      test('should create /orders resource', () => {
        const template = Template.fromStack(tapStack);
        const resources = template.findResources('AWS::ApiGateway::Resource');
        const ordersResource = Object.values(resources).find(
          (r: any) => r.Properties?.PathPart === 'orders'
        );
        expect(ordersResource).toBeDefined();
      });

      test('should create POST method', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'POST',
          Integration: Match.objectLike({
            Type: 'AWS_PROXY',
          }),
        });
      });

      test('should create GET method', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'GET',
        });
      });

      test('should enable CORS', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::ApiGateway::Method', {
          HttpMethod: 'OPTIONS',
        });
      });

      test('should create CloudWatch log group', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/apigateway/trading-api-${testSuffix}`,
          RetentionInDays: 30,
        });
      });

      test('should export API details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/api-endpoint`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/api-id`,
        });
      });

      test('should create stack output for API endpoint', () => {
        const template = Template.fromStack(tapStack);
        template.hasOutput('ApiEndpoint', {
          Description: 'API Gateway endpoint URL',
          Export: {
            Name: `trading-api-endpoint-${testSuffix}`,
          },
        });
      });
    });

    describe('Monitoring Resources', () => {
      test('should create SNS topic', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SNS::Topic', {
          TopicName: `drift-detection-${testSuffix}`,
          DisplayName: 'CloudFormation Drift Detection Alerts',
        });
      });

      test('should create email subscription', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
          Endpoint: `ops-${testSuffix}@example.com`,
        });
      });

      test('should create CloudWatch alarm', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::CloudWatch::Alarm', {
          AlarmName: `drift-detection-alarm-${testSuffix}`,
          ComparisonOperator: 'GreaterThanOrEqualToThreshold',
          Threshold: 1,
          EvaluationPeriods: 1,
        });
      });

      test('should create CloudWatch dashboard', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
          DashboardName: `trading-platform-${testSuffix}`,
        });
      });

      test('should configure alarm action with SNS', () => {
        const template = Template.fromStack(tapStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        const alarm = Object.values(alarms)[0] as any;
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });

      test('should export monitoring details to SSM', () => {
        const template = Template.fromStack(tapStack);
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/drift-topic-arn`,
        });
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: `/${testSuffix}/dashboard-name`,
        });
      });
    });

    describe('Resource Counts', () => {
      test('should create expected number of SSM parameters', () => {
        const template = Template.fromStack(tapStack);
        // vpc-id, subnet-ids, bucket-name, bucket-arn, table-name, table-arn,
        // 4 queue params, function-arn, api-endpoint, api-id, drift-topic, dashboard
        const params = template.findResources('AWS::SSM::Parameter');
        expect(Object.keys(params).length).toBeGreaterThanOrEqual(13);
      });

      test('should have exactly one VPC', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::EC2::VPC', 1);
      });

      test('should have exactly one DynamoDB table', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::DynamoDB::Table', 1);
      });

      test('should have exactly one S3 bucket', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::S3::Bucket', 1);
      });

      test('should have exactly two SQS queues', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::SQS::Queue', 2);
      });

      test('should have expected number of Lambda functions', () => {
        const template = Template.fromStack(tapStack);
        // OrderProcessingFunction + custom resource handlers
        const functions = template.findResources('AWS::Lambda::Function');
        expect(Object.keys(functions).length).toBeGreaterThanOrEqual(1);
      });

      test('should have exactly one API Gateway REST API', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      });

      test('should have exactly one CloudWatch dashboard', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
      });

      test('should have exactly one CloudWatch alarm', () => {
        const template = Template.fromStack(tapStack);
        template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
      });
    });

    describe('Production Environment Configuration', () => {
      test('should enable point-in-time recovery for prod DynamoDB', () => {
        const prodStack = new TapStack(app, 'ProdTapStack', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test',
        });
        const template = Template.fromStack(prodStack);
        template.hasResourceProperties('AWS::DynamoDB::Table', {
          PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: true,
          },
        });
      });

      test('should not have lifecycle expiration for prod S3', () => {
        const prodStack = new TapStack(app, 'ProdTapStack2', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test2',
        });
        const template = Template.fromStack(prodStack);
        const bucket = template.findResources('AWS::S3::Bucket');
        const bucketProps = Object.values(bucket)[0] as any;
        const expirationRule = bucketProps.Properties?.LifecycleConfiguration?.Rules?.find(
          (rule: any) => rule.Id === 'Expiration'
        );
        expect(expirationRule).toBeUndefined();
      });

      test('should have higher Lambda memory for prod', () => {
        const prodStack = new TapStack(app, 'ProdTapStack3', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test3',
        });
        const template = Template.fromStack(prodStack);
        template.hasResourceProperties('AWS::Lambda::Function', {
          MemorySize: 2048,
        });
      });

      test('should have higher API throttling for prod', () => {
        const prodStack = new TapStack(app, 'ProdTapStack4', {
          environmentConfig: EnvironmentConfigurations.PROD,
          environmentSuffix: 'prod-test4',
        });
        const template = Template.fromStack(prodStack);
        template.hasResourceProperties('AWS::ApiGateway::Stage', {
          MethodSettings: Match.arrayWith([
            Match.objectLike({
              ThrottlingRateLimit: 2000,
              ThrottlingBurstLimit: 4000,
            }),
          ]),
        });
      });
    });
  });
});

```

## ./cdk.json

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
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
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
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
}

```
