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
  task_sub_category?: string;
  use_case_category?: string;
  aws_services?: string;
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

    const taskSubCategory = await select({
      message: 'Select the Task Sub-category:',
      choices: [
        {
          name: 'IaC-Cloud-Environment-Setup',
          value: 'IaC-Cloud-Environment-Setup',
        },
        { name: 'IaC-Cloud-Migration', value: 'IaC-Cloud-Migration' },
        {
          name: 'IaC-Multi-Environment-Management',
          value: 'IaC-Multi-Environment-Management',
        },
        {
          name: 'IaC-Application-Deployment',
          value: 'IaC-Application-Deployment',
        },
        {
          name: 'IaC-Serverless-Architecture',
          value: 'IaC-Serverless-Architecture',
        },
        {
          name: 'IaC-Failure-Recovery-Automation',
          value: 'IaC-Failure-Recovery-Automation',
        },
        { name: 'IaC-Security-Hardening', value: 'IaC-Security-Hardening' },
        { name: 'IaC-Analysis/Monitoring', value: 'IaC-Analysis/Monitoring' },
        {
          name: 'IaC-Code-Review-Diagnosis',
          value: 'IaC-Code-Review-Diagnosis',
        },
      ],
    });

    let platform = '';
    let language = '';

    if (taskSubCategory === 'IaC-Analysis/Monitoring') {
      platform = 'analysis';
      const analysisChoice = await select({
        message: 'Select analysis template type:',
        choices: [
          { name: 'Shell', value: 'shell' },
          { name: 'Python', value: 'python' },
        ],
      });
      language = analysisChoice;
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
      ],
    });

    const subCatToUseCase: Record<string, string> = {
      'IaC-Cloud-Environment-Setup': 'Provisioning Infrastructure Environments',
      'IaC-Cloud-Migration': 'Environment Migration',
      'IaC-Multi-Environment-Management':
        'Multi-Environment Consistency and Replication',
      'IaC-Application-Deployment': 'Web Application Deployment',
      'IaC-Serverless-Architecture':
        'Serverless Infrastructure (Functions as Code)',
      'IaC-Failure-Recovery-Automation':
        'Failure Recovery and High Availability',
      'IaC-Security-Hardening': 'Security, Compliance, and Governance',
      'IaC-Analysis/Monitoring': 'Infrastructure QA and Management',
      'IaC-Code-Review-Diagnosis': 'Infrastructure QA and Management',
    };

    let resourcesText: string | undefined = undefined;
    if (taskSubCategory !== 'IaC-Analysis/Monitoring') {
      resourcesText = await input({
        message:
          'Enter aws_services to provision (comma-separated). e.g., S3 Bucket, CloudFormation, Lambda, Fargate, VPC',
        default:
          'S3 Bucket, CloudFormation, Lambda, EventBridge, CloudWatch LogGroup, VPC',
      });
    }

    const templateName =
      taskSubCategory === 'IaC-Analysis/Monitoring'
        ? `analysis-${language}`
        : `${platform}-${language}`;

    if (taskSubCategory !== 'IaC-Analysis/Monitoring') {
      const templatesDir = path.join(__dirname, '..', 'templates');
      const templatePath = path.join(templatesDir, templateName);
      if (!(await fs.pathExists(templatePath))) {
        console.error(
          `Template '${templateName}' not found in templates directory`
        );
        process.exit(1);
      }
    }

    const metadata: TaskMetadata = {
      platform,
      language,
      complexity,
      turn_type: turnType,
      po_id: taskId,
      team,
      startedAt: new Date().toISOString(),
      task_sub_category: taskSubCategory,
      use_case_category: subCatToUseCase[taskSubCategory],
      ...(resourcesText && resourcesText.trim().length > 0
        ? { aws_services: resourcesText.trim() }
        : {}),
    };

    console.log('\n📋 Task Summary:');
    console.log(`Platform: ${platform}`);
    console.log(`Language: ${language}`);
    console.log(`Complexity: ${complexity}`);
    console.log(`Turn Type: ${turnType}`);
    console.log(`Task ID: ${taskId}`);
    console.log(`Team: ${team}`);
    console.log(`Template: ${templateName}`);
    console.log(`Task Sub-category: ${taskSubCategory}`);

    const confirmApply = await confirm({
      message:
        'Create the RLHF task with these settings? This will overwrite existing files.',
      default: false,
    });

    if (confirmApply) {
      await copyTemplate(templateName);
      await generateMetadataFile(metadata);
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
