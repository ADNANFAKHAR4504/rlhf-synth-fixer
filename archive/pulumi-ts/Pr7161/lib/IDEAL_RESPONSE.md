# Multi-Environment Payment Processing Infrastructure - Ideal Implementation

This document describes the ideal implementation approach for the multi-environment payment processing infrastructure using **Pulumi with TypeScript**.

## Architecture Overview

The ideal solution deploys identical payment processing infrastructure across three environments (dev, staging, prod) with controlled variations managed through Pulumi stack configurations.

### Core Components

1. **VPC Infrastructure**
   - Custom VPC with public/private subnets across 3 availability zones
   - Internet Gateway for public subnet connectivity
   - Route tables for traffic management
   - Security groups with least-privilege access

2. **ECS Fargate Services**
   - Containerized payment processors
   - Auto-scaling based on CPU utilization (environment-specific thresholds)
   - CloudWatch integration for logging and monitoring
   - IAM roles for secure AWS service access

3. **RDS Aurora PostgreSQL**
   - Multi-AZ deployment for high availability
   - Environment-specific instance sizing (db.t3.medium for dev, db.r5.large for staging, db.r5.xlarge for prod)
   - Automated backups with 7-day retention
   - Performance Insights enabled
   - Credentials stored in AWS Secrets Manager

