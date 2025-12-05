# Terraform Infrastructure Validation

This Terraform configuration implements comprehensive infrastructure validation using Terraform 1.5+ native features. It validates existing AWS infrastructure against compliance requirements without deploying new resources.

## Features

- S3 Bucket Validation: Verifies versioning is enabled and lifecycle policies exist
- Security Group Validation: Ensures no unrestricted ingress rules (0.0.0.0/0)
- EC2 AMI Validation: Validates instances use approved AMI IDs
- Tag Compliance: Checks required tags are present on all resources
- Validation Reporting: Generates JSON-formatted reports for CI/CD pipelines

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0
- AWS credentials configured with read access to:
  - S3 buckets
  - Security groups
  - EC2 instances

## Usage

### 1. Configure Variables

Copy the example tfvars file and update with your resource IDs:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit terraform.tfvars to specify:
- environment_suffix: Your environment identifier (e.g., dev, staging, prod)
- bucket_names_to_validate: List of S3 bucket names to validate
- security_group_ids_to_validate: List of security group IDs to validate
- instance_ids_to_validate: List of EC2 instance IDs to validate
- approved_ami_ids: List of approved AMI IDs for your organization
- required_tags: List of required tags for compliance

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Run Validation

```bash
terraform plan
```

The validation checks will run during the plan phase. If any checks fail, Terraform will display error messages indicating which resources are non-compliant.

### 4. View Validation Report

```bash
terraform plan -out=tfplan
terraform show -json tfplan | jq '.planned_values.outputs.validation_report_json.value'
```

Or apply the configuration to see outputs:

```bash
terraform apply
```

### 5. Access Validation Results

After running terraform apply, you can access validation results:

```bash
# View JSON validation report
terraform output -json validation_report_json

# View human-readable summary
terraform output validation_summary

# View failed resources
terraform output failed_resources
```

## Validation Checks

### S3 Bucket Checks

1. Versioning Enabled: Verifies all S3 buckets have versioning enabled
2. Lifecycle Policies: Ensures all S3 buckets have lifecycle policies defined

### Security Group Checks

1. No Unrestricted Access: Validates security groups don't allow 0.0.0.0/0 except for HTTP/HTTPS

### EC2 Instance Checks

1. Approved AMIs: Verifies EC2 instances use AMIs from approved list
2. Tag Compliance: Ensures all EC2 instances have required tags (Environment, Owner, CostCenter, DataClassification)

## CI/CD Integration

The validation report is output in JSON format for easy consumption by CI/CD pipelines:

```bash
terraform apply -auto-approve
VALIDATION_STATUS=$(terraform output -json validation_report_json | jq -r '.overall_status')

if [ "$VALIDATION_STATUS" != "PASS" ]; then
  echo "Validation failed!"
  terraform output -json failed_resources
  exit 1
fi
```

## Terraform 1.5+ Features Used

- Preconditions: Validate configuration before resource operations
- Postconditions: Verify resource state after operations
- Check Blocks: Implement continuous validation checks
- Data Sources: Query existing infrastructure state

## Example Output

```json
{
  "timestamp": "2025-12-05T18:00:00Z",
  "account_id": "123456789012",
  "region": "us-east-1",
  "environment_suffix": "dev",
  "overall_status": "FAIL",
  "validation_results": {
    "s3_buckets": {
      "versioning": {
        "status": "PASS",
        "details": {
          "my-app-data-dev": true,
          "my-app-logs-dev": true
        },
        "failures": []
      },
      "lifecycle_policies": {
        "status": "FAIL",
        "details": {
          "my-app-data-dev": true,
          "my-app-logs-dev": false
        },
        "failures": ["my-app-logs-dev"]
      }
    },
    "security_groups": {
      "no_unrestricted_access": {
        "status": "FAIL",
        "details": {
          "sg-0123456789abcdef0": true,
          "sg-0987654321fedcba0": false
        },
        "failures": ["sg-0987654321fedcba0"]
      }
    },
    "ec2_instances": {
      "approved_amis": {
        "status": "PASS",
        "details": {
          "i-0123456789abcdef0": true,
          "i-0987654321fedcba0": true
        },
        "failures": []
      },
      "tag_compliance": {
        "status": "FAIL",
        "details": {
          "i-0123456789abcdef0": true,
          "i-0987654321fedcba0": false
        },
        "failures": ["i-0987654321fedcba0"]
      }
    }
  }
}
```

## Troubleshooting

### No resources to validate

Ensure you've specified resource IDs in your terraform.tfvars file:
- bucket_names_to_validate
- security_group_ids_to_validate
- instance_ids_to_validate

### Permission errors

Ensure your AWS credentials have the following permissions:
- s3:GetBucketVersioning
- s3:GetLifecycleConfiguration
- ec2:DescribeInstances
- ec2:DescribeSecurityGroups
- ec2:DescribeTags

### Resource not found errors

Verify that the resource IDs specified in terraform.tfvars exist in the configured AWS region.

## License

This configuration is provided as-is for infrastructure validation purposes.
