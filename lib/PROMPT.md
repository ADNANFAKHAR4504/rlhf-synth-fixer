Use AWS S3 bucket to store logs securely, ensuring log encryption both in transit and at rest. | 
Implement IAM roles and policies to provide least privilege access to the S3 bucket. |
 Ensure the Terraform code checks for bucket existence to prevent accidental overwrites. |
  Use versioning for all resources to manage updates and rollbacks safely. | 
  Incorporate a monitoring solution (such as AWS CloudWatch) to track unauthorized access attempts. | 
  Enforce multi-factor authentication (MFA) for any IAM user with write access to the bucket.



"As an expert in cloud security infrastructure, your task is to design a Terraform configuration that establishes a secure logging environment using AWS. The infrastructure should meet the following requirements:



1. Use an AWS S3 bucket to store logs securely. Both logs in transit and at rest must be encrypted.
2. Implement IAM roles and policies to provide least privilege access to this S3 bucket.
3. Ensure the Terraform configuration checks if the S3 bucket already exists to prevent accidental overwrites of data.
4. Versioning must be enabled on all resources to allow safe updates and rollbacks.
5. Set up a monitoring solution, such as AWS CloudWatch, to alert on any unauthorized access attempts.
6. Ensure that IAM users with write access to the S3 bucket are required to use multi-factor authentication (MFA).



Expected output: A completed Terraform configuration written in HCL that adheres to the constraints outlined. The solution should be fully functional, executable without errors, and should successfully deploy the described infrastructure when applied."



The infrastructure targets the us-east-1 AWS region and adheres to the AWS best practices for security and compliance. Naming conventions follow company standards, with all resources prefixed by 'corpSec-'.