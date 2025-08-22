**Act as an expert AWS Cloud Development Kit (CDK) architect and a senior TypeScript developer.** Your mission is to write a complete, production-ready AWS CDK application in a single file that defines and deploys a multi-region infrastructure. The code must be well-structured, thoroughly commented, and ready for deployment.

**The infrastructure requirements are as follows:**

1.  **Multi-Region Deployment:** The CDK application must deploy resources to both the `'us-west-1'` and `'us-west-2'` AWS regions. Each region should have a dedicated CDK Stack.
2.  **Isolated DynamoDB Tables:** Create a distinct Amazon DynamoDB table in each of the two regions.
3.  **Configurable Capacity:**
    * The DynamoDB table in the `'us-west-1'` region must have a fixed read capacity of **5** and a fixed write capacity of **5**.
    * The DynamoDB table in the `'us-west-2'` region must have its read and write capacities defined by runtime parameters. The CDK application should use a `CfnParameter` to allow users to specify these values at deployment time.
4.  **Resource Connection & Permissions:**
    * In each region, create an AWS Lambda function with a Node.js runtime.
    * Each Lambda function must be granted specific, fine-grained IAM permissions to interact with its corresponding local DynamoDB table. Specifically, the Lambda in `'us-west-1'` should have write permissions to the `'us-west-1'` table, and the Lambda in `'us-west-2'` should have write permissions to the `'us-west-2'` table. The permissions should be restricted to `dynamodb:PutItem`, `dynamodb:UpdateItem`, and `dynamodb:DeleteItem`.

**Expected Output:**

Provide the complete and executable TypeScript code for the CDK application in a single file. The code should include all necessary imports and be structured logically to be deployed with the `cdk deploy` command. Ensure the code is self-contained and demonstrates best practices for resource linking and permission management.