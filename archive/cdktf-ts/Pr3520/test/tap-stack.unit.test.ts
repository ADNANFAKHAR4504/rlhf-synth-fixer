import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Initialization', () => {
    test('TapStack instantiates successfully with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'prod',
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Environment: 'prod',
            Project: 'test',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized.terraform.backend.s3.bucket).toBe('custom-state-bucket');
      expect(synthesized.terraform.backend.s3.key).toContain('prod');
    });

    test('TapStack uses default values when no props provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTapStackDefault');
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
      expect(synthesized.provider.aws[0].region).toBe('us-west-2'); // AWS_REGION_OVERRIDE
      expect(synthesized.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(synthesized.terraform.backend.s3.key).toContain('dev');
    });

    test('TapStack creates all required sub-stacks', () => {
      app = new App();
      stack = new TapStack(app, 'TestCompleteStack', {
        environmentSuffix: 'test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Check for IAM roles - use partial matching due to hash suffixes
      expect(synthesized.resource.aws_iam_role).toBeDefined();
      const iamRoleKeys = Object.keys(synthesized.resource.aws_iam_role);
      expect(iamRoleKeys.some((key) => key.includes('build-system-role'))).toBe(true);
      expect(iamRoleKeys.some((key) => key.includes('cleanup-lambda-role'))).toBe(true);

      // Check for S3 resources
      expect(synthesized.resource.aws_s3_bucket).toBeDefined();
      const s3BucketKeys = Object.keys(synthesized.resource.aws_s3_bucket);
      expect(s3BucketKeys.some((key) => key.includes('artifact-bucket'))).toBe(true);

      // Check for DynamoDB table
      expect(synthesized.resource.aws_dynamodb_table).toBeDefined();
      const dynamoKeys = Object.keys(synthesized.resource.aws_dynamodb_table);
      expect(dynamoKeys.some((key) => key.includes('artifact-metadata-table'))).toBe(true);

      // Check for Lambda function
      expect(synthesized.resource.aws_lambda_function).toBeDefined();
      const lambdaKeys = Object.keys(synthesized.resource.aws_lambda_function);
      expect(lambdaKeys.some((key) => key.includes('cleanup-function'))).toBe(true);

      // Check for CodeArtifact resources
      expect(synthesized.resource.aws_codeartifact_domain).toBeDefined();
      expect(synthesized.resource.aws_codeartifact_repository).toBeDefined();

      // Check for CloudWatch resources
      expect(synthesized.resource.aws_cloudwatch_dashboard).toBeDefined();
      expect(synthesized.resource.aws_cloudwatch_metric_alarm).toBeDefined();

      // Check for EventBridge rule
      expect(synthesized.resource.aws_cloudwatch_event_rule).toBeDefined();
      const eventRuleKeys = Object.keys(synthesized.resource.aws_cloudwatch_event_rule);
      expect(eventRuleKeys.some((key) => key.includes('cleanup-schedule'))).toBe(true);
    });

    test('Backend configuration is properly set', () => {
      app = new App();
      stack = new TapStack(app, 'TestBackendConfig', {
        environmentSuffix: 'backend-test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'eu-west-1',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const backend = synthesized.terraform.backend.s3;
      expect(backend.bucket).toBe('test-bucket');
      expect(backend.region).toBe('eu-west-1');
      expect(backend.encrypt).toBe(true);
      expect(backend.key).toBe('backend-test/TestBackendConfig.tfstate');
    });

    test('AWS Provider is configured correctly', () => {
      app = new App();
      stack = new TapStack(app, 'TestProvider', {
        defaultTags: {
          tags: {
            Team: 'DevOps',
            CostCenter: '1234',
          },
        },
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const provider = synthesized.provider.aws[0];
      expect(provider.region).toBe('us-west-2');
      expect(provider.default_tags).toEqual([
        {
          tags: {
            Team: 'DevOps',
            CostCenter: '1234',
          },
        },
      ]);
    });
  });

  describe('Resource Naming', () => {
    test('Resources include environment suffix in names', () => {
      app = new App();
      const envSuffix = 'naming-test';
      stack = new TapStack(app, 'TestNaming', {
        environmentSuffix: envSuffix,
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      // Check IAM role naming
      const buildRole = findResource(synthesized.resource.aws_iam_role, 'build-system-role');
      expect(buildRole).toBeDefined();
      expect(buildRole.name).toContain(envSuffix);

      // Check DynamoDB table naming
      const dynamoTable = findResource(synthesized.resource.aws_dynamodb_table, 'artifact-metadata-table');
      expect(dynamoTable).toBeDefined();
      expect(dynamoTable.name).toContain(envSuffix);

      // Check Lambda function naming
      const lambdaFunction = findResource(synthesized.resource.aws_lambda_function, 'cleanup-function');
      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.function_name).toContain(envSuffix);

      // Check CodeArtifact domain naming
      const codeArtifactDomain = findResource(synthesized.resource.aws_codeartifact_domain, 'artifact-domain');
      expect(codeArtifactDomain).toBeDefined();
      expect(codeArtifactDomain.domain).toContain(envSuffix);

      // Check CloudWatch alarm naming
      const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.alarm_name).toContain(envSuffix);
      });
    });
  });

  describe('Stack Dependencies', () => {
    test('Resources have correct dependencies', () => {
      app = new App();
      stack = new TapStack(app, 'TestDependencies', {
        environmentSuffix: 'dep-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      // Lambda should depend on IAM role
      const lambda = findResource(synthesized.resource.aws_lambda_function, 'cleanup-function');
      expect(lambda).toBeDefined();
      expect(lambda.role).toBeDefined();
      expect(lambda.role).toContain('aws_iam_role');
      expect(lambda.role).toContain('cleanup-lambda-role');

      // S3 bucket policy should reference the bucket
      const bucketPolicy = findResource(synthesized.resource.aws_s3_bucket_policy, 'artifact-bucket-policy');
      expect(bucketPolicy).toBeDefined();
      expect(bucketPolicy.bucket).toBeDefined();
      expect(bucketPolicy.bucket).toContain('aws_s3_bucket');
      expect(bucketPolicy.bucket).toContain('artifact-bucket');

      // CloudWatch alarms should reference their resources
      const s3Alarm = findResource(synthesized.resource.aws_cloudwatch_metric_alarm, 's3-storage-alarm');
      expect(s3Alarm).toBeDefined();
      expect(s3Alarm.dimensions.BucketName).toContain('aws_s3_bucket');

      // EventBridge target should reference Lambda
      const eventTarget = findResource(synthesized.resource.aws_cloudwatch_event_target, 'cleanup-schedule-target');
      expect(eventTarget).toBeDefined();
      expect(eventTarget.arn).toContain('aws_lambda_function');
      expect(eventTarget.arn).toContain('cleanup-function');
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket has proper encryption and versioning', () => {
      app = new App();
      stack = new TapStack(app, 'TestSecurity', {
        environmentSuffix: 'sec-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      // Check S3 bucket configuration
      const bucket = findResource(synthesized.resource.aws_s3_bucket, 'artifact-bucket');
      expect(bucket).toBeDefined();
      expect(bucket.object_lock_enabled).toBe(true);

      // Check versioning configuration
      const versioning = findResource(synthesized.resource.aws_s3_bucket_versioning, 'artifact-bucket-versioning');
      expect(versioning).toBeDefined();
      expect(versioning.versioning_configuration.status).toBe('Enabled');

      // Check encryption configuration
      const encryption = findResource(synthesized.resource.aws_s3_bucket_server_side_encryption_configuration, 'artifact-bucket-encryption');
      expect(encryption).toBeDefined();
      expect(encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm).toBe('AES256');
      expect(encryption.rule[0].bucket_key_enabled).toBe(true);
    });

    test('IAM policies follow least privilege', () => {
      app = new App();
      stack = new TapStack(app, 'TestIAM', {
        environmentSuffix: 'iam-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find data sources with partial key matching
      const findDataSource = (dataType: any, keyPattern: string) => {
        const keys = Object.keys(dataType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? dataType[key] : undefined;
      };

      // Check IAM policy documents
      const policyDocs = synthesized.data.aws_iam_policy_document;

      // Lambda assume role policy should only allow Lambda service
      const lambdaAssumePolicy = findDataSource(policyDocs, 'lambda-assume-role-policy');
      expect(lambdaAssumePolicy).toBeDefined();
      expect(lambdaAssumePolicy.statement[0].principals[0].type).toBe('Service');
      expect(lambdaAssumePolicy.statement[0].principals[0].identifiers).toContain('lambda.amazonaws.com');

      // Build system policy should have specific resource ARNs
      const buildSystemPolicy = findDataSource(policyDocs, 'build-system-policy');
      expect(buildSystemPolicy).toBeDefined();
      const s3Statement = buildSystemPolicy.statement.find((s: any) => s.sid === 'S3ArtifactAccess');
      expect(s3Statement.resources).toContain('arn:aws:s3:::cicd-artifacts-*');
      expect(s3Statement.resources).toContain('arn:aws:s3:::cicd-artifacts-*/*');
    });

    test('DynamoDB has point-in-time recovery enabled', () => {
      app = new App();
      stack = new TapStack(app, 'TestDynamoDB', {
        environmentSuffix: 'dynamo-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const dynamoTable = findResource(synthesized.resource.aws_dynamodb_table, 'artifact-metadata-table');
      expect(dynamoTable).toBeDefined();
      expect(dynamoTable.point_in_time_recovery.enabled).toBe(true);
    });
  });

  describe('Monitoring Configuration', () => {
    test('CloudWatch dashboard is properly configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestMonitoring', {
        environmentSuffix: 'monitor-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const dashboard = findResource(synthesized.resource.aws_cloudwatch_dashboard, 'artifact-dashboard');
      expect(dashboard).toBeDefined();
      expect(dashboard.dashboard_name).toContain('monitor-test');

      const dashboardBody = JSON.parse(dashboard.dashboard_body);
      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);

      // Check for S3 metrics widget
      const s3Widget = dashboardBody.widgets.find((w: any) => w.properties.title === 'S3 Artifact Storage Metrics');
      expect(s3Widget).toBeDefined();
      expect(s3Widget.properties.region).toBe('us-west-2');
    });

    test('CloudWatch alarms are configured with proper thresholds', () => {
      app = new App();
      stack = new TapStack(app, 'TestAlarms', {
        environmentSuffix: 'alarm-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const alarms = synthesized.resource.aws_cloudwatch_metric_alarm;

      // S3 storage alarm
      const s3Alarm = findResource(alarms, 's3-storage-alarm');
      expect(s3Alarm).toBeDefined();
      expect(s3Alarm.threshold).toBe(4000000000000); // 4TB
      expect(s3Alarm.comparison_operator).toBe('GreaterThanThreshold');
      expect(s3Alarm.evaluation_periods).toBe(2);

      // Lambda errors alarm
      const lambdaErrorAlarm = findResource(alarms, 'lambda-errors-alarm');
      expect(lambdaErrorAlarm).toBeDefined();
      expect(lambdaErrorAlarm.threshold).toBe(0);
      expect(lambdaErrorAlarm.statistic).toBe('Sum');

      // Lambda duration alarm
      const lambdaDurationAlarm = findResource(alarms, 'lambda-duration-alarm');
      expect(lambdaDurationAlarm).toBeDefined();
      expect(lambdaDurationAlarm.threshold).toBe(240000); // 4 minutes
      expect(lambdaDurationAlarm.statistic).toBe('Average');
    });
  });

  describe('Lambda Configuration', () => {
    test('Lambda function has proper configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestLambda', {
        environmentSuffix: 'lambda-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const lambda = findResource(synthesized.resource.aws_lambda_function, 'cleanup-function');
      expect(lambda).toBeDefined();
      expect(lambda.runtime).toBe('nodejs22.x');
      expect(lambda.handler).toBe('cleanup.handler');
      expect(lambda.timeout).toBe(300);
      expect(lambda.memory_size).toBe(512);

      // Check environment variables
      expect(lambda.environment.variables.RETENTION_DAYS).toBe('90');
      expect(lambda.environment.variables.ARTIFACT_BUCKET).toBeDefined();
      expect(lambda.environment.variables.EXPRESS_BUCKET).toBeDefined();
      expect(lambda.environment.variables.METADATA_TABLE).toBeDefined();
    });

    test('Lambda has EventBridge trigger configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestLambdaTrigger', {
        environmentSuffix: 'trigger-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const eventRule = findResource(synthesized.resource.aws_cloudwatch_event_rule, 'cleanup-schedule');
      expect(eventRule).toBeDefined();
      expect(eventRule.schedule_expression).toBe('rate(1 day)');

      const eventTarget = findResource(synthesized.resource.aws_cloudwatch_event_target, 'cleanup-schedule-target');
      expect(eventTarget).toBeDefined();
      expect(eventTarget.rule).toContain('aws_cloudwatch_event_rule');
      expect(eventTarget.arn).toContain('aws_lambda_function');

      const lambdaPermission = findResource(synthesized.resource.aws_lambda_permission, 'cleanup-schedule-permission');
      expect(lambdaPermission).toBeDefined();
      expect(lambdaPermission.principal).toBe('events.amazonaws.com');
      expect(lambdaPermission.action).toBe('lambda:InvokeFunction');
    });
  });

  describe('S3 Lifecycle Configuration', () => {
    test('S3 bucket has proper lifecycle rules', () => {
      app = new App();
      stack = new TapStack(app, 'TestLifecycle', {
        environmentSuffix: 'lifecycle-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const lifecycle = findResource(synthesized.resource.aws_s3_bucket_lifecycle_configuration, 'artifact-bucket-lifecycle');
      expect(lifecycle).toBeDefined();
      expect(lifecycle.rule).toBeDefined();
      expect(lifecycle.rule.length).toBe(3);

      const oldVersionsRule = lifecycle.rule.find((r: any) => r.id === 'delete-old-versions');
      expect(oldVersionsRule.noncurrent_version_expiration[0].noncurrent_days).toBe(30);

      const oldArtifactsRule = lifecycle.rule.find((r: any) => r.id === 'delete-old-artifacts');
      expect(oldArtifactsRule.expiration[0].days).toBe(90);

      const tieringRule = lifecycle.rule.find((r: any) => r.id === 'intelligent-tiering');
      expect(tieringRule.transition[0].storage_class).toBe('INTELLIGENT_TIERING');
    });

    test('S3 intelligent tiering is configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestTiering', {
        environmentSuffix: 'tiering-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const tiering = findResource(synthesized.resource.aws_s3_bucket_intelligent_tiering_configuration, 'artifact-bucket-intelligent-tiering');
      expect(tiering).toBeDefined();
      expect(tiering.tiering).toBeDefined();
      expect(tiering.tiering.length).toBe(2);
      expect(tiering.tiering[0].access_tier).toBe('ARCHIVE_ACCESS');
      expect(tiering.tiering[0].days).toBe(90);
      expect(tiering.tiering[1].access_tier).toBe('DEEP_ARCHIVE_ACCESS');
      expect(tiering.tiering[1].days).toBe(180);
    });
  });

  describe('CodeArtifact Configuration', () => {
    test('CodeArtifact domain and repository are configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestCodeArtifact', {
        environmentSuffix: 'artifact-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const domain = findResource(synthesized.resource.aws_codeartifact_domain, 'artifact-domain');
      expect(domain).toBeDefined();
      expect(domain.domain).toContain('artifact-test');

      // Check upstream repositories exist
      const npmStore = findResource(synthesized.resource.aws_codeartifact_repository, 'npm-store-repo');
      expect(npmStore).toBeDefined();
      expect(npmStore.repository).toBe('npm-store');
      expect(npmStore.external_connections.external_connection_name).toBe('public:npmjs');

      const pypiStore = findResource(synthesized.resource.aws_codeartifact_repository, 'pypi-store-repo');
      expect(pypiStore).toBeDefined();
      expect(pypiStore.repository).toBe('pypi-store');
      expect(pypiStore.external_connections.external_connection_name).toBe('public:pypi');

      // Check main repository references upstreams
      const repository = findResource(synthesized.resource.aws_codeartifact_repository, 'artifact-repository');
      expect(repository).toBeDefined();
      expect(repository.repository).toContain('artifact-test');
      expect(repository.domain).toContain('aws_codeartifact_domain');
      expect(repository.upstream).toBeDefined();
      expect(repository.upstream.length).toBe(2);
    });
  });

  describe('Tags Configuration', () => {
    test('Resources have proper tags', () => {
      app = new App();
      const envSuffix = 'tags-test';
      stack = new TapStack(app, 'TestTags', {
        environmentSuffix: envSuffix,
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      // Check S3 bucket tags
      const bucket = findResource(synthesized.resource.aws_s3_bucket, 'artifact-bucket');
      expect(bucket).toBeDefined();
      expect(bucket.tags.Environment).toBe(envSuffix);
      expect(bucket.tags.Purpose).toBe('CI/CD Build Artifacts');

      // Check DynamoDB table tags
      const dynamoTable = findResource(synthesized.resource.aws_dynamodb_table, 'artifact-metadata-table');
      expect(dynamoTable).toBeDefined();
      expect(dynamoTable.tags.Environment).toBe(envSuffix);
      expect(dynamoTable.tags.Purpose).toBe('Artifact Metadata Storage');

      // Check Lambda function tags
      const lambda = findResource(synthesized.resource.aws_lambda_function, 'cleanup-function');
      expect(lambda).toBeDefined();
      expect(lambda.tags.Environment).toBe(envSuffix);
      expect(lambda.tags.Purpose).toBe('Artifact Cleanup');
    });
  });

  describe('S3 Directory Bucket (Express One Zone)', () => {
    test('S3 Express One Zone bucket is properly configured', () => {
      app = new App();
      stack = new TapStack(app, 'TestExpressBucket', {
        environmentSuffix: 'express-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const expressBucket = findResource(synthesized.resource.aws_s3_directory_bucket, 'artifact-bucket-express');
      expect(expressBucket).toBeDefined();
      expect(expressBucket.bucket).toContain('express-test');
      expect(expressBucket.bucket).toContain('--usw2-az1--x-s3');
      expect(expressBucket.location[0].name).toBe('usw2-az1');
      expect(expressBucket.location[0].type).toBe('AvailabilityZone');
      expect(expressBucket.data_redundancy).toBe('SingleAvailabilityZone');
      expect(expressBucket.force_destroy).toBe(true);
    });
  });

  describe('S3 Bucket Features', () => {
    test('S3 bucket has transfer acceleration enabled', () => {
      app = new App();
      stack = new TapStack(app, 'TestAcceleration', {
        environmentSuffix: 'accel-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const acceleration = findResource(synthesized.resource.aws_s3_bucket_accelerate_configuration, 'artifact-bucket-acceleration');
      expect(acceleration).toBeDefined();
      expect(acceleration.status).toBe('Enabled');
    });

    test('S3 bucket has object lock configuration', () => {
      app = new App();
      stack = new TapStack(app, 'TestObjectLock', {
        environmentSuffix: 'lock-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const objectLock = findResource(synthesized.resource.aws_s3_bucket_object_lock_configuration, 'artifact-bucket-object-lock');
      expect(objectLock).toBeDefined();
      expect(objectLock.rule.default_retention.mode).toBe('GOVERNANCE');
      expect(objectLock.rule.default_retention.days).toBe(90);
    });

    test('S3 bucket policy denies insecure transport', () => {
      app = new App();
      stack = new TapStack(app, 'TestBucketPolicy', {
        environmentSuffix: 'policy-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find data sources with partial key matching
      const findDataSource = (dataType: any, keyPattern: string) => {
        const keys = Object.keys(dataType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? dataType[key] : undefined;
      };

      const policyDoc = findDataSource(synthesized.data.aws_iam_policy_document, 'bucket-policy-document');
      expect(policyDoc).toBeDefined();
      const denyStatement = policyDoc.statement.find((s: any) => s.sid === 'DenyInsecureTransport');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.effect).toBe('Deny');
      expect(denyStatement.condition[0].variable).toBe('aws:SecureTransport');
      expect(denyStatement.condition[0].values).toContain('false');
    });
  });

  describe('DynamoDB Configuration', () => {
    test('DynamoDB table has global secondary index', () => {
      app = new App();
      stack = new TapStack(app, 'TestDynamoGSI', {
        environmentSuffix: 'gsi-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const table = findResource(synthesized.resource.aws_dynamodb_table, 'artifact-metadata-table');
      expect(table).toBeDefined();
      expect(table.global_secondary_index).toBeDefined();
      expect(table.global_secondary_index[0].name).toBe('timestamp-index');
      expect(table.global_secondary_index[0].hash_key).toBe('timestamp');
      expect(table.global_secondary_index[0].projection_type).toBe('ALL');
    });

    test('DynamoDB table has proper attributes', () => {
      app = new App();
      stack = new TapStack(app, 'TestDynamoAttrs', {
        environmentSuffix: 'attrs-test',
      });
      synthesized = JSON.parse(Testing.synth(stack));

      // Find resources with partial key matching
      const findResource = (resourceType: any, keyPattern: string) => {
        const keys = Object.keys(resourceType);
        const key = keys.find((k) => k.includes(keyPattern));
        return key ? resourceType[key] : undefined;
      };

      const table = findResource(synthesized.resource.aws_dynamodb_table, 'artifact-metadata-table');
      expect(table).toBeDefined();
      expect(table.attribute).toBeDefined();
      expect(table.attribute.length).toBe(3);

      const artifactIdAttr = table.attribute.find((a: any) => a.name === 'artifact_id');
      expect(artifactIdAttr.type).toBe('S');

      const buildNumberAttr = table.attribute.find((a: any) => a.name === 'build_number');
      expect(buildNumberAttr.type).toBe('N');

      const timestampAttr = table.attribute.find((a: any) => a.name === 'timestamp');
      expect(timestampAttr.type).toBe('N');

      expect(table.hash_key).toBe('artifact_id');
      expect(table.range_key).toBe('build_number');
      expect(table.billing_mode).toBe('PAY_PER_REQUEST');
    });
  });
});