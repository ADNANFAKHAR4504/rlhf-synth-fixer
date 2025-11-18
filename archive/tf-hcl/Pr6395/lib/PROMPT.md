Task Title: Production-Ready, Highly Available AWS VPC Network Architecture (Single File)

Design and implement a complete, production-ready AWS Virtual Private Cloud (VPC) network architecture using Terraform HCL. The entire solution—including resources, variables, locals, and outputs—must be contained within a single file named main.tf. Do not include any terraform or provider blocks, as AWS authentication is handled by a separate, pre-configured provider.tf file.

The configuration must enforce high availability, proper network segmentation, and least-privilege security standards by strictly adhering to the following eight requirements:

 VPC and Network Core
1.  VPC Base: Create a VPC with the CIDR block 10.0.0.0/16. Ensure DNS Hostnames are enabled on the VPC.
2.  Availability Zones (AZs): Define a list of three distinct AWS Availability Zones (AZs) to ensure high availability.
3.  Subnet Creation: Deploy a total of six subnets across the three defined AZs (three Public and three Private).
     All subnets must use a /24 CIDR block.
     The CIDR blocks must be calculated dynamically using only Terraform built-in functions (e.g., cidrsubnet) starting from the main 10.0.0.0/16 VPC range.
4.  Gateways and NAT: Create an Internet Gateway (IGW) and attach it to the VPC. Deploy exactly three NAT Gateways (NGWs), one in each of the three public subnets, to ensure redundancy.

 Routing and Segmentation
5.  Public Routing: Create a single Public Route Table. Configure a route to send all external traffic (0.0.0.0/0) through the Internet Gateway. Explicitly associate each of the three public subnets with this table.
6.  Private Routing: Create three separate Private Route Tables, one for each AZ/private subnet. Configure each table with a route for all external traffic (0.0.0.0/0) pointing to the NAT Gateway deployed in the corresponding AZ's public subnet. Explicitly associate each private route table with its respective private subnet.

 Security and Standards
7.  Security Groups (SGs): Create two specialized security groups:
     Web Tier SG: Allows ingress on TCP Port 443 from 0.0.0.0/0 (anywhere).
     App Tier SG: Allows ingress on TCP Port 8080 only from the Web Tier Security Group ID.
     Implementation Requirement: All ingress rules in both security groups must use a dynamic block.
8.  Implementation Best Practices:
     Iteration: All repeatable resources (Subnets, NAT Gateways, Route Tables, and Route Table Associations) must use for_each for resource creation and management (do not use count).
     Tagging: All created resources must be tagged with Environment = "Production", ManagedBy = "Terraform", and CostCenter = "Web-App-Service".

 Required Outputs
The configuration must provide the following named outputs:
 vpc_id
 public_subnet_ids (map or list)
 private_subnet_ids (map or list)
 nat_gateway_ids (map or list)