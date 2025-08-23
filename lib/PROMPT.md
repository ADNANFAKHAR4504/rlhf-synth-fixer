Your task is to set up a cloud environment using Pulumi in Java for a scalable web application. Please adhere to the following requirements:

1. Use AWS as the cloud provider and set the region to `us-west-2`.
2. Create a Virtual Private Cloud (VPC) with CIDR block `10.0.0.0/16`.
3. Within the VPC, create at least two subnets in different Availability Zones (AZs). For each AZ, provision one public subnet and one private subnet.
4. Attach an Internet Gateway and configure appropriate route tables so public subnets receive internet access and private subnets remain isolated.
5. Launch one EC2 instance in each public subnet.
6. Allocate and attach an Elastic IP address to each EC2 instance.
7. Ensure EC2 instances can communicate privately via their private IPs (e.g., within VPC/VPC peering or default routing).
8. Create a Security Group that permits inbound SSH access **only** from a designated IP address (to be supplied at deployment time); all other inbound traffic should be restricted.
9. Use default resource naming conventions unless specified otherwise.
10. Assume the AWS account credentials and the authorized SSH IP address will be provided during evaluation.

Please implement this entirely in **Java**, using Pulumi's Java SDK. Include all necessary imports, a `main` method to execute the stack, and clearly structured resource definitions following AWS and Pulumi best practices for security and fault tolerance.
