# Hey, I'm having trouble with my Terraform deployment

I'm trying to deploy my infrastructure and running into this annoying issue. Thought I'd document it here in case someone else runs into the same problem.

## What I was trying to do

I was just running the usual bootstrap script to get my environment set up:

```bash
./scripts/bootstrap.sh
```

Everything seemed to be going fine at first. The bootstrap process started normally, detected my Terraform project, and even successfully configured the S3 backend. I was feeling pretty good about it!

## Then things went sideways...

Right when I thought everything was working, Terraform threw this error at me:

```
Error: Duplicate provider configuration

  on tap_stack.tf line 1:
   1: provider "aws" {

A default (non-aliased) provider configuration for "aws" was already given at provider.tf:18,1-15. If multiple configurations are required, set the "alias" argument for alternative configurations.
```

## What's happening here?

So basically, I've got two AWS provider blocks defined in my code:
- One in `provider.tf` around line 18
- Another one in `tap_stack.tf` at line 1

Terraform doesn't like this because it doesn't know which provider configuration to use. It's like having two steering wheels in a car - confusing and problematic!

## The fix should be pretty straightforward

I need to either:
1. Remove one of the duplicate providers (probably the simpler option)
2. Or add an alias to one of them if I really need both for some reason

Has anyone else run into this before? I feel like this is probably a common mistake when working with multiple Terraform files.