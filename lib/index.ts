/**
 * CloudFormation Template Deployment Entry Point
 * 
 * This file serves as a TypeScript entry point for the CloudFormation template.
 * The actual infrastructure is defined in TapStack.yml.
 */

export const stackName = 'CloudEnvironmentSetup';
export const templatePath = './TapStack.yml';

// Re-export for compatibility
export default {
  stackName,
  templatePath,
};
