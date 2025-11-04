/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 *
 * Stack Outputs:
 * - vpcId: VPC identifier for network infrastructure
 * - ecrRepositoryUrl: ECR repository URL for container images
 * - cloudwatchLogGroupName: CloudWatch log group for ECS logs
 * - rdsClusterEndpoint: RDS Aurora cluster endpoint
 * - rdsReaderEndpoint: RDS read replica endpoint
 * - albDnsName: Application Load Balancer DNS name
 * - ecsClusterName: ECS cluster identifier
 * - ecsServiceName: ECS service identifier
 * - targetGroupArn: ALB target group ARN
 * - environment: Current environment (dev/staging/prod)
 */
import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get("env") || "dev";

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get("repository") || "unknown";
const commitAuthor = config.get("commitAuthor") || "unknown";
const projectName = config.get("projectName") || "payment-platform";

// Define a set of default tags to apply to all resources.
// These tags ensure consistent resource identification and cost allocation.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: projectName,
  ManagedBy: "Pulumi",
  CreatedAt: new Date().toISOString(),
};

// Log environment configuration at deployment time
console.log(`
╔════════════════════════════════════════════════════╗
║         Pulumi Infrastructure Deployment          ║
╚════════════════════════════════════════════════════╝
Environment:    ${environmentSuffix}
Repository:     ${repository}
Author:         ${commitAuthor}
Project:        ${projectName}
Stack:          ${pulumi.getStack()}
Region:         us-east-1
Timestamp:      ${new Date().toISOString()}
════════════════════════════════════════════════════
`);

// Instantiate the main stack component for the infrastructure.
// This encapsulates all the resources for the platform.
const tapStack = new TapStack("pulumi-infra", {
  tags: defaultTags,
});

// ============================================================================
// STACK OUTPUTS - Exported for cross-stack references and external use
// ============================================================================

/**
 * VPC Identifier
 * Used to reference the VPC for additional resources or integrations
 */
export const vpcId = pulumi.interpolate`${tapStack.vpcId}`;

/**
 * ECR Repository URL
 * URL to push container images to
 * Format: {account-id}.dkr.ecr.us-east-1.amazonaws.com/{repo-name}
 */
export const ecrRepositoryUrl = pulumi.interpolate`${tapStack.ecrRepositoryUrl}`;

/**
 * CloudWatch Log Group Name
 * Path to logs for ECS services
 * Format: /aws/ecs/{service-name}
 */
export const cloudwatchLogGroupName = pulumi.interpolate`${tapStack.cloudwatchLogGroupName}`;

/**
 * RDS Cluster Writer Endpoint
 * Primary endpoint for database write operations
 * Use this endpoint for application database connections
 */
export const rdsClusterEndpoint = pulumi.interpolate`${tapStack.rdsClusterEndpoint}`;

/**
 * RDS Cluster Reader Endpoint (Read Replicas)
 * Endpoint for read-only operations
 * Available in staging and production environments only
 */
export const rdsReaderEndpoint = pulumi.interpolate`${tapStack.rdsReaderEndpoint}`;

/**
 * Application Load Balancer DNS Name
 * Public endpoint to access the application
 * Example: Use this in Route53 records or CNAME records
 */
export const albDnsName = pulumi.interpolate`${tapStack.albDnsName}`;

/**
 * ECS Cluster Name
 * Cluster identifier for ECS operations and queries
 */
export const ecsClusterName = pulumi.interpolate`${tapStack.ecsClusterName}`;

/**
 * ECS Service Name
 * Service identifier for task deployment and management
 */
export const ecsServiceName = pulumi.interpolate`${tapStack.ecsServiceName}`;

/**
 * ALB Target Group ARN
 * Used for registering targets or creating additional listeners
 */
export const targetGroupArn = pulumi.interpolate`${tapStack.targetGroupArn}`;

/**
 * Environment Name
 * Current deployment environment (dev, staging, prod)
 */
export const environment = tapStack.environment;

/**
 * Stack Configuration Export
 * Contains all resource identifiers for external consumption
 */
export const stackConfig = {
  environmentSuffix,
  repository,
  commitAuthor,
  projectName,
  tags: defaultTags,
  stackName: pulumi.getStack(),
  timestamp: new Date().toISOString(),
};

