# AWS Pulumi TypeScript Security Infrastructure Requirements

## Project Information
- **Project Name**: IaC - AWS Model Breaking
- **Difficulty**: expert
- **Technology Stack**: Pulumi with TypeScript
- **Environment**: Multi-account AWS environment with production and development workloads spanning multiple regions (us-east-1 and eu-west-1)

## Environment Description
Create a secure, scalable AWS infrastructure using Pulumi and TypeScript that adheres to fundamental security best practices in a multi-account AWS environment. This task involves configuring security features across various AWS services to ensure compliance and enhance security posture using Pulumi's infrastructure-as-code approach.

The AWS environment handles multiple accounts with production and development workloads. The infrastructure spans across multiple regions including us-east-1 and eu-west-1, with VPCs implemented for network isolation and security.

## Technical Requirements

Your Pulumi TypeScript implementation should meet the following requirements:

### 1. Network Security
- **Security Groups**: Create security groups with tightly restricted rules to necessary ports only
- **Implementation**: Use `aws.ec2.SecurityGroup` and `aws.ec2.SecurityGroupRule` resources

### 2. Encryption
- **KMS Integration**: Implement AWS Key Management Service (KMS) for encryption of sensitive data
- **Implementation**: Use `aws.kms.Key` and `aws.kms.Alias` resources for encryption keys

### 3. Access Control
- **IAM Security**: Implement IAM roles and policies following the principle of least privilege
- **Implementation**: Use `aws.iam.Role`, `aws.iam.Policy`, and `aws.iam.RolePolicyAttachment` resources

### 4. HTTPS Only Access
- **Load Balancer**: Set up an Application Load Balancer (ALB) with valid SSL certificates
- **Implementation**: Use `aws.lb.LoadBalancer`, `aws.lb.Listener`, and `aws.acm.Certificate` resources

### 5. Log Retention
- **CloudWatch Logs**: Configure log retention policies for CloudWatch logs to at least 90 days
- **Implementation**: Use `aws.cloudwatch.LogGroup` with appropriate retention settings

### 6. S3 Security
- **Private Buckets**: Ensure Amazon S3 buckets are private by default with controlled access
- **Implementation**: Use `aws.s3.Bucket`, `aws.s3.BucketPolicy`, and `aws.s3.BucketPublicAccessBlock` resources

### 7. Configuration Management
- **AWS Config**: Monitor and manage configurations across AWS resources
- **Implementation**: Use `aws.cfg.ConfigurationRecorder` and `aws.cfg.DeliveryChannel` resources

### 8. Secrets Management
- **No Hardcoded Secrets**: Use Parameter Store or Secrets Manager for sensitive data
- **Implementation**: Use `aws.ssm.Parameter` and `aws.secretsmanager.Secret` resources

### 9. Database Backups
- **RDS Backups**: Setup automatic backups for RDS instances with retention policy of at least 7 days
- **Implementation**: Use `aws.rds.Instance` with backup configuration

### 10. Network Architecture
- **VPC Design**: Deploy resources in a VPC with public and private subnets
- **NAT Gateway**: Ensure NAT gateway for private subnet external access
- **Implementation**: Use `aws.ec2.Vpc`, `aws.ec2.Subnet`, `aws.ec2.NatGateway`, and routing resources

## Pulumi Project Structure

```
project/
├── index.ts                    # Main Pulumi program entry point
├── package.json               # Node.js dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── Pulumi.yaml               # Pulumi project configuration
├── Pulumi.dev.yaml           # Development stack configuration
├── Pulumi.prod.yaml          # Production stack configuration
├── README.md                 # Complete documentation
└── components/
    ├── vpc/
    │   ├── vpc.ts           # VPC component
    │   ├── subnet.ts        # Subnet components
    │   ├── natGateway.ts    # NAT Gateway component
    │   ├── internetGateway.ts # Internet Gateway component
    │   └── routeTable.ts    # Route Table components
    ├── security/
    │   ├── securityGroup.ts # Security Group components
    │   ├── iam.ts           # IAM roles and policies
    │   └── kms.ts           # KMS key components
    ├── compute/
    │   ├── ec2.ts           # EC2 instance components
    │   ├── alb.ts           # Application Load Balancer
    │   └── targetGroup.ts   # Target Group components
    ├── storage/
    │   ├── s3.ts            # S3 bucket components
    │   └── rds.ts           # RDS instance components
    ├── monitoring/
    │   ├── cloudWatch.ts    # CloudWatch components
    │   └── config.ts        # AWS Config components
    ├── secrets/
    │   ├── parameterStore.ts # Parameter Store components
    │   └── secretsManager.ts # Secrets Manager components
    └── certificates/
        └── acm.ts           # SSL Certificate components
```

## Component Architecture Requirements

### Individual Component Structure
Each component file must follow this pattern:

