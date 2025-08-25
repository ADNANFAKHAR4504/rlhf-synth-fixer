# Trainr360 Infrastructure - Pulumi Go Implementation

## Project Overview
This project implements AWS cloud infrastructure for task trainr360 using Pulumi with Go.

### Task Details
- **Task ID**: trainr360
- **Difficulty**: Medium
- **Platform**: Pulumi
- **Language**: Go
- **Category**: Cloud Environment Setup
- **Region**: us-east-1

## Infrastructure Components

### Network Architecture
1. **VPC**: 10.0.0.0/16 CIDR block
2. **Public Subnets**: 
   - 10.0.1.0/24 (AZ 1)
   - 10.0.2.0/24 (AZ 2)
3. **Private Subnets**:
   - 10.0.10.0/24 (AZ 1)
   - 10.0.11.0/24 (AZ 2)
4. **Internet Gateway**: For public subnet internet access
5. **Route Tables**: Separate for public and private subnets

### Resource Naming Convention
All resources use the prefix `iac-task` for consistent identification.

## Project Structure
```
.
├── Pulumi.yaml           # Pulumi project configuration
├── Pulumi.dev.yaml       # Stack-specific configuration
├── main.go               # Main infrastructure code
├── go.mod                # Go module dependencies
├── go.sum                # Go module checksums
├── config.yaml           # Infrastructure configuration values
├── metadata.json         # Task metadata and requirements
└── PROJECT_README.md     # This file
```

## Requirements Met
✅ AWS resources in us-east-1 region
✅ VPC with 10.0.0.0/16 CIDR block
✅ Two public subnets across different AZs
✅ Two private subnets across different AZs
✅ Internet Gateway attached to VPC
✅ Route tables for public subnets
✅ Resource prefix "iac-task" for all resources
✅ Configuration-driven (no hardcoded values)

## Deployment Instructions

### Prerequisites
- Pulumi CLI installed
- Go 1.21+ installed
- AWS credentials configured
- Set environment variable: `export PULUMI_CONFIG_PASSPHRASE="your-passphrase"`

### Deploy Infrastructure
```bash
# Install dependencies
go mod download

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Destroy Infrastructure
```bash
pulumi destroy
```

## Testing
The infrastructure can be validated by checking:
1. VPC created with correct CIDR block (10.0.0.0/16)
2. Two public subnets in different availability zones
3. Two private subnets in different availability zones
4. Internet Gateway properly attached to VPC
5. Route tables configured for public subnet internet access
6. All resources tagged with "iac-task" prefix

## Next Phase
This project is ready for Phase 2 - Code Generation, where the actual Pulumi Go code will be implemented in `main.go` to create all the specified AWS resources.