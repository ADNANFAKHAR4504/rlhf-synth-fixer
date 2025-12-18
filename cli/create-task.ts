#!/usr/bin/env node

import { confirm, input, select } from '@inquirer/prompts';
import * as fs from 'fs-extra';
import * as path from 'path';

interface TaskMetadata {
  platform: string;
  language: string;
  complexity: string;
  turn_type: string;
  po_id: string;
  team: string;
  startedAt: string;
  subtask: string;
  subject_labels?: string[];
  aws_services?: string[];
  provider?: string;
  task_config?: {
    deploy_env: string;
  };
}

async function generateMetadataFile(metadata: TaskMetadata): Promise<void> {
  const rootDir = path.join(__dirname, '..');
  const metadataPath = path.join(rootDir, 'metadata.json');

  try {
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    console.log('✓ Generated metadata.json');
  } catch (err: unknown) {
    console.error('Error generating metadata.json:', err);
  }
}

async function createTfvarsFiles(): Promise<void> {
  const libDir = path.join(__dirname, '..', 'lib');
  const tfvarsFiles = ['dev.tfvars', 'staging.tfvars', 'prod.tfvars'];

  try {
    await fs.ensureDir(libDir);

    for (const filename of tfvarsFiles) {
      const filePath = path.join(libDir, filename);
      await fs.writeFile(filePath, '', 'utf8');
      console.log(`✓ Created ${filename}`);
    }
  } catch (err: unknown) {
    console.error('Error creating tfvars files:', err);
  }
}

async function copyTemplate(templateName: string): Promise<void> {
  const templatesDir = path.join(__dirname, '..', 'templates');
  const templatePath = path.join(templatesDir, templateName);
  const rootDir = path.join(__dirname, '..');

  try {
    if (!(await fs.pathExists(templatePath))) {
      console.error(`Template '${templateName}' not found`);
      return;
    }

    const items = await fs.readdir(templatePath);

    for (const item of items) {
      const sourcePath = path.join(templatePath, item);
      const destPath = path.join(rootDir, item);

      const stat = await fs.stat(sourcePath);

      if (stat.isDirectory()) {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        console.log(`✓ Copied ${item}/ to root`);
      } else {
        await fs.copy(sourcePath, destPath, { overwrite: true });
        console.log(`✓ Copied ${item} to root`);
      }
    }

    console.log(
      `\n🎉 Template '${templateName}' has been successfully applied to your project!`
    );
  } catch (err: unknown) {
    console.error('Error copying template:', err);
  }
}

function getLanguageChoices(platform: string) {
  if (platform === 'cdk') {
    return [
      { name: 'TypeScript', value: 'ts' },
      { name: 'JavaScript', value: 'js' },
      { name: 'Python', value: 'py' },
      { name: 'Java', value: 'java' },
      { name: 'Go', value: 'go' },
    ];
  }

  if (platform === 'cdktf') {
    return [
      { name: 'TypeScript', value: 'ts' },
      { name: 'Python', value: 'py' },
      { name: 'Go', value: 'go' },
      { name: 'Java', value: 'java' },
    ];
  }

  if (platform === 'pulumi') {
    return [
      { name: 'TypeScript', value: 'ts' },
      { name: 'JavaScript', value: 'js' },
      { name: 'Python', value: 'py' },
      { name: 'Java', value: 'java' },
      { name: 'Go', value: 'go' },
    ];
  }
  if (platform === 'tf') {
    return [{ name: 'Terraform', value: 'hcl' }];
  }

  return [
    { name: 'YAML', value: 'yaml' },
    { name: 'JSON', value: 'json' },
  ];
}

