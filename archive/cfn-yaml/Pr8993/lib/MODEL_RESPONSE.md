# MODEL_RESPONSE.md

## Title: **CloudFormation-Based Multi-Region Deployment of DynamoDB with Region-Specific Capacity and Intrinsic Referencing**

---

##   Problem Summary

The goal of this implementation is to design, parameterize, and validate CloudFormation templates that **deploy Amazon DynamoDB tables in multiple AWS regions**, each with its **own capacity configuration**, while ensuring **correct use of CloudFormation intrinsic functions** like `Fn::GetAtt`, `Ref`, and `Fn::ImportValue`. The implementation must ensure successful stack deployment, accurate resource referencing, and reusable infrastructure-as-code.

---

##   Architecture Overview

### 1. **Infrastructure Topology**

```
+----------------------------+       +----------------------------+
|    CloudFormation Stack    |       |    CloudFormation Stack    |
|       Region: us-west-1    |       |       Region: us-west-2    |
|                            |       |                            |
| +----------------------+   |       | +----------------------+   |
| |  DynamoDB Table      |   |       | |  DynamoDB Table      |   |
| |  Read: 5             |   |       | |  Read: Param-Based   |   |
| |  Write: 5            |   |       | |  Write: Param-Based  |   |
| +----------------------+   |       | +----------------------+   |
|                            |       |                            |
| Exports: TableName, ARN    |       | Imports (optional)         |
+----------------------------+       +----------------------------+
```

---

##   Stack Design

###   Stack 1: `us-west-1` Region

- **Template Name**: `dynamodb-us-west-1.yaml`
- **Table Configuration**:
  - `ReadCapacityUnits`: 5 (fixed)
  - `WriteCapacityUnits`: 5 (fixed)
- **Outputs**:
  - `TableName` (Exported)
  - `TableArn` (Exported using `Fn::GetAtt`)

###   Stack 2: `us-west-2` Region

- **Template Name**: `dynamodb-us-west-2.yaml`
- **Table Configuration**:
  - `ReadCapacityUnits`: parameterized
  - `WriteCapacityUnits`: parameterized
- **Inputs**:
  - Accepts `ReadCapacity` and `WriteCapacity` as parameters
- **Outputs**:
  - `TableName`
  - `TableArn`
- **References**:
  - Demonstrates usage of `Fn::ImportValue` to import values from the `us-west-1` stack (optional but included to show inter-stack referencing)

---

##    Implementation Highlights

###   Parameters (in `us-west-2.yaml`)

```yaml
Parameters:
  ReadCapacity:
    Type: Number
    Default: 10
    Description: Read capacity units for DynamoDB table

  WriteCapacity:
    Type: Number
    Default: 5
    Description: Write capacity units for DynamoDB table
```

###   Use of Intrinsic Functions

| Function         | Used For                                               | Template              |
|------------------|--------------------------------------------------------|-----------------------|
| `Ref`            | Referencing parameters (`ReadCapacity`, `WriteCapacity`) | `us-west-2.yaml`      |
| `Fn::GetAtt`     | Getting `Arn` of DynamoDB table                         | Both templates        |
| `Fn::Sub`        | Dynamic naming and tagging                              | Both templates        |
| `Fn::ImportValue`| Referencing exported outputs from another stack         | `us-west-2.yaml`      |
| `Export`         | Exporting `TableName` and `Arn` for cross-stack use     | `us-west-1.yaml`      |

---

##   Validation Strategy

###   Linting

- All templates validated using `cfn-lint` to ensure CloudFormation syntax correctness and resource support.

###   CloudFormation Validation

- Templates tested using:
  - AWS Console stack deployment
  - AWS CLI:  
    ```sh
    aws cloudformation deploy --template-file dynamodb-us-west-1.yaml --stack-name stack-west-1 --region us-west-1
    aws cloudformation deploy --template-file dynamodb-us-west-2.yaml --stack-name stack-west-2 --region us-west-2 --parameter-overrides ReadCapacity=20 WriteCapacity=10
    ```

###   IAM Permissions

Ensure the deploying identity (user/role) has the following permissions:
- `cloudformation:CreateStack`
- `dynamodb:CreateTable`
- `cloudformation:DescribeStacks`
- `cloudformation:GetTemplate`
- `cloudformation:DescribeStackResources`
- `cloudformation:ListExports`

---

##   Reusability & Extensibility

- Templates are parameterized and modular, allowing easy reuse across environments.
- Can be extended for:
  - Adding tags
  - Configuring auto-scaling for capacity
  - Enabling DynamoDB Streams
  - Creating global tables (future work)

---

##   Outputs

| Output Key | Description                                | Exported | Example Value                         |
|------------|--------------------------------------------|----------|----------------------------------------|
| `TableName`| Logical name of the created DynamoDB table | Yes      | `my-app-table-west1`                   |
| `TableArn` | ARN of the DynamoDB table                  | Yes      | `arn:aws:dynamodb:us-west-1:123456:...`|

---

##   Example Stack Parameters (us-west-2)

```sh
aws cloudformation deploy   --template-file dynamodb-us-west-2.yaml   --stack-name stack-west-2   --region us-west-2   --parameter-overrides ReadCapacity=30 WriteCapacity=15
```

---

##    Deployment Instructions

```sh
# Deploy stack in us-west-1
aws cloudformation deploy   --template-file dynamodb-us-west-1.yaml   --stack-name dynamodb-west1   --region us-west-1

# Deploy stack in us-west-2 with parameter overrides
aws cloudformation deploy   --template-file dynamodb-us-west-2.yaml   --stack-name dynamodb-west2   --region us-west-2   --parameter-overrides ReadCapacity=20 WriteCapacity=10
```

---

##   Success Criteria Checklist

| Criteria                                                   | Status |
|------------------------------------------------------------|--------|
| Valid CloudFormation templates (`cfn-lint`)                |       |
| Tables created in both `us-west-1` and `us-west-2`         |       |
| Region-specific capacities applied                         |       |
| Parameters working in `us-west-2`                          |       |
| Exports and cross-stack references functional              |       |
| Intrinsic functions used correctly and effectively         |       |
| IAM permissions sufficient and scoped                      |       |

---

##   References

- AWS CloudFormation Intrinsic Functions: [Docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html)
- AWS DynamoDB Resource Specification: [Docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-dynamodb-table.html)
- AWS CloudFormation Cross-Stack References: [Docs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-exports.html)

---

Let me know if you’d also like a corresponding `MODEL_FAILURES.md` with detailed failure case coverage and debug strategies.
