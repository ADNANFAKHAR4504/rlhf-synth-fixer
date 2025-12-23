# Infrastructure Deployment Failures - Payment Platform

## Fix #1: Transit Gateway Attachment Subnet Duplication

**Category:** A - Significant

**Description:**
The model attempted to attach multiple subnets (Application and Database tiers) from the same Availability Zone to a Transit Gateway attachment. AWS Transit Gateway attachments support only one subnet per Availability Zone.

**Root Cause:**
Misunderstanding of AWS Transit Gateway networking constraints. The model treated the attachment as a comprehensive list of all subnets needing connectivity, rather than the required "one ENI per AZ" interface configuration.

**Impact:**
- **Security:** N/A
- **Cost:** N/A
- **Operational:** Blocking. The Terraform apply operation fails immediately with `DuplicateSubnetsInSameZone`.
- **Compliance:** N/A

**Original Code (Incorrect):**
```
resource "aws_ec2_transit_gateway_vpc_attachment" "tgw_attachment_prod" {
  subnet_ids         = [
    aws_subnet.subnet_private_app_1_prod.id,
    aws_subnet.subnet_private_app_2_prod.id,
    aws_subnet.subnet_private_db_1_prod.id
  ]
  transit_gateway_id = aws_ec2_transit_gateway.tgw_corporate_prod.id
  vpc_id             = aws_vpc.vpc_payment_prod.id
  # ...
}
```

**Corrected Code:**
```
resource "aws_ec2_transit_gateway_vpc_attachment" "tgw_attachment_prod" {
  subnet_ids         = [
    aws_subnet.subnet_private_app_1_prod.id,
    aws_subnet.subnet_private_app_2_prod.id
    # Removed database subnet to ensure one subnet per AZ
  ]
  transit_gateway_id = aws_ec2_transit_gateway.tgw_corporate_prod.id
  vpc_id             = aws_vpc.vpc_payment_prod.id
  # ...
}
```

**Changes Made:**
- Removed `aws_subnet.subnet_private_db_1_prod.id` from the `subnet_ids` list.
- Ensured only one subnet per Availability Zone is referenced.

**Prevention Strategy:**
- Document AWS networking limits specifically regarding Transit Gateway attachments in internal wikis.
- Implement pre-commit validation hooks that check for duplicate AZs in `aws_ec2_transit_gateway_vpc_attachment` resource lists.

## Fix #2: Malformed S3 Bucket Policy Condition Key

**Category:** A - Significant

**Description:**
The model used an incorrect condition key `s3:x-acl` in the S3 bucket policy for VPC Flow Logs delivery. The correct AWS condition key for verifying the Access Control List header is `s3:x-amz-acl`.

**Root Cause:**
Syntax error regarding AWS IAM condition keys. The model hallucinated a simplified version of the key (`x-acl`) instead of the canonical AWS header format (`x-amz-acl`).

**Impact:**
- **Security:** Critical. The policy condition prevents valid log delivery requests from the VPC Flow Logs service, effectively disabling network monitoring.
- **Cost:** N/A
- **Operational:** Blocking. Terraform fails to apply the policy with `MalformedPolicy`.
- **Compliance:** High. Failure to enable Flow Logs violates the monitoring requirements of PCI DSS.

**Original Code (Incorrect):**
```
Condition = {
  StringEquals = {
    "s3:x-acl" = "bucket-owner-full-control"
    "aws:SourceAccount" = data.aws_caller_identity.current.account_id
  }
}
```

**Corrected Code:**
```
Condition = {
  StringEquals = {
    "s3:x-amz-acl" = "bucket-owner-full-control"
    "aws:SourceAccount" = data.aws_caller_identity.current.account_id
  }
}
```

**Changes Made:**
- Changed condition key from `s3:x-acl` to `s3:x-amz-acl`.

**Prevention Strategy:**
- Use Terraform IAM policy data sources (`aws_iam_policy_document`) which validate some condition keys, rather than raw JSON strings.
- maintain a snippet library of verified "Service to S3" bucket policies.

