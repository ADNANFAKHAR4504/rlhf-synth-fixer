I need to create AWS infrastructure using CDK with JavaScript. The setup should include:

1. Deploy resources in us-east-1 region which has multiple availability zones
2. Create an S3 bucket with versioning enabled for application log storage
3. Set up an IAM role for EC2 instances following least privilege principles  
4. Provision an RDS database with automated backups
5. Make the infrastructure scalable for future expansion

I want to use Aurora Serverless V2 for the RDS database since it offers better cost optimization and scaling compared to traditional instances. For the S3 bucket, I'd like to use the newer default public access blocking features that were enhanced in recent CDK versions.

Can you provide the CDK JavaScript code that defines this infrastructure? I need separate code files that I can copy directly into my project. Make sure to include proper error handling and follow CDK best practices. The code should be ready to run with cdk synth and cdk validate.

Please structure the response with one code block per file, clearly labeled with the filename.