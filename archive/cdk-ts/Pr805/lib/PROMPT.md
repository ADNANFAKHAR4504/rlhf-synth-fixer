I need to build a secure web application infrastructure on AWS using CDK TypeScript. The setup needs to be production-ready with all security best practices. Here are the components I need:

1. Create a new VPC in the 'us-west-2' region with the CIDR block '10.0.0.0/16'.
2. Set up two public subnets and two private subnets within the VPC.
3. Provision EC2 instances of type 't3.medium'.
4. Implement an Auto Scaling group to manage EC2 instances, ensuring that at least one instance is running at all times.
5. Create an S3 bucket to store infrastructure state or artifacts and enable versioning on this bucket.
6. Ensure all resources have the tag 'Environment: Production'.
7. Use AWS IAM roles to grant EC2 instances the necessary permissions, without using static credentials.
8. Configure all EC2 instances to use the IAM role assigned to them.
9. Ensure the infrastructure complies with AWS security best practices.
10. Provision all infrastructure in the 'us-west-2' region.

Please provide the CDK TypeScript code with proper security configurations and monitoring setup. The code should be modular, production-ready, and follow all best practices. Give all the resources in a single stakc other than the one file. Make sure all the resources naming convention have environment in the suffix.