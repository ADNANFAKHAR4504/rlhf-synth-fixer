# Prompt for Claude 3.7 Sonnet _(Pulumi + AWS multi‑AZ RDS)_ 

> This file is formatted as **Markdown**, combining a **system role** and a **user prompt**. It follows best‑in‑class prompt‑design: role prompting, clear instructions, example outputs, chain‑of‑thought guidance, and structured format (JSON or code). 

---

## **System** (role) 
You are an **AWS-certified Infrastructure Architect** and **Pulumi (Python) Specialist**. You design **production‑grade**, **high‑availability** AWS systems. Your audience is experienced engineers, so:

- Use **correct AWS best practices** (VPC, IAM, multi‑AZ failover, RDS, security).
- Generate **ready-to-run Pulumi code in Python**, with comments.
- Provide **step-by-step reasoning** before delivering the code.
- If unsure about some detail, explicitly state I dont know and **reason** it out. 
*(Anthropic recommends solicit chain-of-thought to reduce hallucinations, and encourage honesty)*. 

---

## **User Prompt** 
> **Problem ID**: `FailureRecovery_and_HighAvailability_Pulumi_Python_8fkxt2u0p5sh` 
>
> **Environment**: Create a Pulumi stack using **Python** that sets up a **highly available** database infrastructure on **AWS**. 
>
> **Key Requirements**: 
> 1. Multi‑AZ deployment for **Amazon RDS** (for resilience). 
> 2. **Automatic failover** between AZs (no manual intervention). 
>
> **Expected Output**: 
> - A working Pulumi program in **Python** that provisions RDS with the above features. 
> - Include any necessary **IAM policies or roles**. 
> - Comments explaining each major resource and why certain settings (like `multi_az=True`) are used. 
> - A short paragraph describing how to **test** failover (e.g. stopping the primary). 
>
> **Constraints & Metadata**: 
> - `projectName`: _IaC AWS Nova Model Breaking_ 
> - Infrastructure **must** use AWS multi‑AZ RDS for HA. 
> - **Difficulty**: Expert level. 

---

### **Tasks (in order):** 
1. **Explain step by step your design**: 
- RDS instance class choice, subnet groups, security groups, IAM role assumptions, etc. 
- How the Pulumi AWS provider config differs from backend config. 
- Failover mechanics (e.g. endpoint changes, synchronous replication). 
2. **Generate the Pulumi Python code**, with sections: 
- `__main__.py` 
- `Pulumi.dev.yaml` (or `Pulumi.<stack>.yaml`) with relevant config entries. 
- If using AWS credentials or backend from another region, show that in code comments. 
3. **Provide instructions to deploy**, including: 
- How to `pulumi up`, prerequisites (e.g. AWS_PROFILE), how to run tests. 
4. **Edge‑case notes**: 
- What happens if the primary fails over. 
- How to restore from a snapshot or log shipping if cross‑AZ degrade. 
5. **Limit output**: 
- Final answer sections should be **under 500 lines total**, 
- Use bullet points or numbered lists for clarity. 
- Use code blocks and Markdown consistently. 