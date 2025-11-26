# ECS Fargate Fraud Detection Service

Hey team,

We've been tasked with deploying a containerized fraud detection system for one of our financial services clients. They're processing real-time transaction data and need a highly available solution that can scale automatically based on demand. The business is asking us to build this using **CloudFormation with JSON** to match their existing infrastructure-as-code standards.

The current situation is that they have container images ready in ECR and an existing RDS Aurora cluster for data persistence. What they need from us is the complete ECS Fargate infrastructure with proper load balancing, auto-scaling, and monitoring. The system needs to be production-ready with high availability across multiple availability zones.

Their operations team has been clear about the constraints - they need Fargate platform version 1.4.0 specifically, strict health check requirements, and least-privilege IAM policies with no wildcards allowed. They're also particular about maintaining exactly 2 tasks during deployments to ensure zero downtime.

## What we need to build

Create a complete ECS Fargate deployment infrastructure using **CloudFormation with JSON** for a fraud detection service that processes financial transactions in real-time.

### Core Requirements

1. **ECS Cluster Configuration**
   - Define an ECS cluster with containerInsights enabled for monitoring
   - Must support Fargate launch type with platform version 1.4.0

2. **Task Definition**
   - Create ECS task definition with 2 vCPU and 4GB memory allocation
   - Configure fraud-detector container from ECR repository
   - Container must expose port 8080 for application traffic

3. **Load Balancing**
   - Configure Application Load Balancer for traffic distribution
   - Implement target group with health checks on /health endpoint
   - Use least_outstanding_requests routing algorithm
   - Deploy ALB in public subnets across availability zones

4. **Service Deployment**
   - Deploy ECS service with desired count of 3 tasks
   - Distribute tasks across us-east-1a, us-east-1b, us-east-1c availability zones
   - Maintain exactly 2 tasks during deployments (minimumHealthyPercent: 100, maximumPercent: 200)

5. **Auto Scaling**
   - Implement auto-scaling policy based on CPU utilization
   - Scale between minimum 2 and maximum 10 tasks
   - Trigger scaling at 70% average CPU utilization
   - Configure 2-minute cooldown period between scaling actions

6. **Logging and Monitoring**
   - Configure CloudWatch log group with 30-day retention
   - Encrypt container logs using AWS-managed KMS keys
   - Enable CloudWatch Container Insights for cluster monitoring

7. **Network Security**
   - Create security groups for ALB and ECS tasks
   - Allow ALB to communicate with ECS tasks on port 8080
   - Configure proper ingress and egress rules

8. **IAM Roles and Policies**
   - Define ECS task execution role with least-privilege permissions
   - Define ECS task role for application permissions
   - No wildcard actions allowed in IAM policies
   - Include permissions for ECR, CloudWatch Logs, and container insights

9. **Outputs**
   - Export ALB DNS name for application access
   - Export ECS cluster ARN for reference

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **ECS Fargate** as the compute platform
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch Logs** for centralized logging
- Use **Auto Scaling** for dynamic capacity management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- **Container health checks must fail after 3 consecutive failures with 30-second intervals**
- **All resources must be destroyable** - use DeletionPolicy: Delete (no Retain policies)
- **Platform version must be 1.4.0** for Fargate tasks
- **IAM policies must use least-privilege** with specific actions only
- **Existing VPC integration** - reference vpc-0123456789abcdef0 with existing subnets

### Constraints

- ECS tasks must use Fargate launch type with platform version 1.4.0 exactly
- Container health checks configured with 3 retries and 30-second intervals
- ALB target group must use least_outstanding_requests routing algorithm
- ECS service must maintain 2 healthy tasks during deployments
- All container logs must be encrypted using AWS-managed KMS keys
- ECS task execution role must not have wildcard actions in IAM policies
- Auto-scaling triggers at 70% CPU utilization with 2-minute cooldown
- All resources must be destroyable without retention policies

### Environment Details

- **Region**: us-east-1 with 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
- **VPC**: Existing VPC (vpc-0123456789abcdef0)
- **Subnets**: Private subnets for ECS tasks, public subnets for ALB
- **Container Image**: ECR repository contains fraud-detector:latest
- **Database**: Integration with existing RDS Aurora cluster in same VPC
- **Monitoring**: CloudWatch Container Insights enabled

## Success Criteria

- **Functionality**: Complete ECS Fargate deployment with ALB, auto-scaling, and monitoring
- **High Availability**: Tasks distributed across 3 availability zones with health checks
- **Scalability**: Auto-scaling between 2-10 tasks based on CPU utilization
- **Security**: Least-privilege IAM roles, encrypted logs, proper security groups
- **Monitoring**: CloudWatch logs with 30-day retention and container insights
- **Resource Naming**: All resources include environmentSuffix parameter
- **Deployability**: Zero-downtime deployments maintaining 2 healthy tasks
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

---

## 🔍 Code Review Status - PR #7345

**Review Date:** 2025-11-26
**Branch:** synth-101912669
**Status:** ⚠️ Implementation deviates from 4 critical requirements above

### Requirements Validation

| Requirement | Line | Status | Current Implementation |
|------------|------|--------|----------------------|
| Existing VPC integration (vpc-0123456789abcdef0) | 80, 96 | ❌ FAIL | Creates new VPC instead |
| Desired count of 3 tasks | 33 | ❌ FAIL | Has 2 tasks |
| Container port 8080 | 24 | ❌ FAIL | Defaults to 80 |
| Health check on /health endpoint | 28, 76 | ❌ FAIL | Hardcoded port 80, no /health |
| Fargate platform 1.4.0 | 84 | ✅ PASS | Correct |
| 2 vCPU, 4GB memory | 21 | ✅ PASS | Correct |
| Container Insights enabled | 17, 100 | ✅ PASS | Correct |
| Auto-scaling 2-10 tasks, 70% CPU | 39, 87 | ✅ PASS | Correct |
| CloudWatch logs 30-day retention | 44, 88 | ✅ PASS | Correct |
| Security groups for port 8080 | 49, 252 | ⚠️ PARTIAL | SG correct but port default wrong |
| Least-privilege IAM (no wildcards) | 54, 89 | ✅ PASS | Correct |
| ALB DNS and ECS cluster outputs | 59, 61 | ✅ PASS | Correct |

**Compliance Score:** 8/12 requirements fully met (67%)
**Action Required:** Fix 4 critical deviations before deployment

---

## What to deliver

- Complete CloudFormation JSON template in lib/TapStack.json
- ECS cluster with containerInsights enabled
- ECS task definition with 2 vCPU, 4GB memory, Fargate 1.4.0
- Application Load Balancer with health checks and proper routing
- ECS service with 3 tasks distributed across availability zones
- Auto-scaling policy for CPU-based scaling (2-10 tasks)
- CloudWatch log group with 30-day retention and encryption
- Security groups for ALB and ECS communication
- IAM roles with least-privilege policies (no wildcards)
- Outputs for ALB DNS name and ECS cluster ARN
- Integration test updates in test/tap-stack.int.test.ts
- Unit test updates in test/tap-stack.unit.test.ts
- Documentation with deployment instructions
