# AWS Web Application Infrastructure with Auto Scaling and Load Balancer

I need to deploy a highly available web application infrastructure in AWS using CDK with Python. The application needs to be deployed in the us-west-2 region and should handle variable traffic loads automatically.

## Requirements

I need the following components for my web application:

1. **Auto Scaling Group**: Set up an Auto Scaling group to manage EC2 instances that will host my application. The instances should be distributed across at least two availability zones in us-west-2 for high availability.

2. **Elastic Load Balancer**: Deploy an Application Load Balancer to distribute incoming traffic across the EC2 instances. The load balancer should be internet-facing to handle external traffic.

3. **Health Checks**: Configure proper health checks on the load balancer to ensure traffic only goes to healthy instances. If an instance fails health checks, it should be automatically replaced.

4. **Network Security**: Allow HTTP (port 80) and HTTPS (port 443) traffic from the internet to reach the load balancer. Set up appropriate security groups to control traffic flow between components.

5. **Secure Configuration**: Use AWS Secrets Manager or similar secure parameter storage for any sensitive data like database passwords or API keys that the application might need.

6. **Infrastructure Outputs**: Output the load balancer URL so I can easily access the deployed web application.

## Additional Considerations

The infrastructure should be cost-effective and leverage recent AWS features where appropriate. I'd like to use Amazon ECS Auto Mode if it helps simplify container management, and consider Amazon Aurora DSQL for any database needs due to its serverless nature and high availability features.

Please provide the complete CDK Python code that implements this infrastructure. I need one code block per file so I can easily copy and implement each component.