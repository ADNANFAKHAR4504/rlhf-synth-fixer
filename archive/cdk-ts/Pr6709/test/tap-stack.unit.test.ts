import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/security-stack';
import { ComplianceStack } from '../lib/compliance-stack';
import * as kms from 'aws-cdk-lib/aws-kms';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  describe('TapStack - Main Stack', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        env: { region: 'us-east-1', account: '123456789012' },
      });
      template = Template.fromStack(stack);
    });

    test('Should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('Should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('Should use environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context-test' },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });

    test('Should export all required outputs', () => {
      const outputs = [
        'KMSKeyId',
        'KMSKeyArn',
        'VpcId',
        'FlowLogsBucketName',
        'ApplicationDataBucketName',
        'AuditLogsBucketName',
        'ClusterEndpoint',
        'ClusterReadEndpoint',
        'SecurityLogGroupName',
        'ComplianceSummary',
      ];
      outputs.forEach((output) => {
        template.hasOutput(output, Match.objectLike({}));
      });
    });

    test('Should have correct compliance summary', () => {
      const outputs = template.toJSON().Outputs;
      const complianceSummary = outputs.ComplianceSummary;
      expect(complianceSummary).toBeDefined();
      const summaryValue = JSON.parse(
        complianceSummary.Value['Fn::Join'][1].join('')
      );
      expect(summaryValue.encryptedResources).toBe(8);
      expect(summaryValue.configRules).toBe(5);
      expect(summaryValue.securityFeatures).toBe(10);
      expect(summaryValue.status).toBe('COMPLIANT');
      expect(summaryValue.complianceStandards).toContain('SOC2');
      expect(summaryValue.complianceStandards).toContain('PCI DSS');
    });
  });

  describe('SecurityStack Unit Tests', () => {
    let app: cdk.App;
    let securityStack: SecurityStack;
    let securityTemplate: Template;

    beforeEach(() => {
      app = new cdk.App();
      securityStack = new SecurityStack(app, 'TestSecurityStack', {
        environmentSuffix,
        env: { region: 'us-east-1', account: '123456789012' },
      });
      securityTemplate = Template.fromStack(securityStack);
    });

    test('Should create SecurityStack successfully', () => {
      expect(securityStack).toBeDefined();
      expect(securityStack.encryptionKey).toBeDefined();
      expect(securityStack.auditRole).toBeDefined();
      expect(securityStack.operationsRole).toBeDefined();
    });

    test('Should create KMS key with rotation enabled', () => {
      securityTemplate.resourceCountIs('AWS::KMS::Key', 1);
      securityTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        RotationPeriodInDays: 90,
      });
    });

    test('Should create KMS alias', () => {
      securityTemplate.resourceCountIs('AWS::KMS::Alias', 1);
    });

    test('Should have CloudWatch Logs permission in KMS key policy', () => {
      securityTemplate.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('Should create audit role with 1 hour max session', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('security-audit-role-.*'),
        MaxSessionDuration: 3600,
      });
    });

    test('Should create operations role with 2 hour max session', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('security-ops-role-.*'),
        MaxSessionDuration: 7200,
      });
    });

    test('Should have MFA requirement for sensitive operations', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Condition: {
                Bool: { 'aws:MultiFactorAuthPresent': 'true' },
              },
            }),
          ]),
        },
      });
    });

    test('Should have deny policy for destructive operations', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                'iam:DeleteUser',
                'kms:ScheduleKeyDeletion',
              ]),
            }),
          ]),
        },
      });
    });

    test('Should export KMS Key ID and ARN', () => {
      securityTemplate.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
      });
      securityTemplate.hasOutput('KMSKeyArn', {
        Description: 'KMS Key ARN for encryption',
      });
    });

    test('Should create exactly 2 IAM roles', () => {
      securityTemplate.resourceCountIs('AWS::IAM::Role', 2);
    });

    test('Should grant KMS key usage to operations role', () => {
      securityTemplate.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['kms:Decrypt', 'kms:Encrypt']),
            }),
          ]),
        },
      });
    });
  });

  describe('ComplianceStack Unit Tests', () => {
    let app: cdk.App;
    let complianceStack: ComplianceStack;
    let complianceTemplate: Template;
    let encryptionKey: kms.IKey;

    beforeEach(() => {
      app = new cdk.App();
      const keyStack = new cdk.Stack(app, 'ComplianceKeyStack');
      encryptionKey = new kms.Key(keyStack, 'TestKey');
      complianceStack = new ComplianceStack(app, 'TestComplianceStack', {
        environmentSuffix,
        encryptionKey,
        kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/test',
        encryptedResourcesCount: 8,
        configRulesCount: 5,
        securityFeaturesEnabled: ['feature1', 'feature2'],
        env: { region: 'us-east-1', account: '123456789012' },
      });
      complianceTemplate = Template.fromStack(complianceStack);
    });

    test('Should create ComplianceStack successfully', () => {
      expect(complianceStack).toBeDefined();
    });

    test('Should create SSM parameters for compliance', () => {
      complianceTemplate.resourceCountIs('AWS::SSM::Parameter', 6);
    });

    test('Should create compliance standard parameter', () => {
      complianceTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/security-compliance/${environmentSuffix}/config/compliance-standard`,
        Value: 'SOC2,PCI-DSS',
      });
    });

    test('Should create encryption standard parameter', () => {
      complianceTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/security-compliance/${environmentSuffix}/config/encryption-standard`,
        Value: 'AES-256',
      });
    });

    test('Should create TLS version parameter', () => {
      complianceTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/security-compliance/${environmentSuffix}/config/tls-version`,
        Value: 'TLSv1.2',
      });
    });

    test('Should create backup retention parameter', () => {
      complianceTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/security-compliance/${environmentSuffix}/config/backup-retention-days`,
        Value: '7',
      });
    });

    test('Should create log retention parameter', () => {
      complianceTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/security-compliance/${environmentSuffix}/config/log-retention-days`,
        Value: '365',
      });
    });

    test('Should create flow logs retention parameter', () => {
      complianceTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/security-compliance/${environmentSuffix}/config/flow-logs-retention-days`,
        Value: '90',
      });
    });

    test('Should export compliance report outputs', () => {
      complianceTemplate.hasOutput('ComplianceReportStatus', {
        Value: 'COMPLIANT',
      });
      complianceTemplate.hasOutput('ComplianceReportEncryptedResources', {
        Value: '8',
      });
      complianceTemplate.hasOutput('ComplianceReportConfigRules', {
        Value: '5',
      });
    });

    test('Should have KMS key ARN in compliance report', () => {
      complianceTemplate.hasOutput('ComplianceReportKMSKey', {
        Value: 'arn:aws:kms:us-east-1:123456789012:key/test',
      });
    });

    test('Should list security features in compliance report', () => {
      complianceTemplate.hasOutput('ComplianceReportSecurityFeatures', {
        Value: 'feature1, feature2',
      });
    });
  });
});
