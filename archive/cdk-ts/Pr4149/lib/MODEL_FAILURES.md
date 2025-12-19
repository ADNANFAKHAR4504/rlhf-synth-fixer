# MODEL FAILURES — identified issues

1) AI provenance / chain-of-thought present  
   - File contains "Reasoning Trace" and planning text.

2) Hardcoded region  
   - Region values hardcoded in code.

3) Hardcoded AMI ID  
   - AMI IDs are specified for a single region.

4) S3 bucket naming and global collisions  
   - Explicit bucketName values risk global name conflicts.

5) Cross-region replication implementation  
   - Replication attempted within a single-stack pattern (cross-region issues).

6) IAM policies are too broad  
   - Policies use overly permissive resource ARNs (e.g., arn:aws:s3:::*).

7) Using roleArn tokens in CfnBucket.replicationConfiguration  
   - Replication role references may be invalid at synth time.

8) S3 security controls missing  
   - SSE and PublicAccessBlock not enforced consistently.

9) Suffix handling inconsistent and fragile  
   - Suffix derivation and sanitization are inconsistent.

10) Resource name collisions and length limits  
    - Names built without sanitization/truncation risk exceeding limits.

11) Cross-region assumption & deploy order not documented  
    - Deployment order and cross-region requirements are absent.

12) Excessive permissive EC2/IAM policy statements  
    - EC2/IAM policies grant broader S3 access than necessary.

13) CDK API misuse / runtime correctness risk  
    - Certain CDK usages may cause synth/runtime errors.

14) Comments indicating TODO / "need to refine" remain  
    - TODOs and unresolved notes are present in code.

    