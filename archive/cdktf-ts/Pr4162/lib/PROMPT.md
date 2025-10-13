Create a CDKTF TypeScript project that securely deploys AWS infrastructure with configurable environments.

### Requirements
- **Environment Support**: Single stack with configurable environment suffix (dev, staging, production)
- **State Management**: S3 backend with environment-specific state files and encryption
- **AWS Resources**:
  - Custom VPC with public subnet and internet gateway (more reliable than default VPC)
  - S3 bucket with versioning, encryption, and public access blocking
  - Security Group allowing only HTTPS traffic (port 443)
  - IAM role with least privilege policies scoped to specific resources
- **Security**: All resources follow security best practices with proper encryption and access controls
- **Naming/Tags**: Environment-specific resource naming and comprehensive tagging strategy
- **Modularity**: Reusable modules for each AWS service with type-safe configuration interfaces

### File Structure
- `lib/modules.ts` → Reusable modules for VPC, S3, Security Groups, and IAM
- `lib/tap-stack.ts` → Main stack orchestrating AWS provider and module instantiation
- `bin/tap.ts` → Application entry point with CDKTF App initialization

### Key Features
- **Dynamic Configuration**: Environment suffix passed through props interface
- **Security Best Practices**: Conditional IAM policies, encrypted state, secure S3 configuration
- **Infrastructure as Code**: Full AWS infrastructure defined in TypeScript with CDKTF
- **Testing**: Comprehensive unit and integration tests for all components

### Output
- Valid **CDKTF TypeScript** project
- Deployable with `cdktf deploy`
- Secure, modular, and production-ready infrastructure
- Comprehensive test coverage and documentation