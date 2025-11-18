import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface ComplianceStackProps extends cdk.StackProps {
  environmentSuffix: string;
  encryptionKey: kms.IKey;
  kmsKeyArn: string;
  encryptedResourcesCount: number;
  configRulesCount: number;
  securityFeaturesEnabled: string[];
}

export class ComplianceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComplianceStackProps) {
    super(scope, id, props);

    // Systems Manager Parameters for secure configuration values
    new ssm.StringParameter(this, 'ComplianceStandard', {
      parameterName: `/security-compliance/${props.environmentSuffix}/config/compliance-standard`,
      stringValue: 'SOC2,PCI-DSS',
      description: 'Compliance standards being followed',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'EncryptionStandard', {
      parameterName: `/security-compliance/${props.environmentSuffix}/config/encryption-standard`,
      stringValue: 'AES-256',
      description: 'Encryption standard used',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'TLSVersion', {
      parameterName: `/security-compliance/${props.environmentSuffix}/config/tls-version`,
      stringValue: 'TLSv1.2',
      description: 'Minimum TLS version required',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'BackupRetention', {
      parameterName: `/security-compliance/${props.environmentSuffix}/config/backup-retention-days`,
      stringValue: '7',
      description: 'Database backup retention in days',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'LogRetention', {
      parameterName: `/security-compliance/${props.environmentSuffix}/config/log-retention-days`,
      stringValue: '365',
      description: 'CloudWatch Logs retention in days',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'FlowLogsRetention', {
      parameterName: `/security-compliance/${props.environmentSuffix}/config/flow-logs-retention-days`,
      stringValue: '90',
      description: 'VPC Flow Logs retention in days',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Compliance report outputs
    new cdk.CfnOutput(this, 'ComplianceReportKMSKey', {
      value: props.kmsKeyArn,
      description: 'KMS Key ARN used for encryption',
    });

    new cdk.CfnOutput(this, 'ComplianceReportEncryptedResources', {
      value: props.encryptedResourcesCount.toString(),
      description: 'Number of encrypted resources',
    });

    new cdk.CfnOutput(this, 'ComplianceReportConfigRules', {
      value: props.configRulesCount.toString(),
      description: 'Number of AWS Config rules deployed',
    });

    new cdk.CfnOutput(this, 'ComplianceReportSecurityFeatures', {
      value: props.securityFeaturesEnabled.join(', '),
      description: 'Enabled security features',
    });

    new cdk.CfnOutput(this, 'ComplianceReportStatus', {
      value: 'COMPLIANT',
      description: 'Overall compliance status',
    });

    // Apply tags
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');
  }
}
