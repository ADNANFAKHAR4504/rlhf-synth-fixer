I need help creating secure AWS infrastructure using Pulumi TypeScript. The infrastructure should follow security best practices and implement the following requirements:

1. **Multiple S3 Buckets with Enhanced Security**: Create 3 S3 buckets for different purposes (documents, logs, backups). All buckets must be private by default with public access blocked. Include server-side encryption with KMS and versioning enabled.

2. **IAM Security Configuration**: Set up IAM password policy requiring minimum 12 characters with uppercase, lowercase, numbers, and symbols. Create an IAM role for Lambda execution with least privilege principles.

3. **Secure Lambda Function**: Deploy a Lambda function that processes data from the S3 buckets. The function should use AWS Secrets Manager to store and retrieve database credentials instead of environment variables. Ensure sensitive AWS credentials like AWS_ACCESS_KEY_ID are never logged or output.

4. **Modern AWS Security Features**: Integrate AWS Certificate Manager with post-quantum cryptography support (ML-KEM) and use GuardDuty Lambda Protection for enhanced threat detection.

The infrastructure should be deployed in the us-east-1 region and follow the naming convention: myproject-prod-[resource-type]. All resources should be properly tagged with Environment=production and Project=myproject.

Please provide the complete Pulumi TypeScript infrastructure code with proper imports, resource definitions, and exports. Structure the code to be production-ready with appropriate error handling and security configurations.