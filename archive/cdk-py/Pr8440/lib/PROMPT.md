# Task: Develop a Scalable and Cost-Effective Serverless Platform using AWS CDK and Python

As a Cloud Infrastructure Developer, your task is to design and implement a robust, scalable, and cost-optimized serverless infrastructure on AWS. This platform will serve as the foundation for deploying Python-based serverless functions, ensuring high performance, centralized logging, and integrated monitoring.

The solution must be implemented using **AWS Cloud Development Kit (CDK) with Python** and adhere to the following specifications:

### Technical Requirements

* **Technology Stack:** The infrastructure code must be written in Python using the AWS CDK framework.
* **Deployment:** The entire infrastructure must be deployable with a single CDK command (`cdk deploy`).
* **Function Language:** The deployed serverless functions must be written in **Python 3.8 or a higher version**.
* **Regional Deployment:** All resources must be provisioned within the `us-east-1` AWS region.
* **Performance & Scalability:**
    * The infrastructure must be capable of handling a sustained workload of **1000 requests per second** for each deployed function without any performance degradation.
    * Each function must be configured to automatically scale its concurrent instances from a minimum of **1 to a maximum of 50** based on demand.
* **Logging:**
    * A centralized logging solution must be configured using AWS CloudWatch.
    * All function logs must be streamed to CloudWatch Logs with a latency of **less than one second**.
* **Monitoring & Observability:**
    * The infrastructure must facilitate integration with a third-party monitoring tool (e.g., Datadog).
    * Metrics and custom data points from the functions should be sent to the third-party service at a regular interval of **1 minutes**.
* **Cost Optimization:**
    * The design and implementation must incorporate cost-saving measures to ensure the total monthly bill for this infrastructure does not exceed **$1000** under maximum load conditions. This may involve using appropriate AWS Lambda memory configurations, provisioned concurrency strategies, or other cost-effective practices.

***

### Expected Output

You are required to deliver a complete, self-contained AWS CDK project. The repository structure should include:

1.  A Python-based AWS CDK application named `serverless_infrastructure_stack.py` that defines all the required resources.
2.  Clear and well-documented code that explains the purpose of each resource and the reasoning behind architectural decisions.
3.  A `README.md` file in the root of the project that provides:
    * A high-level overview of the architecture.
    * Instructions on how to set up the environment and deploy the infrastructure using CDK.
    * Details on how to integrate the third-party monitoring tool.
4.  A suite of **unit tests** to validate the configuration of key components, such as auto-scaling settings, Python runtime versions, and the centralized logging setup.
5.  All necessary dependency files (`requirements.txt`, `cdk.json`) to ensure the project is fully reproducible.