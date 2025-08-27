Here's a prompt for generating AWS CDK Java code for a secure infrastructure setup. It frames the request clearly, highlighting all the critical requirements and constraints for the LLM.

---

## AWS CDK Java: Secure Infrastructure Deployment

Hey team,

We need to define a secure infrastructure setup using **AWS CDK Java**. The goal is to create a stack that's fully compliant with our security standards and best practices.

Here are the specific requirements for this deployment:

- **Data Encryption**: All data at rest across _all_ resources must be encrypted. We need to leverage **AWS KMS** for this.
- **IAM Policies**: We need to implement **fine-grained IAM policies** for every service. This is critical for adhering to the **principle of least privilege**, ensuring that resources and users only have the exact permissions they need and nothing more.
- **Comprehensive Logging**: Logging must be enabled for _all_ AWS services that are used in this setup. We need to pay special attention to **S3 and Lambda**, making sure their logs are properly captured and stored.
- **Network Isolation**: All resources must be deployed within a **specified VPC and its subnets**. Please include details on how these subnets are structured and utilized for different components.

The expected output is a complete **CDK Java code** that can be deployed to create this infrastructure. It needs to pass all validation checks and strictly conform to AWS best practice guidelines for security and structure.

└── src
└── main
└── java
└── app
└── Main.java
Make sure all the code lies in Main.Java not required any other files, no need of pom.xml
