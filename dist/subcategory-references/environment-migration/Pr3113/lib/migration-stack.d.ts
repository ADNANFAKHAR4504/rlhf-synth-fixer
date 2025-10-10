import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface MigrationStackProps extends cdk.StackProps {
    bastionSourceIp?: string;
}
export declare class MigrationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: MigrationStackProps);
}
