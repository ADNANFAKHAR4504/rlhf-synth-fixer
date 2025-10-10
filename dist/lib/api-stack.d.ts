import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { Apigatewayv2Api } from '@cdktf/provider-aws/lib/apigatewayv2-api';
interface ApiStackProps {
    vpc: Vpc;
    alb: Alb;
    region: string;
    environmentSuffix: string;
}
export declare class ApiStack extends Construct {
    readonly websocketApi: Apigatewayv2Api;
    constructor(scope: Construct, id: string, props: ApiStackProps);
}
export {};
