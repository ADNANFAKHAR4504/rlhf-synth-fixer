## Building Our Web App on AWS

We need to get a web application infrastructure set up on AWS using a CloudFormation template. This will go into the us-west-2 region, using a VPC with a 10.0.0.0/16 network range. We're thinking t2.micro instances, and everything needs to be in Availability Zones 'a' and 'b'.

Here's what the template needs to do:

- CI/CD Pipeline: Build a pipeline with separate steps for building, testing, and deploying the app.
- App Servers: The app should run on at least two EC2 instances for high availability.
- Traffic Management: Use an Elastic Load Balancer to handle incoming traffic and spread it across those EC2 instances.
- Database: Set up an RDS instance for the backend. Make sure it has automated backups turned on.
- Elastic IP: Assign an Elastic IP to the main EC2 instance that hosts the application.
- Network Access: Configure security groups to only allow HTTP (port 80) and HTTPS (port 443) traffic to reach the instances from the internet. Keep other ports locked down.
- Monitoring: Enable CloudWatch Logs for everything to keep an eye on the app's health and performance.
- Permissions: Set up IAM Policies and Roles so our EC2 instances can securely talk to S3 and RDS.
- Tagging: Every AWS resource needs to be tagged with 'Project=WebApp' and 'Environment=Production'.

What we need back is a single CloudFormation YAML template file, named webapp-deployment.yaml. It should pass validation like with aws cloudformation validate-template and all the CI/CD pipeline tests when code changes trigger them.
