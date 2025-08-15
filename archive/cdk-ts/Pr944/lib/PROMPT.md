I need to create a multi-region AWS infrastructure setup that handles both production and development environments. Can you help me design infrastructure code that meets these requirements?

My setup needs to work across two regions: us-east-1 and us-west-2. I want to connect VPCs in both regions using VPC peering so resources can talk to each other privately. All my S3 buckets need to be encrypted with separate KMS keys for security.

For databases, I need RDS instances in both regions with Multi-AZ for high availability. I also want DynamoDB global tables to keep data synchronized between the regions.

The Lambda functions should have proper permissions to access the resources they need, and I need an Application Load Balancer that can route traffic based on paths and domains.

For monitoring, I want CloudWatch dashboards that give me visibility across both regions. Since CloudWatch has the new investigation feature with AI-powered troubleshooting, please include that if possible. The mobile app support for Log Insights would also be useful.

I need IAM roles that work properly across regions using STS assume role functionality. Security is important - everything should follow AWS best practices.

Can you provide infrastructure code that creates all of this? I prefer having separate files for different components to keep things organized. Make sure to use prod- prefix for production resources and dev- prefix for development ones.

The VPC peering should take advantage of the improved billing transparency that AWS introduced recently. Also consider that cross-region data transfer costs apply, so the setup should be cost-efficient.

Please provide the complete infrastructure code with proper resource naming and tagging.