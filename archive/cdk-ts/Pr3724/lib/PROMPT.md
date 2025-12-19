Act as an expert AWS CDK engineer using TypeScript (v2). Your task is to create a complete CDK stack that deploys a secure and scalable REST API for a payment processing system.

The stack must be configured for the `us-west-2` region and all resources should have a `RemovalPolicy` of `DESTROY` for this non-production environment.

The stack must contain the following components:

1. Lambda Functions:

- Create two `aws-lambda-nodejs.NodejsFunction` constructs:
  - A `paymentsHandler` with placeholder code for handling POST requests.
  - A `transactionsHandler` with placeholder code for handling GET requests.
- Both functions must be configured with:
  - `runtime`: `lambda.Runtime.NODEJS_18_X`
  - `architecture`: `lambda.Architecture.ARM_64`
  - `memorySize`: 512
  - `timeout`: `cdk.Duration.seconds(30)`

2. API Gateway (REST API):

- Create an `aws-apigateway.RestApi` with the following properties:
  - `restApiName`: 'PaymentProcessingApi'
  - `deployOptions`:
    - `stageName`: 'prod'
    - `loggingLevel`: `apigateway.MethodLoggingLevel.INFO`
    - `dataTraceEnabled`: `true`
  - `defaultCorsPreflightOptions`:
    - `allowOrigins`: `apigateway.Cors.origins(['https://*.example.com'])`
    - `allowMethods`: `apigateway.Cors.ALL_METHODS`

3. API Endpoints & Lambda Integrations:

- Create a `/payments` resource on the API. Add a `POST` method and integrate it with the `paymentsHandler` using an `apigateway.LambdaIntegration`.
- Create a `/transactions` resource on the API. Add a `GET` method and integrate it with the `transactionsHandler`.
- Crucially, set `apiKeyRequired: true` on both the `POST` and `GET` methods.

4. API Key and Usage Plan:

- Create an `apigateway.ApiKey`.
- Create an `apigateway.UsagePlan` with the following configuration:
  - `throttle`: `{ rateLimit: 10, burstLimit: 20 }`
  - `quota`: `{ limit: 1000, period: apigateway.Period.DAY }`
- Associate the `prod` API stage with this usage plan.
- Add the created API key to the usage plan.

5. Custom Domain Name:

- (Assume an ACM Certificate and a Route 53 Hosted Zone already exist).
- Create an `apigateway.DomainName` with an `endpointConfiguration` of type `apigateway.EndpointType.EDGE`.
- Map this domain to your API using an `apigateway.BasePathMapping`.

6. Stack Outputs:

- Create a `CfnOutput` to export the `invokeUrl` of the API's `prod` stage.
- Create another `CfnOutput` to export the ID of the created API Key.

Ensure the final output is a single, complete, and well-structured CDK stack file in TypeScript.
