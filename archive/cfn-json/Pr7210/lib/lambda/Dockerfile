FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies
RUN yum update -y && \
    yum install -y gcc python3-devel mysql-devel && \
    yum clean all

# Copy requirements
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Lambda function code
COPY validator.py ${LAMBDA_TASK_ROOT}/
COPY migration.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD [ "validator.lambda_handler" ]