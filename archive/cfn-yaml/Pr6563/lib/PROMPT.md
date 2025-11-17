Generate an AWS CloudFormation YAML template that meets all the requirements listed below.
The template must be cross-account executable, with no hardcoded values, and must rely on Parameters for all configurable settings.
All resources must follow the mandatory naming convention described at the end of this prompt.

Functional Requirements

VPC

Create a VPC using a CIDR block provided as a parameter.

Subnet

Create a public subnet using a CIDR block provided as a parameter.

Subnet must reside inside the VPC.

Internet Gateway

Create and attach an Internet Gateway to the VPC.

Routing

Create a route table for the public subnet.

Add a route that sends 0.0.0.0/0 to the Internet Gateway.

Associate the subnet with this route table.

Security Group

Create a security group that allows inbound:

SSH (22) from 0.0.0.0/0

HTTP (80) from 0.0.0.0/0

Outbound rules: use default (allow all).

EC2 Instance

Deploy an Amazon Linux 2 instance.

Instance type must be a parameter (default: t2.micro).

Instance must be placed in the public subnet.

Instance must receive a public IP.

Instance must use the security group created above.

Instance must include the following tags:

Name = WebServerInstance

Environment = Testing

Key Pair

CloudFormation must create a Key Pair resource.

The EC2 instance must reference this key pair.

Outputs

Output the EC2 instance's Public IP.

Stack Constraints

Everything must exist in one CloudFormation stack.

Template must be deployable in us-east-1, but must NOT hardcode the region.

Use the official Amazon Linux 2 AMI SSM parameter:

/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Template must be valid YAML and pass:

aws cloudformation validate-template

cfn-lint

Follow least privilege and include no unnecessary resources.

Parameterization Requirements

All configurable values MUST be parameters, including:

VPC CIDR

Subnet CIDR

Instance type

Key pair name

Any tag values (unless mandatory)

Mandatory Parameters (must appear exactly as follows)
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Mandatory Naming Convention (must be applied to EVERY resource)

Every resource Name must follow this pattern:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1

Lambda → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda

Ensure this naming convention is followed for every resource that supports tagging or a Name property.