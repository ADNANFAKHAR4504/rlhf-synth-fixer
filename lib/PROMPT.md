### Prompt:

> I need help creating a CloudFormation template in JSON format for a basic development environment in the us-east-1 region.
>
> The template should define these resources that work together:
>
> 1. S3 bucket for storing project files and database backups:
>
>    * Enable versioning on the bucket.
>    * The development EC2 instance will write application files and automated database backups to this bucket.
> 2. Amazon RDS PostgreSQL database for application data storage:
>
>    * Configure Multi-AZ deployment for high availability.
>    * Should be accessible from the EC2 instance through proper security group configuration.
>    * The EC2 application will connect to this database for persistent data storage.
> 3. EC2 instance running the development application:
>
>    * Use t2.micro instance type, suitable for development workloads.
>    * This instance hosts the application that connects to the RDS database and stores files in the S3 bucket.
>    * Should have network access to communicate with the RDS instance.
>
> Additional requirements:
>
> * Provision everything in the us-east-1 region.
> * Configure security groups to allow the EC2 instance to connect to RDS on PostgreSQL port 5432.
> * Use parameters for configurable values like database name, instance identifiers, and bucket names to support reuse across different environments.
> * The output should be a valid CloudFormation template in JSON format.


