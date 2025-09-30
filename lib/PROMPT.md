You are an expert Terraform + AWS infrastructure engineer. Generate a reusable Terraform module (no monolithic root config) that provisions:

1. Networking:
   - One VPC (CIDR parameterized)
   - Public subnets (for NAT gateways) and private subnets (for RDS + app tier)
   - Internet Gateway
   - One NAT Gateway (optionally parameterize single vs per-AZ)
   - Route tables so:
     - Public subnets have route to IGW
     - Private subnets route 0.0.0.0/0 via NAT
2. Security Groups:
   - rds_sg: Allows MySQL (3306) only from an app tier SG (app_sg)
   - app_sg: Egress 0.0.0.0/0, no inbound (placeholder for future rules)
3. RDS MySQL:
   - Deployed only in private subnets
   - Parameterize: instance_class, allocated_storage, engine_version, backup_retention, multi_az (bool), storage_type, max_allocated_storage (optional), performance_insights_enabled (bool)
   - Storage encrypted at rest (KMS key optional input; if not provided use default)
   - Deletion protection toggle
   - Apply final_snapshot_identifier on destroy if snapshot_final = true
   - Username, password provided via variables (password marked sensitive)
   - Publicly accessible = false
4. Outputs:
   - rds_endpoint
   - rds_port
   - vpc_id
   - private_subnet_ids
   - public_subnet_ids
   - rds_security_group_id
   - app_security_group_id
5. Variables file with clear descriptions, sensible defaults
6. README with:
   - Module purpose
   - Inputs / Outputs table
   - Example usage block
   - Notes on encryption + networking assumptions

Style & Structure:

- Use Terraform >= 1.5 syntax
- Separate files: variables.tf, outputs.tf, main.tf, versions.tf, README.md
- Tag all taggable resources with a var.tags map merged with module-required tags (Name, Environment)
- Keep resource naming consistent: <prefix>-<purpose> from var.name_prefix
- Avoid hard-coded AZ count; infer from length of private_subnet_cidrs / public_subnet_cidrs
- Validate engine_version format (e.g. ^[0-9]+\.[0-9]+(\.[0-9]+)?$)
