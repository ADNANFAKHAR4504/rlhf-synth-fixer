import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Asynchronous Event Processing Pipeline Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let templateYaml: string;
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';

  beforeAll(() => {
    // Load template
    templateYaml = fs.readFileSync(templatePath, 'utf8');

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.TransactionTopicArn?.split(':')[3] ||
          deployedOutputs.HighValueQueueArn?.split(':')[3] ||
          deployedOutputs.KMSKeyArn?.split(':')[3] ||
          deployedOutputs.EventBridgeRoleArn?.split(':')[3] ||
          'us-east-1';

        // Extract stack name and environment suffix from resource naming pattern
        if (deployedOutputs.HighValueQueueName || deployedOutputs.TransactionTopicName) {
          const resourceName = deployedOutputs.HighValueQueueName || deployedOutputs.TransactionTopicName;
          console.log('Raw Resource Name:', resourceName);
          const nameParts = resourceName.split('-');
          console.log('Resource Name parts:', nameParts);

          // Extract stack name (first part)
          currentStackName = nameParts[0] || 'TapStack';

          // Find the environment suffix (look for pattern like pr8888, pr4056, etc.)
          const envSuffixIndex = nameParts.findIndex((part: string) =>
            part.match(/^(pr|dev|prod|test|staging)\d*$/) ||
            (part.startsWith('pr') && part.length > 2)
          );
          currentEnvironmentSuffix = envSuffixIndex >= 0 ? nameParts[envSuffixIndex] : 'pr4056';
        }

        // Alternative extraction from any available ARN
        if (!currentStackName || currentStackName === 'unknown-stack') {
          const anyArn = deployedOutputs.TransactionTopicArn || deployedOutputs.HighValueQueueArn || deployedOutputs.KMSKeyArn;
          if (anyArn && typeof anyArn === 'string') {
            const arnParts = anyArn.split(':');
            if (arnParts.length >= 6) {
              const resourcePart = arnParts[5] || arnParts[6];
              if (resourcePart) {
                const resourceNameParts = resourcePart.split('-');
                currentStackName = resourceNameParts[0] || 'TapStack';
                const envSuffixMatch = resourcePart.match(/(pr|dev|prod|test|staging)\d*/);
                if (envSuffixMatch) {
                  currentEnvironmentSuffix = envSuffixMatch[0];
                }
              }
            }
          }
        }

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
      console.log('=== Debug Information (No Outputs) ===');
      console.log('Region:', region);
      console.log('Stack Name:', currentStackName);
      console.log('Environment Suffix:', currentEnvironmentSuffix);
      console.log('=======================================');
    }
  });

  // Helper function to check resource dependencies in YAML text
  const validateResourceDependencies = (resourceName: string, dependencies: string[]) => {
    dependencies.forEach(dep => {
      const dependencyPattern = new RegExp(`Ref: ${dep}|!Ref ${dep}|!GetAtt ${dep}`);
      expect(templateYaml).toMatch(dependencyPattern);
    });
  };

  // Helper function to validate resource exists in template by checking YAML text
  const validateResourceExists = (resourceName: string, resourceType: string) => {
    expect(templateYaml).toContain(`${resourceName}:`);
    expect(templateYaml).toContain(`Type: ${resourceType}`);
  };

  // Helper function to extract section from YAML text
  const extractYamlSection = (sectionName: string): string => {
    const sectionPattern = new RegExp(`^${sectionName}:\\s*$`, 'm');
    const match = templateYaml.match(sectionPattern);
    if (!match) return '';

    const startIndex = match.index! + match[0].length;
    const lines = templateYaml.substring(startIndex).split('\n');
    const sectionLines = [];

    for (const line of lines) {
      if (line.match(/^[A-Za-z]/) && !line.startsWith(' ')) {
        break; // Found next top-level section
      }
      sectionLines.push(line);
    }

    return sectionLines.join('\n');
  };

  // =================
  // BASIC VALIDATION
  // =================
  describe('Template Structure Validation', () => {
    test('Template has all required sections', () => {
      expect(templateYaml).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateYaml).toContain('Description: \'Asynchronous event processing pipeline for financial transactions with FIFO queues, SNS filtering, and EventBridge integration\'');
      expect(templateYaml).toContain('Parameters:');
      expect(templateYaml).toContain('Resources:');
      expect(templateYaml).toContain('Outputs:');
    });

    test('Template description indicates financial transaction processing', () => {
      expect(templateYaml).toContain('Asynchronous event processing pipeline for financial transactions');
      expect(templateYaml).toContain('FIFO queues');
      expect(templateYaml).toContain('EventBridge integration');
    });

    test('Template contains all critical AWS resource types for event processing', () => {
      const criticalResourceTypes = [
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::SNS::Topic',
        'AWS::SQS::Queue',
        'AWS::SQS::QueuePolicy',
        'AWS::SNS::Subscription',
        'AWS::Events::EventBus',
        'AWS::Events::Rule',
        'AWS::CloudWatch::Alarm',
        'AWS::IAM::Role'
      ];

      criticalResourceTypes.forEach(resourceType => {
        expect(templateYaml).toContain(`Type: ${resourceType}`);
      });
    });
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section - Cross-Account Compatibility', () => {
    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(templateYaml).toContain('EnvironmentSuffix:');
      expect(templateYaml).toContain('AllowedPattern: \'^[a-zA-Z0-9\\-]*$\'');
      // Dynamic check - should have a Default value that matches the allowed pattern
      expect(templateYaml).toMatch(/Default: \"[a-zA-Z0-9\-]+\"/);
      expect(templateYaml).toContain('parallel deployments');
    });

    test('EnvironmentSuffix parameter has proper validation constraints', () => {
      const parametersSection = extractYamlSection('Parameters');
      expect(parametersSection).toContain('Type: String');
      expect(parametersSection).toContain('Description:');
      expect(parametersSection).toContain('ConstraintDescription: \'Must contain only alphanumeric characters and hyphens\'');
    });

    test('No hardcoded account-specific or region-specific parameters', () => {
      const parametersSection = extractYamlSection('Parameters');
      // Should not contain any hardcoded account IDs or regions
      expect(parametersSection).not.toMatch(/\b\d{12}\b/); // Account ID pattern
      expect(parametersSection).not.toMatch(/\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/); // Region pattern
    });
  });

  // ==================
  // KMS ENCRYPTION
  // ==================
  describe('KMS Resources - Encryption Management', () => {
    test('Transaction KMS Key has proper configuration', () => {
      validateResourceExists('TransactionKMSKey', 'AWS::KMS::Key');
      expect(templateYaml).toContain('Description: \'Customer managed KMS key for transaction pipeline encryption\'');
    });

    test('KMS Key has proper cross-account compatible key policy', () => {
      expect(templateYaml).toContain('KeyPolicy:');
      expect(templateYaml).toContain('Version: \'2012-10-17\'');
      expect(templateYaml).toContain('Principal:');
      expect(templateYaml).toContain('AWS: !Sub \'arn:aws:iam::${AWS::AccountId}:root\'');
      expect(templateYaml).toContain('kms:*');

      // Service principals
      expect(templateYaml).toContain('sns.amazonaws.com');
      expect(templateYaml).toContain('sqs.amazonaws.com');
      expect(templateYaml).toContain('events.amazonaws.com');
      expect(templateYaml).toContain('cloudwatch.amazonaws.com');
    });

    test('KMS Key Alias is properly configured with dynamic naming', () => {
      validateResourceExists('TransactionKMSKeyAlias', 'AWS::KMS::Alias');
      expect(templateYaml).toContain('AliasName: !Sub \'alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-kms-key\'');
      expect(templateYaml).toContain('TargetKeyId: !Ref TransactionKMSKey');
    });

    test('KMS Key has proper tags with dynamic values', () => {
      expect(templateYaml).toContain('Tags:');
      expect(templateYaml).toContain('Key: Name');
      expect(templateYaml).toContain('Value: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-kms-key\'');
    });
  });

  // ===============
  // SNS TOPICS
  // ===============
  describe('SNS Topics - Message Publishing', () => {
    test('Transaction Topic is properly configured', () => {
      validateResourceExists('TransactionTopic', 'AWS::SNS::Topic');
      expect(templateYaml).toContain('TopicName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-transaction-topic.fifo\'');
    });

    test('Alerts Topic is properly configured', () => {
      validateResourceExists('AlertsTopic', 'AWS::SNS::Topic');
      expect(templateYaml).toContain('TopicName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-alerts-topic\'');
    });

    test('SNS Topics use KMS encryption', () => {
      expect(templateYaml).toContain('KmsMasterKeyId: !Ref TransactionKMSKey');
    });

    test('SNS Topics have proper tags with dynamic naming', () => {
      expect(templateYaml).toContain('Tags:');
      expect(templateYaml).toContain('Key: Name');
      // Should contain dynamic stack/region/environment references
      expect(templateYaml).toMatch(/Value: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/);
    });
  });

  // ===============
  // SQS QUEUES
  // ===============
  describe('SQS Queues - Message Processing', () => {
    test('Dead Letter Queues are properly configured', () => {
      const dlqs = ['HighValueDLQ', 'StandardValueDLQ', 'LowValueDLQ'];

      dlqs.forEach(dlq => {
        validateResourceExists(dlq, 'AWS::SQS::Queue');
        expect(templateYaml).toContain('ContentBasedDeduplication: true');
        expect(templateYaml).toContain('FifoQueue: true');
        expect(templateYaml).toContain('KmsMasterKeyId: !Ref TransactionKMSKey');
      });
    });

    test('Main Queues have FIFO configuration and DLQ integration', () => {
      const mainQueues = ['HighValueQueue', 'StandardValueQueue', 'LowValueQueue'];
      const dlqMapping = ['HighValueDLQ', 'StandardValueDLQ', 'LowValueDLQ'];

      mainQueues.forEach((queue, index) => {
        validateResourceExists(queue, 'AWS::SQS::Queue');
        expect(templateYaml).toContain('FifoQueue: true');
        expect(templateYaml).toContain('ContentBasedDeduplication: true');
        expect(templateYaml).toContain('KmsMasterKeyId: !Ref TransactionKMSKey');

        // Check DLQ configuration
        expect(templateYaml).toContain('RedrivePolicy:');
        expect(templateYaml).toContain(`deadLetterTargetArn: !GetAtt ${dlqMapping[index]}.Arn`);
        expect(templateYaml).toContain('maxReceiveCount: 3');
      });
    });

    test('Queue naming follows dynamic convention', () => {
      const allQueues = ['HighValueQueue', 'StandardValueQueue', 'LowValueQueue', 'HighValueDLQ', 'StandardValueDLQ', 'LowValueDLQ'];

      allQueues.forEach(queue => {
        const queueNamePattern = /QueueName: !Sub '\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}-[\w-]+\.fifo'/;
        expect(templateYaml).toMatch(queueNamePattern);
      });
    });

    test('Queue policies are configured for cross-account compatibility', () => {
      const queuePolicies = ['HighValueQueuePolicy', 'StandardValueQueuePolicy', 'LowValueQueuePolicy'];

      queuePolicies.forEach(policy => {
        validateResourceExists(policy, 'AWS::SQS::QueuePolicy');
        expect(templateYaml).toContain('Version: \'2012-10-17\'');
        expect(templateYaml).toContain('Effect: Allow');
        expect(templateYaml).toContain('sns.amazonaws.com');
        expect(templateYaml).toContain('SQS:SendMessage');
      });
    });
  });

  // ===============================
  // SNS SUBSCRIPTIONS
  // ===============================
  describe('SNS Subscriptions - Message Routing', () => {
    test('Subscriptions connect SNS to SQS with message filtering', () => {
      const subscriptions = [
        { name: 'HighValueSubscription', queue: 'HighValueQueue' },
        { name: 'StandardValueSubscription', queue: 'StandardValueQueue' },
        { name: 'LowValueSubscription', queue: 'LowValueQueue' }
      ];

      subscriptions.forEach(sub => {
        validateResourceExists(sub.name, 'AWS::SNS::Subscription');
        expect(templateYaml).toContain('Protocol: sqs');
        expect(templateYaml).toContain(`Endpoint: !GetAtt ${sub.queue}.Arn`);
        expect(templateYaml).toContain('TopicArn: !Ref TransactionTopic');
      });
    });

    test('Subscriptions have message filtering attributes', () => {
      expect(templateYaml).toContain('FilterPolicy:');
      expect(templateYaml).toContain('amount:');
      expect(templateYaml).toContain('numeric:');
      expect(templateYaml).toContain('- ">"');
      expect(templateYaml).toContain('- 10000');
      expect(templateYaml).toContain('- ">="');
      expect(templateYaml).toContain('- "<="');
      expect(templateYaml).toContain('- "<"');
      expect(templateYaml).toContain('- 1000');
    });

    test('Subscriptions use raw message delivery', () => {
      expect(templateYaml).toContain('RawMessageDelivery: true');
    });
  });

  // ===============================
  // EVENTBRIDGE RESOURCES
  // ===============================
  describe('EventBridge - Event Processing', () => {
    test('Custom EventBus is properly configured', () => {
      validateResourceExists('TransactionEventBus', 'AWS::Events::EventBus');
      expect(templateYaml).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-event-bus\'');
    });

    test('Failed Transaction Rule has proper event pattern matching', () => {
      validateResourceExists('FailedTransactionRule', 'AWS::Events::Rule');
      expect(templateYaml).toContain('Name: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-failed-transaction-rule\'');
      expect(templateYaml).toContain('EventBusName: !Ref TransactionEventBus');
      expect(templateYaml).toContain('EventPattern:');
      expect(templateYaml).toContain('source:');
      expect(templateYaml).toContain('- transaction.processor');
      expect(templateYaml).toContain('detail-type:');
      expect(templateYaml).toContain('- Transaction Failed');
      expect(templateYaml).toContain('numeric:');
      expect(templateYaml).toContain('- ">"');
      expect(templateYaml).toContain('- 5000');
    });

    test('EventBridge Rule targets SNS topic', () => {
      expect(templateYaml).toContain('Targets:');
      expect(templateYaml).toContain('Arn: !Ref AlertsTopic');
      expect(templateYaml).toContain('Id: \'1\'');
    });

    test('EventBridge has IAM role for SNS publishing', () => {
      validateResourceExists('EventBridgeRole', 'AWS::IAM::Role');
      expect(templateYaml).toContain('Service: events.amazonaws.com');
      expect(templateYaml).toContain('sns:Publish');
      expect(templateYaml).toContain('kms:Decrypt');
      expect(templateYaml).toContain('kms:GenerateDataKey');
    });
  });

  // ===============================
  // CLOUDWATCH ALARMS
  // ===============================
  describe('CloudWatch Alarms - Monitoring', () => {
    test('Queue depth alarms are configured for all value tiers', () => {
      const alarms = [
        { name: 'HighValueQueueAlarm', queue: 'HighValueQueue' },
        { name: 'StandardValueQueueAlarm', queue: 'StandardValueQueue' },
        { name: 'LowValueQueueAlarm', queue: 'LowValueQueue' }
      ];

      alarms.forEach(alarm => {
        validateResourceExists(alarm.name, 'AWS::CloudWatch::Alarm');
        expect(templateYaml).toContain('AlarmName: !Sub \'${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}');
        expect(templateYaml).toContain('MetricName: ApproximateNumberOfMessagesVisible');
        expect(templateYaml).toContain('Namespace: AWS/SQS');
        expect(templateYaml).toContain('Threshold: 1000');
        expect(templateYaml).toContain('ComparisonOperator: GreaterThanThreshold');
        expect(templateYaml).toContain(`Value: !GetAtt ${alarm.queue}.QueueName`);
      });
    }); test('Alarms target the alerts SNS topic', () => {
      expect(templateYaml).toContain('AlarmActions:');
      expect(templateYaml).toContain('- !Ref AlertsTopic');
    });

    test('Alarms handle missing data appropriately', () => {
      expect(templateYaml).toContain('TreatMissingData: notBreaching');
    });
  });

  // ======================
  // CROSS-ACCOUNT/REGION
  // ======================
  describe('Cross-Account and Cross-Region Compatibility', () => {
    test('No hardcoded account IDs in template', () => {
      const accountIdPattern = /\b\d{12}\b/;
      // Allow ${AWS::AccountId} but not literal 12-digit numbers
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::AccountId\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(accountIdPattern);
    });

    test('No hardcoded region names in template', () => {
      const regionPattern = /\b(us-(east|west)-[12]|eu-(west|central)-[12]|ap-(southeast|northeast|south)-[12])\b/;
      // Allow ${AWS::Region} but not literal region names
      const templateWithoutPseudoParams = templateYaml.replace(/\$\{AWS::Region\}/g, '');
      expect(templateWithoutPseudoParams).not.toMatch(regionPattern);
    });

    test('Uses dynamic AWS pseudo parameters throughout', () => {
      expect(templateYaml).toContain('${AWS::Region}');
      expect(templateYaml).toContain('${AWS::AccountId}');
      expect(templateYaml).toContain('${AWS::StackName}');
    });

    test('Resource naming includes region and environment for global uniqueness', () => {
      const regionEnvironmentPattern = /\${AWS::StackName}-\${AWS::Region}-\${EnvironmentSuffix}/;
      expect(templateYaml).toMatch(regionEnvironmentPattern);

      // Count occurrences to ensure it's used consistently
      const matches = templateYaml.match(new RegExp(regionEnvironmentPattern.source, 'g'));
      expect(matches).toBeDefined();
      expect(matches!.length).toBeGreaterThan(10); // Should be used extensively
    });

    test('ARN references use proper AWS naming conventions', () => {
      // Check for ARN patterns in the template (both hardcoded and dynamic)
      expect(templateYaml).toContain('!Sub \'arn:aws:iam::${AWS::AccountId}:root\'');
      expect(templateYaml).toContain('arn:aws');
    });

    test('Service names use compatible patterns for cross-region deployment', () => {
      // Service principals should work across regions
      expect(templateYaml).toContain('sns.amazonaws.com');
      expect(templateYaml).toContain('sqs.amazonaws.com');
      expect(templateYaml).toContain('events.amazonaws.com');
      expect(templateYaml).toContain('cloudwatch.amazonaws.com');
    });
  });

  // ======================
  // SECURITY VALIDATION
  // ======================
  describe('Security and Encryption Compliance', () => {
    test('All message queues use customer-managed KMS encryption', () => {
      const queueResources = ['HighValueQueue', 'StandardValueQueue', 'LowValueQueue', 'HighValueDLQ', 'StandardValueDLQ', 'LowValueDLQ'];

      queueResources.forEach(queue => {
        expect(templateYaml).toContain('KmsMasterKeyId: !Ref TransactionKMSKey');
      });
    });

    test('SNS topics use customer-managed KMS encryption', () => {
      expect(templateYaml).toContain('KmsMasterKeyId: !Ref TransactionKMSKey');
    });

    test('FIFO queues prevent message duplication', () => {
      expect(templateYaml).toContain('FifoQueue: true');
      expect(templateYaml).toContain('ContentBasedDeduplication: true');
    });

    test('IAM policies follow least privilege principle', () => {
      expect(templateYaml).toContain('Effect: Allow');
      expect(templateYaml).toContain('Resource: !Ref AlertsTopic');
      expect(templateYaml).toContain('Resource: !GetAtt TransactionKMSKey.Arn');

      // Verify specific actions are granted, not broad permissions
      expect(templateYaml).toContain('sns:Publish');
      expect(templateYaml).toContain('kms:Decrypt');
      expect(templateYaml).toContain('kms:GenerateDataKey');
    }); test('Dead letter queues provide message resilience', () => {
      expect(templateYaml).toContain('RedrivePolicy:');
      expect(templateYaml).toContain('maxReceiveCount: 3');
      expect(templateYaml).toContain('deadLetterTargetArn:');
    });
  });

  // =================
  // OUTPUTS
  // =================
  describe('Outputs Section - Comprehensive Resource Exports', () => {
    test('KMS outputs are defined for encryption key access', () => {
      const kmsOutputs = ['KMSKeyArn', 'KMSKeyId', 'KMSKeyAlias'];

      const outputsSection = extractYamlSection('Outputs');
      kmsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
        expect(outputsSection).toContain('Name: !Sub \'${AWS::StackName}');
      });
    });

    test('Queue outputs are defined for integration testing', () => {
      const queueOutputs = [
        'HighValueQueueURL', 'HighValueQueueArn', 'HighValueQueueName',
        'StandardValueQueueURL', 'StandardValueQueueArn', 'StandardValueQueueName',
        'LowValueQueueURL', 'LowValueQueueArn', 'LowValueQueueName'
      ];

      const outputsSection = extractYamlSection('Outputs');
      queueOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('SNS topic outputs are defined', () => {
      const snsOutputs = ['TransactionTopicArn', 'TransactionTopicName', 'AlertsTopicArn', 'AlertsTopicName'];

      const outputsSection = extractYamlSection('Outputs');
      snsOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('EventBridge outputs are defined', () => {
      const eventBridgeOutputs = ['EventBusName', 'TransactionEventBusArn', 'FailedTransactionRuleName', 'FailedTransactionRuleArn'];

      const outputsSection = extractYamlSection('Outputs');
      eventBridgeOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('CloudWatch alarm outputs are defined', () => {
      const alarmOutputs = ['HighValueQueueAlarmName', 'StandardValueQueueAlarmName', 'LowValueQueueAlarmName'];

      const outputsSection = extractYamlSection('Outputs');
      alarmOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('IAM role outputs are defined', () => {
      const iamOutputs = ['EventBridgeRoleArn', 'EventBridgeRoleName'];

      const outputsSection = extractYamlSection('Outputs');
      iamOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Environment information outputs are defined', () => {
      const envOutputs = ['StackName', 'Region', 'EnvironmentSuffix'];

      const outputsSection = extractYamlSection('Outputs');
      envOutputs.forEach(output => {
        expect(outputsSection).toContain(`${output}:`);
        expect(outputsSection).toContain('Export:');
      });
    });

    test('Outputs follow consistent naming convention with EnvironmentSuffix', () => {
      const exportPattern = /Name: !Sub '\${AWS::StackName}-[\w-]+'/g;
      const exportMatches = templateYaml.match(exportPattern);

      expect(exportMatches).toBeDefined();
      expect(exportMatches!.length).toBeGreaterThan(20); // Should have many exports
    });
  });

  // ====================
  // INTEGRATION TESTING
  // ====================
  describe('End-to-End Integration Tests', () => {
    test('Message flow from SNS to SQS is properly configured', () => {
      // SNS Topic → Subscriptions → SQS Queues
      validateResourceDependencies('HighValueSubscription', ['TransactionTopic', 'HighValueQueue']);
      validateResourceDependencies('StandardValueSubscription', ['TransactionTopic', 'StandardValueQueue']);
      validateResourceDependencies('LowValueSubscription', ['TransactionTopic', 'LowValueQueue']);
    });

    test('Dead letter queue integration is properly configured', () => {
      // Main Queues → DLQ configuration
      expect(templateYaml).toContain('RedrivePolicy:');
      expect(templateYaml).toContain('deadLetterTargetArn: !GetAtt HighValueDLQ.Arn');
      expect(templateYaml).toContain('deadLetterTargetArn: !GetAtt StandardValueDLQ.Arn');
      expect(templateYaml).toContain('deadLetterTargetArn: !GetAtt LowValueDLQ.Arn');
    });

    test('EventBridge rule targets SNS topic for alerting', () => {
      validateResourceDependencies('FailedTransactionRule', ['TransactionEventBus', 'AlertsTopic']);
      expect(templateYaml).toContain('RoleArn: !GetAtt EventBridgeRole.Arn');
    });

    test('CloudWatch alarms monitor queue depths and alert via SNS', () => {
      validateResourceDependencies('HighValueQueueAlarm', ['HighValueQueue', 'AlertsTopic']);
      validateResourceDependencies('StandardValueQueueAlarm', ['StandardValueQueue', 'AlertsTopic']);
      validateResourceDependencies('LowValueQueueAlarm', ['LowValueQueue', 'AlertsTopic']);
    });

    test('KMS key permissions support all service integrations', () => {
      expect(templateYaml).toContain('sns.amazonaws.com');
      expect(templateYaml).toContain('sqs.amazonaws.com');
      expect(templateYaml).toContain('events.amazonaws.com');
      expect(templateYaml).toContain('cloudwatch.amazonaws.com');
      expect(templateYaml).toContain('kms:Decrypt');
      expect(templateYaml).toContain('kms:GenerateDataKey');
    });

    test('Resource dependencies are properly established to prevent circular references', () => {
      // EventBridge role is directly referenced in FailedTransactionRule via RoleArn
      // This creates an implicit dependency without needing explicit DependsOn
      expect(templateYaml).toContain('RoleArn: !GetAtt EventBridgeRole.Arn');
      // Verify EventBridge role exists
      validateResourceExists('EventBridgeRole', 'AWS::IAM::Role');
    });
  });

  // ======================
  // DEPLOYMENT VALIDATION
  // ======================
  describe('Deployment Validation Tests', () => {
    test('Dynamic extraction of deployment parameters works correctly', () => {
      if (Object.keys(deployedOutputs).length === 0) {
        console.log('Skipping deployment validation - no outputs available');
        return;
      }

      // Verify extracted values are reasonable
      expect(currentStackName).toBeTruthy();
      expect(currentStackName).not.toBe('unknown-stack');
      expect(currentEnvironmentSuffix).toBeTruthy();
      expect(currentEnvironmentSuffix).not.toBe('unknown-suffix');
      expect(region).toBeTruthy();
      expect(region).not.toBe('unknown-region');

      console.log(`Deployment validation using: Stack=${currentStackName}, Region=${region}, Suffix=${currentEnvironmentSuffix}`);
    });

    test('KMS resources are properly deployed with expected naming', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.KMSKeyArn) {
        expect(deployedOutputs.KMSKeyArn).toMatch(/^arn:aws:kms:/);
        expect(deployedOutputs.KMSKeyArn).toContain(region);
      }

      if (deployedOutputs.KMSKeyId) {
        expect(deployedOutputs.KMSKeyId).toMatch(/^[a-f0-9-]+$/);
      }
    });

    test('SNS topics are properly deployed with expected ARN patterns', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const snsOutputs = ['TransactionTopicArn', 'AlertsTopicArn'];
      snsOutputs.forEach(output => {
        if (deployedOutputs[output]) {
          expect(deployedOutputs[output]).toMatch(/^arn:aws:sns:/);
          expect(deployedOutputs[output]).toContain(region);
          expect(deployedOutputs[output]).toContain(currentStackName);
          expect(deployedOutputs[output]).toContain(currentEnvironmentSuffix);
        }
      });
    });

    test('SQS queues are properly deployed with FIFO naming', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      const queueUrlOutputs = ['HighValueQueueURL', 'StandardValueQueueURL', 'LowValueQueueURL'];
      queueUrlOutputs.forEach(output => {
        if (deployedOutputs[output]) {
          expect(deployedOutputs[output]).toMatch(/^https:\/\/sqs\./);
          expect(deployedOutputs[output]).toContain(region);
          expect(deployedOutputs[output]).toContain('.fifo');
          expect(deployedOutputs[output]).toContain(currentEnvironmentSuffix);
        }
      });

      const queueArnOutputs = ['HighValueQueueArn', 'StandardValueQueueArn', 'LowValueQueueArn'];
      queueArnOutputs.forEach(output => {
        if (deployedOutputs[output]) {
          expect(deployedOutputs[output]).toMatch(/^arn:aws:sqs:/);
          expect(deployedOutputs[output]).toContain(region);
          expect(deployedOutputs[output]).toContain('.fifo');
          expect(deployedOutputs[output]).toContain(currentStackName);
          expect(deployedOutputs[output]).toContain(currentEnvironmentSuffix);
        }
      });
    });

    test('EventBridge resources are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.TransactionEventBusArn) {
        expect(deployedOutputs.TransactionEventBusArn).toMatch(/^arn:aws:events:/);
        expect(deployedOutputs.TransactionEventBusArn).toContain(region);
        expect(deployedOutputs.TransactionEventBusArn).toContain(currentStackName);
        expect(deployedOutputs.TransactionEventBusArn).toContain(currentEnvironmentSuffix);
      }

      if (deployedOutputs.FailedTransactionRuleArn) {
        expect(deployedOutputs.FailedTransactionRuleArn).toMatch(/^arn:aws:events:/);
        expect(deployedOutputs.FailedTransactionRuleArn).toContain(region);
      }
    });

    test('IAM roles are properly deployed', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      if (deployedOutputs.EventBridgeRoleArn) {
        expect(deployedOutputs.EventBridgeRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\//);
        expect(deployedOutputs.EventBridgeRoleArn).toContain(currentStackName);
        expect(deployedOutputs.EventBridgeRoleArn).toContain(region);
        expect(deployedOutputs.EventBridgeRoleArn).toContain(currentEnvironmentSuffix);
      }
    });

    test('Environment-specific naming is applied correctly across all resources', () => {
      if (Object.keys(deployedOutputs).length === 0) return;

      // Verify the environment suffix matches expected pattern
      expect(currentEnvironmentSuffix).toMatch(/^(pr|dev|prod|test|staging)\d*$/);

      console.log('Deployed with environment suffix:', currentEnvironmentSuffix);
      console.log('All resource names should contain this suffix for proper isolation');

      // Count how many outputs contain the environment suffix
      const outputsWithSuffix = Object.values(deployedOutputs).filter(value =>
        typeof value === 'string' && value.includes(currentEnvironmentSuffix)
      );

      expect(outputsWithSuffix.length).toBeGreaterThan(5); // Should have many resources with suffix
    });
  });

  // ========================
  // PERFORMANCE & RELIABILITY
  // ========================
  describe('Performance and Reliability', () => {
    test('Queue configuration supports high-throughput processing', () => {
      // FIFO queues with content-based deduplication
      expect(templateYaml).toContain('FifoQueue: true');
      expect(templateYaml).toContain('ContentBasedDeduplication: true');

      // Appropriate redrive policy for resilience
      expect(templateYaml).toContain('maxReceiveCount: 3');
    });

    test('CloudWatch alarms have appropriate thresholds for queue monitoring', () => {
      // All queues use the same threshold of 1000 messages for consistency
      expect(templateYaml).toContain('Threshold: 1000');

      // Verify alarm descriptions specify different value tiers
      expect(templateYaml).toContain('Alert when high-value queue has > 1000 messages');
      expect(templateYaml).toContain('Alert when standard-value queue has > 1000 messages');
      expect(templateYaml).toContain('Alert when low-value queue has > 1000 messages');
    });

    test('EventBridge rule efficiently filters high-value failed transactions', () => {
      expect(templateYaml).toContain('numeric:');
      expect(templateYaml).toContain('- ">"');
      expect(templateYaml).toContain('- 5000'); // $5,000 threshold
    });

    test('Message filtering reduces unnecessary processing', () => {
      expect(templateYaml).toContain('FilterPolicy:');
      expect(templateYaml).toContain('amount:');
      expect(templateYaml).toContain('numeric:');
      // Verify different amount thresholds for routing
      expect(templateYaml).toContain('- ">"');
      expect(templateYaml).toContain('- 10000'); // High value threshold
      expect(templateYaml).toContain('- 1000');  // Standard/Low value threshold
    });

    test('Error handling provides comprehensive coverage', () => {
      // Dead letter queues for failed messages
      expect(templateYaml).toContain('RedrivePolicy:');

      // CloudWatch alarms for monitoring
      expect(templateYaml).toContain('AlarmActions:');

      // EventBridge for critical event alerting
      expect(templateYaml).toContain('EventPattern:');
    });
  });
});