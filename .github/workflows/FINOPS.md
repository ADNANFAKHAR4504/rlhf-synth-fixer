# FinOps Cost Estimation with Infracost in CI/CD

## Overview

This project implements a **FinOps (Financial Operations) strategy** by integrating [Infracost](https://www.infracost.io/) into our CI/CD pipeline. The goal is to make infrastructure cost estimation a first-class citizen in our development workflow, promoting cost awareness and accountability for every infrastructure change. By surfacing cost impacts early—at pull request (PR) time—developers, reviewers, and product managers can make informed decisions that align technical progress with budget constraints.

> **Note:**  
> This is our first rollout of FinOps practices, being piloted for an upcoming project focused on the integration of **Ansible with SRE, FinOps, and CISO functions**. We're testing out cost estimation and governance workflows to pave the way for broader financial accountability and transparency in infrastructure management.

## Why FinOps?

FinOps is a cultural and technical practice that enables teams to collaboratively manage cloud costs. Cost transparency, continuous monitoring, and actionable feedback are central tenets. By adopting a FinOps mindset, we:
- Prevent cost overruns by catching expensive changes early.
- Empower engineers to take ownership of cloud spending.
- Foster collaboration between engineering, finance, and product teams.
- Establish cost as a metric of software quality.

## Infracost Integration

### What is Infracost?

[Infracost](https://www.infracost.io/) is an open-source tool that provides cost estimates for Infrastructure as Code (IaC) changes, before resources are provisioned. It supports Terraform, and outputs cost diffs directly into PRs as comments or checks.

### Current Scope & Roadmap

- **Current Implementation:**  
  This FinOps workflow is **first implemented for Terraform**. All cost estimation in PRs and CI/CD currently targets Terraform plans and modules.
- **Planned Expansion:**  
  As the project matures, we plan to expand cost estimation to other IaC platforms, including **Pulumi, AWS CDK, and CloudFormation**, to provide holistic cost visibility across our stack.

### How We Use Infracost

- **Automated Cost Estimation:** Every time a pull request is opened or updated, our CI pipeline runs Infracost against the proposed Terraform changes.
- **PR Annotations:** Infracost posts a detailed report as a comment on the PR, showing the estimated monthly cost increase or decrease, and a breakdown of affected resources.
- **Cost Visibility:** Stakeholders can review the cost impact alongside code changes, making cost a routine discussion point in code reviews.
- **Policy Enforcement:** Optionally, the pipeline can be configured to fail or require additional approval for changes that exceed predefined cost thresholds.

## CI/CD Workflow

Here's how cost estimation is embedded in our CI:

1. **Metadata Detection:** The pipeline determines if the PR contains Terraform changes.
2. **Terraform Plan:** The proposed changes are planned, and the resulting output is used by Infracost.
3. **Infracost Run:** Infracost calculates the cost diff between the base and proposed infrastructure.
4. **Report Publishing:** The results are posted on the PR, with clear visibility on cost impact.
5. **Gating/Alerts:** Optionally, the workflow can block merging if costs exceed limits, or trigger approvals.

Example workflow snippet:

```yaml
infracost:
  name: Infracost (Terraform Cost Estimation)
  needs: [detect-metadata, build, synth]
  runs-on: ubuntu-24.04
  if: >
    ${{ github.event_name == 'pull_request' &&
        github.event.action != 'closed' &&
        !contains(github.event.head_commit.message, '[skip-jobs]') &&
        needs.detect-metadata.outputs.platform == 'tf' }}
  environment: dev
  permissions:
    contents: read
    pull-requests: write
  steps:
    - name: Setup Infracost
      uses: infracost/actions/setup@v3
    - name: Generate Infracost cost estimate
      run: infracost breakdown --path=.
    - name: Comment on PR with cost estimate
      uses: infracost/actions/comment@v3
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Benefits Realized

- **Cost Transparency:** Every engineer can see the financial impact of their infrastructure changes.
- **Proactive Cost Control:** Expensive changes are flagged before deployment, reducing surprises in the cloud bill.
- **Continuous Learning:** Teams learn which resources drive costs and can iterate on more efficient architectures.
- **Stakeholder Alignment:** Product, engineering, finance, and security teams work together with a shared view of cost data.

## Next Steps

- Expand Infracost coverage to other IaC tools (Pulumi, CDK, CloudFormation) as planned.
- Integrate cost policies and automated alerts for budget enforcement.
- Use Infracost's reporting for sprint and release planning.
- Leverage learnings from this pilot to optimize Ansible-based SRE, FinOps, and CISO workflows.

## Further Reading

- [FinOps Foundation](https://www.finops.org/)
- [Infracost Documentation](https://www.infracost.io/docs/)
- [Best Practices for FinOps in CI/CD](https://www.infracost.io/blog/finops-in-ci/)