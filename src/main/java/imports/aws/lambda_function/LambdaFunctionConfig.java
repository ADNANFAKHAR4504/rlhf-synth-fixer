package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionConfig.Jsii$Proxy.class)
public interface LambdaFunctionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#function_name LambdaFunction#function_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFunctionName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#role LambdaFunction#role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#architectures LambdaFunction#architectures}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArchitectures() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#code_signing_config_arn LambdaFunction#code_signing_config_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCodeSigningConfigArn() {
        return null;
    }

    /**
     * dead_letter_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#dead_letter_config LambdaFunction#dead_letter_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionDeadLetterConfig getDeadLetterConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#description LambdaFunction#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * environment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#environment LambdaFunction#environment}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionEnvironment getEnvironment() {
        return null;
    }

    /**
     * ephemeral_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#ephemeral_storage LambdaFunction#ephemeral_storage}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionEphemeralStorage getEphemeralStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#filename LambdaFunction#filename}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFilename() {
        return null;
    }

    /**
     * file_system_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#file_system_config LambdaFunction#file_system_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionFileSystemConfig getFileSystemConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#handler LambdaFunction#handler}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHandler() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#id LambdaFunction#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * image_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_config LambdaFunction#image_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionImageConfig getImageConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_uri LambdaFunction#image_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#kms_key_arn LambdaFunction#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#layers LambdaFunction#layers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLayers() {
        return null;
    }

    /**
     * logging_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#logging_config LambdaFunction#logging_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionLoggingConfig getLoggingConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#memory_size LambdaFunction#memory_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemorySize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#package_type LambdaFunction#package_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPackageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPublish() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replacement_security_group_ids LambdaFunction#replacement_security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReplacementSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReplaceSecurityGroupsOnDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#reserved_concurrent_executions LambdaFunction#reserved_concurrent_executions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReservedConcurrentExecutions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#runtime LambdaFunction#runtime}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRuntime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_bucket LambdaFunction#s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Bucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_key LambdaFunction#s3_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Key() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_object_version LambdaFunction#s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipDestroy() {
        return null;
    }

    /**
     * snap_start block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#snap_start LambdaFunction#snap_start}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionSnapStart getSnapStart() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#source_code_hash LambdaFunction#source_code_hash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceCodeHash() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags LambdaFunction#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags_all LambdaFunction#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeout LambdaFunction#timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeout() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeouts LambdaFunction#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionTimeouts getTimeouts() {
        return null;
    }

    /**
     * tracing_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tracing_config LambdaFunction#tracing_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionTracingConfig getTracingConfig() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#vpc_config LambdaFunction#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaFunctionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionConfig> {
        java.lang.String functionName;
        java.lang.String role;
        java.util.List<java.lang.String> architectures;
        java.lang.String codeSigningConfigArn;
        imports.aws.lambda_function.LambdaFunctionDeadLetterConfig deadLetterConfig;
        java.lang.String description;
        imports.aws.lambda_function.LambdaFunctionEnvironment environment;
        imports.aws.lambda_function.LambdaFunctionEphemeralStorage ephemeralStorage;
        java.lang.String filename;
        imports.aws.lambda_function.LambdaFunctionFileSystemConfig fileSystemConfig;
        java.lang.String handler;
        java.lang.String id;
        imports.aws.lambda_function.LambdaFunctionImageConfig imageConfig;
        java.lang.String imageUri;
        java.lang.String kmsKeyArn;
        java.util.List<java.lang.String> layers;
        imports.aws.lambda_function.LambdaFunctionLoggingConfig loggingConfig;
        java.lang.Number memorySize;
        java.lang.String packageType;
        java.lang.Object publish;
        java.util.List<java.lang.String> replacementSecurityGroupIds;
        java.lang.Object replaceSecurityGroupsOnDestroy;
        java.lang.Number reservedConcurrentExecutions;
        java.lang.String runtime;
        java.lang.String s3Bucket;
        java.lang.String s3Key;
        java.lang.String s3ObjectVersion;
        java.lang.Object skipDestroy;
        imports.aws.lambda_function.LambdaFunctionSnapStart snapStart;
        java.lang.String sourceCodeHash;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number timeout;
        imports.aws.lambda_function.LambdaFunctionTimeouts timeouts;
        imports.aws.lambda_function.LambdaFunctionTracingConfig tracingConfig;
        imports.aws.lambda_function.LambdaFunctionVpcConfig vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LambdaFunctionConfig#getFunctionName}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#function_name LambdaFunction#function_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder functionName(java.lang.String functionName) {
            this.functionName = functionName;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getRole}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#role LambdaFunction#role}. This parameter is required.
         * @return {@code this}
         */
        public Builder role(java.lang.String role) {
            this.role = role;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getArchitectures}
         * @param architectures Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#architectures LambdaFunction#architectures}.
         * @return {@code this}
         */
        public Builder architectures(java.util.List<java.lang.String> architectures) {
            this.architectures = architectures;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getCodeSigningConfigArn}
         * @param codeSigningConfigArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#code_signing_config_arn LambdaFunction#code_signing_config_arn}.
         * @return {@code this}
         */
        public Builder codeSigningConfigArn(java.lang.String codeSigningConfigArn) {
            this.codeSigningConfigArn = codeSigningConfigArn;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getDeadLetterConfig}
         * @param deadLetterConfig dead_letter_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#dead_letter_config LambdaFunction#dead_letter_config}
         * @return {@code this}
         */
        public Builder deadLetterConfig(imports.aws.lambda_function.LambdaFunctionDeadLetterConfig deadLetterConfig) {
            this.deadLetterConfig = deadLetterConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#description LambdaFunction#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#environment LambdaFunction#environment}
         * @return {@code this}
         */
        public Builder environment(imports.aws.lambda_function.LambdaFunctionEnvironment environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getEphemeralStorage}
         * @param ephemeralStorage ephemeral_storage block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#ephemeral_storage LambdaFunction#ephemeral_storage}
         * @return {@code this}
         */
        public Builder ephemeralStorage(imports.aws.lambda_function.LambdaFunctionEphemeralStorage ephemeralStorage) {
            this.ephemeralStorage = ephemeralStorage;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getFilename}
         * @param filename Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#filename LambdaFunction#filename}.
         * @return {@code this}
         */
        public Builder filename(java.lang.String filename) {
            this.filename = filename;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getFileSystemConfig}
         * @param fileSystemConfig file_system_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#file_system_config LambdaFunction#file_system_config}
         * @return {@code this}
         */
        public Builder fileSystemConfig(imports.aws.lambda_function.LambdaFunctionFileSystemConfig fileSystemConfig) {
            this.fileSystemConfig = fileSystemConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getHandler}
         * @param handler Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#handler LambdaFunction#handler}.
         * @return {@code this}
         */
        public Builder handler(java.lang.String handler) {
            this.handler = handler;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#id LambdaFunction#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getImageConfig}
         * @param imageConfig image_config block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_config LambdaFunction#image_config}
         * @return {@code this}
         */
        public Builder imageConfig(imports.aws.lambda_function.LambdaFunctionImageConfig imageConfig) {
            this.imageConfig = imageConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getImageUri}
         * @param imageUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_uri LambdaFunction#image_uri}.
         * @return {@code this}
         */
        public Builder imageUri(java.lang.String imageUri) {
            this.imageUri = imageUri;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#kms_key_arn LambdaFunction#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getLayers}
         * @param layers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#layers LambdaFunction#layers}.
         * @return {@code this}
         */
        public Builder layers(java.util.List<java.lang.String> layers) {
            this.layers = layers;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getLoggingConfig}
         * @param loggingConfig logging_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#logging_config LambdaFunction#logging_config}
         * @return {@code this}
         */
        public Builder loggingConfig(imports.aws.lambda_function.LambdaFunctionLoggingConfig loggingConfig) {
            this.loggingConfig = loggingConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getMemorySize}
         * @param memorySize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#memory_size LambdaFunction#memory_size}.
         * @return {@code this}
         */
        public Builder memorySize(java.lang.Number memorySize) {
            this.memorySize = memorySize;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getPackageType}
         * @param packageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#package_type LambdaFunction#package_type}.
         * @return {@code this}
         */
        public Builder packageType(java.lang.String packageType) {
            this.packageType = packageType;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getPublish}
         * @param publish Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}.
         * @return {@code this}
         */
        public Builder publish(java.lang.Boolean publish) {
            this.publish = publish;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getPublish}
         * @param publish Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}.
         * @return {@code this}
         */
        public Builder publish(com.hashicorp.cdktf.IResolvable publish) {
            this.publish = publish;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getReplacementSecurityGroupIds}
         * @param replacementSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replacement_security_group_ids LambdaFunction#replacement_security_group_ids}.
         * @return {@code this}
         */
        public Builder replacementSecurityGroupIds(java.util.List<java.lang.String> replacementSecurityGroupIds) {
            this.replacementSecurityGroupIds = replacementSecurityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getReplaceSecurityGroupsOnDestroy}
         * @param replaceSecurityGroupsOnDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}.
         * @return {@code this}
         */
        public Builder replaceSecurityGroupsOnDestroy(java.lang.Boolean replaceSecurityGroupsOnDestroy) {
            this.replaceSecurityGroupsOnDestroy = replaceSecurityGroupsOnDestroy;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getReplaceSecurityGroupsOnDestroy}
         * @param replaceSecurityGroupsOnDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}.
         * @return {@code this}
         */
        public Builder replaceSecurityGroupsOnDestroy(com.hashicorp.cdktf.IResolvable replaceSecurityGroupsOnDestroy) {
            this.replaceSecurityGroupsOnDestroy = replaceSecurityGroupsOnDestroy;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getReservedConcurrentExecutions}
         * @param reservedConcurrentExecutions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#reserved_concurrent_executions LambdaFunction#reserved_concurrent_executions}.
         * @return {@code this}
         */
        public Builder reservedConcurrentExecutions(java.lang.Number reservedConcurrentExecutions) {
            this.reservedConcurrentExecutions = reservedConcurrentExecutions;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getRuntime}
         * @param runtime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#runtime LambdaFunction#runtime}.
         * @return {@code this}
         */
        public Builder runtime(java.lang.String runtime) {
            this.runtime = runtime;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_bucket LambdaFunction#s3_bucket}.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getS3Key}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_key LambdaFunction#s3_key}.
         * @return {@code this}
         */
        public Builder s3Key(java.lang.String s3Key) {
            this.s3Key = s3Key;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getS3ObjectVersion}
         * @param s3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_object_version LambdaFunction#s3_object_version}.
         * @return {@code this}
         */
        public Builder s3ObjectVersion(java.lang.String s3ObjectVersion) {
            this.s3ObjectVersion = s3ObjectVersion;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getSkipDestroy}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}.
         * @return {@code this}
         */
        public Builder skipDestroy(java.lang.Boolean skipDestroy) {
            this.skipDestroy = skipDestroy;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getSkipDestroy}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}.
         * @return {@code this}
         */
        public Builder skipDestroy(com.hashicorp.cdktf.IResolvable skipDestroy) {
            this.skipDestroy = skipDestroy;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getSnapStart}
         * @param snapStart snap_start block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#snap_start LambdaFunction#snap_start}
         * @return {@code this}
         */
        public Builder snapStart(imports.aws.lambda_function.LambdaFunctionSnapStart snapStart) {
            this.snapStart = snapStart;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getSourceCodeHash}
         * @param sourceCodeHash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#source_code_hash LambdaFunction#source_code_hash}.
         * @return {@code this}
         */
        public Builder sourceCodeHash(java.lang.String sourceCodeHash) {
            this.sourceCodeHash = sourceCodeHash;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags LambdaFunction#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags_all LambdaFunction#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getTimeout}
         * @param timeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeout LambdaFunction#timeout}.
         * @return {@code this}
         */
        public Builder timeout(java.lang.Number timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeouts LambdaFunction#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lambda_function.LambdaFunctionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getTracingConfig}
         * @param tracingConfig tracing_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tracing_config LambdaFunction#tracing_config}
         * @return {@code this}
         */
        public Builder tracingConfig(imports.aws.lambda_function.LambdaFunctionTracingConfig tracingConfig) {
            this.tracingConfig = tracingConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#vpc_config LambdaFunction#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.lambda_function.LambdaFunctionVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaFunctionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionConfig {
        private final java.lang.String functionName;
        private final java.lang.String role;
        private final java.util.List<java.lang.String> architectures;
        private final java.lang.String codeSigningConfigArn;
        private final imports.aws.lambda_function.LambdaFunctionDeadLetterConfig deadLetterConfig;
        private final java.lang.String description;
        private final imports.aws.lambda_function.LambdaFunctionEnvironment environment;
        private final imports.aws.lambda_function.LambdaFunctionEphemeralStorage ephemeralStorage;
        private final java.lang.String filename;
        private final imports.aws.lambda_function.LambdaFunctionFileSystemConfig fileSystemConfig;
        private final java.lang.String handler;
        private final java.lang.String id;
        private final imports.aws.lambda_function.LambdaFunctionImageConfig imageConfig;
        private final java.lang.String imageUri;
        private final java.lang.String kmsKeyArn;
        private final java.util.List<java.lang.String> layers;
        private final imports.aws.lambda_function.LambdaFunctionLoggingConfig loggingConfig;
        private final java.lang.Number memorySize;
        private final java.lang.String packageType;
        private final java.lang.Object publish;
        private final java.util.List<java.lang.String> replacementSecurityGroupIds;
        private final java.lang.Object replaceSecurityGroupsOnDestroy;
        private final java.lang.Number reservedConcurrentExecutions;
        private final java.lang.String runtime;
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Key;
        private final java.lang.String s3ObjectVersion;
        private final java.lang.Object skipDestroy;
        private final imports.aws.lambda_function.LambdaFunctionSnapStart snapStart;
        private final java.lang.String sourceCodeHash;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number timeout;
        private final imports.aws.lambda_function.LambdaFunctionTimeouts timeouts;
        private final imports.aws.lambda_function.LambdaFunctionTracingConfig tracingConfig;
        private final imports.aws.lambda_function.LambdaFunctionVpcConfig vpcConfig;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.functionName = software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.role = software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.architectures = software.amazon.jsii.Kernel.get(this, "architectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.codeSigningConfigArn = software.amazon.jsii.Kernel.get(this, "codeSigningConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deadLetterConfig = software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionDeadLetterConfig.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionEnvironment.class));
            this.ephemeralStorage = software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionEphemeralStorage.class));
            this.filename = software.amazon.jsii.Kernel.get(this, "filename", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileSystemConfig = software.amazon.jsii.Kernel.get(this, "fileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionFileSystemConfig.class));
            this.handler = software.amazon.jsii.Kernel.get(this, "handler", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageConfig = software.amazon.jsii.Kernel.get(this, "imageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionImageConfig.class));
            this.imageUri = software.amazon.jsii.Kernel.get(this, "imageUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.layers = software.amazon.jsii.Kernel.get(this, "layers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.loggingConfig = software.amazon.jsii.Kernel.get(this, "loggingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionLoggingConfig.class));
            this.memorySize = software.amazon.jsii.Kernel.get(this, "memorySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.packageType = software.amazon.jsii.Kernel.get(this, "packageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publish = software.amazon.jsii.Kernel.get(this, "publish", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.replacementSecurityGroupIds = software.amazon.jsii.Kernel.get(this, "replacementSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.replaceSecurityGroupsOnDestroy = software.amazon.jsii.Kernel.get(this, "replaceSecurityGroupsOnDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.reservedConcurrentExecutions = software.amazon.jsii.Kernel.get(this, "reservedConcurrentExecutions", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.runtime = software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Key = software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3ObjectVersion = software.amazon.jsii.Kernel.get(this, "s3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.skipDestroy = software.amazon.jsii.Kernel.get(this, "skipDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapStart = software.amazon.jsii.Kernel.get(this, "snapStart", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionSnapStart.class));
            this.sourceCodeHash = software.amazon.jsii.Kernel.get(this, "sourceCodeHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionTimeouts.class));
            this.tracingConfig = software.amazon.jsii.Kernel.get(this, "tracingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionTracingConfig.class));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionVpcConfig.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.functionName = java.util.Objects.requireNonNull(builder.functionName, "functionName is required");
            this.role = java.util.Objects.requireNonNull(builder.role, "role is required");
            this.architectures = builder.architectures;
            this.codeSigningConfigArn = builder.codeSigningConfigArn;
            this.deadLetterConfig = builder.deadLetterConfig;
            this.description = builder.description;
            this.environment = builder.environment;
            this.ephemeralStorage = builder.ephemeralStorage;
            this.filename = builder.filename;
            this.fileSystemConfig = builder.fileSystemConfig;
            this.handler = builder.handler;
            this.id = builder.id;
            this.imageConfig = builder.imageConfig;
            this.imageUri = builder.imageUri;
            this.kmsKeyArn = builder.kmsKeyArn;
            this.layers = builder.layers;
            this.loggingConfig = builder.loggingConfig;
            this.memorySize = builder.memorySize;
            this.packageType = builder.packageType;
            this.publish = builder.publish;
            this.replacementSecurityGroupIds = builder.replacementSecurityGroupIds;
            this.replaceSecurityGroupsOnDestroy = builder.replaceSecurityGroupsOnDestroy;
            this.reservedConcurrentExecutions = builder.reservedConcurrentExecutions;
            this.runtime = builder.runtime;
            this.s3Bucket = builder.s3Bucket;
            this.s3Key = builder.s3Key;
            this.s3ObjectVersion = builder.s3ObjectVersion;
            this.skipDestroy = builder.skipDestroy;
            this.snapStart = builder.snapStart;
            this.sourceCodeHash = builder.sourceCodeHash;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeout = builder.timeout;
            this.timeouts = builder.timeouts;
            this.tracingConfig = builder.tracingConfig;
            this.vpcConfig = builder.vpcConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getFunctionName() {
            return this.functionName;
        }

        @Override
        public final java.lang.String getRole() {
            return this.role;
        }

        @Override
        public final java.util.List<java.lang.String> getArchitectures() {
            return this.architectures;
        }

        @Override
        public final java.lang.String getCodeSigningConfigArn() {
            return this.codeSigningConfigArn;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionDeadLetterConfig getDeadLetterConfig() {
            return this.deadLetterConfig;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionEnvironment getEnvironment() {
            return this.environment;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionEphemeralStorage getEphemeralStorage() {
            return this.ephemeralStorage;
        }

        @Override
        public final java.lang.String getFilename() {
            return this.filename;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionFileSystemConfig getFileSystemConfig() {
            return this.fileSystemConfig;
        }

        @Override
        public final java.lang.String getHandler() {
            return this.handler;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionImageConfig getImageConfig() {
            return this.imageConfig;
        }

        @Override
        public final java.lang.String getImageUri() {
            return this.imageUri;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.util.List<java.lang.String> getLayers() {
            return this.layers;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionLoggingConfig getLoggingConfig() {
            return this.loggingConfig;
        }

        @Override
        public final java.lang.Number getMemorySize() {
            return this.memorySize;
        }

        @Override
        public final java.lang.String getPackageType() {
            return this.packageType;
        }

        @Override
        public final java.lang.Object getPublish() {
            return this.publish;
        }

        @Override
        public final java.util.List<java.lang.String> getReplacementSecurityGroupIds() {
            return this.replacementSecurityGroupIds;
        }

        @Override
        public final java.lang.Object getReplaceSecurityGroupsOnDestroy() {
            return this.replaceSecurityGroupsOnDestroy;
        }

        @Override
        public final java.lang.Number getReservedConcurrentExecutions() {
            return this.reservedConcurrentExecutions;
        }

        @Override
        public final java.lang.String getRuntime() {
            return this.runtime;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final java.lang.String getS3Key() {
            return this.s3Key;
        }

        @Override
        public final java.lang.String getS3ObjectVersion() {
            return this.s3ObjectVersion;
        }

        @Override
        public final java.lang.Object getSkipDestroy() {
            return this.skipDestroy;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionSnapStart getSnapStart() {
            return this.snapStart;
        }

        @Override
        public final java.lang.String getSourceCodeHash() {
            return this.sourceCodeHash;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Number getTimeout() {
            return this.timeout;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionTracingConfig getTracingConfig() {
            return this.tracingConfig;
        }

        @Override
        public final imports.aws.lambda_function.LambdaFunctionVpcConfig getVpcConfig() {
            return this.vpcConfig;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("functionName", om.valueToTree(this.getFunctionName()));
            data.set("role", om.valueToTree(this.getRole()));
            if (this.getArchitectures() != null) {
                data.set("architectures", om.valueToTree(this.getArchitectures()));
            }
            if (this.getCodeSigningConfigArn() != null) {
                data.set("codeSigningConfigArn", om.valueToTree(this.getCodeSigningConfigArn()));
            }
            if (this.getDeadLetterConfig() != null) {
                data.set("deadLetterConfig", om.valueToTree(this.getDeadLetterConfig()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getEphemeralStorage() != null) {
                data.set("ephemeralStorage", om.valueToTree(this.getEphemeralStorage()));
            }
            if (this.getFilename() != null) {
                data.set("filename", om.valueToTree(this.getFilename()));
            }
            if (this.getFileSystemConfig() != null) {
                data.set("fileSystemConfig", om.valueToTree(this.getFileSystemConfig()));
            }
            if (this.getHandler() != null) {
                data.set("handler", om.valueToTree(this.getHandler()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageConfig() != null) {
                data.set("imageConfig", om.valueToTree(this.getImageConfig()));
            }
            if (this.getImageUri() != null) {
                data.set("imageUri", om.valueToTree(this.getImageUri()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getLayers() != null) {
                data.set("layers", om.valueToTree(this.getLayers()));
            }
            if (this.getLoggingConfig() != null) {
                data.set("loggingConfig", om.valueToTree(this.getLoggingConfig()));
            }
            if (this.getMemorySize() != null) {
                data.set("memorySize", om.valueToTree(this.getMemorySize()));
            }
            if (this.getPackageType() != null) {
                data.set("packageType", om.valueToTree(this.getPackageType()));
            }
            if (this.getPublish() != null) {
                data.set("publish", om.valueToTree(this.getPublish()));
            }
            if (this.getReplacementSecurityGroupIds() != null) {
                data.set("replacementSecurityGroupIds", om.valueToTree(this.getReplacementSecurityGroupIds()));
            }
            if (this.getReplaceSecurityGroupsOnDestroy() != null) {
                data.set("replaceSecurityGroupsOnDestroy", om.valueToTree(this.getReplaceSecurityGroupsOnDestroy()));
            }
            if (this.getReservedConcurrentExecutions() != null) {
                data.set("reservedConcurrentExecutions", om.valueToTree(this.getReservedConcurrentExecutions()));
            }
            if (this.getRuntime() != null) {
                data.set("runtime", om.valueToTree(this.getRuntime()));
            }
            if (this.getS3Bucket() != null) {
                data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            }
            if (this.getS3Key() != null) {
                data.set("s3Key", om.valueToTree(this.getS3Key()));
            }
            if (this.getS3ObjectVersion() != null) {
                data.set("s3ObjectVersion", om.valueToTree(this.getS3ObjectVersion()));
            }
            if (this.getSkipDestroy() != null) {
                data.set("skipDestroy", om.valueToTree(this.getSkipDestroy()));
            }
            if (this.getSnapStart() != null) {
                data.set("snapStart", om.valueToTree(this.getSnapStart()));
            }
            if (this.getSourceCodeHash() != null) {
                data.set("sourceCodeHash", om.valueToTree(this.getSourceCodeHash()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTracingConfig() != null) {
                data.set("tracingConfig", om.valueToTree(this.getTracingConfig()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaFunction.LambdaFunctionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionConfig.Jsii$Proxy that = (LambdaFunctionConfig.Jsii$Proxy) o;

            if (!functionName.equals(that.functionName)) return false;
            if (!role.equals(that.role)) return false;
            if (this.architectures != null ? !this.architectures.equals(that.architectures) : that.architectures != null) return false;
            if (this.codeSigningConfigArn != null ? !this.codeSigningConfigArn.equals(that.codeSigningConfigArn) : that.codeSigningConfigArn != null) return false;
            if (this.deadLetterConfig != null ? !this.deadLetterConfig.equals(that.deadLetterConfig) : that.deadLetterConfig != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.ephemeralStorage != null ? !this.ephemeralStorage.equals(that.ephemeralStorage) : that.ephemeralStorage != null) return false;
            if (this.filename != null ? !this.filename.equals(that.filename) : that.filename != null) return false;
            if (this.fileSystemConfig != null ? !this.fileSystemConfig.equals(that.fileSystemConfig) : that.fileSystemConfig != null) return false;
            if (this.handler != null ? !this.handler.equals(that.handler) : that.handler != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageConfig != null ? !this.imageConfig.equals(that.imageConfig) : that.imageConfig != null) return false;
            if (this.imageUri != null ? !this.imageUri.equals(that.imageUri) : that.imageUri != null) return false;
            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            if (this.layers != null ? !this.layers.equals(that.layers) : that.layers != null) return false;
            if (this.loggingConfig != null ? !this.loggingConfig.equals(that.loggingConfig) : that.loggingConfig != null) return false;
            if (this.memorySize != null ? !this.memorySize.equals(that.memorySize) : that.memorySize != null) return false;
            if (this.packageType != null ? !this.packageType.equals(that.packageType) : that.packageType != null) return false;
            if (this.publish != null ? !this.publish.equals(that.publish) : that.publish != null) return false;
            if (this.replacementSecurityGroupIds != null ? !this.replacementSecurityGroupIds.equals(that.replacementSecurityGroupIds) : that.replacementSecurityGroupIds != null) return false;
            if (this.replaceSecurityGroupsOnDestroy != null ? !this.replaceSecurityGroupsOnDestroy.equals(that.replaceSecurityGroupsOnDestroy) : that.replaceSecurityGroupsOnDestroy != null) return false;
            if (this.reservedConcurrentExecutions != null ? !this.reservedConcurrentExecutions.equals(that.reservedConcurrentExecutions) : that.reservedConcurrentExecutions != null) return false;
            if (this.runtime != null ? !this.runtime.equals(that.runtime) : that.runtime != null) return false;
            if (this.s3Bucket != null ? !this.s3Bucket.equals(that.s3Bucket) : that.s3Bucket != null) return false;
            if (this.s3Key != null ? !this.s3Key.equals(that.s3Key) : that.s3Key != null) return false;
            if (this.s3ObjectVersion != null ? !this.s3ObjectVersion.equals(that.s3ObjectVersion) : that.s3ObjectVersion != null) return false;
            if (this.skipDestroy != null ? !this.skipDestroy.equals(that.skipDestroy) : that.skipDestroy != null) return false;
            if (this.snapStart != null ? !this.snapStart.equals(that.snapStart) : that.snapStart != null) return false;
            if (this.sourceCodeHash != null ? !this.sourceCodeHash.equals(that.sourceCodeHash) : that.sourceCodeHash != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeout != null ? !this.timeout.equals(that.timeout) : that.timeout != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.tracingConfig != null ? !this.tracingConfig.equals(that.tracingConfig) : that.tracingConfig != null) return false;
            if (this.vpcConfig != null ? !this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.functionName.hashCode();
            result = 31 * result + (this.role.hashCode());
            result = 31 * result + (this.architectures != null ? this.architectures.hashCode() : 0);
            result = 31 * result + (this.codeSigningConfigArn != null ? this.codeSigningConfigArn.hashCode() : 0);
            result = 31 * result + (this.deadLetterConfig != null ? this.deadLetterConfig.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.ephemeralStorage != null ? this.ephemeralStorage.hashCode() : 0);
            result = 31 * result + (this.filename != null ? this.filename.hashCode() : 0);
            result = 31 * result + (this.fileSystemConfig != null ? this.fileSystemConfig.hashCode() : 0);
            result = 31 * result + (this.handler != null ? this.handler.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageConfig != null ? this.imageConfig.hashCode() : 0);
            result = 31 * result + (this.imageUri != null ? this.imageUri.hashCode() : 0);
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            result = 31 * result + (this.layers != null ? this.layers.hashCode() : 0);
            result = 31 * result + (this.loggingConfig != null ? this.loggingConfig.hashCode() : 0);
            result = 31 * result + (this.memorySize != null ? this.memorySize.hashCode() : 0);
            result = 31 * result + (this.packageType != null ? this.packageType.hashCode() : 0);
            result = 31 * result + (this.publish != null ? this.publish.hashCode() : 0);
            result = 31 * result + (this.replacementSecurityGroupIds != null ? this.replacementSecurityGroupIds.hashCode() : 0);
            result = 31 * result + (this.replaceSecurityGroupsOnDestroy != null ? this.replaceSecurityGroupsOnDestroy.hashCode() : 0);
            result = 31 * result + (this.reservedConcurrentExecutions != null ? this.reservedConcurrentExecutions.hashCode() : 0);
            result = 31 * result + (this.runtime != null ? this.runtime.hashCode() : 0);
            result = 31 * result + (this.s3Bucket != null ? this.s3Bucket.hashCode() : 0);
            result = 31 * result + (this.s3Key != null ? this.s3Key.hashCode() : 0);
            result = 31 * result + (this.s3ObjectVersion != null ? this.s3ObjectVersion.hashCode() : 0);
            result = 31 * result + (this.skipDestroy != null ? this.skipDestroy.hashCode() : 0);
            result = 31 * result + (this.snapStart != null ? this.snapStart.hashCode() : 0);
            result = 31 * result + (this.sourceCodeHash != null ? this.sourceCodeHash.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.tracingConfig != null ? this.tracingConfig.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
