# Jumphost Configuration for Terraform

This guide explains how to configure Terraform to work with a jumphost server for AWS access.

## Option 1: Local Development (Current Setup)

The current configuration uses local backend, suitable for development through jumphost:

```bash
cd lib/
terraform init
terraform plan
terraform apply
```

## Option 2: SSH Tunnel to AWS API

If your jumphost has AWS CLI configured, you can use SSH port forwarding:

```bash
# Create SSH tunnel (run this in a separate terminal)
ssh -L 8080:aws-api-endpoint:443 user@jumphost-ip

# Set environment variables to use tunnel
export AWS_ENDPOINT_URL=http://localhost:8080
```

## Option 3: Assume Role Configuration

If you have cross-account access configured:

1. Uncomment the assume_role blocks in `provider.tf`
2. Replace `ACCOUNT-ID` with your target AWS account ID
3. Configure the role ARN that your jumphost can assume

```hcl
assume_role {
  role_arn     = "arn:aws:iam::123456789012:role/TerraformRole"
  session_name = "terraform-session"
}
```

## Option 4: Environment Variables

Set these on your jumphost or local machine:

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_SESSION_TOKEN="your-session-token"  # if using temporary credentials
export AWS_DEFAULT_REGION="us-east-1"
```

## Option 5: AWS Profile

If your jumphost has AWS profiles configured:

```bash
# Use specific profile
export AWS_PROFILE=your-profile-name

# Or specify in terraform command
terraform plan -var-file="terraform.tfvars"
```

## Security Best Practices

1. Use temporary credentials when possible
2. Implement least privilege access
3. Use assume role for cross-account access
4. Regularly rotate access keys
5. Monitor CloudTrail for access patterns

## Testing Connectivity

Test AWS connectivity from your jumphost:

```bash
aws sts get-caller-identity
aws ec2 describe-regions
```

## Current Configuration Status

- Backend: Local (suitable for jumphost development)
- Providers: Multi-region (us-east-1, us-west-2)
- Resources: VPC, Subnets, RDS, EC2 across 3 environments
- State: Stored locally (can be moved to S3 later)
