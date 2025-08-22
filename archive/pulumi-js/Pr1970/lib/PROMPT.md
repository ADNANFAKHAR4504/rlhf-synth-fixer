# AWS Infrastructure for Highly Available Web Application

I need help creating infrastructure code for deploying a highly available and scalable web application on AWS. The application needs to handle variable traffic loads and maintain high availability across multiple availability zones.

## Requirements

1. **Region and Network Setup**: Deploy everything in the us-west-2 region. Create a VPC with both public and private subnets across multiple availability zones for high availability.

2. **Static Asset Storage**: Set up an S3 bucket to host static content like images, CSS, and JavaScript files. The bucket should be configured for web hosting with proper permissions.

3. **Auto Scaling**: Implement automatic scaling for the web application servers based on traffic demand. The system should scale up during high traffic and scale down when traffic decreases.

4. **High Availability**: Ensure all resources are deployed with high availability in mind - use multiple AZ deployments where possible and implement redundancy.

5. **Security and Access Management**: Use IAM roles and policies to manage permissions securely. Avoid any hardcoded credentials and follow AWS security best practices.

6. **Performance and Efficiency**: The infrastructure should handle traffic efficiently and scale based on actual demand.

I'd like to use some of AWS's newer features where appropriate - maybe something with the new EC2 VPC network interface settings for dynamic IPv4 management, and AWS Organizations Declarative Policies for consistent security configurations if that makes sense for this setup.

The code should be written in Pulumi using JavaScript. Please provide complete, working infrastructure code that I can deploy directly without placeholders or incomplete sections.