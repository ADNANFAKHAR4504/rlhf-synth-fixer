# CloudFormation Template for Highly Available VPC Infrastructure

This solution creates a production-ready VPC infrastructure for a payment processing platform with high availability across 3 availability zones in us-east-1.

## Implementation Summary

The CloudFormation template (lib/TapStack.json) includes:

1. **VPC Configuration**: VPC with 10.0.0.0/16 CIDR, DNS hostnames and resolution enabled
2. **Subnet Architecture**: 3 public subnets + 6 private subnets across 3 AZs with specified CIDR blocks
3. **Internet Connectivity**: Internet Gateway with route table associations and 3 NAT Gateways with Elastic IPs
4. **Security Groups**: Bastion (SSH from specific IP), ALB (HTTP/HTTPS from internet), Application (traffic from ALB + SSH from bastion)
5. **Network ACLs**: Public and private NACLs with explicit allow rules for required ports (80, 443, 22, ephemeral)
6. **VPC Flow Logs**: CloudWatch Logs destination with KMS encryption and 30-day retention
7. **Parameters**: EnvironmentSuffix for unique naming, configurable CIDR, allowed bastion IP, and tags
8. **Outputs**: All resource IDs exported for cross-stack references

All resources include EnvironmentSuffix in names using Fn::Sub, proper tagging (Environment, Owner, CostCenter), and are fully destroyable (no retention policies).

The template is valid CloudFormation JSON format following AWS best practices for high availability, security, and PCI-DSS compliance readiness.