const SUBTASK_CHOICES = [
  { name: 'Cloud Environment Setup', value: 'Cloud Environment Setup' },
  { name: 'Environment Migration', value: 'Environment Migration' },
  {
    name: 'Multi-Environment Consistency',
    value: 'Multi-Environment Consistency',
  },
  { name: 'Web Application Deployment', value: 'Web Application Deployment' },

  {
    name: 'Serverless Infrastructure (Functions as Code)',
    value: 'Serverless Infrastructure (Functions as Code)',
  },

  { name: 'CI/CD Pipeline', value: 'CI/CD Pipeline' },

  { name: 'Failure Recovery Automation', value: 'Failure Recovery Automation' },

  {
    name: 'Security Configuration as Code',
    value: 'Security Configuration as Code',
  },

  { name: 'IaC Diagnosis/Edits', value: 'IaC Diagnosis/Edits' },
  { name: 'IaC Optimization', value: 'IaC Optimization' },

  {
    name: 'Infrastructure Analysis/Monitoring',
    value: 'Infrastructure Analysis/Monitoring',
  },
  {
    name: 'General Infrastructure Tooling QA',
    value: 'General Infrastructure Tooling QA',
  },
] as const;

const subjectLabelsBySubtask: Record<string, string> = {
  'Environment Migration': 'Provisioning of Infrastructure Environments',
  'Cloud Environment Setup': 'Provisioning of Infrastructure Environments',
  'Multi-Environment Consistency': 'IaC-Multi-Environment-Management',
  'Web Application Deployment': 'Provisioning of Infrastructure Environments',

  'Serverless Infrastructure (Functions as Code)': 'Application Deployment',

  'CI/CD Pipeline': 'CI/CD Pipeline',

  'Failure Recovery Automation': 'Failure Recovery and High Availability',

  'Security Configuration as Code': 'Security, Compliance and Governance',

  'IaC Diagnosis/Edits': 'IaC Program Optimization',
  'IaC Optimization': 'IaC Program Optimization',

  'Infrastructure Analysis/Monitoring': 'IaC Program Optimization',
  'General Infrastructure Tooling QA': 'Infrastructure QA and Management',
};

const ANALYSIS_SUBTASKS = new Set<string>([
  'Infrastructure Analysis/Monitoring',
  'General Infrastructure Tooling QA',
]);

