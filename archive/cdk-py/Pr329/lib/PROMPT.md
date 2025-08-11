Overview

This project uses CDK with Python to implement Infrastructure as Code (IaC) for maintaining consistent cloud infrastructure across two environments:

    Production

    Staging

The goal is to provision and manage resources in both environments with reusable, version-controlled, and auditable code.
Requirements

Each environment must include the following:

    A Virtual Private Cloud (VPC) with:

        Customized subnets (e.g., public/private, per availability zone)

    Appropriate IAM roles and permissions to support secure access and resource operations