# Application Deployment

> **CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation with JSON**
>
> Platform: **cfn**
> Language: **json**
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background

A fintech startup needs to deploy their microservices architecture on AWS ECS with blue-green deployment capabilities. The system processes sensitive financial transactions and requires strict network isolation, automated scaling based on CPU and memory metrics, and seamless rollback mechanisms.

## Problem Statement

Create a CloudFormation template to deploy a blue-green capable ECS cluster with automated rollback capabilities. The configuration must:

1. Create an ECS cluster with Container Insights enabled and capacity providers configured for Fargate and Fargate Spot.
2. Deploy two ECS services (blue and green) running identical task definitions with 3 desired tasks each.
3. Configure an Application Load Balancer with two target groups and weighted routing between blue/green services.
4. Implement auto-scaling policies that scale between 3-10 tasks based on both CPU and memory metrics.
5. Set up CloudWatch alarms for unhealthy targets that trigger SNS notifications when 2+ tasks fail health checks.
6. Create task execution roles with permissions to pull from ECR, write logs, and read secrets from Secrets Manager.
7. Configure service discovery using AWS Cloud Map with private DNS namespace for inter-service communication.
8. Implement Circuit Breaker settings with 50% rollback threshold and 10-minute evaluation period.

Expected output: A complete CloudFormation template in JSON format that provisions the entire ECS infrastructure with blue-green deployment capabilities, including all networking, security, monitoring, and auto-scaling configurations required for production-grade container orchestration.

## Constraints and Requirements

- ECS services must use Fargate launch type with platform version 1.4.0
- Task definitions must specify both CPU and memory limits with at least 1 vCPU and 2GB RAM
- Application Load Balancer must use path-based routing with health check intervals of 15 seconds
- Auto-scaling policies must trigger at 70% CPU or 80% memory utilization
- All container logs must be streamed to CloudWatch Logs with 30-day retention
- Secrets must be stored in AWS Secrets Manager and injected as environment variables
- Network ACLs must explicitly deny all traffic except ports 80, 443, and 8080
- Each service must have dedicated target groups with deregistration delay of 30 seconds

## Environment Setup

Production-grade container orchestration infrastructure deployed in us-east-1 across 3 availability zones. Core services include ECS Fargate for container orchestration, Application Load Balancer for traffic distribution, Auto Scaling for dynamic capacity management. VPC configured with public subnets for ALB and private subnets for ECS tasks. NAT Gateways provide outbound internet access for containers. CloudWatch Container Insights enabled for monitoring. Requires AWS CLI 2.x configured with appropriate IAM permissions for ECS, EC2, and CloudWatch services.

---

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` parameter in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` parameter in their names
- Pattern: `{resource-name}-${environmentSuffix}`
- Examples:
  - ECS Cluster: `!Sub 'ecs-cluster-${environmentSuffix}'`
  - ALB: `!Sub 'app-alb-${environmentSuffix}'`
  - Target Group: `!Sub 'tg-blue-${environmentSuffix}'`
- **Validation**: Every resource with a Name property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**:
  - `DeletionPolicy: Retain` → Remove or use `Delete`
  - `deletionProtection: true` → Use `deletionProtection: false`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### ECS/Fargate
- Use Fargate launch type with platform version 1.4.0
- Enable Container Insights for monitoring
- Configure capacity providers for both Fargate and Fargate Spot
- Set up proper task execution roles with ECR, CloudWatch Logs, and Secrets Manager permissions

#### Application Load Balancer
- Use path-based routing
- Configure health checks with 15-second intervals
- Set up two target groups for blue-green deployment
- Configure weighted routing between target groups

#### Auto Scaling
- Create scaling policies for both CPU (70%) and memory (80%) utilization
- Set minimum tasks to 3 and maximum to 10
- Use target tracking scaling policies

#### CloudWatch
- Stream all container logs to CloudWatch Logs with 30-day retention
- Create alarms for unhealthy targets (threshold: 2+ tasks)
- Set up SNS notifications for alarm triggers

#### AWS Cloud Map
- Create private DNS namespace for service discovery
- Register ECS services with Cloud Map

#### Circuit Breaker
- Configure Circuit Breaker with 50% rollback threshold
- Set evaluation period to 10 minutes

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`, `arn:aws:.*:.*:account`
  - Regions: Hardcoded `us-east-1` or `us-west-2` in resource names (use parameters/refs)
- **USE**: Parameters, Refs, or GetAtt instead

### Cross-Resource References
- Ensure all resource references use proper !Ref or !GetAtt
- Verify dependencies are explicit (use DependsOn where needed)
- Test that referenced resources exist before use

## Code Examples (Reference)

### Correct Resource Naming (CloudFormation JSON)
```json
{
  "ECSCluster": {
    "Type": "AWS::ECS::Cluster",
    "Properties": {
      "ClusterName": {
        "Fn::Sub": "ecs-cluster-${environmentSuffix}"
      }
    }
  }
}
```

### Correct Parameter Definition
```json
{
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming"
    }
  }
}
```

### Correct IAM Role for ECS Task Execution
```json
{
  "ECSTaskExecutionRole": {
    "Type": "AWS::IAM::Role",
    "Properties": {
      "AssumeRolePolicyDocument": {
        "Statement": [{
          "Effect": "Allow",
          "Principal": {
            "Service": "ecs-tasks.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }]
      },
      "ManagedPolicyArns": [
        "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
      ],
      "Policies": [{
        "PolicyName": "SecretsManagerAccess",
        "PolicyDocument": {
          "Statement": [{
            "Effect": "Allow",
            "Action": [
              "secretsmanager:GetSecretValue"
            ],
            "Resource": "*"
          }]
        }
      }]
    }
  }
}
```

## Target Region
All resources should be deployed to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly named with environmentSuffix
- Infrastructure can be cleanly destroyed
- Blue-green deployment works with proper weighted routing
- Auto-scaling responds to CPU and memory metrics
- Circuit breaker triggers rollback on failures
