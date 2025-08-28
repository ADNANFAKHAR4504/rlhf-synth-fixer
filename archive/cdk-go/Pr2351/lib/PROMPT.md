Hey there, I need your help setting up a new AWS environment for our IT department's production workload. We're using AWS CDK with Go, and the goal is to build a secure and well-organized foundation for our applications.

Here’s what I have in mind:

First off, everything should be deployed in the 'us-east-1' region. It's also really important that we keep our resources organized, so please make sure everything is tagged with 'Environment: Production' and 'Department: IT'.

For the core setup, I'm thinking of a standard VPC with public and private subnets spread across a couple of availability zones for resilience.

Inside this VPC, we'll need an EC2 instance in a public subnet that will serve as our web server. Could you lock it down with a security group that only allows HTTPS traffic from the internet? We'll also need a basic IAM role for it, just to follow best practices, though it doesn't need any specific permissions right now.

For our data, I'd like to set up an RDS database instance—PostgreSQL would be great. To keep it secure, it should live in the private subnets. A critical requirement here is that the database must have encryption at rest enabled.

The most important part is making sure the EC2 instance and the RDS database can talk to each other securely. Could you configure the security groups so that the EC2 instance is the _only_ thing that can connect to the database on its port? All other connections to the database should be blocked.

Finally, for compliance and auditing, we need to have CloudTrail enabled to log all API activity in the account.

The ideal outcome would be a clean, ready-to-deploy CDK Go project. If you could put all the stack logic into a single 'main.go' file, that would be perfect. I'm looking for code that's easy to read, with comments explaining the important parts.

Thanks for your help with this!
