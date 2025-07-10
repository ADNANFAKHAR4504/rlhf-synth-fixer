#!/usr/bin/env node

// eslint-disable-next-line import/no-extraneous-dependencies
import * as fs from 'fs-extra';
// eslint-disable-next-line import/no-extraneous-dependencies
import { confirm, select } from '@inquirer/prompts';
import * as path from 'path';

interface TemplateChoice {
  name: string;
  value: string;
}

async function getAvailableTemplates(): Promise<TemplateChoice[]> {
  const templatesDir = path.join(__dirname, '..', 'templates');

  try {
    const items = await fs.readdir(templatesDir);
    const templates: TemplateChoice[] = [];

    for (const item of items) {
      const itemPath = path.join(templatesDir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        templates.push({
          name: item,
          value: item,
        });
      }
    }

    return templates;
  } catch (error) {
    console.error('Error reading templates directory:', error);
    return [];
  }
}

async function copyTemplate(templateName: string): Promise<void> {
  const templatesDir = path.join(__dirname, '..', 'templates');
  const templatePath = path.join(templatesDir, templateName);
  const rootDir = path.join(__dirname, '..');

  try {
    // Check if template exists
    if (!(await fs.pathExists(templatePath))) {
      console.error(`Template '${templateName}' not found`);
      return;
    }

    // Get all items in the template directory
    const items = await fs.readdir(templatePath);

    for (const item of items) {
      const sourcePath = path.join(templatePath, item);
      const destPath = path.join(rootDir, item);

      // Check if it's a directory
      const stat = await fs.stat(sourcePath);

      if (stat.isDirectory()) {
        // Copy directory recursively
        await fs.copy(sourcePath, destPath, { overwrite: true });
        console.log(`✓ Copied ${item}/ to root`);
      } else {
        // Copy file
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

    const templates = await getAvailableTemplates();

    if (templates.length === 0) {
      console.error('No templates found in the templates directory');
      process.exit(1);
    }

    const selectedTemplate = await select({
      message: 'Which template would you like to use?',
      choices: templates.map(template => ({
        name: template.name,
        value: template.value,
      })),
    });

    const confirmApply = await confirm({
      message: `Are you sure you want to apply the '${selectedTemplate}' template? This will overwrite existing files.`,
      default: false,
    });

    if (confirmApply) {
      await copyTemplate(selectedTemplate);
    } else {
      console.log('Operation cancelled');
    }
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: rlhf-task');
    process.exit(1);
  }
}

// Run the CLI
main().catch(console.error);