```typescript
// Component interface definition
export interface ComponentNameArgs {
    // Required and optional parameters
}

// Component class or function
export class ComponentName extends pulumi.ComponentResource {
    // Component implementation
}

// or

export function createComponentName(args: ComponentNameArgs): ComponentNameReturn {
    // Component implementation
}
```

### Required Individual Components

#### VPC Components (`components/vpc/`)
1. **vpc.ts** - VPC creation with proper CIDR and tagging
2. **subnet.ts** - Public and private subnet creation
3. **natGateway.ts** - NAT Gateway for private subnet internet access
4. **internetGateway.ts** - Internet Gateway for public subnet access
5. **routeTable.ts** - Route tables and associations

#### Security Components (`components/security/`)
1. **securityGroup.ts** - Security groups with restrictive rules
2. **iam.ts** - IAM roles and policies with least privilege
3. **kms.ts** - KMS keys and aliases for encryption

#### Compute Components (`components/compute/`)
1. **ec2.ts** - EC2 instances with proper security configuration
2. **alb.ts** - Application Load Balancer with HTTPS-only access
3. **targetGroup.ts** - Target groups for load balancer

#### Storage Components (`components/storage/`)
1. **s3.ts** - S3 buckets with private access and bucket policies
2. **rds.ts** - RDS instances with encryption and backup configuration

#### Monitoring Components (`components/monitoring/`)
1. **cloudWatch.ts** - CloudWatch log groups with 90-day retention
2. **config.ts** - AWS Config for resource monitoring

#### Secrets Components (`components/secrets/`)
1. **parameterStore.ts** - Parameter Store for configuration values
2. **secretsManager.ts** - Secrets Manager for sensitive data

#### Certificate Components (`components/certificates/`)
1. **acm.ts** - SSL certificates for HTTPS access

## Implementation Guidelines

### TypeScript Best Practices
- Use strong typing for all resources and configurations
- Implement proper error handling and validation
- Use async/await patterns for resource dependencies
- Create reusable components with clear interfaces

### Pulumi Component Requirements
- Each component must be a separate file with clear exports
- Use `pulumi.ComponentResource` for complex components
- Implement proper resource naming using `pulumi.interpolate`
- Use `pulumi.Output` types for resource references
- Each component must handle its own dependencies

### Security Considerations
- Use `pulumi.secret()` for sensitive outputs
- Implement proper resource tagging strategy
- Use least privilege access patterns
- Enable encryption in transit and at rest

## Code Delivery Requirements

**CRITICAL**: The implementation must provide **COMPLETE, FULL CODE** for all components. This includes:

### Required Complete Code Files:
1. **Complete `index.ts`** - Full main entry point that imports and uses all components
2. **Complete `package.json`** - All dependencies, scripts, and project configuration
3. **Complete `tsconfig.json`** - Full TypeScript configuration
4. **Complete `Pulumi.yaml`** - Complete Pulumi project configuration
5. **Complete Stack Configurations** - Full `Pulumi.dev.yaml` and `Pulumi.prod.yaml`
6. **All Component Files** - Complete implementation of every component file listed above
7. **Complete README.md** - Full deployment instructions and architecture documentation

### What is NOT Acceptable:
- Truncated code with "..." or "// ... rest of implementation"
- Placeholder comments like "// Add more resources here"
- Incomplete function implementations
- Missing imports or dependencies
- Partial file contents
- References to "similar patterns" without full code

### Code Completeness Standards:
- Every component function/class must be fully implemented
- All imports must be explicitly declared in each file
- All resources must be completely configured with all required and security-related optional parameters
- All error handling must be implemented
- All type definitions must be complete
- All configuration files must be production-ready
- Each component must be independently functional

### Validation Criteria:
The delivered code must be able to:
- Run `npm install` successfully without missing dependencies
- Pass TypeScript compilation (`tsc --noEmit`) without errors
- Execute `pulumi preview` without configuration errors
- Deploy successfully with `pulumi up` in a clean AWS account
- Each component must be importable and usable independently

## Expected Deliverables

1. **Main Pulumi Program** (`index.ts`): Complete entry point that orchestrates all components
2. **Individual Components**: Complete implementation of every component file with full functionality
3. **Configuration Files**: Complete Pulumi and TypeScript configuration files
4. **Package Configuration**: Complete `package.json` with all dependencies and scripts
5. **Documentation**: Complete README with component documentation and deployment instructions

## Validation Requirements

The Pulumi program should:
- Pass TypeScript compilation without errors
- Successfully deploy to a test AWS account using `pulumi up`
- Follow AWS naming conventions and resource tagging standards
- Implement all security requirements listed above
- Be parameterized for multi-environment deployment
- **Contain complete, untruncated code for every component**
- Each component should be modular and reusable



## Target Regions
- Primary: us-east-1
- Secondary: eu-west-1
- Multi-region deployment capability required

---

**IMPORTANT REMINDER**: This request requires COMPLETE, FULL CODE implementation with individual components. No code should be truncated, abbreviated, or left as placeholders. Every component file must be production-ready and fully functional as a standalone module.