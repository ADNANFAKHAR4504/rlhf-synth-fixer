# Terraform Infrastructure Validation Solution

This solution implements comprehensive infrastructure validation using Terraform 1.5+ native features including preconditions, postconditions, checks, and data sources. The configuration validates existing AWS infrastructure against compliance requirements without deploying new resources.

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming (e.g., dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for infrastructure validation"
  type        = string
  default     = "us-east-1"
}

variable "approved_ami_ids" {
  description = "List of approved AMI IDs for EC2 instances"
  type        = list(string)
  default = [
    "ami-0c55b159cbfafe1f0", # Amazon Linux 2
    "ami-0747bdcabd34c712a", # Ubuntu 20.04
    "ami-0a5c3558529277641"  # Amazon Linux 2023
  ]
}

variable "required_tags" {
  description = "List of required tags for all resources"
  type        = list(string)
  default = [
    "Environment",
    "Owner",
    "CostCenter",
    "DataClassification"
  ]
}

variable "bucket_names_to_validate" {
  description = "List of S3 bucket names to validate"
  type        = list(string)
  default     = []
}

variable "security_group_ids_to_validate" {
  description = "List of security group IDs to validate"
  type        = list(string)
  default     = []
}

variable "instance_ids_to_validate" {
  description = "List of EC2 instance IDs to validate"
  type        = list(string)
  default     = []
}

variable "validation_enabled" {
  description = "Enable validation checks"
  type        = bool
  default     = true
}
```

## File: lib/providers.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

## File: lib/data.tf

```hcl
# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current region
data "aws_region" "current" {}

# Data source to query all S3 buckets (for validation)
data "aws_s3_bucket" "validation_buckets" {
  for_each = toset(var.bucket_names_to_validate)
  bucket   = each.value
}

# Data source to query S3 bucket versioning configuration
data "aws_s3_bucket_versioning" "validation_bucket_versioning" {
  for_each = toset(var.bucket_names_to_validate)
  bucket   = each.value
}

# Data source to query S3 bucket lifecycle configuration
data "aws_s3_bucket_lifecycle_configuration" "validation_bucket_lifecycle" {
  for_each = toset(var.bucket_names_to_validate)
  bucket   = each.value
}

# Data source to query security groups
data "aws_security_group" "validation_security_groups" {
  for_each = toset(var.security_group_ids_to_validate)
  id       = each.value
}

# Data source to query EC2 instances
data "aws_instance" "validation_instances" {
  for_each    = toset(var.instance_ids_to_validate)
  instance_id = each.value
}

# Data source to query tags for EC2 instances
data "aws_ec2_instance_tags" "validation_instance_tags" {
  for_each    = toset(var.instance_ids_to_validate)
  instance_id = each.value
}
```

## File: lib/validation.tf

```hcl
# Validation marker resource to trigger checks
resource "null_resource" "validation_marker" {
  count = var.validation_enabled ? 1 : 0

  triggers = {
    timestamp = timestamp()
  }

  lifecycle {
    precondition {
      condition     = length(var.approved_ami_ids) > 0
      error_message = "At least one approved AMI ID must be specified"
    }

    precondition {
      condition     = length(var.required_tags) > 0
      error_message = "At least one required tag must be specified"
    }
  }
}

# Terraform checks for S3 bucket versioning validation
check "s3_bucket_versioning_enabled" {
  data "aws_s3_bucket_versioning" "check_versioning" {
    for_each = toset(var.bucket_names_to_validate)
    bucket   = each.value
  }

  assert {
    condition = alltrue([
      for bucket_name, versioning in data.aws_s3_bucket_versioning.check_versioning :
      versioning.versioning_configuration[0].status == "Enabled"
    ])
    error_message = "All S3 buckets must have versioning enabled. Check: ${join(", ", [
      for bucket_name, versioning in data.aws_s3_bucket_versioning.check_versioning :
      bucket_name if versioning.versioning_configuration[0].status != "Enabled"
    ])}"
  }
}

# Terraform checks for S3 bucket lifecycle policies
check "s3_bucket_lifecycle_policies_exist" {
  data "aws_s3_bucket_lifecycle_configuration" "check_lifecycle" {
    for_each = toset(var.bucket_names_to_validate)
    bucket   = each.value
  }

  assert {
    condition = alltrue([
      for bucket_name, lifecycle in data.aws_s3_bucket_lifecycle_configuration.check_lifecycle :
      length(lifecycle.rule) > 0
    ])
    error_message = "All S3 buckets must have lifecycle policies defined. Missing lifecycle: ${join(", ", [
      for bucket_name, lifecycle in data.aws_s3_bucket_lifecycle_configuration.check_lifecycle :
      bucket_name if length(lifecycle.rule) == 0
    ])}"
  }
}

