import { test } from 'tap';
import template from '../lib/TapStack.yml';

test('Outputs validation', async (t) => {
  // LoadBalancerDNS
  t.ok(template.Outputs.LoadBalancerDNS, 'LoadBalancerDNS output exists');
  t.match(
    template.Outputs.LoadBalancerDNS.Description,
    /Public DNS name of the Application Load Balancer/,
    'LoadBalancerDNS description matches'
  );

  // LoadBalancerURL
  t.ok(template.Outputs.LoadBalancerURL, 'LoadBalancerURL output exists');
  t.match(
    template.Outputs.LoadBalancerURL.Description,
    /URL of the Application Load Balancer/,
    'LoadBalancerURL description matches'
  );

  // VPCId
  t.ok(template.Outputs.VPCId, 'VPCId output exists');
  t.match(
    template.Outputs.VPCId.Description,
    /VPC ID for the web application/,
    'VPCId description matches'
  );

  // StackName
  t.ok(template.Outputs.StackName, 'StackName output exists');
  t.match(
    template.Outputs.StackName.Description,
    /Name of this CloudFormation stack/,
    'StackName description matches'
  );

  // EnvironmentSuffix
  t.ok(template.Outputs.EnvironmentSuffix, 'EnvironmentSuffix output exists');
  t.match(
    template.Outputs.EnvironmentSuffix.Description,
    /Environment suffix used for this deployment/,
    'EnvironmentSuffix description matches'
  );
});
