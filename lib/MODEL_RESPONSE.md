# TAP Stack ComponentResource - Pulumi TypeScript Implementation

This implementation provides a foundational Pulumi ComponentResource for infrastructure orchestration with a modular, extensible architecture.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // --- Instantiate Nested Components Here ---
    // This is where you would create instances of your other component resources,
    // passing them the necessary configuration.

    // Example of instantiating a DynamoDBStack component:
    // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
    //   environmentSuffix: environmentSuffix,
    //   tags: tags,
    // }, { parent: this });

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.

    // Register the outputs of this component.
    this.registerOutputs({
      // Outputs will be registered here
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';
const repository =
  config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor =
  config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
new TapStack('pulumi-infra', {
  tags: defaultTags,
});

// To use the stack outputs, you can export them.
// For example, if TapStack had an output `bucketName`:
// export const bucketName = stack.bucketName;
```

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: nodejs
  options:
    typescript: true
main: bin/tap.ts
description: Infrastructure as Code for Test Automation Platform
```

## File: package.json

```json
{
  "name": "tap-stack",
  "version": "1.0.0",
  "description": "Pulumi infrastructure for Test Automation Platform",
  "main": "bin/tap.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint . --ext .ts"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "bin",
    "rootDir": "."
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin"
  ]
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Build TypeScript:
```bash
npm run build
```

3. Configure Pulumi stack:
```bash
export PULUMI_CONFIG_PASSPHRASE="your-passphrase"
pulumi stack init TapStack${ENVIRONMENT_SUFFIX}
pulumi config set aws:region <your-region>
```

4. Deploy infrastructure:
```bash
pulumi up
```

## Architecture

The TapStack follows a component-based architecture:

- **TapStack**: Main orchestrator ComponentResource
- **Nested Components**: Resource-specific components (to be added)
- **Configuration**: Centralized through Pulumi.Config and environment variables
- **Tagging**: Standardized tags (Environment, Repository, Author)
- **Extensibility**: Easy to add new resource components

## Extension Pattern

To add a new resource component:

1. Create component file (e.g., `lib/dynamodb-stack.ts`):

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly tableName: pulumi.Output<string>;

  constructor(name: string, args: DynamoDBStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:stack:DynamoDBStack', name, {}, opts);

    const table = new aws.dynamodb.Table(`table-${args.environmentSuffix}`, {
      attributes: [{ name: 'id', type: 'S' }],
      hashKey: 'id',
      billingMode: 'PAY_PER_REQUEST',
      tags: args.tags,
    }, { parent: this });

    this.tableName = table.name;

    this.registerOutputs({
      tableName: this.tableName,
    });
  }
}
```

2. Import and instantiate in `tap-stack.ts`:

```typescript
import { DynamoDBStack } from './dynamodb-stack';

// Inside TapStack constructor
const dynamoDBStack = new DynamoDBStack('tap-dynamodb', {
  environmentSuffix: args.environmentSuffix || 'dev',
  tags: args.tags,
}, { parent: this });

// Expose outputs
this.registerOutputs({
  tableName: dynamoDBStack.tableName,
});
```

## Features Implemented

1. **Component-Based Architecture**: TapStack as main orchestrator
2. **Environment Configuration**: Flexible environment suffix support
3. **Resource Tagging**: Standardized tagging strategy
4. **Type Safety**: TypeScript strict mode with proper interfaces
5. **Modularity**: Clear separation of orchestration and resources
6. **Configuration Management**: Pulumi.Config and environment variables
7. **Extensibility**: Template structure for nested components
8. **Code Quality**: Comprehensive JSDoc comments
9. **Best Practices**: Follows Pulumi patterns
10. **Clean Structure**: Well-organized project layout
