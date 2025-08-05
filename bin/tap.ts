#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { findVpcByCidr, findVpcById, getSubnetConfiguration, validateVpcSubnetConfiguration } from '../lib/vpc-utils';

async function main() {
  const app = new cdk.App();
  // Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
  const environmentSuffix =
    app.node.tryGetContext('environmentSuffix') || 'dev';
  const stackName = `TapStack${environmentSuffix}`;

  const repositoryName = process.env.REPOSITORY || 'unknown';
  const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

  // Apply tags to all stacks in this app (optional - you can do this at stack level instead)

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  Tags.of(app).add('Environment', capitalize(environmentSuffix));
  Tags.of(app).add('Repository', repositoryName);
  Tags.of(app).add('Author', commitAuthor);

  const cidr = '10.0.0.0/16';
  let vpcId = await findVpcByCidr(cidr); // Try to find VPC by CIDR first
  
  // Check if VPC found by CIDR has the required subnet configuration
  if (vpcId) {
    console.log(`VPC found by CIDR ${cidr}: ${vpcId}`);
    const hasValidSubnets = await validateVpcSubnetConfiguration(vpcId);
    
    if (!hasValidSubnets) {
      console.log(`VPC ${vpcId} does not have required subnet configuration (2 private + 1 public), trying fallback VPC...`);
      vpcId = undefined; // Reset to try fallback
    } else {
      console.log(`VPC ${vpcId} has valid subnet configuration ✓`);
    }
  }
  
  // If VPC not found by CIDR or doesn't have valid subnets, try to find by specific VPC ID
  if (!vpcId) {
    console.log(`Trying to find VPC by specific ID...`);
    vpcId = await findVpcById('vpc-0ea3cebfe865ee72f');
    
    if (vpcId) {
      console.log(`Fallback VPC found: ${vpcId}`);
    }
  }
  
  const stack = new cdk.Stack(app, 'MyStack');
  if (!vpcId) {
    throw new Error('VPC not found by CIDR or by specific VPC ID, or neither has required subnet configuration (2 private + 1 public)');
  }

  // Get subnet configuration (2 private + 1 public)
  console.log(`Getting subnet configuration for VPC: ${vpcId}`);
  const subnetConfig = await getSubnetConfiguration(vpcId);
  
  console.log(`Found ${subnetConfig.privateSubnets.length} private subnets and ${subnetConfig.publicSubnets.length} public subnets`);
  
  // Log subnet details for debugging
  subnetConfig.privateSubnets.forEach((subnet, index) => {
    console.log(`Private Subnet ${index + 1}: ${subnet.subnetId} (${subnet.availabilityZone}) - ${subnet.cidrBlock}`);
  });
  
  subnetConfig.publicSubnets.forEach((subnet, index) => {
    console.log(`Public Subnet ${index + 1}: ${subnet.subnetId} (${subnet.availabilityZone}) - ${subnet.cidrBlock}`);
  });

  new TapStack(stack, stackName, {
    stackName: stackName, // This ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix, // Pass the suffix to the stack
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1', // process.env.CDK_DEFAULT_REGION,
    },
    vpcId,
  });
}

if (require.main === module) {
  main();
}
