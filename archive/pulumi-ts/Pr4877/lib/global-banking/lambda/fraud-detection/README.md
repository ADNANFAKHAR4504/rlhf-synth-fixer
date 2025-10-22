Banking Fraud Detection Lambda
Real-time fraud detection Lambda function for global banking payment processing.
Overview
This Lambda function provides comprehensive fraud detection for banking transactions with:

ML-Based Detection: Integration with AWS Fraud Detector for machine learning predictions
Velocity Checks: Monitors transaction frequency (hourly/daily limits)
Geographic Analysis: Detects impossible travel and country-based risks
Amount Anomaly Detection: Identifies unusual transaction amounts
Device Fingerprinting: Tracks and analyzes device patterns
Behavioral Analysis: Learns customer patterns over time

Architecture
FraudDetectionHandler (Main Entry Point)
├── FraudDetectorService (AWS Fraud Detector ML)
├── RiskAnalysisService (Rule-Based Analysis)
│   ├── Velocity Risk Calculation
│   ├── Geographic Risk Analysis
│   ├── Amount Risk Analysis
│   └── Device Risk Analysis
└── GeoUtils (Geographic Calculations)
Runtime

Language: Java 17
Handler: com.banking.FraudDetectionHandler::handleRequest
Memory: 2048 MB
Timeout: 10 seconds

Prerequisites

Java 17 or later
Maven 3.6+
AWS CLI configured
AWS Fraud Detector configured (optional - falls back gracefully)

Build Instructions
1. Build the JAR
bashcd lambda/fraud-detection
mvn clean package
This creates target/fraud-detection-lambda-1.0.0.jar
2. Deploy with Pulumi
The Lambda is automatically deployed when you run:
bashpulumi up
The api-stack.ts file will:

Create the Lambda function
Configure VPC settings
Set up IAM roles and permissions
Enable X-Ray tracing
Create CloudWatch log groups

Environment Variables
Configured automatically by Pulumi:
VariableDescriptionExampleENVIRONMENTDeployment environmentprod, staging, devFRAUD_DETECTOR_NAMEAWS Fraud Detector namebanking-fraud-prod
Input Event Format
json{
  "transactionId": "txn_abc123",
  "customerId": "cust_xyz789",
  "amount": 1250.00,
  "currency": "USD",
  "merchantId": "merch_456",
  "merchantName": "Online Store",
  "merchantCategory": "RETAIL",
  "sourceCountry": "US",
  "destinationCountry": "US",
  "ipAddress": "203.0.113.45",
  "deviceId": "device_123",
  "deviceFingerprint": "fp_abc123",
  "userAgent": "Mozilla/5.0...",
  "paymentMethod": "CREDIT_CARD",
  "cardLast4": "4242",
  "cardBin": "424242",
  "timestamp": 1697500800000,
  "transactionType": "PURCHASE"
}
Output Response Format
json{
  "statusCode": 200,
  "transactionId": "txn_abc123",
  "fraudScore": 0.23,
  "riskLevel": "LOW",
  "approved": true,
  "requiresManualReview": false,
  "reasons": [],
  "processingTimeMs": 145
}
Risk Levels

LOW (0.0 - 0.44): Transaction approved automatically
MEDIUM (0.45 - 0.74): Manual review required
HIGH (0.75 - 1.0): Transaction blocked

Fraud Detection Features
1. Velocity Checks

Monitors transactions per hour (max 10)
Monitors transactions per day (max 50)
Calculates velocity risk score

2. Geographic Analysis

Impossible travel detection (>500km in 1 hour)
High-risk country detection
Location pattern analysis

3. Amount Anomaly Detection

Compares to customer's average transaction
Flags transactions >2x average
Higher risk for >5x average

4. Device Analysis

New device detection
Multiple device usage tracking
Bot/automated traffic detection

5. ML Integration

AWS Fraud Detector integration
Composite scoring model
Graceful fallback if ML unavailable

Scoring Model
Composite fraud score calculated as:
Score = (ML * 0.50) + (Velocity * 0.20) + (Geo * 0.15) + (Amount * 0.10) + (Device * 0.05)
With multipliers for:

High-risk countries: 1.3x
VPN/Proxy detected: 1.2x

AWS Services Used

AWS Lambda: Serverless compute
AWS Fraud Detector: ML-based fraud detection
DynamoDB: Transaction history storage
CloudWatch: Metrics and logging
X-Ray: Distributed tracing
Secrets Manager: Secure credential storage
VPC: Network isolation

Monitoring
CloudWatch Metrics
Custom metrics published:

FraudScore: Fraud score for each transaction
ProcessingTime: Lambda processing time
ApprovedTransactions: Count of approved transactions
BlockedTransactions: Count of blocked transactions

CloudWatch Logs
Log groups created:

/aws/lambda/fraud-detection-{environment}

X-Ray Tracing
Segments tracked:

FraudDetection (main)
MLPrediction (AWS Fraud Detector)
RiskAnalysis (rule-based checks)
StoreFraudDecision (DynamoDB write)

Testing
Local Testing
Create a test event file test-event.json:
json{
  "transactionId": "test_001",
  "customerId": "customer_001",
  "amount": 500.00,
  "currency": "USD",
  "sourceCountry": "US",
  "ipAddress": "1.2.3.4",
  "deviceId": "device_001",
  "timestamp": 1697500800000,
  "transactionType": "PURCHASE"
}
Invoke locally (requires SAM CLI):
bashsam local invoke -e test-event.json
Unit Testing
bashmvn test
Security
IAM Permissions
The Lambda requires:

DynamoDB read/write access
Fraud Detector invoke access
Secrets Manager read access
CloudWatch logs write access
X-Ray write access

Data Protection

All data encrypted in transit (TLS)
DynamoDB encrypted at rest with KMS
CloudWatch logs encrypted with KMS
VPC isolation for network security

Performance

Cold Start: ~2-3 seconds
Warm Invocation: 100-300ms
Concurrent Executions: 50 reserved
Memory Usage: ~800MB average

Troubleshooting
High Fraud Scores
Check:

Customer transaction history in DynamoDB
X-Ray traces for detailed risk factors
CloudWatch logs for specific reasons

AWS Fraud Detector Errors

Lambda falls back to 0.5 (medium risk)
Check Fraud Detector configuration
Verify detector name matches environment variable

DynamoDB Throttling

Check provisioned capacity
Review transaction volume
Consider enabling auto-scaling

Production Considerations
Scaling

Increase reserved concurrent executions if needed
Monitor Lambda throttling metrics
Consider provisioned concurrency for predictable load

Monitoring

Set up CloudWatch alarms for high fraud scores
Monitor blocked transaction rates
Track processing time percentiles

Tuning

Adjust risk thresholds based on business requirements
Update high-risk country list as needed
Refine scoring model weights

Support
For issues or questions:

Check CloudWatch logs for errors
Review X-Ray traces for performance issues
Contact: banking-platform-team@example.com

License
Proprietary - Turing Banking Platform Team