## Fix #3: NAT Instance AMI Selection Strategy

**Category:** B - Moderate

**Description:**
The model attempted to use the deprecated `amzn-ami-vpc-nat-*` naming pattern to find a NAT AMI. These AMIs are no longer available in many regions or are deprecated.

**Root Cause:**
Outdated training data regarding AWS managed NAT AMIs. The correct modern approach is to use standard Amazon Linux 2 or 2023 and configure NAT functionality via user data.

**Impact:**
- **Security:** N/A
- **Cost:** N/A
- **Operational:** Blocking. Terraform fails to find a matching AMI, halting deployment.
- **Compliance:** N/A

**Original Code (Incorrect):**
```
data "aws_ami" "nat" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn-ami-vpc-nat-*"]
  }
  # ...
}
```

**Corrected Code:**
```
data "aws_ami" "nat" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-kernel-5.10-hvm-*-x86_64-gp2"]
  }
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
  # ...
}
```

**Changes Made:**
- Updated AMI filter to target Amazon Linux 2.
- Added user data script (in the instance resource) to enable IP forwarding and iptables masquerading.

**Prevention Strategy:**
- Standardize on a specific OS version (AL2 or AL2023) for utility instances.
- Prefer `aws_nat_gateway` managed service where possible, or maintain a custom baked AMI for NAT instances if required.

## Fix #4: VPC Flow Logs Terraform Provider Compatibility

**Category:** C - Minor

**Description:**
The model used the argument `log_destination_arn` for the `aws_flow_log` resource. In the AWS Terraform Provider v5.x, this argument was renamed to `log_destination`.

**Root Cause:**
Provider version incompatibility. The code was written using Provider v4.x syntax while the configuration specified Provider v5.x constraints.

**Impact:**
- **Security:** N/A
- **Cost:** N/A
- **Operational:** Blocking. Terraform validation error.
- **Compliance:** N/A

**Original Code (Incorrect):**
```
resource "aws_flow_log" "vpc_flow_logs_prod" {
  log_destination_type = "s3"
  log_destination_arn  = aws_s3_bucket.s3_vpc_flow_logs_prod.arn
  # ...
}
```

**Corrected Code:**
```
resource "aws_flow_log" "vpc_flow_logs_prod" {
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.s3_vpc_flow_logs_prod.arn
  # ...
}
```

**Changes Made:**
- Renamed argument `log_destination_arn` to `log_destination`.

**Prevention Strategy:**
- Use `terraform validate` in CI pipelines.
- Regularly review HashiCorp Terraform AWS Provider changelogs when upgrading major versions.

## Fix #5: Invalid IAM Role Configuration for S3 Flow Logs

**Category:** C - Minor

**Description:**
The model provided an `iam_role_arn` for a VPC Flow Log resource configured with `log_destination_type = "s3"`. IAM roles are only required and valid when sending logs to CloudWatch Logs.

**Root Cause:**
Configuration conflict. The model mixed requirements for CloudWatch Logs (needs IAM) with requirements for S3 (needs Bucket Policy) in a single resource block.

**Impact:**
- **Security:** N/A
- **Cost:** N/A
- **Operational:** Blocking. The API returns `InvalidParameter`.
- **Compliance:** N/A

**Original Code (Incorrect):**
```
resource "aws_flow_log" "vpc_flow_logs_prod" {
  iam_role_arn         = aws_iam_role.iam_role_flow_logs_prod.arn
  log_destination_type = "s3"
  # ...
}
```

**Corrected Code:**
```
resource "aws_flow_log" "vpc_flow_logs_prod" {
  # iam_role_arn removed
  log_destination_type = "s3"
  # ...
}
```

**Changes Made:**
- Removed `iam_role_arn` argument.
- Removed dependency on `aws_iam_role.iam_role_flow_logs_prod` in the `depends_on` block.

**Prevention Strategy:**
- Use conditional logic in modules to strictly separate CloudWatch vs S3 configuration parameters.
- Implement TFLint rules to catch conflicting arguments for `aws_flow_log`.
```