import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class DatabaseStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // DB Subnet Group for Aurora
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for Aurora Serverless V2 cluster',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroupName: `db-subnet-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Aurora Serverless V2 MySQL cluster with automated backups
    this.auroraCluster = new rds.DatabaseCluster(this, 'AuroraServerlessV2Cluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0, // Using Aurora MySQL 8.0 compatible version
      }),
      clusterIdentifier: `aurora-cluster-${environmentSuffix}`,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `aurora-credentials-${environmentSuffix}`,
        description: 'Aurora database admin credentials',
      }),
      serverlessV2MinCapacity: 0.5, // Minimum capacity for cost optimization
      serverlessV2MaxCapacity: 16, // Maximum capacity for scalability
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      vpcSecurityGroups: props.dbSecurityGroup ? [props.dbSecurityGroup] : undefined,
      writer: rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
          autoMinorVersionUpgrade: true,
          enablePerformanceInsights: true,
        }),
      ],
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'Sun:04:00-Sun:05:00',
      deletionProtection: false, // Allow deletion for testing
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for testing
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
    });

    // Output cluster information
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: this.auroraCluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
      exportName: `${this.stackName}-ClusterReadEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.auroraCluster.secret.secretArn,
      description: 'ARN of the database credentials secret',
      exportName: `${this.stackName}-DatabaseSecretArn`,
    });
  }
}

export { DatabaseStack };