4. **Application Load Balancer**
   - Path-based routing (/api/*, /webhook/*)
   - Health checks on /health endpoint
   - Cross-zone load balancing enabled
   - HTTP/HTTPS support

5. **Route53 Private Hosted Zones**
   - Service discovery within VPC
   - Internal DNS resolution (e.g., dev.payment.internal)

6. **Shared ECR Repository**
   - Single container registry across all environments
   - Cross-stack references for resource sharing
   - Lifecycle policies (keep last 10 images)
   - Image scanning enabled

7. **Secrets Manager**
   - Database credentials generated using Pulumi's random provider
   - Secure access via ECS task execution roles

8. **CloudWatch**
   - Container logs with 7-day retention
   - Auto-scaling metrics and alarms

## Implementation Approach

### 1. Reusable ComponentResource Classes

All infrastructure should be defined as Pulumi ComponentResource classes for maximum reusability:

```typescript
export class VpcComponent extends pulumi.ComponentResource { ... }
export class DatabaseComponent extends pulumi.ComponentResource { ... }
export class AlbComponent extends pulumi.ComponentResource { ... }
export class EcsComponent extends pulumi.ComponentResource { ... }
export class Route53Component extends pulumi.ComponentResource { ... }
export class EcrComponent extends pulumi.ComponentResource { ... }
```

### 2. Stack Configuration Management

Use Pulumi stack configurations (Pulumi.{env}.yaml) to parameterize environment-specific values:

- **Dev** (eu-west-1): 10.0.0.0/16, db.t3.medium, 50% CPU threshold
- **Staging** (us-west-2): 10.1.0.0/16, db.r5.large, 70% CPU threshold
- **Prod** (us-east-1): 10.2.0.0/16, db.r5.xlarge, 70% CPU threshold

### 3. CIDR Overlap Validation

Implement a utility function to validate CIDR blocks don't overlap:

```typescript
export function validateCidrOverlap(allCidrs: CidrConfig[], currentEnv: string, currentCidr: string): void {
  // Parse CIDR blocks and check for overlaps
  // Throw error if overlap detected
}
```

### 4. Cross-Stack References

Use Pulumi StackReference to share resources across environments:

```typescript
const stackReference = new pulumi.StackReference(`organization/project/dev`);
const sharedEcrUrl = stackReference.getOutput("ecrRepositoryUrl");
```

### 5. Resource Naming Convention

All resources follow the pattern: `{env}-{service}-{resource}`

Examples:
- `dev-payment-vpc`
- `prod-payment-db-cluster`
- `staging-payment-alb`

### 6. Security Best Practices

- All database passwords randomly generated (Pulumi random provider)
- Credentials stored in Secrets Manager (never in code)
- Security groups with minimal required access
- ECS tasks in private subnets
- IAM roles with least-privilege policies
- ECR image scanning enabled
- Performance Insights enabled on RDS

### 7. Full Destroyability

All resources configured for clean teardown:
- `deletionProtection: false` on ALB and RDS
- `skipFinalSnapshot: true` on RDS
- `forceDelete: true` on ECR
- No Retain policies on any resources

### 8. Comparison Reporting

Generate structured JSON reports showing configuration differences:

```typescript
export function generateComparisonReport(environment: string, outputs: any): void {
  const report = {
    environment,
    timestamp: new Date().toISOString(),
    configuration: { ... }
  };
  fs.writeFileSync(`comparison-report-${environment}.json`, JSON.stringify(report, null, 2));
}
```

### 9. Auto-Scaling Policies

Define auto-scaling policies in a single location, parameterized per environment:

```typescript
new aws.appautoscaling.Policy(`${environment}-payment-scaling-policy`, {
  targetTrackingScalingPolicyConfiguration: {
    targetValue: scalingCpuThreshold, // From stack config
    predefinedMetricSpecification: {
      predefinedMetricType: "ECSServiceAverageCPUUtilization"
    }
  }
});
```

### 10. Stack Configuration Limits

Each stack configuration file limited to 50 lines for simplicity:

```yaml
config:
  aws:region: us-east-1
  payment-processing-infrastructure:vpcCidr: 10.2.0.0/16
  payment-processing-infrastructure:region: us-east-1
  payment-processing-infrastructure:dbInstanceClass: db.r5.xlarge
  payment-processing-infrastructure:scalingCpuThreshold: 70
  payment-processing-infrastructure:availabilityZoneCount: 3
```

## Deployment Process

### Initial Setup

```bash
# Install dependencies
npm install

# Login to Pulumi
pulumi login --local  # or pulumi login for Pulumi Cloud

# Select environment
pulumi stack select dev
```

### Deploy to Development

```bash
pulumi stack select dev
pulumi up
```

### Deploy to Staging

```bash
pulumi stack select staging
pulumi up
```

### Deploy to Production

```bash
pulumi stack select prod
pulumi up
```

### Generate Comparison Reports

After deploying all environments, compare configurations:

```bash
node scripts/compare-environments.js
```

## Testing Strategy

### Unit Tests

Test each ComponentResource class in isolation using Pulumi mocks:

- VPC subnet creation and routing
- Database configuration and secrets
- ALB listener rules and health checks
- ECS task definitions and auto-scaling
- Route53 zone configuration
- ECR lifecycle policies

### Integration Tests

After deployment, verify:

- VPC connectivity between subnets
- ECS service health and scaling
- RDS cluster accessibility from ECS
- ALB routing to ECS targets
- Route53 DNS resolution
- Secrets Manager access from ECS

### Coverage Target

- 100% statement coverage
- 100% function coverage
- 100% line coverage
- All edge cases handled

## Cost Optimization

1. **No NAT Gateways**: Private subnets use VPC endpoints where needed
2. **Environment-Specific Sizing**: Dev uses smaller/cheaper instances
3. **Auto-Scaling**: Scales down during low traffic
4. **ECR Lifecycle Policies**: Limits image retention to last 10
5. **CloudWatch Logs**: 7-day retention (configurable)
6. **Aurora Provisioned**: Right-sized for workload

## Monitoring and Observability

1. **CloudWatch Logs**: All ECS container logs centralized
2. **Performance Insights**: RDS query performance monitoring
3. **Auto-Scaling Metrics**: CPU utilization tracked
4. **ALB Metrics**: Request count, latency, 4xx/5xx errors
5. **Container Insights**: ECS cluster-level metrics

## Disaster Recovery

1. **Multi-AZ RDS**: Automatic failover
2. **ALB Health Checks**: Automatic unhealthy target removal
3. **Auto-Scaling**: Replaces failed tasks
4. **Automated Backups**: 7-day retention for RDS
5. **Infrastructure as Code**: Rapid environment reconstruction

## Compliance and Governance

1. **All credentials in Secrets Manager**: No hardcoded secrets
2. **Encryption at rest**: EBS volumes, RDS, ECR
3. **Encryption in transit**: TLS for ALB, RDS connections
4. **IAM least-privilege**: Minimal required permissions
5. **Tagging strategy**: All resources tagged with Environment, Project, ManagedBy

## Expected Outputs

After deployment, each stack exports:

- `vpcId`: VPC identifier
- `publicSubnetIds`: Public subnet identifiers
- `privateSubnetIds`: Private subnet identifiers
- `ecsClusterArn`: ECS cluster ARN
- `albDnsName`: ALB DNS endpoint
- `dbEndpoint`: RDS cluster endpoint
- `dbSecretArn`: Secrets Manager secret ARN
- `privateZoneId`: Route53 hosted zone ID
- `ecrRepositoryUrl`: ECR repository URL

## Troubleshooting

### CIDR Overlap Errors

Ensure each environment uses unique CIDR blocks. The validation function will catch overlaps before deployment.

### ECS Service Deployment Failures

Check:
1. ECR repository has valid images
2. Security groups allow ALB → ECS traffic
3. Secrets Manager secret is accessible
4. ECS task has sufficient CPU/memory

### RDS Connection Issues

Verify:
1. Security group allows ECS → RDS traffic (port 5432)
2. Database is in private subnets
3. ECS tasks can resolve RDS endpoint

### Auto-Scaling Not Triggering

Check:
1. CloudWatch metrics are being published
2. Scaling thresholds are appropriate
3. Min/max capacity is correctly configured

## Conclusion

This ideal implementation provides:

✅ Multi-environment support with environment parity
✅ Reusable infrastructure components
✅ Security best practices throughout
✅ Full destroyability for safe testing
✅ Cost optimization for non-production environments
✅ Comprehensive monitoring and logging
✅ Automated scaling and high availability
✅ Clear separation of concerns
✅ Infrastructure as Code benefits (version control, reproducibility, automation)

The implementation prevents configuration drift, ensures consistency across environments, and provides controlled variations where needed (instance sizes, scaling thresholds, CIDR blocks).
