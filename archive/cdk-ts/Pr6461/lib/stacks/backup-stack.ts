import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

interface BackupStackProps extends cdk.StackProps {
  environmentSuffix: string;
  dbCluster: rds.IDatabaseCluster;
  dynamoTable: dynamodb.ITable;
}

export class BackupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id, props);

    const { environmentSuffix, dbCluster, dynamoTable } = props;

    const vault = new backup.BackupVault(this, `Vault-${environmentSuffix}`, {
      backupVaultName: `dr-vault-${environmentSuffix}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const plan = new backup.BackupPlan(this, `Plan-${environmentSuffix}`, {
      backupPlanName: `dr-plan-${environmentSuffix}-${this.region}`,
      backupVault: vault,
    });

    plan.addRule(
      new backup.BackupPlanRule({
        ruleName: `DailyBackup-${environmentSuffix}`,
        scheduleExpression: events.Schedule.cron({ hour: '2', minute: '0' }),
        deleteAfter: cdk.Duration.days(7),
        startWindow: cdk.Duration.hours(1),
        completionWindow: cdk.Duration.hours(2),
      })
    );

    plan.addSelection(`RDSSelection-${environmentSuffix}`, {
      resources: [backup.BackupResource.fromRdsDatabaseCluster(dbCluster)],
      allowRestores: true,
    });

    plan.addSelection(`DynamoSelection-${environmentSuffix}`, {
      resources: [backup.BackupResource.fromDynamoDbTable(dynamoTable)],
      allowRestores: true,
    });

    cdk.Tags.of(vault).add('Environment', environmentSuffix);
  }
}
