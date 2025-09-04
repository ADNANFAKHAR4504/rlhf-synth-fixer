Hi team,

We're launching our customer portal next month and need the AWS infrastructure set up ASAP. Marketing is expecting heavy traffic from our Black Friday campaign, so we need something that won't crash under load.

Here's what we need:

Our web app needs to handle at least 10,000 concurrent users during peak times. The backend team says we need multiple servers running so if one goes down, customers can still place orders. They want everything in us-east-1 since that's where our current systems are.

The database is critical - we can't lose customer orders or payment data. Finance department requires full audit trails and monitoring on everything. They're also asking for proper cost tracking tags so they can allocate expenses to the marketing budget.

Security team insists on:
- Separate network zones for web servers and database  
- No direct internet access to the database
- All logs must be centralized for compliance audits
- Proper backup and disaster recovery

The dev team wants to store product images and static files separately from the main app servers to improve performance. They're also asking for some kind of container orchestration to make deployments easier - they mentioned something about Kubernetes being the new standard.

Oh, and legal wants us to explore that new AWS feature for sharing customer analytics with our retail partners without exposing raw data - something about "Clean Rooms"? Not sure if we'll use it immediately but good to have the option.

Budget is approved but keep costs reasonable. We're a growing startup, not Amazon. :)

Can you get this infrastructure ready by end of week? The dev team is blocked waiting for the environment.

Thanks!
Sarah Chen  
VP Engineering
