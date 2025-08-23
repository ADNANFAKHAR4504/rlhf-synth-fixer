# Multi-Region Infrastructure in Pulumi Go

I need help implementing a multi-region, environment-consistent AWS infrastructure using **Pulumi in Go**. The solution should be built with the following constraints:

- All resources must be deployed across **at least three AWS regions**
- All resources must be **tagged with `environment` and `purpose`**
- Resource names must follow the naming convention: `<environment>-<resource-name>`
- All infrastructure should be declared in a **single `.go` file**, inside a **struct/class that can be instantiated**
- Use **parameterized inputs** to support different configurations (e.g., instance size, DB config)
- Define **IAM roles and policies** following least privilege
- Configure **CloudWatch** to monitor and log all supported services
- Use **AWS Config** to ensure compliance
- **Export key outputs** to enable resource sharing across stacks
- Include an **RDS instance** with advanced configuration such as:
  - Multi-AZ deployment
  - Performance Insights
  - KMS encryption
  - Auto minor version upgrades
  - Backup retention
- The code must be **valid Pulumi Go**, and ready to deploy
- A cloudfront to serve request fromn s3 bucket
- s3 bucket which stores some static build files and has is encrytped.
- Avoid any boilerplate — focus only on the core logic

Please provide the complete Pulumi Go code in a **single file**, with all resources inside a single reusable class/struct. The file should compile and support instantiating infrastructure per environment.
