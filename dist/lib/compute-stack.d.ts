import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
interface ComputeStackProps {
    vpc: Vpc;
    publicSubnets: Subnet[];
    privateSubnets: Subnet[];
    database: DbInstance;
    cache: ElasticacheServerlessCache;
    region: string;
    environmentSuffix: string;
}
export declare class ComputeStack extends Construct {
    readonly alb: Alb;
    readonly asg: AutoscalingGroup;
    constructor(scope: Construct, id: string, props: ComputeStackProps);
}
export {};
