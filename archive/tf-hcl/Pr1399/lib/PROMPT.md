---

### Okay, Let's Get Our AWS Environments Sorted!

Hey, can you help us with something? We need to clean up our **Terraform setup** for our AWS cloud environments. We've got production, staging, and development, and the main thing is to make sure everything's consistent but also stays separate.

Here's what we need:

- **Separate files for each environment**: We need a way to keep the setup for dev, staging, and prod totally distinct. Think of it like giving each one its own special folder for its "state" files.
- **Shared backend**: We want to store those "state" files in a shared place, but it needs to be secure. For AWS, that's S3 with DynamoDB for locking. This just helps everyone on the team work together smoothly.
- **Easy switching**: When we're working on one environment, Terraform should know exactly which setup to use without us having to manually change things around.
- **No hardcoding**: Don't put any environment details (like "this is the dev database") directly into the main Terraform code. Keep it flexible.
- **Secure secrets**: Any sensitive stuff, like passwords or API keys, needs to be handled securely. Use something like AWS Secrets Manager, or whatever Terraform has built in for that.
- **Reusable parts**: Let's make sure we're using Terraform modules. That way, we can reuse parts of the configuration across all our environments without copying and pasting.

We're focusing on AWS for this, mainly in the 'us-west-2' region.

What we need back is the Terraform config files. They should do all this stuff right and pass any checks for being clean and isolated.

├── outputs.tf
├── provider.tf
└── tap_stack.tf

Above is my directory structure. Can you help me with what the contents of tap_stack.tf and provider.tf it should be modular
