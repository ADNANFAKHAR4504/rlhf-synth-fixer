import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  encryptionKey: kms.IKey;
  securityGroup: ec2.ISecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly cluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Parameter Group for RDS Aurora MySQL with TLS enforcement
    const parameterGroup = new rds.ParameterGroup(
      this,
      'AuroraParameterGroup',
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
        }),
        description: `Aurora MySQL parameter group for ${props.environmentSuffix}`,
        parameters: {
          require_secure_transport: 'ON', // Enforce TLS 1.2+
          tls_version: 'TLSv1.2,TLSv1.3', // Allow only TLS 1.2 and 1.3
        },
      }
    );

    // RDS Aurora MySQL Serverless v2 cluster with encryption
    this.cluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      writer: rds.ClusterInstance.serverlessV2('writer', {
        scaleWithWriter: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      storageEncrypted: true,
      storageEncryptionKey: props.encryptionKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // For CI/CD destroyability
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
      cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THREE_MONTHS,
      parameterGroup: parameterGroup,
      clusterIdentifier: `aurora-cluster-${props.environmentSuffix}`,
    });

    // Store database endpoint in Systems Manager Parameter Store
    new ssm.StringParameter(this, 'DatabaseEndpoint', {
      parameterName: `/security-compliance/${props.environmentSuffix}/database/endpoint`,
      stringValue: this.cluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'DatabaseReadEndpoint', {
      parameterName: `/security-compliance/${props.environmentSuffix}/database/read-endpoint`,
      stringValue: this.cluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'DatabasePort', {
      parameterName: `/security-compliance/${props.environmentSuffix}/database/port`,
      stringValue: this.cluster.clusterEndpoint.port.toString(),
      description: 'Aurora cluster port',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Apply tags
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');

    // Outputs
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.cluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
      exportName: `${props.environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: this.cluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
    });
  }
}
