import os
import zipfile
import pulumi
import pulumi_aws as aws


def zip_directory_contents(source_dir: str, output_zip: str):
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                # Skip hidden files if necessary
                if file.startswith("."):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)


class ServerlessComponent(pulumi.ComponentResource):
    def __init__(
        self,
        name: str,
        environment: str,
        tags: dict,
        lambda_role_arn: str,
        handler: str = "lambda_function.lambda_handler",
        runtime: str = "python3.11",
        opts=None,
    ):
        super().__init__("custom:aws:Serverless", name, None, opts)

        lambda_folder = os.path.join(
            os.getcwd(), "lib/components/lambda_files")
        zip_file = os.path.join(os.getcwd(), "lib/components/lambda.zip")

        # 3. Create the zip (only contents)
        zip_directory_contents(lambda_folder, zip_file)

        # 1. Validate lambda.zip exists
        lambda_zip_path = os.path.join(
            os.getcwd(), "lib/components/lambda.zip")
        if not os.path.exists(lambda_zip_path):
            raise FileNotFoundError(
                f"Lambda package {lambda_zip_path} not found.")

        # 2. Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"{name}-lambda-fn",
            runtime=runtime,
            role=lambda_role_arn,
            handler=handler,
            code=pulumi.FileArchive(lambda_zip_path),
            tags={**tags, "Name": f"{environment}-lambda"},
            opts=pulumi.ResourceOptions(parent=self),
        )

        # Register outputs
        self.register_outputs(
            {
                "lambda_name": self.lambda_function.name,
                "lambda_arn": self.lambda_function.arn,
            }
        )
