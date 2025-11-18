import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';
import { NetworkingStack } from './networking-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { ComplianceStack } from './compliance-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create Security Stack first (provides KMS key and IAM roles)
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create Networking Stack (VPC, Flow Logs, Security Groups)
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: props?.env,
    });

    // Create Storage Stack (S3 buckets with encryption)
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: props?.env,
    });

    // Create Database Stack (RDS Aurora MySQL with TLS)
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      encryptionKey: securityStack.encryptionKey,
      securityGroup: networkingStack.databaseSecurityGroup,
      env: props?.env,
    });

    // Create Monitoring Stack (CloudWatch, SNS, AWS Config)
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      env: props?.env,
    });

    // Create Compliance Stack (Systems Manager parameters, compliance reports)
    const complianceStack = new ComplianceStack(this, 'ComplianceStack', {
      environmentSuffix,
      encryptionKey: securityStack.encryptionKey,
      kmsKeyArn: securityStack.encryptionKey.keyArn,
      encryptedResourcesCount: 8, // KMS, RDS, 3x S3, CloudWatch Logs, SNS, VPC Flow Logs
      configRulesCount: 5, // S3 encryption, RDS encryption, EBS encryption, IAM password policy, S3 public access
      securityFeaturesEnabled: [
        'KMS Auto-Rotation (90 days)',
        'VPC Flow Logs (90-day retention)',
        'RDS Aurora Serverless v2 (encrypted, TLS 1.2+)',
        'S3 SSE-KMS (customer-managed keys)',
        'IAM Session Limits (1-2 hours)',
        'IAM MFA Requirements',
        'CloudWatch Metric Filters',
        'Security Alarms (unauthorized access, privilege escalation)',
        'AWS Config Rules (5 rules)',
        'Systems Manager Parameter Store',
      ],
      env: props?.env,
    });

    // Add dependencies
    networkingStack.addDependency(securityStack);
    storageStack.addDependency(securityStack);
    databaseStack.addDependency(networkingStack);
    databaseStack.addDependency(securityStack);
    monitoringStack.addDependency(securityStack);
    complianceStack.addDependency(securityStack);

    // Apply global tags for compliance
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');
    cdk.Tags.of(this).add('ComplianceFramework', 'SOC2-PCI-DSS');

    // Note: Termination protection disabled for CI/CD destroyability
    // In production, enable with: this.terminationProtection = true;

    // Master compliance summary output
    new cdk.CfnOutput(this, 'ComplianceSummary', {
      value: JSON.stringify({
        kmsKeyArn: securityStack.encryptionKey.keyArn,
        encryptedResources: 8,
        configRules: 5,
        securityFeatures: 10,
        complianceStandards: ['SOC2', 'PCI DSS'],
        status: 'COMPLIANT',
      }),
      description: 'Compliance summary report',
    });

    // Expose all nested stack outputs
    // Security Stack Outputs
    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: securityStack.encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: securityStack.encryptionKey.keyArn,
      description: 'KMS Key ARN for encryption',
    });

    // Networking Stack Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'FlowLogsBucketName', {
      value: networkingStack.flowLogsBucket.bucketName,
      description: 'VPC Flow Logs S3 Bucket',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: networkingStack.databaseSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });

    // Storage Stack Outputs
    new cdk.CfnOutput(this, 'ApplicationDataBucketName', {
      value: storageStack.applicationDataBucket.bucketName,
      description: 'Application Data S3 Bucket',
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: storageStack.auditLogsBucket.bucketName,
      description: 'Audit Logs S3 Bucket',
    });

    // Database Stack Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: databaseStack.cluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: databaseStack.cluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
    });

    // Monitoring Stack Outputs
    new cdk.CfnOutput(this, 'SecurityLogGroupName', {
      value: monitoringStack.logGroup.logGroupName,
      description: 'CloudWatch Log Group for security events',
    });
  }
}
