# Model Response
```yaml
name: Deploy Infrastructure

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment Environment'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - prod
      region:
        description: 'AWS Region'
        required: true
        default: 'us-east-1'
        type: string
      db_password:
        description: 'Database Password (will be stored as secret)'
        required: true
        type: string

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ github.event.inputs.region }}
      
      - name: Deploy CloudFormation stack
        uses: aws-actions/aws-cloudformation-github-deploy@v1
        with:
          name: ${{ github.event.inputs.environment }}-infrastructure
          template: cloudformation/infrastructure-template.yaml
          no-fail-on-empty-changeset: "1"
          parameter-overrides: >-
            EnvType=${{ github.event.inputs.environment }},
            DBPassword=${{ github.event.inputs.db_password }},
            KmsKeyArn=${{ secrets.KMS_KEY_ARN }}
```