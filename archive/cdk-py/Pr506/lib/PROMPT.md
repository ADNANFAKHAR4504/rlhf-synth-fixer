Deploy an application using AWS CDK with Python in the us-east-1 region. The deployment should include:

    An Auto Scaling Group configured with a minimum of 1 instance and a maximum of 3 instances.

    An Elastic Load Balancer that distributes incoming traffic evenly across all instances. No Https, Only Http

    Application logs stored securely in an S3 bucket.

    EC2 instances launched with a specific IAM role that grants necessary permissions to access the S3 bucket for logging.