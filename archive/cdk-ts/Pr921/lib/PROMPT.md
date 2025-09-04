I need to deploy a highly available web application across two AWS regions (us-east-1 and us-west-2) with automatic failover capabilities. The architecture should handle traffic spikes using auto scaling and distribute traffic efficiently.

Key requirements:
- Deploy EC2 instances in Auto Scaling Groups in both regions
- Use Application Load Balancers to distribute traffic within each region
- Implement Route 53 for DNS management and automatic failover between regions
- Include VPC setup with public and private subnets across multiple availability zones
- Leverage AWS Resilience Hub best practices for multi-AZ deployment
- Ensure the architecture can handle traffic spikes dynamically

The solution needs to be cost-effective while maintaining high availability and should minimize deployment time by avoiding resources that take too long to provision.

Please provide infrastructure code that creates one code block per file, with all necessary configuration for this multi-region web application deployment.