/**
 * Resource Summary
 * Quick reference for all deployed resources
 */
export const resourceSummary = pulumi.all([
  tapStack.vpcId,
  tapStack.ecsClusterName,
  tapStack.rdsClusterEndpoint,
  tapStack.albDnsName,
]).apply(([vpc, cluster, rds, alb]) => ({
  vpc: `VPC: ${vpc}`,
  cluster: `ECS Cluster: ${cluster}`,
  rds: `RDS Endpoint: ${rds}`,
  alb: `Load Balancer: ${alb}`,
}));

/**
 * Health Check Information
 * Endpoint and configuration for application health checks
 */
export const healthCheckInfo = {
  endpoint: pulumi.interpolate`http://${tapStack.albDnsName}/health`,
  interval: 30,
  timeout: 5,
  healthyThreshold: 2,
  unhealthyThreshold: 2,
};

/**
 * Database Connection String
 * For application configuration and reference
 */
export const dbConnectionInfo = {
  host: tapStack.rdsClusterEndpoint,
  port: 5432,
  database: "paymentdb",
  username: "postgres",
  environment: environment,
};

/**
 * Container Registry Information
 * For pushing images and authentication
 */
export const containerRegistryInfo = {
  url: tapStack.ecrRepositoryUrl,
  region: "us-east-1",
  imageName: "payment-app",
  latestTag: "latest",
};

/**
 * Logging Configuration
 * For application log aggregation setup
 */
export const loggingInfo = {
  logGroup: tapStack.cloudwatchLogGroupName,
  logDriver: "awslogs",
  region: "us-east-1",
  streamPrefix: "ecs",
};

// ============================================================================
// STACK REFERENCE FOR CROSS-STACK DEPENDENCIES
// ============================================================================

/**
 * Complete Stack Reference
 * Can be imported in other Pulumi projects for cross-stack references
 * Usage: const devStack = new pulumi.StackReference("org/project/dev");
 */
export const stackReference = {
  organization: process.env.PULUMI_ORG || "organization",
  project: process.env.PULUMI_PROJECT || "iac-test-automations",
  stack: pulumi.getStack(),
  fullRef: `${process.env.PULUMI_ORG || "organization"}/${
    process.env.PULUMI_PROJECT || "iac-test-automations"
  }/${pulumi.getStack()}`,
};

// ============================================================================
// DEPLOYMENT SUMMARY AND NEXT STEPS
// ============================================================================

const deploymentSummary = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT COMPLETED SUCCESSFULLY                       ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 NEXT STEPS:

1. PUSH CONTAINER IMAGE TO ECR:
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URL>
   docker tag payment-app:latest <ECR_URL>/payment-app:latest
   docker push <ECR_URL>/payment-app:latest

2. VERIFY DEPLOYMENT:
   aws ecs list-services --cluster <ECS_CLUSTER_NAME>
   aws ecs describe-services --cluster <ECS_CLUSTER_NAME> --services payment-app-service

3. CHECK APPLICATION HEALTH:
   curl http://<ALB_DNS_NAME>/health

4. VIEW LOGS:
   aws logs tail /aws/ecs/pulumi-infra-logs-${environmentSuffix} --follow

5. DATABASE CONNECTION:
   psql -h <RDS_ENDPOINT> -U postgres -d paymentdb

📊 RESOURCE OUTPUTS:

   VPC ID:                    ${tapStack.vpcId}
   ECR Repository:            ${tapStack.ecrRepositoryUrl}
   ECS Cluster:               ${tapStack.ecsClusterName}
   RDS Endpoint:              ${tapStack.rdsClusterEndpoint}
   Load Balancer:             ${tapStack.albDnsName}
   Log Group:                 ${tapStack.cloudwatchLogGroupName}

🔗 CROSS-STACK REFERENCE:
   ${process.env.PULUMI_ORG || "organization"}/${
    process.env.PULUMI_PROJECT || "iac-test-automations"
  }/${pulumi.getStack()}

════════════════════════════════════════════════════════════════════════════
`;

// Log deployment summary
console.log(deploymentSummary);
