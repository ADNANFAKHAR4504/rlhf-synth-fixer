Your updated TapStack.yml is still failing cfn-lint with:

W2001 Parameter DBPassword not used.
lib/TapStack.yml:22:3


Please fix the template so that:

The unused DBPassword parameter is completely removed (since we now rely only on the dynamic SSM secure reference for MasterUserPassword).

Ensure the RDSInstance resource directly uses the dynamic reference:

MasterUserPassword: '{{resolve:ssm-secure:/tapstack/prod/dbpassword:1}}'


Review the entire template for any other unused parameters or properties to prevent future W2001 warnings.

Ensure the final TapStack.yml passes cfn-lint cleanly with zero warnings or errors.