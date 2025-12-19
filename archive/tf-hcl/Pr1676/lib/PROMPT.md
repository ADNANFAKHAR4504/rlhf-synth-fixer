You are tasked with creating a Terraform configuration to set up a simple web application in the 'us-west-2' region. The setup should include:

1. A virtual private cloud (VPC) with default settings.
2. Two EC2 instances, named 'ProdInstance1' and 'ProdInstance2', each located in different availability zones for redundancy.
3. An Application Load Balancer to distribute incoming traffic across the EC2 instances.
4. The necessary security groups to allow HTTP access (port 80) to the EC2 instances through the load balancer.

The load balancer should be associated with a security group that only allows incoming HTTP traffic from the internet. Ensure that the configuration is designed to maximize availability and reliability by leveraging multiple availability zones.

Expected output: A Terraform HCL configuration that, when deployed, sets up the specified infrastructure. This configuration must pass validation checks and successfully create the resources when run with Terraform.

Additional Requirements:
- The target environment is AWS in the 'us-west-2' region
- Use two availability zones for high availability
- VPC settings should use default configuration
- Naming conventions include prefixing resources with 'Prod'
- The architecture must include a load balancer to distribute traffic across two EC2 instances
- Security groups should be properly configured to allow HTTP traffic through the load balancer