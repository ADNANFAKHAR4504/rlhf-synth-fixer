I need to create a highly available and resilient infrastructure for a web application that can handle traffic spikes and automatically recover from failures. The infrastructure should be distributed across multiple availability zones in us-east-1 region.

Requirements:

1. Multi-AZ Web Application Deployment
   - Deploy web application across at least 3 availability zones
   - Use EC2 instances with Auto Scaling to handle variable load
   - Configure minimum 2 instances, maximum 10 instances
   - Scale out when CPU utilization exceeds 70%, scale in when below 30%

2. Application Load Balancer with Latest Features
   - Configure ALB with health checks and traffic distribution
   - Enable cross-zone load balancing
   - Use the new 2024 header modification capabilities for security
   - Integrate with CloudFront and WAF for enhanced protection
   - Configure HTTPS termination with SSL certificate

3. Multi-AZ Database with High Availability
   - Set up RDS MySQL database with Multi-AZ deployment
   - Enable automated backups and point-in-time recovery
   - Use RDS Blue/Green deployments feature for safe updates
   - Configure read replicas for read scaling

4. CloudWatch Monitoring and Alarms
   - Set up comprehensive monitoring for all components
   - Create alarms for CPU utilization, database performance, and application health
   - Configure SNS notifications for critical alerts
   - Monitor ALB target health and response times

5. Network Security and Infrastructure
   - Create VPC with public and private subnets across multiple AZs
   - Configure security groups with least privilege access
   - Use NAT gateways for outbound internet access from private subnets
   - Implement proper routing and network ACLs

The infrastructure should automatically handle instance failures, database failovers, and traffic spikes without manual intervention. All resources should follow AWS best practices for high availability and be cost-optimized.

Please provide infrastructure code with proper resource naming following the pattern 'TapStack-Environment-ResourceType'. Include all necessary components in a single stack implementation.