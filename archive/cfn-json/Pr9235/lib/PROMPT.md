We need to build a CloudFormation template for our Task Assignment Platform infrastructure. The main requirement is a DynamoDB table that applications can connect to for storing and retrieving task data across different environments without conflicts. I want this to be simple, destroyable for testing, and follow standard AWS patterns.

## What we need

Create a CloudFormation template in JSON format that provisions a DynamoDB table for storing turnaround prompts. The CloudFormation stack will provision the DynamoDB table and manage its lifecycle through stack operations. Applications will connect to this DynamoDB table using the AWS SDK to read and write task assignment data, with the table name dynamically determined by the environment suffix.

### Requirements

#### Template Structure

- CloudFormation format version should be 2010-09-09
- Add a description: "TAP Stack - Task Assignment Platform CloudFormation Template"
- Include parameter grouping in the Metadata section so the AWS Console shows it nicely
- Group the environment parameter under "Environment Configuration"

#### Parameters

- We need an EnvironmentSuffix parameter
  - Type: String
  - Default to "dev"
  - Description should explain it's for environment naming like dev, staging, prod
  - Only allow alphanumeric characters with a regex pattern
  - Add a constraint message telling users it must be alphanumeric

#### DynamoDB Table

- Call it TurnAroundPromptTable
- Table name should include the environment suffix using string substitution
- The table will store prompt data with an id as the primary identifier
- Set up a simple key schema:
  - Attribute name is "id"
  - Attribute type is String
  - Use it as the HASH key
- Use PAY_PER_REQUEST billing mode since we don't know traffic patterns yet
- Make sure deletion protection is turned on
- Set DeletionPolicy to Delete so we can clean up test environments
- Set UpdateReplacePolicy to Delete as well
