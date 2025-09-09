# Set up a basic AWS environment with CDK Java

**What you need to do:**
Create a simple AWS setup using AWS CDK with Java that includes:

1. **Database:** A MySQL RDS database with automatic backups
2. **Server:** An EC2 instance running Amazon Linux 2 in a public subnet
3. **Security:** SSH access to the server from your IP address only
4. **State Management:** Use CDK's built-in state management (no S3 setup needed)

**Requirements:**
- Use AWS CDK with Java
- Deploy everything in `eu-west-2`
- Store database passwords and instance types as environment variables or CDK context
- Follow AWS security best practices of least privilege

**Deliverable:**
A Java CDK stack file with a main.java file in a package app containing all the resources (VPC, subnets, security groups, RDS, and EC2). The main stack should be called TapStack, and the stackname for deployment should be TapStack${environmentSuffix}. All the code should be in the main.java file