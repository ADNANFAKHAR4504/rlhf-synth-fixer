## CI/CD Pipeline Implementation Request

I need to build a complete CI/CD pipeline using Pulumi and TypeScript. This should be a production-ready system that automatically deploys infrastructure to AWS based on GitHub pushes across different environments.

---

### What I Need Built

Create a Pulumi TypeScript project that sets up the entire CI/CD infrastructure.

#### Source Control Integration

- Connect to a **GitHub repository** without authentication (use any public repo for now)
- Set up automatic triggers based on Git pushes:
  - `main` branch → **production** stack
  - `staging` branch → **staging** stack
  - `feature/*` branches → **development** stack

#### Build Infrastructure

- Use **AWS CodeBuild** for the build and deployment engine
- Configure a **Docker-based** build environment for consistency
- Keep the build process contained within CodeBuild

#### Security Requirements

- Store secrets (like Slack webhook URLs) in **AWS Secrets Manager**
- Create a least-privilege **IAM Role** for CodeBuild to fetch secrets at runtime
- Don't put any plaintext secrets in the build spec

#### Sample Application

- Include a simple **AWS Lambda function** as a deployment target
- The pipeline should deploy/update this Lambda based on the branch being built

#### Monitoring Setup

- Send all CodeBuild logs to **Amazon CloudWatch**
- Set up real-time Slack notifications for build success/failure
- Use EventBridge to watch pipeline state and trigger a notification Lambda

---

### Requirements Checklist

Make sure the implementation includes:

- Complete CI/CD pipeline (CodeBuild, IAM Roles, etc.) defined in Pulumi TypeScript
- GitHub integration for source control
- Environment support: `development`, `staging`, and `production` based on branch names
- AWS CodeBuild with Docker environment
- Secure secret fetching from AWS Secrets Manager
- Sample AWS Lambda function deployment
- CloudWatch logging for all build activities
- Slack notifications for build success/failure

---

### Deliverables

- **Language**: TypeScript
- **Infrastructure Tool**: Pulumi
- **Focus**: Infrastructure code implementation over documentation
