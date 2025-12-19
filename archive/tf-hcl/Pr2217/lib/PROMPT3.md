# Another deployment headache - missing variable this time

Ugh, just when I thought I fixed the provider issue, now I'm hitting another snag with my Terraform deployment. 

## What went wrong this time?

I'm getting this error during the deploy stage:

```
Error: Reference to undeclared input variable

  on provider.tf line 19, in provider "aws":
  19:   region = var.aws_region

An input variable with the name "aws_region" has not been declared. This variable can be declared with a variable "aws_region" {} block.
```

## So what's the deal?

Looks like somewhere in my `provider.tf` file, I'm trying to use a variable called `aws_region` but I never actually declared it. It's like trying to use a nickname for someone you've never introduced!

The code is probably something like:
```hcl
provider "aws" {
  region = var.aws_region
}
```

But I forgot to define what `aws_region` actually is.

## Easy enough to fix

I just need to add a variable declaration somewhere, probably in a `variables.tf` file:

```hcl
variable "aws_region" {
  description = "Which AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}
```

## Why does this always happen?

You know how it is with infrastructure code - you think you've got everything set up correctly, then these little oversights trip you up. At least this one's a quick fix compared to some of the more mysterious Terraform errors I've encountered!

Anyone else find themselves constantly forgetting to declare variables? Just me? 