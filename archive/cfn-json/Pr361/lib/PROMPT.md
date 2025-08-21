> **You are a senior AWS DevOps engineer.**
> Write a complete **CloudFormation template in JSON** that builds a robust CI/CD pipeline for deploying microservices in AWS.
>
> ### **Requirements:**
>
> 1. The pipeline must:
>
>    * Support **both manual and automated triggers** for deployments.
>    * Use **AWS CodePipeline** as the orchestrator.
>    * Use **AWS CodeBuild** to build application artifacts.
>    * Use **AWS CodeDeploy** to deploy to **EC2 instances**.
> 2. The deployment environment should:
>
>    * Be hosted inside a **VPC spanning two Availability Zones** in **`us-east-1`**.
>    * Include subnets, routing tables, NAT gateway, and Internet gateway as required for CI/CD connectivity.
>    * Deploy EC2 instances as **CodeDeploy targets**, ideally across both AZs.
> 3. All resources must:
>
>    * Use the **prefix `Corp-`** in their names to follow company naming conventions.
>    * Be provisioned in **`us-east-1`**.
> 4. Template format:
>
>    * Use **JSON**, not YAML.
>    * Follow best practices (e.g., IAM role separation, parameterization, modular organization).
>    * Include inline **comments** (as allowed in JSON via `_Comment` or descriptive names) or provide external documentation blocks.
>
> ### Output:
>
> * A **single CloudFormation JSON template** that includes:
>
>   * The VPC and networking resources
>   * The EC2 Auto Scaling group or launch template for microservices
>   * IAM roles/policies
>   * CodePipeline, CodeBuild, and CodeDeploy configurations
> * Any **required artifacts or assumptions** to make the template deployable (e.g., S3 bucket placeholder, GitHub repo URL stub)
> * A **brief documentation section** summarizing:
>
>   * Deployment steps
>   * Parameters required
>   * How to trigger the pipeline manually vs automatically
>
> Make sure the solution aligns with production-grade architectural standards and is modular enough for future expansion.

---