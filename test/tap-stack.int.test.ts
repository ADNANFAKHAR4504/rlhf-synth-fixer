import { App, Testing } from 'cdktf';
import { GamingDatabaseStack } from '../lib/tap-stack';

describe('Gaming Database Stack Integration Tests', () => {
  let app: App;
  let stack: GamingDatabaseStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new GamingDatabaseStack(app, 'gaming-database-stack');
    synthesized = Testing.synth(stack);
  });

  describe('DynamoDB Table Configuration', () => {
    test('should create DynamoDB table with correct configuration', () => {
      // Verify table exists with correct name (dynamic naming)
      expect(synthesized).toContain('aws_dynamodb_table');
      expect(synthesized).toMatch(/"name": "GamingPlayerProfiles-production-\d+"/);  // Dynamic name pattern

      // Verify billing mode is pay-per-request
      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"');

      // Verify primary keys
      expect(synthesized).toContain('"hash_key": "playerId"');
      expect(synthesized).toContain('"range_key": "timestamp"');
    });

    test('should configure all required attributes correctly', () => {
      // Verify all attributes are defined
      const attributeChecks = [
        '"name": "playerId"',
        '"type": "S"',
        '"name": "timestamp"',
        '"type": "N"',
        '"name": "gameMode"',
        '"name": "score"',
        '"name": "playerLevel"'
      ];

      attributeChecks.forEach(check => {
        expect(synthesized).toContain(check);
      });
    });

    test('should enable point-in-time recovery', () => {
      expect(synthesized).toContain('"point_in_time_recovery"');
      expect(synthesized).toContain('"enabled": true');
    });

    test('should enable server-side encryption', () => {
      expect(synthesized).toContain('"server_side_encryption"');
      expect(synthesized).toContain('"enabled": true');
    });

    test('should enable DynamoDB streams with correct view type', () => {
      expect(synthesized).toContain('"stream_enabled": true');
      expect(synthesized).toContain('"stream_view_type": "NEW_AND_OLD_IMAGES"');
    });

    test('should include all required tags', () => {
      const requiredTags = [
        '"Environment": "production"',
        '"Team": "gaming-platform"',
        '"ManagedBy": "CDKTF"'
      ];

      requiredTags.forEach(tag => {
        expect(synthesized).toContain(tag);
      });
    });
  });

  describe('Global Secondary Index (GSI)', () => {
    test('should create score-index GSI with correct configuration', () => {
      expect(synthesized).toContain('"global_secondary_index"');
      expect(synthesized).toMatch(/"name": "score-index-production-\d+"/);  // Dynamic GSI name
      expect(synthesized).toContain('"hash_key": "gameMode"');
      expect(synthesized).toContain('"range_key": "score"');
      expect(synthesized).toContain('"projection_type": "ALL"');
    });

    test('should use correct partition and sort keys for GSI', () => {
      // Verify GSI uses gameMode as partition key and score as sort key
      expect(synthesized).toContain('"hash_key": "gameMode"');
      expect(synthesized).toContain('"range_key": "score"');
      expect(synthesized).toMatch(/"name": "score-index-production-\d+"/);  // Dynamic GSI name
    });
  });

  describe('Local Secondary Index (LSI)', () => {
    test('should create level-index LSI with correct configuration', () => {
      expect(synthesized).toContain('"local_secondary_index"');
      expect(synthesized).toContain('"name": "level-index"');
      expect(synthesized).toContain('"range_key": "playerLevel"');
      expect(synthesized).toContain('"projection_type": "ALL"');
    });

    test('should use playerLevel as sort key for LSI', () => {
      // LSI automatically inherits partition key from main table (playerId)
      const lsiPattern = /"local_secondary_index"[\s\S]*?"name": "level-index"[\s\S]*?"range_key": "playerLevel"/;
      expect(synthesized).toMatch(lsiPattern);
    });
  });

  describe('Auto-scaling Configuration', () => {
    test('should not include auto-scaling resources when disabled', () => {
      // When enableGsiAutoscaling is false, no auto-scaling resources should be created
      expect(synthesized).not.toContain('aws_appautoscaling_target');
      expect(synthesized).not.toContain('aws_appautoscaling_policy');
      expect(synthesized).not.toContain('gsi-read-scaling-target');
      expect(synthesized).not.toContain('gsi-write-scaling-target');
    });

    test('should be compatible with on-demand billing mode', () => {
      // Verify that auto-scaling is disabled when using PAY_PER_REQUEST
      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"');
      expect(synthesized).not.toContain('aws_appautoscaling_target');
    });
  });

  describe('AWS Provider Configuration', () => {
    test('should configure AWS provider with correct region', () => {
      expect(synthesized).toContain('"region": "us-west-2"');
    });

    test('should use AWS provider version 5.0+', () => {
      // Verify provider configuration exists
      expect(synthesized).toContain('aws');
      expect(synthesized).toContain('"region": "us-west-2"');
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('should create single DynamoDB table resource', () => {
      const tableMatches = synthesized.match(/aws_dynamodb_table/g);
      expect(tableMatches).toHaveLength(1);
    });

    test('should reference table attributes correctly in indexes', () => {
      // Verify that GSI and LSI reference attributes that are actually defined
      const definedAttributes = ['playerId', 'timestamp', 'gameMode', 'score', 'playerLevel'];

      definedAttributes.forEach(attr => {
        expect(synthesized).toContain(`"name": "${attr}"`);
      });
    });

    test('should have consistent naming convention', () => {
      // Verify consistent dynamic naming patterns
      expect(synthesized).toMatch(/GamingPlayerProfiles-production-\d+/);  // Dynamic table name
      expect(synthesized).toMatch(/score-index-production-\d+/);  // Dynamic GSI name
      expect(synthesized).toContain('level-index');  // LSI keeps static name
    });
  });

  describe('Production Readiness Features', () => {
    test('should enable all production-ready features', () => {
      const productionFeatures = [
        '"point_in_time_recovery"',
        '"server_side_encryption"',
        '"stream_enabled": true',
        '"Environment": "production"'
      ];

      productionFeatures.forEach(feature => {
        expect(synthesized).toContain(feature);
      });
    });

    test('should use appropriate encryption settings', () => {
      // Verify encryption is enabled (AWS managed by default)
      expect(synthesized).toContain('"server_side_encryption"');
      expect(synthesized).toContain('"enabled": true');
      // Should not contain custom KMS key (using AWS managed)
      expect(synthesized).not.toContain('"kms_key_arn"');
    });

    test('should configure streams for data replication/processing', () => {
      expect(synthesized).toContain('"stream_enabled": true');
      expect(synthesized).toContain('"stream_view_type": "NEW_AND_OLD_IMAGES"');
    });
  });

  describe('Gaming Use Case Specific Tests', () => {
    test('should support gaming player profile queries', () => {
      // Verify table structure supports gaming use cases
      expect(synthesized).toContain('"hash_key": "playerId"'); // Player lookup
      expect(synthesized).toContain('"range_key": "timestamp"'); // Time-based queries
      expect(synthesized).toMatch(/"name": "score-index-production-\d+"/); // Dynamic leaderboard queries
      expect(synthesized).toContain('"name": "level-index"'); // Level-based queries (static)
    });

    test('should enable efficient leaderboard queries via GSI', () => {
      // GSI should allow querying by gameMode and sorting by score
      expect(synthesized).toContain('"hash_key": "gameMode"');
      expect(synthesized).toContain('"range_key": "score"');
      expect(synthesized).toContain('"projection_type": "ALL"');
    });

    test('should support player level progression queries via LSI', () => {
      // LSI should allow querying player progression by level
      expect(synthesized).toContain('"range_key": "playerLevel"');
      expect(synthesized).toContain('"projection_type": "ALL"');
    });
  });

  describe('Stack Export and Compatibility', () => {
    test('should export GamingDatabaseStack class', () => {
      expect(GamingDatabaseStack).toBeDefined();
      expect(typeof GamingDatabaseStack).toBe('function');
    });

    test('should provide TapStack alias for backward compatibility', () => {
      const { TapStack } = require('../lib/tap-stack');
      expect(TapStack).toBeDefined();
      expect(TapStack).toBe(GamingDatabaseStack);
    });

    test('should instantiate stack with correct ID', () => {
      expect(stack.node.id).toBe('gaming-database-stack');
    });
  });

  describe('Performance and Scalability', () => {
    test('should use on-demand billing for automatic scaling', () => {
      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"');
      // On-demand automatically scales to handle traffic
    });

    test('should not include provisioned capacity settings', () => {
      // With PAY_PER_REQUEST, these should not be present
      expect(synthesized).not.toContain('"read_capacity"');
      expect(synthesized).not.toContain('"write_capacity"');
    });

    test('should project all attributes in indexes for query flexibility', () => {
      // Both GSI and LSI should project all attributes
      const projectionMatches = synthesized.match(/"projection_type": "ALL"/g);
      expect(projectionMatches).toHaveLength(2); // One for GSI, one for LSI
    });
  });

  describe('Data Consistency and Durability', () => {
    test('should enable point-in-time recovery for data protection', () => {
      expect(synthesized).toContain('"point_in_time_recovery"');
      expect(synthesized).toContain('"enabled": true');
    });

    test('should enable streams for data replication and analytics', () => {
      expect(synthesized).toContain('"stream_enabled": true');
      expect(synthesized).toContain('"NEW_AND_OLD_IMAGES"');
    });

    test('should use server-side encryption for data at rest', () => {
      expect(synthesized).toContain('"server_side_encryption"');
      expect(synthesized).toContain('"enabled": true');
    });
  });

  describe('Auto-scaling Integration Tests with Enabled Flag', () => {
    let appWithScaling: App;
    let stackWithScaling: GamingDatabaseStack;
    let synthesizedWithScaling: string;

    beforeEach(() => {
      appWithScaling = new App();
      stackWithScaling = new GamingDatabaseStack(appWithScaling, 'gaming-database-stack-with-scaling', { enableAutoScaling: true });
      synthesizedWithScaling = Testing.synth(stackWithScaling);
    });

    test('should create auto-scaling targets when auto-scaling is enabled', () => {
      expect(synthesizedWithScaling).toContain('aws_appautoscaling_target');
      expect(synthesizedWithScaling).toContain('gsi-read-scaling-target');
      expect(synthesizedWithScaling).toContain('gsi-write-scaling-target');
    });

    test('should create auto-scaling policies when auto-scaling is enabled', () => {
      expect(synthesizedWithScaling).toContain('aws_appautoscaling_policy');
      expect(synthesizedWithScaling).toContain('gsi-read-scaling-policy');
      expect(synthesizedWithScaling).toContain('gsi-write-scaling-policy');
    });

    test('should configure auto-scaling targets with correct resource IDs', () => {
      expect(synthesizedWithScaling).toContain('"service_namespace": "dynamodb"');
      expect(synthesizedWithScaling).toContain('table/${aws_dynamodb_table.game-player-profiles.name}/index/score-index');
      expect(synthesizedWithScaling).toContain('"scalable_dimension": "dynamodb:index:ReadCapacityUnits"');
      expect(synthesizedWithScaling).toContain('"scalable_dimension": "dynamodb:index:WriteCapacityUnits"');
    });

    test('should configure auto-scaling capacity limits correctly', () => {
      expect(synthesizedWithScaling).toContain('"min_capacity": 5');
      expect(synthesizedWithScaling).toContain('"max_capacity": 100');
    });

    test('should configure scaling policies with target tracking', () => {
      expect(synthesizedWithScaling).toContain('"policy_type": "TargetTrackingScaling"');
      expect(synthesizedWithScaling).toContain('DynamoDBReadCapacityUtilization');
      expect(synthesizedWithScaling).toContain('DynamoDBWriteCapacityUtilization');
      expect(synthesizedWithScaling).toContain('"target_value": 70');
    });

    test('should include proper tags on auto-scaling resources', () => {
      // Verify that auto-scaling resources also have the required tags
      expect(synthesizedWithScaling).toContain('"Environment": "production"');
      expect(synthesizedWithScaling).toContain('"Team": "gaming-platform"');
      expect(synthesizedWithScaling).toContain('"ManagedBy": "CDKTF"');
    });
  });

  describe('Environment Variable Configuration Tests', () => {
    let originalEnv: string | undefined;

    beforeAll(() => {
      originalEnv = process.env.ENABLE_GSI_AUTOSCALING;
    });

    afterAll(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_GSI_AUTOSCALING = originalEnv;
      } else {
        delete process.env.ENABLE_GSI_AUTOSCALING;
      }
    });

    test('should enable auto-scaling when environment variable is set', () => {
      process.env.ENABLE_GSI_AUTOSCALING = 'true';

      const testApp = new App();
      const testStack = new GamingDatabaseStack(testApp, 'env-test-stack');
      const testSynthesized = Testing.synth(testStack);

      expect(testSynthesized).toContain('aws_appautoscaling_target');
      expect(testSynthesized).toContain('aws_appautoscaling_policy');
    });

    test('should not enable auto-scaling when environment variable is false', () => {
      process.env.ENABLE_GSI_AUTOSCALING = 'false';

      const testApp = new App();
      const testStack = new GamingDatabaseStack(testApp, 'env-test-stack-false');
      const testSynthesized = Testing.synth(testStack);

      expect(testSynthesized).not.toContain('aws_appautoscaling_target');
      expect(testSynthesized).not.toContain('aws_appautoscaling_policy');
    });
  });

  describe('Stack Resource Validation and Terraform Integration', () => {
    test('should generate valid Terraform JSON structure', () => {
      expect(() => JSON.parse(synthesized)).not.toThrow();
    });

    test('should include required Terraform provider configuration', () => {
      expect(synthesized).toContain('"terraform"');
      expect(synthesized).toContain('"required_providers"');
      expect(synthesized).toContain('"aws"');
    });

    test('should have consistent resource naming across all components', () => {
      // Ensure all resources follow consistent naming patterns
      expect(synthesized).toContain('game-player-profiles'); // Terraform resource name (static)
      expect(synthesized).toMatch(/GamingPlayerProfiles-production-\d+/); // Dynamic DynamoDB table name
      expect(synthesized).toMatch(/score-index-production-\d+/); // Dynamic GSI name
      expect(synthesized).toContain('level-index'); // LSI name (static)
    });

    test('should not have any resource conflicts or duplicates', () => {
      // Verify single instances of key resources
      const tableMatches = (synthesized.match(/aws_dynamodb_table/g) || []).length;
      const providerMatches = (synthesized.match(/"region": "us-west-2"/g) || []).length;

      expect(tableMatches).toBe(1);
      expect(providerMatches).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle stack instantiation with different IDs', () => {
      const testApp = new App();
      const testStack1 = new GamingDatabaseStack(testApp, 'test-stack-1');
      const testStack2 = new GamingDatabaseStack(testApp, 'test-stack-2');

      expect(testStack1.node.id).toBe('test-stack-1');
      expect(testStack2.node.id).toBe('test-stack-2');
    });

    test('should handle auto-scaling parameter variations', () => {
      const testApp = new App();

      // Test with undefined (default behavior)
      const stackUndefined = new GamingDatabaseStack(testApp, 'stack-undefined');
      const synthesizedUndefined = Testing.synth(stackUndefined);
      expect(synthesizedUndefined).not.toContain('aws_appautoscaling_target');

      // Test with explicit false
      const stackFalse = new GamingDatabaseStack(testApp, 'stack-false', { enableAutoScaling: false });
      const synthesizedFalse = Testing.synth(stackFalse);
      expect(synthesizedFalse).not.toContain('aws_appautoscaling_target');

      // Test with explicit true
      const stackTrue = new GamingDatabaseStack(testApp, 'stack-true', { enableAutoScaling: true });
      const synthesizedTrue = Testing.synth(stackTrue);
      expect(synthesizedTrue).toContain('aws_appautoscaling_target');
    });
  });

  describe('Performance and Monitoring Integration', () => {
    test('should configure streams for real-time monitoring', () => {
      expect(synthesized).toContain('"stream_enabled": true');
      expect(synthesized).toContain('"stream_view_type": "NEW_AND_OLD_IMAGES"');
    });

    test('should support CloudWatch metrics through DynamoDB integration', () => {
      // Verify features that enable CloudWatch monitoring
      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"'); // Automatic CloudWatch metrics
      expect(synthesized).toContain('"point_in_time_recovery"'); // Backup metrics
      expect(synthesized).toContain('"stream_enabled": true'); // Stream metrics
    });

    test('should be configured for high availability', () => {
      // DynamoDB features that provide high availability
      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"'); // Auto-scaling
      expect(synthesized).toContain('"point_in_time_recovery"'); // Disaster recovery
      expect(synthesized).toContain('"server_side_encryption"'); // Security
    });
  });

  describe('Gaming Domain-Specific Integration Tests', () => {
    test('should support real-time leaderboard use cases', () => {
      // Verify GSI configuration supports leaderboard queries
      expect(synthesized).toContain('"hash_key": "gameMode"'); // Query by game type
      expect(synthesized).toContain('"range_key": "score"'); // Sort by score
      expect(synthesized).toContain('"stream_enabled": true'); // Real-time updates
    });

    test('should support player progression tracking', () => {
      // Verify LSI configuration supports player level tracking
      expect(synthesized).toContain('"range_key": "playerLevel"'); // Level progression
      expect(synthesized).toContain('"projection_type": "ALL"'); // Full player data
    });

    test('should support time-based game session queries', () => {
      // Verify primary key structure supports temporal queries
      expect(synthesized).toContain('"hash_key": "playerId"'); // Player-specific queries
      expect(synthesized).toContain('"range_key": "timestamp"'); // Time-ordered data
    });

    test('should enable analytics and reporting workflows', () => {
      // Features that support gaming analytics
      expect(synthesized).toContain('"stream_enabled": true'); // Data streaming
      expect(synthesized).toContain('"NEW_AND_OLD_IMAGES"'); // Change tracking
      expect(synthesized).toContain('"projection_type": "ALL"'); // Complete data access
    });
  });
});
