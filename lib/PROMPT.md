# LLM Prompt: Generate a Production-Grade AWS CDK-TS Project for a Serverless Web Application


## 1. Role


Act as an expert AWS Cloud Engineer and a senior developer specializing in Infrastructure-as-Code (IaC) using the AWS Cloud Development Kit (CDK) with TypeScript.


---


## 2. Primary Objective


Your primary objective is to generate a **complete, production-grade, and fully functional AWS CDK-TypeScript project**. This project will define and provision the cloud infrastructure for a standard serverless web application based on the detailed technical requirements provided below.


The final output must be a single response containing the **entire project structure** and the **complete source code for every file**. The generated code must be ready for immediate deployment (`cdk deploy`) in an AWS environment without requiring any manual configuration or adjustments.


---


## 3. Project Overview


The infrastructure will host a serverless application composed of three main tiers:
1.  **Frontend Hosting**: An S3 bucket configured for static website hosting.
2.  **API/Compute Layer**: An API Gateway that invokes a Python-based Lambda function for business logic.
3.  **Data Layer**: A managed PostgreSQL database using Amazon RDS for persistent storage.


All resources must be provisioned within a new, secure VPC to ensure network isolation and security.


---


## 4. Core Technical Requirements


You must adhere strictly to the following specifications for each AWS resource.


### 4.1. General & AWS CDK Configuration
-   **AWS Region**: All resources must be provisioned in `us-west-2`.
-   **CDK Language**: TypeScript.
-   **Best Practices**:
   -   Use constructive IDs for all CDK resources (e.g., `MyWebAppS3Bucket`, `MyWebAppApiGateway`).
   -   Avoid hardcoding sensitive values like database passwords. Use AWS Secrets Manager for credentials.
   -   Add comments to the code to explain key sections.
   -   Leverage the `@aws-cdk/aws-` series of L2 constructs where possible.


### 4.2. Networking (VPC)
-   **VPC**: Provision a new VPC.
   -   **CIDR Block**: `10.0.0.0/16`.
   -   **Subnets**: Configure the VPC with both **public** and **private** subnets across at least two Availability Zones for high availability. The Lambda function and RDS instance will reside in the private subnets.


### 4.3. Storage (S3 Bucket)
-   **Purpose**: Static website hosting.
-   **Configuration**:
   -   `publicReadAccess`: `true`.
   -   `websiteIndexDocument`: `index.html`.
   -   `websiteErrorDocument`: `error.html`.
   -   `removalPolicy`: `DESTROY` (for easy cleanup during development).
   -   `autoDeleteObjects`: `true`.


### 4.4. Database (RDS)
-   **Engine**: PostgreSQL version `14`.
-   **Instance Class**: `ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)`.
-   **VPC Placement**: Deploy the instance within the **private subnets** of the VPC.
-   **Credentials**:
   -   Generate database credentials (username and password) automatically using **AWS Secrets Manager**.
   -   Do **not** hardcode credentials in the CDK code.
-   **Backups**:
   -   **Automated backups must be enabled**.
   -   Set the backup retention period to **7 days**.
-   **Security Group**: Create a dedicated Security Group for the RDS instance that only allows inbound traffic on port `5432` from the Lambda function's Security Group.


### 4.5. Compute (AWS Lambda)
-   **Runtime**: Python 3.8 (`Runtime.PYTHON_3_8`).
-   **Code Location**: The handler code should be located in a `lambda` directory at the root of the project.
-   **VPC Placement**: The function must be placed inside the **private subnets** of the VPC to allow it to connect to the RDS database.
-   **IAM Role**: The function's execution role must have permissions for:
   -   Basic execution (`AWSLambdaBasicExecutionRole`).
   -   VPC access (`AWSLambdaVPCAccessExecutionRole`).
   -   **Read access** to the RDS database secret stored in AWS Secrets Manager.
-   **Environment Variables**: Pass the **ARN of the database secret** to the Lambda function as an environment variable.
-   **Handler Code (`lambda/handler.py`)**: Provide a sample Python function that:
   1.  Retrieves the database credentials from the secret ARN passed via environment variables.
   2.  Establishes a connection to the PostgreSQL database (include placeholder logic).
   3.  Returns a `200 OK` JSON response, e.g., `{'status': 'success', 'message': 'Connected to DB'}`.
-   **Dependencies (`lambda/requirements.txt`)**: The Lambda function requires the `psycopg2-binary` and `aws-secretsmanager-caching` libraries.


### 4.6. API Gateway
-   **Type**: REST API.
-   **Integration**: Configure a **Lambda Proxy Integration**.
-   **Endpoint**: Create a resource `/api` with a `GET` method that triggers the Lambda function.
-   **CORS**: Enable CORS for all origins (`*`) to allow a web frontend to call this API.
-   **Output**: The CDK stack should output the final API Gateway endpoint URL.


---


## 5. Required Project Structure and File Contents


Generate the project with the following directory structure and provide the complete code for each file.


```
my-serverless-app/
├── bin/
│   └── my-serverless-app.ts
├── lib/
│   └── my-serverless-app-stack.ts
├── lambda/
│   ├── handler.py
│   └── requirements.txt
├── .gitignore
├── cdk.json
├── package.json
├── README.md
└── tsconfig.json
```


---


## 6. `README.md` File Requirements


The generated `README.md` file must be comprehensive and include the following sections:


1.  **Project Description**: A brief overview of the serverless application infrastructure.
2.  **Prerequisites**: A list of required tools to be installed (e.g., AWS CLI, AWS CDK, Node.js, Python).
3.  **Setup & Installation**: Step-by-step instructions on how to clone the repository, install npm dependencies (`npm install`), and install Python dependencies for the Lambda function.
4.  **Deployment**: Clear instructions on how to deploy the stack (`cdk bootstrap`, `cdk deploy`).
5.  **Testing**: Instructions on how to test the deployed infrastructure. This should include:
   -   How to find the API Gateway endpoint URL from the CDK output.
   -   A sample `curl` command to test the `/api` endpoint.
6.  **Cleanup**: The command to destroy the stack (`cdk destroy`).


---


## 7. Final Instructions


-   Generate a single response containing the complete file structure and code as specified.
-   Do not omit any files.
-   Ensure the TypeScript code is type-safe and follows modern syntax.
-   The final CDK project must synthesize (`cdk synth`) and deploy (`cdk deploy`) successfully.