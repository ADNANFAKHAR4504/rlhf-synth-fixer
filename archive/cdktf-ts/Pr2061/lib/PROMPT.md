We’re setting up a CDKTF project that manages three environments in AWS: development, staging, and production. Each of these environments should live in its own stack so they’re isolated and easy to manage on their own. At the same time, we want to make sure the underlying structure is consistent, so deployments follow the same baseline design everywhere.

Here’s what the setup needs to handle:

- Create three separate stacks (dev, staging, prod) with a consistent architecture but environment-specific differences where needed.
- Define IAM roles and policies that follow least privilege — keep them tight, and make sure each environment only gets what it needs.
- Any environment-specific settings (like instance sizes, subnet IDs, or region settings) should be parameterized instead of hardcoded, so we can adjust without editing the code itself.
- Add AWS health checks and logging for each environment to keep visibility into activity and help with troubleshooting.
- Make sure the whole setup is written in TypeScript with CDKTF, runs validation without errors, and is deployable in us-west-2.
- Tag everything properly so we know which environment and project a resource belongs to.

The end goal is a CDKTF solution that gives us clean separation between dev, staging, and prod, applies least privilege security, keeps configs flexible through parameters, and has the right monitoring built in. It should be reliable, scalable, and easy to maintain going forward.
