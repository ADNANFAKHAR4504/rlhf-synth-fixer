import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const primaryRegion = config.require('primaryRegion');
export const secondaryRegion = config.require('secondaryRegion');
export const primaryVpcCidr = config.require('primaryVpcCidr');
export const secondaryVpcCidr = config.require('secondaryVpcCidr');
export const instanceType = config.require('instanceType');
export const dbInstanceClass = config.require('dbInstanceClass');

export const commonTags = {
  Environment: 'Production',
  Project: 'MultiRegionInfrastructure',
};
