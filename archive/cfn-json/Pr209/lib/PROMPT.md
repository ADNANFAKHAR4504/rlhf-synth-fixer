### Prompt:

> **Act as an AWS Solution Architect.**
>
> Design and implement an **AWS CloudFormation template** using **JSON format** to provision a **basic development environment** in the `us-east-1` region.
>
> The template must define the following resources:
>
> 1. **S3 Bucket** for storing project files:
>
>    * Must have **versioning enabled**.
> 2. **Amazon RDS (PostgreSQL)**:
>
>    * Must support **Multi-AZ deployment** for high availability.
> 3. **EC2 Instance**:
>
>    * Use **instance type `t2.micro`**, suitable for development workloads.
>
> Additional constraints:
>
> * Ensure **all resources** are provisioned in the **`us-east-1`** region.
> * Use **parameters** for configurable values like database name, instance identifiers, etc., to support reuse.
> * The output must be a **valid CloudFormation template in JSON format**.


