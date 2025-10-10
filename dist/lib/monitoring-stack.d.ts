import { Construct } from 'constructs';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
interface MonitoringStackProps {
    asg: AutoscalingGroup;
    alb: Alb;
    database: DbInstance;
    region: string;
    environmentSuffix: string;
}
export declare class MonitoringStack extends Construct {
    readonly dashboard: CloudwatchDashboard;
    constructor(scope: Construct, id: string, props: MonitoringStackProps);
}
export {};
