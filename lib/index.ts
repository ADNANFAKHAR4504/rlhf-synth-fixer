import * as pulumi from '@pulumi/pulumi';
import { PaymentInfrastructure } from './payment-infrastructure';
import { validateCidrOverlap } from './utils/cidr-validator';
import { generateComparisonReport } from './utils/comparison-report';

// Get configuration
const config = new pulumi.Config();
const environment = pulumi.getStack();
const vpcCidr = config.require('vpcCidr');
const region = config.require('region');
const dbInstanceClass = config.require('dbInstanceClass');
const scalingCpuThreshold = config.requireNumber('scalingCpuThreshold');
const availabilityZoneCount = config.getNumber('availabilityZoneCount') || 3;

// Validate CIDR blocks don't overlap
const allCidrs = [
  { env: 'dev', cidr: '10.0.0.0/16' },
  { env: 'staging', cidr: '10.1.0.0/16' },
  { env: 'prod', cidr: '10.2.0.0/16' },
];

validateCidrOverlap(allCidrs, environment, vpcCidr);

// Deploy payment processing infrastructure
const infrastructure = new PaymentInfrastructure(
  `${environment}-payment-infra`,
  {
    environment,
    region,
    vpcCidr,
    availabilityZoneCount,
    dbInstanceClass,
    scalingCpuThreshold,
    tags: {
      Environment: environment,
      Project: 'payment-processing',
      ManagedBy: 'pulumi',
    },
  }
);

// Export important outputs
export const vpcId = infrastructure.vpc.vpcId;
export const publicSubnetIds = infrastructure.vpc.publicSubnetIds;
export const privateSubnetIds = infrastructure.vpc.privateSubnetIds;
export const ecsClusterArn = infrastructure.ecsCluster.arn;
export const albDnsName = infrastructure.alb.dnsName;
export const dbEndpoint = infrastructure.database.endpoint;
export const dbSecretArn = infrastructure.database.secretArn;
export const privateZoneId = infrastructure.route53Zone.id;
export const ecrRepositoryUrl = infrastructure.ecrRepository.repositoryUrl;

// Generate comparison report
infrastructure.generateOutputs().apply(outputs => {
  generateComparisonReport(environment, outputs);
});
