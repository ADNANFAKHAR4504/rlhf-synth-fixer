You are a Principal Cloud Solutions Architect. Your mission is to design and generate the Infrastructure as Code (IaC) for a highly available, scalable, and auto-healing global web application using AWS CDK and TypeScript. This architecture must uniquely use S3 as a live, mounted file system for the web servers.

## Problem Statement

You are building the infrastructure for a global website that must automatically scale to meet demand and automatically failover to a secondary region during an outage. The core architectural pattern is to serve website content directly from S3 by mounting an S3 bucket as a file system on the web server instances.

The end-to-end architecture will function as follows:

1.  **Content Management**: An administrator uploads website content to a primary S3 bucket in `us-west-2`. **S3 Cross-Region Replication (CRR)** instantly copies this content to a secondary bucket in `us-east-2`.
2.  **Web Serving via S3 Mountpoint**: In each region, an **Auto Scaling Group (ASG)** manages EC2 instances. When a new instance launches, it automatically:
    a. Installs the AWS S3 Mountpoint client.
    b. Mounts the local region's S3 bucket to its web server root directory (e.g., `/var/www/html`).
    c. Runs a web server (e.g., Nginx) that serves content directly from this mount point.
3.  **Load Balancing & Scaling**: An **Application Load Balancer (ALB)** in each region distributes traffic to the EC2 instances. If CPU usage on an instance gets too high, the ASG will automatically launch a new instance to handle the load.
4.  **Global Failover**: **Route 53** monitors the health of the ALB in each region. If the primary ALB in `us-west-2` becomes unhealthy, all traffic is automatically re-routed to the healthy ALB in `us-east-2`.

## Constraints

- **IaC Tool**: AWS CDK with TypeScript.
- **Regions**: `us-west-2` (Primary) and `us-east-2` (Secondary).
- **Core Pattern**: EC2 instances must use **S3 Mountpoint** to serve web content live from S3.
- **Networking**: A new VPC with two public and two private subnets must be created in each region, with a single NAT Gateway for the private subnets.
- **Scaling**: The ASG in each region should have a `max_capacity` of 1 initially, but must include a CPU utilization scaling policy.

## Instructions

Carefully analyze the requirements to build this advanced, scalable, and resilient architecture.

1.  **Architectural Outline**: In a `<thinking>` block, detail your plan. Explain how the major components—Route 53, ALB, ASG, and S3 Mountpoint—interact to provide scalability (within a region) and resiliency (across regions).

2.  **Generate IaC Code**: Generate the complete TypeScript code for the AWS CDK project. Organize the code into logical constructs for clarity.

3.  **Resource Connectivity & Configuration (Crucial)**:
    - **EC2 Launch Template**: This is critical. The user data script in the Launch Template must perform all the necessary setup on boot: install Nginx, install the S3 Mountpoint client, and execute the command to mount the S3 bucket.
    - **ALB and ASG Integration**: The ASG should be configured to use the Launch Template. Create a Target Group for the ASG and configure the ALB's listener to forward traffic to this Target Group. The ALB itself should reside in the public subnets, while the EC2 instances launched by the ASG are placed in the private subnets.
    - **Networking**: The private subnets' route table must have a default route pointing to the NAT Gateway to allow instances to download software packages during setup.
    - **Route 53 Failover**: The health checks must target the DNS names of the regional ALBs. The DNS records must use a **Failover Routing Policy**.
    - **Auto Scaling Policy**: Define a `TargetTrackingScalingPolicy` for the ASG based on average CPU utilization (e.g., scale out when CPU exceeds 70%).

4.  **Security Best Practices**:
    - **IAM Role**: The EC2 Instance Profile must have a least-privilege IAM policy granting permissions to mount and read from its regional S3 bucket (`s3:GetObject`, `s3:ListBucket`).
    - **Security Groups**:
      - **ALB Security Group**: Allows inbound traffic from the internet on port 80/443.
      - **EC2 Security Group**: Allows inbound traffic on port 80 **only** from the ALB's Security Group. Also, allow SSH on port 22 from a restricted IP range.

5.  **Final Output**:
    - Present the final, complete TypeScript code for the CDK stack(s).
    - Provide clear inline comments, especially for the user data script in the Launch Template.
    - Use `CfnOutput` to export the main Route 53 domain name for the application.
    - Focus more on the IaC part rather than its setup.
