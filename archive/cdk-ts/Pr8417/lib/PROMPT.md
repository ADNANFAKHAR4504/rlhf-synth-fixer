I need help creating a serverless infrastructure using AWS CDK with TypeScript that can handle high-traffic workloads. Here are my requirements:

1. Deploy Python 3.8+ serverless functions that can automatically scale from 1 to 50 concurrent instances based on demand
2. Handle 1000 concurrent requests per second per function without performance issues
3. Set up centralized logging through CloudWatch with less than 1-second latency for all logs
4. Enable integration with third-party monitoring services that send metrics every 30 seconds
5. Implement cost optimizations to keep monthly expenses under $1000 even at peak usage
6. Use AWS CloudWatch Application Signals for application performance monitoring
7. Include AWS Lambda SnapStart for cold start optimization where applicable

The infrastructure should be deployable using CDK commands and include proper auto-scaling, monitoring, and cost controls. Please provide the infrastructure code with one code block per file.
