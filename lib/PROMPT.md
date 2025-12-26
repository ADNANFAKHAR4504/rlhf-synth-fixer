# CDK Java Infrastructure Help Request

Hey there! I'm trying to migrate our existing Terraform HCL basic environment to AWS CDK with Java, and I'm running into some challenges. I'm relatively new to CDK Java and could really use some guidance.

## My Current Situation

I have this basic Terraform setup that creates a simple cloud environment, but my team is pushing to standardize on CDK Java for better integration with our existing Java applications. The current Terraform creates a basic VPC, some EC2 instances, and networking components, but I need to recreate this exact same infrastructure using CDK Java.

## What I Need to Build

I need help creating a CDK Java implementation that matches our Terraform setup exactly. Here's what the infrastructure should include:

The VPC needs to use a 10.0.0.0/16 CIDR block, and I need 2 subnets in different availability zones for high availability. There should be an EC2 instance with a public IP address that's accessible from the internet.

For networking, I need an Internet Gateway properly configured and a Security Group that allows SSH access on port 22. Everything needs to follow our tagging standards with 'Project: TerraformSetup' tags applied to all resources.

Our naming convention requires all resources to have a 'cdk-' prefix to distinguish them from our existing infrastructure.

### Service Integration Requirements

The infrastructure needs to have proper service connectivity between components:

The EC2 instance needs to integrate with CloudWatch for monitoring and logging. I want instance logs automatically streamed to a CloudWatch Log Group so our ops team can monitor everything from a central location without SSH access.

For storage, the EC2 instance should have access to an S3 bucket where it can upload and download files. The IAM role attached to the instance should grant appropriate S3 permissions so applications can use the bucket without hardcoded credentials.

I also need Systems Manager integration so our team can manage the instance remotely without dealing with SSH keys. The IAM role should include the AWS managed SSM policy to enable this.

The VPC needs to provide proper network isolation with security groups controlling access. The Internet Gateway should allow the EC2 instance in the public subnet to reach the internet for software updates and external API calls.

All the IAM policies and roles need to follow least privilege principles, granting only the specific permissions each service needs to interact with others.

## My Constraints and Challenges

I'm working with a tight budget, so I need to be cost-conscious with instance types and avoid any resources that take forever to deploy. My manager is breathing down my neck about delivery timelines, and I can't afford to wait hours for RDS instances or complex services to spin up.

The team is also interested in incorporating some of the latest AWS features. I've been reading about the new S3 Metadata capabilities and Amazon Elastic VMware Service, and I'd love to include some modern AWS services to show we're keeping up with the latest offerings.

## What I'm Looking For

I need complete infrastructure code in CDK Java format, with one code block per file so I can easily copy and set up the project structure. The main entry point should follow the TapStack naming convention that our deployment pipeline expects.

The solution needs to include comprehensive stack outputs because our integration tests depend on being able to reference the created resources by their IDs and endpoints.

Can you help me create a complete CDK Java implementation that recreates this basic environment? I really appreciate any guidance you can provide!