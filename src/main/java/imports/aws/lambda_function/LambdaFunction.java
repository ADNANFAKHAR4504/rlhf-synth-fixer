package imports.aws.lambda_function;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function aws_lambda_function}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunction")
public class LambdaFunction extends com.hashicorp.cdktf.TerraformResource {

    protected LambdaFunction(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaFunction(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lambda_function.LambdaFunction.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function aws_lambda_function} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LambdaFunction(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LambdaFunction resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaFunction to import. This parameter is required.
     * @param importFromId The id of the existing LambdaFunction that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LambdaFunction to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_function.LambdaFunction.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LambdaFunction resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaFunction to import. This parameter is required.
     * @param importFromId The id of the existing LambdaFunction that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_function.LambdaFunction.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDeadLetterConfig(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionDeadLetterConfig value) {
        software.amazon.jsii.Kernel.call(this, "putDeadLetterConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnvironment(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionEnvironment value) {
        software.amazon.jsii.Kernel.call(this, "putEnvironment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEphemeralStorage(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionEphemeralStorage value) {
        software.amazon.jsii.Kernel.call(this, "putEphemeralStorage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFileSystemConfig(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionFileSystemConfig value) {
        software.amazon.jsii.Kernel.call(this, "putFileSystemConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImageConfig(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionImageConfig value) {
        software.amazon.jsii.Kernel.call(this, "putImageConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLoggingConfig(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionLoggingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putLoggingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnapStart(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionSnapStart value) {
        software.amazon.jsii.Kernel.call(this, "putSnapStart", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTracingConfig(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionTracingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putTracingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArchitectures() {
        software.amazon.jsii.Kernel.call(this, "resetArchitectures", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeSigningConfigArn() {
        software.amazon.jsii.Kernel.call(this, "resetCodeSigningConfigArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeadLetterConfig() {
        software.amazon.jsii.Kernel.call(this, "resetDeadLetterConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironment() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralStorage() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralStorage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilename() {
        software.amazon.jsii.Kernel.call(this, "resetFilename", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileSystemConfig() {
        software.amazon.jsii.Kernel.call(this, "resetFileSystemConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHandler() {
        software.amazon.jsii.Kernel.call(this, "resetHandler", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageConfig() {
        software.amazon.jsii.Kernel.call(this, "resetImageConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageUri() {
        software.amazon.jsii.Kernel.call(this, "resetImageUri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLayers() {
        software.amazon.jsii.Kernel.call(this, "resetLayers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLoggingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetLoggingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemorySize() {
        software.amazon.jsii.Kernel.call(this, "resetMemorySize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPackageType() {
        software.amazon.jsii.Kernel.call(this, "resetPackageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPublish() {
        software.amazon.jsii.Kernel.call(this, "resetPublish", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplacementSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetReplacementSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplaceSecurityGroupsOnDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetReplaceSecurityGroupsOnDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReservedConcurrentExecutions() {
        software.amazon.jsii.Kernel.call(this, "resetReservedConcurrentExecutions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuntime() {
        software.amazon.jsii.Kernel.call(this, "resetRuntime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Bucket() {
        software.amazon.jsii.Kernel.call(this, "resetS3Bucket", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Key() {
        software.amazon.jsii.Kernel.call(this, "resetS3Key", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3ObjectVersion() {
        software.amazon.jsii.Kernel.call(this, "resetS3ObjectVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetSkipDestroy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapStart() {
        software.amazon.jsii.Kernel.call(this, "resetSnapStart", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceCodeHash() {
        software.amazon.jsii.Kernel.call(this, "resetSourceCodeHash", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTracingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTracingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodeSha256() {
        return software.amazon.jsii.Kernel.get(this, "codeSha256", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionDeadLetterConfigOutputReference getDeadLetterConfig() {
        return software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionDeadLetterConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionEnvironmentOutputReference getEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionEnvironmentOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionEphemeralStorageOutputReference getEphemeralStorage() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionEphemeralStorageOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionFileSystemConfigOutputReference getFileSystemConfig() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionFileSystemConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionImageConfigOutputReference getImageConfig() {
        return software.amazon.jsii.Kernel.get(this, "imageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionImageConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInvokeArn() {
        return software.amazon.jsii.Kernel.get(this, "invokeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModified() {
        return software.amazon.jsii.Kernel.get(this, "lastModified", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionLoggingConfigOutputReference getLoggingConfig() {
        return software.amazon.jsii.Kernel.get(this, "loggingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionLoggingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualifiedArn() {
        return software.amazon.jsii.Kernel.get(this, "qualifiedArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualifiedInvokeArn() {
        return software.amazon.jsii.Kernel.get(this, "qualifiedInvokeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningJobArn() {
        return software.amazon.jsii.Kernel.get(this, "signingJobArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSigningProfileVersionArn() {
        return software.amazon.jsii.Kernel.get(this, "signingProfileVersionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionSnapStartOutputReference getSnapStart() {
        return software.amazon.jsii.Kernel.get(this, "snapStart", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionSnapStartOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSourceCodeSize() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionTracingConfigOutputReference getTracingConfig() {
        return software.amazon.jsii.Kernel.get(this, "tracingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionTracingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lambda_function.LambdaFunctionVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArchitecturesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "architecturesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodeSigningConfigArnInput() {
        return software.amazon.jsii.Kernel.get(this, "codeSigningConfigArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionDeadLetterConfig getDeadLetterConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "deadLetterConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionDeadLetterConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionEnvironment getEnvironmentInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionEnvironment.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionEphemeralStorage getEphemeralStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralStorageInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionEphemeralStorage.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFilenameInput() {
        return software.amazon.jsii.Kernel.get(this, "filenameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionFileSystemConfig getFileSystemConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionFileSystemConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "functionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHandlerInput() {
        return software.amazon.jsii.Kernel.get(this, "handlerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionImageConfig getImageConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "imageConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionImageConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageUriInput() {
        return software.amazon.jsii.Kernel.get(this, "imageUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLayersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "layersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionLoggingConfig getLoggingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionLoggingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMemorySizeInput() {
        return software.amazon.jsii.Kernel.get(this, "memorySizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPackageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "packageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPublishInput() {
        return software.amazon.jsii.Kernel.get(this, "publishInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReplacementSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "replacementSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReplaceSecurityGroupsOnDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "replaceSecurityGroupsOnDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReservedConcurrentExecutionsInput() {
        return software.amazon.jsii.Kernel.get(this, "reservedConcurrentExecutionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "roleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ObjectVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "skipDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionSnapStart getSnapStartInput() {
        return software.amazon.jsii.Kernel.get(this, "snapStartInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionSnapStart.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceCodeHashInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeHashInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionTracingConfig getTracingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "tracingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionTracingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionVpcConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getArchitectures() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "architectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setArchitectures(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "architectures", java.util.Objects.requireNonNull(value, "architectures is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodeSigningConfigArn() {
        return software.amazon.jsii.Kernel.get(this, "codeSigningConfigArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodeSigningConfigArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codeSigningConfigArn", java.util.Objects.requireNonNull(value, "codeSigningConfigArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFilename() {
        return software.amazon.jsii.Kernel.get(this, "filename", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFilename(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "filename", java.util.Objects.requireNonNull(value, "filename is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionName() {
        return software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionName", java.util.Objects.requireNonNull(value, "functionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHandler() {
        return software.amazon.jsii.Kernel.get(this, "handler", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHandler(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "handler", java.util.Objects.requireNonNull(value, "handler is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageUri() {
        return software.amazon.jsii.Kernel.get(this, "imageUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageUri", java.util.Objects.requireNonNull(value, "imageUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLayers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "layers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLayers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "layers", java.util.Objects.requireNonNull(value, "layers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemorySize() {
        return software.amazon.jsii.Kernel.get(this, "memorySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMemorySize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "memorySize", java.util.Objects.requireNonNull(value, "memorySize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPackageType() {
        return software.amazon.jsii.Kernel.get(this, "packageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPackageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "packageType", java.util.Objects.requireNonNull(value, "packageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPublish() {
        return software.amazon.jsii.Kernel.get(this, "publish", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPublish(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "publish", java.util.Objects.requireNonNull(value, "publish is required"));
    }

    public void setPublish(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "publish", java.util.Objects.requireNonNull(value, "publish is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getReplacementSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "replacementSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setReplacementSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "replacementSecurityGroupIds", java.util.Objects.requireNonNull(value, "replacementSecurityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReplaceSecurityGroupsOnDestroy() {
        return software.amazon.jsii.Kernel.get(this, "replaceSecurityGroupsOnDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReplaceSecurityGroupsOnDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "replaceSecurityGroupsOnDestroy", java.util.Objects.requireNonNull(value, "replaceSecurityGroupsOnDestroy is required"));
    }

    public void setReplaceSecurityGroupsOnDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "replaceSecurityGroupsOnDestroy", java.util.Objects.requireNonNull(value, "replaceSecurityGroupsOnDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReservedConcurrentExecutions() {
        return software.amazon.jsii.Kernel.get(this, "reservedConcurrentExecutions", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReservedConcurrentExecutions(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "reservedConcurrentExecutions", java.util.Objects.requireNonNull(value, "reservedConcurrentExecutions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRole() {
        return software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "role", java.util.Objects.requireNonNull(value, "role is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuntime() {
        return software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuntime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "runtime", java.util.Objects.requireNonNull(value, "runtime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Bucket", java.util.Objects.requireNonNull(value, "s3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Key() {
        return software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Key(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Key", java.util.Objects.requireNonNull(value, "s3Key is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3ObjectVersion() {
        return software.amazon.jsii.Kernel.get(this, "s3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3ObjectVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3ObjectVersion", java.util.Objects.requireNonNull(value, "s3ObjectVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipDestroy() {
        return software.amazon.jsii.Kernel.get(this, "skipDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipDestroy", java.util.Objects.requireNonNull(value, "skipDestroy is required"));
    }

    public void setSkipDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipDestroy", java.util.Objects.requireNonNull(value, "skipDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceCodeHash() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeHash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceCodeHash(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceCodeHash", java.util.Objects.requireNonNull(value, "sourceCodeHash is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeout() {
        return software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeout", java.util.Objects.requireNonNull(value, "timeout is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lambda_function.LambdaFunction}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lambda_function.LambdaFunction> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.lambda_function.LambdaFunctionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lambda_function.LambdaFunctionConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#function_name LambdaFunction#function_name}.
         * <p>
         * @return {@code this}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#function_name LambdaFunction#function_name}. This parameter is required.
         */
        public Builder functionName(final java.lang.String functionName) {
            this.config.functionName(functionName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#role LambdaFunction#role}.
         * <p>
         * @return {@code this}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#role LambdaFunction#role}. This parameter is required.
         */
        public Builder role(final java.lang.String role) {
            this.config.role(role);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#architectures LambdaFunction#architectures}.
         * <p>
         * @return {@code this}
         * @param architectures Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#architectures LambdaFunction#architectures}. This parameter is required.
         */
        public Builder architectures(final java.util.List<java.lang.String> architectures) {
            this.config.architectures(architectures);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#code_signing_config_arn LambdaFunction#code_signing_config_arn}.
         * <p>
         * @return {@code this}
         * @param codeSigningConfigArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#code_signing_config_arn LambdaFunction#code_signing_config_arn}. This parameter is required.
         */
        public Builder codeSigningConfigArn(final java.lang.String codeSigningConfigArn) {
            this.config.codeSigningConfigArn(codeSigningConfigArn);
            return this;
        }

        /**
         * dead_letter_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#dead_letter_config LambdaFunction#dead_letter_config}
         * <p>
         * @return {@code this}
         * @param deadLetterConfig dead_letter_config block. This parameter is required.
         */
        public Builder deadLetterConfig(final imports.aws.lambda_function.LambdaFunctionDeadLetterConfig deadLetterConfig) {
            this.config.deadLetterConfig(deadLetterConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#description LambdaFunction#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#description LambdaFunction#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * environment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#environment LambdaFunction#environment}
         * <p>
         * @return {@code this}
         * @param environment environment block. This parameter is required.
         */
        public Builder environment(final imports.aws.lambda_function.LambdaFunctionEnvironment environment) {
            this.config.environment(environment);
            return this;
        }

        /**
         * ephemeral_storage block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#ephemeral_storage LambdaFunction#ephemeral_storage}
         * <p>
         * @return {@code this}
         * @param ephemeralStorage ephemeral_storage block. This parameter is required.
         */
        public Builder ephemeralStorage(final imports.aws.lambda_function.LambdaFunctionEphemeralStorage ephemeralStorage) {
            this.config.ephemeralStorage(ephemeralStorage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#filename LambdaFunction#filename}.
         * <p>
         * @return {@code this}
         * @param filename Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#filename LambdaFunction#filename}. This parameter is required.
         */
        public Builder filename(final java.lang.String filename) {
            this.config.filename(filename);
            return this;
        }

        /**
         * file_system_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#file_system_config LambdaFunction#file_system_config}
         * <p>
         * @return {@code this}
         * @param fileSystemConfig file_system_config block. This parameter is required.
         */
        public Builder fileSystemConfig(final imports.aws.lambda_function.LambdaFunctionFileSystemConfig fileSystemConfig) {
            this.config.fileSystemConfig(fileSystemConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#handler LambdaFunction#handler}.
         * <p>
         * @return {@code this}
         * @param handler Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#handler LambdaFunction#handler}. This parameter is required.
         */
        public Builder handler(final java.lang.String handler) {
            this.config.handler(handler);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#id LambdaFunction#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#id LambdaFunction#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * image_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_config LambdaFunction#image_config}
         * <p>
         * @return {@code this}
         * @param imageConfig image_config block. This parameter is required.
         */
        public Builder imageConfig(final imports.aws.lambda_function.LambdaFunctionImageConfig imageConfig) {
            this.config.imageConfig(imageConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_uri LambdaFunction#image_uri}.
         * <p>
         * @return {@code this}
         * @param imageUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#image_uri LambdaFunction#image_uri}. This parameter is required.
         */
        public Builder imageUri(final java.lang.String imageUri) {
            this.config.imageUri(imageUri);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#kms_key_arn LambdaFunction#kms_key_arn}.
         * <p>
         * @return {@code this}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#kms_key_arn LambdaFunction#kms_key_arn}. This parameter is required.
         */
        public Builder kmsKeyArn(final java.lang.String kmsKeyArn) {
            this.config.kmsKeyArn(kmsKeyArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#layers LambdaFunction#layers}.
         * <p>
         * @return {@code this}
         * @param layers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#layers LambdaFunction#layers}. This parameter is required.
         */
        public Builder layers(final java.util.List<java.lang.String> layers) {
            this.config.layers(layers);
            return this;
        }

        /**
         * logging_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#logging_config LambdaFunction#logging_config}
         * <p>
         * @return {@code this}
         * @param loggingConfig logging_config block. This parameter is required.
         */
        public Builder loggingConfig(final imports.aws.lambda_function.LambdaFunctionLoggingConfig loggingConfig) {
            this.config.loggingConfig(loggingConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#memory_size LambdaFunction#memory_size}.
         * <p>
         * @return {@code this}
         * @param memorySize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#memory_size LambdaFunction#memory_size}. This parameter is required.
         */
        public Builder memorySize(final java.lang.Number memorySize) {
            this.config.memorySize(memorySize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#package_type LambdaFunction#package_type}.
         * <p>
         * @return {@code this}
         * @param packageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#package_type LambdaFunction#package_type}. This parameter is required.
         */
        public Builder packageType(final java.lang.String packageType) {
            this.config.packageType(packageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}.
         * <p>
         * @return {@code this}
         * @param publish Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}. This parameter is required.
         */
        public Builder publish(final java.lang.Boolean publish) {
            this.config.publish(publish);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}.
         * <p>
         * @return {@code this}
         * @param publish Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#publish LambdaFunction#publish}. This parameter is required.
         */
        public Builder publish(final com.hashicorp.cdktf.IResolvable publish) {
            this.config.publish(publish);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replacement_security_group_ids LambdaFunction#replacement_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param replacementSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replacement_security_group_ids LambdaFunction#replacement_security_group_ids}. This parameter is required.
         */
        public Builder replacementSecurityGroupIds(final java.util.List<java.lang.String> replacementSecurityGroupIds) {
            this.config.replacementSecurityGroupIds(replacementSecurityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}.
         * <p>
         * @return {@code this}
         * @param replaceSecurityGroupsOnDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}. This parameter is required.
         */
        public Builder replaceSecurityGroupsOnDestroy(final java.lang.Boolean replaceSecurityGroupsOnDestroy) {
            this.config.replaceSecurityGroupsOnDestroy(replaceSecurityGroupsOnDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}.
         * <p>
         * @return {@code this}
         * @param replaceSecurityGroupsOnDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#replace_security_groups_on_destroy LambdaFunction#replace_security_groups_on_destroy}. This parameter is required.
         */
        public Builder replaceSecurityGroupsOnDestroy(final com.hashicorp.cdktf.IResolvable replaceSecurityGroupsOnDestroy) {
            this.config.replaceSecurityGroupsOnDestroy(replaceSecurityGroupsOnDestroy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#reserved_concurrent_executions LambdaFunction#reserved_concurrent_executions}.
         * <p>
         * @return {@code this}
         * @param reservedConcurrentExecutions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#reserved_concurrent_executions LambdaFunction#reserved_concurrent_executions}. This parameter is required.
         */
        public Builder reservedConcurrentExecutions(final java.lang.Number reservedConcurrentExecutions) {
            this.config.reservedConcurrentExecutions(reservedConcurrentExecutions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#runtime LambdaFunction#runtime}.
         * <p>
         * @return {@code this}
         * @param runtime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#runtime LambdaFunction#runtime}. This parameter is required.
         */
        public Builder runtime(final java.lang.String runtime) {
            this.config.runtime(runtime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_bucket LambdaFunction#s3_bucket}.
         * <p>
         * @return {@code this}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_bucket LambdaFunction#s3_bucket}. This parameter is required.
         */
        public Builder s3Bucket(final java.lang.String s3Bucket) {
            this.config.s3Bucket(s3Bucket);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_key LambdaFunction#s3_key}.
         * <p>
         * @return {@code this}
         * @param s3Key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_key LambdaFunction#s3_key}. This parameter is required.
         */
        public Builder s3Key(final java.lang.String s3Key) {
            this.config.s3Key(s3Key);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_object_version LambdaFunction#s3_object_version}.
         * <p>
         * @return {@code this}
         * @param s3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#s3_object_version LambdaFunction#s3_object_version}. This parameter is required.
         */
        public Builder s3ObjectVersion(final java.lang.String s3ObjectVersion) {
            this.config.s3ObjectVersion(s3ObjectVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}.
         * <p>
         * @return {@code this}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}. This parameter is required.
         */
        public Builder skipDestroy(final java.lang.Boolean skipDestroy) {
            this.config.skipDestroy(skipDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}.
         * <p>
         * @return {@code this}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#skip_destroy LambdaFunction#skip_destroy}. This parameter is required.
         */
        public Builder skipDestroy(final com.hashicorp.cdktf.IResolvable skipDestroy) {
            this.config.skipDestroy(skipDestroy);
            return this;
        }

        /**
         * snap_start block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#snap_start LambdaFunction#snap_start}
         * <p>
         * @return {@code this}
         * @param snapStart snap_start block. This parameter is required.
         */
        public Builder snapStart(final imports.aws.lambda_function.LambdaFunctionSnapStart snapStart) {
            this.config.snapStart(snapStart);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#source_code_hash LambdaFunction#source_code_hash}.
         * <p>
         * @return {@code this}
         * @param sourceCodeHash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#source_code_hash LambdaFunction#source_code_hash}. This parameter is required.
         */
        public Builder sourceCodeHash(final java.lang.String sourceCodeHash) {
            this.config.sourceCodeHash(sourceCodeHash);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags LambdaFunction#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags LambdaFunction#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags_all LambdaFunction#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tags_all LambdaFunction#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeout LambdaFunction#timeout}.
         * <p>
         * @return {@code this}
         * @param timeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeout LambdaFunction#timeout}. This parameter is required.
         */
        public Builder timeout(final java.lang.Number timeout) {
            this.config.timeout(timeout);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#timeouts LambdaFunction#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lambda_function.LambdaFunctionTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * tracing_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#tracing_config LambdaFunction#tracing_config}
         * <p>
         * @return {@code this}
         * @param tracingConfig tracing_config block. This parameter is required.
         */
        public Builder tracingConfig(final imports.aws.lambda_function.LambdaFunctionTracingConfig tracingConfig) {
            this.config.tracingConfig(tracingConfig);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function#vpc_config LambdaFunction#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final imports.aws.lambda_function.LambdaFunctionVpcConfig vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lambda_function.LambdaFunction}.
         */
        @Override
        public imports.aws.lambda_function.LambdaFunction build() {
            return new imports.aws.lambda_function.LambdaFunction(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
