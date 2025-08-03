# Secure and Compliant Cloud Environment with AWS CDK and TypeScript

You are tasked with setting up a secure, compliant, and scalable cloud environment on AWS using the AWS Cloud Development Kit (CDK) with TypeScript. The entire infrastructure must be defined as code and adhere to modern best practices for security and operations.

## Requirements

### Region and Deployment
All resources must be provisioned in the **us-west-2** region. The entire stack should be easily deployable, updatable, and destroyable without manual intervention.

### VPC Architecture
- Design and implement a VPC with at least two public and two private subnets, distributed across a minimum of two Availability Zones
- Set up a bastion host to provide secure, controlled access to resources within the private subnets

### Application Tier
- Deploy an Application Load Balancer (ALB) to distribute traffic
- The ALB should route traffic to a fleet of EC2 instances managed by an Auto Scaling Group
- Configure health checks and an autoscaling policy (e.g., based on CPU utilization) for the EC2 instances

### Database Tier
Provision an Amazon RDS for MySQL database instance. Automated backups must be enabled.

### Storage
Any S3 buckets created must have versioning and server-side encryption enabled by default.

### Security and IAM
- Enforce the principle of least privilege for all IAM roles created for EC2 instances, Lambda functions, or other services
- Use security groups to tightly control traffic between the different tiers (e.g., allowing traffic from the ALB to the EC2 instances, and from the EC2 instances to the RDS database)

### Monitoring and Compliance
- Set up CloudWatch alarms to monitor key metrics for the EC2 instances, such as high CPU and memory usage
- Implement AWS Config rules to continuously monitor resource configurations for compliance and detect drift from the desired state

### CDK Best Practices
- The entire infrastructure must be defined in a single, well-structured CDK application using TypeScript
- Use CDK context files (`cdk.context.json`) or stack properties to manage environment-specific values (e.g., VPC CIDR ranges, instance types)
- Apply a consistent tagging strategy to all resources for cost allocation and auditing purposes

### Logging
Ensure logging is enabled for all relevant services, including VPC Flow Logs, ALB access logs, and S3 bucket access logs.

## Expected Output

Generate a complete and functional AWS CDK project in TypeScript that defines all the required resources and adheres to the listed constraints. The CDK application should be ready to deploy, and the resulting infrastructure should be secure, scalable, and compliant.