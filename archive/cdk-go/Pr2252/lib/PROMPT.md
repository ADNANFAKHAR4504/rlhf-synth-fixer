Develop an AWS CDK application in Go that provisions a production-ready AWS network environment. The setup should emphasize scalability, high availability, and security.

Key Requirements:
1. Use AWS as the cloud provider.
2. Define everything in a single Go file using the AWS CDK.
3. Create a VPC with CIDR block 10.0.0.0/16.
4. Provision at least two public subnets and two private subnets, distributed across two Availability Zones.
5. Attach an Internet Gateway for public subnet access and configure proper routing.
6. Deploy NAT Gateways so private subnets have outbound internet connectivity.
7. Allow SSH access only from a specific IP range (for example 203.0.113.0/24).
8. Implement a Bastion host in a public subnet for secure access to private resources.
9. Apply security groups to restrict access and enforce least privilege.
10. Ensure all S3 buckets have Block Public Access enabled.
11. Tag every resource with "Environment" = "Production".

Expected Output:
A single Go CDK application that follows AWS best practices and provisions the complete infrastructure with cdk deploy.
