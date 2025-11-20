# model_failure.md – Sub_T05 (CI/CD for GCP ML Platform)

This document captures why the previous LLM-generated solution for **Sub_T05 – CI/CD Pipeline Optimization (GCP ML Platform)** is **not ideal / partially non-compliant** with the prompt and with our usual Sub_T01/Sub_T04 quality bar.

---

## 1. Functional / Correctness Issues

### 1.1 `.model_version` artifact path mismatch

**What it did**

- `model-build` job:

  ```yaml
  - name: Upload model version artifact
    uses: actions/upload-artifact@v4
    with:
      name: model-version
      path: .model_version
