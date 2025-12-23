# ECS Cluster Optimization Project

Hey team,

We've been running an ECS cluster for a while now and it's time for some serious optimization work. Our CloudWatch metrics are showing we're really over-provisioned with about 40% resource underutilization, and we're spending way more than we need to on infrastructure costs. The business wants us to tackle this comprehensively since we've also been having some operational issues that need fixing.

I've been asked to refactor our existing ECS deployment to be more cost-effective and fix some of the pain points we've been experiencing. The team has identified several areas that need work, from switching to Fargate Spot for our non-critical workloads to fixing those annoying ALB health check false positives that keep waking people up.

We need to build this using **Pulumi with TypeScript** since that's what we've standardized on for our infrastructure code. The goal is to demonstrate we can cut costs significantly, especially for non-critical workloads where we're targeting around 70% cost reduction by moving to Fargate Spot.

## What we need to build

Refactor our existing ECS cluster deployment using **Pulumi with TypeScript** to optimize costs, improve operational reliability, and enhance security posture.

### Core Requirements

1. **Capacity Provider Migration**
   - Update ECS cluster to use capacity providers with managed scaling
   - Replace manual auto-scaling group configurations
   - Implement proper scaling policies based on cluster capacity

2. **Task Definition Optimization**
   - Right-size CPU and memory allocations based on actual usage data
   - Address the 40% resource underutilization shown in CloudWatch metrics
   - Set appropriate resource limits for each service

3. **Fargate Spot Cost Reduction**
   - Convert EC2-backed services to Fargate Spot for non-critical workloads
   - Target 70% cost reduction for eligible services
   - Maintain proper fallback strategies for spot interruptions

4. **ALB Health Check Fix**
   - Fix incorrect timeout settings causing false positive health check failures
   - Configure appropriate health check intervals and thresholds
   - Ensure target group health checks align with application behavior

5. **Resource Tagging Strategy**
   - Implement consistent naming convention across all resources
   - All resource names must include environmentSuffix parameter for uniqueness
   - Follow naming pattern: resource-type-environment-suffix
   - Add proper metadata tags for cost allocation and management

6. **CloudWatch Container Insights**
   - Enable Container Insights for the ECS cluster
   - Set up proper monitoring for cluster performance metrics
   - Configure log aggregation and retention policies

7. **Task Placement Optimization**
   - Configure task placement strategies using binpack on memory
   - Maximize EC2 instance utilization where applicable
   - Optimize resource allocation across available capacity

8. **Security Group Hardening**
   - Remove overly permissive ingress rules (0.0.0.0/0 on port 22)
   - Implement least-privilege network access controls
   - Use proper CIDR ranges for SSH access if required

9. **IAM Least Privilege**
   - Create task execution roles following least privilege principles
   - Separate task roles from execution roles appropriately
   - Grant only necessary permissions for each service

10. **ECR Lifecycle Policies**
    - Implement lifecycle policies for all ECR repositories
    - Automatically clean up untagged images older than 7 days
    - Reduce storage costs and maintain clean repositories

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon ECS** with capacity providers for container orchestration
- Use **AWS Fargate Spot** for cost-optimized non-critical workloads
- Use **Application Load Balancer** for traffic distribution with fixed health checks
- Use **Amazon ECR** with lifecycle policies for container image storage
- Use **CloudWatch** for Container Insights, metrics, and logs
- Use **IAM** roles and policies following least privilege principles
- Use **VPC** and **Security Groups** with hardened network access rules
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable without manual intervention
- No Retain deletion policies on any resource
- No deletion protection enabled
- All resources must include environmentSuffix parameter in names
- Infrastructure must deploy cleanly in automated CI/CD pipeline

### Constraints

- Demonstrate measurable cost optimization (target 70% reduction for Fargate Spot workloads)
- Fix operational issues (health checks, security vulnerabilities)
- Maintain high availability and reliability during optimization
- Follow AWS Well-Architected Framework principles
- All resources must support clean teardown for testing environments
- Include comprehensive error handling and logging

## Success Criteria

- Functionality: All 10 optimization requirements fully implemented
- Performance: Right-sized resources based on actual usage metrics
- Cost: 70% cost reduction achieved for non-critical Fargate Spot workloads
- Reliability: Fixed health check false positives, proper scaling behavior
- Security: Removed 0.0.0.0/0 SSH access, implemented least privilege IAM
- Resource Naming: All resources include environmentSuffix following naming convention
- Operational: Container Insights enabled, ECR lifecycle policies active
- Code Quality: TypeScript, type-safe, well-documented, follows Pulumi best practices

## What to deliver

- Complete Pulumi TypeScript implementation of optimized ECS cluster
- Amazon ECS cluster with capacity providers and managed scaling
- Fargate Spot task definitions for cost-optimized workloads
- Application Load Balancer with corrected health check configurations
- ECR repositories with lifecycle policies for image cleanup
- CloudWatch Container Insights and monitoring configuration
- Security groups with hardened ingress rules (no 0.0.0.0/0 SSH)
- IAM roles and policies following least privilege principles
- VPC and networking configuration supporting the cluster
- Unit tests validating all infrastructure components
- Documentation including deployment instructions and optimization metrics
