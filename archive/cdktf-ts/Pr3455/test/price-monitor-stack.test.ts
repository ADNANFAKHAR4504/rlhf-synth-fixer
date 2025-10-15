import { Testing } from 'cdktf';
import { PriceMonitorStack } from '../lib/price-monitor-stack';

describe('PriceMonitorStack', () => {
  it('should create stack with expected resources', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
      awsRegion: 'us-east-1',
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);
    expect(synthOutput).toBeDefined();

    // Verify DynamoDB table is created
    const dynamoResource =
      synthOutput.resource?.aws_dynamodb_table?.['price-table'];
    expect(dynamoResource).toBeDefined();
    expect(dynamoResource.name).toBe('price-monitor-test');
    expect(dynamoResource.billing_mode).toBe('PAY_PER_REQUEST');
    expect(dynamoResource.stream_enabled).toBe(true);
    expect(dynamoResource.point_in_time_recovery.enabled).toBe(true);

    // Verify S3 bucket is created
    const s3Resource =
      synthOutput.resource?.aws_s3_bucket?.['historical-data-bucket'];
    expect(s3Resource).toBeDefined();
    expect(s3Resource.bucket).toBe('price-monitor-historical-test');

    // Verify SQS queues are created
    const sqsScrapingQueue =
      synthOutput.resource?.aws_sqs_queue?.['scraping-queue'];
    expect(sqsScrapingQueue).toBeDefined();
    expect(sqsScrapingQueue.name).toBe('price-monitor-scraping-test');

    const sqsDlq = synthOutput.resource?.aws_sqs_queue?.['scraping-dlq'];
    expect(sqsDlq).toBeDefined();
    expect(sqsDlq.name).toBe('price-monitor-dlq-test');

    // Verify SNS topic is created
    const snsResource =
      synthOutput.resource?.aws_sns_topic?.['notification-topic'];
    expect(snsResource).toBeDefined();
    expect(snsResource.name).toBe('price-monitor-notifications-test');

    // Verify Lambda functions are created
    const lambdaScraper =
      synthOutput.resource?.aws_lambda_function?.['scraper-function'];
    expect(lambdaScraper).toBeDefined();
    expect(lambdaScraper.function_name).toBe('price-scraper-test');
    expect(lambdaScraper.runtime).toBe('python3.10');

    const lambdaStreamProcessor =
      synthOutput.resource?.aws_lambda_function?.['stream-processor-function'];
    expect(lambdaStreamProcessor).toBeDefined();
    expect(lambdaStreamProcessor.function_name).toBe('stream-processor-test');
    expect(lambdaStreamProcessor.runtime).toBe('python3.10');

    // Verify EventBridge Scheduler is created
    const schedulerResource =
      synthOutput.resource?.aws_scheduler_schedule?.['price-scraper-schedule'];
    expect(schedulerResource).toBeDefined();
    expect(schedulerResource.name).toBe('price-scraper-test');
    expect(schedulerResource.schedule_expression).toBe('rate(6 hours)');
  });

  it('should configure Lambda event source mappings', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);

    // Verify SQS to Lambda mapping
    const mappings = synthOutput.resource?.aws_lambda_event_source_mapping;
    expect(mappings).toBeDefined();

    const sqsMapping = Object.values(mappings || {}).find(
      (m: any) => m.batch_size === 10
    );
    expect(sqsMapping).toBeDefined();

    const streamMapping = Object.values(mappings || {}).find(
      (m: any) => m.starting_position === 'LATEST'
    );
    expect(streamMapping).toBeDefined();
  });

  it('should configure IAM roles with proper policies', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);

    // Verify IAM roles are created
    const scraperRole = synthOutput.resource?.aws_iam_role?.['scraper-role'];
    expect(scraperRole).toBeDefined();
    expect(scraperRole.name).toBe('price-scraper-role-test');

    const streamProcessorRole =
      synthOutput.resource?.aws_iam_role?.['stream-processor-role'];
    expect(streamProcessorRole).toBeDefined();
    expect(streamProcessorRole.name).toBe('stream-processor-role-test');

    const schedulerRole =
      synthOutput.resource?.aws_iam_role?.['scheduler-role'];
    expect(schedulerRole).toBeDefined();
    expect(schedulerRole.name).toBe('price-scheduler-role-test');

    // Verify IAM policies are created
    const scraperPolicy =
      synthOutput.resource?.aws_iam_policy?.['scraper-policy'];
    expect(scraperPolicy).toBeDefined();
    expect(scraperPolicy.name).toBe('price-scraper-policy-test');

    const streamProcessorPolicy =
      synthOutput.resource?.aws_iam_policy?.['stream-processor-policy'];
    expect(streamProcessorPolicy).toBeDefined();
    expect(streamProcessorPolicy.name).toBe('stream-processor-policy-test');
  });

  it('should configure CloudWatch alarms', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);

    // Verify CloudWatch alarms are created
    const scraperAlarm =
      synthOutput.resource?.aws_cloudwatch_metric_alarm?.[
        'scraper-error-alarm'
      ];
    expect(scraperAlarm).toBeDefined();
    expect(scraperAlarm.alarm_name).toBe('price-scraper-errors-test');
    expect(scraperAlarm.metric_name).toBe('Errors');
    expect(scraperAlarm.namespace).toBe('AWS/Lambda');

    const dlqAlarm =
      synthOutput.resource?.aws_cloudwatch_metric_alarm?.['dlq-alarm'];
    expect(dlqAlarm).toBeDefined();
    expect(dlqAlarm.alarm_name).toBe('price-monitor-dlq-test');
    expect(dlqAlarm.metric_name).toBe('ApproximateNumberOfMessagesVisible');
    expect(dlqAlarm.namespace).toBe('AWS/SQS');
  });

  it('should configure DynamoDB with global secondary index', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);
    const dynamoTable =
      synthOutput.resource?.aws_dynamodb_table?.['price-table'];

    expect(dynamoTable).toBeDefined();
    expect(dynamoTable.global_secondary_index).toBeDefined();
    expect(dynamoTable.global_secondary_index[0].name).toBe('retailer-index');
    expect(dynamoTable.global_secondary_index[0].hash_key).toBe('retailer');
    expect(dynamoTable.global_secondary_index[0].range_key).toBe('timestamp');
  });

  it('should configure S3 bucket with versioning and public access block', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);

    // Verify S3 versioning is enabled
    const versioningResource = synthOutput.resource?.aws_s3_bucket_versioning;
    expect(versioningResource).toBeDefined();

    // Verify public access block is configured
    const publicAccessBlock =
      synthOutput.resource?.aws_s3_bucket_public_access_block?.[
        'historical-data-pab'
      ];
    expect(publicAccessBlock).toBeDefined();
    expect(publicAccessBlock.block_public_acls).toBe(true);
    expect(publicAccessBlock.block_public_policy).toBe(true);
    expect(publicAccessBlock.ignore_public_acls).toBe(true);
    expect(publicAccessBlock.restrict_public_buckets).toBe(true);
  });

  it('should use default values when no props provided', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack');

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);
    expect(synthOutput).toBeDefined();

    // Verify default environmentSuffix is used
    const dynamoResource =
      synthOutput.resource?.aws_dynamodb_table?.['price-table'];
    expect(dynamoResource).toBeDefined();
    expect(dynamoResource.name).toBe('price-monitor-dev');
  });

  it('should handle defaultTags prop correctly', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
      defaultTags: {
        tags: {
          Environment: 'test',
          Project: 'PriceMonitor',
        },
      },
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);
    expect(synthOutput).toBeDefined();

    // Verify stack creation with defaultTags
    const provider = synthOutput.provider?.aws;
    expect(provider).toBeDefined();
  });

  it('should configure resources without defaultTags', () => {
    const app = Testing.app();
    const stack = new PriceMonitorStack(app, 'test-stack', {
      environmentSuffix: 'test',
      defaultTags: undefined,
    });

    const synthesized = Testing.synth(stack);
    const synthOutput = JSON.parse(synthesized);
    expect(synthOutput).toBeDefined();

    // Verify stack creation without defaultTags
    const provider = synthOutput.provider?.aws;
    expect(provider).toBeDefined();
  });
});
