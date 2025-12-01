FROM public.ecr.aws/lambda/python:3.11-arm64

# Copy function code
COPY handler.py ${LAMBDA_TASK_ROOT}/

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

CMD ["handler.lambda_handler"]
