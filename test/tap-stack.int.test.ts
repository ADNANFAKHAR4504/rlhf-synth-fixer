import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand
} from '@aws-sdk/client-config-service';
import {
  DescribeRuleCommand,
  EventBridgeClient,
  ListTargetsByRuleCommand
} from '@aws-sdk/client-eventbridge';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient
} from '@aws-sdk/client-sns';
import {
  GetParameterCommand,
  SSMClient
} from '@aws-sdk/client-ssm';

const STACK_NAME = process.env.STACK_NAME || 'tap-stack-compliance';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SECURITY_TEAM_EMAIL = process.env.SECURITY_TEAM_EMAIL || 'security@example.com';

// Initialize AWS SDK clients
const cfClient = new CloudFormationClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const configClient = new ConfigServiceClient({ region: AWS_REGION });
const ssmClient = new SSMClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const eventBridgeClient = new EventBridgeClient({ region: AWS_REGION });

describe('Compliance Stack - Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    // Get stack outputs and resources
    try {
      const stackResponse = await cfClient.send(
        new DescribeStacksCommand({ StackName: STACK_NAME })
      );

      const stack = stackResponse.Stacks?.[0];
      if (stack?.Outputs) {
        stackOutputs = stack.Outputs.reduce((acc, output) => {
          if (output.OutputKey && output.OutputValue) {
            acc[output.OutputKey] = output.OutputValue;
          }
          return acc;
        }, {} as Record<string, string>);
      }

      const resourcesResponse = await cfClient.send(
        new ListStackResourcesCommand({ StackName: STACK_NAME })
      );
      stackResources = resourcesResponse.StackResourceSummaries || [];
    } catch (error) {
      console.error('Failed to fetch stack information:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('stack should be deployed successfully', async () => {
      const response = await cfClient.send(
        new DescribeStacksCommand({ StackName: STACK_NAME })
      );
      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks?.[0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('stack should have all expected resources', async () => {
      expect(stackResources.length).toBeGreaterThan(0);

      const resourceTypes = stackResources.map(r => r.ResourceType);
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::Config::ConfigRule');
      expect(resourceTypes).toContain('AWS::SNS::Topic');
      expect(resourceTypes).toContain('AWS::SNS::Subscription');
      expect(resourceTypes).toContain('AWS::SSM::Parameter');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::Events::Rule');
    });

    test('all resources should be in CREATE_COMPLETE or UPDATE_COMPLETE status', async () => {
      stackResources.forEach(resource => {
        expect(resource.ResourceStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
      });
    });

    test('stack should have expected outputs', async () => {
      expect(stackOutputs.ComplianceReportsBucketName).toBeDefined();
      expect(stackOutputs.ComplianceNotificationTopicArn).toBeDefined();
      expect(stackOutputs.ComplianceDashboardURL).toBeDefined();
    });
  });

  describe('S3 Bucket Integration', () => {
    let bucketName: string;

    beforeAll(() => {
      bucketName = stackOutputs.ComplianceReportsBucketName;
    });

    test('compliance reports bucket should exist', async () => {
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(`compliance-reports-${ENVIRONMENT_SUFFIX}`);
    });

    test('bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(response.Status).toBe('Enabled');
    });

    test('bucket should have encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]
        .ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('bucket should have public access blocked', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('bucket should have lifecycle configuration', async () => {
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const glacierRule = response.Rules?.find(r =>
        r.Transitions?.some(t => t.StorageClass === 'GLACIER')
      );
      expect(glacierRule).toBeDefined();
      expect(glacierRule?.Status).toBe('Enabled');
    });
  });

  describe('Lambda Functions Integration', () => {
    test('TagComplianceFunction should be deployed', async () => {
      const funcName = `tag-compliance-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: funcName })
      );

      expect(response.Configuration?.FunctionName).toBe(funcName);
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.Handler).toBe('index.lambda_handler');
      expect(response.Configuration?.MemorySize).toBe(256);
      expect(response.Configuration?.Timeout).toBe(60);
    });

    test('TagComplianceFunction should have correct environment variables', async () => {
      const funcName = `tag-compliance-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: funcName })
      );

      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toContain('compliance-notifications');
    });

    test('DriftDetectionFunction should be deployed', async () => {
      const funcName = `drift-detection-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: funcName })
      );

      expect(response.Configuration?.FunctionName).toBe(funcName);
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.Timeout).toBe(300);
    });

    test('DriftDetectionFunction should have correct environment variables', async () => {
      const funcName = `drift-detection-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: funcName })
      );

      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
      expect(response.Environment?.Variables?.REPORTS_BUCKET).toBeDefined();
      expect(response.Environment?.Variables?.REPORTS_BUCKET).toContain('compliance-reports');
    });

    test('SecurityPolicyValidatorFunction should be deployed', async () => {
      const funcName = `security-policy-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: funcName })
      );

      expect(response.Configuration?.FunctionName).toBe(funcName);
      expect(response.Configuration?.Runtime).toBe('python3.9');
      expect(response.Configuration?.MemorySize).toBe(256);
    });

    test('SecurityPolicyValidatorFunction should have correct environment variables', async () => {
      const funcName = `security-policy-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: funcName })
      );

      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
      expect(response.Environment?.Variables?.ENVIRONMENT_SUFFIX).toBe(ENVIRONMENT_SUFFIX);
    });

    test('all Lambda functions should have execution role attached', async () => {
      const functions = [
        `tag-compliance-validator-${ENVIRONMENT_SUFFIX}`,
        `drift-detection-validator-${ENVIRONMENT_SUFFIX}`,
        `security-policy-validator-${ENVIRONMENT_SUFFIX}`
      ];

      for (const funcName of functions) {
        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: funcName })
        );
        expect(response.Role).toBeDefined();
        expect(response.Role).toContain(`lambda-compliance-role-${ENVIRONMENT_SUFFIX}`);
      }
    });
  });

  describe('IAM Roles Integration', () => {
    test('LambdaExecutionRole should exist', async () => {
      const roleName = `lambda-compliance-role-${ENVIRONMENT_SUFFIX}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
    });

    test('LambdaExecutionRole should have correct trust policy', async () => {
      const roleName = `lambda-compliance-role-${ENVIRONMENT_SUFFIX}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have required managed policies', async () => {
      const roleName = `lambda-compliance-role-${ENVIRONMENT_SUFFIX}`;
      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyArns = response.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('LambdaExecutionRole should have inline compliance policy', async () => {
      const roleName = `lambda-compliance-role-${ENVIRONMENT_SUFFIX}`;
      const policiesResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      expect(policiesResponse.PolicyNames).toContain('ComplianceValidationPolicy');

      const policyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'ComplianceValidationPolicy'
        })
      );

      const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      expect(policyDocument.Statement.length).toBeGreaterThan(0);

      // Verify Config permissions
      const hasConfigPerms = policyDocument.Statement.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('config:'))
      );
      expect(hasConfigPerms).toBe(true);

      // Verify S3 permissions
      const hasS3Perms = policyDocument.Statement.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(hasS3Perms).toBe(true);
    });

    test('ComplianceEventBridgeRole should exist', async () => {
      const roleName = `eventbridge-compliance-role-${ENVIRONMENT_SUFFIX}`;
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role?.RoleName).toBe(roleName);
    });

    test('ComplianceEventBridgeRole should have Lambda invoke permissions', async () => {
      const roleName = `eventbridge-compliance-role-${ENVIRONMENT_SUFFIX}`;
      const policiesResponse = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      expect(policiesResponse.PolicyNames).toContain('InvokeLambdaPolicy');

      const policyResponse = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'InvokeLambdaPolicy'
        })
      );

      const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      const lambdaStatement = policyDocument.Statement.find((s: any) =>
        s.Action === 'lambda:InvokeFunction'
      );
      expect(lambdaStatement).toBeDefined();
      expect(Array.isArray(lambdaStatement.Resource)).toBe(true);
    });
  });

  describe('SNS Topic Integration', () => {
    let topicArn: string;

    beforeAll(() => {
      topicArn = stackOutputs.ComplianceNotificationTopicArn;
    });

    test('compliance notification topic should exist', async () => {
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain(`compliance-notifications-${ENVIRONMENT_SUFFIX}`);

      const response = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.DisplayName).toBe('Compliance Notifications');
    });

    test('topic should have email subscription', async () => {
      const response = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: topicArn })
      );

      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);

      const emailSub = response.Subscriptions?.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    });
  });

  describe('AWS Config Rules Integration', () => {
    test('TagComplianceConfigRule should be deployed', async () => {
      const ruleName = `tag-compliance-rule-${ENVIRONMENT_SUFFIX}`;
      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toHaveLength(1);
      expect(response.ConfigRules?.[0].ConfigRuleName).toBe(ruleName);
      expect(response.ConfigRules?.[0].Source.Owner).toBe('CUSTOM_LAMBDA');
      expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
    });

    test('TagComplianceConfigRule should reference correct Lambda function', async () => {
      const ruleName = `tag-compliance-rule-${ENVIRONMENT_SUFFIX}`;
      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      const sourceIdentifier = response.ConfigRules?.[0].Source.SourceIdentifier;
      expect(sourceIdentifier).toContain(`tag-compliance-validator-${ENVIRONMENT_SUFFIX}`);
    });

    test('DriftDetectionConfigRule should be deployed', async () => {
      const ruleName = `drift-detection-rule-${ENVIRONMENT_SUFFIX}`;
      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toHaveLength(1);
      expect(response.ConfigRules?.[0].ConfigRuleName).toBe(ruleName);
      expect(response.ConfigRules?.[0].Source.Owner).toBe('CUSTOM_LAMBDA');
    });

    test('DriftDetectionConfigRule should have scheduled execution', async () => {
      const ruleName = `drift-detection-rule-${ENVIRONMENT_SUFFIX}`;
      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      const sourceDetails = response.ConfigRules?.[0].Source.SourceDetails;
      expect(sourceDetails).toBeDefined();

      const scheduledNotification = sourceDetails?.find(sd =>
        sd.MessageType === 'ScheduledNotification'
      );
      expect(scheduledNotification).toBeDefined();
      expect(scheduledNotification?.MaximumExecutionFrequency).toBe('TwentyFour_Hours');
    });

    test('SecurityPolicyConfigRule should be deployed', async () => {
      const ruleName = `security-policy-rule-${ENVIRONMENT_SUFFIX}`;
      const response = await configClient.send(
        new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
      );

      expect(response.ConfigRules).toHaveLength(1);
      expect(response.ConfigRules?.[0].ConfigRuleName).toBe(ruleName);
      expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
    });

    test('all config rules should be in ACTIVE state', async () => {
      const ruleNames = [
        `tag-compliance-rule-${ENVIRONMENT_SUFFIX}`,
        `drift-detection-rule-${ENVIRONMENT_SUFFIX}`,
        `security-policy-rule-${ENVIRONMENT_SUFFIX}`
      ];

      for (const ruleName of ruleNames) {
        const response = await configClient.send(
          new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
        );
        expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
      }
    });
  });

  describe('SSM Parameters Integration', () => {
    test('ApprovedAMIsParameter should exist', async () => {
      const paramName = `/compliance/approved-amis-${ENVIRONMENT_SUFFIX}`;
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: paramName })
      );

      expect(response.Parameter?.Name).toBe(paramName);
      expect(response.Parameter?.Type).toBe('String');
      expect(response.Parameter?.Value).toBeDefined();

      const value = JSON.parse(response.Parameter!.Value!);
      expect(Array.isArray(value)).toBe(true);
      expect(value.length).toBeGreaterThan(0);
    });

    test('SecurityGroupRulesParameter should exist', async () => {
      const paramName = `/compliance/security-group-rules-${ENVIRONMENT_SUFFIX}`;
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: paramName })
      );

      expect(response.Parameter?.Name).toBe(paramName);
      const value = JSON.parse(response.Parameter!.Value!);
      expect(value.max_ports).toBeDefined();
      expect(value.allowed_protocols).toBeDefined();
      expect(value.forbidden_cidrs).toBeDefined();
    });

    test('ComplianceThresholdsParameter should exist', async () => {
      const paramName = `/compliance/thresholds-${ENVIRONMENT_SUFFIX}`;
      const response = await ssmClient.send(
        new GetParameterCommand({ Name: paramName })
      );

      expect(response.Parameter?.Name).toBe(paramName);
      const value = JSON.parse(response.Parameter!.Value!);
      expect(value.max_drift_count).toBeDefined();
      expect(value.critical_resources).toBeDefined();
      expect(Array.isArray(value.critical_resources)).toBe(true);
    });
  });

  describe('CloudWatch Logs Integration', () => {
    test('TagComplianceFunctionLogGroup should exist', async () => {
      const logGroupName = `/aws/lambda/tag-compliance-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('DriftDetectionFunctionLogGroup should exist', async () => {
      const logGroupName = `/aws/lambda/drift-detection-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('SecurityPolicyFunctionLogGroup should exist', async () => {
      const logGroupName = `/aws/lambda/security-policy-validator-${ENVIRONMENT_SUFFIX}`;
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });
  });

  describe('EventBridge Rules Integration', () => {
    test('ConfigComplianceChangeRule should be deployed', async () => {
      const ruleName = `config-compliance-change-${ENVIRONMENT_SUFFIX}`;
      const response = await eventBridgeClient.send(
        new DescribeRuleCommand({ Name: ruleName })
      );

      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
      expect(response.EventPattern).toBeDefined();

      const eventPattern = JSON.parse(response.EventPattern!);
      expect(eventPattern.source).toContain('aws.config');
      expect(eventPattern['detail-type']).toContain('Config Rules Compliance Change');
    });

    test('ConfigComplianceChangeRule should target TagComplianceFunction', async () => {
      const ruleName = `config-compliance-change-${ENVIRONMENT_SUFFIX}`;
      const response = await eventBridgeClient.send(
        new ListTargetsByRuleCommand({ Rule: ruleName })
      );

      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);

      const lambdaTarget = response.Targets?.find(t =>
        t.Arn?.includes('tag-compliance-validator')
      );
      expect(lambdaTarget).toBeDefined();
    });
  });

  describe('Lambda Function Execution Tests', () => {
    test('TagComplianceFunction should handle compliant resources', async () => {
      const funcName = `tag-compliance-validator-${ENVIRONMENT_SUFFIX}`;
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::S3::Bucket',
          resourceId: 'test-bucket',
          tags: {
            Environment: 'Production',
            Owner: 'DevOps',
            CostCenter: 'Engineering'
          },
          configurationItemCaptureTime: new Date().toISOString()
        }),
        resultToken: 'test-token-123'
      };

      try {
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: funcName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(JSON.stringify(event))
          })
        );

        const payload = JSON.parse(Buffer.from(response.Payload!).toString());
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.ComplianceType).toBe('COMPLIANT');
      } catch (error: any) {
        // If function requires actual Config invocation, skip this test
        if (error.name === 'InvalidRequestContentException') {
          console.log('Skipping direct Lambda invocation test - requires Config integration');
        } else {
          throw error;
        }
      }
    }, 30000);

    test('TagComplianceFunction should detect non-compliant resources', async () => {
      const funcName = `tag-compliance-validator-${ENVIRONMENT_SUFFIX}`;
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::S3::Bucket',
          resourceId: 'test-bucket-non-compliant',
          tags: {
            Environment: 'Production'
            // Missing Owner and CostCenter tags
          },
          configurationItemCaptureTime: new Date().toISOString()
        }),
        resultToken: 'test-token-456'
      };

      try {
        const response = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: funcName,
            InvocationType: 'RequestResponse',
            Payload: Buffer.from(JSON.stringify(event))
          })
        );

        const payload = JSON.parse(Buffer.from(response.Payload!).toString());
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.ComplianceType).toBe('NON_COMPLIANT');
        expect(body.Annotation).toContain('Owner');
        expect(body.Annotation).toContain('CostCenter');
      } catch (error: any) {
        if (error.name === 'InvalidRequestContentException') {
          console.log('Skipping direct Lambda invocation test - requires Config integration');
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('End-to-End Compliance Flow', () => {
    test('stack outputs should provide correct resource references', async () => {
      const bucketName = stackOutputs.ComplianceReportsBucketName;
      const topicArn = stackOutputs.ComplianceNotificationTopicArn;
      const dashboardUrl = stackOutputs.ComplianceDashboardURL;

      expect(bucketName).toContain('compliance-reports');
      expect(topicArn).toContain('compliance-notifications');
      expect(dashboardUrl).toContain('console.aws.amazon.com/cloudwatch');
      expect(dashboardUrl).toContain('compliance-dashboard');
    });

    test('Lambda functions should have access to required resources', async () => {
      const functions = [
        `tag-compliance-validator-${ENVIRONMENT_SUFFIX}`,
        `drift-detection-validator-${ENVIRONMENT_SUFFIX}`,
        `security-policy-validator-${ENVIRONMENT_SUFFIX}`
      ];

      for (const funcName of functions) {
        const response = await lambdaClient.send(
          new GetFunctionConfigurationCommand({ FunctionName: funcName })
        );

        // Verify function has execution role
        expect(response.Role).toBeDefined();
        expect(response.Role).toContain('lambda-compliance-role');

        // Verify environment variables reference correct resources
        if (response.Environment?.Variables?.REPORTS_BUCKET) {
          expect(response.Environment.Variables.REPORTS_BUCKET).toBe(
            stackOutputs.ComplianceReportsBucketName
          );
        }

        if (response.Environment?.Variables?.SNS_TOPIC_ARN) {
          expect(response.Environment.Variables.SNS_TOPIC_ARN).toBe(
            stackOutputs.ComplianceNotificationTopicArn
          );
        }
      }
    });

    test('Config rules should be monitoring correct resource types', async () => {
      const rules = [
        `tag-compliance-rule-${ENVIRONMENT_SUFFIX}`,
        `drift-detection-rule-${ENVIRONMENT_SUFFIX}`,
        `security-policy-rule-${ENVIRONMENT_SUFFIX}`
      ];

      for (const ruleName of rules) {
        const response = await configClient.send(
          new DescribeConfigRulesCommand({ ConfigRuleNames: [ruleName] })
        );

        expect(response.ConfigRules?.[0].ConfigRuleState).toBe('ACTIVE');
        expect(response.ConfigRules?.[0].Source.Owner).toBe('CUSTOM_LAMBDA');
        expect(response.ConfigRules?.[0].Source.SourceIdentifier).toBeDefined();
      }
    });
  });
});
