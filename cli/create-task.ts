#!/usr/bin/env node

// eslint-disable-next-line import/no-extraneous-dependencies
import * as fs from 'fs-extra';
// eslint-disable-next-line import/no-extraneous-dependencies
import { confirm, input, select } from '@inquirer/prompts';
import * as path from 'path';

interface TaskMetadata {
  platform: string;
  language: string;
  complexity: string;
  turn_type: string;
  po_id: string;
  team: string;
  startedAt: string;
}

async function generateMetadataFile(metadata: TaskMetadata): Promise<void> {
  const rootDir = path.join(__dirname, '..');
  const metadataPath = path.join(rootDir, 'metadata.json');

  try {
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
    console.log('✓ Generated metadata.json');
  } catch (error) {
    console.error('Error generating metadata.json:', error);
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
  } catch (error) {
    console.error('Error copying template:', error);
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
      { name: 'Java', value: 'java' }
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

    const platform = await select({
      message: 'Select the platform:',
      choices: [
        { name: 'CDK', value: 'cdk' },
        { name: 'CDK Terraform', value: 'cdktf' },
        { name: 'CloudFormation', value: 'cfn' },
        { name: 'Terraform', value: 'tf' },
        { name: 'Pulumi', value: 'pulumi' },
      ],
    });

    const language = await select({
      message: 'Select the language:',
      choices: getLanguageChoices(platform),
    });

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

    const templateName = `${platform}-${language}`;
    const templatesDir = path.join(__dirname, '..', 'templates');
    const templatePath = path.join(templatesDir, templateName);

    if (!(await fs.pathExists(templatePath))) {
      console.error(
        `Template '${templateName}' not found in templates directory`
      );
      process.exit(1);
    }

    const metadata: TaskMetadata = {
      platform,
      language,
      complexity,
      turn_type: turnType,
      po_id: taskId,
      team,
      startedAt: new Date().toISOString(),
    };

    console.log('\n📋 Task Summary:');
    console.log(`Platform: ${platform}`);
    console.log(`Language: ${language}`);
    console.log(`Complexity: ${complexity}`);
    console.log(`Turn Type: ${turnType}`);
    console.log(`Task ID: ${taskId}`);
    console.log(`Team: ${team}`);
    console.log(`Template: ${templateName}`);

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
