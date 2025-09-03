The code you provided is failing with the below build errors -

```bash
> tap@0.1.0 build
> tsc --skipLibCheck

lib/production-infrastructure.ts:275:9 - error TS2353: Object literal may only specify known properties, and 'resourceId' does not exist in type 'FlowLogArgs'.

275         resourceId: this.vpc.id,
            ~~~~~~~~~~

lib/production-infrastructure.ts:529:9 - error TS2353: Object literal may only specify known properties, and 'serverSideEncryptionConfiguration' does not exist in type 'BucketServerSideEncryptionConfigurationV2Args'.

529         serverSideEncryptionConfiguration: {
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

lib/production-infrastructure.ts:695:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

695         port: '80',
            ~~~~

  node_modules/@pulumi/aws/lb/listener.d.ts:585:5
    585     port?: pulumi.Input<number>;
            ~~~~
    The expected type comes from property 'port' which is declared here on type 'ListenerArgs'

lib/production-infrastructure.ts:772:9 - error TS2322: Type 'string' is not assignable to type 'Input<number>'.

772         evaluationPeriods: '2',
            ~~~~~~~~~~~~~~~~~

  node_modules/@pulumi/aws/cloudwatch/metricAlarm.d.ts:487:5
    487     evaluationPeriods: pulumi.Input<number>;
            ~~~~~~~~~~~~~~~~~
    The expected type comes from property 'evaluationPeriods' which is declared here on type 'MetricAlarmArgs'

lib/production-infrastructure.ts:775:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

775         period: '120',
            ~~~~~~

  node_modules/@pulumi/aws/cloudwatch/metricAlarm.d.ts:522:5
    522     period?: pulumi.Input<number>;
            ~~~~~~
    The expected type comes from property 'period' which is declared here on type 'MetricAlarmArgs'

lib/production-infrastructure.ts:777:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

777         threshold: '80',
            ~~~~~~~~~

  node_modules/@pulumi/aws/cloudwatch/metricAlarm.d.ts:546:5
    546     threshold?: pulumi.Input<number>;
            ~~~~~~~~~
    The expected type comes from property 'threshold' which is declared here on type 'MetricAlarmArgs'

lib/production-infrastructure.ts:796:9 - error TS2322: Type 'string' is not assignable to type 'Input<number>'.

796         evaluationPeriods: '2',
            ~~~~~~~~~~~~~~~~~

  node_modules/@pulumi/aws/cloudwatch/metricAlarm.d.ts:487:5
    487     evaluationPeriods: pulumi.Input<number>;
            ~~~~~~~~~~~~~~~~~
    The expected type comes from property 'evaluationPeriods' which is declared here on type 'MetricAlarmArgs'

lib/production-infrastructure.ts:799:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

799         period: '120',
            ~~~~~~

  node_modules/@pulumi/aws/cloudwatch/metricAlarm.d.ts:522:5
    522     period?: pulumi.Input<number>;
            ~~~~~~
    The expected type comes from property 'period' which is declared here on type 'MetricAlarmArgs'

lib/production-infrastructure.ts:801:9 - error TS2322: Type 'string' is not assignable to type 'Input<number> | undefined'.

801         threshold: '10',
            ~~~~~~~~~

  node_modules/@pulumi/aws/cloudwatch/metricAlarm.d.ts:546:5
    546     threshold?: pulumi.Input<number>;
            ~~~~~~~~~
    The expected type comes from property 'threshold' which is declared here on type 'MetricAlarmArgs'

Errors  Files
     9  lib/production-infrastructure.ts:275

```
