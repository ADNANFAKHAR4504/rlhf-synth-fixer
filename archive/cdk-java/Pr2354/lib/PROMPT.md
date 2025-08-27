I need help setting up a basic cloud environment for my new startup project using AWS CDK with Java. We're a small team of 3 developers working on a web application, and I'm trying to get our core infrastructure in place without breaking the bank.

Here's what I'm looking for:

I need an S3 bucket where we can store our application assets and user uploads. The bucket should have versioning enabled since we've had issues with accidentally overwriting files in the past. I want to allow public read access for our static assets, but obviously need to restrict write access to only authorized users - security is important to us even though we're just starting out.

For our database, I'm planning to use RDS with MySQL. We don't need anything fancy yet, just something reliable with automatic backups. I've been reading that gp2 storage should be fine for our current needs, and I want to make sure we have at least a week's worth of backups in case something goes wrong. We're targeting the us-west-2 region since most of our initial users will be on the West Coast.

I also need to set up a Lambda function that will handle some background processing tasks. The function code should live in the S3 bucket I mentioned earlier - this seems like a clean way to organize everything. I'm still learning about IAM roles and policies, but I know the Lambda needs proper permissions to access the S3 bucket and potentially the database.

One thing I'm really interested in are some of the newer AWS features that might help us. I've been hearing about AWS Application Composer for visualizing infrastructure and Amazon EventBridge Scheduler for handling time-based tasks. Even if we don't use them immediately, I'd love to understand how they might fit into our architecture as we grow.

The whole setup needs to be easily deployable since we're planning to have separate environments for development, staging, and eventually production. I'd like to have proper outputs from the stack so we can reference the S3 bucket name and other resources in our application code and testing.

Can you help me create the CDK Java code for this infrastructure? I'm comfortable with Java but still getting familiar with CDK concepts, so any best practices would be appreciated.