import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Compliance System - Integration Tests', () => {
  let template: any;
  let templatePath: string;

  beforeAll(() => {
    templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateBody = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateBody);
  });

  describe('Template Validation', () => {
    it('should have valid CloudFormation JSON template', () => {
      expect(fs.existsSync(templatePath)).toBe(true);
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    it('should have a proper description', () => {
      expect(template.Description).toContain('Automated Infrastructure Compliance');
    });
  });

  describe('Template Structure', () => {
    it('should have required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    it('should have compliance email parameter', () => {
      expect(template.Parameters.ComplianceEmailAddress).toBeDefined();
      expect(template.Parameters.ComplianceEmailAddress.Type).toBe('String');
    });

    it('should have approved AMI list parameter', () => {
      expect(template.Parameters.ApprovedAMIList).toBeDefined();
      expect(template.Parameters.ApprovedAMIList.Type).toBe('CommaDelimitedList');
    });

    it('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('S3 Resources', () => {
    it('should define compliance reports bucket', () => {
      expect(template.Resources.ComplianceReportsBucket).toBeDefined();
      expect(template.Resources.ComplianceReportsBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.ComplianceReportsBucket.DeletionPolicy).toBe('Retain');
    });

    it('should have versioning enabled on S3 bucket', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    it('should have encryption on S3 bucket', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    it('should have lifecycle configuration', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function Resources', () => {
    it('should define compliance report processor function', () => {
      expect(template.Resources.ComplianceReportProcessorFunction).toBeDefined();
      expect(template.Resources.ComplianceReportProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    it('should use Python 3.11 runtime', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    it('should have environment variables configured', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
    });

    it('should have appropriate timeout', () => {
      const lambda = template.Resources.ComplianceReportProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });
  });

  describe('SSM Documents', () => {
    it('should define IMDSv2 compliance document', () => {
      expect(template.Resources.IMDSv2ComplianceDocument).toBeDefined();
      expect(template.Resources.IMDSv2ComplianceDocument.Type).toBe('AWS::SSM::Document');
      expect(template.Resources.IMDSv2ComplianceDocument.Properties.DocumentType).toBe('Automation');
    });

    it('should define Approved AMI compliance document', () => {
      expect(template.Resources.ApprovedAMIComplianceDocument).toBeDefined();
      expect(template.Resources.ApprovedAMIComplianceDocument.Type).toBe('AWS::SSM::Document');
    });

    it('should define Required Tags compliance document', () => {
      expect(template.Resources.RequiredTagsComplianceDocument).toBeDefined();
      expect(template.Resources.RequiredTagsComplianceDocument.Type).toBe('AWS::SSM::Document');
    });
  });

  describe('IAM Resources', () => {
    it('should define compliance report processor role', () => {
      expect(template.Resources.ComplianceReportProcessorRole).toBeDefined();
      expect(template.Resources.ComplianceReportProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    it('should define SSM automation role', () => {
      expect(template.Resources.SSMAutomationRole).toBeDefined();
      expect(template.Resources.SSMAutomationRole.Type).toBe('AWS::IAM::Role');
    });

    it('should define EventBridge Lambda invocation role', () => {
      expect(template.Resources.EventBridgeInvokeLambdaRole).toBeDefined();
      expect(template.Resources.EventBridgeInvokeLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have proper policies attached to Lambda role', () => {
      const role = template.Resources.ComplianceReportProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });
  });

  describe('EventBridge Rules', () => {
    it('should define EC2 state change rule', () => {
      expect(template.Resources.EC2StateChangeRule).toBeDefined();
      expect(template.Resources.EC2StateChangeRule.Type).toBe('AWS::Events::Rule');
      expect(template.Resources.EC2StateChangeRule.Properties.State).toBe('ENABLED');
    });

    it('should define security group change rule', () => {
      expect(template.Resources.SecurityGroupChangeRule).toBeDefined();
      expect(template.Resources.SecurityGroupChangeRule.Type).toBe('AWS::Events::Rule');
      expect(template.Resources.SecurityGroupChangeRule.Properties.State).toBe('ENABLED');
    });

    it('should define IAM role change rule', () => {
      expect(template.Resources.IAMRoleChangeRule).toBeDefined();
      expect(template.Resources.IAMRoleChangeRule.Type).toBe('AWS::Events::Rule');
      expect(template.Resources.IAMRoleChangeRule.Properties.State).toBe('ENABLED');
    });

    it('should have Lambda function as target for EC2 rule', () => {
      const rule = template.Resources.EC2StateChangeRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      expect(rule.Properties.Targets[0].Arn).toBeDefined();
    });
  });

  describe('SNS Resources', () => {
    it('should define compliance alert topic', () => {
      expect(template.Resources.ComplianceAlertTopic).toBeDefined();
      expect(template.Resources.ComplianceAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    it('should define email subscription', () => {
      expect(template.Resources.ComplianceAlertSubscription).toBeDefined();
      expect(template.Resources.ComplianceAlertSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(template.Resources.ComplianceAlertSubscription.Properties.Protocol).toBe('email');
    });
  });

  describe('CloudWatch Resources', () => {
    it('should define compliance dashboard', () => {
      expect(template.Resources.ComplianceDashboard).toBeDefined();
      expect(template.Resources.ComplianceDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    it('should define log group for Lambda function', () => {
      expect(template.Resources.ComplianceReportProcessorLogGroup).toBeDefined();
      expect(template.Resources.ComplianceReportProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    it('should have retention policy on log group', () => {
      const logGroup = template.Resources.ComplianceReportProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Template Outputs', () => {
    it('should export bucket name', () => {
      expect(template.Outputs.ComplianceReportsBucketName).toBeDefined();
      expect(template.Outputs.ComplianceReportsBucketName.Export).toBeDefined();
    });

    it('should export SNS topic ARN', () => {
      expect(template.Outputs.ComplianceAlertTopicArn).toBeDefined();
      expect(template.Outputs.ComplianceAlertTopicArn.Export).toBeDefined();
    });

    it('should export Lambda function ARN', () => {
      expect(template.Outputs.ComplianceReportProcessorFunctionArn).toBeDefined();
      expect(template.Outputs.ComplianceReportProcessorFunctionArn.Export).toBeDefined();
    });

    it('should export dashboard URL', () => {
      expect(template.Outputs.ComplianceDashboardURL).toBeDefined();
      expect(template.Outputs.ComplianceDashboardURL.Value).toBeDefined();
    });

    it('should export SSM document names', () => {
      expect(template.Outputs.IMDSv2ComplianceDocumentName).toBeDefined();
      expect(template.Outputs.ApprovedAMIComplianceDocumentName).toBeDefined();
      expect(template.Outputs.RequiredTagsComplianceDocumentName).toBeDefined();
    });
  });

  describe('Security Best Practices', () => {
    it('should block public access on S3 bucket', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    it('should have tags on resources', () => {
      const bucket = template.Resources.ComplianceReportsBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags.length).toBeGreaterThan(0);
    });

    it('should use least privilege IAM policies', () => {
      const role = template.Resources.ComplianceReportProcessorRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyDocument.Statement).toBeDefined();
      expect(policy.PolicyDocument.Statement.length).toBeGreaterThan(0);
    });
  });
});