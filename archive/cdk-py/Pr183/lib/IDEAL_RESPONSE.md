Please refer to README.md in the /lib directory for detailed explanation. Below is the .github/workflows CICD that meets prompt requirement. Nova failed to develop this adequately. I did not want to add the .github/workflows folder in the directory so as not to trigger any pipeline as we already have CI/CD in place for specific tasks. 







name: CI/CD Pipeline

on:
  push:
    branches:
      - main      # Production
      - staging   # Staging
      - dev       # Development
  pull_request:
    branches:
      - main
      - staging
      - dev

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    env:
      AWS_REGION: us-east-1
      AWS_SECONDARY_REGION: us-east-2
      STACK_ENV: ${{ github.ref_name == 'main' && 'prod' || github.ref_name == 'staging' && 'staging' || 'dev' }}
      ECR_REPOSITORY: <account-id>.dkr.ecr.us-east-1.amazonaws.com/app-repo-${{ github.ref_name == 'main' && 'prod' || github.ref_name == 'staging' && 'staging' || 'dev' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          npm install -g aws-cdk

      - name: Run unit tests
        run: pytest tests/unit/ tests/app/ -v

      - name: Install Trivy for container scanning
        run: |
          sudo apt-get update
          sudo apt-get install -y wget
          wget https://github.com/aquasecurity/trivy/releases/download/v0.31.3/trivy_0.31.3_Linux-64bit.deb
          sudo dpkg -i trivy_0.31.3_Linux-64bit.deb

      - name: Build Docker image
        run: |
          docker build -t app:${{ github.sha }} .
          trivy image --exit-code 1 --severity HIGH,CRITICAL app:${{ github.sha }}

      - name: Configure AWS credentials for us-east-1
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Push Docker image to ECR
        run: |
          aws ecr get-login-password --region ${{ env.AWS_REGION }} | docker login --username AWS --password-stdin ${{ env.ECR_REPOSITORY }}
          docker tag app:${{ github.sha }} ${{ env.ECR_REPOSITORY }}:${{ github.sha }}
          docker push ${{ env.ECR_REPOSITORY }}:${{ github.sha }}

      - name: Synthesize CDK stacks
        run: cdk synth --context stack=${{ env.STACK_ENV }}

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        region: [us-east-1, us-east-2]
    env:
      AWS_REGION: ${{ matrix.region }}
      STACK_ENV: ${{ github.ref_name == 'main' && 'prod' || github.ref_name == 'staging' && 'staging' || 'dev' }}
      ECR_REPOSITORY: <account-id>.dkr.ecr.${{ matrix.region }}.amazonaws.com/app-repo-${{ github.ref_name == 'main' && 'prod' || github.ref_name == 'staging' && 'staging' || 'dev' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          npm install -g aws-cdk

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy CDK stacks
        run: cdk deploy --all --context stack=${{ env.STACK_ENV }} --require-approval never

      - name: Trigger blue-green deployment
        run: |
          aws deploy create-deployment \
            --application-name app-codedeploy-${{ env.AWS_REGION }} \
            --deployment-group-name app-deployment-group-${{ env.AWS_REGION }} \
            --deployment-config-name CodeDeployDefault.ECSBlueGreen \
            --description "GitHub Action deployment for ${{ env.STACK_ENV }} in ${{ env.AWS_REGION }}" \
            --service-role-arn ${{ secrets.CODEDEPLOY_ROLE_ARN }} \
            --ecs-services cluster=app-cluster-${{ env.STACK_ENV }},service=app-service-${{ env.STACK_ENV }} \
            --task-definition ${{ secrets.TASK_DEFINITION_ARN }} \
            --output json > deployment.json
          DEPLOYMENT_ID=$(jq -r '.deploymentId' deployment.json)
          echo "DEPLOYMENT_ID=$DEPLOYMENT_ID" >> $GITHUB_ENV

      - name: Monitor deployment and rollback if needed
        run: |
          STATUS=$(aws deploy get-deployment --deployment-id ${{ env.DEPLOYMENT_ID }} --query 'deploymentInfo.status' --output text)
          until [[ "$STATUS" == "Succeeded" || "$STATUS" == "Failed" ]]; do
            sleep 10
            STATUS=$(aws deploy get-deployment --deployment-id ${{ env.DEPLOYMENT_ID }} --query 'deploymentInfo.status' --output text)
          done
          if [[ "$STATUS" == "Failed" ]]; then
            aws deploy update-deployment \
              --deployment-id ${{ env.DEPLOYMENT_ID }} \
              --service-role-arn ${{ secrets.CODEDEPLOY_ROLE_ARN }} \
              --ecs-services cluster=app-cluster-${{ env.STACK_ENV }},service=app-service-${{ env.STACK_ENV }} \
              --task-definition ${{ secrets.PREVIOUS_TASK_DEFINITION_ARN }}
            exit 1
          fi

      - name: Run integration tests
        run: pytest tests/integration/ -v

      - name: Export deployment logs to CloudWatch
        run: |
          aws logs put-log-events \
            --log-group-name /ecs/app-${{ env.STACK_ENV }} \
            --log-stream-name deployment-${{ github.sha }} \
            --log-events "[{\"timestamp\": $(date +%s000), \"message\": \"Deployment ${{ env.DEPLOYMENT_ID }} for ${{ env.STACK_ENV }} in ${{ env.AWS_REGION }} completed with status: $STATUS\"}]"

  feature-flags:
    needs: deploy
    runs-on: ubuntu-latest
    env:
      AWS_REGION: us-east-1
      STACK_ENV: ${{ github.ref_name == 'main' && 'prod' || github.ref_name == 'staging' && 'staging' || 'dev' }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update feature flags
        run: |
          aws appconfig update-application \
            --application-id appconfig-app-${{ env.STACK_ENV }} \
            --configuration-profile feature-flags \
            --environment ${{ env.STACK_ENV }} \
            --feature-flags "{\"new_feature\": true}"