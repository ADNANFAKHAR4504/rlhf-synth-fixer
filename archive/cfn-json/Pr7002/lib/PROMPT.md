Hey team,

We need to build a highly available web application infrastructure for our product catalog API. This is a critical production deployment that needs to handle millions of requests daily, so we need proper auto-scaling, load balancing, and health monitoring built in from day one.

The business has asked us to deploy this using CloudFormation because we need infrastructure-as-code that integrates seamlessly with our AWS deployment pipelines. The architecture needs to span three availability zones for high availability and support blue-green deployments for zero-downtime updates.

I've been tasked with creating the infrastructure template that will power our e-commerce platform's product catalog service. This needs to be production-grade with proper security groups, IAM policies, and CloudWatch monitoring right from the start.

## What we need to build

Create a highly available web application infrastructure using **CloudFormation with JSON** for a product catalog API deployment.

### Core Requirements

1. **Application Load Balancer Configuration**
   - Deploy ALB across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Configure SSL termination on the load balancer
   - Set up target group with path-based health checks on /api/v1/health
   - Health check interval must be 30 seconds
   - Enable target group stickiness for session persistence

2. **Auto Scaling Group and EC2 Configuration**
   - Create Auto Scaling Group with t3.medium instance type
   - Use Amazon Linux 2 AMI for all instances
   - Configure minimum 2 instances, maximum 8 instances
   - Ensure instances are distributed across the 3 availability zones
   - Configure instances to use IMDSv2 for metadata access

3. **CloudWatch Monitoring and Auto Scaling Policies**
   - Set up CloudWatch alarm for ASG average CPU utilization
   - Configure scale-out policy triggering at 70% CPU utilization
   - Configure scale-in policy triggering at 30% CPU utilization
   - Enable detailed monitoring for performance tracking

4. **IAM Security Configuration**
   - Create IAM instance profile for EC2 instances
   - Grant permissions to read from Parameter Store (for database connection strings)
   - Grant permissions to write to CloudWatch Logs
   - Follow least privilege principle for all permissions

5. **Network Security Groups**
   - Configure security group allowing HTTPS (443) from internet to ALB
   - Configure security group allowing HTTP (80) from ALB to EC2 instances only
   - Ensure EC2 instances are not directly accessible from internet
   - All security group rules must follow least privilege

6. **Infrastructure Outputs**
   - Output the ALB DNS name for integration with deployment pipelines
   - Output the target group ARN for CI/CD integration
   - All outputs must be clearly labeled for automated consumption

7. **Resource Tagging**
   - Tag all resources with Environment=Production
   - Tag all resources with Application=ProductCatalogAPI
   - Ensure consistent tagging across all created resources

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Application Load Balancer (ALB)** for load distribution
- Use **Auto Scaling Groups** with **EC2** instances for compute
- Use **CloudWatch** for monitoring and alarms
- Use **IAM** for instance profiles and permissions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be fully destroyable after testing
- Use RemovalPolicy DELETE or DeletionPolicy Delete for all resources
- FORBIDDEN: RetainPolicy or DeletionPolicy Retain on any resource
- Infrastructure must support blue-green deployments
- All resources must accept environmentSuffix parameter for multi-environment support
- Example naming: product-api-alb-dev, product-api-asg-prod

### Constraints

- Use JSON format exclusively for the CloudFormation template
- CloudWatch alarms must trigger at exactly 70% for scale-out and 30% for scale-in
- ALB health check path must be exactly /api/v1/health with 30-second intervals
- Parameter Store access limited to database connection strings only
- All EC2 instances must use IMDSv2 for security compliance
- No manual configuration allowed - everything must be in the template
- Must integrate with existing VPC (VPC ID provided as parameter)
- Must use existing subnets (subnet IDs provided as parameters)

## Success Criteria

- Functionality: ALB distributes traffic across healthy instances in 3 AZs
- Performance: Auto-scaling responds to CPU thresholds within 2 minutes
- Reliability: System survives loss of any single availability zone
- Security: Instances accessible only through ALB, no direct internet access
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: Valid CloudFormation JSON, well-structured, documented
- Deployability: Template deploys successfully with no manual intervention
- Integration: Outputs are properly formatted for CI/CD pipeline consumption

## What to deliver

- Complete CloudFormation JSON template in TapStack.json
- Parameters for VPC ID, subnet IDs, AMI ID, and environmentSuffix
- Application Load Balancer with SSL termination and health checks
- Auto Scaling Group with EC2 instances (t3.medium, Amazon Linux 2)
- CloudWatch alarms with CPU-based scaling policies
- IAM instance profile with Parameter Store and CloudWatch permissions
- Security groups for ALB and EC2 instances
- Outputs for ALB DNS name and target group ARN
- All resources tagged with Environment and Application tags
- Documentation on how to deploy and test the infrastructure
