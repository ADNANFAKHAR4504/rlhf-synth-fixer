# Multi-Region High Availability Infrastructure Setup

I need to set up a highly available and failure-resilient infrastructure across multiple AWS regions using Terraform. The setup should be able to handle failures at any level - from single availability zones to entire regions.

Here's what I need:

## Core Requirements

1. **Multi-Region VPC Setup**: Deploy VPCs in two regions (us-west-2 as primary, us-east-1 as secondary) with proper networking configuration across multiple availability zones in each region.

2. **Load Balanced EC2 Instances**: EC2 instances should be distributed across multiple availability zones within each VPC, with Application Load Balancers managing incoming traffic efficiently.

3. **Multi-AZ RDS Databases**: RDS databases configured for automatic failover between availability zones, with cross-region read replicas for disaster recovery.

4. **SNS Notifications**: Set up SNS topics for monitoring failover events and performance issues.

5. **Cross-Region Failover**: Implement automatic failover mechanisms that can handle both zone-level and region-level failures.

## Latest AWS Features to Include

- Use **AWS Application Recovery Controller (ARC)** for centralized failover coordination and routing control between regions
- Implement **Route 53 health checks** with routing policies for DNS-based failover
- Configure **Auto Scaling Groups** with ARC zonal shift capabilities for zone-level recovery

## Infrastructure Details

- All resources must be tagged with 'Environment:Production'
- Ensure minimal downtime during failover scenarios  
- Configure automatic data recovery procedures
- Use latest AWS services available in 2025
- Optimize for quick deployment times where possible

Please provide the complete Terraform infrastructure code. Each file should be in its own code block so I can easily copy and implement them. Make sure the infrastructure can automatically recover from failures and maintain high availability.