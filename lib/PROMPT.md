Create infrastructure code using Pulumi with TypeScript for an educational platform web application serving 3,200 daily users.

Requirements:

- Create a VPC with CIDR block 10.40.0.0/16 in us-east-1
- Set up an Application Load Balancer configured for HTTPS on port 443
- Deploy EC2 instances (t3.micro) running nginx web server
- Configure auto-scaling for handling user load
- Create security groups allowing HTTPS traffic from anywhere and SSH access only from 172.31.0.0/16
- Create an S3 bucket for static assets with appropriate access policies
- Set up CloudWatch monitoring for health checks and system metrics
- Configure ALB target group with health checks on HTTP port 80
- Enable CloudWatch detailed monitoring for EC2 instances
- Add EC2 Instance Connect Endpoint for secure SSH access without bastion hosts
- Enable ALB access logs stored in S3 for traffic analysis

Provide the complete infrastructure code in TypeScript for Pulumi, organizing resources logically within the tap-stack.ts file. Include proper error handling, resource dependencies, and export necessary outputs like the ALB DNS name and S3 bucket name.
