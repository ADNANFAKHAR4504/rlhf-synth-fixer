I need help creating a comprehensive security-focused AWS infrastructure using CDKTF with Go.
## Code Structure
- `main.go`: Read `ENVIRONMENT_SUFFIX` (default `"dev"`), create `TapStack{suffix}`, call `app.Synth()`.
- `tap-stack.go`: Implement `NewTapStack` returning `cdktf.TerraformStack`.

## Backend
- S3 backend via env vars:
  - `TERRAFORM_STATE_BUCKET` (default: `iac-rlhf-tf-states`)
  - `TERRAFORM_STATE_BUCKET_REGION` (default: `us-east-1`)
  - Key: `{envSuffix}/TapStack{envSuffix}.tfstate`

## Config Struct
```go
type TapStackConfig struct {
    Region, Environment, Project, Owner, CostCenter, VpcCidr *string
    AllowedIpRanges []*string
}
````

## Requirements

1. **VPC**: CIDR `10.0.0.0/16`, region `us-west-2`, 2 public subnets (different AZs).
2. **Internet Access**: Internet Gateway + route tables for public subnets.
3. **NACLs**: Allow HTTP (80), HTTPS (443).
4. **EC2**: 2 instances (`t2.micro`), Amazon Linux 2 AMI (data source), one per subnet.

   * Key pair (variable), Elastic IPs, detailed monitoring.
5. **Security Group**: Allow SSH (22) from `AllowedIpRanges`, HTTP/HTTPS.
6. **Tags**: All resources → `Environment=Development`, plus Project, Owner, CostCenter, ManagedBy="cdktf".
7. **Naming**: `dev-resourcetype-name` pattern.
8. **Outputs**: VPC, subnets, IGW, route tables, NACLs, EC2 IDs/Private+Public IPs, SG IDs, EIP IDs.
9. **Best Practices**: Use variables for AMI, instance type, key name; follow CDKTF + Go idioms.

## Deliverable

* Full `main.go` + `tap-stack.go` with jsii.String() usage, production-ready, synthesize without errors.