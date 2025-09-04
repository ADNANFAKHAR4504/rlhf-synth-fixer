I need help setting up a basic cloud environment using AWS CDK with Python for our development team to start their projects. We're looking to deploy resources in the us-east-1 region.

Here are the specific requirements:
1. Deploy all resources in the 'us-east-1' region
2. Include at least one EC2 instance and one S3 bucket in the stack
3. Ensure all resources use the tag 'Environment' with a value of 'Development' 
4. The EC2 instance should be of type 't2.micro'
5. The S3 bucket must have versioning enabled

I'd like to take advantage of some of the newer AWS features if possible. I've heard about the new EC2 R8i instances that offer better price performance, but since we need t2.micro for cost reasons, we'll stick with that. I'm also interested in using AWS CloudFormation's recent optimistic stabilization feature that speeds up deployments if that's available through CDK.

Could you provide a complete CDK Python application that creates this environment? The code should be ready for deployment without any errors. Please provide one code block per file so I can easily copy and paste the implementation.

Thanks!