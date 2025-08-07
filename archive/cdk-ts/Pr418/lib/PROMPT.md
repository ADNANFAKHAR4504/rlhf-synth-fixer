You are an expert AWS CDK (Cloud Development Kit) architect. Your task is to design a CDK application (TypeScript) that fulfills the following requirements:

**Requirements:**
1. All S3 buckets must use AWS KMS for encryption.
2. Implement CloudWatch detailed logging for all EC2 instances.
3. Attach IAM roles to Lambda functions that limit their access to only the essential AWS services.
4. Deploy all RDS instances in a Multi-AZ configuration for high availability.
5. Enable VPC Flow Logs for all networks to monitor traffic.

**Constraints:**
- Ensure all S3 buckets are encrypted using AWS KMS keys.
- Enable detailed logging for all EC2 instances using CloudWatch.
- Attach an IAM role to each Lambda function that restricts access to only necessary AWS services.
- Ensure all RDS instances are in a Multi-AZ deployment for high availability.
- Enable VPC Flow Logs for all VPCs to capture IP traffic going to and from network interfaces.

**Environment:**
- The infrastructure environment consists of multiple AWS services including EC2, S3, Lambda, and RDS deployed across multiple AWS regions.
- Each service must adhere to stringent security and compliance requirements.

**Additional Instructions:**
- The CDK app must support multi-region deployments.
- Structure the application to include parameterization for cross-region resource names and constructs.
- The output should be a valid CDK application (preferably in TypeScript) that synthesizes to a CloudFormation template passing AWS validation and meeting all the stipulated constraints.
- Tests can be conducted by deploying the stacks in a test AWS account and verifying each service's compliance with the requirements.

Place the code in a single file