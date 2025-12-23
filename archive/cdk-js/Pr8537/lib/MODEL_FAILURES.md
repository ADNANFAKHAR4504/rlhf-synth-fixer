# Flaws

**Issue**: Require is not defined in ES module scope, you can use import instead

**Root Cause**: The problem is that model is mixing CommonJS (require) and ESM (import) in the same CDK project.
Since files have .mjs extensions, Node.js treats them as ES modules, where require is not available.

**Resolution**:  Update all require statements to `import`

```javascript
import { CloudWatchLoggingConstruct } from './constructs/cloudwatch-logging.mjs';
import { EC2InstancesConstruct } from './constructs/ec2-instances.mjs';
import { IAMRolesConstruct } from './constructs/iam-roles.mjs';
import { SecurityGroupConstruct } from './constructs/security-group.mjs';
```

---

**Issue**: ValidationError: Cannot retrieve value from context provider vpc-provider since account/region are not specified at the stack level. Configure "env" with an account and region when you define your stack. See <https://docs.aws.amazon.com/cdk/latest/guide/environments.html> for more details.

**Root Cause**: TapStack (or one of its constructs) is trying to look up a VPC from context (Vpc.fromLookup or similar). But since you didn’t set an env (account & region) on the stack, CDK doesn’t know where to look.

**Resolution**: added `env` and passed it in `TapStack`

```javascript
  const env = { account: '111111111111', region: 'us-east-1' };

  stack = new TapStack(app, 'TestTapStack', { env, environmentSuffix,  config });
```

---

**Issue**: [WARNING] aws-cdk-lib.aws_ec2.MachineImage#latestAmazonLinux is deprecated. use MachineImage.latestAmazonLinux2 instead. This API will be removed in the next major release.

**Root Cause**: aws-cdk-lib.aws_ec2.MachineImage#latestAmazonLinux is deprecated and we should use MachineImage.latestAmazonLinux2 instead

**Resolution**: use MachineImage.latestAmazonLinux2 

---

**Issue**: TypeError: require is not a constructor

```bash
      50 |     // Output important information
      51 |     instances.instances.forEach((instance, index) => {
    > 52 |       new require('aws-cdk-lib').CfnOutput(this, `Instance${index + 1}Id`, {
         |       ^
      53 |         value: instance.instanceId,
      54 |         description: `Instance ID for web app instance ${index + 1}`
      55 |       });

      at lib/tap-stack.mjs:52:7
          at Array.forEach (<anonymous>)
      at new forEach (lib/tap-stack.mjs:51:25)
      at Object.<anonymous> (test/tap-stack.unit.test.mjs:28:13)
```

**Root Cause**: require is not a constructor — it just loads a module. In ESM you already imported CDK, so you should never wrap new around require.

**Resolution**: use `new cdk.CfnOutput` instead of `new require('aws-cdk-lib').CfnOutput`

```javascript
new cdk.CfnOutput(this, `Instance${index + 1}Id`, {
  value: instance.instanceId,
  description: `Instance ID for web app instance ${index + 1}`
});
```

---

**Issue**: All resources should have Environment tag set to Production but model has not added it

**Root Cause**: Model has not provided code to set Environment

**Resolution**: Apply Environment tag to everything in this stack

```javascript
export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Apply Environment tag to everything in this stack
    Tags.of(this).add("Environment", props.config.environment);
  }
}
```

---

**Issue**: SyntaxError: The requested module `./constructs/cloudwatch-logging.mjs` does not provide an export named 'CloudWatchLoggingConstruct'

**Root Cause**: Since we are using .mjs everywhere, convert your construct file to use export instead of module.exports

**Resolution**: use `export class CloudWatchLoggingConstruct` instead of `module.exports = { CloudWatchLoggingConstruct };`
