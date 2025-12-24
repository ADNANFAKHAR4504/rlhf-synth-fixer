Design an AWS CloudFormation template in YAML named `secure_infrastructure.yml` that provisions a secure infrastructure setup in the **us-east-1** region. The template must follow the organization's standard naming conventions and comply with the constraints listed below. Deploy to the dedicated AWS account with ID **123456789012**, using the provided VPC ID **vpc-abcde12345**.

## Requirements

1. **EC2**
   - Provision an EC2 instance using security team-approved AMI IDs.  
   - Restrict SSH access.  
   - The Application Load Balancer forwards HTTPS traffic to EC2 instances.  

2. **S3**
   - Create an S3 bucket with server-side encryption enabled using KMS.  
   - Attach a policy that restricts public access.  
   - CloudFront distribution sends logs to this S3 bucket.  

3. **RDS**
   - Configure an RDS instance with automated backups enabled and a retention period of at least 7 days.  
   - EC2 instances connect to RDS through VPC security groups for database access.  
   - Secrets Manager stores RDS credentials that Lambda and EC2 retrieve at runtime.  

4. **IAM**
   - Implement IAM policies granting the least privilege required by services and users.  
   - IAM roles attach to EC2 instances and Lambda functions for secure service access.  

5. **Lambda**
   - Launch a Lambda function within the VPC that processes data from DynamoDB.  
   - Apply the necessary IAM roles for execution.  
   - Lambda publishes notifications to SNS topic when processing completes.  

6. **CloudWatch & SNS**
   - Enable CloudWatch monitoring and alerting across the infrastructure.  
   - CloudWatch alarms trigger SNS notifications when thresholds are breached.  
   - SNS topic encrypts messages using KMS for security.  

7. **CloudFront**
   - CloudFront distribution serves content from S3 bucket with HTTPS only.  
   - CloudFront sends access logs back to the logging S3 bucket.  

8. **DynamoDB**
   - Create DynamoDB tables with point-in-time recovery enabled.  
   - Lambda functions read from and write to DynamoDB tables.  

9. **Security Best Practices**
   - Security groups must follow least privilege access.  
   - Only the Application Load Balancer security group may accept HTTPS traffic from the internet on port 443.  
   - All other security groups must restrict access to internal VPC resources only.  
   - Apply all recommended AWS security configurations.  

## Constraints

- Each component must include **Name** and **Environment** tags.  
- IAM roles must follow the **least privilege** principle.  
- EC2 instances must use **approved AMI IDs**.  
- All Lambda functions must enforce **VPC configuration**.  
- CloudFront distributions must log to the designated S3 bucket.  
- Application Load Balancer accepts HTTPS from the internet; all other services restricted to VPC internal traffic.  

## Expected Output

A valid CloudFormation YAML template (`secure_infrastructure.yml`) that can deploy successfully in AWS CloudFormation with no errors.
