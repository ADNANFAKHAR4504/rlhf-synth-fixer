I need help creating secure AWS infrastructure using CDK TypeScript. The infrastructure should include:

1. An S3 bucket with server-side encryption using Amazon S3-managed keys
2. IAM roles and users with strict security policies, including Multi-Factor Authentication enforcement
3. An RDS instance that is not publicly accessible 
4. GuardDuty enabled for threat detection with Extended Threat Detection features
5. API Gateway with comprehensive logging enabled
6. All resources should follow least privilege principle and be prefixed with 'corp-'

The infrastructure should be deployed in us-east-1 region and meet enterprise security standards. Please provide complete CDK TypeScript infrastructure code with proper security configurations.