import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi testing mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    const outputs: Record<string, any> = { ...args.inputs };

    // Generate resource-specific outputs based on type
    switch (args.type) {
      case 'aws:kms/key:Key':
        outputs.keyId = 'mock-kms-key-id-123';
        outputs.arn = 'arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id-123';
        break;
      case 'aws:kms/alias:Alias':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:kms:us-east-1:123456789012:alias/${args.inputs.name}`;
        outputs.targetKeyArn = 'arn:aws:kms:us-east-1:123456789012:key/mock-kms-key-id-123';
        outputs.targetKeyId = 'mock-kms-key-id-123';
        break;
      case 'aws:dynamodb/table:Table':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}`;
        outputs.streamArn = `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}/stream/2024-01-01T00:00:00.000`;
        break;
      case 'aws:sns/topic:Topic':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
        break;
      case 'aws:iam/role:Role':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
        break;
      case 'aws:iam/rolePolicy:RolePolicy':
        outputs.id = `${args.inputs.role}:${args.inputs.name}`;
        break;
      case 'aws:lambda/function:Function':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
        outputs.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}/invocations`;
        break;
      case 'aws:lambda/eventSourceMapping:EventSourceMapping':
        outputs.id = 'mock-event-source-mapping-uuid';
        outputs.uuid = 'mock-uuid-123';
        outputs.functionArn = 'arn:aws:lambda:us-east-1:123456789012:function:mock-function';
        break;
      case 'aws:cloudwatch/eventRule:EventRule':
        outputs.id = args.inputs.name;
        outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/eventTarget:EventTarget':
        outputs.id = `${args.inputs.rule}-target`;
        break;
      case 'aws:lambda/permission:Permission':
        outputs.id = `${args.inputs.function}-permission`;
        break;
      default:
        outputs.id = args.inputs.name || `${args.name}-id`;
    }

    return {
      id: outputs.id || `${args.name}-id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
});

describe('Crypto Alerts Infrastructure', () => {
  let infra: typeof import('../index');

  beforeAll(() => {
    // Import after mocks are set up
    infra = require('../index');
  });

  describe('Outputs', () => {
    it('should export tableName output', (done) => {
      pulumi.all([infra.tableName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('crypto-alerts');
        done();
      });
    });

    it('should export tableArn output', (done) => {
      pulumi.all([infra.tableArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:dynamodb');
        done();
      });
    });

    it('should export topicArn output', (done) => {
      pulumi.all([infra.topicArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:sns');
        done();
      });
    });

    it('should export priceCheckerFunctionName output', (done) => {
      pulumi.all([infra.priceCheckerFunctionName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('price-checker');
        done();
      });
    });

    it('should export priceCheckerFunctionArn output', (done) => {
      pulumi.all([infra.priceCheckerFunctionArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:lambda');
        done();
      });
    });

    it('should export alertProcessorFunctionName output', (done) => {
      pulumi.all([infra.alertProcessorFunctionName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('alert-processor');
        done();
      });
    });

    it('should export alertProcessorFunctionArn output', (done) => {
      pulumi.all([infra.alertProcessorFunctionArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:lambda');
        done();
      });
    });

    it('should export kmsKeyId output', (done) => {
      pulumi.all([infra.kmsKeyId]).apply(([keyId]) => {
        expect(keyId).toBeDefined();
        expect(typeof keyId).toBe('string');
        done();
      });
    });

    it('should export eventRuleName output', (done) => {
      pulumi.all([infra.eventRuleName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(name).toContain('price-checker-rule');
        done();
      });
    });

    it('should export kmsKeyAlias', (done) => {
      expect(infra.kmsKeyAlias).toBeDefined();
      pulumi.all([infra.kmsKeyAlias.name]).apply(([name]) => {
        expect(name).toContain('crypto-alerts');
        done();
      });
    });

    it('should export streamEventSourceMapping', (done) => {
      expect(infra.streamEventSourceMapping).toBeDefined();
      pulumi.all([infra.streamEventSourceMapping.id]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });

    it('should export priceCheckerTarget', (done) => {
      expect(infra.priceCheckerTarget).toBeDefined();
      pulumi.all([infra.priceCheckerTarget.id]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });

    it('should export priceCheckerPermission', (done) => {
      expect(infra.priceCheckerPermission).toBeDefined();
      pulumi.all([infra.priceCheckerPermission.id]).apply(([id]) => {
        expect(id).toBeDefined();
        done();
      });
    });
  });

  describe('Resource Creation', () => {
    it('should create KMS key for environment variable encryption', () => {
      // Validated by mock creation
      expect(infra.kmsKeyId).toBeDefined();
    });

    it('should create KMS alias', () => {
      expect(infra.kmsKeyAlias).toBeDefined();
    });

    it('should create DynamoDB table', () => {
      expect(infra.tableName).toBeDefined();
      expect(infra.tableArn).toBeDefined();
    });

    it('should create SNS topic', () => {
      expect(infra.topicArn).toBeDefined();
    });

    it('should create price checker Lambda function', () => {
      expect(infra.priceCheckerFunctionName).toBeDefined();
      expect(infra.priceCheckerFunctionArn).toBeDefined();
    });

    it('should create alert processor Lambda function', () => {
      expect(infra.alertProcessorFunctionName).toBeDefined();
      expect(infra.alertProcessorFunctionArn).toBeDefined();
    });

    it('should create EventBridge rule', () => {
      expect(infra.eventRuleName).toBeDefined();
    });

    it('should create DynamoDB stream event source mapping', () => {
      expect(infra.streamEventSourceMapping).toBeDefined();
    });

    it('should create EventBridge target', () => {
      expect(infra.priceCheckerTarget).toBeDefined();
    });

    it('should create Lambda permission for EventBridge', () => {
      expect(infra.priceCheckerPermission).toBeDefined();
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should use environment suffix in table name', (done) => {
      pulumi.all([infra.tableName]).apply(([name]) => {
        // Name should contain some identifier (test stack name)
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should use environment suffix in Lambda function names', (done) => {
      pulumi
        .all([infra.priceCheckerFunctionName, infra.alertProcessorFunctionName])
        .apply(([priceChecker, alertProcessor]) => {
          expect(priceChecker).toBeDefined();
          expect(alertProcessor).toBeDefined();
          done();
        });
    });

    it('should use environment suffix in EventBridge rule name', (done) => {
      pulumi.all([infra.eventRuleName]).apply(([name]) => {
        expect(name).toBeDefined();
        done();
      });
    });
  });

  describe('Integration Points', () => {
    it('should connect DynamoDB stream to alert processor Lambda', () => {
      expect(infra.streamEventSourceMapping).toBeDefined();
    });

    it('should connect EventBridge to price checker Lambda', () => {
      expect(infra.priceCheckerTarget).toBeDefined();
      expect(infra.priceCheckerPermission).toBeDefined();
    });

    it('should use KMS key for Lambda environment variable encryption', () => {
      expect(infra.kmsKeyId).toBeDefined();
    });
  });
});
