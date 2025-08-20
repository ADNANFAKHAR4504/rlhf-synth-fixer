I need a real CI/CD pipeline built with AWS CDK v2 in TypeScript. The goal is simple: automate build and deployment for an enterprise web app, wire the AWS pieces together cleanly, and keep security tight without getting cute.

What I expect in the stack:

* CodePipeline runs the show from source to deploy.
* CodeBuild handles a standard web app build (install deps, run tests if present, produce artifacts).
* CodeDeploy rolls out to multiple EC2 instances (assume theres already an Auto Scaling group or deployment group you can target; if not, stub whats reasonable and make it clear in comments).
* Add a Lambda step inside the pipeline for custom validation right before production. If the check fails, the pipeline fails. Keep the Lambda minimal and locked down.
* Send notifications through SNS for pipeline stage changes (success/failure). Subscriptions arent your problem here, but publishing from the pipeline is.
* Put a manual approval gate before the prod deploy.
* Make it cross-region friendly: the pipeline can live in one region and deploy to another. Handle artifacts and actions so that still works.
* Config and secrets come from SSM Parameter Store. No hard-coding. Read them at runtime in the stack and in build/deploy where needed.
* Tag everything the stack creates with `Environment: Production`.
* IAM: least privilege everywhere (pipeline, build, deploy, Lambda). Avoid wildcards unless theres no sane alternative, and scope to specific resources.

A few assumptions to keep you moving:

* VPCs, subnets, and any enterprise networking are already there. Dont create them.
* You can assume existing IAM boundaries and guardrails; stick to inline or narrowly scoped managed policies you define in this stack.
* If you need names/ARNs for existing things (ASG, CodeDeploy app/group, KMS keys), pull them from SSM parameters. If something truly must be created here, keep it minimal and call it out in a comment.

What to hand back:

* One TypeScript file that defines the whole CDK stack. Include imports. Add clear comments explaining why each piece exists and how they connect.
* Keep the code tidy and easy to extend. Small constructs > one monster file with magic.
* A sample `cdk.json` that works for this stack.
* Short deployment notes: init, bootstrap (if needed), synth, deploy. Nothing fancyjust enough for a teammate to get it running.

Hints so we dont argue later:

* Prefer CDK idioms over shell hacks in buildspecs.
* Use pipeline notifications at the stage level, not ad-hoc logs nobody reads.
* If you hit a fork in the road, pick the simpler path and leave a TODO with a one-liner explaining the trade-off.

Thats it. Build something we can live with and maintain.