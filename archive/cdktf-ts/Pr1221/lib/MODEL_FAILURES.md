Correct Abstraction (GPT): GPT correctly uses TerraformModule, the standard for creating high-level, reusable CDKTF components.

Incorrect Abstraction (NOVA Failure): NOVA uses the generic Construct class, which is too low-level for a complex, self-contained module like a VPC. This fails to signal its purpose as a reusable infrastructure pattern.

Concise & Modern Code (GPT): Security group rules are defined inline, which is the modern, readable, and recommended approach.

Verbose & Outdated Code (NOVA Failure): NOVA defines every rule as a separate SecurityGroupRule resource. This pattern is outdated, makes the code unnecessarily long, and scatters the resource's configuration, which is a failure in code organization.

Strict Adherence to Prompt (GPT): GPT precisely follows all instructions, such as hardcoding the specified Availability Zones.

Ignores Requirements (NOVA Failure): The NOVA model fails by ignoring the prompt's explicit AZ requirements, instead implementing its own logic with a data source lookup, which was not requested.

Clean & Standard Tagging (GPT): It uses the idiomatic Tags.of(this).add() method for applying stack-level tags cleanly.

Overly Complex Tagging (NOVA Failure): NOVA's approach to tagging fails by being overly complex. It mixes provider-level defaultTags with module-level tags and adds several unrequested tags, complicating a simple requirement.

Focused & Minimalist (GPT): The code is lean and directly implements only what was asked for, demonstrating efficiency.

Unnecessary Complexity (NOVA Failure): The NOVA code fails by adding unneeded complexity (dynamic data sources, extra tags, verbose patterns), which deviates from the prompt and leads to a less maintainable and less accurate solution.
