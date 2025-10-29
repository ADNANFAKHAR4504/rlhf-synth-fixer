Our online retail company has grown to where we're processing around 4,000 orders every day, and customers are constantly asking about their order status. Right now, we're manually sending updates or relying on basic email notifications, which just isn't cutting it anymore.

We need to build a proper SMS notification system that can automatically send order updates to customers when their status changes - things like order confirmed, shipped, out for delivery, and delivered. The tricky part is that we need this to be cost-effective since SMS fees can add up quickly with our volume.

Here's what we're looking for:
- Reliable SMS delivery that won't fail during peak shopping periods
- Ability to track which messages were successfully delivered and which failed
- A fallback option (probably email) when SMS doesn't work
- Proper logging so we can troubleshoot issues and see delivery patterns
- Integration with our existing order management system
- Security measures to protect customer data and prevent unauthorized access

We're planning to use AWS CDK with Python since that's what our team knows best. The initial thinking is to use SNS for the actual SMS sending, Lambda functions to handle the business logic, DynamoDB to store delivery logs, and CloudWatch for monitoring. We'd also want SES set up as the email fallback option.