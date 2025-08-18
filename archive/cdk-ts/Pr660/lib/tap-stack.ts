import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './constructs/networking-construct';
import { ComputeConstruct } from './constructs/compute-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { SecurityConstruct } from './constructs/security-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  region: string;
  isPrimaryRegion: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const region = props.region;
    const isPrimaryRegion = props.isPrimaryRegion;

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region,
    });

    // Create security infrastructure
    const security = new SecurityConstruct(this, 'Security', {
      environmentSuffix,
      region,
      vpc: networking.vpc,
    });

    // Create compute infrastructure
    const compute = new ComputeConstruct(this, 'Compute', {
      environmentSuffix,
      region,
      vpc: networking.vpc,
      securityGroup: security.ec2SecurityGroup,
      instanceRole: security.ec2Role,
    });

    // Create database infrastructure
    const database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      region,
      vpc: networking.vpc,
      securityGroup: security.rdsSecurityGroup,
    });

    // Create storage infrastructure (only in primary region)
    if (isPrimaryRegion) {
      new StorageConstruct(this, 'Storage', {
        environmentSuffix,
        region,
        allowedPrincipals: [security.ec2Role.roleArn],
      });
    }

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: networking.publicSubnet.subnetId,
      description: 'Public Subnet ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: networking.privateSubnet.subnetId,
      description: 'Private Subnet ID',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: compute.instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: database.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });
  }
}
