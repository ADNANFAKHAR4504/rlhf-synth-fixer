import { AppautoscalingPolicy } from "@cdktf/provider-aws/lib/appautoscaling-policy";
import { AppautoscalingTarget } from "@cdktf/provider-aws/lib/appautoscaling-target";
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";

export class GamingDatabaseStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider configuration - version 5.0+ targeting us-west-2
    new AwsProvider(this, "aws", {
      region: "us-west-2",
    });

    // Auto-scaling flag - disabled by default for on-demand tables
    // WARNING: Enabling this requires switching table billing mode to PROVISIONED
    // DynamoDB limitation: on-demand tables don't support auto scaling
    const enableGsiAutoscaling = false;

    // DynamoDB Table - GamePlayerProfiles
    const gameTable = new DynamodbTable(this, "game-player-profiles", {
      name: "GamePlayerProfiles",
      billingMode: "PAY_PER_REQUEST", // On-demand billing

      // Primary keys
      hashKey: "playerId",    // Partition key (String)
      rangeKey: "timestamp",  // Sort key (Number)

      // All required attributes for table and indexes
      attribute: [
        { name: "playerId", type: "S" },     // Primary partition key
        { name: "timestamp", type: "N" },    // Primary sort key
        { name: "gameMode", type: "S" },     // GSI partition key
        { name: "score", type: "N" },        // GSI sort key
        { name: "playerLevel", type: "N" }   // LSI sort key
      ],

      // Global Secondary Index: score-index
      globalSecondaryIndex: [{
        name: "score-index",
        hashKey: "gameMode",     // Partition key (String)
        rangeKey: "score",       // Sort key (Number)
        projectionType: "ALL"    // Project all attributes
      }],

      // Local Secondary Index: level-index
      // LSI automatically uses the same partition key as the table (playerId)
      localSecondaryIndex: [{
        name: "level-index",
        rangeKey: "playerLevel", // Sort key (Number)
        projectionType: "ALL"    // Project all attributes
      }],

      // Enable Point-in-Time Recovery explicitly
      pointInTimeRecovery: {
        enabled: true
      },

      // Server-side encryption using AWS managed keys
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: "alias/aws/dynamodb"
      },

      // Enable DynamoDB Streams with NEW_AND_OLD_IMAGES
      streamEnabled: true,
      streamViewType: "NEW_AND_OLD_IMAGES",

      // Required tags on all resources
      tags: {
        Environment: "production",
        Team: "gaming-platform",
        ManagedBy: "CDKTF"
      }
    });

    // Auto-scaling resources for GSI (only created if enableGsiAutoscaling is true)
    // Note: This is disabled by default since table uses on-demand billing
    // To enable: set enableGsiAutoscaling=true AND change billingMode to "PROVISIONED"
    if (enableGsiAutoscaling) {
      // Read capacity auto-scaling target for GSI
      const readScalingTarget = new AppautoscalingTarget(this, "gsi-read-scaling-target", {
        serviceNamespace: "dynamodb",
        resourceId: `table/${gameTable.name}/index/score-index`,
        scalableDimension: "dynamodb:index:ReadCapacityUnits",
        minCapacity: 5,   // Min capacity: 5
        maxCapacity: 100, // Max capacity: 100
        tags: {
          Environment: "production",
          Team: "gaming-platform",
          ManagedBy: "CDKTF"
        }
      });

      // Read capacity scaling policy with 70% target utilization
      new AppautoscalingPolicy(this, "gsi-read-scaling-policy", {
        name: `DynamoDBReadCapacityUtilization:${readScalingTarget.resourceId}`,
        serviceNamespace: readScalingTarget.serviceNamespace,
        resourceId: readScalingTarget.resourceId,
        scalableDimension: readScalingTarget.scalableDimension,
        policyType: "TargetTrackingScaling",
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBReadCapacityUtilization"
          },
          targetValue: 70 // Target utilization: 70%
        }
      });

      // Write capacity auto-scaling target for GSI
      const writeScalingTarget = new AppautoscalingTarget(this, "gsi-write-scaling-target", {
        serviceNamespace: "dynamodb",
        resourceId: `table/${gameTable.name}/index/score-index`,
        scalableDimension: "dynamodb:index:WriteCapacityUnits",
        minCapacity: 5,   // Min capacity: 5
        maxCapacity: 100, // Max capacity: 100
        tags: {
          Environment: "production",
          Team: "gaming-platform",
          ManagedBy: "CDKTF"
        }
      });

      // Write capacity scaling policy with 70% target utilization
      new AppautoscalingPolicy(this, "gsi-write-scaling-policy", {
        name: `DynamoDBWriteCapacityUtilization:${writeScalingTarget.resourceId}`,
        serviceNamespace: writeScalingTarget.serviceNamespace,
        resourceId: writeScalingTarget.resourceId,
        scalableDimension: writeScalingTarget.scalableDimension,
        policyType: "TargetTrackingScaling",
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "DynamoDBWriteCapacityUtilization"
          },
          targetValue: 70 // Target utilization: 70%
        }
      });
    }
  }
}

// Export alias for backward compatibility
export const TapStack = GamingDatabaseStack;

// App instantiation with required stack name
const app = new App();
new GamingDatabaseStack(app, "gaming-database-stack");
app.synth();
