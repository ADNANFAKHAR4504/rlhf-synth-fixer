The design still targets a two-region setup with us-east-1 and us-west-2 for resilience.  

The code should be organized so that stacks and their properties can be reused and tested.  
Any missing classes (for example TapStack or TapStackProps) must be implemented so that the unit tests compile and pass.  

The pipeline should succeed through linting, testing, synth, and deployment, with coverage for VPC, ASG, ALB, RDS, S3, IAM, alarms, and Route 53 records.
