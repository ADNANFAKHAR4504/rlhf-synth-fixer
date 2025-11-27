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

## 🚨 URGENT: DEPLOYMENT BLOCKED - PR #7345

**Review Date:** 2025-11-26  
**Branch:** synth-101912669  
**Status:** ❌ **4 CRITICAL REQUIREMENT VIOLATIONS** - Cannot deploy to target environment

### 🔥 DEPLOYMENT BLOCKED: 4 Critical Requirement Violations

The current CloudFormation template **VIOLATES 4 EXPLICIT REQUIREMENTS** from this document, making it **impossible to deploy** to the target environment:

| ❌ **CRITICAL VIOLATION** | **THIS DOCUMENT REQUIREMENT** | **CURRENT TEMPLATE VIOLATION** | **DEPLOYMENT IMPACT** |
|---------------------------|--------------------------------|----------------------------------|------------------------|
| **🚫 VPC Infrastructure** | Lines 80, 96: "**Existing VPC integration** - reference **vpc-0123456789abcdef0**" | Creates **new VPC** with 15+ resources (VPC, NAT gateways, subnets) | 🚫 **Deployment FAILS** + **$98.55/month** unnecessary costs |
| **⚡ ECS Task Count** | Line 33: "Deploy ECS service with **desired count of 3 tasks**" | `"DesiredCount": 2` (line 954) | ⚡ **33% LESS capacity** than required |
| **🔌 Container Port** | Line 24: "Container must expose **port 8080** for application traffic" | `"Default": 80` (line 42) | 🔌 **Fraud detection app INACCESSIBLE** |
| **💔 Health Check** | Lines 28, 76: "health checks on **/health endpoint**" | Uses hardcoded **port 80** and **"/" endpoint** | 💔 **ECS marks healthy tasks as UNHEALTHY** |

### 🔥 CRITICAL: Cannot Proceed to Production

**❌ DEPLOYMENT STATUS: BLOCKED**
- **Infrastructure conflicts:** New VPC creation conflicts with existing vpc-0123456789abcdef0
- **Cost violation:** Creates $98.55/month unnecessary infrastructure
- **Capacity violation:** 33% below required task count (2 vs 3)
- **Application failure:** Wrong port configuration makes fraud app inaccessible
- **Service instability:** Health checks will fail, causing continuous restarts

### 🔧 URGENT FIXES REQUIRED (45 Minutes Total)

**PRIORITY 1 - Infrastructure Fixes (DEPLOYMENT BLOCKING):**

1. **🚨 VPC Fix (30-45 min) - CRITICAL**
   - **Remove:** Lines 47-423 (entire VPC infrastructure: VPC, IGW, NAT, subnets, route tables)
   - **Add:** 7 parameters for existing vpc-0123456789abcdef0 and subnet IDs
   - **Impact:** Saves $98.55/month + enables deployment in target environment

2. **🚨 ECS Count Fix (1 min) - CRITICAL**
   - **Change:** Line 954: `"DesiredCount": 2` → `"DesiredCount": 3`
   - **Impact:** Meets required capacity for 3-AZ distribution

3. **🚨 Port Fix (1 min) - CRITICAL**
   - **Change:** Line 42: `"Default": 80` → `"Default": 8080`
   - **Impact:** Makes fraud detection app accessible

4. **🚨 Health Check Fix (3-5 min) - CRITICAL**
   - **Change:** Line 712: Use `{"Fn::Sub": "curl -f http://localhost:${ContainerPort}/health || exit 1"}`
   - **Change:** Line 888: `"HealthCheckPath": "/health"` (currently "/")
   - **Impact:** Prevents service instability and restart loops

### 📊 Requirement Compliance Status

| Compliance Category | Current Status | Target | Blocker Impact |
|---------------------|----------------|--------|--------------------|
| **CRITICAL VIOLATIONS** | ❌ **4 REQUIREMENTS FAILED** | ✅ 0 failures | **🚫 DEPLOYMENT BLOCKED** |
| **Working Requirements** | ✅ **8 REQUIREMENTS PASSED** | ✅ 8 passed | ✅ Infrastructure foundation good |
| **OVERALL COMPLIANCE** | ⚠️ **67% (8/12)** | 🎯 **100% (12/12)** | ❌ **CANNOT DEPLOY TO PRODUCTION** |

### 💰 Cost Impact Analysis

**Current Template Costs:**
- **3 NAT Gateways:** 3 × $32.85/month = **$98.55/month**
- **Data Processing:** ~$65/month (estimated 1.5TB)
- **Total Unnecessary Cost:** **~$163.55/month** (**$1,962/year**)

**Required Template (Using Existing VPC):**
- **NAT Gateway Cost:** **$0** (uses existing infrastructure)
- **Annual Savings:** **$1,962** by following requirements correctly

### ⚠️ CANNOT PROCEED WITHOUT FIXES

**This infrastructure template:**
- ❌ **Cannot deploy** to the target environment (VPC conflicts)
- ❌ **Violates explicit requirements** in 4 critical areas
- ❌ **Creates unnecessary costs** of $98.55/month
- ❌ **Will cause service failures** due to wrong port/health check configuration

**Next steps:** Apply the 4 critical fixes above before any deployment attempts.

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
