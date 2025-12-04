# ECS Deployment Optimization

Hey team,

We've got a production ECS cluster that's been running for a while, but we're seeing some serious inefficiencies that are costing us money and causing operational headaches. The infrastructure works, but it's far from optimal. We need to refactor this deployment using **Pulumi with TypeScript** to address multiple resource management issues.

The current setup has accumulated technical debt over several iterations. We've got duplicate service definitions that could be consolidated, hardcoded values scattered everywhere, and some configuration choices that made sense initially but are now causing problems at scale. The cost analysis shows we're over-provisioning resources significantly, and our CloudWatch logs are piling up without any retention policies.

## What we need to build

Create an optimized ECS infrastructure using **Pulumi with TypeScript** that addresses the inefficiencies in our current deployment while maintaining the same functionality.

### Core Optimization Requirements

1. **Service Consolidation**
   - Identify and consolidate duplicate ECS service definitions that share the same task definition
   - Create reusable component abstractions to reduce code duplication
   - Maintain service isolation while sharing common configuration

2. **Task Placement Strategy**
   - Fix the current placement strategy that spreads tasks unnecessarily across all availability zones
   - Optimize for cost and performance based on actual workload patterns
   - Implement proper zone balancing without over-distribution

3. **Resource Reservations**
   - Implement proper CPU and memory reservations to prevent over-provisioning
   - Right-size container instances based on actual resource utilization
   - Configure appropriate soft and hard limits for containers

4. **Configuration Management**
   - Replace all hardcoded values with configuration variables
   - Support environment-specific deployments (dev, staging, production)
   - Use Pulumi config system for sensitive values and environment differences

5. **CloudWatch Log Management**
   - Add retention policies to all CloudWatch log groups
   - Prevent indefinite log storage costs with appropriate retention periods
   - Configure log group retention based on environment and compliance needs

6. **ALB Health Check Optimization**
   - Fix overly aggressive health check intervals that generate unnecessary traffic
   - Configure appropriate timeout and interval values
   - Reduce healthy and unhealthy threshold counts to reasonable levels

7. **Tagging Strategy**
   - Implement comprehensive tagging for cost allocation
   - Add resource management tags for ownership and lifecycle
   - Include environment, project, and team tags on all resources

8. **Security Group Cleanup**
   - Remove unused security group rules from previous iterations
   - Audit and document necessary ingress/egress rules
   - Apply principle of least privilege to network access

9. **Resource Dependencies**
   - Add explicit resource dependencies to ensure proper creation order
   - Prevent race conditions during stack updates
   - Ensure proper deletion order to avoid orphaned resources

10. **Auto-scaling Configuration**
    - Replace request count-based scaling with CPU utilization metrics
    - Configure appropriate scaling thresholds and cooldown periods
    - Implement scale-in and scale-out policies based on actual load

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS ECS for container orchestration
- Use Application Load Balancer for traffic distribution
- Use CloudWatch for monitoring and logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All resources MUST include environmentSuffix parameter to prevent naming conflicts across deployments
- **Destroyability**: All resources must use RemovalPolicy.DESTROY or equivalent - FORBIDDEN to use RETAIN policies
- **Dependencies**: Explicit dependencies must be declared to ensure proper creation/deletion order
- **Configuration**: Use Pulumi config for environment-specific values (do NOT hardcode)
- **Tagging**: All taggable resources must include standard tags (Environment, Project, ManagedBy)

### Intentional Design Decisions (Test/Development Environment)

The following configurations are **intentional design decisions** for this test automation and development environment. These are NOT issues to be flagged:

1. **HTTP-only ALB Configuration (No HTTPS/TLS)**
   - This infrastructure is designed for ephemeral test/PR environments
   - HTTPS/TLS is not required as no sensitive data is transmitted
   - Certificate management adds unnecessary complexity for short-lived test stacks
   - Production deployments would add ACM certificates and HTTPS listeners separately

2. **Minimal CloudWatch Alarms (Low CPU Only)**
   - Only low CPU utilization alarm is configured intentionally for cost optimization demos
   - Additional alarms (memory, request count, error rates) are out of scope for this optimization exercise
   - The focus is on demonstrating auto-scaling patterns, not comprehensive monitoring

3. **Permissive Security Group Rules (0.0.0.0/0 on ports 80/443)**
   - ALB ingress from 0.0.0.0/0 is intentional for public-facing test endpoints
   - ECS tasks only accept traffic from ALB security group (principle of least privilege applied)
   - This is standard for public-facing ALBs; internal services would use VPC-restricted rules

4. **Container Image with 'latest' Tag (nginx:latest)**
   - Using nginx:latest as a placeholder/demo image is intentional
   - Real applications would use immutable tags or SHA digests
   - This demonstrates the infrastructure patterns, not application deployment best practices

### Constraints

- Maintain backward compatibility with existing service endpoints
- Zero-downtime deployment strategy required
- Must support blue-green deployment patterns
- All changes must be auditable through infrastructure code
- Follow AWS Well-Architected Framework principles
- Include proper error handling and rollback mechanisms

### Optimization Analysis

Before implementing the optimized infrastructure, create an analysis script that:
- Identifies the specific inefficiencies in a typical ECS deployment
- Provides recommendations for each optimization area
- Generates a report with before/after resource configurations
- Validates that all 10 optimization points are addressed

## Success Criteria

- **Service Consolidation**: Duplicate services reduced to reusable components
- **Resource Efficiency**: CPU and memory reservations properly configured
- **Configuration Management**: No hardcoded values, all externalized to config
- **Cost Optimization**: CloudWatch retention policies applied, health checks optimized
- **Operational Excellence**: Proper tagging, clean security groups, explicit dependencies
- **Auto-scaling**: CPU-based scaling policies configured and tested
- **Code Quality**: TypeScript, well-documented, follows Pulumi best practices
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed without retention

## What to deliver

- Complete Pulumi TypeScript implementation with optimized ECS infrastructure
- Python analysis script (`optimize.py`) that validates optimization patterns
- Reusable component abstractions for ECS services
- Pulumi config schema for environment-specific values
- Comprehensive tagging strategy implementation
- Optimized ALB target group configuration
- CPU-based auto-scaling policies
- Documentation explaining optimization decisions and trade-offs
