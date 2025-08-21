import { Construct } from 'constructs';
import {
  dbSubnetGroup,
  dbInstance,
  dbParameterGroup,
  dataAwsRdsEngineVersion,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface DatabaseProps {
  config: AppConfig;
  dbSubnetIds: string[];
  securityGroupIds: string[];
}

export class DatabaseConstruct extends Construct {
  public readonly dbInstance: dbInstance.DbInstance;
  public readonly dbSubnetGroup: dbSubnetGroup.DbSubnetGroup;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { config, dbSubnetIds, securityGroupIds } = props;

    const engineVersion = new dataAwsRdsEngineVersion.DataAwsRdsEngineVersion(
      this,
      'postgres-version',
      {
        engine: 'postgres',
        preferredVersions: ['15.8', '15.7', '15.6', '14.13', '14.12', '13.16'],
      }
    );

    this.dbSubnetGroup = new dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${config.projectName}-${config.environment}-db-subnet-group`,
        subnetIds: dbSubnetIds,
        description: `Database subnet group for ${config.projectName}`,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-db-subnet-group`,
        },
      }
    );

    const dbParameterGroupInstance = new dbParameterGroup.DbParameterGroup(
      this,
      'db-parameter-group',
      {
        name: `${config.projectName}-${config.environment}-postgres-params`,
        family: 'postgres15',
        description: `PostgreSQL parameter group for ${config.projectName}`,
        parameter: [
          {
            name: 'shared_preload_libraries',
            value: 'pg_stat_statements',
          },
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
          {
            name: 'log_connections',
            value: '1',
          },
          {
            name: 'log_disconnections',
            value: '1',
          },
        ],
        tags: config.tags,
      }
    );

    this.dbInstance = new dbInstance.DbInstance(this, 'db-instance', {
      identifier: `${config.projectName}-${config.environment}-postgres`,
      engine: 'postgres',
      engineVersion: engineVersion.version,
      instanceClass: config.dbInstanceClass,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp2',
      storageEncrypted: true,

      dbName: 'webapp',
      username: 'webapp_user',
      password: 'ChangeMe123!',

      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,
      parameterGroupName: dbParameterGroupInstance.name,

      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      multiAz: false,
      publiclyAccessible: false,

      finalSnapshotIdentifier: `${config.projectName}-${config.environment}-postgres-final-snapshot`,
      skipFinalSnapshot: true,
      deletionProtection: false,

      enabledCloudwatchLogsExports: ['postgresql'],

      tags: {
        ...config.tags,
        Name: `${config.projectName}-postgres`,
      },
    });
  }
}
