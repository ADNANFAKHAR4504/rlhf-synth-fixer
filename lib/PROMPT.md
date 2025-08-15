> **Act as an AWS Solutions Architect** and write a complete **AWS CDK** project in **Python** to design and deploy a **highly available, fault-tolerant infrastructure** for a **large-scale e-commerce application** in the **us-west-2** region. The solution must meet the following requirements:
>
> 1. **Multi-AZ Deployment**
>
>    * Deploy all core application resources (web servers, databases, caches) across **multiple availability zones** for redundancy.
> 2. **Automated Failover & Health Checks**
>
>    * Use **Elastic Load Balancers (ALB/NLB)** and health checks to automatically failover for stateful services.
> 3. **Database Replication**
>
>    * Use **Amazon RDS** or **Amazon Aurora** with **asynchronous cross-AZ replication** to minimize data loss during failures.
> 4. **Networking & VPC Setup**
>
>    * Create a **VPC** with public and private subnets in multiple AZs.
>    * Configure routing, NAT gateways, and security groups with **least privilege** principles.
> 5. **Failure Detection & Automated Response**
>
>    * Deploy **AWS Lambda** functions triggered by **CloudWatch Alarms** or **EventBridge Rules** to detect failures and take corrective actions.
> 6. **IAM Roles & Security**
>
>    * Define minimal IAM roles/policies required for EC2, RDS, ElastiCache, and Lambda functions.
> 7. **Environment Configuration**
>
>    * Support  environments (dev)
>
> **Output Requirements: give AWS CDK Python code in app.py file**
>