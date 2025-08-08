import t from 'tap';
import fs from 'fs';
import yaml from 'js-yaml';

// Load and parse the CloudFormation YAML
const template = yaml.load(fs.readFileSync('./lib/TapStack.yml', 'utf8'));

t.test('CloudFormation template integration test', (t) => {
  // Basic template checks
  t.equal(template.AWSTemplateFormatVersion, '2010-09-09', 'Correct CFN version');
  t.ok(template.Description, 'Has a Description');

  // Parameter checks
  t.ok(template.Parameters.EnvironmentSuffix, 'Has EnvironmentSuffix parameter');
  t.equal(template.Parameters.EnvironmentSuffix.Default, 'dev', 'Default suffix is dev');

  // Resource checks
  t.ok(template.Resources.MyVPC, 'Has MyVPC resource');
  t.equal(template.Resources.MyVPC.Type, 'AWS::EC2::VPC', 'VPC type is correct');

  // Output checks
  t.ok(template.Outputs, 'Has Outputs section');
  Object.keys(template.Outputs).forEach((outputKey) => {
    t.ok(template.Outputs[outputKey].Value, `${outputKey} output has value`);
  });

  t.end();
});
