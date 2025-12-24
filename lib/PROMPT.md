### Prompt:

> **Act as an AWS Solution Architect.**
>
> Design and implement an **AWS CloudFormation template** using **JSON format** to provision a **basic development environment** in the `us-east-1` region.
>
> The template must define the following resources that work together:
>
> 1. **S3 Bucket** for storing project files and database backups:
>
>    * Must have **versioning enabled**.
>    * The development EC2 instance will write application files and automated database backups to this bucket.
> 2. **Amazon RDS (PostgreSQL)** database for application data storage:
>
>    * Must support **Multi-AZ deployment** for high availability.
>    * Should be accessible from the EC2 instance through proper security group configuration.
>    * The EC2 application will connect to this database for persistent data storage.
> 3. **EC2 Instance** running the development application:
>
>    * Use **instance type `t2.micro`**, suitable for development workloads.
>    * This instance hosts the application that connects to the RDS database and stores files in the S3 bucket.
>    * Should have network access to communicate with the RDS instance.
>
> Additional constraints:
>
> * Ensure **all resources** are provisioned in the **`us-east-1`** region.
> * Configure security groups to allow the EC2 instance to connect to RDS on the PostgreSQL port (5432).
> * Use **parameters** for configurable values like database name, instance identifiers, and bucket names to support reuse across environments.
> * The output must be a **valid CloudFormation template in JSON format**.


