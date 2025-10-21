# Original User Request

The user reported issues on branch `synth-6174408141` and requested assistance with the following tasks:

## Primary Request
```
Run ./scripts/synth.sh and fix the lint and synth errors.
```

## Follow-up Requests

### Issue 1: Test Coverage
```
Check my unit test and run it. Rewrite it if not properly written
```

### Issue 2: Coverage Improvement  
```
improve the coverage to at least 90%
```

### Issue 3: Deployment
```
change the stackname from TapStackdev to TapStackstage and deploy
```

## Initial State
- Project had lint errors (9.42/10 score) 
- CDKTF synth was failing due to multiple issues
- Unit tests were written for AWS CDK instead of CDKTF
- Missing file structure (lib/__init__.py)
- Nested lib/lib directory structure issue
- Coverage was only at 83%
- Stack name needed to be changed from dev to stage environment

## Expected Outcome
- Clean lint score
- Successful CDKTF synthesis 
- Working unit tests with 90%+ coverage
- Successful deployment of TapStackstage
- Proper CDKTF project structure
