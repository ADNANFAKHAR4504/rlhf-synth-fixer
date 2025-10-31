/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const environmentSuffix = config.get('env') || 'dev';
const migrationPhase = config.get('migrationPhase') as 'initial' | 'peering' | 'replication' | 'cutover' | 'complete' || 'initial';
const trafficWeightTarget = config.getNumber('trafficWeightTarget') || 0;
const errorThreshold = config.getNumber('errorThreshold') || 5;
const rollbackEnabled = config.getBoolean('rollbackEnabled') !== false;
const sourceVpcId = config.get('sourceVpcId');
const sourceRouteTableId = config.get('sourceRouteTableId');
const hostedZoneName = config.get('hostedZoneName');
const certificateArn = config.get('certificateArn');

const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  migrationPhase: migrationPhase,
  trafficWeightTarget: trafficWeightTarget,
  errorThreshold: errorThreshold,
  rollbackEnabled: rollbackEnabled,
  sourceVpcId: sourceVpcId,
  sourceRouteTableId: sourceRouteTableId,
  hostedZoneName: hostedZoneName,
  certificateArn: certificateArn,
});

export const targetVpcId = stack.targetVpc.id;
export const targetVpcCidr = stack.targetVpc.cidrBlock;
export const vpcPeeringId = stack.vpcPeering?.id || pulumi.output('N/A - No source VPC configured');
export const targetRdsEndpoint = stack.targetRdsInstance.endpoint;
export const loadBalancerDns = stack.targetLoadBalancer.dnsName;
export const route53RecordName = stack.route53Record?.name || pulumi.output('N/A - No hosted zone configured');
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${stack.migrationDashboard.dashboardName}`;
export const rollbackTopicArn = stack.rollbackTopic.arn;
export const stackOutputs = stack.outputs;
export const dbPassword = stack.dbPassword.result;
