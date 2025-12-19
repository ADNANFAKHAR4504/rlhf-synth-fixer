I’m working on designing a secure, production-grade infrastructure setup using **AWS CloudFormation** in **YAML**, and I need your help putting everything together in a single validated template.  

Here’s the scenario:  
We’re deploying everything into the **ca-central-1 region** inside a **custom VPC** that enforces strict network security — no use of the default VPC. The environment must follow organizational compliance standards with encryption, least privilege, and full observability in mind.  

The stack should define a few core services that make up a secure and compliant foundation:  

- **S3 buckets** that are both **server-side encrypted** and **versioned**, ensuring data durability and compliance.  
- **RDS instances** configured for **Multi-AZ deployments**, accessible **only within the VPC**, and fully encrypted.  
- **Lambda functions** running with **least privilege IAM roles** and **Dead Letter Queues (DLQs)** for fault tolerance.  
- **EBS volumes** encrypted using the **default KMS key** for data-at-rest protection.  
- **Load Balancers** with **access logging enabled** to maintain an auditable trail of all incoming traffic.  

All IAM roles and policies must strictly adhere to the **principle of least privilege**, giving Lambda only what it needs to execute successfully. Every **security group** should be locked down to only required ports and protocols.  

Additionally, all resources should be consistently **tagged** using the format `'Environment'` and `'Owner'`, and follow the naming convention `Env-Resource-Type`.  

The goal is to produce a **single, clean, YAML CloudFormation template** that defines all these resources — no modular splitting. The output should include **resource ARNs, URLs, and connection strings** wherever relevant. The final template must **pass basic validation** and demonstrate **AWS security best practices** across encryption, access control, and logging.  

In short, help me build a **Security Configuration as Code** setup that automates this entire environment — fully compliant, fully tagged, and production-ready — in a single CloudFormation YAML template.