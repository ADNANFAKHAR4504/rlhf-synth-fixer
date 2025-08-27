I’m getting this error on stack deploy:

```
Resource tap-config-bucket-718240086340-us-east-1-pr1926 must be in ARN format or '*'
```

Looks like the IAM policy is referencing the bucket name directly instead of its ARN. Please fix the template/CDK code so that:

- Bucket policies use `arn:aws:s3:::bucket-name` for bucket-level actions and `arn:aws:s3:::bucket-name/*` for object-level actions.
- Use dynamic references (`!Ref`, `bucket.bucket_arn`, `bucket.arn_for_objects('*')`) instead of hardcoding names.
- Keep policies least-privilege.

Expected: stack deploys cleanly without the ARN error.
