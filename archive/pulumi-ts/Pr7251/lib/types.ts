import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkConfig {
  cidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  region: string;
  peeringConnectionId?: pulumi.Output<string>;
  peerCidr?: string;
}

export interface RegionalInfrastructureProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  vpcCidr: string;
  globalClusterId?: aws.rds.GlobalCluster;
  peeringConnectionId?: pulumi.Output<string>;
  peerCidr?: string;
  tags: { [key: string]: string };
}

export interface DatabaseConfig {
  engine: string;
  engineVersion: string;
  instanceClass: string;
  skipFinalSnapshot: boolean;
  deletionProtection: boolean;
}
