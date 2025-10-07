import { Construct } from 'constructs';
interface BackupInfrastructureStackProps {
    region: string;
    environmentSuffix?: string;
}
export declare class BackupInfrastructureStack extends Construct {
    constructor(scope: Construct, id: string, props: BackupInfrastructureStackProps);
}
export {};
