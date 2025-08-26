I need help creating a comprehensive security-focused AWS infrastructure using CDKTF with Go. The setup needs to meet our company's strict security standards and include the following components:

1. Code Structure: I want a clean two-file setup:
   - `main.go` → Simple entrypoint that gets environment suffix from `ENVIRONMENT_SUFFIX` env var (defaults to "dev"), creates stack with format `TapStack{environmentSuffix}`, and calls app.Synth()
   - `tap-stack.go` → Contains `NewTapStack` function that returns `cdktf.TerraformStack` and implements all AWS resources

2. Backend Configuration: Configure S3 backend using environment variables:
   - `TERRAFORM_STATE_BUCKET` (default: "iac-rlhf-tf-states")
   - `TERRAFORM_STATE_BUCKET_REGION` (default: "us-east-1")
   - Key format: `{environmentSuffix}/TapStack{environmentSuffix}.tfstate`

3. Resource Naming: All resources should include the environment suffix in their names (e.g., `tap-main-vpc-{environmentSuffix}`)

4. TapStackConfig Structure:
   ```go
   type TapStackConfig struct {
       Region          *string
       Environment     *string
       Project         *string
       Owner           *string
       CostCenter      *string
       VpcCidr         *string
       AllowedIpRanges []*string
   }
   ```

5. IAM Configuration: Implement IAM roles using solely AWS Managed Policies

6. Network Infrastructure: Create a VPC with 2 public and 2 private subnets distributed across 2 availability zones in us-west-2 for high availability. Include proper routing and NAT gateways.

7. Security Groups: Configure security groups that restrict inbound and outbound traffic to specific IP ranges only. No overly permissive rules.

8. S3 Storage: Ensure that all S3 buckets are configured to be private by default with public access blocks and bucket policies that deny unencrypted uploads and insecure connections.

9. Logging Infrastructure: 
   - Enable CloudTrail with S3 and CloudWatch Logs integration
   - Set up comprehensive event selectors for S3 and management events
   - Use KMS encryption for all logs

10. RDS: Use AWS KMS to encrypt RDS instances with customer-managed keys, Multi-AZ deployment.

11. Database Security: Configure KMS encryption for RDS instances using customer-managed keys with proper key rotation policies and access controls following FIPS 140-3 Level 3 standards.

12. Resource Management: Apply consistent tagging across all resources including environment, project, owner, cost-center, ManagedBy="cdktf", and Compliance="FIPS-140-3-Level-3".

13. Comprehensive Outputs: Include Terraform outputs for all major resource IDs, ARNs, and important attributes for integration with other stacks.

The infrastructure code should be production-ready, following AWS Well-Architected Framework security principles. Use the exact import structure and coding patterns shown in my example files. All KMS keys should have proper policies, aliases, and key rotation enabled. Include comprehensive error handling and security best practices.

Please provide complete CDKTF Go code with the exact two-file structure I've shown, using `jsii.String()` for all string values and proper CDKTF patterns throughout.