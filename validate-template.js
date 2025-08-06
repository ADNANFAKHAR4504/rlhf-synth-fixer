const fs = require('fs');
const path = require('path');

console.log('Starting CloudFormation template validation...\n');

// Load the JSON template
const templatePath = path.join(__dirname, 'lib/TapStack.json');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

let errors = [];
let warnings = [];

console.log('✓ Template loaded successfully');

// Validate template structure
if (!template.AWSTemplateFormatVersion) {
  errors.push('Missing AWSTemplateFormatVersion');
} else if (template.AWSTemplateFormatVersion !== '2010-09-09') {
  errors.push('Invalid AWSTemplateFormatVersion');
} else {
  console.log('✓ AWSTemplateFormatVersion is valid');
}

if (!template.Description) {
  warnings.push('Missing Description');
} else {
  console.log('✓ Description is present');
}

// Validate Parameters
const requiredParams = ['Environment', 'LogLevel'];
requiredParams.forEach(param => {
  if (!template.Parameters || !template.Parameters[param]) {
    errors.push(`Missing parameter: ${param}`);
  } else {
    console.log(`✓ Parameter ${param} is present`);
  }
});

// Validate Environment parameter
if (template.Parameters && template.Parameters.Environment) {
  const env = template.Parameters.Environment;
  if (!env.AllowedValues || !env.AllowedValues.includes('dev') || !env.AllowedValues.includes('stage') || !env.AllowedValues.includes('prod')) {
    errors.push('Environment parameter missing required allowed values');
  } else {
    console.log('✓ Environment parameter has correct allowed values');
  }
}

// Validate LogLevel parameter
if (template.Parameters && template.Parameters.LogLevel) {
  const logLevel = template.Parameters.LogLevel;
  if (!logLevel.AllowedValues || !logLevel.AllowedValues.includes('INFO') || !logLevel.AllowedValues.includes('WARN') || !logLevel.AllowedValues.includes('ERROR')) {
    errors.push('LogLevel parameter missing required allowed values');
  } else {
    console.log('✓ LogLevel parameter has correct allowed values');
  }
}

// Validate Resources
const requiredResources = [
  'LambdaExecutionRole',
  'DataProcessorFunction',
  'LambdaLogGroup',
  'DataApi',
  'DataResource',
  'DataMethod',
  'ApiDeployment',
  'DataTable',
  'ApplicationAutoScalingDynamoDBRole',
  'ReadCapacityScalableTarget',
  'WriteCapacityScalableTarget',
  'ReadScalingPolicy',
  'WriteScalingPolicy',
  'LambdaErrorAlarm',
  'LambdaApiGatewayPermission'
];

requiredResources.forEach(resource => {
  if (!template.Resources || !template.Resources[resource]) {
    errors.push(`Missing resource: ${resource}`);
  } else {
    console.log(`✓ Resource ${resource} is present`);
  }
});

// Validate Lambda function
if (template.Resources && template.Resources.DataProcessorFunction) {
  const lambda = template.Resources.DataProcessorFunction;
  if (lambda.Properties.Runtime !== 'python3.9') {
    errors.push('Lambda function runtime is not python3.9');
  } else {
    console.log('✓ Lambda function has correct runtime');
  }
  
  if (!lambda.Properties.Environment || !lambda.Properties.Environment.Variables) {
    errors.push('Lambda function missing environment variables');
  } else {
    const envVars = lambda.Properties.Environment.Variables;
    const requiredEnvVars = ['STAGE', 'LOG_LEVEL', 'TABLE_NAME', 'AWS_REGION'];
    requiredEnvVars.forEach(envVar => {
      if (!envVars[envVar]) {
        errors.push(`Lambda function missing environment variable: ${envVar}`);
      } else {
        console.log(`✓ Lambda function has environment variable: ${envVar}`);
      }
    });
  }
}

// Validate API Gateway
if (template.Resources && template.Resources.DataMethod) {
  const method = template.Resources.DataMethod;
  if (method.Properties.HttpMethod !== 'POST') {
    errors.push('API Gateway method is not POST');
  } else {
    console.log('✓ API Gateway method is POST');
  }
}

// Validate DynamoDB
if (template.Resources && template.Resources.DataTable) {
  const table = template.Resources.DataTable;
  if (!table.Properties.KeySchema || table.Properties.KeySchema[0].AttributeName !== 'id') {
    errors.push('DynamoDB table key schema is incorrect');
  } else {
    console.log('✓ DynamoDB table has correct key schema');
  }
  
  if (!table.Properties.ProvisionedThroughput || 
      table.Properties.ProvisionedThroughput.ReadCapacityUnits !== 5 ||
      table.Properties.ProvisionedThroughput.WriteCapacityUnits !== 5) {
    errors.push('DynamoDB table provisioned throughput is incorrect');
  } else {
    console.log('✓ DynamoDB table has correct provisioned throughput');
  }
}

// Validate Outputs
const requiredOutputs = ['ApiEndpoint', 'LambdaFunctionArn', 'DynamoDBTableName', 'DynamoDBTableArn'];
requiredOutputs.forEach(output => {
  if (!template.Outputs || !template.Outputs[output]) {
    errors.push(`Missing output: ${output}`);
  } else {
    console.log(`✓ Output ${output} is present`);
  }
});

// Validate us-east-1 region constraint
const templateStr = JSON.stringify(template);
if (!templateStr.includes('us-east-1')) {
  warnings.push('Template does not explicitly reference us-east-1 region');
} else {
  console.log('✓ Template explicitly references us-east-1 region');
}

// Check for retain policies
const hasRetainPolicies = Object.values(template.Resources).some(resource => 
  resource.DeletionPolicy === 'Retain' || resource.UpdateReplacePolicy === 'Retain'
);
if (hasRetainPolicies) {
  warnings.push('Template contains Retain policies - resources may not be fully destroyable');
} else {
  console.log('✓ Template does not contain Retain policies');
}

// Summary
console.log('\n=== VALIDATION SUMMARY ===');
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(error => console.log(`❌ ${error}`));
}

if (warnings.length > 0) {
  console.log('\nWARNINGS:');
  warnings.forEach(warning => console.log(`⚠️  ${warning}`));
}

if (errors.length === 0) {
  console.log('\n✅ Template validation PASSED');
  process.exit(0);
} else {
  console.log('\n❌ Template validation FAILED');
  process.exit(1);
}