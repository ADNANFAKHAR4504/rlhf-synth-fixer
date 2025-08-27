# MODEL_FAILURES.md

## Summary

The model produced a **Pulumi Java** program that creates a VPC, two public subnets in different AZs, an Internet Gateway, a public route table with a default route, and associations—**broadly matching the requested network**. However, it **falls short of the ideal** by not pinning the AWS region via a provider, exporting only a minimal set of outputs, and omitting some structure and tags that aid downstream integration and observability.

## What the model got right

- **VPC (10.0.0.0/16)** with DNS support/hostnames.  
- **Two public subnets** in different AZs (`us-east-1a`, `us-east-1b`) with `mapPublicIpOnLaunch(true)`.  
- **Internet Gateway**, **public route table**, **0.0.0.0/0 route**, and **associations**.  

## Gaps vs. the ideal response

1. **Region pinning via provider is missing (stability & portability)**
   - *Issue*: The model relies on ambient `aws:region` config and does not construct a region-pinned `aws.Provider`, which can lead to inconsistencies when stacks or components expect explicit providers.  
   - *Ideal*: Creates and uses a dedicated `Provider("aws-us-east-1", region="us-east-1")` and passes it via `CustomResourceOptions`.

2. **Outputs are too minimal for downstream tests and tooling**
   - *Issue*: The model exports only a handful of values (VPC ID, two subnet IDs, IGW, route table).  
   - *Ideal*: Exports **region**, **VPC CIDR**, **default route ID**, **subnet ID list**, **subnet CIDRs**, **AZ list**, **route table association IDs**, **name→ID map**, and **VPC tags**—useful for integration tests and automation pipelines.

3. **Tags and naming conventions are incomplete**
   - *Issue*: The model applies basic names but misses environment and descriptive tags.  
   - *Ideal*: Tags should consistently include keys like `Name`, `Environment`, `Project`, and other identifiers to support cost allocation and governance.

4. **Lacks structural alignment with ideal implementation**
   - *Issue*: The resources are declared inline without helper methods or structured composition.  
   - *Ideal*: The ideal solution structures subnets, associations, and outputs in a clearer, modular form that is easier to extend and test.

## Conclusion

While the model-generated code is functionally correct for a **basic public network setup**, it is **not production-grade**. The missing provider scoping, incomplete outputs, and lack of tagging/structure prevent it from meeting the standard required for maintainability and automated validation.
