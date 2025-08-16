/**
 * infrastructure.ts
 *
 * This module orchestrates the creation of all AWS infrastructure components
 * including VPC, security groups, EC2 instances, and security monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { createVpcResources } from './vpc';
import { createSecurityGroup } from './security';
import { createEc2Instance } from './compute';
import { createSecurityMonitoring } from './security-monitoring';

export interface InfrastructureOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  internetGatewayId: pulumi.Output<string>;
  securityGroupId: pulumi.Output<string>;
  ec2InstanceId: pulumi.Output<string>;
  ec2InstancePublicIp: pulumi.Output<string>;
  ec2InstancePublicDns: pulumi.Output<string>;
  cloudTrailArn: pulumi.Output<string>;
  guardDutyDetectorId: pulumi.Output<string>;
}

export function createInfrastructure(
  environment: string,
  allowedSshCidrs: string[],
  instanceType: string = 't3.micro',
  region: string = 'ap-south-1'
): InfrastructureOutputs {
  // AWS Provider with explicit region configuration
  const provider = new aws.Provider(`aws-provider-${environment}`, {
    region: region,
  });

  // Create VPC and networking resources
  const vpcResources = createVpcResources(environment, provider);

  // Create security group
  const securityGroup = createSecurityGroup(
    environment,
    vpcResources.vpc.id,
    allowedSshCidrs,
    provider
  );

  // Create EC2 instance
  const ec2Instance = createEc2Instance(
    environment,
    vpcResources.publicSubnets[0].id,
    securityGroup.id,
    instanceType,
    provider
  );

  // Create security monitoring resources
  const securityMonitoring = createSecurityMonitoring(environment, provider);

  return {
    vpcId: vpcResources.vpc.id,
    publicSubnetIds: vpcResources.publicSubnets.map(subnet => subnet.id),
    privateSubnetIds: vpcResources.privateSubnets.map(subnet => subnet.id),
    internetGatewayId: vpcResources.internetGateway.id,
    securityGroupId: securityGroup.id,
    ec2InstanceId: ec2Instance.id,
    ec2InstancePublicIp: ec2Instance.publicIp,
    ec2InstancePublicDns: ec2Instance.publicDns,
    cloudTrailArn: securityMonitoring.cloudTrail.arn,
    guardDutyDetectorId: securityMonitoring.guardDutyDetector.id,
  };
}
