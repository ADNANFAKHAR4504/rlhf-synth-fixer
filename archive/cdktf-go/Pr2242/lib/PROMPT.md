You are a Senior Cloud Engineer with expertise in AWS and **CDKTF using Go**.  

Design and implement a secure-by-default infrastructure using **AWS CDK for Terraform (Go bindings)**.  
The environment spans across two AWS regions: **us-east-1** and **us-west-2**.  
All resources must be declared in a **single Go file** (`main.go`) following the template below.  
Resource names should be logically scoped to their respective regions.  

---

## Requirements
1. Create a VPC with public and private subnets in both regions.  
2. Deploy an Internet-facing Load Balancer with a web server fleet managed by an Auto Scaling group.  
3. Implement security controls including VPC Security Groups and IAM Roles.  
4. Provision an RDS instance with encryption at rest (using AWS KMS) and backup enabled.  
5. Enable CloudWatch for logs and monitoring.  
6. Create an S3 bucket for static content with restricted access, ensuring **KMS encryption** is enabled.  
7. Implement AWS Config to monitor and report compliance issues.  
8. Configure Security Groups for web servers to allow only HTTP and HTTPS traffic, denying all other inbound traffic.  
9. Apply least-privilege IAM Roles that allow access only to specific S3 buckets.  
10. Restrict SSH access to EC2 instances to a specified IP range.  
11. Ensure all EC2 instance logs are sent to CloudWatch Logs.  
12. Enforce MFA for all IAM users.  
13. Mandate HTTPS-only access for API Gateway endpoints.  

---

## Constraints
- Use **CDKTF with Go**.  
- All code must be inside a **single Go file** (`main.go`) that follows the template below.  
- Ensure all security configurations align with AWS best practices.  
- Infrastructure must synthesize and plan correctly via:  

### Go template
```
package main

import (
	"fmt"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// Minimal CDKTF app entrypoint.
// We avoid committing go.mod; CI initializes it and runs `go mod tidy`.

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Get environment suffix from environment variable
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114" // Default for this PR
	}

	// Get state bucket configuration from environment variables
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states" // Default state bucket
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1" // Default region for state bucket
	}

	// Configure S3 backend for remote state
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket: jsii.String(stateBucket),
		Key:    jsii.String(fmt.Sprintf("%s/TapStack%s.tfstate", environmentSuffix, environmentSuffix)),
		Region: jsii.String(stateBucketRegion),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "TapStack")
	app.Synth()
}
```