const CICD_PIPELINE_SUBTASKS = new Set<string>(['CI/CD Pipeline']);

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npm run start <command>');
    console.error('Available commands: rlhf-task');
    process.exit(1);
  }

  const command = args[0];

  if (command === 'rlhf-task') {
    console.log('🔧 TAP Template Selector\n');

    // Ask for provider selection first
    const provider = await select({
      message: 'Select the cloud provider:',
      choices: [
        { name: 'AWS (Real AWS Services)', value: 'aws' },
        { name: 'LocalStack (Local AWS Emulation)', value: 'localstack' },
      ],
    });

    const taskSubCategory = await select({
      message: 'Select the Subtask:',
      choices: SUBTASK_CHOICES,
    });

    const isAnalysis = ANALYSIS_SUBTASKS.has(taskSubCategory);
    const isCICDPipeline = CICD_PIPELINE_SUBTASKS.has(taskSubCategory);

    let platform = '';
    let language = '';

    if (isAnalysis) {
      platform = 'analysis';
      const analysisChoice = await select({
        message: 'Select analysis template type:',
        choices: [
          { name: 'Shell', value: 'sh' },
          { name: 'Python', value: 'py' },
        ],
      });
      language = analysisChoice;
    } else if (isCICDPipeline) {
      platform = 'cicd';
      language = 'yml';
    } else {
      platform = await select({
        message: 'Select the platform:',
        choices: [
          { name: 'CDK', value: 'cdk' },
          { name: 'CDK Terraform', value: 'cdktf' },
          { name: 'CloudFormation', value: 'cfn' },
          { name: 'Terraform', value: 'tf' },
          { name: 'Pulumi', value: 'pulumi' },
        ],
      });

      language = await select({
        message: 'Select the language:',
        choices: getLanguageChoices(platform),
      });
    }

    const complexity = await select({
      message: 'Select the complexity:',
      choices: [
        { name: 'Medium', value: 'medium' },
        { name: 'Hard', value: 'hard' },
        { name: 'Expert', value: 'expert' },
      ],
    });

    const turnType = await select({
      message: 'Select the turn type:',
      choices: [
        { name: 'Single', value: 'single' },
        { name: 'Multi', value: 'multi' },
      ],
    });

    const taskId = await input({
      message: 'Enter the task ID:',
      validate: value => {
        if (!value.trim()) {
          return 'Task ID is required';
        }
        return true;
      },
    });

    const team = await select({
      message: 'Select the team:',
      choices: [
        { name: '1', value: '1' },
        { name: '2', value: '2' },
        { name: '3', value: '3' },
        { name: '4', value: '4' },
        { name: '5', value: '5' },
        { name: '6', value: '6' },
        { name: 'synth', value: 'synth' },
        { name: 'synth-1', value: 'synth-1' },
        { name: 'synth-2', value: 'synth-2' },
        { name: 'stf', value: 'stf' },
      ],
    });

    let resourcesText: string | undefined = undefined;
    if (!isAnalysis && !isCICDPipeline) {
      resourcesText = await input({
        message:
          'Enter aws_services to provision (comma-separated). e.g., S3 Bucket, CloudFormation, Lambda, Fargate, VPC',
        default:
          'S3 Bucket, CloudFormation, Lambda, EventBridge, CloudWatch LogGroup, VPC',
      });
    }

    const templateName = isAnalysis
      ? `analysis-${language}`
      : isCICDPipeline
        ? 'cicd-yml'
        : `${platform}-${language}`;

    if (!isAnalysis && !isCICDPipeline) {
      const templatesDir = path.join(__dirname, '..', 'templates');
      const templatePath = path.join(templatesDir, templateName);
      if (!(await fs.pathExists(templatePath))) {
        console.error(
          `Template '${templateName}' not found in templates directory`
        );
        process.exit(1);
      }
    }

    const label = subjectLabelsBySubtask[taskSubCategory];

    let deployEnv: string | undefined = undefined;
    if (
      taskSubCategory === 'Multi-Environment Consistency' &&
      platform === 'tf'
    ) {
      deployEnv = await select({
        message: 'Select the deployment environment tfvars:',
        choices: [
          { name: 'dev.tfvars', value: 'dev.tfvars' },
          { name: 'staging.tfvars', value: 'staging.tfvars' },
          { name: 'prod.tfvars', value: 'prod.tfvars' },
        ],
      });
    }

    const metadata: TaskMetadata = {
      platform,
      language,
      complexity,
      turn_type: turnType,
      po_id: taskId,
      team,
      startedAt: new Date().toISOString(),
      subtask: label ? label : taskSubCategory,
      provider,
      ...(taskSubCategory ? { subject_labels: [taskSubCategory] } : {}),
      ...(resourcesText && resourcesText.trim().length > 0
        ? {
          aws_services: resourcesText
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0),
        }
        : {}),
      ...(deployEnv
        ? {
          task_config: {
            deploy_env: deployEnv,
          },
        }
        : {}),
    };

    console.log('\n📋 Task Summary:');
    console.log(
      `Subtask (now subject label): ${label ? label : taskSubCategory}`
    );
    console.log(`Subject Labels (now selected subtask): [${taskSubCategory}]`);
    console.log(`Provider: ${provider}`);
    console.log(`Platform: ${platform}`);
    console.log(`Language: ${language}`);
    console.log(`Complexity: ${complexity}`);
    console.log(`Turn Type: ${turnType}`);
    console.log(`Task ID: ${taskId}`);
    console.log(`Team: ${team}`);
    console.log(`Template: ${templateName}`);
    console.log(`Task Sub-category: ${taskSubCategory}`);
    if (deployEnv) {
      console.log(`Deployment Environment: ${deployEnv}`);
    }

    const confirmApply = await confirm({
      message:
        'Create the RLHF task with these settings? This will overwrite existing files.',
      default: false,
    });

    if (confirmApply) {
      await copyTemplate(templateName);

      // Copy optimize.py if IaC Optimization subtask is selected
      if (taskSubCategory === 'IaC Optimization') {
        const optimizePath = path.join(
          __dirname,
          '..',
          'templates',
          'optimize',
          'optimize.py'
        );
        const destPath = path.join(__dirname, '..', 'lib', 'optimize.py');
        try {
          if (await fs.pathExists(optimizePath)) {
            await fs.copy(optimizePath, destPath, { overwrite: true });
            console.log('✓ Copied optimize.py to lib/');
          }
        } catch (err: unknown) {
          console.error('Error copying optimize.py:', err);
        }
      }

      // Copy ci-cd.yml if CI/CD Pipeline subtask is selected
      // This file serves as a reference workflow for CI/CD integration tasks
      if (taskSubCategory === 'CI/CD Pipeline' && templateName !== 'cicd-yml') {
        const cicdYmlPath = path.join(
          __dirname,
          '..',
          'templates',
          'cicd-yml',
          'lib',
          'ci-cd.yml'
        );
        const destPath = path.join(__dirname, '..', 'lib', 'ci-cd.yml');
        try {
          if (await fs.pathExists(cicdYmlPath)) {
            await fs.copy(cicdYmlPath, destPath, { overwrite: true });
            console.log('✓ Copied ci-cd.yml to lib/');
          }
        } catch (err: unknown) {
          console.error('Error copying ci-cd.yml:', err);
        }
      }

      await generateMetadataFile(metadata);

      // Create LocalStack configuration files if provider is localstack
      if (provider === 'localstack' && !isAnalysis && !isCICDPipeline) {
        console.log('✓ Creating LocalStack configuration files...');
        const libDir = path.join(__dirname, '..', 'lib');
        const testDir = path.join(__dirname, '..', 'test');

        // Create docker-compose.yml for LocalStack
        const dockerComposeContent = `version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=\${SERVICES:-s3,lambda,dynamodb,cloudformation,apigateway,sts,iam,cloudwatch,logs,events,sns,sqs,kinesis,ec2,rds,ecs}
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "\${TMPDIR:-/tmp}/localstack:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
`;

        const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
        await fs.writeFile(dockerComposePath, dockerComposeContent, 'utf8');
        console.log('✓ Created docker-compose.yml');

        // Create LocalStack environment configuration in lib
        const localStackConfigContent = `# LocalStack Configuration
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
`;

        const localStackConfigPath = path.join(libDir, 'localstack-env.sh');
        await fs.writeFile(localStackConfigPath, localStackConfigContent, 'utf8');
        console.log('✓ Created lib/localstack-env.sh');

        // Create LocalStack README in lib
        const localStackReadmeContent = `# LocalStack Deployment

This project is configured to use LocalStack for local AWS infrastructure testing.

## Prerequisites

- Docker installed and running
- LocalStack running on port 4566

## Getting Started

1. Start LocalStack:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

2. Verify LocalStack is running:
   \`\`\`bash
   curl http://localhost:4566/_localstack/health
   \`\`\`

3. Deploy your infrastructure:
   \`\`\`bash
   ./scripts/localstack-deploy.sh
   \`\`\`

4. Run tests:
   \`\`\`bash
   ./scripts/localstack-test.sh
   \`\`\`

## Environment Variables

The following environment variables are configured for LocalStack:
- AWS_ENDPOINT_URL=http://localhost:4566
- AWS_ACCESS_KEY_ID=test
- AWS_SECRET_ACCESS_KEY=test
- AWS_DEFAULT_REGION=us-east-1

## Cleanup

Stop LocalStack:
\`\`\`bash
docker-compose down
\`\`\`
`;

        const localStackReadmePath = path.join(libDir, 'LOCALSTACK.md');
        await fs.writeFile(localStackReadmePath, localStackReadmeContent, 'utf8');
        console.log('✓ Created lib/LOCALSTACK.md');
      }

      // Create tfvars files for Multi-Environment Consistency with Terraform
      if (
        taskSubCategory === 'Multi-Environment Consistency' &&
        platform === 'tf'
      ) {
        await createTfvarsFiles();
      }

      console.log('\n🎉 RLHF task created successfully!');
    } else {
      console.log('Operation cancelled');
    }
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: rlhf-task');
    process.exit(1);
  }
}
main().catch(console.error);