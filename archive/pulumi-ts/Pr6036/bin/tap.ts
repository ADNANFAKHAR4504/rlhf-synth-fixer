/**
 * Order Processing API Infrastructure - Pulumi Entry Point
 *
 * This Pulumi program deploys a production-grade containerized order processing API
 * with ECS Fargate, Aurora MySQL, blue-green deployment support, comprehensive monitoring,
 * and security controls.
 */
import * as pulumi from '@pulumi/pulumi';
import { OrderApiStack } from '../lib/order-api-stack';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';

// Create the infrastructure stack
const stack = new OrderApiStack('order-api-infrastructure', {
  environmentSuffix,
});

// Exports
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDnsName;
export const ecsServiceArn = stack.ecsServiceArn;
export const rdsClusterEndpoint = stack.rdsClusterEndpoint;
export const rdsReaderEndpoint = stack.rdsReaderEndpoint;
export const ecrRepositoryUrl = stack.ecrRepositoryUrl;
export const wafWebAclArn = stack.wafWebAclArn;
export const blueTargetGroupArn = stack.blueTargetGroupArn;
export const greenTargetGroupArn = stack.greenTargetGroupArn;
export const dashboardUrl = stack.dashboardUrl;
