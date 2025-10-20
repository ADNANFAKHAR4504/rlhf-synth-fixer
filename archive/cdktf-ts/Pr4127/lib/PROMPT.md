Act as an expert AWS CloudFormation engineer. Your task is to create a complete CDKTF - Typescript code to deploy a scalable and secure WordPress blog infrastructure in the `us-east-2` region.

The infrastructure must include the following components and adhere to all specified best practices:

## 1. Networking:

- Create a new VPC with the CIDR block `10.15.0.0/16`.
- Inside the VPC, create one public subnet with the CIDR block `10.15.1.0/24`.
- Set up an Internet Gateway and attach it to the VPC.
- Create a Route Table for the public subnet with a default route (`0.0.0.0/0`) pointing to the Internet Gateway.

## 2. Application Server (EC2):

- Launch a single `t3.micro` EC2 instance.
- Use the latest Amazon Linux 2 AMI.
- The instance must be launched in the public subnet and assigned a public IP address.
- Use User Data to install an Apache web server, PHP, and WordPress.
- Create an IAM Instance Profile with an IAM Role that grants the EC2 instance `s3:GetObject` and `s3:PutObject` permissions for the S3 bucket created below.

## 3. Database (RDS):

- Launch an RDS MySQL database instance of type `db.t3.micro`.
- Set the allocated storage to 20 GB.
- Do not make the database publicly accessible.
- Use parameters from the `Parameters` section for the database master username and password.

## 4. Storage (S3):

- Create a private S3 bucket to store media uploads for the blog.

## 5. Security (Security Groups):

- Create a Web Server Security Group (`WebServerSG`) for the EC2 instance. It must allow inbound traffic on port 80 (HTTP) from anywhere (`0.0.0.0/0`).
- Create a Database Security Group (`DatabaseSG`) for the RDS instance. It must only allow inbound traffic on port 3306 (MySQL) from the `WebServerSG`. This is a critical security requirement.

## 6. Content Delivery (CloudFront):

- Set up a CloudFront distribution to serve static assets from the S3 bucket to improve performance.

## 7. Monitoring (CloudWatch):

- Create a basic CloudWatch Alarm that monitors the `CPUUtilization` of the EC2 instance and sends a notification if it exceeds 70% for 5 consecutive minutes.

## 8. Parameters & Outputs:

- Use the `Parameters` section for the `DBUser`, `DBPassword`, and `LatestAmiId`.
- Use the `Outputs` section to expose the `WebsiteURL`, `S3BucketName`, and `CloudFrontDomainName`.

## 9. Tagging:

- Tag all created resources with the key `Project` and value `iac-rlhf-amazon`.

Ensure the final output is a single file Typescript code.
