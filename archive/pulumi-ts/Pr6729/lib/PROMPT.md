# Prompt: Generate Pulumi TypeScript for VPC Peering with Security Controls

You are an expert Pulumi TypeScript engineer. Produce production-ready Pulumi TypeScript code that establishes secure VPC peering between payment and audit VPCs with comprehensive security controls, monitoring, and automated route configuration.

## Background

A financial services company operates multiple AWS accounts for different business units. They need to establish secure network connectivity between their payment processing VPC and audit logging VPC while maintaining strict network isolation and compliance requirements.

## Environment Context

Multi-account AWS infrastructure deployed across us-east-1 (primary) and us-east-1 (DR) regions. Two existing VPCs:
- payment-vpc (10.100.0.0/16) in production account
- audit-vpc (10.200.0.0/16) in security account

Requires Pulumi 3.x with TypeScript SDK, AWS CLI configured with cross-account assume role permissions. Both VPCs have multiple private subnets across 3 availability zones with existing EC2 instances running critical workloads. Route 53 private hosted zones are configured in each VPC for internal DNS resolution.

## Deliverables

Create a complete Pulumi TypeScript project with the following structure:

```
.
├── index.ts                 # Main Pulumi program
├── Pulumi.yaml             # Project configuration
├── Pulumi.dev.yaml         # Stack configuration for dev
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## Required Components

### 1. VPC Peering Connection
- Create VPC peering connection between payment-vpc and audit-vpc
- Enable auto-accept for the peering connection
- Configure DNS resolution options for cross-VPC name resolution
- Support both same-region and cross-region peering for DR scenarios

### 2. Route Table Configuration
- Automatically update route tables in both VPCs
- Add routes for bidirectional traffic through the peering connection
- Route traffic from payment-vpc (10.100.0.0/16) to audit-vpc (10.200.0.0/16)
- Route traffic from audit-vpc (10.200.0.0/16) to payment-vpc (10.100.0.0/16)
- Handle multiple route tables per VPC (one per subnet/AZ)

### 3. Security Groups
- Update security groups to allow specific traffic between VPCs
- Allow HTTPS traffic (port 443) between VPCs
- Allow PostgreSQL traffic (port 5432) between VPCs
- Restrict traffic to specific CIDR blocks (VPC ranges only)
- Add ingress and egress rules as needed

### 4. Network ACLs
- Configure Network ACL rules for encrypted traffic only
- Allow TLS-encrypted traffic on port 443 (HTTPS)
- Allow encrypted PostgreSQL traffic on port 5432
- Deny all other traffic between VPCs
- Apply rules to both inbound and outbound traffic

### 5. VPC Flow Logs
- Create VPC flow logs for the peering connection
- Configure S3 bucket as the destination for flow logs
- Enable flow logs to capture accepted, rejected, and all traffic
- Set appropriate retention policies on the S3 bucket
- Add lifecycle policies for cost optimization

### 6. CloudWatch Monitoring
- Create CloudWatch alarms for peering connection state changes
- Monitor peering connection status (active/pending/failed)
- Alert on any state transitions
- Configure SNS topic for alarm notifications
- Set up CloudWatch dashboard for visibility

### 7. Resource Tagging
- Tag all resources with DataClassification='Sensitive'
- Add BusinessUnit tags (e.g., BusinessUnit='Payment' or 'Audit')
- Include Environment tags (dev/staging/prod)
- Add Owner and CostCenter tags for tracking
- Ensure consistent tagging across all resources

### 8. Cross-Account Permissions
- Handle cross-account IAM permissions for peering
- Configure assume role policies where needed
- Set up proper trust relationships between accounts
- Handle VPC peering accepter configuration for cross-account scenarios

## Critical Constraints

1. VPC peering connections must be established programmatically without manual acceptance
2. Network ACLs must be configured to allow only encrypted traffic between VPCs
3. DNS resolution must be enabled for private hosted zones across peered VPCs
4. The solution must support cross-region VPC peering for disaster recovery scenarios
5. Route tables must be automatically updated in both VPCs to enable bidirectional traffic
6. All resources must be tagged with compliance metadata including DataClassification and BusinessUnit
7. Security groups must restrict traffic to specific ports and protocols between VPCs

## Configuration Requirements

The Pulumi stack should accept the following configuration values:

- `aws:region`: Primary AWS region (us-east-1)
- `paymentVpcId`: VPC ID for payment processing VPC
- `auditVpcId`: VPC ID for audit logging VPC
- `paymentVpcCidr`: CIDR block for payment VPC (10.100.0.0/16)
- `auditVpcCidr`: CIDR block for audit VPC (10.200.0.0/16)
- `paymentAccountId`: AWS account ID for payment account
- `auditAccountId`: AWS account ID for audit account
- `environment`: Environment name (dev/staging/prod)
- `dataClassification`: Data classification tag (default: Sensitive)
- `flowLogsRetentionDays`: S3 lifecycle retention for flow logs (default: 90)

## Expected Outputs

Export the following outputs for verification and downstream use:

- `peeringConnectionId`: The ID of the VPC peering connection
- `paymentRouteTableIds`: Array of route table IDs updated in payment VPC
- `auditRouteTableIds`: Array of route table IDs updated in audit VPC
- `flowLogsBucketName`: S3 bucket name for VPC flow logs
- `peeringStatusAlarmArn`: ARN of CloudWatch alarm for peering status
- `securityGroupIds`: Object with updated security group IDs

## Implementation Guidelines

1. **Idempotency**: The program must be safe to run multiple times
2. **Error Handling**: Include proper error handling and validation
3. **Dependencies**: Explicitly declare dependencies between resources where needed
4. **Best Practices**: Follow Pulumi and AWS best practices
5. **Type Safety**: Use TypeScript types and interfaces appropriately
6. **Documentation**: Include comments explaining key decisions and configurations
7. **Testing**: Code should be structured to allow for unit testing

## Code Quality Requirements

- Use Pulumi AWS Native or Classic provider (specify which)
- TypeScript strict mode enabled
- Proper async/await handling
- Use Pulumi Input/Output types correctly
- Include error handling and validation
- Add descriptive resource names with environment prefix
- Use stack references where appropriate
- Follow consistent naming conventions

## Acceptance Criteria

1. VPC peering connection is created and auto-accepted
2. DNS resolution is enabled for cross-VPC communication
3. Route tables in both VPCs are updated correctly
4. Security groups allow only ports 443 and 5432
5. Network ACLs restrict to encrypted traffic only
6. VPC flow logs are configured with S3 destination
7. CloudWatch alarms are set up for state monitoring
8. All resources are tagged with required compliance tags
9. Cross-account permissions are properly configured
10. The stack can be deployed and destroyed cleanly (idempotent)
11. Outputs provide all necessary information for verification

## Testing Expectations

The solution should allow for:
- Validation of VPC peering connection status
- Verification of route table entries
- Testing of security group rules
- Confirmation of network ACL configurations
- Monitoring of flow logs in S3
- Alerting verification via CloudWatch

---

## Problem Statement Summary

Create a Pulumi TypeScript program to establish VPC peering between payment and audit VPCs with automated route configuration. The configuration must:

1. Create VPC peering connection between payment-vpc and audit-vpc with auto-accept enabled
2. Configure route tables in both VPCs to route traffic through the peering connection
3. Update security groups to allow HTTPS (443) and PostgreSQL (5432) traffic between VPCs
4. Enable DNS resolution options on the peering connection for cross-VPC name resolution
5. Create Network ACL rules allowing only TLS-encrypted traffic on ports 443 and 5432
6. Tag all resources with DataClassification='Sensitive' and appropriate BusinessUnit tags
7. Configure VPC flow logs for the peering connection with S3 destination
8. Create CloudWatch alarms for peering connection state changes
9. Output the peering connection ID and route table IDs for verification

Expected output: A Pulumi stack that creates and configures VPC peering with all security controls, monitoring, and network routing properly established. The program should handle cross-account permissions and be idempotent for repeated deployments.
