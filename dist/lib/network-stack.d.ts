import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
interface NetworkStackProps {
    vpcCidr: string;
    region: string;
    environmentSuffix: string;
}
export declare class NetworkStack extends Construct {
    readonly vpc: Vpc;
    readonly publicSubnets: Subnet[];
    readonly privateSubnets: Subnet[];
    constructor(scope: Construct, id: string, props: NetworkStackProps);
}
export {};
