We're building out a secure, scalable AWS infrastructure for a global organization that works with sensitive data in multiple regions. We need your help to design this using Terraform (HCL).

**What we're aiming for:**  
- Set up a VPC with both public and private subnets
- Create S3 buckets
- Deploy an RDS instance
- Add an Application Load Balancer (ALB)

**Security and Compliance are crucial. Please make sure your Terraform config does all of the following:**
- No resource should get a public IP by default.
- Tag everything using the format `Environment-Name`, like `Prod-MyApp`.
- Only use IAM roles for AWS service access—never root credentials.
- Be strict about least privilege for IAM roles.
- Enable AES-256 encryption for all S3 buckets.
- Turn on access logging for every S3 bucket, and send logs to a dedicated logging bucket.
- Make sure ALBs enforce SSL/TLS.
- Don’t allow inbound SSH (port 22) access from `0.0.0.0/0` in any security group.
- Enable versioning on all S3 buckets.

**What to deliver:**  
- One valid Terraform HCL file that does everything above.
- Your setup should pass AWS security checks and best-practices audits.
- If you can, show simulated deployment results (like logs or screenshots) that prove it’s all working.

**A couple more asks:**  
- Please keep all the requirements as written—don’t tweak or leave anything out.
- Use straightforward resource names and add comments to show how you’re meeting the rules.
- Treat this as production-ready for a big international business.

---

*Stick to all the requirements and constraints listed above in your solution. Thanks!*