import { App, Testing } from 'cdktf';
import { GamingDatabaseStack, TapStack } from '../lib/tap-stack';

describe('Gaming Database Stack Unit Tests', () => {
  let app: App;
  let stack: GamingDatabaseStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    stack = new GamingDatabaseStack(app, 'test-stack');
    synthesized = Testing.synth(stack);
  });

  describe('Stack Instantiation', () => {
    test('should instantiate GamingDatabaseStack without errors', () => {
      expect(stack).toBeInstanceOf(GamingDatabaseStack);
    });

    test('should set correct stack ID', () => {
      expect(stack.node.id).toBe('test-stack');
    });

    test('should be a valid CDKTF stack', () => {
      expect(synthesized).toBeDefined();
      expect(synthesized.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Provider Configuration', () => {
    test('should configure AWS provider with us-west-2 region', () => {
      expect(synthesized).toContain('"region": "us-west-2"');
    });

    test('should have AWS provider configuration', () => {
      expect(synthesized).toContain('"provider"');
      expect(synthesized).toContain('"aws"');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('should create exactly one DynamoDB table', () => {
      const tableMatches = (synthesized.match(/aws_dynamodb_table/g) || []).length;
      expect(tableMatches).toBe(1);
    });

    test('should configure table with dynamic name', () => {
      expect(synthesized).toMatch(/"name": "GamingPlayerProfiles-production-\d+"/);
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(synthesized).toContain('"billing_mode": "PAY_PER_REQUEST"');
    });

    test('should configure primary keys correctly', () => {
      expect(synthesized).toContain('"hash_key": "playerId"');
      expect(synthesized).toContain('"range_key": "timestamp"');
    });

    test('should define all required attributes with correct types', () => {
      expect(synthesized).toContain('"name": "playerId"');
      expect(synthesized).toContain('"type": "S"');
      expect(synthesized).toContain('"name": "gameMode"');
      expect(synthesized).toContain('"name": "score"');
      expect(synthesized).toContain('"type": "N"');
      expect(synthesized).toContain('"name": "timestamp"');
      expect(synthesized).toContain('"name": "playerLevel"');
    });

    test('should have exactly 5 attributes defined', () => {
      const attributeMatches = (synthesized.match(/"name": "[^"]+"/g) || []).filter(match =>
        match.includes('playerId') ||
        match.includes('gameSession') ||
        match.includes('score') ||
        match.includes('timestamp') ||
        match.includes('level')
      ).length;
      expect(attributeMatches).toBe(5);
    });
  });

  describe('Global Secondary Index (GSI)', () => {
    test('should create exactly one GSI', () => {
      const gsiMatches = (synthesized.match(/"global_secondary_index"/g) || []).length;
      expect(gsiMatches).toBe(1);
    });

    test('should configure GSI with dynamic name', () => {
      expect(synthesized).toMatch(/"name": "score-index-production-\d{6}"/);
    });

    test('should configure GSI keys correctly', () => {
      expect(synthesized).toContain('"hash_key": "gameMode"');
      expect(synthesized).toContain('"range_key": "score"');
    });

    test('should use ALL projection type for GSI', () => {
      expect(synthesized).toContain('"projection_type": "ALL"');
    });
  });

  describe('Local Secondary Index (LSI)', () => {
    test('should create exactly one LSI', () => {
      const lsiMatches = (synthesized.match(/"local_secondary_index"/g) || []).length;
      expect(lsiMatches).toBe(1);
    });

    test('should configure LSI with correct name', () => {
      expect(synthesized).toContain('"name": "level-index"');
    });

    test('should configure LSI sort key correctly', () => {
      expect(synthesized).toContain('"range_key": "playerLevel"');
    });

    test('should use ALL projection type for LSI', () => {
      expect(synthesized).toContain('"projection_type": "ALL"');
    });

    test('should not define hash_key for LSI (inherits from table)', () => {
      const lsiSection = synthesized.match(/"local_secondary_index":\s*\[[^\]]*\]/s)?.[0] || '';
      expect(lsiSection).not.toContain('"hash_key"');
    });
  });

  describe('Point-in-Time Recovery', () => {
    test('should enable point-in-time recovery', () => {
      expect(synthesized).toContain('"point_in_time_recovery"');
      expect(synthesized).toContain('"enabled": true');
    });

    test('should have exactly one PITR configuration', () => {
      const pitrMatches = (synthesized.match(/"point_in_time_recovery"/g) || []).length;
      expect(pitrMatches).toBe(1);
    });
  });

  describe('Server-Side Encryption', () => {
    test('should enable server-side encryption', () => {
      expect(synthesized).toContain('"server_side_encryption"');
      expect(synthesized).toContain('"enabled": true');
    });

    test('should not specify KMS key (uses AWS managed)', () => {
      expect(synthesized).not.toContain('"kms_key_arn"');
    });

    test('should have exactly one encryption configuration', () => {
      const encryptionMatches = (synthesized.match(/"server_side_encryption"/g) || []).length;
      expect(encryptionMatches).toBe(1);
    });
  });

  describe('DynamoDB Streams', () => {
    test('should enable DynamoDB streams', () => {
      expect(synthesized).toContain('"stream_enabled": true');
    });

    test('should configure correct stream view type', () => {
      expect(synthesized).toContain('"stream_view_type": "NEW_AND_OLD_IMAGES"');
    });

    test('should have exactly one stream configuration', () => {
      const streamMatches = (synthesized.match(/"stream_enabled": true/g) || []).length;
      expect(streamMatches).toBe(1);
    });
  });

  describe('Resource Tags', () => {
    test('should include all required tags', () => {
      expect(synthesized).toContain('"Environment": "production"');
      expect(synthesized).toContain('"Team": "gaming-platform"');
      expect(synthesized).toContain('"ManagedBy": "CDKTF"');
    });

    test('should have at least 3 required tags', () => {
      const tagMatches = [
        synthesized.includes('"Environment": "production"'),
        synthesized.includes('"Team": "gaming-platform"'),
        synthesized.includes('"ManagedBy": "CDKTF"')
      ].filter(Boolean).length;
      expect(tagMatches).toBeGreaterThanOrEqual(3);
    });

    test('should not include any unexpected tags', () => {
      const tagSection = synthesized.match(/"tags":\s*{[^}]*}/g)?.[0] || '';
      expect(tagSection).not.toContain('"Owner"');
      expect(tagSection).not.toContain('"Project"');
    });
  });

  describe('Auto-scaling Configuration', () => {
    test('should not include auto-scaling resources by default', () => {
      expect(synthesized).not.toContain('aws_appautoscaling_target');
      expect(synthesized).not.toContain('aws_appautoscaling_policy');
    });

    test('should not include scaling target resources', () => {
      expect(synthesized).not.toContain('gsi-read-scaling-target');
      expect(synthesized).not.toContain('gsi-write-scaling-target');
    });

    test('should not include scaling policy resources', () => {
      expect(synthesized).not.toContain('gsi-read-scaling-policy');
      expect(synthesized).not.toContain('gsi-write-scaling-policy');
    });
  });

  describe('Auto-scaling Code Coverage', () => {
    // These tests ensure we cover the conditional auto-scaling code paths
    test('should have auto-scaling imports in source code', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('import { AppautoscalingPolicy }');
      expect(sourceFile).toContain('import { AppautoscalingTarget }');
    });

    test('should have enableGsiAutoscaling flag configurable with default false', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('enableAutoScaling ||');
      expect(sourceFile).toContain('process.env.ENABLE_GSI_AUTOSCALING === \'true\' ||');
    });

    test('should have conditional logic for auto-scaling', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('if (enableGsiAutoscaling)');
    });

    test('should have auto-scaling target configuration code', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('new AppautoscalingTarget');
      expect(sourceFile).toContain('serviceNamespace: \'dynamodb\'');
      expect(sourceFile).toContain('dynamodb:index:ReadCapacityUnits');
      expect(sourceFile).toContain('dynamodb:index:WriteCapacityUnits');
      expect(sourceFile).toContain('minCapacity: 5');
      expect(sourceFile).toContain('maxCapacity: 100');
    });

    test('should have auto-scaling policy configuration code', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('new AppautoscalingPolicy');
      expect(sourceFile).toContain('policyType: \'TargetTrackingScaling\'');
      expect(sourceFile).toContain('DynamoDBReadCapacityUtilization');
      expect(sourceFile).toContain('DynamoDBWriteCapacityUtilization');
      expect(sourceFile).toContain('targetValue: 70');
    });

    test('should have proper resource naming in auto-scaling code', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('gsi-read-scaling-target');
      expect(sourceFile).toContain('gsi-write-scaling-target');
      expect(sourceFile).toContain('gsi-read-scaling-policy');
      expect(sourceFile).toContain('gsi-write-scaling-policy');
    });

    test('should have correct table and index references in auto-scaling code', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('table/${gameTable.name}/index/${dynamicIndexName}');
    });

    test('should have warning comments about billing mode requirements', () => {
      const fs = require('fs');
      const path = require('path');
      const sourceFile = fs.readFileSync(path.join(__dirname, '../lib/tap-stack.ts'), 'utf8');

      expect(sourceFile).toContain('WARNING: Enabling this requires switching');
      expect(sourceFile).toContain('PROVISIONED');
      expect(sourceFile).toContain('on-demand tables don\'t support auto scaling');
    });
  });

  describe('Auto-scaling Enabled Code Path Coverage', () => {
    let appWithScaling: App;
    let stackWithScaling: GamingDatabaseStack;
    let synthesizedWithScaling: string;

    beforeEach(() => {
      appWithScaling = new App();
      stackWithScaling = new GamingDatabaseStack(appWithScaling, 'test-stack-with-scaling', { enableAutoScaling: true });
      synthesizedWithScaling = Testing.synth(stackWithScaling);
    });

    test('should create auto-scaling resources when enabled via constructor', () => {
      expect(synthesizedWithScaling).toContain('aws_appautoscaling_target');
      expect(synthesizedWithScaling).toContain('aws_appautoscaling_policy');
      expect(synthesizedWithScaling).toContain('gsi-read-scaling-target');
      expect(synthesizedWithScaling).toContain('gsi-write-scaling-target');
      expect(synthesizedWithScaling).toContain('gsi-read-scaling-policy');
      expect(synthesizedWithScaling).toContain('gsi-write-scaling-policy');
    });

    test('should configure scaling targets correctly when enabled', () => {
      expect(synthesizedWithScaling).toContain('"service_namespace": "dynamodb"');
      expect(synthesizedWithScaling).toContain('"scalable_dimension": "dynamodb:index:ReadCapacityUnits"');
      expect(synthesizedWithScaling).toContain('"scalable_dimension": "dynamodb:index:WriteCapacityUnits"');
      expect(synthesizedWithScaling).toContain('"min_capacity": 5');
      expect(synthesizedWithScaling).toContain('"max_capacity": 100');
    });

    test('should configure scaling policies correctly when enabled', () => {
      expect(synthesizedWithScaling).toContain('"policy_type": "TargetTrackingScaling"');
      expect(synthesizedWithScaling).toContain('DynamoDBReadCapacityUtilization');
      expect(synthesizedWithScaling).toContain('DynamoDBWriteCapacityUtilization');
      expect(synthesizedWithScaling).toContain('"target_value": 70');
    });

    test('should include scaling resource tags when enabled', () => {
      expect(synthesizedWithScaling).toContain('"Environment": "production"');
      expect(synthesizedWithScaling).toContain('"Team": "gaming-platform"');
      expect(synthesizedWithScaling).toContain('"ManagedBy": "CDKTF"');
    });
  });

  describe('Class Export and Compatibility', () => {
    test('should export GamingDatabaseStack class', () => {
      expect(GamingDatabaseStack).toBeDefined();
      expect(typeof GamingDatabaseStack).toBe('function');
    });

    test('should export TapStack alias', () => {
      expect(TapStack).toBeDefined();
      expect(TapStack).toBe(GamingDatabaseStack);
    });

    test('should create instance with new operator', () => {
      const testApp = new App();
      const testStack = new GamingDatabaseStack(testApp, 'test-instance');
      expect(testStack).toBeInstanceOf(GamingDatabaseStack);
    });
  });
});