# MODEL FAILURES

The following failures were observed in the model's response compared to the ideal response:

## 1. Missing or Incorrect Resources

- Initially omitted IAM roles (`ProdEC2Role`, `ProdRDSRole`) and instance profile (`ProdEC2InstanceProfile`).
  This caused unit test failures and required additional iterations to resolve.
- Did not implement conditional listeners for ALB (HTTPS/HTTP) at first; used a single listener instead of conditional resources.

## 2. Incomplete Conditional Logic

- Did not handle ACM/HTTPS enablement via parameters and conditions until prompted.
- Missed fallback to HTTP listener when ACM was disabled or domain was not provided.

## 3. Least Privilege IAM

- IAM policies were not scoped to least privilege initially.
  The model required user prompt to restrict actions and resources for compliance.

## 4. Tagging and Naming

- Some resources were missing required `Name` and `Environment` tags in early iterations.
- Resource naming convention was not enforced for all resources at first.

## 5. Test Coverage

- Initial unit and integration tests did not cover IAM, security groups, subnet groups, S3 bucket policy, and tagging.
- Did not use `toContainEqual` for object comparison in unit tests, causing matcher errors.
- Did not handle conditional listeners in unit tests, resulting in undefined errors.

## 6. Encoding and Output

- Did not specify UTF-8 encoding for JSON output until requested.

## 7. Markdownlint Compliance

- Documentation and markdown files did not follow markdownlint rules.
  This included blank lines around headings/lists, line length, and trailing newline.

---

These failures were corrected through iterative improvements, user feedback, and validation against the ideal response.
The final solution now matches all requirements and best practices.