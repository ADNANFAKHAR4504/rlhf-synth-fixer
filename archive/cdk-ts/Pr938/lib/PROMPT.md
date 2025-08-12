I need help creating a multi-environment infrastructure setup using AWS CDK TypeScript that ensures consistency across different environments and regions. The setup should support multiple development stages like dev, staging, and production.

Key requirements:
- Set up VPC configurations that are consistent across all environments
- Create parameterized constructs so I can deploy the same infrastructure with different settings per environment
- Implement IAM roles and policies following least privilege principles that work the same way across environments
- Set up S3 buckets with cross-region replication for data backup and disaster recovery
- Add CloudWatch monitoring and logging to track what's happening in each environment
- Make sure I can update stacks automatically while keeping proper version control

I'd like to use some of the newer AWS features if possible - I heard about S3 Express One Zone for better performance and the new EKS Dashboard for multi-cluster visibility. Maybe incorporate those if they make sense.

The infrastructure should be modular and reusable so I don't have to duplicate code for each environment. I want to be able to deploy to us-east-1 primarily but also support other regions like us-west-2.

Please provide the CDK TypeScript infrastructure code with proper construct organization and parameterization. Each file should be in its own code block so I can copy them directly.