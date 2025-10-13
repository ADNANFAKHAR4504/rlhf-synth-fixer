The user is asking for a complete CDKTF (Terraform CDK) TypeScript application for provisioning a DynamoDB table with specific requirements. Let me break down what's needed:

Project Structure:
main.ts (or index.ts) with stack named "gaming-database-stack"
cdktf.json
package.json
DynamoDB Table Requirements:
Table name: GamePlayerProfiles
Billing mode: on-demand (PAY_PER_REQUEST)
Partition key: playerId (String)
Sort key: timestamp (Number)
Server-side encryption: enabled using AWS managed keys (alias/aws/dynamodb)
Point-in-time recovery: enabled
Streams: enabled with NEW_AND_OLD_IMAGES
Tags: Environment: production, Team: gaming-platform, ManagedBy: CDKTF
Indexes:
GSI: score-index
Partition key: gameMode (String)
Sort key: score (Number)
Projection: ALL
LSI: level-index
Partition key: playerId (same as table)
Sort key: playerLevel (Number)
Projection: ALL
Auto Scaling:
For GSI (read and write)
Min capacity: 5
Max capacity: 100
Target utilization: 70%
Important: Since it's an on-demand table, auto-scaling should be behind a boolean flag with comments explaining it requires switching to provisioned mode
AWS Provider:
Version ≥ 5.0
Region: us-west-2
Let me create the complete CDKTF TypeScript application.

Answer
// main.ts
import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { AppautoscalingTarget } from "@cdktf/provider-aws/lib/appautoscaling-target";
import { AppautoscalingPolicy } from "@cdktf/provider-aws/lib/appautoscaling-policy";

class GamingDatabaseStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider configuration
    new AwsProvider(this, "aws", {
      region: "us-west-2",
    });

    // Auto-scaling flag - disabled by default for on-demand tables
    // WARNING: Enabling this requires switching table billing mode to PROVISIONED
    const enableGsiAutoscaling = false;

    // DynamoDB Table
    const gameTable = new DynamodbTable(this, "game-player-profiles", {
      name: "GamePlayerProfiles",
      billingMode: "PAY_PER_REQUEST",
      
      // Hash and Range keys
      hashKey: "playerId",
      rangeKey: "timestamp",
      
      // Key attributes
      attribute: [
        { name: "playerId", type: "S" },
        { name: "timestamp", type: "N" },
        { name: "gameMode", type: "S" },
        { name: "score", type: "N" },
        { name: "playerLevel", type: "N" }
      ],
      
      // Global Secondary Index
      globalSecondaryIndex: [{
        name: "score-index",
        hashKey: "gameMode",
        rangeKey: "score",
        projectionType: "ALL"
      }],
      
      // Local Secondary Index
      localSecondaryIndex: [{
        name: "level-index",
        hashKey: "playerId",
        rangeKey: "playerLevel",
        projectionType: "ALL"
      }],
      
      // Enable Point-in-Time Recovery
      pointInTimeRecovery: {
        enabled: true
      },
      
      // Server-side encryption with AWS managed keys
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: "alias/aws/dynamodb"
      },
      
      // Enable DynamoDB Streams
      streamEnabled: true,
      streamViewType: "NEW_AND_OLD_IMAGES",
      
      // Resource tags
      tags: {
        Environment: "production",
        Team: "gaming-platform",
        ManagedBy: "CDKTF"
      }
    });

    // Auto-scaling resources for GSI (only created if enableGsiAutoscaling is true)
    if (enableGsiAutoscaling) {
      // Read capacity auto-scaling target
      const readScalingTarget = new AppautoscalingTarget(this, "gsi-read-scaling-target", {
        serviceNamespace: "dynamodb",
        resourceId: `table/${gameTable.name}/index/score-index`,
        scalableDimension: "dynamodb:index:ReadCapacityUnits",
        minCapacity: 5,
        maxCapacity: 100,
        tags: {
          Environment: "production",
          Team: "gaming-platform",
          ManagedBy: "CDKTF"
        }
      });

      // Read capacity scaling policy
      new AppautoscalingPolicy(this, "gsi-read-scaling-policy", {
        name: "DynamoDBReadCapacityUtilization:${readScalingTarget.resourceId}",
        serviceNamespace: readScalingTarget.serviceNamespace,
        resourceId: readScalingTarget.resourceId,
        scalableDimension: readScalingTarget.scalableDimension,
        policyType: "TargetTrackingScaling",
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBReadCapacityUtilization"
          },
          targetValue: 70
        }
      });

      // Write capacity auto-scaling target
      const writeScalingTarget = new AppautoscalingTarget(this, "gsi-write-scaling-target", {
        serviceNamespace: "dynamodb",
        resourceId: `table/${gameTable.name}/index/score-index`,
        scalableDimension: "dynamodb:index:WriteCapacityUnits",
        minCapacity: 5,
        maxCapacity: 100,
        tags: {
          Environment: "production",
          Team: "gaming-platform",
          ManagedBy: "CDKTF"
        }
      });

      // Write capacity scaling policy
      new AppautoscalingPolicy(this, "gsi-write-scaling-policy", {
        name: "DynamoDBWriteCapacityUtilization:${writeScalingTarget.resourceId}",
        serviceNamespace: writeScalingTarget.serviceNamespace,
        resourceId: writeScalingTarget.resourceId,
        scalableDimension: writeScalingTarget.scalableDimension,
        policyType: "TargetTrackingScaling",
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBWriteCapacityUtilization"
          },
          targetValue: 70
        }
      });
    }
  }
}

const app = new App();
new GamingDatabaseStack(app, "gaming-database-stack");
app.synth();
// cdktf.json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "gaming-database-project",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~>5.0"
  ],
  "terraformModules": [],
  "context": {}
}
// package.json
{
  "name": "gaming-database-stack",
  "version": "1.0.0",
  "description": "CDKTF stack for gaming platform DynamoDB table",
  "main": "main.js",
  "types": "main.ts",
  "license": "MIT",
  "private": true,
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "upgrade": "npm i cdktf@latest cdktf-cli@latest",
    "upgrade:next": "npm i cdktf@next cdktf-cli@next"
  },
  "engines": {
    "node": ">=16.0"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "cdktf-cli": "^0.20.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
// tsconfig.json
{
  "compilerOptions": {
    "alwaysStrict": true,
    "declaration": true,
    "experimentalDecorators": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "lib": ["es2018"],
    "module": "CommonJS",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "target": "ES2018",
    "skipLibCheck": true
  },
  "exclude": [
    "cdktf.out"
  ]
}
// .gitignore
*.d.ts
*.js
node_modules
cdktf.out
cdktf.log
.gen
.terraform
tsconfig.json
terraform.tfstate*
.terraform.tfstate*
.terraform.lock.hcl