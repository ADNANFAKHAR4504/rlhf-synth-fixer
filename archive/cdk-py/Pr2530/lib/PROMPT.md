I want you to create a serverless infrastructure on AWS using **CDK with Python**.  
The goal is to provide a secure and cost-efficient way for users to upload files through an API, with all the right guardrails in place.  

The folder structure for the CDK app should be:
- `tap.py` → the entry point of the application.  
- `lib/tap_stack.py` → the stack file where all resources are defined.  

---

## What I need
Please design an AWS CloudFormation stack (via CDK in Python) that sets up a **file upload pipeline** with these characteristics:

1. **S3 bucket for storage**  
   - All uploaded files should land in this bucket.  
   - Enable versioning so older versions are never lost.  
   - Encrypt data at rest, and make sure transfers are encrypted in transit.  
   - Apply a lifecycle policy: after 30 days, files should automatically transition to Glacier for cost savings.  

2. **Lambda function for processing uploads**  
   - This function will handle the upload logic.  
   - It should be lightweight, run across two Availability Zones for high availability, and log every action to CloudWatch.  
   - Timeout must be capped at 3 seconds.  

3. **API Gateway as the entry point**  
   - Provide a REST API that calls the Lambda function.  
   - Only allow specific MIME types: `.png`, `.jpg`, `.jpeg`.  
   - Requests over **5 MB** should be rejected right away.  

4. **Security and access management**  
   - Use IAM roles and policies with the principle of least privilege.  
   - Store any sensitive values in **AWS Secrets Manager** instead of hardcoding.  

---

## Why this matters
The idea is to lean on **serverless best practices**: minimal operational overhead, automatic scaling, and built-in security. The architecture should balance **security**, **reliability**, and **cost efficiency** — giving us a production-ready file upload service without unnecessary complexity.  

---

## Expected outcome
At the end, I should have a **deployable CDK app in Python** that:  
- Uses `tap.py` as the entry point.  
- Implements the main infrastructure inside `lib/tap_stack.py`.  
- Provisions all the resources described above.  
- Deploys cleanly to AWS without manual tweaks.  

Think of it as if you were building this for a production environment — keep the code structured, readable, and aligned with AWS best practices.  