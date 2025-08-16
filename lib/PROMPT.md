# TF-ServerlessDataProc-Hard-Single

Design a Terraform CDK (CDKTF) application using **TypeScript** that creates a **serverless data processing architecture** on AWS with the following specifications:

## Requirements
1. **Lambda Trigger from S3**  
   - Create an AWS Lambda function that is automatically triggered whenever new data is uploaded to a specific S3 bucket.  
   - The Lambda must process the file in real-time.  

2. **Security – Data Encryption & Access Control**  
   - Use AWS Key Management Service (KMS) to **encrypt data at rest** in S3.  
   - Enforce HTTPS to **encrypt data in transit**.  
   - Configure bucket policies to deny unencrypted (non-HTTPS) requests.  

3. **IAM Roles & Policies**  
   - Implement the **principle of least privilege** for the Lambda execution role.  
   - Allow only necessary permissions to read objects from the S3 bucket and decrypt using KMS.  

4. **Environment & Naming**  
   - AWS Region: **us-east-1**  
   - All resources should be prefixed with **`projectXYZ-`**.  
   - Use an existing VPC with ID: **`vpc-0abcd1234`**.  

5. **Output**  
   - Code must be in **a single TypeScript file** compatible with **CDKTF**.  
   - Should include all Terraform AWS provider configurations, constructs, and resource definitions needed for deployment.  

## Additional Best Practices
- Use environment variables for sensitive configurations where applicable.  
- Follow AWS CDKTF naming and structure conventions.  
- Include proper resource dependencies to ensure correct creation order.  
- Comment the code to explain each major resource block.

---