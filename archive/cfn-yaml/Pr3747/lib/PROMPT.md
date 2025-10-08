We need a master CloudFormation template in YAML to deploy the backend infrastructure for our new e-commerce platform. This single template needs to handle all our environments—dev, test, and production—just by changing the input parameters. This will be our "golden template" for the platform.

Instead of putting all the configuration inside the template, let's use a configuration-driven approach. The template should expect an Environment parameter (e.g., 'dev' or 'prod'). Based on this, it should fetch a corresponding JSON configuration file (e.g., dev.json) from a central S3 bucket. This config file will provide all the environment-specific values.

The template will then create a new, isolated VPC for the environment. Inside this VPC, it will set up an Auto Scaling group of EC2 instances behind an Application Load Balancer. This is where our storefront API and order processing logic will run. The instance type and scaling limits should be pulled from the S3 config file, allowing us to use small t3.micro instances for dev and larger, more powerful instances for production to handle customer traffic.

For the data tier, provision a separate RDS instance to store our product catalog, customer data, and orders. This database must be in a private subnet. The instance class will also be configurable via the S3 file. The database password and other sensitive data, like the API keys for our payment processor, must come from AWS Secrets Manager. The template should look up the secret by a name that includes the environment (e.g., /ecommerce/prod/PaymentProcessorKey).

For application access, the template needs to create a Route 53 record, like api-prod.our-ecomm-store.com, that points to the ALB. The subdomain will be based on the environment.

On the security side, turn on CloudTrail for auditing, and ensure all data in S3 and RDS is encrypted at rest using a dedicated KMS key for that environment. We'll also need a CloudWatch alarm on the EC2 instances' CPU, and the alarm's threshold should be configurable from the S3 file. Any alerts should go to an environment-specific SNS topic that will eventually feed into the e-commerce team's on-call Slack channel.

The deliverable is the single, master CloudFormation YAML template that can build this entire stack based on the Environment parameter and the corresponding config file it fetches from S3.
