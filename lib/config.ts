import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();

export const primaryRegion = config.get('primaryRegion') || 'ap-south-1';
export const secondaryRegion = config.get('secondaryRegion') || 'eu-west-1';
export const primaryVpcCidr = config.get('primaryVpcCidr') || '10.0.0.0/16';
export const secondaryVpcCidr = config.get('secondaryVpcCidr') || '10.1.0.0/16';
export const instanceType = config.get('instanceType') || 't2.micro';
export const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';

export const getCommonTags = (environment: string) => ({
  Environment: environment,
  Project: 'MultiRegionInfrastructure',
});
