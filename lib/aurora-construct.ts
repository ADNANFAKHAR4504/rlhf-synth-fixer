import { Construct } from 'constructs';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { Password } from '@cdktf/provider-random/lib/password';

export interface AuroraConstructProps {
  vpcId: string;
  subnetIds: string[];
  environmentName: string;
  instanceCount: number;
  instanceClass: string;
  environmentSuffix: string;
  cidrBase: number;
  readReplicaCount?: number; // Number of read replicas for prod/staging
}

export class AuroraConstruct extends Construct {
  public readonly clusterId: string;

  public readonly clusterEndpoint: string;

  public readonly clusterArn: string;

  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    super(scope, id);

    // Security Group
    const sg = new SecurityGroup(this, 'aurora-sg', {
      name: `aurora-sg-${props.environmentName}-${props.environmentSuffix}`,
      description: 'Security group for Aurora cluster',
      vpcId: props.vpcId,
      tags: {
        Name: `aurora-sg-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    new SecurityGroupRule(this, 'aurora-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: [`10.${props.cidrBase}.0.0/16`],
      securityGroupId: sg.id,
    });

    new SecurityGroupRule(this, 'aurora-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: sg.id,
    });

    // DB Subnet Group
    const subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `aurora-subnet-${props.environmentName}-${props.environmentSuffix}`,
      subnetIds: props.subnetIds,
      tags: {
        Name: `aurora-subnet-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    // Generate secure random password for Aurora master user
    const randomPassword = new Password(this, 'master-password-random', {
      length: 32,
      special: true,
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      minLower: 1,
      minUpper: 1,
      minNumeric: 1,
      minSpecial: 1,
    });

    // Store master password in SSM Parameter Store
    const masterPassword = new SsmParameter(this, 'master-password', {
      name: `/${props.environmentSuffix}/aurora/master-password`,
      type: 'SecureString',
      value: randomPassword.result,
      tags: {
        Environment: props.environmentName,
      },
    });

    // Aurora Cluster
    const cluster = new RdsCluster(this, 'cluster', {
      clusterIdentifier: `aurora-${props.environmentName}-${props.environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: 'appdb',
      masterUsername: 'dbadmin',
      masterPassword: masterPassword.value,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [sg.id],
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      tags: {
        Name: `aurora-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    // Cluster Instances (Writer)
    for (let i = 0; i < props.instanceCount; i++) {
      new RdsClusterInstance(this, `instance-${i}`, {
        identifier: `aurora-${props.environmentName}-${props.environmentSuffix}-${i}`,
        clusterIdentifier: cluster.id,
        instanceClass: props.instanceClass,
        engine: cluster.engine,
        engineVersion: cluster.engineVersion,
        tags: {
          Name: `aurora-instance-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
        },
      });
    }

    // Read Replicas (for prod and staging environments)
    const readReplicaCount = props.readReplicaCount || 0;
    for (let i = 0; i < readReplicaCount; i++) {
      new RdsClusterInstance(this, `read-replica-${i}`, {
        identifier: `aurora-${props.environmentName}-${props.environmentSuffix}-read-${i}`,
        clusterIdentifier: cluster.id,
        instanceClass: props.instanceClass,
        engine: cluster.engine,
        engineVersion: cluster.engineVersion,
        promotionTier: 15, // Lower priority for promotion
        tags: {
          Name: `aurora-read-replica-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
          Role: 'ReadReplica',
        },
      });
    }

    this.clusterId = cluster.id;
    this.clusterEndpoint = cluster.endpoint;
    this.clusterArn = cluster.arn;
  }
}
