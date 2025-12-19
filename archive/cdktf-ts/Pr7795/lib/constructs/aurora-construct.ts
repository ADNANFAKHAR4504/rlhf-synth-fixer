import { Construct } from 'constructs';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

export interface AuroraConstructProps {
  environmentSuffix: string;
  vpcId: string;
  subnetIds: string[];
  engine: string;
  engineVersion: string;
  instanceClass: string;
  instanceCount: number;
  databaseName: string;
  masterUsername: string;
  skipFinalSnapshot?: boolean;
  replicationSourceArn?: string;
  tags?: Record<string, string>;
}

export class AuroraConstruct extends Construct {
  public readonly cluster: RdsCluster;
  public readonly instances: RdsClusterInstance[];
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      subnetIds,
      engine,
      engineVersion,
      instanceClass,
      instanceCount,
      databaseName,
      masterUsername,
      skipFinalSnapshot = true,
      replicationSourceArn,
      tags = {},
    } = props;

    // Create DB subnet group
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `aurora-subnet-group-${environmentSuffix}`,
      subnetIds,
      tags: {
        Name: `aurora-subnet-group-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create security group
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `aurora-sg-${environmentSuffix}`,
      description: `Security group for Aurora cluster ${environmentSuffix}`,
      vpcId,
      tags: {
        Name: `aurora-sg-${environmentSuffix}`,
        ...tags,
      },
    });

    // Allow PostgreSQL traffic from within VPC
    new SecurityGroupRule(this, 'sg-rule-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: this.securityGroup.id,
    });

    new SecurityGroupRule(this, 'sg-rule-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Store master password in SSM Parameter Store
    const masterPassword = new SsmParameter(this, 'master-password', {
      name: `/aurora/${environmentSuffix}/master-password`,
      type: 'SecureString',
      value: 'ChangeMe123!', // In production, use AWS Secrets Manager rotation
      description: `Master password for Aurora cluster ${environmentSuffix}`,
      tags: {
        Name: `aurora-master-password-${environmentSuffix}`,
        ...tags,
      },
    });

    // Create Aurora cluster
    const clusterConfig: any = {
      clusterIdentifier: `aurora-cluster-${environmentSuffix}`,
      engine,
      engineVersion,
      databaseName,
      masterUsername,
      masterPassword: masterPassword.value,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      skipFinalSnapshot,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      storageEncrypted: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        Name: `aurora-cluster-${environmentSuffix}`,
        ...tags,
      },
    };

    // Add replication source if specified (for cross-environment replication)
    if (replicationSourceArn) {
      clusterConfig.replicationSourceIdentifier = replicationSourceArn;
    }

    this.cluster = new RdsCluster(this, 'cluster', clusterConfig);

    // Create cluster instances
    this.instances = [];
    for (let i = 0; i < instanceCount; i++) {
      const instance = new RdsClusterInstance(this, `instance-${i}`, {
        identifier: `aurora-instance-${i}-${environmentSuffix}`,
        clusterIdentifier: this.cluster.id,
        instanceClass,
        engine,
        engineVersion,
        publiclyAccessible: false,
        tags: {
          Name: `aurora-instance-${i}-${environmentSuffix}`,
          ...tags,
        },
      });
      this.instances.push(instance);
    }

    // Store cluster endpoint in SSM
    new SsmParameter(this, 'cluster-endpoint', {
      name: `/aurora/${environmentSuffix}/cluster-endpoint`,
      type: 'String',
      value: this.cluster.endpoint,
      description: `Aurora cluster endpoint for ${environmentSuffix}`,
      tags: {
        Name: `aurora-cluster-endpoint-${environmentSuffix}`,
        ...tags,
      },
    });
  }
}
