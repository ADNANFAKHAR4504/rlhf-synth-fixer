import * as pulumi from '@pulumi/pulumi';
import { VpcComponent } from './vpc-component';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = config.get('region') || 'us-east-1';

// Define environments
const environments = [
  {
    name: 'dev',
    cidr: '10.0.0.0/16',
  },
  {
    name: 'staging',
    cidr: '10.1.0.0/16',
  },
  {
    name: 'production',
    cidr: '10.2.0.0/16',
  },
];

// Availability zones
const availabilityZones = [`${region}a`, `${region}b`, `${region}c`];

// Create VPCs for each environment
const vpcs: { [key: string]: VpcComponent } = {};

environments.forEach(env => {
  vpcs[env.name] = new VpcComponent(`${env.name}-vpc`, {
    environmentName: env.name,
    vpcCidr: env.cidr,
    availabilityZones: availabilityZones,
    environmentSuffix: environmentSuffix,
  });
});

// Export outputs for dev environment
export const devVpcId = vpcs['dev'].vpc.id;
export const devPublicSubnetIds = vpcs['dev'].publicSubnets.map(s => s.id);
export const devPrivateSubnetIds = vpcs['dev'].privateSubnets.map(s => s.id);
export const devWebSgId = vpcs['dev'].webSecurityGroup.id;
export const devAppSgId = vpcs['dev'].appSecurityGroup.id;

// Export outputs for staging environment
export const stagingVpcId = vpcs['staging'].vpc.id;
export const stagingPublicSubnetIds = vpcs['staging'].publicSubnets.map(
  s => s.id
);
export const stagingPrivateSubnetIds = vpcs['staging'].privateSubnets.map(
  s => s.id
);

// Export outputs for production environment
export const productionVpcId = vpcs['production'].vpc.id;
