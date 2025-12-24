We need a Terraform configuration that sets up a complete VPC environment with secure HTTP/HTTPS access through a security group.

The provider config already exists in provider.tf and uses a variable called aws_region.

Here's what we need:

A VPC with public subnet, internet gateway, and route table that connects the subnet to the gateway for internet access. Then a security group in that VPC that only allows inbound traffic on port 80 for HTTP and port 443 for HTTPS from specified IP ranges. Everything else inbound should be blocked.

The security group should:
- Accept variables for allowed IPv4 and IPv6 CIDR blocks
- Default to empty lists but warn if both are empty
- Have a toggle for outbound traffic: either wide open or locked down
- Use sensible default name and description but make them configurable
- Include default tags like Owner and Environment with override capability

The VPC setup should:
- Use a /16 CIDR block for the VPC
- Create a /24 public subnet in the first availability zone
- Attach an internet gateway to enable external connectivity
- Set up route table with default route pointing to the gateway

Outputs should include:
- VPC ID and subnet ID
- Security group ID, ARN, and name
- Summary of ingress rules showing what traffic is allowed

Everything should be in main.tf with all variables declared there. No splitting across multiple files or pulling in external modules. Include required_providers and required_version at the top but skip the provider block since that's in provider.tf.

Add a comment at the top explaining the terraform commands to run and show an example of passing in the required variables.