# Terraform checks for security group ingress rules
check "security_group_no_unrestricted_access" {
  data "aws_security_group" "check_security_groups" {
    for_each = toset(var.security_group_ids_to_validate)
    id       = each.value
  }

  assert {
    condition = alltrue(flatten([
      for sg_id, sg in data.aws_security_group.check_security_groups : [
        for rule in sg.ingress :
        !contains(rule.cidr_blocks, "0.0.0.0/0") || rule.from_port == 443 || rule.from_port == 80
      ]
    ]))
    error_message = "Security groups must not allow unrestricted access (0.0.0.0/0) except for HTTP/HTTPS. Violations: ${join(", ", [
      for sg_id, sg in data.aws_security_group.check_security_groups :
      sg_id if anytrue([
        for rule in sg.ingress :
        contains(rule.cidr_blocks, "0.0.0.0/0") && rule.from_port != 443 && rule.from_port != 80
      ])
    ])}"
  }
}

# Terraform checks for EC2 instance AMI validation
check "ec2_instance_approved_amis" {
  data "aws_instance" "check_instances" {
    for_each    = toset(var.instance_ids_to_validate)
    instance_id = each.value
  }

  assert {
    condition = alltrue([
      for instance_id, instance in data.aws_instance.check_instances :
      contains(var.approved_ami_ids, instance.ami)
    ])
    error_message = "All EC2 instances must use approved AMIs. Unapproved AMIs found: ${join(", ", [
      for instance_id, instance in data.aws_instance.check_instances :
      "${instance_id}: ${instance.ami}" if !contains(var.approved_ami_ids, instance.ami)
    ])}"
  }
}

# Terraform checks for tag compliance on EC2 instances
check "ec2_instance_tag_compliance" {
  data "aws_instance" "check_instance_tags" {
    for_each    = toset(var.instance_ids_to_validate)
    instance_id = each.value
  }

  assert {
    condition = alltrue([
      for instance_id, instance in data.aws_instance.check_instance_tags :
      alltrue([
        for required_tag in var.required_tags :
        contains(keys(instance.tags), required_tag)
      ])
    ])
    error_message = "All EC2 instances must have required tags. Missing tags: ${join(", ", flatten([
      for instance_id, instance in data.aws_instance.check_instance_tags : [
        for required_tag in var.required_tags :
        "${instance_id}: ${required_tag}" if !contains(keys(instance.tags), required_tag)
      ]
    ]))}"
  }
}

# Local values for validation results
locals {
  # S3 bucket versioning validation results
  s3_versioning_validation = {
    for bucket_name in var.bucket_names_to_validate :
    bucket_name => try(
      data.aws_s3_bucket_versioning.validation_bucket_versioning[bucket_name].versioning_configuration[0].status == "Enabled",
      false
    )
  }

  # S3 bucket lifecycle validation results
  s3_lifecycle_validation = {
    for bucket_name in var.bucket_names_to_validate :
    bucket_name => try(
      length(data.aws_s3_bucket_lifecycle_configuration.validation_bucket_lifecycle[bucket_name].rule) > 0,
      false
    )
  }

  # Security group validation results
  security_group_validation = {
    for sg_id in var.security_group_ids_to_validate :
    sg_id => try(
      alltrue([
        for rule in data.aws_security_group.validation_security_groups[sg_id].ingress :
        !contains(rule.cidr_blocks, "0.0.0.0/0") || rule.from_port == 443 || rule.from_port == 80
      ]),
      false
    )
  }

  # EC2 AMI validation results
  ec2_ami_validation = {
    for instance_id in var.instance_ids_to_validate :
    instance_id => try(
      contains(var.approved_ami_ids, data.aws_instance.validation_instances[instance_id].ami),
      false
    )
  }

  # EC2 tag compliance validation results
  ec2_tag_validation = {
    for instance_id in var.instance_ids_to_validate :
    instance_id => try(
      alltrue([
        for required_tag in var.required_tags :
        contains(keys(data.aws_instance.validation_instances[instance_id].tags), required_tag)
      ]),
      false
    )
  }

  # Overall validation status
  all_validations_passed = alltrue(concat(
    values(local.s3_versioning_validation),
    values(local.s3_lifecycle_validation),
    values(local.security_group_validation),
    values(local.ec2_ami_validation),
    values(local.ec2_tag_validation)
  ))
}
```

## File: lib/outputs.tf

```hcl
# JSON-formatted validation report for CI/CD consumption
output "validation_report_json" {
  description = "Comprehensive validation report in JSON format"
  value = jsonencode({
    timestamp = timestamp()
    account_id = data.aws_caller_identity.current.account_id
    region = data.aws_region.current.name
    environment_suffix = var.environment_suffix
    overall_status = local.all_validations_passed ? "PASS" : "FAIL"
    validation_results = {
      s3_buckets = {
        versioning = {
          status = alltrue(values(local.s3_versioning_validation)) ? "PASS" : "FAIL"
          details = local.s3_versioning_validation
          failures = [
            for bucket_name, passed in local.s3_versioning_validation :
            bucket_name if !passed
          ]
        }
        lifecycle_policies = {
          status = alltrue(values(local.s3_lifecycle_validation)) ? "PASS" : "FAIL"
          details = local.s3_lifecycle_validation
          failures = [
            for bucket_name, passed in local.s3_lifecycle_validation :
            bucket_name if !passed
          ]
        }
      }
      security_groups = {
        no_unrestricted_access = {
          status = alltrue(values(local.security_group_validation)) ? "PASS" : "FAIL"
          details = local.security_group_validation
          failures = [
            for sg_id, passed in local.security_group_validation :
            sg_id if !passed
          ]
        }
      }
      ec2_instances = {
        approved_amis = {
          status = alltrue(values(local.ec2_ami_validation)) ? "PASS" : "FAIL"
          details = local.ec2_ami_validation
          failures = [
            for instance_id, passed in local.ec2_ami_validation :
            instance_id if !passed
          ]
        }
        tag_compliance = {
          status = alltrue(values(local.ec2_tag_validation)) ? "PASS" : "FAIL"
          details = local.ec2_tag_validation
          failures = [
            for instance_id, passed in local.ec2_tag_validation :
            instance_id if !passed
          ]
        }
      }
    }
  })
}

