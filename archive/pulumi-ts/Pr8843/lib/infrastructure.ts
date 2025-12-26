/**
 * infrastructure.ts
 *
 * This module orchestrates the creation of all AWS infrastructure components
 * including VPC, security groups, EC2 instances, and security monitoring.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createEc2Instance } from './compute';
import { createSecurityGroup } from './security';
import { createSecurityMonitoring } from './security-monitoring';
import { createVpcResources } from './vpc';

export interface InfrastructureOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;
  internetGatewayId: pulumi.Output<string>;
  securityGroupId: pulumi.Output<string>;
  ec2InstanceId: pulumi.Output<string>;
  ec2InstancePublicIp: pulumi.Output<string>;
  ec2InstancePublicDns: pulumi.Output<string>;
  cloudTrailArn: pulumi.Output<string>;
  guardDutyDetectorId: pulumi.Output<string>;
  natGatewayId: pulumi.Output<string>;
  vpcFlowLogId: pulumi.Output<string>;
}

export function createInfrastructure(
  environment: string,
  allowedSshCidrs: string[],
  instanceType: string = 't3.micro',
  region: string = 'ap-south-1',
  existingRecorderName?: string,
  existingDeliveryChannelName?: string
): InfrastructureOutputs {
  // Check if deploying to LocalStack
  const isLocalStack =
    process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
    process.env.AWS_ENDPOINT_URL?.includes('localstack') ||
    environment.toLowerCase().includes('localstack');

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

  // Create EC2 instance only for AWS (skip for LocalStack due to Pulumi provider compatibility issues)
  let ec2InstanceId: pulumi.Output<string>;
  let ec2InstancePublicIp: pulumi.Output<string>;
  let ec2InstancePublicDns: pulumi.Output<string>;

  if (!isLocalStack) {
    const ec2Instance = createEc2Instance(
      environment,
      vpcResources.publicSubnets[0].id,
      securityGroup.id,
      instanceType,
      provider
    );
    ec2InstanceId = ec2Instance.id;
    ec2InstancePublicIp = ec2Instance.publicIp;
    ec2InstancePublicDns = ec2Instance.publicDns;
  } else {
    // Placeholder values for LocalStack
    ec2InstanceId = pulumi.output('ec2-not-supported-in-localstack');
    ec2InstancePublicIp = pulumi.output('0.0.0.0');
    ec2InstancePublicDns = pulumi.output('ec2-not-supported');
  }

  // Create security monitoring resources
  const securityMonitoring = createSecurityMonitoring(
    environment,
    provider,
    undefined,
    existingRecorderName,
    existingDeliveryChannelName
  );

  return {
    vpcId: vpcResources.vpc.id,
    publicSubnetIds: pulumi.all(
      vpcResources.publicSubnets.map(subnet => subnet.id)
    ),
    privateSubnetIds: pulumi.all(
      vpcResources.privateSubnets.map(subnet => subnet.id)
    ),
    internetGatewayId: vpcResources.internetGateway.id,
    securityGroupId: securityGroup.id,
    ec2InstanceId: ec2InstanceId,
    ec2InstancePublicIp: ec2InstancePublicIp,
    ec2InstancePublicDns: ec2InstancePublicDns,
    cloudTrailArn: securityMonitoring.cloudTrail.arn,
    guardDutyDetectorId: securityMonitoring.guardDutyDetectorId,
    natGatewayId: vpcResources.natGateway.id,
    vpcFlowLogId: vpcResources.vpcFlowLog.id,
  };
}
