import * as pulumi from '@pulumi/pulumi';

/**
 * Unit tests for Webhook Processing Infrastructure
 * Tests infrastructure code without actual deployment
 */
describe('Webhook Infrastructure Unit Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    // Mock Pulumi runtime
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}-id`,
          state: args.inputs,
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        return args.inputs;
      },
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Infrastructure Module Import', () => {
    it('should import index module successfully', async () => {
      const indexModule = await import('../index');
      expect(indexModule).toBeDefined();
    });

    it('should export required outputs', async () => {
      const indexModule = await import('../index');
      expect(indexModule.apiEndpoint).toBeDefined();
      expect(indexModule.dynamoTableName).toBeDefined();
      expect(indexModule.lambdaFunctionName).toBeDefined();
      expect(indexModule.snsTopicArn).toBeDefined();
      expect(indexModule.dlqUrl).toBeDefined();
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should verify all resources use environmentSuffix in names', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');

      // Check for resources with environmentSuffix
      const resourcePatterns = [
        /webhook-events-\$\{environmentSuffix\}/,
        /webhook-dlq-\$\{environmentSuffix\}/,
        /webhook-failures-\$\{environmentSuffix\}/,
        /webhook-lambda-role-\$\{environmentSuffix\}/,
        /webhook-processor-\$\{environmentSuffix\}/,
        /webhook-api-\$\{environmentSuffix\}/,
      ];

      resourcePatterns.forEach((pattern) => {
        expect(indexContent).toMatch(pattern);
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should use PAY_PER_REQUEST billing mode', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('PAY_PER_REQUEST');
    });

    it('should have correct partition and sort keys', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain("hashKey: 'eventId'");
      expect(indexContent).toContain("rangeKey: 'timestamp'");
    });

    it('should enable server-side encryption', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/serverSideEncryption:\s*\{[\s\S]*?enabled:\s*true/);
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should use Node.js 18.x runtime', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('NodeJS18dX');
    });

    it('should have 30 second timeout', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/timeout:\s*30/);
    });

    it('should have 512MB memory', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/memorySize:\s*512/);
    });

    it('should enable X-Ray tracing', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/tracingConfig:\s*\{[\s\S]*?mode:\s*'Active'/);
    });

    it('should have dead letter queue configured', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/deadLetterConfig:\s*\{[\s\S]*?targetArn:/);
    });
  });

  describe('Lambda Function Environment Variables', () => {
    it('should not set AWS_REGION (reserved variable)', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      const lambdaEnvSection = indexContent.match(/environment:\s*\{[\s\S]*?variables:\s*\{[\s\S]*?\}/);
      expect(lambdaEnvSection).toBeDefined();
      if (lambdaEnvSection) {
        expect(lambdaEnvSection[0]).not.toContain('AWS_REGION:');
      }
    });

    it('should have DYNAMODB_TABLE environment variable', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('DYNAMODB_TABLE:');
    });

    it('should have SNS_TOPIC_ARN environment variable', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('SNS_TOPIC_ARN:');
    });
  });

  describe('SQS Dead Letter Queue', () => {
    it('should have 14-day message retention', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('messageRetentionSeconds: 1209600');
    });

    it('should use KMS encryption', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/webhook-dlq[\s\S]*?kmsMasterKeyId:\s*['"]alias\/aws\/sqs['"]/);
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should use KMS encryption', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/webhook-failures[\s\S]*?kmsMasterKeyId:\s*['"]alias\/aws\/sns['"]/);
    });

    it('should have email subscription', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/protocol:\s*['"]email['"]/);
    });
  });

  describe('CloudWatch Log Group', () => {
    it('should have 7-day retention', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/retentionInDays:\s*7/);
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    it('should monitor Lambda errors', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/metricName:\s*['"]Errors['"]/);
      expect(indexContent).toMatch(/namespace:\s*['"]AWS\/Lambda['"]/);
    });

    it('should have 5-minute period', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/period:\s*300/);
    });

    it('should have threshold of 5', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/threshold:\s*5/);
    });
  });

  describe('API Gateway Configuration', () => {
    it('should use EDGE endpoint type', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/types:\s*['"]EDGE['"]/);
    });

    it('should have request validator', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('RequestValidator');
      expect(indexContent).toMatch(/validateRequestBody:\s*true/);
    });

    it('should have webhook resource path', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/pathPart:\s*['"]webhook['"]/);
    });

    it('should enable X-Ray tracing on stage', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/xrayTracingEnabled:\s*true/);
    });
  });

  describe('API Gateway Usage Plan', () => {
    it('should limit to 1000 requests per day', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/quotaSettings:[\s\S]*?limit:\s*1000/);
      expect(indexContent).toMatch(/period:\s*['"]DAY['"]/);
    });

    it('should have throttle settings', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/throttleSettings:/);
      expect(indexContent).toMatch(/burstLimit:\s*100/);
      expect(indexContent).toMatch(/rateLimit:\s*50/);
    });
  });

  describe('API Gateway Request Validation Model', () => {
    it('should require source and data fields', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/required:\s*\[['"]source['"],\s*['"]data['"]\]/);
    });

    it('should validate JSON schema', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('json-schema.org');
    });
  });

  describe('IAM Policies', () => {
    it('should have DynamoDB policy with PutItem, GetItem, UpdateItem, Query', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/dynamodb:PutItem/);
      expect(indexContent).toMatch(/dynamodb:GetItem/);
      expect(indexContent).toMatch(/dynamodb:UpdateItem/);
      expect(indexContent).toMatch(/dynamodb:Query/);
    });

    it('should have CloudWatch Logs policy', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/logs:CreateLogGroup/);
      expect(indexContent).toMatch(/logs:CreateLogStream/);
      expect(indexContent).toMatch(/logs:PutLogEvents/);
    });

    it('should have X-Ray policy', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/xray:PutTraceSegments/);
      expect(indexContent).toMatch(/xray:PutTelemetryRecords/);
    });

    it('should have SQS policy for DLQ', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/sqs:SendMessage/);
    });

    it('should have SNS publish policy', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/sns:Publish/);
    });
  });

  describe('Lambda Handler Code', () => {
    it('should use AWS SDK v3', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('@aws-sdk/client-dynamodb');
      expect(indexContent).toContain('@aws-sdk/client-sns');
    });

    it('should validate source and data fields', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/if\s*\(!body\.source\s*\|\|\s*!body\.data\)/);
    });

    it('should return 400 for missing required fields', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/statusCode:\s*400/);
    });

    it('should return 200 on success', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/statusCode:\s*200/);
    });

    it('should send SNS notification on error', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('PublishCommand');
      expect(indexContent).toMatch(/Subject:\s*['"]Webhook Processing Failure['"]/);
    });

    it('should store events in DynamoDB', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toContain('PutItemCommand');
      expect(indexContent).toContain('eventId');
      expect(indexContent).toContain('timestamp');
    });
  });

  describe('Provider Configuration', () => {
    it('should use eu-west-1 region', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/region\s*=\s*['"]eu-west-1['"]/);
    });

    it('should create AWS provider with eu-west-1', async () => {
      const fs = await import('fs');
      const indexContent = fs.readFileSync('index.ts', 'utf-8');
      expect(indexContent).toMatch(/new\s+aws\.Provider[\s\S]*?region:\s*region/);
    });
  });
});