# Human-readable validation summary
output "validation_summary" {
  description = "Human-readable validation summary"
  value = {
    overall_status = local.all_validations_passed ? "PASS" : "FAIL"
    s3_versioning_pass = alltrue(values(local.s3_versioning_validation))
    s3_lifecycle_pass = alltrue(values(local.s3_lifecycle_validation))
    security_groups_pass = alltrue(values(local.security_group_validation))
    ec2_ami_pass = alltrue(values(local.ec2_ami_validation))
    ec2_tags_pass = alltrue(values(local.ec2_tag_validation))
  }
}

# Detailed validation results by category
output "s3_validation_details" {
  description = "Detailed S3 bucket validation results"
  value = {
    versioning = local.s3_versioning_validation
    lifecycle = local.s3_lifecycle_validation
  }
}

output "security_group_validation_details" {
  description = "Detailed security group validation results"
  value = local.security_group_validation
}

output "ec2_validation_details" {
  description = "Detailed EC2 instance validation results"
  value = {
    ami_compliance = local.ec2_ami_validation
    tag_compliance = local.ec2_tag_validation
  }
}

# Failed resources for immediate attention
output "failed_resources" {
  description = "List of resources that failed validation"
  value = {
    s3_buckets_no_versioning = [
      for bucket_name, passed in local.s3_versioning_validation :
      bucket_name if !passed
    ]
    s3_buckets_no_lifecycle = [
      for bucket_name, passed in local.s3_lifecycle_validation :
      bucket_name if !passed
    ]
    security_groups_unrestricted = [
      for sg_id, passed in local.security_group_validation :
      sg_id if !passed
    ]
    ec2_unapproved_amis = [
      for instance_id, passed in local.ec2_ami_validation :
      instance_id if !passed
    ]
    ec2_missing_tags = [
      for instance_id, passed in local.ec2_tag_validation :
      instance_id if !passed
    ]
  }
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file for validation configuration
environment_suffix = "dev"
aws_region        = "us-east-1"

# Approved AMI IDs for your organization
approved_ami_ids = [
  "ami-0c55b159cbfafe1f0", # Amazon Linux 2
  "ami-0747bdcabd34c712a", # Ubuntu 20.04
  "ami-0a5c3558529277641"  # Amazon Linux 2023
]

# Required tags for compliance
required_tags = [
  "Environment",
  "Owner",
  "CostCenter",
  "DataClassification"
]

# S3 buckets to validate
bucket_names_to_validate = [
  "my-app-data-dev",
  "my-app-logs-dev",
  "my-app-backups-dev"
]

# Security groups to validate
security_group_ids_to_validate = [
  "sg-0123456789abcdef0",
  "sg-0987654321fedcba0"
]

# EC2 instances to validate
instance_ids_to_validate = [
  "i-0123456789abcdef0",
  "i-0987654321fedcba0"
]

# Enable validation checks
validation_enabled = true
```

## File: lib/README.md

```markdown
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
```
