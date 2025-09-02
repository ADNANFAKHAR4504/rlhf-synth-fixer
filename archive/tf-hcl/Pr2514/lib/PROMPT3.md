# Still incomplete! Need the REST of the Terraform code

Come on, this is the second time the response cuts off! MODEL_RESPONSE2.md stops at line 984 with:

```
# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-
```

And then just... nothing. It's cut off mid-line!

## What's STILL missing:

1. **CloudWatch alarms are incomplete** - Low CPU alarm is cut off mid-line
2. **No RDS monitoring alarms** - Need database CPU, connections, freeable memory alarms
3. **No user_data.sh file** - The launch template references it but it's missing
4. **Missing outputs section** - Need all the important resource outputs
5. **No SNS notifications** - Alarms should notify somewhere
6. **Incomplete variables** - Some variables might be missing

## What I need RIGHT NOW:

Just give me the **REMAINING CODE** that continues from line 984. Don't start over, just pick up where you left off and complete the file!

I need:

### Complete the CloudWatch section:
- Finish the low CPU alarm that's cut off
- Add RDS monitoring alarms (CPU, connections, freeable memory)  
- Add ALB monitoring alarms (target response time, unhealthy targets)
- Add SNS topic for notifications

### Add the user_data.sh file:
- Bootstrap script for EC2 instances
- Install web server (nginx/apache)
- Configure CloudWatch agent
- Set up application logging
- Connect to RDS database

### Complete outputs section:
- ALB DNS name
- CloudFront domain
- S3 bucket name  
- RDS endpoint
- VPC ID
- All the important stuff I'll need

### Add any missing variables:
- Notification email for alarms
- Any other variables needed

## Just give me the missing parts!

Starting from:
```hcl
# CloudWatch Alarm - Low CPU (COMPLETE THIS)
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-low-cpu"
  # CONTINUE FROM HERE...
```

Then add all the other missing stuff after that. 

I don't want another incomplete response. Give me EVERYTHING that's missing in one shot. The file should be complete and deployable when you're done.

And please include the user_data.sh file content as well - not just a reference to it!