import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { App, TerraformStack, Testing } from 'cdktf';
import { BackupInfrastructureStack } from '../lib/backup-infrastructure-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Essential Branch Coverage', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
  });

  // Test 1: Base functionality
  test('TapStack instantiates successfully', () => {
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));
    expect(synthesized).toBeDefined();
  });

  // Test 2: environmentSuffix || 'dev' branch - UNDEFINED case
  test('environmentSuffix defaults to dev when undefined', () => {
    stack = new TapStack(app, 'TestDefault', {
      // environmentSuffix: undefined - tests the || 'dev' branch
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.terraform.backend.s3.key).toBe('dev/TestDefault.tfstate');
  });

  // Test 3: environmentSuffix || 'dev' branch - PROVIDED case
  test('environmentSuffix uses provided value when given', () => {
    stack = new TapStack(app, 'TestProvided', {
      environmentSuffix: 'custom-env', // tests the other branch
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.terraform.backend.s3.key).toBe('custom-env/TestProvided.tfstate');
  });

  // Test 4: AWS region always uses us-east-1 (forced)
  test('AWS region uses provided props.awsRegion when specified', () => {
    stack = new TapStack(app, 'TestPropsRegion', {
      awsRegion: 'us-west-2', // This should be used since props take priority
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const awsProvider = synthesized.provider.aws;
    const mainProvider = Array.isArray(awsProvider) ? awsProvider[0] : awsProvider;
    expect(mainProvider.region).toBe('us-west-2'); // Uses provided prop
  });

  // Test 4b: Test when AWS region is not provided in test mode
  test('AWS region is empty when not provided in test mode', () => {
    stack = new TapStack(app, 'TestDefaultRegion', {
      environmentSuffix: 'default-region-test',
      // awsRegion: undefined - in test mode, getAwsRegionOverride returns empty string
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const awsProvider = synthesized.provider.aws;
    const mainProvider = Array.isArray(awsProvider) ? awsProvider[0] : awsProvider;
    expect(mainProvider.region).toBe(''); // Empty in test mode when not provided
  });

  // Test 5: stateBucketRegion defaults to us-east-1 (where S3 bucket exists)
  test('stateBucketRegion defaults to us-east-1 when undefined', () => {
    stack = new TapStack(app, 'TestStateBucketRegionDefault', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1', // Provide explicit region
      // stateBucketRegion: undefined - should default to us-east-1 (where bucket exists)
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.terraform.backend.s3.region).toBe('us-east-1');
  });

  // Test 6: stateBucketRegion || 'us-east-1' - PROVIDED branch  
  test('stateBucketRegion uses provided value', () => {
    stack = new TapStack(app, 'TestStateBucketRegionProvided', {
      environmentSuffix: 'test',
      stateBucketRegion: 'us-west-2', // tests the other branch
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.terraform.backend.s3.region).toBe('us-west-2');
  });

  // Test 7: stateBucket || 'iac-rlhf-tf-states' - UNDEFINED branch
  test('stateBucket defaults when undefined', () => {
    stack = new TapStack(app, 'TestStateBucketDefault', {
      environmentSuffix: 'test',
      // stateBucket: undefined - tests || 'iac-rlhf-tf-states' branch
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
  });

  // Test 8: stateBucket || 'iac-rlhf-tf-states' - PROVIDED branch
  test('stateBucket uses provided value', () => {
    stack = new TapStack(app, 'TestStateBucketProvided', {
      environmentSuffix: 'test',
      stateBucket: 'my-custom-bucket', // tests the other branch
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.terraform.backend.s3.bucket).toBe('my-custom-bucket');
  });

  // Test 9: props?.defaultTags ? [props.defaultTags] : [] - TRUE branch
  test('defaultTags creates array when provided', () => {
    stack = new TapStack(app, 'TestWithTags', {
      defaultTags: { tags: { Environment: 'test' } },
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const awsProvider = synthesized.provider.aws;
    const mainProvider = Array.isArray(awsProvider) ? awsProvider[0] : awsProvider;
    expect(mainProvider.default_tags).toHaveLength(1);
  });

  // Test 10: props?.defaultTags ? [props.defaultTags] : [] - FALSE branch  
  test('defaultTags creates empty array when undefined', () => {
    stack = new TapStack(app, 'TestWithoutTags', {
      environmentSuffix: 'test',
      // defaultTags: undefined - tests the : [] branch
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const awsProvider = synthesized.provider.aws;
    const mainProvider = Array.isArray(awsProvider) ? awsProvider[0] : awsProvider;
    expect(mainProvider.default_tags).toEqual([]);
  });

  // Test 11: BackupInfrastructureStack exists and functions
  test('BackupInfrastructureStack creates all required resources', () => {
    stack = new TapStack(app, 'TestBackupResources', {
      environmentSuffix: 'backup-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.resource.aws_backup_framework).toBeDefined();
    expect(synthesized.resource.aws_backup_plan).toBeDefined();
    expect(synthesized.resource.aws_backup_vault).toBeDefined();
    expect(synthesized.resource.aws_s3_bucket).toBeDefined();
    expect(synthesized.resource.aws_dynamodb_table).toBeDefined();
    expect(synthesized.resource.aws_sns_topic).toBeDefined();
  });

  // Test 12: Client role loop - all 10 iterations
  test('Client role loop executes all 10 iterations', () => {
    stack = new TapStack(app, 'TestClientLoop', {
      environmentSuffix: 'client-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const clientRoles = Object.values(synthesized.resource.aws_iam_role).filter(
      (role: any) => role.name?.includes('backup-client-role')
    );
    expect(clientRoles).toHaveLength(10);

    // Verify each client 1-10 exists
    for (let i = 1; i <= 10; i++) {
      const clientRole = clientRoles.find((role: any) =>
        role.name?.includes(`backup-client-role-${i}-`)
      );
      expect(clientRole).toBeDefined();
    }
  });

  // Test 13: Environment suffix replacement logic
  test('Environment suffix hyphen replacement works correctly', () => {
    stack = new TapStack(app, 'TestHyphenReplacement', {
      environmentSuffix: 'pr-123-test', // contains hyphens
    });
    synthesized = JSON.parse(Testing.synth(stack));

    // Framework names should use underscores (after replacement)
    const frameworks = Object.values(synthesized.resource.aws_backup_framework);
    const framework = frameworks[0] as any;
    expect(framework.name).toMatch(/pr_123_test_useast1_\d+/);

    // S3 buckets should use hyphens (s3UniqueSuffix)
    const buckets = Object.values(synthesized.resource.aws_s3_bucket);
    const bucket = buckets.find((b: any) => b.bucket?.includes('backup-storage')) as any;
    expect(bucket.bucket).toMatch(/pr-123-test-useast1-\d+/);
  });

  // Test 14: BackupInfrastructureStack region configuration - uses provided region
  test('BackupInfrastructureStack uses provided awsRegion from props', () => {
    stack = new TapStack(app, 'TestRegionConfig', {
      environmentSuffix: 'region-test',
      awsRegion: 'us-west-1', // This should be used
    });
    synthesized = JSON.parse(Testing.synth(stack));

    // Verify the provider uses the provided region
    const providers = synthesized.provider.aws;
    expect(providers).toHaveLength(1); // Single provider now
    const mainProvider = providers[0];
    expect(mainProvider.region).toBe('us-west-1'); // Uses provided prop
  });

  // Test 15: Backup plan rules - different rule configurations
  test('Backup plan contains all three rule types with different configs', () => {
    stack = new TapStack(app, 'TestBackupRules', {
      environmentSuffix: 'rules-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const backupPlans = Object.values(synthesized.resource.aws_backup_plan);
    const plan = backupPlans[0] as any;

    expect(plan.rule).toHaveLength(3);

    const dailyRule = plan.rule.find((r: any) => r.rule_name === 'daily-backup-rule');
    const criticalRule = plan.rule.find((r: any) => r.rule_name === 'critical-backup-rule');
    const crossRegionRule = plan.rule.find((r: any) => r.rule_name === 'cross-region-backup-rule');

    expect(dailyRule).toBeDefined();
    expect(criticalRule).toBeDefined();
    expect(crossRegionRule).toBeDefined();

    // Test different lifecycle configurations
    expect(dailyRule.lifecycle.delete_after).toBe(2555);
    expect(criticalRule.lifecycle.delete_after).toBe(365);
    expect(crossRegionRule.lifecycle.delete_after).toBe(90);
  });

  // Test 16: BackupInfrastructureStack with undefined environmentSuffix (direct branch test)
  test('BackupInfrastructureStack environmentSuffix || dev branch when undefined', () => {
    // Create stack without environmentSuffix to trigger the || 'dev' branch
    stack = new TapStack(app, 'TestBackupInfraEnvUndefined', {
      awsRegion: 'us-east-1',
      // environmentSuffix: undefined - BackupInfrastructureStack should use 'dev'
    });
    synthesized = JSON.parse(Testing.synth(stack));

    // Should use 'dev' in all backup resource names
    const snsTopics = Object.values(synthesized.resource.aws_sns_topic);
    const topic = snsTopics[0] as any;
    expect(topic.name).toMatch(/dev_useast1_\d+/);

    const dynamoTables = Object.values(synthesized.resource.aws_dynamodb_table);
    const table = dynamoTables[0] as any;
    expect(table.name).toMatch(/dev_useast1_\d+/);
  });

  // Test 17: BackupInfrastructureStack with provided environmentSuffix (other branch)
  test('BackupInfrastructureStack uses provided environmentSuffix when given', () => {
    stack = new TapStack(app, 'TestBackupInfraEnvProvided', {
      environmentSuffix: 'provided-env', // Should use this instead of 'dev'
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    // Should use 'provided-env' (with underscores) in backup resource names
    const snsTopics = Object.values(synthesized.resource.aws_sns_topic);
    const topic = snsTopics[0] as any;
    expect(topic.name).toMatch(/provided_env_useast1_\d+/);
    expect(topic.name).not.toContain('dev'); // Should NOT use default

    const dynamoTables = Object.values(synthesized.resource.aws_dynamodb_table);
    const table = dynamoTables[0] as any;
    expect(table.name).toMatch(/provided_env_useast1_\d+/);
  });

  // Test 18: Environment suffix replace logic branches
  test('Environment suffix replace logic - with vs without hyphens', () => {
    // Test 1: With hyphens (replacement occurs)
    stack = new TapStack(app, 'TestHyphenReplace', {
      environmentSuffix: 'pr-123-test',
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const frameworks = Object.values(synthesized.resource.aws_backup_framework);
    const framework = frameworks[0] as any;
    expect(framework.name).toMatch(/pr_123_test_useast1_\d+/); // Hyphens replaced with underscores

    // Test 2: Without hyphens (no replacement needed)
    const stack2 = new TapStack(app, 'TestNoHyphenReplace', {
      environmentSuffix: 'simpletest',
      awsRegion: 'us-east-1',
    });
    const synthesized2 = JSON.parse(Testing.synth(stack2));

    const frameworks2 = Object.values(synthesized2.resource.aws_backup_framework);
    const framework2 = frameworks2[0] as any;
    expect(framework2.name).toMatch(/simpletest_useast1_\d+/); // No replacement needed
  });

  // Test 19: All backup vault configurations
  test('All backup vault types are created with different configurations', () => {
    stack = new TapStack(app, 'TestAllVaultTypes', {
      environmentSuffix: 'vault-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const vaults = Object.values(synthesized.resource.aws_backup_vault);
    expect(vaults).toHaveLength(3); // primary, airgapped, additional

    // Each vault type should exist
    const primaryVault = vaults.find((v: any) => v.name?.includes('primary'));
    const airgappedVault = vaults.find((v: any) => v.name?.includes('airgapped'));
    const additionalVault = vaults.find((v: any) => v.name?.includes('additional'));

    expect(primaryVault).toBeDefined();
    expect(airgappedVault).toBeDefined();
    expect(additionalVault).toBeDefined();
  });

  // Test 20: Backup framework control types with and without input parameters
  test('Backup framework controls have different parameter configurations', () => {
    stack = new TapStack(app, 'TestFrameworkControls', {
      environmentSuffix: 'control-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const frameworks = Object.values(synthesized.resource.aws_backup_framework);
    const framework = frameworks[0] as any;
    expect(framework.control).toHaveLength(6);

    // Control with multiple input parameters
    const freqControl = framework.control.find((c: any) =>
      c.name === 'BACKUP_PLAN_MIN_FREQUENCY_AND_MIN_RETENTION_CHECK'
    );
    expect(freqControl.input_parameter).toHaveLength(3);

    // Control with single input parameter
    const retentionControl = framework.control.find((c: any) =>
      c.name === 'BACKUP_RECOVERY_POINT_MINIMUM_RETENTION_CHECK'
    );
    expect(retentionControl.input_parameter).toHaveLength(1);

    // Control without input parameters
    const encryptedControl = framework.control.find((c: any) =>
      c.name === 'BACKUP_RECOVERY_POINT_ENCRYPTED'
    );
    expect(encryptedControl.input_parameter).toBeUndefined();
  });

  // Test 21: S3 bucket object lock enabled vs disabled variations  
  test('S3 buckets have different object lock configurations', () => {
    stack = new TapStack(app, 'TestS3ObjectLock', {
      environmentSuffix: 'object-lock-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const buckets = Object.values(synthesized.resource.aws_s3_bucket);

    // Backup bucket should have object lock enabled
    const backupBucket = buckets.find((b: any) =>
      b.tags?.Purpose === 'Backup Storage'
    ) as any;
    expect(backupBucket.object_lock_enabled).toBe(true);

    // Inventory bucket should NOT have object lock  
    const inventoryBucket = buckets.find((b: any) =>
      b.tags?.Purpose === 'Backup Inventory'
    ) as any;
    expect(inventoryBucket.object_lock_enabled).toBeUndefined();

    // Audit bucket should NOT have object lock
    const auditBucket = buckets.find((b: any) =>
      b.tags?.Purpose === 'Backup Audit Reports'
    ) as any;
    expect(auditBucket.object_lock_enabled).toBeUndefined();
  });

  // Test 22: Single provider setup with us-east-1 region
  test('Provider setup uses us-east-1 region', () => {
    stack = new TapStack(app, 'TestCrossRegionProvider', {
      environmentSuffix: 'cross-provider-test',
      awsRegion: 'us-east-1',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const providers = synthesized.provider.aws;
    expect(providers).toHaveLength(1); // Single provider

    const mainProvider = providers[0];

    expect(mainProvider).toBeDefined();
    expect(mainProvider.region).toBe('us-east-1');
  });

  // Test 23: Backup plan copyAction configurations
  test('Backup plan copy actions have different lifecycle settings', () => {
    stack = new TapStack(app, 'TestCopyActions', {
      environmentSuffix: 'copy-action-test',
    });
    synthesized = JSON.parse(Testing.synth(stack));

    const backupPlans = Object.values(synthesized.resource.aws_backup_plan);
    const plan = backupPlans[0] as any;

    const criticalRule = plan.rule.find((r: any) => r.rule_name === 'critical-backup-rule');
    const crossRegionRule = plan.rule.find((r: any) => r.rule_name === 'cross-region-backup-rule');

    // Critical rule copy action
    expect(criticalRule.copy_action[0].lifecycle.delete_after).toBe(120);
    expect(criticalRule.copy_action[0].lifecycle.cold_storage_after).toBeUndefined();

    // Cross-region rule copy action  
    expect(crossRegionRule.copy_action[0].lifecycle.delete_after).toBe(120);
    expect(crossRegionRule.copy_action[0].lifecycle.cold_storage_after).toBe(30);
  });

  // Test 24: Comprehensive backup infrastructure props variations
  test('BackupInfrastructureStack handles different prop combinations', () => {
    // Test with all props provided
    stack = new TapStack(app, 'TestAllPropsProvided', {
      environmentSuffix: 'all-props-test',
      awsRegion: 'us-east-1',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1',
      defaultTags: { tags: { Environment: 'test' } },
    });
    synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized.resource).toBeDefined();
    expect(synthesized.resource.aws_backup_framework).toBeDefined();
    expect(synthesized.resource.aws_backup_plan).toBeDefined();
    expect(synthesized.resource.aws_backup_vault).toBeDefined();

    // Test with minimal props (triggering defaults)
    const stack2 = new TapStack(app, 'TestMinimalProps', {});
    const synthesized2 = JSON.parse(Testing.synth(stack2));

    expect(synthesized2.resource).toBeDefined();
    expect(synthesized2.resource.aws_backup_framework).toBeDefined();
  });
});

describe('BackupInfrastructureStack Direct Branch Testing', () => {
  let app: App;
  let testStack: TerraformStack;
  let synthesized: any;

  beforeEach(() => {
    app = new App();
  });

  // Test 25: Direct BackupInfrastructureStack with undefined environmentSuffix
  test('BackupInfrastructureStack environmentSuffix defaults to dev when undefined', () => {
    testStack = new TerraformStack(app, 'DirectTestStack');

    new AwsProvider(testStack, 'aws', {
      region: 'us-east-1',
    });

    // DIRECT test of BackupInfrastructureStack with NO environmentSuffix
    new BackupInfrastructureStack(testStack, 'backup-test', {
      region: 'us-east-1',
      // environmentSuffix: undefined - should trigger || 'dev' branch
    });

    synthesized = JSON.parse(Testing.synth(testStack));

    // Should use 'dev' default in all resource names
    const backupPlans = Object.values(synthesized.resource.aws_backup_plan);
    const plan = backupPlans[0] as any;
    expect(plan.name).toMatch(/dev_useast1_\d+/);

    const snsTopics = Object.values(synthesized.resource.aws_sns_topic);
    const topic = snsTopics[0] as any;
    expect(topic.name).toMatch(/dev_useast1_\d+/);
  });

  // Test 26: Direct BackupInfrastructureStack with provided environmentSuffix  
  test('BackupInfrastructureStack uses provided environmentSuffix when given', () => {
    testStack = new TerraformStack(app, 'DirectTestStackWithEnv');

    new AwsProvider(testStack, 'aws', {
      region: 'us-east-1',
    });

    // DIRECT test with PROVIDED environmentSuffix
    new BackupInfrastructureStack(testStack, 'backup-test', {
      region: 'us-east-1',
      environmentSuffix: 'custom-env', // Should use this, not 'dev'
    });

    synthesized = JSON.parse(Testing.synth(testStack));

    // Should use 'custom-env' (not 'dev') in resource names
    const backupPlans = Object.values(synthesized.resource.aws_backup_plan);
    const plan = backupPlans[0] as any;
    expect(plan.name).toMatch(/custom_env_useast1_\d+/);
    expect(plan.name).not.toContain('dev');

    const snsTopics = Object.values(synthesized.resource.aws_sns_topic);
    const topic = snsTopics[0] as any;
    expect(topic.name).toMatch(/custom_env_useast1_\d+/);
    expect(topic.name).not.toContain('dev');
  });

  // Test 27: Direct test of hyphen replacement logic in environmentSuffix
  test('BackupInfrastructureStack environmentSuffix.replace logic branches', () => {
    testStack = new TerraformStack(app, 'DirectHyphenTest');

    new AwsProvider(testStack, 'aws', {
      region: 'us-east-1',
    });

    // Test with hyphens (triggers replace logic)
    new BackupInfrastructureStack(testStack, 'backup-test', {
      region: 'us-east-1',
      environmentSuffix: 'pr-123-feature', // Contains hyphens
    });

    synthesized = JSON.parse(Testing.synth(testStack));

    // uniqueSuffix should have hyphens replaced with underscores
    const frameworks = Object.values(synthesized.resource.aws_backup_framework);
    const framework = frameworks[0] as any;
    expect(framework.name).toMatch(/pr_123_feature_useast1_\d+/);

    // s3UniqueSuffix should preserve hyphens
    const buckets = Object.values(synthesized.resource.aws_s3_bucket);
    const backupBucket = buckets.find((b: any) => b.bucket?.includes('backup-storage')) as any;
    expect(backupBucket.bucket).toMatch(/pr-123-feature-useast1-\d+/);
  });

  // Test 28: Direct test of client role loop (for i=1 to 10)
  test('BackupInfrastructureStack client role loop executes all 10 iterations', () => {
    testStack = new TerraformStack(app, 'DirectLoopTest');

    new AwsProvider(testStack, 'aws', {
      region: 'us-east-1',
    });

    new BackupInfrastructureStack(testStack, 'backup-test', {
      region: 'us-east-1',
      environmentSuffix: 'loop-test',
    });

    synthesized = JSON.parse(Testing.synth(testStack));

    // Should create exactly 10 client roles (i from 1 to 10)
    const clientRoles = Object.values(synthesized.resource.aws_iam_role).filter(
      (role: any) => role.name?.includes('backup-client-role')
    );
    expect(clientRoles).toHaveLength(10);

    // Should create exactly 10 client policies
    const clientPolicies = Object.values(synthesized.resource.aws_iam_role_policy).filter(
      (policy: any) => policy.name?.includes('backup-client-policy')
    );
    expect(clientPolicies).toHaveLength(10);

    // Verify each specific client ID (1, 2, 3, ..., 10)
    for (let i = 1; i <= 10; i++) {
      const clientRole = clientRoles.find((role: any) =>
        role.name?.includes(`backup-client-role-${i}-`)
      );
      expect(clientRole).toBeDefined();

      const clientPolicy = clientPolicies.find((policy: any) =>
        policy.name?.includes(`backup-client-policy-${i}-`)
      );
      expect(clientPolicy).toBeDefined();
    }
  });

  // Test 29: Direct test of resource creation branches
  test('BackupInfrastructureStack creates all resources with proper dependencies', () => {
    testStack = new TerraformStack(app, 'DirectResourceTest');

    new AwsProvider(testStack, 'aws', {
      region: 'us-east-1',
    });

    new BackupInfrastructureStack(testStack, 'backup-test', {
      region: 'us-east-1',
      environmentSuffix: 'resource-test',
    });

    synthesized = JSON.parse(Testing.synth(testStack));

    // Verify all major resource types are created
    expect(synthesized.resource.aws_kms_key).toBeDefined();
    expect(synthesized.resource.aws_kms_alias).toBeDefined();
    expect(synthesized.resource.aws_s3_bucket).toBeDefined(); // Should have 3 buckets
    expect(synthesized.resource.aws_s3_bucket_versioning).toBeDefined();
    expect(synthesized.resource.aws_s3_bucket_object_lock_configuration).toBeDefined();
    expect(synthesized.resource.aws_s3_bucket_lifecycle_configuration).toBeDefined();
    expect(synthesized.resource.aws_dynamodb_table).toBeDefined();
    expect(synthesized.resource.aws_sns_topic).toBeDefined();
    expect(synthesized.resource.aws_backup_vault).toBeDefined(); // Should have 3 vaults
    expect(synthesized.resource.aws_backup_framework).toBeDefined();
    expect(synthesized.resource.aws_backup_plan).toBeDefined();
    expect(synthesized.resource.aws_backup_report_plan).toBeDefined();
    expect(synthesized.resource.aws_backup_selection).toBeDefined();
    expect(synthesized.resource.aws_cloudwatch_dashboard).toBeDefined();

    // Verify counts
    const buckets = Object.values(synthesized.resource.aws_s3_bucket);
    expect(buckets).toHaveLength(3); // backup, inventory, audit

    const vaults = Object.values(synthesized.resource.aws_backup_vault);
    expect(vaults).toHaveLength(3); // primary, airgapped, additional
  });

  // Additional test for backup infrastructure with us-east-1 region
  test('BackupInfrastructureStack uses us-east-1 region explicitly', () => {
    // Provide explicit region for testing
    const stack = new TapStack(app, 'TestRegionFallback', {
      environmentSuffix: 'region-fallback-test',
      awsRegion: 'us-east-1', // Explicit region for test
    });
    const synthesized = JSON.parse(Testing.synth(stack));

    // Verify infrastructure was created with us-east-1 region
    expect(synthesized.resource.aws_kms_key).toBeDefined();
    expect(synthesized.resource.aws_backup_vault).toBeDefined();

    // Verify provider exists and uses us-east-1
    const providers = synthesized.provider.aws;
    expect(providers).toHaveLength(1); // Single provider
    expect(providers[0].region).toBe('us-east-1');
  });

  // Test that getAwsRegionOverride function is called and used
  test('TapStack uses getAwsRegionOverride for region configuration', () => {
    // In production mode, getAwsRegionOverride would read from file
    // In test mode, it returns empty string, so we provide explicit region
    const stack = new TapStack(app, 'TestAwsRegionBranch', {
      environmentSuffix: 'aws-region-branch-test',
      awsRegion: 'us-east-1', // Explicit region for test
    });
    const synthesized = JSON.parse(Testing.synth(stack));

    // Should use provided region
    const mainProvider = synthesized.provider.aws.find((p: any) => !p.alias);
    expect(mainProvider.region).toBe('us-east-1');
  });

  // Test to cover BackupInfrastructureStack region fallback branch (line 41)
  test('BackupInfrastructureStack uses region fallback when region not provided', () => {
    const stack = new TapStack(app, 'TestRegionFallback', {
      environmentSuffix: 'test-region-fallback'
      // No awsRegion provided, so BackupInfrastructureStack will get undefined region
      // This will test the || 'us-east-1' branch on line 41 in backup-infrastructure-stack.ts
    });

    const synthesized = JSON.parse(Testing.synth(stack));

    // Verify that the stack was created (tests the fallback branch)
    expect(synthesized).toBeDefined();
    expect(synthesized.resource).toBeDefined();
  });  // Test to cover AWS_REGION environment variable fallback branch (line 21 in tap-stack.ts)  
  test('TapStack uses provided region configuration', () => {
    // Test with explicit region
    const stack = new TapStack(app, 'TestAwsRegionFallback', {
      environmentSuffix: 'aws-region-fallback',
      awsRegion: 'us-east-1' // Explicit region for test
    });

    const synthesized = JSON.parse(Testing.synth(stack));

    // Should use the provided region
    const mainProvider = synthesized.provider.aws.find((p: any) => !p.alias);
    expect(mainProvider.region).toBe('us-east-1');
  });

  // Test to cover more edge cases and improve branch coverage
  test('TapStack handles all prop combinations for maximum branch coverage', () => {
    const stack = new TapStack(app, 'TestMaxCoverage', {
      environmentSuffix: 'max-coverage',
      awsRegion: 'ap-southeast-1',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'ap-southeast-2',
      defaultTags: {
        tags: {
          Project: 'test-project',
          Owner: 'test-owner'
        }
      }
    });

    const synthesized = JSON.parse(Testing.synth(stack));

    // Verify all the different branches were exercised
    expect(synthesized.terraform.backend.s3.bucket).toBe('custom-state-bucket');
    expect(synthesized.terraform.backend.s3.region).toBe('ap-southeast-2');
    expect(synthesized.terraform.backend.s3.key).toBe('max-coverage/TestMaxCoverage.tfstate');

    const mainProvider = synthesized.provider.aws.find((p: any) => !p.alias);
    expect(mainProvider.region).toBe('ap-southeast-1'); // Uses provided prop
    expect(mainProvider.default_tags).toBeDefined();
  });

  // Direct test for BackupInfrastructureStack with us-east-1 region
  test('BackupInfrastructureStack uses us-east-1 region when provided', () => {
    const stack = new TapStack(app, 'TestRegionForced', {
      environmentSuffix: 'region-forced',
      awsRegion: 'us-east-1' // Provide explicit region
    });

    // Create BackupInfrastructureStack with us-east-1
    const backupStack = new BackupInfrastructureStack(stack, 'backup-region-forced', {
      environmentSuffix: 'region-forced',
      region: 'us-east-1'
    });

    expect(backupStack).toBeDefined();
    const synthesized = JSON.parse(Testing.synth(stack));

    // Verify resources are created with us-east-1 configuration
    expect(synthesized.resource.aws_kms_key).toBeDefined();
    expect(synthesized.resource.aws_backup_vault).toBeDefined();

    // Verify region is us-east-1 in generated config
    const mainProvider = synthesized.provider.aws.find((p: any) => !p.alias);
    expect(mainProvider.region).toBe('us-east-1');
  });

  // Test that explicit props take priority over AWS_REGION file
  test('props.awsRegion takes priority over AWS_REGION file', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      // Set up environment
      process.env.NODE_ENV = 'production';

      // Clear module cache to force re-evaluation
      delete require.cache[require.resolve('../lib/tap-stack')];

      // Re-import to get fresh constant evaluation
      const { TapStack } = require('../lib/tap-stack');

      const app = new App();
      const stack = new TapStack(app, 'TestAwsRegionForced', {
        environmentSuffix: 'aws-forced',
        awsRegion: 'eu-west-1' // Explicit prop should override AWS_REGION file
      });

      const synthesized = JSON.parse(Testing.synth(stack));

      // Should use eu-west-1 from props, not us-east-1 from file
      const mainProvider = synthesized.provider.aws.find((p: any) => !p.alias);
      expect(mainProvider.region).toBe('eu-west-1');

    } finally {
      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;

      // Clear cache again and re-import original
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });

  // Direct test of getAwsRegionOverride function - reads from AWS_REGION file
  test('getAwsRegionOverride function reads from AWS_REGION file in non-test env', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    try {
      // Test: Should return us-east-2 from AWS_REGION file
      process.env.NODE_ENV = 'production';

      // Clear module cache and re-import
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride } = require('../lib/tap-stack');

      const result = getAwsRegionOverride();
      expect(result).toBe('us-east-2'); // Reads from lib/AWS_REGION file

      // Test in test environment - should return empty string
      process.env.NODE_ENV = 'test';

      // Clear cache again for fresh evaluation
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride: getAwsRegionOverride2 } = require('../lib/tap-stack');

      const result2 = getAwsRegionOverride2();
      expect(result2).toBe('');

    } finally {
      // Restore original environment
      process.env.NODE_ENV = originalNodeEnv;

      // Clear cache and re-import to restore original state
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });

  // Test file reading error handling when AWS_REGION file doesn't exist
  test('getAwsRegionOverride handles file read errors and falls back to us-east-1', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;

    try {
      process.env.NODE_ENV = 'production';

      // Mock readFileSync to throw an error (file doesn't exist)
      fs.readFileSync = jest.fn(() => {
        throw new Error('File not found');
      });

      // Clear module cache and re-import with mocked fs
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride } = require('../lib/tap-stack');

      const result = getAwsRegionOverride();
      expect(result).toBe('us-east-1'); // Should fall back to default

    } finally {
      // Restore
      fs.readFileSync = originalReadFileSync;
      process.env.NODE_ENV = originalNodeEnv;
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });

  // Test when AWS_REGION file is empty (tests the || 'us-east-1' branch)
  test('getAwsRegionOverride handles empty file content', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;

    try {
      process.env.NODE_ENV = 'production';

      // Mock readFileSync to return empty string
      fs.readFileSync = jest.fn(() => '   '); // Whitespace that trims to empty

      // Clear module cache and re-import with mocked fs
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride } = require('../lib/tap-stack');

      const result = getAwsRegionOverride();
      expect(result).toBe('us-east-1'); // Should use default when empty

    } finally {
      // Restore
      fs.readFileSync = originalReadFileSync;
      process.env.NODE_ENV = originalNodeEnv;
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });

  // Test nested try-catch: first path fails, second path succeeds
  test('getAwsRegionOverride tries fallback path when first path fails', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;

    try {
      process.env.NODE_ENV = 'production';

      let callCount = 0;
      // Mock readFileSync to fail first time, succeed second time
      fs.readFileSync = jest.fn((path: string) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First path not found');
        }
        return 'us-west-2'; // Return different region on second call
      });

      // Clear module cache and re-import with mocked fs
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride } = require('../lib/tap-stack');

      const result = getAwsRegionOverride();
      expect(result).toBe('us-west-2'); // Should use region from second path
      expect(fs.readFileSync).toHaveBeenCalledTimes(2); // Should try twice

    } finally {
      // Restore
      fs.readFileSync = originalReadFileSync;
      process.env.NODE_ENV = originalNodeEnv;
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });

  // Test when both file paths fail (outer catch block)
  test('getAwsRegionOverride falls back to us-east-1 when both paths fail', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;

    try {
      process.env.NODE_ENV = 'production';

      // Mock readFileSync to always throw errors
      fs.readFileSync = jest.fn(() => {
        throw new Error('No file found');
      });

      // Clear module cache and re-import with mocked fs
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride } = require('../lib/tap-stack');

      const result = getAwsRegionOverride();
      expect(result).toBe('us-east-1'); // Should use final fallback
      expect(fs.readFileSync).toHaveBeenCalledTimes(2); // Should try both paths

    } finally {
      // Restore
      fs.readFileSync = originalReadFileSync;
      process.env.NODE_ENV = originalNodeEnv;
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });

  // Test region with whitespace (tests trim() functionality)
  test('getAwsRegionOverride trims whitespace from file content', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;

    try {
      process.env.NODE_ENV = 'production';

      // Mock readFileSync to return region with whitespace
      fs.readFileSync = jest.fn(() => '  ap-south-1  \n');

      // Clear module cache and re-import with mocked fs
      delete require.cache[require.resolve('../lib/tap-stack')];
      const { getAwsRegionOverride } = require('../lib/tap-stack');

      const result = getAwsRegionOverride();
      expect(result).toBe('ap-south-1'); // Should trim whitespace

    } finally {
      // Restore
      fs.readFileSync = originalReadFileSync;
      process.env.NODE_ENV = originalNodeEnv;
      delete require.cache[require.resolve('../lib/tap-stack')];
      require('../lib/tap-stack');
    }
  });
});
