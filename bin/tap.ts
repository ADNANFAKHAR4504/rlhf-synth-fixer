#!/usr/bin/env node
import { App } from 'cdktf';
import { GamingDatabaseStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Calculate the stack name
const stackName = `gaming-database-stack`;

// Create the GamingDatabaseStack
new GamingDatabaseStack(app, stackName);

// Synthesize the app to generate the Terraform configuration
app.synth();
