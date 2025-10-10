import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { ElasticacheServerlessCache } from '@cdktf/provider-aws/lib/elasticache-serverless-cache';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
interface DatabaseStackProps {
    vpc: Vpc;
    privateSubnets: Subnet[];
    region: string;
    environmentSuffix: string;
}
export declare class DatabaseStack extends Construct {
    readonly dbInstance: DbInstance;
    readonly elasticacheServerless: ElasticacheServerlessCache;
    readonly historicalDataBucket: S3Bucket;
    constructor(scope: Construct, id: string, props: DatabaseStackProps);
}
export {};
