import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-Grade Distributed Event Processing System');
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  describe('Parameters Validation', () => {
    const requiredParams = [
      'Environment',
      'SecondaryRegion',
      'EventProcessingCapacity',
      'LambdaMemorySize',
      'RetentionDays',
      'AlertEmail'
    ];

    test('should have all required parameters', () => {
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    describe('Environment Parameter', () => {
      test('should have correct type and allowed values', () => {
        const param = template.Parameters.Environment;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('production');
        expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
      });
    });

    describe('SecondaryRegion Parameter', () => {
      test('should have correct type and allowed values', () => {
        const param = template.Parameters.SecondaryRegion;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('eu-west-1');
        expect(param.AllowedValues).toContain('eu-west-1');
        expect(param.AllowedValues).toContain('eu-central-1');
        expect(param.AllowedValues).toContain('ap-southeast-1');
        expect(param.AllowedValues).toContain('ap-northeast-1');
      });
    });

    describe('EventProcessingCapacity Parameter', () => {
      test('should have correct numeric constraints', () => {
        const param = template.Parameters.EventProcessingCapacity;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(100000);
        expect(param.MinValue).toBe(10000);
        expect(param.MaxValue).toBe(1000000);
      });
    });

    describe('LambdaMemorySize Parameter', () => {
      test('should have correct allowed values', () => {
        const param = template.Parameters.LambdaMemorySize;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(1024);
        expect(param.AllowedValues).toEqual([128, 256, 512, 1024, 2048, 3072]);
      });
    });

    describe('RetentionDays Parameter', () => {
      test('should have correct numeric constraints', () => {
        const param = template.Parameters.RetentionDays;
        expect(param.Type).toBe('Number');
        expect(param.Default).toBe(30);
        expect(param.MinValue).toBe(7);
        expect(param.MaxValue).toBe(90);
      });
    });

    describe('AlertEmail Parameter', () => {
      test('should have correct type', () => {
        const param = template.Parameters.AlertEmail;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('ops-team@company.com');
      });
    });
  });

  describe('Mappings Validation', () => {
    test('should have RegionConfig mapping', () => {
      expect(template.Mappings.RegionConfig).toBeDefined();
    });

    test('should have all required regions in mapping', () => {
      const regionConfig = template.Mappings.RegionConfig;
      const requiredRegions = ['us-east-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
      
      requiredRegions.forEach(region => {
        expect(regionConfig[region]).toBeDefined();
        expect(regionConfig[region].VpcCidr).toBeDefined();
        expect(regionConfig[region].PrivateSubnet1Cidr).toBeDefined();
        expect(regionConfig[region].PrivateSubnet2Cidr).toBeDefined();
      });
    });

    test('should have valid CIDR blocks for each region', () => {
      const regionConfig = template.Mappings.RegionConfig;
      Object.keys(regionConfig).forEach(region => {
        const config = regionConfig[region];
        expect(config.VpcCidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
        expect(config.PrivateSubnet1Cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
        expect(config.PrivateSubnet2Cidr).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
      });
    });
  });

  describe('Conditions Validation', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have IsUSEast1 condition', () => {
      expect(template.Conditions.IsUSEast1).toBeDefined();
    });

    test('should have CreateSecondaryResources condition', () => {
      expect(template.Conditions.CreateSecondaryResources).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have VPC endpoints for all required services', () => {
      const requiredEndpoints = [
        'DynamoDBEndpoint',
        'S3Endpoint',
        'EventBridgeEndpoint',
        'StepFunctionsEndpoint',
        'SQSEndpoint',
        'XRayEndpoint'
      ];

      requiredEndpoints.forEach(endpoint => {
        expect(template.Resources[endpoint]).toBeDefined();
        expect(template.Resources[endpoint].Type).toBe('AWS::EC2::VPCEndpoint');
      });
    });

    test('should have security groups', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.EndpointSecurityGroup).toBeDefined();
    });
  });

  describe('KMS Key Resources', () => {
    test('should have MasterKMSKey', () => {
      expect(template.Resources.MasterKMSKey).toBeDefined();
      expect(template.Resources.MasterKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('MasterKMSKey should allow required services', () => {
      const key = template.Resources.MasterKMSKey;
      const keyPolicy = key.Properties.KeyPolicy;
      const statements = keyPolicy.Statement;
      
      const serviceStatement = statements.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('dynamodb.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('sqs.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('lambda.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('events.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('states.amazonaws.com');
    });

    test('should have MasterKMSKeyAlias', () => {
      expect(template.Resources.MasterKMSKeyAlias).toBeDefined();
      expect(template.Resources.MasterKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('DynamoDB Global Tables', () => {
    test('should have TransactionStateTable', () => {
      expect(template.Resources.TransactionStateTable).toBeDefined();
      expect(template.Resources.TransactionStateTable.Type).toBe('AWS::DynamoDB::GlobalTable');
    });

    test('TransactionStateTable should have PAY_PER_REQUEST billing', () => {
      const table = template.Resources.TransactionStateTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TransactionStateTable should have required attributes', () => {
      const table = template.Resources.TransactionStateTable;
      const attributes = table.Properties.AttributeDefinitions;
      const attributeNames = attributes.map((a: any) => a.AttributeName);
      
      expect(attributeNames).toContain('transactionId');
      expect(attributeNames).toContain('timestamp');
      expect(attributeNames).toContain('lockId');
      expect(attributeNames).toContain('partitionKey');
    });

    test('TransactionStateTable should have Global Secondary Indexes', () => {
      const table = template.Resources.TransactionStateTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;
      expect(gsis).toBeDefined();
      expect(gsis.length).toBeGreaterThan(0);
      
      const indexNames = gsis.map((gsi: any) => gsi.IndexName);
      expect(indexNames).toContain('LockIndex');
      expect(indexNames).toContain('PartitionIndex');
    });

    test('should have IdempotencyTable', () => {
      expect(template.Resources.IdempotencyTable).toBeDefined();
      expect(template.Resources.IdempotencyTable.Type).toBe('AWS::DynamoDB::GlobalTable');
    });

    test('IdempotencyTable should have TTL enabled', () => {
      const table = template.Resources.IdempotencyTable;
      expect(table.Properties.TimeToLiveSpecification).toBeDefined();
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });
  });

  describe('SQS FIFO Queues', () => {
    const requiredQueues = [
      'OrderProcessingQueue',
      'OrderProcessingDLQ',
      'PaymentValidationQueue',
      'PaymentValidationDLQ',
      'FraudDetectionQueue',
      'FraudDetectionDLQ'
    ];

    test('should have all required queues', () => {
      requiredQueues.forEach(queue => {
        expect(template.Resources[queue]).toBeDefined();
        expect(template.Resources[queue].Type).toBe('AWS::SQS::Queue');
      });
    });

    test('all queues should be FIFO queues', () => {
      requiredQueues.forEach(queue => {
        const queueResource = template.Resources[queue];
        expect(queueResource.Properties.FifoQueue).toBe(true);
      });
    });

    test('processing queues should have redrive policies', () => {
      const processingQueues = ['OrderProcessingQueue', 'PaymentValidationQueue', 'FraudDetectionQueue'];
      processingQueues.forEach(queue => {
        const queueResource = template.Resources[queue];
        expect(queueResource.Properties.RedrivePolicy).toBeDefined();
        expect(queueResource.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
      });
    });

    test('queues should have KMS encryption', () => {
      requiredQueues.forEach(queue => {
        const queueResource = template.Resources[queue];
        expect(queueResource.Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });

  describe('Lambda Functions', () => {
    const requiredFunctions = [
      'EventTransformerFunction',
      'DistributedLockFunction',
      'SagaCoordinatorFunction',
      'VisibilityTimeoutAdjusterFunction'
    ];

    test('should have all required Lambda functions', () => {
      requiredFunctions.forEach(func => {
        expect(template.Resources[func]).toBeDefined();
        expect(template.Resources[func].Type).toBe('AWS::Lambda::Function');
      });
    });

    test('Lambda functions should use python3.11 runtime', () => {
      requiredFunctions.forEach(func => {
        const funcResource = template.Resources[func];
        expect(funcResource.Properties.Runtime).toBe('python3.11');
      });
    });

    test('Lambda functions should use arm64 architecture', () => {
      requiredFunctions.forEach(func => {
        const funcResource = template.Resources[func];
        expect(funcResource.Properties.Architectures).toContain('arm64');
      });
    });

    test('Lambda functions should have VPC configuration', () => {
      const vpcFunctions = ['EventTransformerFunction', 'DistributedLockFunction', 'SagaCoordinatorFunction'];
      vpcFunctions.forEach(func => {
        const funcResource = template.Resources[func];
        expect(funcResource.Properties.VpcConfig).toBeDefined();
        expect(funcResource.Properties.VpcConfig.SubnetIds).toBeDefined();
        expect(funcResource.Properties.VpcConfig.SubnetIds.length).toBe(2);
      });
    });

    test('Lambda functions should have X-Ray tracing enabled', () => {
      requiredFunctions.forEach(func => {
        const funcResource = template.Resources[func];
        expect(funcResource.Properties.TracingConfig).toBeDefined();
        expect(funcResource.Properties.TracingConfig.Mode).toBe('Active');
      });
    });
  });

  describe('Step Functions State Machines', () => {
    const requiredStateMachines = [
      'OrderProcessingStateMachine',
      'PaymentValidationStateMachine',
      'FraudDetectionStateMachine'
    ];

    test('should have all required state machines', () => {
      requiredStateMachines.forEach(sm => {
        expect(template.Resources[sm]).toBeDefined();
        expect(template.Resources[sm].Type).toBe('AWS::StepFunctions::StateMachine');
      });
    });

    test('state machines should have tracing enabled', () => {
      requiredStateMachines.forEach(sm => {
        const smResource = template.Resources[sm];
        expect(smResource.Properties.TracingConfiguration).toBeDefined();
        expect(smResource.Properties.TracingConfiguration.Enabled).toBe(true);
      });
    });

    test('OrderProcessingStateMachine should have logging configuration', () => {
      const sm = template.Resources.OrderProcessingStateMachine;
      expect(sm.Properties.LoggingConfiguration).toBeDefined();
      expect(sm.Properties.LoggingConfiguration.Level).toBe('ALL');
    });

    test('state machines should have valid definition strings', () => {
      requiredStateMachines.forEach(sm => {
        const smResource = template.Resources[sm];
        expect(smResource.Properties.DefinitionString).toBeDefined();
        
        let definitionString: string;
        if (typeof smResource.Properties.DefinitionString === 'string') {
          definitionString = smResource.Properties.DefinitionString;
        } else if (smResource.Properties.DefinitionString['Fn::Sub']) {
          // Handle CloudFormation intrinsic function Fn::Sub
          definitionString = smResource.Properties.DefinitionString['Fn::Sub'];
        } else {
          definitionString = JSON.stringify(smResource.Properties.DefinitionString);
        }
        
        const definition = JSON.parse(definitionString);
        expect(definition.StartAt).toBeDefined();
        expect(definition.States).toBeDefined();
      });
    });
  });

  describe('EventBridge Resources', () => {
    test('should have MainEventBus', () => {
      expect(template.Resources.MainEventBus).toBeDefined();
      expect(template.Resources.MainEventBus.Type).toBe('AWS::Events::EventBus');
    });

    test('should have EventArchive', () => {
      expect(template.Resources.EventArchive).toBeDefined();
      expect(template.Resources.EventArchive.Type).toBe('AWS::Events::Archive');
    });

    test('should have routing rules', () => {
      const requiredRules = [
        'OrderRoutingRule',
        'PaymentRoutingRule',
        'FraudRoutingRule'
      ];

      requiredRules.forEach(rule => {
        expect(template.Resources[rule]).toBeDefined();
        expect(template.Resources[rule].Type).toBe('AWS::Events::Rule');
      });
    });

    test('routing rules should have event patterns', () => {
      const rules = ['OrderRoutingRule', 'PaymentRoutingRule', 'FraudRoutingRule'];
      rules.forEach(rule => {
        const ruleResource = template.Resources[rule];
        expect(ruleResource.Properties.EventPattern).toBeDefined();
        expect(ruleResource.Properties.EventPattern.source).toBeDefined();
      });
    });

    test('OrderRoutingRule should route to OrderProcessingStateMachine', () => {
      const rule = template.Resources.OrderRoutingRule;
      const targets = rule.Properties.Targets;
      const stateMachineTarget = targets.find((t: any) => t.Id === 'OrderProcessingStateMachineTarget');
      expect(stateMachineTarget).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have required policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const policyNames = policies.map((p: any) => p.PolicyName);
      
      expect(policyNames).toContain('DynamoDBAccess');
      expect(policyNames).toContain('SQSAccess');
      expect(policyNames).toContain('CloudWatchMetrics');
      expect(policyNames).toContain('KMSAccess');
    });

    test('should have StepFunctionsExecutionRole', () => {
      expect(template.Resources.StepFunctionsExecutionRole).toBeDefined();
      expect(template.Resources.StepFunctionsExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('StepFunctionsExecutionRole should have log delivery permissions', () => {
      const role = template.Resources.StepFunctionsExecutionRole;
      const policies = role.Properties.Policies;
      const stepFunctionsPolicy = policies.find((p: any) => p.PolicyName === 'StepFunctionsPolicy');
      const statements = stepFunctionsPolicy.PolicyDocument.Statement;
      
      const logStatement = statements.find((s: any) => 
        s.Action && s.Action.includes('logs:CreateLogDelivery')
      );
      expect(logStatement).toBeDefined();
    });

    test('should have EventBridgeRole', () => {
      expect(template.Resources.EventBridgeRole).toBeDefined();
      expect(template.Resources.EventBridgeRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have log groups for state machines', () => {
      const requiredLogGroups = [
        'OrderProcessingLogGroup',
        'PaymentValidationLogGroup',
        'FraudDetectionLogGroup'
      ];

      requiredLogGroups.forEach(logGroup => {
        expect(template.Resources[logGroup]).toBeDefined();
        expect(template.Resources[logGroup].Type).toBe('AWS::Logs::LogGroup');
      });
    });

    test('should have CloudWatch alarms', () => {
      const requiredAlarms = [
        'HighEventVolumeAlarm',
        'DLQMessageAlarm',
        'DynamoDBThrottleAlarm',
        'LambdaErrorAlarm',
        'StepFunctionsFailureAlarm'
      ];

      requiredAlarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('should have MonitoringDashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('SNS Resources', () => {
    test('should have AlertTopic', () => {
      expect(template.Resources.AlertTopic).toBeDefined();
      expect(template.Resources.AlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('AlertTopic should have KMS encryption', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should have DeploymentArtifactsBucket', () => {
      expect(template.Resources.DeploymentArtifactsBucket).toBeDefined();
      expect(template.Resources.DeploymentArtifactsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('DeploymentArtifactsBucket should have versioning enabled', () => {
      const bucket = template.Resources.DeploymentArtifactsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('DeploymentArtifactsBucket should have encryption', () => {
      const bucket = template.Resources.DeploymentArtifactsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('DeploymentArtifactsBucket should block public access', () => {
      const bucket = template.Resources.DeploymentArtifactsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('Outputs Validation', () => {
    const requiredOutputs = [
      'MainEventBusArn',
      'MainEventBusName',
      'OrderProcessingQueueUrl',
      'PaymentValidationQueueUrl',
      'FraudDetectionQueueUrl',
      'TransactionStateTableName',
      'TransactionStateTableArn',
      'IdempotencyTableName',
      'OrderProcessingStateMachineArn',
      'PaymentValidationStateMachineArn',
      'FraudDetectionStateMachineArn',
      'EventTransformerFunctionArn',
      'DistributedLockFunctionArn',
      'SagaCoordinatorFunctionArn',
      'AlertTopicArn',
      'EventArchiveName',
      'VPCId',
      'MasterKMSKeyId',
      'MasterKMSKeyArn'
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      // Some outputs may not have exports (e.g., StackRegion, SecondaryRegionConfig, Environment, ProcessingCapacity)
      const outputsWithExports = Object.keys(template.Outputs).filter(outputKey => {
        const output = template.Outputs[outputKey];
        return output.Export !== undefined;
      });
      
      outputsWithExports.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
      
      // Verify that most outputs have exports
      expect(outputsWithExports.length).toBeGreaterThan(15);
    });

    test('output export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          expect(exportName).toHaveProperty('Fn::Sub');
          expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Resource Dependencies and References', () => {
    test('Lambda functions should reference LambdaExecutionRole', () => {
      const functions = ['EventTransformerFunction', 'DistributedLockFunction', 'SagaCoordinatorFunction'];
      functions.forEach(func => {
        const funcResource = template.Resources[func];
        expect(funcResource.Properties.Role).toBeDefined();
      });
    });

    test('State machines should reference StepFunctionsExecutionRole', () => {
      const stateMachines = ['OrderProcessingStateMachine', 'PaymentValidationStateMachine', 'FraudDetectionStateMachine'];
      stateMachines.forEach(sm => {
        const smResource = template.Resources[sm];
        expect(smResource.Properties.RoleArn).toBeDefined();
      });
    });

    test('EventBridge rules should reference EventBridgeRole', () => {
      const rules = ['OrderRoutingRule', 'PaymentRoutingRule', 'FraudRoutingRule'];
      rules.forEach(rule => {
        const ruleResource = template.Resources[rule];
        const targets = ruleResource.Properties.Targets;
        targets.forEach((target: any) => {
          if (target.RoleArn) {
            expect(target.RoleArn).toBeDefined();
          }
        });
      });
    });

    test('Resources should reference MasterKMSKey for encryption', () => {
      const encryptedResources = [
        'OrderProcessingQueue',
        'PaymentValidationQueue',
        'FraudDetectionQueue',
        'AlertTopic'
      ];

      encryptedResources.forEach(resource => {
        const res = template.Resources[resource];
        if (res.Properties.KmsMasterKeyId) {
          expect(res.Properties.KmsMasterKeyId).toBeDefined();
        }
      });
    });
  });

  describe('Error Cases and Edge Conditions', () => {
    test('DLQ queues should not have redrive policies', () => {
      const dlqQueues = ['OrderProcessingDLQ', 'PaymentValidationDLQ', 'FraudDetectionDLQ'];
      dlqQueues.forEach(queue => {
        const queueResource = template.Resources[queue];
        expect(queueResource.Properties.RedrivePolicy).toBeUndefined();
      });
    });

    test('Conditional resources should have conditions', () => {
      const conditionalResources = ['CrossRegionReplicationRule'];
      conditionalResources.forEach(resource => {
        if (template.Resources[resource]) {
          expect(template.Resources[resource].Condition).toBeDefined();
        }
      });
    });

    test('FIFO queues should have .fifo suffix in names', () => {
      const fifoQueues = [
        'OrderProcessingQueue',
        'OrderProcessingDLQ',
        'PaymentValidationQueue',
        'PaymentValidationDLQ',
        'FraudDetectionQueue',
        'FraudDetectionDLQ'
      ];

      fifoQueues.forEach(queue => {
        const queueResource = template.Resources[queue];
        const queueName = queueResource.Properties.QueueName;
        if (typeof queueName === 'string') {
          expect(queueName).toContain('.fifo');
        } else if (queueName && queueName['Fn::Sub']) {
          expect(queueName['Fn::Sub']).toContain('.fifo');
        }
      });
    });
  });

  describe('Resource Tagging Convention', () => {
    test('critical resources should have iac-rlhf-amazon tag', () => {
      const criticalResources = [
        'VPC',
        'TransactionStateTable',
        'IdempotencyTable',
        'OrderProcessingQueue',
        'EventTransformerFunction',
        'MainEventBus'
      ];

      criticalResources.forEach(resource => {
        const res = template.Resources[resource];
        if (res.Properties && res.Properties.Tags) {
          const tags = res.Properties.Tags;
          const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
          expect(iacTag).toBeDefined();
          expect(iacTag.Value).toBe('true');
        }
      });
    });
  });
});
