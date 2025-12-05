import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class RDSConfigAspect implements cdk.IAspect {
  private readonly MIN_BACKUP_RETENTION = 7; // days

  visit(node: IConstruct): void {
    if (node instanceof rds.CfnDBInstance) {
      this.validateRDSInstance(node);
    } else if (node instanceof rds.CfnDBCluster) {
      this.validateRDSCluster(node);
    }
  }

  private validateRDSInstance(instance: rds.CfnDBInstance): void {
    const startTime = Date.now();
    const instanceId = instance.dbInstanceIdentifier || instance.logicalId;

    // Check encryption
    const storageEncrypted = instance.storageEncrypted;
    if (!storageEncrypted) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'RDS',
        resource: instance.node.path,
        message: 'RDS instance does not have encryption enabled',
        remediation: 'Enable storage encryption on the RDS instance',
        executionTime: Date.now() - startTime,
        metadata: {
          instanceId,
        },
      });
    }

    // Check backup retention
    const backupRetention = instance.backupRetentionPeriod || 1;
    if (backupRetention < this.MIN_BACKUP_RETENTION) {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'RDS',
        resource: instance.node.path,
        message: `RDS instance backup retention (${backupRetention} days) is below recommended minimum (${this.MIN_BACKUP_RETENTION} days)`,
        remediation: `Increase backup retention to at least ${this.MIN_BACKUP_RETENTION} days for production databases`,
        executionTime: Date.now() - startTime,
        metadata: {
          instanceId,
          currentRetention: backupRetention,
          recommendedRetention: this.MIN_BACKUP_RETENTION,
        },
      });
    }

    // Check Multi-AZ
    const multiAz = instance.multiAz;
    if (!multiAz) {
      ValidationRegistry.addFinding({
        severity: 'info',
        category: 'RDS',
        resource: instance.node.path,
        message: 'RDS instance is not configured for Multi-AZ',
        remediation:
          'Enable Multi-AZ for production databases to improve availability',
        executionTime: Date.now() - startTime,
        metadata: {
          instanceId,
        },
      });
    }
  }

  private validateRDSCluster(cluster: rds.CfnDBCluster): void {
    const startTime = Date.now();
    const clusterId = cluster.dbClusterIdentifier || cluster.logicalId;

    // Check encryption
    const storageEncrypted = cluster.storageEncrypted;
    if (!storageEncrypted) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'RDS',
        resource: cluster.node.path,
        message: 'RDS cluster does not have encryption enabled',
        remediation: 'Enable storage encryption on the RDS cluster',
        executionTime: Date.now() - startTime,
        metadata: {
          clusterId,
        },
      });
    }

    // Check backup retention
    const backupRetention = cluster.backupRetentionPeriod || 1;
    if (backupRetention < this.MIN_BACKUP_RETENTION) {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'RDS',
        resource: cluster.node.path,
        message: `RDS cluster backup retention (${backupRetention} days) is below recommended minimum (${this.MIN_BACKUP_RETENTION} days)`,
        remediation: `Increase backup retention to at least ${this.MIN_BACKUP_RETENTION} days`,
        executionTime: Date.now() - startTime,
        metadata: {
          clusterId,
          currentRetention: backupRetention,
          recommendedRetention: this.MIN_BACKUP_RETENTION,
        },
      });
    }
  }
}
