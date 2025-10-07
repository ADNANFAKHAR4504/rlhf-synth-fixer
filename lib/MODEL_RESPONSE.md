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