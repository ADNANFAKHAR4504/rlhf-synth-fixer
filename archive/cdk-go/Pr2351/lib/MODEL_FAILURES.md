# Review of Model Responses

Here's a breakdown of the issues we saw in the model's responses while trying to build our AWS CDK Go project.

## Summary of Issues

The model ran into a few different problems, from getting the project structure wrong at the start to hitting AWS limits during deployment.

---

### Issue #1: Wrong Project Structure

- **Source:** `MODEL_RESPONSE.md`
- **What Happened:** The first attempt didn't follow our `lib` and `bin` directory structure. It put everything into a single `main.go` file and treated our stack like a standalone program. This immediately broke our build process because you can't import a `main` package.
- **Result:** The code was incompatible with our CI/CD pipeline from the get-go.

---

### Issue #2: Go Compilation Bugs

- **Source:** `MODEL_RESPONSE2.md`
- **What Happened:** Even after fixing the structure, the next response had some basic Go errors that stopped it from compiling:
  1.  **Unused Variables:** It created variables like `commonTags` and `instanceProfile` but never actually used them.
  2.  **Wrong Struct Field:** It tried to use a `Generation` field for the Amazon Linux AMI, which isn't a valid option in our CDK version.
  3.  **Incorrect Test Package:** The unit test was put in `package tests` instead of `package lib_test`, which caused a conflict.
- **Result:** These bugs blocked the build and prevented any tests from running.

---

### Issue #3: Hitting AWS Quotas

- **Source:** `MODEL_RESPONSE3.md`
- **What Happened:** The third response correctly figured out why our deployment was failing—we were hitting the account's Elastic IP limit because the VPC was creating NAT Gateways by default. However, instead of giving a single, clear fix, it offered a few different solutions.
- **Result:** While the diagnosis was right, the response wasn't a direct fix and still required us to figure out the best path forward.

---

### Issue #4: Needed a Lot of Hand-Holding

- **Across all responses:** A running theme was that the model couldn't get to the right answer on its own. We had to go back and forth, with each fix uncovering a new problem.
  - We fixed the project structure, but that led to compile errors.
  - We fixed the compile errors, but that led to deployment errors.
  - We fixed the deployment error (by removing CloudTrail), but that created more compile errors and meant we had to update all the tests.
- **Result:** It took a lot of trial and error and very specific feedback to get to the final, working code.

---

## Final Thoughts

The ideal solution is a clean, working CDK stack that fits our project structure and anticipates potential issues like AWS quotas. The model's attempts showed a few blind spots, especially around Go's package rules, API specifics, and the realities of deploying to a live AWS account.
