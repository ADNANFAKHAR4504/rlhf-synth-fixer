I need an AWS CloudFormation template in YAML to deploy a development environment in `us-east-1`. Please generate only the YAML template (no explanations).

## Requirements

### Networking
- VPC: `10.20.0.0/16`
- Public subnet: `10.20.1.0/24` for bastion host
- Two private subnets: `10.20.10.0/24` and `10.20.20.0/24` in different Availability Zones for app and database
- Internet Gateway + route table for public subnet
- NAT Gateway in public subnet with Elastic IP for private subnets outbound internet access

### Compute
- Bastion EC2 instance (`t3.micro`) in public subnet
- Parameter `KeyName` for SSH access
- Bastion Security Group allows SSH (22) only from parameter `OfficeIpCidr`

### Database
- RDS PostgreSQL (`db.t3.micro`) in private subnets
- DB subnet group across the two private subnets
- Parameters for master username and password (NoEcho)
- Security Group for DB allows PostgreSQL (5432) only from App subnet/SG

### Security Groups
- `BastionSG`: SSH from office IP
- `AppSG`: for application servers
- `DbSG`: PostgreSQL access only from `AppSG`

### Storage
- S3 bucket for shared files
- Versioning enabled
- Block public access
- Default server-side encryption

### Monitoring
- CloudWatch log groups for Bastion and RDS
- CloudWatch alarms:
  - Bastion CPU > 80%
  - RDS CPU > 80%
- SNS topic for alarms with parameterized email subscription

### Tags
- `Environment: dev` (parameterized)
- `Project: DevEnv`
- `Owner: DevTeam`
- `NumberOfDevelopers: 10` (parameter, default 10)

### Parameters & Outputs
- Parameters for AZs, office IP, snapshot behavior, etc.
- Outputs: VPC ID, Subnet IDs, Bastion public IP, RDS endpoint, S3 bucket name, Security Group IDs

### Formatting
- Must be valid CloudFormation YAML
- Use intrinsic functions (`Ref`, `Fn::GetAtt`) correctly
- Start template with:
  ```yaml
  AWSTemplateFormatVersion: '2010-09-09'