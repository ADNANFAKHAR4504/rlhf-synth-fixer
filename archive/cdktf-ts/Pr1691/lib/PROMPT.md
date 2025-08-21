We need to implement a secure AWS environment using CDK for Terraform (TypeScript).  
The setup should enforce strict security controls and monitoring practices in the `eu-west-1` region.

## What to implement

We’ll organize the code into two files:

### modules.ts
Define all the core security-focused resources:
- **IAM roles and policies** implementing a least privilege model.
- **Security Groups** that allow inbound traffic **only from `203.0.113.0/24`**.
- **S3 buckets** for sensitive data storage with server-side encryption enabled.
- **CloudTrail** for monitoring account activity and capturing all API calls.
- **KMS keys** for encrypting EBS volumes at rest.
- **RDS instances** configured as private (not publicly accessible).
- **CloudWatch alarms** for monitoring CPU usage on EC2 instances with alerts for high utilization.

Add inline comments to explain security decisions (e.g., why an RDS is private, why a bucket uses encryption, why specific IAM policies are used).

### tap-stack.ts
This file ties everything together:
- Import the modules defined in `modules.ts`.
- Use variables for IP ranges, instance types, and key parameters.
- Define outputs for:
  - CloudTrail ARN
  - S3 bucket names
  - KMS key IDs
  - RDS endpoint (private)
  - CloudWatch alarm ARNs

## Key requirements

- **Region:** `eu-west-1`.  
- IAM must enforce a **least privilege access model**.  
- Security groups must only allow inbound access from `203.0.113.0/24`.  
- S3 buckets must use **encryption by default**.  
- Enable **CloudTrail** across the account for API activity logging.  
- Use **KMS** to encrypt EBS volumes at rest.  
- RDS must remain private (no public accessibility).  
- CloudWatch alarms must track **EC2 CPU utilization** with alerts.  

## Deliverables

- `modules.ts` with definitions for IAM, SGs, S3, CloudTrail, KMS, RDS, CloudWatch.  
- `tap-stack.ts` with composition logic, variables, and outputs.  
- Code must pass `terraform validate` and `terraform plan`.  

## Notes

- Follow AWS security best practices in IAM, networking, and storage.  
- Ensure comments describe not only what is created but also why it’s important for security.  
- Use resource names following the convention: `MyApp-<ResourceType>-<ResourceID>`.  
- This should act as the CDKTF equivalent of a security-focused CloudFormation template.
