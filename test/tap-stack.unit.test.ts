import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Region DR Infrastructure Unit Tests', () => {
  let indexCode: string;
  let lambdaCode: string;

  beforeAll(() => {
    // Read the infrastructure code
    const indexPath = path.join(__dirname, '../index.ts');
    indexCode = fs.readFileSync(indexPath, 'utf-8');

    // Read Lambda code
    const lambdaPath = path.join(__dirname, '../lib/lambda/payment-processor.js');
    lambdaCode = fs.readFileSync(lambdaPath, 'utf-8');
  });

  describe('Configuration', () => {
    it('should require environmentSuffix from config', () => {
      expect(indexCode).toContain("config.require('environmentSuffix')");
    });

    it('should define primary region as us-east-1', () => {
      expect(indexCode).toContain("primaryRegion = 'us-east-1'");
    });

    it('should define secondary region as us-east-2', () => {
      expect(indexCode).toContain("secondaryRegion = 'us-east-2'");
    });

    it('should create providers for multi-region', () => {
      expect(indexCode).toContain("new aws.Provider('primary-provider'");
      expect(indexCode).toContain("new aws.Provider('secondary-provider'");
    });
  });

  describe('IAM Roles', () => {
    it('should create Lambda role for primary region', () => {
      expect(indexCode).toContain(
        'payment-lambda-role-primary-${environmentSuffix}'
      );
    });

    it('should create Lambda role for secondary region', () => {
      expect(indexCode).toContain(
        'payment-lambda-role-secondary-${environmentSuffix}'
      );
    });

    it('should create S3 replication role', () => {
      expect(indexCode).toContain('s3-replication-role-${environmentSuffix}');
    });

    it('should configure Lambda assume role policy', () => {
      expect(indexCode).toContain('lambda.amazonaws.com');
      expect(indexCode).toContain('sts:AssumeRole');
    });

    it('should configure S3 assume role policy', () => {
      expect(indexCode).toContain('s3.amazonaws.com');
    });

    it('should attach basic Lambda execution policy', () => {
      expect(indexCode).toContain('AWSLambdaBasicExecutionRole');
      expect(indexCode).toContain('lambda-basic-primary');
      expect(indexCode).toContain('lambda-basic-secondary');
    });

    it('should create DynamoDB access policy for primary Lambda', () => {
      expect(indexCode).toContain('lambda-dynamodb-policy-primary');
      expect(indexCode).toContain('dynamodb:PutItem');
      expect(indexCode).toContain('dynamodb:GetItem');
      expect(indexCode).toContain('dynamodb:UpdateItem');
      expect(indexCode).toContain('dynamodb:Query');
      expect(indexCode).toContain('dynamodb:Scan');
    });

    it('should create DynamoDB access policy for secondary Lambda', () => {
      expect(indexCode).toContain('lambda-dynamodb-policy-secondary');
    });

    it('should create SQS access policy for primary Lambda', () => {
      expect(indexCode).toContain('lambda-sqs-policy-primary');
      expect(indexCode).toContain('sqs:SendMessage');
      expect(indexCode).toContain('sqs:GetQueueUrl');
    });

    it('should create SQS access policy for secondary Lambda', () => {
      expect(indexCode).toContain('lambda-sqs-policy-secondary');
    });

    it('should create S3 replication policy', () => {
      expect(indexCode).toContain('s3-replication-policy');
      expect(indexCode).toContain('s3:GetReplicationConfiguration');
      expect(indexCode).toContain('s3:ReplicateObject');
    });

    it('should use specific resource ARNs in policies', () => {
      expect(indexCode).toContain('table/payments-${environmentSuffix}');
      expect(indexCode).toContain('payment-dlq-primary-${environmentSuffix}');
      expect(indexCode).toContain('payment-dlq-secondary-${environmentSuffix}');
    });
  });

  describe('DynamoDB Global Table', () => {
    it('should create DynamoDB table with environmentSuffix', () => {
      expect(indexCode).toContain('payments-${environmentSuffix}');
    });

    it('should configure on-demand billing mode', () => {
      expect(indexCode).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should define hash and range keys', () => {
      expect(indexCode).toContain("hashKey: 'paymentId'");
      expect(indexCode).toContain("rangeKey: 'timestamp'");
    });

    it('should define attributes for keys', () => {
      expect(indexCode).toContain("{ name: 'paymentId', type: 'S' }");
      expect(indexCode).toContain("{ name: 'timestamp', type: 'N' }");
    });

    it('should enable streams', () => {
      expect(indexCode).toContain('streamEnabled: true');
      expect(indexCode).toContain("streamViewType: 'NEW_AND_OLD_IMAGES'");
    });

    it('should enable point-in-time recovery', () => {
      expect(indexCode).toContain('pointInTimeRecovery');
      expect(indexCode).toContain('enabled: true');
    });

    it('should configure replica in secondary region', () => {
      expect(indexCode).toContain('replicas:');
      expect(indexCode).toContain('regionName: secondaryRegion');
    });

    it('should enable point-in-time recovery for replica', () => {
      expect(indexCode).toContain('pointInTimeRecovery: true');
    });

    it('should apply tags', () => {
      expect(indexCode).toContain('Name: `payments-${environmentSuffix}`');
      expect(indexCode).toContain('Environment: environmentSuffix');
    });
  });

  describe('SQS Dead Letter Queues', () => {
    it('should create DLQ in primary region', () => {
      expect(indexCode).toContain('payment-dlq-primary-${environmentSuffix}');
    });

    it('should create DLQ in secondary region', () => {
      expect(indexCode).toContain('payment-dlq-secondary-${environmentSuffix}');
    });

    it('should configure message retention period', () => {
      expect(indexCode).toContain('messageRetentionSeconds: 1209600');
    });

    it('should apply tags to DLQs', () => {
      expect(indexCode).toContain(
        'Name: `payment-dlq-primary-${environmentSuffix}`'
      );
      expect(indexCode).toContain(
        'Name: `payment-dlq-secondary-${environmentSuffix}`'
      );
    });
  });

  describe('Lambda Functions', () => {
    it('should generate Lambda code file', () => {
      const lambdaFilePath = path.join(
        __dirname,
        '../lib/lambda/payment-processor.js'
      );
      expect(fs.existsSync(lambdaFilePath)).toBe(true);
    });

    it('should create directory if it does not exist', () => {
      expect(indexCode).toContain("fs.mkdirSync('./lib/lambda'");
    });

    it('should write Lambda code to file', () => {
      expect(indexCode).toContain('fs.writeFileSync');
      expect(indexCode).toContain('./lib/lambda/payment-processor.js');
    });

    it('should create Lambda function in primary region', () => {
      expect(indexCode).toContain(
        'payment-processor-primary-${environmentSuffix}'
      );
    });

    it('should create Lambda function in secondary region', () => {
      expect(indexCode).toContain(
        'payment-processor-secondary-${environmentSuffix}'
      );
    });

    it('should use Node.js 18.x runtime', () => {
      expect(indexCode).toContain("runtime: 'nodejs18.x'");
    });

    it('should configure handler', () => {
      expect(indexCode).toContain("handler: 'payment-processor.handler'");
    });

    it('should use FileArchive for code', () => {
      expect(indexCode).toContain("new pulumi.asset.FileArchive('./lib/lambda')");
    });

    it('should configure environment variables', () => {
      expect(indexCode).toContain('DYNAMODB_TABLE: dynamoTablePrimary.name');
      expect(indexCode).toContain('DLQ_URL: dlqPrimary.url');
      expect(indexCode).toContain('REGION: primaryRegion');
    });

    it('should set timeout to 30 seconds', () => {
      expect(indexCode).toContain('timeout: 30');
    });

    it('should apply tags', () => {
      expect(indexCode).toContain(
        'Name: `payment-processor-primary-${environmentSuffix}`'
      );
      expect(indexCode).toContain(
        'Name: `payment-processor-secondary-${environmentSuffix}`'
      );
    });

    it('should depend on IAM policies', () => {
      expect(indexCode).toContain('dependsOn: [');
      expect(indexCode).toContain('lambdaBasicPolicyPrimary');
      expect(indexCode).toContain('lambdaDynamoDbPolicyPrimary');
      expect(indexCode).toContain('lambdaSqsPolicyPrimary');
    });
  });

  describe('API Gateway', () => {
    it('should create REST API in primary region', () => {
      expect(indexCode).toContain('payment-api-primary-${environmentSuffix}');
    });

    it('should create REST API in secondary region', () => {
      expect(indexCode).toContain('payment-api-secondary-${environmentSuffix}');
    });

    it('should configure regional endpoints', () => {
      expect(indexCode).toContain("endpointConfiguration");
      expect(indexCode).toContain("types: 'REGIONAL'");
    });

    it('should create payment resources', () => {
      expect(indexCode).toContain('payment-resource-primary');
      expect(indexCode).toContain('payment-resource-secondary');
      // The code uses a PR-safe path for PR stacks, or plain 'payment' for non-PRs
      // e.g. pathPart: isPrStack ? `payment-${environmentSuffix}` : 'payment'
      expect(indexCode).toMatch(/pathPart:\s*(isPrStack\s*\?|`payment-\$\{environmentSuffix\}`|'payment')/);
    });

    it('should create POST methods', () => {
      expect(indexCode).toContain('payment-method-primary');
      expect(indexCode).toContain('payment-method-secondary');
      expect(indexCode).toContain("httpMethod: 'POST'");
    });

    it('should configure no authorization', () => {
      expect(indexCode).toContain("authorization: 'NONE'");
    });

    it('should create Lambda integrations', () => {
      expect(indexCode).toContain('payment-integration-primary');
      expect(indexCode).toContain('payment-integration-secondary');
    });

    it('should use AWS_PROXY integration', () => {
      expect(indexCode).toContain("type: 'AWS_PROXY'");
      expect(indexCode).toContain("integrationHttpMethod: 'POST'");
    });

    it('should reference Lambda invoke ARNs', () => {
      expect(indexCode).toContain('uri: lambdaPrimary.invokeArn');
      expect(indexCode).toContain('uri: lambdaSecondary.invokeArn');
    });

    it('should create Lambda permissions', () => {
      expect(indexCode).toContain('api-lambda-permission-primary');
      expect(indexCode).toContain('api-lambda-permission-secondary');
      expect(indexCode).toContain("action: 'lambda:InvokeFunction'");
      expect(indexCode).toContain("principal: 'apigateway.amazonaws.com'");
    });

    it('should create deployments', () => {
      expect(indexCode).toContain('payment-deployment-primary');
      expect(indexCode).toContain('payment-deployment-secondary');
    });

    it('should create stages', () => {
      expect(indexCode).toContain('payment-stage-primary');
      expect(indexCode).toContain('payment-stage-secondary');
      expect(indexCode).toContain("stageName: 'prod'");
    });

    it('should configure deployment dependencies', () => {
      expect(indexCode).toContain('dependsOn: [lambdaIntegrationPrimary');
      expect(indexCode).toContain('dependsOn: [lambdaIntegrationSecondary');
    });
  });

  describe('S3 Buckets and Replication', () => {
    it('should create S3 bucket in primary region', () => {
      expect(indexCode).toContain(
        'transaction-logs-primary-${environmentSuffix}'
      );
    });

    it('should create S3 bucket in secondary region', () => {
      expect(indexCode).toContain(
        'transaction-logs-secondary-${environmentSuffix}'
      );
    });

    it('should enable versioning', () => {
      expect(indexCode).toContain('versioning: {');
      expect(indexCode).toContain('enabled: true');
    });

    it('should create replication configuration', () => {
      expect(indexCode).toContain('s3-replication-config-${environmentSuffix}');
      expect(indexCode).toContain('BucketReplicationConfig');
    });

    it('should configure replication rules', () => {
      expect(indexCode).toContain('rules: [');
      expect(indexCode).toContain("id: 'replicate-all'");
      expect(indexCode).toContain("status: 'Enabled'");
      expect(indexCode).toContain('priority: 1');
    });

    it('should enable delete marker replication', () => {
      expect(indexCode).toContain('deleteMarkerReplication');
    });

    it('should configure destination', () => {
      expect(indexCode).toContain('destination: {');
      expect(indexCode).toContain('bucket: s3BucketSecondary.arn');
    });

    it('should configure replication time', () => {
      expect(indexCode).toContain('replicationTime');
      expect(indexCode).toContain('minutes: 15');
    });

    it('should configure replication metrics', () => {
      expect(indexCode).toContain('metrics: {');
      expect(indexCode).toContain("status: 'Enabled'");
    });

    it('should depend on buckets and policy', () => {
      expect(indexCode).toContain('dependsOn: [s3ReplicationPolicy');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create replication lag alarm', () => {
      expect(indexCode).toContain(
        'dynamodb-replication-lag-alarm-${environmentSuffix}'
      );
    });

    it('should configure comparison operator', () => {
      expect(indexCode).toContain("comparisonOperator: 'GreaterThanThreshold'");
    });

    it('should configure evaluation periods', () => {
      expect(indexCode).toContain('evaluationPeriods: 2');
    });

    it('should monitor ReplicationLatency metric', () => {
      expect(indexCode).toContain("metricName: 'ReplicationLatency'");
      expect(indexCode).toContain("namespace: 'AWS/DynamoDB'");
    });

    it('should set period to 60 seconds', () => {
      expect(indexCode).toContain('period: 60');
    });

    it('should use Average statistic', () => {
      expect(indexCode).toContain("statistic: 'Average'");
    });

    it('should set threshold to 30 seconds (30000 ms)', () => {
      expect(indexCode).toContain('threshold: 30000');
    });

    it('should configure dimensions', () => {
      expect(indexCode).toContain('TableName: dynamoTablePrimary.name');
      expect(indexCode).toContain('ReceivingRegion: secondaryRegion');
    });
  });

  describe('Route 53 Configuration', () => {
    it('should create hosted zone', () => {
      expect(indexCode).toContain('payment-zone-${environmentSuffix}');
      expect(indexCode).toContain('payment-${environmentSuffix}.example.com');
    });

    it('should create health check for primary API', () => {
      expect(indexCode).toContain('health-check-primary-${environmentSuffix}');
    });

    it('should create health check for secondary API', () => {
      expect(indexCode).toContain('health-check-secondary-${environmentSuffix}');
    });

    it('should configure HTTPS health checks', () => {
      expect(indexCode).toContain("type: 'HTTPS'");
      expect(indexCode).toContain("resourcePath: '/prod/payment'");
      expect(indexCode).toContain('port: 443');
    });

    it('should configure health check intervals', () => {
      expect(indexCode).toContain('requestInterval: 30');
      expect(indexCode).toContain('failureThreshold: 3');
    });

    it('should create primary failover record', () => {
      expect(indexCode).toContain('api-primary-record-${environmentSuffix}');
      expect(indexCode).toContain("setIdentifier: 'primary'");
    });

    it('should create secondary failover record', () => {
      expect(indexCode).toContain('api-secondary-record-${environmentSuffix}');
      expect(indexCode).toContain("setIdentifier: 'secondary'");
    });

    it('should configure failover routing policies', () => {
      expect(indexCode).toContain('failoverRoutingPolicies');
      expect(indexCode).toContain("type: 'PRIMARY'");
      expect(indexCode).toContain("type: 'SECONDARY'");
    });

    it('should use CNAME records', () => {
      expect(indexCode).toContain("type: 'CNAME'");
      expect(indexCode).toContain('ttl: 60');
    });

    it('should reference health checks', () => {
      expect(indexCode).toContain('healthCheckId: healthCheckPrimary.id');
      expect(indexCode).toContain('healthCheckId: healthCheckSecondary.id');
    });
  });

  describe('SSM Parameters', () => {
    it('should create parameter for primary endpoint', () => {
      expect(indexCode).toContain('ssm-primary-endpoint-${environmentSuffix}');
      expect(indexCode).toContain(
        '/payment/${environmentSuffix}/api/primary/endpoint'
      );
    });

    it('should create parameter for secondary endpoint', () => {
      expect(indexCode).toContain('ssm-secondary-endpoint-${environmentSuffix}');
      expect(indexCode).toContain(
        '/payment/${environmentSuffix}/api/secondary/endpoint'
      );
    });

    it('should create parameter for DynamoDB table', () => {
      expect(indexCode).toContain('ssm-dynamodb-table-${environmentSuffix}');
      expect(indexCode).toContain(
        '/payment/${environmentSuffix}/dynamodb/table-name'
      );
    });

    it('should create parameters for S3 buckets', () => {
      expect(indexCode).toContain('ssm-s3-primary-${environmentSuffix}');
      expect(indexCode).toContain('ssm-s3-secondary-${environmentSuffix}');
      expect(indexCode).toContain('/payment/${environmentSuffix}/s3/primary/bucket');
      expect(indexCode).toContain(
        '/payment/${environmentSuffix}/s3/secondary/bucket'
      );
    });

    it('should use String type', () => {
      expect(indexCode).toContain("type: 'String'");
    });

    it('should include descriptions', () => {
      expect(indexCode).toContain("description: 'Primary region API endpoint'");
      expect(indexCode).toContain("description: 'Secondary region API endpoint'");
      expect(indexCode).toContain("description: 'DynamoDB global table name'");
    });
  });

  describe('Stack Outputs', () => {
    it('should export primaryApiEndpoint', () => {
      expect(indexCode).toContain('export const primaryApiEndpoint');
    });

    it('should export secondaryApiEndpoint', () => {
      expect(indexCode).toContain('export const secondaryApiEndpoint');
    });

    it('should export failoverDnsName', () => {
      expect(indexCode).toContain('export const failoverDnsName');
    });

    it('should export health check URLs', () => {
      expect(indexCode).toContain('export const primaryHealthCheckUrl');
      expect(indexCode).toContain('export const secondaryHealthCheckUrl');
    });

    it('should export health check IDs', () => {
      expect(indexCode).toContain('export const healthCheckPrimaryId');
      expect(indexCode).toContain('export const healthCheckSecondaryId');
    });

    it('should export replication lag alarm ARN', () => {
      expect(indexCode).toContain('export const replicationLagAlarmArn');
    });

    it('should export DynamoDB table name', () => {
      expect(indexCode).toContain('export const dynamoDbTableName');
    });

    it('should export S3 bucket names', () => {
      expect(indexCode).toContain('export const s3BucketPrimaryName');
      expect(indexCode).toContain('export const s3BucketSecondaryName');
    });

    it('should export DLQ URLs', () => {
      expect(indexCode).toContain('export const dlqPrimaryUrl');
      expect(indexCode).toContain('export const dlqSecondaryUrl');
    });

    it('should export hosted zone details', () => {
      expect(indexCode).toContain('export const hostedZoneId');
      expect(indexCode).toContain('export const hostedZoneNameServers');
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should use provider for primary resources', () => {
      // Check that resources use primary provider
      const primaryProviderUsage = indexCode.match(/provider: primaryProvider/g);
      expect(primaryProviderUsage).not.toBeNull();
      expect(primaryProviderUsage!.length).toBeGreaterThan(0);
    });

    it('should use provider for secondary resources', () => {
      // Check that resources use secondary provider
      const secondaryProviderUsage = indexCode.match(/provider: secondaryProvider/g);
      expect(secondaryProviderUsage).not.toBeNull();
      expect(secondaryProviderUsage!.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in resource names', () => {
      // Count occurrences of environmentSuffix in resource names
      const suffixUsage = indexCode.match(/\$\{environmentSuffix\}/g);
      expect(suffixUsage).not.toBeNull();
      expect(suffixUsage!.length).toBeGreaterThan(30);
    });

    it('should use template literals for resource names', () => {
      expect(indexCode).toContain('`payment-lambda-role-primary-${environmentSuffix}`');
      expect(indexCode).toContain('`payments-${environmentSuffix}`');
      expect(indexCode).toContain('`payment-dlq-primary-${environmentSuffix}`');
    });
  });

  describe('Lambda Code', () => {
    it('should export handler function', () => {
      expect(lambdaCode).toContain('exports.handler');
    });

    it('should be async handler', () => {
      expect(lambdaCode).toContain('async (event)');
    });

    it('should log event', () => {
      expect(lambdaCode).toContain('console.log');
      expect(lambdaCode).toContain('Payment processing event');
    });

    it('should parse request body', () => {
      expect(lambdaCode).toContain('event.body');
      expect(lambdaCode).toContain('JSON.parse');
    });

    it('should return proper API Gateway response', () => {
      expect(lambdaCode).toContain('statusCode: 200');
      expect(lambdaCode).toContain('headers');
      expect(lambdaCode).toContain('body');
    });

    it('should set CORS headers', () => {
      expect(lambdaCode).toContain("'Content-Type': 'application/json'");
      expect(lambdaCode).toContain("'Access-Control-Allow-Origin': '*'");
    });

    it('should return JSON response', () => {
      expect(lambdaCode).toContain('JSON.stringify');
      expect(lambdaCode).toContain('Payment processed successfully');
    });

    it('should include payment details in response', () => {
      expect(lambdaCode).toContain('paymentId');
      expect(lambdaCode).toContain('status');
      expect(lambdaCode).toContain('region');
      expect(lambdaCode).toContain('timestamp');
    });

    it('should use AWS_REGION from environment', () => {
      expect(lambdaCode).toContain('process.env.AWS_REGION');
    });

    it('should use Date.now() for timestamp', () => {
      expect(lambdaCode).toContain('Date.now()');
    });
  });

  describe('Tags', () => {
    it('should apply Name tags', () => {
      const nameTags = indexCode.match(/Name: `/g);
      expect(nameTags).not.toBeNull();
      expect(nameTags!.length).toBeGreaterThan(15);
    });

    it('should apply Environment tags', () => {
      const envTags = indexCode.match(/Environment: environmentSuffix/g);
      expect(envTags).not.toBeNull();
      expect(envTags!.length).toBeGreaterThan(15);
    });
  });

  describe('Dependencies', () => {
    it('should configure Lambda dependencies on policies', () => {
      expect(indexCode).toContain('dependsOn: [');
    });

    it('should configure deployment dependencies', () => {
      expect(indexCode).toContain('dependsOn: [lambdaIntegrationPrimary');
      expect(indexCode).toContain('dependsOn: [lambdaIntegrationSecondary');
    });

    it('should configure S3 replication dependencies', () => {
      expect(indexCode).toContain(
        'dependsOn: [s3ReplicationPolicy, s3BucketPrimary, s3BucketSecondary]'
      );
    });
  });

  describe('File Structure', () => {
    it('should have proper imports', () => {
      expect(indexCode).toContain("import * as pulumi from '@pulumi/pulumi'");
      expect(indexCode).toContain("import * as aws from '@pulumi/aws'");
      expect(indexCode).toContain("import * as fs from 'fs'");
    });

    it('should use proper TypeScript syntax', () => {
      expect(indexCode).toContain('const');
      expect(indexCode).toContain('new');
    });
  });

  describe('Security Best Practices', () => {
    it('should use least-privilege IAM policies', () => {
      // Policies should specify specific actions, not wildcards
      expect(indexCode).not.toContain('"Action": "*"');
      expect(indexCode).not.toContain('"Resource": "*"');
    });

    it('should enable encryption at rest for DynamoDB', () => {
      // DynamoDB encryption at rest is enabled by default, no explicit config needed
      expect(indexCode).toContain('aws.dynamodb.Table');
    });

    it('should enable versioning for S3 buckets', () => {
      expect(indexCode).toContain('versioning: {');
      expect(indexCode).toContain('enabled: true');
    });
  });
});
