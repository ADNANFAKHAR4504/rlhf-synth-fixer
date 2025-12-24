We need a Terraform configuration that deploys AWS VPC networking with EC2 Security Groups for controlling HTTP/HTTPS access.

The provider config already exists in provider.tf and uses a variable called aws_region.

Here's what we need:

Deploy an AWS VPC with an AWS Internet Gateway that connects to a public AWS Subnet through an AWS Route Table. The Route Table should route all outbound traffic from the Subnet through the Internet Gateway to enable external connectivity. Then create an AWS Security Group attached to this VPC that controls inbound access by allowing only port 80 for HTTP and port 443 for HTTPS from specified IP ranges. Everything else inbound should be blocked.

The security group should:
- Accept variables for allowed IPv4 and IPv6 CIDR blocks
- Default to empty lists but warn if both are empty
- Have a toggle for outbound traffic: either wide open or locked down
- Use sensible default name and description but make them configurable
- Include default tags like Owner and Environment with override capability

The AWS networking setup should:
- Use a /16 CIDR block for the AWS VPC
- Create a /24 AWS Subnet in the first availability zone with public IP mapping enabled
- Attach an AWS Internet Gateway to the VPC
- Create an AWS Route Table with a default route that directs traffic to the Internet Gateway
- Associate the Route Table with the Subnet to enable internet access

Outputs should include:
- VPC ID and subnet ID
- Security group ID, ARN, and name
- Summary of ingress rules showing what traffic is allowed

Everything should be in main.tf with all variables declared there. No splitting across multiple files or pulling in external modules. Include required_providers and required_version at the top but skip the provider block since that's in provider.tf.

Add a comment at the top explaining the terraform commands to run and show an example of passing in the required variables.
