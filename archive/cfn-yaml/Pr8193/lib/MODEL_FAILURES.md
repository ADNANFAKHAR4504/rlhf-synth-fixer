# Ideal Response Features

### 1. Omits the RoleName property

- Allows the template to be deployed with only `CAPABILITY_IAM`.

---

### 2. Resource and Output Consistency

#### Model Response Issues:

- Some outputs reference resources that are not used by the Lambda functions or API Gateway.

#### Ideal Response Features:

- Only includes resources that are required and referenced by other stack components.
- All outputs are relevant for cross-stack integration or debugging.

---

### 3. Parameterization and Naming

#### Model Response Issues:

- The model used both `EnvironmentSuffix` and `EnvironmentName` in different places, leading to inconsistency.
- Some resource names or outputs did not include the environment suffix, risking name collisions across environments.

#### Ideal Response Features:

- Consistent parameterization for all environment-specific resources and outputs.

---

### 4. API Gateway Resource Wiring

#### Model Response Issues:

- The model only created a single resource (`/requests`) and attached two methods (`GET`/`POST`), but did not provide any stage variables, usage plans, or authorization options.
- No explicit deployment triggers for API Gateway (e.g., `DependsOn` for methods in the deployment resource).

#### Ideal Response Features:

- Ensures deployment is triggered after all methods.
- Allows for additional configuration (e.g., CORS, usage plans, authorizers) if needed.

---

### 5. Lambda Environment Variables

#### Model Response Issues:

- Only one Lambda function (`LambdaFunction1`) had the DynamoDB table name in its environment variables; the second did not, even though it might need it for writes/reads.

#### Ideal Response Features:

- All Lambda functions that need to access DynamoDB have the correct environment variables.

---

### 6. DynamoDB Table Structure

#### Model Response Issues:

- The main DynamoDB table (`DynamoDBTable`) uses a key named `RequestId`, but the sample table (`TurnAroundPromptTable`) uses `id`. This inconsistency could cause confusion for developers.

#### Ideal Response Features:

- Consistent naming for primary keys across all DynamoDB tables.

---

### 7. Least Privilege IAM Policy

#### Model Response Issues:

- The Lambda execution role's DynamoDB permissions are granted for all tables (`Resource: '*'`), not just the specific table needed.

#### Ideal Response Features:

- Limits DynamoDB permissions to only the required table(s).
