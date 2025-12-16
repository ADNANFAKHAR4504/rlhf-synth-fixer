As an expert DevOps engineer, generate an AWS CloudFormation YAML template named cloud-setup.yaml that provisions a basic networking setup in the us-east-1 region.

The infrastructure must include the following:

A VPC with CIDR block 10.0.0.0/16.

Two subnets within the VPC:
    - One public subnet
    - One private subnet

An Internet Gateway attached to the VPC to enable internet access for the public subnet.

A Route Table configured to direct internet-bound traffic from the public subnet through the Internet Gateway.

Associate the public subnet with the route table to ensure internet connectivity.

Use AWS default naming conventions where possible.
The template should be error-free and deployable via the AWS CloudFormation Console.
Output only valid cloud-setup.yaml YAML content without additional commentary.