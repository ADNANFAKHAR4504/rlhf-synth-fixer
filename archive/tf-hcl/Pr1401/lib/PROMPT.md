# Terraform HTTP/HTTPS Security Group Infrastructure

Need to set up a secure AWS networking foundation with Terraform for web applications. This is focused on creating a bulletproof security group setup that allows only HTTP/HTTPS traffic, with flexible VPC management.

This needs to be solid infrastructure-as-code, production-ready with proper validation and security controls.

## Requirements:
- Use Terraform v1.0+ (modern version)
- Flexible region deployment (defaults to us-west-2, configurable)
- Smart VPC handling - create new VPC or use existing one
- Security-first approach - only HTTP (80) and HTTPS (443) inbound traffic
- Comprehensive validation for all inputs
- Support for both IPv4 and IPv6 CIDR blocks
- Configurable egress rules (unrestricted or locked-down for production)
- Unique resource naming with random suffixes
- Complete tagging strategy for all resources

## What it creates:
- **Conditional VPC**: Creates new VPC with full networking stack when needed, or uses existing VPC
- **Security Group**: HTTP/HTTPS-only ingress rules with flexible CIDR configuration
- **Networking Components** (when creating VPC): Internet Gateway, Route Tables, Public Subnet
- **Validation**: Comprehensive input validation and error handling
- **Outputs**: Complete infrastructure details for integration with other systems

## Security Features:
- Only allows HTTP (80) and HTTPS (443) inbound traffic
- Configurable source CIDR blocks (avoid 0.0.0.0/0 in production)
- Two egress modes: unrestricted (dev) or locked-down (production)
- Input validation prevents misconfiguration
- Unique naming prevents resource conflicts

## Production-Ready Features:
- Proper error handling and validation
- Comprehensive tagging strategy
- Random suffixes for unique resource naming
- Conditional resource creation based on requirements
- Multi-AZ subnet placement when creating VPC
- DNS resolution enabled for created VPCs

Basically need main.tf that will deploy a secure networking foundation without issues, following security best practices and providing flexible VPC management. Should be bulletproof for production web application deployments.