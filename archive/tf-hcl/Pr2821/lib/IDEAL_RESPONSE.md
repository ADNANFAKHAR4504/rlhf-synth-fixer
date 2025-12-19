Ideal Response Specification - AWS S3 Security Stack

Expected Behavior

1. S3 Bucket Security
- Encryption: All objects encrypted with AES-256 server-side encryption
- Access Control: Public access completely blocked
- Transport Security: All requests must use TLS/HTTPS
- Versioning: Object versioning enabled for data protection
- Policy Enforcement: Bucket policy prevents encryption bypass

2. IAM Role Configuration
- Analytics Reader Role:
  - Assumes role only from EC2 instances
  - Read-only access to analytics/* prefix only
  - TLS enforcement for all operations
  - No write permissions anywhere
  
- Uploader Role:
  - Assumes role only from EC2 instances
  - Write-only access to uploads/* prefix only
  - Mandatory AES256 encryption on all uploads
  - No read permissions anywhere

3. Security Compliance
- Least Privilege: Each role has minimal required permissions
- Defense in Depth: Multiple layers of security controls
- Audit Trail: All actions logged and traceable
- Resource Tagging: Consistent tagging for governance

4. Infrastructure Outputs
- Identifiers: Bucket name and ARN for reference
- Role ARNs: For EC2 instance profile assignment
- Policy JSON: For compliance verification and audit

Success Criteria

Functional Tests
- Bucket created with correct encryption settings  
- Public access completely blocked  
- IAM roles created with proper trust relationships  
- Policies enforce least privilege access  
- Instance profiles available for EC2 assignment  

Security Tests
- Non-TLS requests rejected  
- Unencrypted uploads blocked  
- Cross-prefix access denied  
- Encryption configuration locked  
- All resources properly tagged  

Compliance Tests
- No hardcoded ARNs or regions  
- Variable usage for region configuration  
- Comprehensive output values  
- Self-contained single file  
- No external module dependencies  