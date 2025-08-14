You are an expert Cloud Engineer specializing in Infrastructure as Code (IaC) using the AWS Cloud Development Kit for Terraform (CDKTF) with TypeScript. Your task is to generate production-ready CDKTF code to provision a foundational AWS environment that adheres to a strict set of requirements and a specific modular file structure.

Project Requirements:

AWS Provider: The infrastructure must be deployed to the us-east-1 region.

Networking (VPC):

Provision a new VPC.

Inside the VPC, create three subnets distributed across two different Availability Zones for high availability (e.g., us-east-1a and us-east-1b).

Designate two of the subnets as public (with an Internet Gateway and public route tables) and one as private.

Compute (EC2):

Launch one EC2 instance in each of the two public subnets.

All instances must be of the t3.medium type.

Create a single Security Group that allows inbound SSH (port 22) access from anywhere (0.0.0.0/0).

Associate a pre-existing SSH key pair with the instances. The name of the key pair should be configurable via a Terraform variable named ssh_key_name.

Code Structure and Organization:

You must organize the entire codebase into the following two files only. The code should be modular, reusable, and heavily commented to explain the purpose of each resource and block.

lib/modules.ts:

This file must contain the reusable infrastructure modules.

Create a VpcModule class that encapsulates the creation of the VPC, all three subnets, the Internet Gateway, and the necessary Route Tables.

Create an Ec2Module class that encapsulates the creation of the Security Group and the EC2 instances. This module should accept the public subnet IDs and the SSH key name as input properties (props).

lib/tap-stack.ts:

This file will define the main stack, named TapStack.

It must import the modules from lib/modules.ts.

Instantiate the VpcModule to create the networking layer.

Instantiate the Ec2Module, passing the output from the VpcModule (specifically, the public subnet IDs) as input to the Ec2Module.

Define the ssh_key_name as a TerraformVariable within this stack.

Expected Output:

Provide the complete, production-ready TypeScript code for both lib/modules.ts and lib/tap-stack.ts. The code should be ready to be deployed using the cdktf deploy command, assuming it is part of a standard CDKTF project setup.