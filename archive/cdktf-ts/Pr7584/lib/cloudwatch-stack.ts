import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Construct } from 'constructs';

export interface CloudWatchStackProps {
  environmentSuffix: string;
  kmsKey: KmsKey;
}

export class CloudWatchStack extends Construct {
  public readonly ecsLogGroup: CloudwatchLogGroup;
  public readonly auditLogGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, props: CloudWatchStackProps) {
    super(scope, id);

    const { environmentSuffix, kmsKey } = props;

    // Create ECS Task Log Group
    this.ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/assessment-tasks-${environmentSuffix}`,
      retentionInDays: 30,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `assessment-ecs-logs-${environmentSuffix}`,
      },
    });

    // Create Audit Log Group
    this.auditLogGroup = new CloudwatchLogGroup(this, 'audit-log-group', {
      name: `/assessment/audit-${environmentSuffix}`,
      retentionInDays: 90,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `assessment-audit-logs-${environmentSuffix}`,
      },
    });
  }
}
