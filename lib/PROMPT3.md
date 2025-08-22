1. The code you provided is using hardcoded AWS account iD, that should not be used, use pulumi get current aws account to get the accountId - 

```typescript

// Function to get ELB service account for the region
    function getELBServiceAccount(region: string): string {
      const elbServiceAccounts: { [key: string]: string } = {
        'us-east-1': '127311923021',
        'us-east-2': '033677994240',
        'us-west-1': '027434742980',
        'us-west-2': '797873946194',
        'eu-west-1': '156460612806',
        'eu-central-1': '054676820928',
        'ap-southeast-1': '114774131450',
        'ap-northeast-1': '582318560864',
      };
      return elbServiceAccounts[region] || '127311923021'; // Default to us-east-1
    }
```
2. Also all the resources should be using environment name in its naming convention as prefix or suffix
