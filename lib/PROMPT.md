**You are an expert AWS and Pulumi infrastructure engineer.**

Your task is to generate a single, complete, and runnable Python Pulumi script that provisions the following infrastructure on AWS.

The script must be an all-in-one file that can be executed with `pulumi up` without any additional dependencies besides the required Pulumi and AWS Python packages.

### Requirements

#### Cloud Provider
* **AWS**: The solution must be designed to support deployment to multiple regions.

#### Networking
* Create a secure **VPC architecture** that includes:
    * At least one **VPC** per region.
    * At least two **public** and two **private subnets** across at least two Availability Zones (AZs) per region.
    * An **Internet Gateway** for the public subnets.
    * A **NAT Gateway** for the private subnets.
    * Appropriate **route tables** and associations for all subnets.
    * **Security groups** with restrictive inbound rules and minimal required egress.

#### Tagging
* Apply a consistent tagging strategy to **all** resources for cost management and organization. Tags must include at least:
    * `Environment`
    * `Team`
    * `Project`

### Best Practices
* Use Pulumi configuration (`pulumi.Config`) to define the target regions and base tags to avoid hard-coding values.
* Use provider-level `default_tags` where possible, plus explicit tags on resources that do not inherit them.
* Ensure private subnets do not automatically assign public IPs upon launch.
* Use cost-conscious defaults, such as a single NAT Gateway per region unless configured for high availability.

### Outputs
* Export the identifiers for the following created resources:
    * VPCs
    * Public and private subnets
    * Security groups
* The outputs must be structured in a way that allows for easy verification of tagging and network configuration via automated tests.

### Output Format
* **Provide only the Python code**. No explanations or commentary outside of inline code comments.
* The code must be fully self-contained, well-documented with inline comments, and ready to run.
* All AWS resources must be defined within the same Python file.

### Compliance
* **Infrastructure Coverage**: 100% (All required AWS resources and advanced features are included).
* **Security Implementation**: 100% (The security posture is outstanding).
* **Documentation Quality**: 100% (The code has excellent inline documentation).
* **Requirements Compliance**: 100% (All prompt requirements are fully met).