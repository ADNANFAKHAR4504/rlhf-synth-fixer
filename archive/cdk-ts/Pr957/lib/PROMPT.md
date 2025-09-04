I need help setting up a basic network infrastructure in AWS using CDK TypeScript. The requirements are:

1. Create a VPC with a CIDR block of 10.0.0.0/16 in us-east-1 region
2. Within this VPC, provision two public subnets, ensuring each is located in a separate availability zone
3. Configure an Internet Gateway to provide internet access to resources hosted within these subnets
4. Ensure to create necessary route tables and associations to achieve this setup
5. Use VPC Lattice for future service-to-service connectivity capabilities
6. Include AWS PrivateLink VPC endpoints for enhanced security and private connectivity

Please provide infrastructure code with one code block per file. Make sure the code follows CDK TypeScript best practices and includes proper resource naming and tagging. Keep the solution minimal but production-ready.