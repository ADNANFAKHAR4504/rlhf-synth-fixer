# Ideal Terraform HCL Response

The ideal response should provide a complete, production-ready Terraform HCL infrastructure setup with the following characteristics:

## Expected Structure

```
lib/
├── modules/
│   └── vpc/
│       ├── main.tf       # VPC, subnets, security groups
│       ├── variables.tf  # Input variables with descriptions
│       └── outputs.tf    # All necessary outputs
bin/
├── main.tf              # Root configuration with providers
├── variables.tf         # Root variables
├── outputs.tf           # Root outputs
├── terraform.tfvars     # Variable values
└── backend.conf         # S3 backend configuration
```

## Expected Outputs

### VPC Module Outputs
- `vpc_id`: The VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs  
- `web_security_group_id`: Web tier security group ID
- `db_security_group_id`: Database tier security group ID
- `availability_zones`: List of AZs used

### Infrastructure Created
- 1 VPC with DNS hostnames and resolution enabled
- 2 public subnets with internet gateway route
- 2 private subnets for database tier
- 1 internet gateway attached to VPC
- 1 route table for public subnets
- 2 security groups (web and database tiers)

## Expected Behaviors

### Security Configuration
- Web security group allows inbound HTTP (80) from 0.0.0.0/0
- Database security group allows inbound MySQL (3306) from web SG only
- Both security groups have restricted egress (not 0.0.0.0/0 on all ports)
- Security groups properly reference each other

### High Availability
- Subnets distributed across multiple availability zones
- Proper subnet CIDR allocation within VPC range

### Code Quality
- All resources properly tagged with environment
- Variables have descriptions and appropriate types
- Validation rules where applicable
- Clean, readable HCL syntax
- Modular design for reusability

### State Management
- S3 backend configured with encryption
- DynamoDB table for state locking
- Versioning enabled on state bucket
- Proper backend configuration file

## Success Criteria

1. **terraform init** completes successfully with remote backend
2. **terraform plan** shows expected resources to be created
3. **terraform apply** provisions infrastructure without errors
4. All outputs return expected values
5. Resources are properly tagged and named
6. Security groups have appropriate rules
7. Subnets are correctly associated with route tables
8. Infrastructure can be destroyed cleanly with **terraform destroy**

## Non-Functional Requirements

- Code follows Terraform best practices
- Resources are cost-optimized (using t3.micro/small instances)
- Security follows principle of least privilege
- Infrastructure is repeatable and version-controlled
- State is properly managed and locked