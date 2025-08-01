Certainly! Here's a **comprehensive, high-level user prompt** you can use to guide the creation or update of the `lib/MODEL_FAILURES.md` file — typically used to document known model failure scenarios, limitations, and expected behavior in a project or infrastructure codebase.

---

## ✅ **Comprehensive Prompt for `lib/MODEL_FAILURES.md`**

> Create or update the file `lib/MODEL_FAILURES.md` to serve as a centralized, human-readable document that records **known model or system failure scenarios** relevant to this infrastructure-as-code (IaC) project. The goal is to improve transparency, troubleshooting efficiency, and long-term maintainability.
>
> ### 📌 Requirements:
>
> 1. **Purpose and Structure**
>
>    * Begin with a brief **introduction** explaining the intent of the document.
>    * Use a clear structure with **sections or tables** for each failure type or category.
> 2. **Contents to Include**
>    For each failure or issue, include:
>
>    * **Failure ID** (a short tag like `MF001`)
>    * **Description** of the failure
>    * **Root Cause** (if known)
>    * **Affected Resources/Services** (e.g., EC2, Subnets, NAT Gateway, S3, etc.)
>    * **Detection Method** (e.g., CloudFormation error, log entry, CloudWatch alert)
>    * **Resolution/Workaround**
>    * **Status** (e.g., "Known", "Fixed", "Investigating")
> 3. **Example Scenarios to Document**
>
>    * CloudFormation errors (e.g., invalid subnet AZ, missing dependencies)
>    * Misconfigured IAM permissions
>    * Unexpected NAT Gateway charges
>    * SSH access failures due to security group rules
>    * AZ-specific failures or hardcoded references (e.g., `us-east-1a`)
>    * cfn-lint rule violations like `W3010`
> 4. **Style Guidelines**
>
>    * Use **Markdown syntax** with consistent formatting
>    * Use bullet points or tables for readability
>    * Write in **clear, concise language** so it's easy for new team members to understand
> 5. **Bonus (Optional)**
>
>    * Add links to relevant issues, tickets, or documentation
>    * Indicate if the failure was **introduced in a specific branch or version**
>    * Include any **automated checks or lint rules** that help detect the failure
>
> ### 📂 Output:
>
> * A fully populated `lib/MODEL_FAILURES.md` file in Markdown format, containing realistic and useful examples.
> * Ready to be committed to the repo as a source of truth for known failure modes and resolutions.

---

Would you like me to generate a sample `MODEL_FAILURES.md` file structure based on this prompt?
