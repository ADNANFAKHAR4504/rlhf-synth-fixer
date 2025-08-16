I need to deploy a web application using AWS Elastic Beanstalk with high availability and auto-scaling capabilities. The application should be deployed in the us-east-1 region with the following requirements:

1. Use Elastic Beanstalk to manage the web application environment with support for easy updates and rollbacks
2. Deploy across multiple availability zones in us-east-1 for high availability and resilience  
3. Configure auto scaling with minimum 2 instances and maximum 10 instances based on traffic demand
4. Set up HTTPS communication with SSL certificate attached to the environment
5. Use parameterized configuration for instance types and key pairs following best practices

The solution should leverage Elastic Beanstalk's integration with AWS Secrets Manager for secure environment variable management, which was introduced in March 2025. Also incorporate Application Load Balancer with TLS 1.3 support for improved security and performance.

Please provide the infrastructure code with one code block per file that can be deployed to meet these requirements.