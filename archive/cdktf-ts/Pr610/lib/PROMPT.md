Act as a Senior DevOps Engineer and AWS Solutions Architect.

You are tasked with building a secure, production-grade, and highly available AWS network and database foundation using CDKTF (CDK for Terraform) in TypeScript. The architecture must be fully modular, with reusable constructs for all components, and all resources must be deployed in the us-east-1 region.

## Required File Structure
Your entire solution must be contained within the following two files. This strict separation of reusable components from their final implementation is mandatory.

lib/modules.ts:
Contains all the reusable CDKTF Constructs. This file will define the building blocks of your infrastructure (e.g., a VPC construct, an RDS construct) but will not deploy them. It should export these constructs for use in the main stack.

lib/tap-stack.ts:
Contains the main TerraformStack. This file is responsible for importing, instantiating, and composing the constructs from modules.ts. It will wire the components together (e.g., passing the EC2 security group to the RDS construct) and define the final outputs.

## Environment & Naming
Cloud Provider: AWS

Region: us-east-1

IaC Tool: CDKTF (TypeScript)

Naming Convention (Mandatory): All resources must be prefixed with an environment name (e.g., dev- or prod-). This must be controlled by a variable passed to the stack. Example: dev-main-vpc.

Tagging (Required on all resources):

Environment = dev (or prod, from the environment prefix variable)

Project = SecureFoundation

ManagedBy = CDKTF

## Infrastructure Requirements & Module Design
The lib/modules.ts file must export the following reusable constructs:

1. VpcNetwork Construct
Responsibilities:

Creates a Vpc with a configurable CIDR block.

Creates two public subnets and two private subnets, distributing them across two Availability Zones (us-east-1a, us-east-1b).

Creates an Internet Gateway (IGW) and attaches it to the VPC.

Creates an Elastic IP (EIP) and a NAT Gateway in one of the public subnets.

Creates and associates separate Route Tables for the public and private subnets.

Public Route Table: Routes 0.0.0.0/0 to the IGW.

Private Route Table: Routes 0.0.0.0/0 to the NAT Gateway.

Outputs: This construct must expose the vpcId, publicSubnetIds, and privateSubnetIds as public properties.

2. RdsDatabase Construct
Responsibilities:

Creates a DbSubnetGroup using the private subnet IDs.

Creates a SecurityGroup for the database. This security group must have an inbound rule allowing PostgreSQL traffic (port 5432) only from another security group ID that is passed into its constructor. It must not use CIDR ranges for this rule.

Creates a DbInstance for PostgreSQL (db.t3.micro is sufficient).

Ensures the DbInstance is associated with the DB subnet group and its dedicated security group.

publiclyAccessible must be set to false.

Inputs: This construct must accept the vpcId, privateSubnetIds, and the sourceSecurityGroupId for the ingress rule.

Outputs: Must expose the rdsEndpoint and rdsPort as public properties.

3. BastionHost Construct
Responsibilities:

Creates a SecurityGroup for the EC2 instance. It must allow inbound SSH traffic (port 22) from a configurable IP address (var.my_ip) and allow all outbound traffic.

Creates an Instance (EC2) using t2.micro and the latest Amazon Linux 2 AMI.

Deploys the instance into one of the public subnets.

Associates the instance with its security group.

Inputs: This construct must accept the vpcId and a publicSubnetId.

Outputs: Must expose the instancePublicIp and the securityGroupId as public properties.

##  Constraints & Composition in tap-stack.ts
The TapStack in lib/tap-stack.ts must instantiate the three constructs defined above.

It is responsible for orchestrating the dependencies:

Instantiate VpcNetwork.

Instantiate BastionHost, passing it the vpcId and one of the publicSubnetIds from the VpcNetwork output.

Instantiate RdsDatabase, passing it the vpcId, privateSubnetIds (from VpcNetwork), and crucially, the securityGroupId from the BastionHost output.

The RDS security group must reference the EC2 security group by its ID, not a CIDR block.

No raw resource definitions should exist in lib/tap-stack.ts. It should only compose the high-level constructs.

## Deliverables
lib/modules.ts: A file containing the TypeScript code for the VpcNetwork, RdsDatabase, and BastionHost CDKTF constructs.

lib/tap-stack.ts: A file that correctly imports and wires the constructs together to build the complete infrastructure.

The final stack must be deployable via cdktf deploy without errors.

The stack must define the following TerraformOutput values for verification:

bastion_public_ip: The public IP of the EC2 bastion host.

rds_instance_endpoint: The connection endpoint for the PostgreSQL RDS instance.

ssh_command: A formatted string showing how to SSH into the bastion host (e.g., ssh -i <your-key.pem> ec2-user@<IP>).