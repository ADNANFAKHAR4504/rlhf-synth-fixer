# Pulumi Go: SecureCorp AWS Infrastructure Setup

The response should be generated in a single tap_stack.go file

1. **IAM Structure & Access Control**
   - We need different IAM roles for different teams (dev, ops, security, business)
   - Developers should only access dev/test resources
   - DevOps team needs broader access but still restricted
   - Security team needs read access to everything plus specific security tool permissions
   - Business users should only access billing and basic monitoring
   - All roles should follow the principle of least privilege

2. **Data Security & Encryption**
   - All data at rest needs to be encrypted using AWS KMS
   - This includes S3 buckets (for user documents, logs, backups)
   - RDS databases (customer data, transaction records)
   - EBS volumes (application data, temporary storage)
   - We need to use customer-managed keys, not AWS default keys

3. **Comprehensive Logging & Monitoring**
   - CloudTrail needs to capture ALL API calls across the account
   - We need to store logs in a separate, secure S3 bucket
   - We should also set up CloudWatch for operational monitoring

4. **Network Security**
   - VPC endpoints for all AWS services to keep traffic within AWS network
   - No direct internet access for private subnets
   - Multi-AZ setup for high availability
   - Proper security groups and NACLs

**Technical Requirements:**
- Use Pulumi Go to define everything as code
- Region: us-east-1
- Multi-AZ VPC setup
- Standard VPC CIDR (10.0.0.0/16)
- Consistent naming convention: `securecorp-{environment}-{resource-type}-{identifier}`
- Support for multiple environments (dev, staging, prod)

**Compliance & Best Practices:**
- Follow AWS Well-Architected Framework security pillar
- Implement defense in depth
- Ensure audit trails are comprehensive
- Make sure everything is documented and reproducible
