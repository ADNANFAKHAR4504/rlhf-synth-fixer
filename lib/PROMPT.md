There is a task is to generate a comprehensive AWS CloudFormation template in JSON format.

The architecture must be designed to meet the following specific functional and non-functional requirements. Ensure these details are reflected in the resource properties of the generated CloudFormation template.

Core Platform Requirements & Constraints:
Trading Volume: Support for 890,000 carbon credits traded annually.
Transaction Throughput: Process 45,000 trades annually.
Performance: Achieve trade matching in under 500ms.
Security & Immutability: Implement double-spending prevention using a distributed ledger and maintain an immutable transaction history.
Compliance: Achieve regulatory compliance with major carbon standards (e.g., VCS, Gold Standard) and provide a verifiable audit trail.

Core Features:
Enable credit retirement and transfer tracking.
Automate verification workflows involving third-party validators.
Classify credits by vintage year and project type.
Implement a bid/ask order book for price discovery.
Generate certificates with unique QR codes.
AWS Service Configuration Details:
Based on the requirements above, create the CloudFormation resources with the following specifications:

AWS Managed Blockchain:
Create a Hyperledger Fabric blockchain network.
Provision a member and a single bc.t3.small peer node for the network. This will serve as the distributed ledger for tracking credit ownership, retirement, and preventing double-spending.

Amazon DynamoDB:
TradeTable: A table to store the bid/ask order book and trade records.
Primary Key: TradeID (String).
Attributes: Include CreditID, Status (e.g., 'OPEN', 'CLOSED'), Type (e.g., 'BUY', 'SELL'), Price, Quantity, VintageYear, ProjectType, and CarbonStandard.
Provisioning: Configure with provisioned throughput and auto-scaling to handle the trading volume and meet the sub-500ms matching latency requirement.

CertificateTable: A table to index certificate data.
Primary Key: CertificateID (String).
Attributes: Include CreditID, OwnerID, IssueDate, and S3Path for the certificate file.

AWS Lambda:
TradeMatchingEngineFunction: The core logic for matching buy and sell orders from DynamoDB. It should be triggered by new entries in the TradeTable.
ApiGatewayHandlerFunction: A function to handle incoming API requests for creating orders, checking status, etc.
CertificateGenerationFunction: A function to generate trade certificates (with QR codes) and store them in the S3 bucket.
QLDBAuditLoggerFunction: A function that logs every confirmed trade and state change to the QLDB ledger.

IAM Roles: For each Lambda function, create an execution role with the principle of least privilege. Grant precise permissions to interact with the necessary services (e.g., DynamoDB read/write, S3 put object, QLDB send command, Managed Blockchain invoke).

Amazon API Gateway:
Create a REST API to serve as the front door for trading activities.
Define resources and methods like POST /trade and GET /trade/{id}.
Integrate these endpoints with the ApiGatewayHandlerFunction.

Amazon S3:
Create a private S3 bucket to securely store the generated carbon credit certificates.

Enable server-side encryption (AES256) and bucket versioning.
Amazon QLDB (Quantum Ledger Database):

Provision a QLDB ledger named CarbonPlatformAuditTrail.
This ledger will be used to maintain a cryptographically verifiable and immutable history of all transactions for regulatory and audit purposes.

AWS Step Functions:
Create a VerificationStateMachine to orchestrate the multi-step verification workflow for new carbon credit projects. This state machine will coordinate a series of Lambda functions that manage interactions with third-party validators.

Output Format:
The final output must be a single, valid, and well-formatted CloudFormation JSON template. Do not include any explanations, comments, or conversational text outside of the JSON structure itself.