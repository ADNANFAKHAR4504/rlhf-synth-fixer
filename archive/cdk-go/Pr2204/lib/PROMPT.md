AWS CDK Go Prompt: Secure VPC Infrastructure with Strict Security Group

Imagine that you are an engineer and you are required to build an AWS CDK stack in Go to deploy a secure VPC infrastructure with strict security controls. Your goal is to deliver a single, self-contained CDK Go file that provisions all necessary networking resources with security-focused configurations.

What I need:
The CDK stack should be implemented entirely in a single Go file named tap_stack.go.

Create a VPC named 'corpVPC' with CIDR block 10.0.0.0/16 using the AWS EC2 VPC construct (awscdkec2alpha/v2 or awscdkec2).

Attach an Internet Gateway named 'corpInternetGateway' to the VPC using appropriate CDK networking constructs (likely as part of the VPC definition).

Establish a security group named 'corpSecurityGroup' that meets strict access policies:

Allows inbound HTTP traffic (port 80) ONLY from the specific CIDR block 203.0.113.0/24.

Explicitly blocks ALL outbound connections by removing the default allow-all rule.

Use proper CDK resource naming and tagging conventions with a 'corp' prefix for all resources.

Include necessary metadata & descriptions for all resources to document their security purposes.

Ensure the synthesized CloudFormation template validates against AWS specifications and passes all syntax checks.

The implementation should be testable with standard Go unit tests in the test folder.

Deliverable:
A single tap_stack.go file that:

Imports the necessary AWS CDK modules for Go (e.g., github.com/aws/aws-cdk-go/awscdk/v2, github.com/aws/aws-cdk-go/awscdk/v2/awsec2).

Defines a function (NewTapStack) that creates a new CDK stack and constructs the secure VPC infrastructure.

Correctly uses Go CDK patterns, paying attention to pointers (&), dereferencing (*), and error handling.

Implements the exact security group constraints using the AddIngressRule and AddEgressRule methods (or equivalent) to achieve the specified allow/deny behavior.

Uses awscdk.NewCfnOutput to output important resource IDs if necessary.

Can be synthesized (cdk synth) into a valid CloudFormation template named 'secure_infra.yml'.

Is well-commented to explain the security configuration for future maintainers.

Your implementation should reflect AWS CDK and Go best practices, including proper scope management for constructs, and maintain strict security controls through configuration without relying on external modules or configuration files for core logic.