I need help setting up a robust cloud environment in AWS using Pulumi JavaScript. I'm working on a project that needs to handle application logs securely and provide resilient infrastructure across multiple availability zones.

Here are my specific requirements:

1. Set up an S3 bucket with versioning enabled for storing application logs
2. Create a custom IAM policy that restricts S3 bucket access to only specific IAM roles  
3. Deploy EC2 instances using a custom AMI across at least two availability zones for resilience
4. Associate Elastic IPs with the EC2 instances for consistent addressing
5. Implement an Application Load Balancer to distribute incoming traffic to the EC2 instances
6. Deploy everything in the us-west-1 region
7. Follow our naming convention: '<project>-<environment>-<resource>'
8. Use modern Pulumi JavaScript patterns
9. Ensure the setup meets security best practices and operational standards

For the project, I'd like to use "myapp" as the project name and "prod" as the environment. The custom AMI ID I want to use is ami-0abcdef1234567890.

I'd also like to take advantage of some of the newer AWS features if possible. I heard about Amazon S3 Metadata for better visibility into S3 objects and the enhanced AWS Shield for network security - can these be integrated?

Please provide the complete infrastructure code that I can deploy with Pulumi. Make sure to include proper VPC setup, security groups, and IAM roles with least privilege access. I need one code block per file so I can easily copy and implement the solution.