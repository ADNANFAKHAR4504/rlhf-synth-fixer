I need to create a secure and efficient AWS cloud environment using Pulumi with TypeScript. The infrastructure must follow AWS security best practices and be deployable in any AWS region. All resources should be modular and named following the pattern `<resource>-<environment>`. Here are the components I need:

1. Create a new VPC with the CIDR block `10.0.0.0/16`.
2. Create two public subnets within the VPC, using CIDR blocks `10.0.1.0/24` and `10.0.2.0/24`, distributed across different availability zones for redundancy.
3. Provision an Internet Gateway and attach it to the VPC.
4. Create a route table associated with the Internet Gateway, and ensure both public subnets are connected to this route table to allow outbound internet access.
5. Define a security group that allows SSH access **only from a specified list of trusted CIDR blocks** from IP range `203.26.56.90.`
6. Deploy an EC2 instance into one of the public subnets:
   - Use the latest Amazon Linux 2 AMI.
   - Ensure the instance is associated with the previously created security group and is publicly reachable only for SSH access as defined. from that IP range.
7. Use Pulumi configuration or environment variables to pass the list of allowed SSH CIDRs and other region-specific values.
8. All resources must be associated with a Pulumi provider object to control deployment region explicitly.
9. Follow Pulumi best practices: modular code structure, strict typing, clear tagging, and export all important outputs like VPC ID, subnet IDs, security group ID, and EC2 instance public IP.
10. Make sure there is a pulumi provider which is used to deploy resources and that region is configurable and it is deployed in `ap-south-1` region.

Please provide the Pulumi TypeScript code implementing this setup. The code must be production-ready, follow AWS security standards, and be region-agnostic. Avoid boilerplate scaffolding — focus only on the core infrastructure logic.