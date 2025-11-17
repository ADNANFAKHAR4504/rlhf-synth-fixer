import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// CloudFormation template validation tests
describe('CloudFormation Compliance System - Unit Tests', () => {
  let template: any;

  beforeEach(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'template.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Compliance');
    });

    it('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    it('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    it('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    it('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBeDefined();
    });

    it('should have ComplianceEmailAddress parameter', () => {
      expect(template.Parameters.ComplianceEmailAddress).toBeDefined();
      expect(template.Parameters.ComplianceEmailAddress.Type).toBe('String');
    });

    it('should have ApprovedAMIList parameter', () => {
      expect(template.Parameters.ApprovedAMIList).toBeDefined();
      expect(template.Parameters.ApprovedAMIList.Type).toBe('CommaDelimitedList');
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should have ComplianceReportsBucket resource', () => {
      expect(template.Resources.ComplianceReportsBucket).toBeDefined();
      expect(template.Resources.ComplianceReportsBucket.Type).toBe('AWS::S3::Bucket');
    });

    it('should have versioning enabled', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    it('should have encryption configured', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    it('should have lifecycle policy for Glacier transition', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Transitions[0].TransitionInDays).toBe(90);
      expect(rule.Transitions[0].StorageClass).toBe('GLACIER');
    });

    it('should block public access', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    it('should have Retain deletion policy', () => {
      expect(template.Resources.ComplianceReportsBucket.DeletionPolicy).toBe('Retain');
    });
  });

  describe('Lambda Function', () => {
    it('should have ComplianceReportProcessorFunction resource', () => {
      expect(template.Resources.ComplianceReportProcessorFunction).toBeDefined();
      expect(template.Resources.ComplianceReportProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    it('should use Python 3.11 runtime', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    it('should have 300 second timeout', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    it('should have environment variables configured', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT_SUFFIX).toBeDefined();
    });

    it('should have inline code', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Code).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    it('should have ComplianceReportProcessorRole', () => {
      expect(template.Resources.ComplianceReportProcessorRole).toBeDefined();
      expect(template.Resources.ComplianceReportProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have SSMAutomationRole', () => {
      expect(template.Resources.SSMAutomationRole).toBeDefined();
      expect(template.Resources.SSMAutomationRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have EventBridgeInvokeLambdaRole', () => {
      expect(template.Resources.EventBridgeInvokeLambdaRole).toBeDefined();
      expect(template.Resources.EventBridgeInvokeLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have least privilege policies for Lambda role', () => {
      const role = template.Resources.ComplianceReportProcessorRole;
      const policy = role.Properties.Policies[0].PolicyDocument.Statement;

      // Check S3 permissions are scoped
      const s3Statement = policy.find((s: any) =>
        s.Action && s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement.Resource).toContain('compliance-reports-');

      // Check SNS permissions are scoped
      const snsStatement = policy.find((s: any) =>
        s.Action && s.Action.includes('sns:Publish')
      );
      expect(snsStatement.Resource.Ref).toBe('ComplianceAlertTopic');
    });
  });

  describe('SSM Documents', () => {
    it('should have IMDSv2ComplianceDocument', () => {
      expect(template.Resources.IMDSv2ComplianceDocument).toBeDefined();
      expect(template.Resources.IMDSv2ComplianceDocument.Type).toBe('AWS::SSM::Document');
    });

    it('should have ApprovedAMIComplianceDocument', () => {
      expect(template.Resources.ApprovedAMIComplianceDocument).toBeDefined();
      expect(template.Resources.ApprovedAMIComplianceDocument.Type).toBe('AWS::SSM::Document');
    });

    it('should have RequiredTagsComplianceDocument', () => {
      expect(template.Resources.RequiredTagsComplianceDocument).toBeDefined();
      expect(template.Resources.RequiredTagsComplianceDocument.Type).toBe('AWS::SSM::Document');
    });

    it('should use schema version 0.3 for all documents', () => {
      const documents = [
        'IMDSv2ComplianceDocument',
        'ApprovedAMIComplianceDocument',
        'RequiredTagsComplianceDocument'
      ];

      documents.forEach(docName => {
        const doc = template.Resources[docName];
        expect(doc.Properties.Content.schemaVersion).toBe('0.3');
      });
    });

    it('should reference SSMAutomationRole in documents', () => {
      const documents = [
        'IMDSv2ComplianceDocument',
        'ApprovedAMIComplianceDocument',
        'RequiredTagsComplianceDocument'
      ];

      documents.forEach(docName => {
        const doc = template.Resources[docName];
        expect(doc.Properties.Content.assumeRole['Fn::GetAtt'][0]).toBe('SSMAutomationRole');
      });
    });
  });

  describe('EventBridge Rules', () => {
    it('should have EC2StateChangeRule', () => {
      expect(template.Resources.EC2StateChangeRule).toBeDefined();
      expect(template.Resources.EC2StateChangeRule.Type).toBe('AWS::Events::Rule');
    });

    it('should have SecurityGroupChangeRule', () => {
      expect(template.Resources.SecurityGroupChangeRule).toBeDefined();
      expect(template.Resources.SecurityGroupChangeRule.Type).toBe('AWS::Events::Rule');
    });

    it('should have IAMRoleChangeRule', () => {
      expect(template.Resources.IAMRoleChangeRule).toBeDefined();
      expect(template.Resources.IAMRoleChangeRule.Type).toBe('AWS::Events::Rule');
    });

    it('should have correct event patterns', () => {
      const ec2Rule = template.Resources.EC2StateChangeRule;
      expect(ec2Rule.Properties.EventPattern.source).toContain('aws.ec2');
      expect(ec2Rule.Properties.EventPattern['detail-type']).toContain('EC2 Instance State-change Notification');

      const sgRule = template.Resources.SecurityGroupChangeRule;
      expect(sgRule.Properties.EventPattern.detail.eventName).toContain('AuthorizeSecurityGroupIngress');

      const iamRule = template.Resources.IAMRoleChangeRule;
      expect(iamRule.Properties.EventPattern.detail.eventName).toContain('CreateRole');
    });

    it('should target Lambda function with proper role', () => {
      const rules = ['EC2StateChangeRule', 'SecurityGroupChangeRule', 'IAMRoleChangeRule'];

      rules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        const target = rule.Properties.Targets[0];
        expect(target.Arn['Fn::GetAtt'][0]).toBe('ComplianceReportProcessorFunction');
        expect(target.RoleArn['Fn::GetAtt'][0]).toBe('EventBridgeInvokeLambdaRole');
      });
    });
  });

  describe('SNS Configuration', () => {
    it('should have ComplianceAlertTopic', () => {
      expect(template.Resources.ComplianceAlertTopic).toBeDefined();
      expect(template.Resources.ComplianceAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    it('should have email subscription', () => {
      expect(template.Resources.ComplianceAlertSubscription).toBeDefined();
      expect(template.Resources.ComplianceAlertSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(template.Resources.ComplianceAlertSubscription.Properties.Protocol).toBe('email');
    });
  });

  describe('CloudWatch', () => {
    it('should have ComplianceDashboard', () => {
      expect(template.Resources.ComplianceDashboard).toBeDefined();
      expect(template.Resources.ComplianceDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    it('should have log group with retention', () => {
      expect(template.Resources.ComplianceReportProcessorLogGroup).toBeDefined();
      expect(template.Resources.ComplianceReportProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ComplianceReportProcessorLogGroup.Properties.RetentionInDays).toBe(30);
    });

    it('should have Delete policy for log group', () => {
      expect(template.Resources.ComplianceReportProcessorLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Resource Tagging', () => {
    it('should have required tags on all taggable resources', () => {
      const taggableResources = [
        'ComplianceReportsBucket',
        'ComplianceAlertTopic',
        'ComplianceReportProcessorRole',
        'ComplianceReportProcessorFunction',
        'SSMAutomationRole',
        'IMDSv2ComplianceDocument',
        'ApprovedAMIComplianceDocument',
        'RequiredTagsComplianceDocument',
        'EventBridgeInvokeLambdaRole'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const projectTag = tags.find((t: any) => t.Key === 'Project');

          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('qa');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('compliance-checker');
        }
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'ComplianceReportsBucketName',
      'ComplianceAlertTopicArn',
      'ComplianceReportProcessorFunctionArn',
      'ComplianceDashboardURL',
      'IMDSv2ComplianceDocumentName',
      'ApprovedAMIComplianceDocumentName',
      'RequiredTagsComplianceDocumentName'
    ];

    expectedOutputs.forEach(outputName => {
      it(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    it('should export critical outputs', () => {
      const exportableOutputs = [
        'ComplianceReportsBucketName',
        'ComplianceAlertTopicArn',
        'ComplianceReportProcessorFunctionArn'
      ];

      exportableOutputs.forEach(outputName => {
        expect(template.Outputs[outputName].Export).toBeDefined();
        expect(template.Outputs[outputName].Export.Name).toBeDefined();
      });
    });
  });

  describe('Lambda Permissions', () => {
    it('should have permission for EC2StateChangeRule', () => {
      expect(template.Resources.EC2StateChangeRulePermission).toBeDefined();
      expect(template.Resources.EC2StateChangeRulePermission.Type).toBe('AWS::Lambda::Permission');
    });

    it('should have permission for SecurityGroupChangeRule', () => {
      expect(template.Resources.SecurityGroupChangeRulePermission).toBeDefined();
      expect(template.Resources.SecurityGroupChangeRulePermission.Type).toBe('AWS::Lambda::Permission');
    });

    it('should have permission for IAMRoleChangeRule', () => {
      expect(template.Resources.IAMRoleChangeRulePermission).toBeDefined();
      expect(template.Resources.IAMRoleChangeRulePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use EnvironmentSuffix in resource names', () => {
      // Check S3 bucket name
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check Lambda function name
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check SNS topic name
      const topic = template.Resources.ComplianceAlertTopic;
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check IAM role names
      const lambdaRole = template.Resources.ComplianceReportProcessorRole;
      expect(lambdaRole.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Best Practices', () => {
    it('should not have wildcard resources in IAM policies except where required', () => {
      const lambdaRole = template.Resources.ComplianceReportProcessorRole;
      const statements = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;

      statements.forEach((statement: any) => {
        if (statement.Resource === '*') {
          // Only EC2 describe actions should have wildcard
          const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
          const isDescribeOnly = actions.every((action: string) =>
            action.startsWith('ec2:Describe') ||
            action.startsWith('iam:Get') ||
            action.startsWith('iam:List') ||
            action.startsWith('ssm:Get') ||
            action.startsWith('ssm:Describe') ||
            action === 'cloudwatch:PutMetricData'
          );
          expect(isDescribeOnly).toBe(true);
        }
      });
    });

    it('should have CloudWatch namespace condition for PutMetricData', () => {
      const lambdaRole = template.Resources.ComplianceReportProcessorRole;
      const statements = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;

      const cwStatement = statements.find((s: any) =>
        s.Action && s.Action.includes('cloudwatch:PutMetricData')
      );

      expect(cwStatement.Condition).toBeDefined();
      expect(cwStatement.Condition.StringEquals['cloudwatch:namespace']).toBe('ComplianceChecker');
    });
  });
});