package imports.aws.amplify_app;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app aws_amplify_app}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.931Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyApp.AmplifyApp")
public class AmplifyApp extends com.hashicorp.cdktf.TerraformResource {

    protected AmplifyApp(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AmplifyApp(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.amplify_app.AmplifyApp.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app aws_amplify_app} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AmplifyApp(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AmplifyApp resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AmplifyApp to import. This parameter is required.
     * @param importFromId The id of the existing AmplifyApp that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AmplifyApp to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.amplify_app.AmplifyApp.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AmplifyApp resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AmplifyApp to import. This parameter is required.
     * @param importFromId The id of the existing AmplifyApp that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.amplify_app.AmplifyApp.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoBranchCreationConfig(final @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAutoBranchCreationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCacheConfig(final @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppCacheConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCacheConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.amplify_app.AmplifyAppCustomRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.amplify_app.AmplifyAppCustomRule> __cast_cd4240 = (java.util.List<imports.aws.amplify_app.AmplifyAppCustomRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.amplify_app.AmplifyAppCustomRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessToken() {
        software.amazon.jsii.Kernel.call(this, "resetAccessToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoBranchCreationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAutoBranchCreationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoBranchCreationPatterns() {
        software.amazon.jsii.Kernel.call(this, "resetAutoBranchCreationPatterns", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBasicAuthCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetBasicAuthCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBuildSpec() {
        software.amazon.jsii.Kernel.call(this, "resetBuildSpec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCacheConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComputeRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetComputeRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomHeaders() {
        software.amazon.jsii.Kernel.call(this, "resetCustomHeaders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomRule() {
        software.amazon.jsii.Kernel.call(this, "resetCustomRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableAutoBranchCreation() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAutoBranchCreation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableBasicAuth() {
        software.amazon.jsii.Kernel.call(this, "resetEnableBasicAuth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableBranchAutoBuild() {
        software.amazon.jsii.Kernel.call(this, "resetEnableBranchAutoBuild", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableBranchAutoDeletion() {
        software.amazon.jsii.Kernel.call(this, "resetEnableBranchAutoDeletion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironmentVariables() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironmentVariables", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamServiceRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetIamServiceRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOauthToken() {
        software.amazon.jsii.Kernel.call(this, "resetOauthToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlatform() {
        software.amazon.jsii.Kernel.call(this, "resetPlatform", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepository() {
        software.amazon.jsii.Kernel.call(this, "resetRepository", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfigOutputReference getAutoBranchCreationConfig() {
        return software.amazon.jsii.Kernel.get(this, "autoBranchCreationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppCacheConfigOutputReference getCacheConfig() {
        return software.amazon.jsii.Kernel.get(this, "cacheConfig", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppCacheConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppCustomRuleList getCustomRule() {
        return software.amazon.jsii.Kernel.get(this, "customRule", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppCustomRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultDomain() {
        return software.amazon.jsii.Kernel.get(this, "defaultDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.amplify_app.AmplifyAppProductionBranchList getProductionBranch() {
        return software.amazon.jsii.Kernel.get(this, "productionBranch", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppProductionBranchList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "accessTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig getAutoBranchCreationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "autoBranchCreationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAutoBranchCreationPatternsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "autoBranchCreationPatternsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthCredentialsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuildSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "buildSpecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.amplify_app.AmplifyAppCacheConfig getCacheConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppCacheConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "computeRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomHeadersInput() {
        return software.amazon.jsii.Kernel.get(this, "customHeadersInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "customRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoBranchCreationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoBranchCreationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableBasicAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "enableBasicAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableBranchAutoBuildInput() {
        return software.amazon.jsii.Kernel.get(this, "enableBranchAutoBuildInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableBranchAutoDeletionInput() {
        return software.amazon.jsii.Kernel.get(this, "enableBranchAutoDeletionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariablesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "environmentVariablesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamServiceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamServiceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOauthTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "oauthTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformInput() {
        return software.amazon.jsii.Kernel.get(this, "platformInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessToken() {
        return software.amazon.jsii.Kernel.get(this, "accessToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessToken", java.util.Objects.requireNonNull(value, "accessToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAutoBranchCreationPatterns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "autoBranchCreationPatterns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAutoBranchCreationPatterns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "autoBranchCreationPatterns", java.util.Objects.requireNonNull(value, "autoBranchCreationPatterns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBasicAuthCredentials() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthCredentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBasicAuthCredentials(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "basicAuthCredentials", java.util.Objects.requireNonNull(value, "basicAuthCredentials is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBuildSpec() {
        return software.amazon.jsii.Kernel.get(this, "buildSpec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBuildSpec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "buildSpec", java.util.Objects.requireNonNull(value, "buildSpec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "computeRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeRoleArn", java.util.Objects.requireNonNull(value, "computeRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomHeaders() {
        return software.amazon.jsii.Kernel.get(this, "customHeaders", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomHeaders(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customHeaders", java.util.Objects.requireNonNull(value, "customHeaders is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableAutoBranchCreation() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoBranchCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableAutoBranchCreation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableAutoBranchCreation", java.util.Objects.requireNonNull(value, "enableAutoBranchCreation is required"));
    }

    public void setEnableAutoBranchCreation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableAutoBranchCreation", java.util.Objects.requireNonNull(value, "enableAutoBranchCreation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableBasicAuth() {
        return software.amazon.jsii.Kernel.get(this, "enableBasicAuth", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableBasicAuth(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableBasicAuth", java.util.Objects.requireNonNull(value, "enableBasicAuth is required"));
    }

    public void setEnableBasicAuth(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableBasicAuth", java.util.Objects.requireNonNull(value, "enableBasicAuth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableBranchAutoBuild() {
        return software.amazon.jsii.Kernel.get(this, "enableBranchAutoBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableBranchAutoBuild(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableBranchAutoBuild", java.util.Objects.requireNonNull(value, "enableBranchAutoBuild is required"));
    }

    public void setEnableBranchAutoBuild(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableBranchAutoBuild", java.util.Objects.requireNonNull(value, "enableBranchAutoBuild is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableBranchAutoDeletion() {
        return software.amazon.jsii.Kernel.get(this, "enableBranchAutoDeletion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableBranchAutoDeletion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableBranchAutoDeletion", java.util.Objects.requireNonNull(value, "enableBranchAutoDeletion is required"));
    }

    public void setEnableBranchAutoDeletion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableBranchAutoDeletion", java.util.Objects.requireNonNull(value, "enableBranchAutoDeletion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnvironmentVariables(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "environmentVariables", java.util.Objects.requireNonNull(value, "environmentVariables is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "iamServiceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamServiceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamServiceRoleArn", java.util.Objects.requireNonNull(value, "iamServiceRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOauthToken() {
        return software.amazon.jsii.Kernel.get(this, "oauthToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOauthToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "oauthToken", java.util.Objects.requireNonNull(value, "oauthToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatform() {
        return software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatform(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platform", java.util.Objects.requireNonNull(value, "platform is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepository() {
        return software.amazon.jsii.Kernel.get(this, "repository", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepository(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repository", java.util.Objects.requireNonNull(value, "repository is required"));
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

    /**
     * A fluent builder for {@link imports.aws.amplify_app.AmplifyApp}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.amplify_app.AmplifyApp> {
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
        private final imports.aws.amplify_app.AmplifyAppConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.amplify_app.AmplifyAppConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#name AmplifyApp#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#name AmplifyApp#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#access_token AmplifyApp#access_token}.
         * <p>
         * @return {@code this}
         * @param accessToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#access_token AmplifyApp#access_token}. This parameter is required.
         */
        public Builder accessToken(final java.lang.String accessToken) {
            this.config.accessToken(accessToken);
            return this;
        }

        /**
         * auto_branch_creation_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_config AmplifyApp#auto_branch_creation_config}
         * <p>
         * @return {@code this}
         * @param autoBranchCreationConfig auto_branch_creation_config block. This parameter is required.
         */
        public Builder autoBranchCreationConfig(final imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig autoBranchCreationConfig) {
            this.config.autoBranchCreationConfig(autoBranchCreationConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_patterns AmplifyApp#auto_branch_creation_patterns}.
         * <p>
         * @return {@code this}
         * @param autoBranchCreationPatterns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#auto_branch_creation_patterns AmplifyApp#auto_branch_creation_patterns}. This parameter is required.
         */
        public Builder autoBranchCreationPatterns(final java.util.List<java.lang.String> autoBranchCreationPatterns) {
            this.config.autoBranchCreationPatterns(autoBranchCreationPatterns);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#basic_auth_credentials AmplifyApp#basic_auth_credentials}.
         * <p>
         * @return {@code this}
         * @param basicAuthCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#basic_auth_credentials AmplifyApp#basic_auth_credentials}. This parameter is required.
         */
        public Builder basicAuthCredentials(final java.lang.String basicAuthCredentials) {
            this.config.basicAuthCredentials(basicAuthCredentials);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#build_spec AmplifyApp#build_spec}.
         * <p>
         * @return {@code this}
         * @param buildSpec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#build_spec AmplifyApp#build_spec}. This parameter is required.
         */
        public Builder buildSpec(final java.lang.String buildSpec) {
            this.config.buildSpec(buildSpec);
            return this;
        }

        /**
         * cache_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#cache_config AmplifyApp#cache_config}
         * <p>
         * @return {@code this}
         * @param cacheConfig cache_config block. This parameter is required.
         */
        public Builder cacheConfig(final imports.aws.amplify_app.AmplifyAppCacheConfig cacheConfig) {
            this.config.cacheConfig(cacheConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#compute_role_arn AmplifyApp#compute_role_arn}.
         * <p>
         * @return {@code this}
         * @param computeRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#compute_role_arn AmplifyApp#compute_role_arn}. This parameter is required.
         */
        public Builder computeRoleArn(final java.lang.String computeRoleArn) {
            this.config.computeRoleArn(computeRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_headers AmplifyApp#custom_headers}.
         * <p>
         * @return {@code this}
         * @param customHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_headers AmplifyApp#custom_headers}. This parameter is required.
         */
        public Builder customHeaders(final java.lang.String customHeaders) {
            this.config.customHeaders(customHeaders);
            return this;
        }

        /**
         * custom_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_rule AmplifyApp#custom_rule}
         * <p>
         * @return {@code this}
         * @param customRule custom_rule block. This parameter is required.
         */
        public Builder customRule(final com.hashicorp.cdktf.IResolvable customRule) {
            this.config.customRule(customRule);
            return this;
        }
        /**
         * custom_rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#custom_rule AmplifyApp#custom_rule}
         * <p>
         * @return {@code this}
         * @param customRule custom_rule block. This parameter is required.
         */
        public Builder customRule(final java.util.List<? extends imports.aws.amplify_app.AmplifyAppCustomRule> customRule) {
            this.config.customRule(customRule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#description AmplifyApp#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#description AmplifyApp#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}.
         * <p>
         * @return {@code this}
         * @param enableAutoBranchCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}. This parameter is required.
         */
        public Builder enableAutoBranchCreation(final java.lang.Boolean enableAutoBranchCreation) {
            this.config.enableAutoBranchCreation(enableAutoBranchCreation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}.
         * <p>
         * @return {@code this}
         * @param enableAutoBranchCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_auto_branch_creation AmplifyApp#enable_auto_branch_creation}. This parameter is required.
         */
        public Builder enableAutoBranchCreation(final com.hashicorp.cdktf.IResolvable enableAutoBranchCreation) {
            this.config.enableAutoBranchCreation(enableAutoBranchCreation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
         * <p>
         * @return {@code this}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}. This parameter is required.
         */
        public Builder enableBasicAuth(final java.lang.Boolean enableBasicAuth) {
            this.config.enableBasicAuth(enableBasicAuth);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}.
         * <p>
         * @return {@code this}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_basic_auth AmplifyApp#enable_basic_auth}. This parameter is required.
         */
        public Builder enableBasicAuth(final com.hashicorp.cdktf.IResolvable enableBasicAuth) {
            this.config.enableBasicAuth(enableBasicAuth);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}.
         * <p>
         * @return {@code this}
         * @param enableBranchAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}. This parameter is required.
         */
        public Builder enableBranchAutoBuild(final java.lang.Boolean enableBranchAutoBuild) {
            this.config.enableBranchAutoBuild(enableBranchAutoBuild);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}.
         * <p>
         * @return {@code this}
         * @param enableBranchAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_build AmplifyApp#enable_branch_auto_build}. This parameter is required.
         */
        public Builder enableBranchAutoBuild(final com.hashicorp.cdktf.IResolvable enableBranchAutoBuild) {
            this.config.enableBranchAutoBuild(enableBranchAutoBuild);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}.
         * <p>
         * @return {@code this}
         * @param enableBranchAutoDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}. This parameter is required.
         */
        public Builder enableBranchAutoDeletion(final java.lang.Boolean enableBranchAutoDeletion) {
            this.config.enableBranchAutoDeletion(enableBranchAutoDeletion);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}.
         * <p>
         * @return {@code this}
         * @param enableBranchAutoDeletion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#enable_branch_auto_deletion AmplifyApp#enable_branch_auto_deletion}. This parameter is required.
         */
        public Builder enableBranchAutoDeletion(final com.hashicorp.cdktf.IResolvable enableBranchAutoDeletion) {
            this.config.enableBranchAutoDeletion(enableBranchAutoDeletion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#environment_variables AmplifyApp#environment_variables}.
         * <p>
         * @return {@code this}
         * @param environmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#environment_variables AmplifyApp#environment_variables}. This parameter is required.
         */
        public Builder environmentVariables(final java.util.Map<java.lang.String, java.lang.String> environmentVariables) {
            this.config.environmentVariables(environmentVariables);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#iam_service_role_arn AmplifyApp#iam_service_role_arn}.
         * <p>
         * @return {@code this}
         * @param iamServiceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#iam_service_role_arn AmplifyApp#iam_service_role_arn}. This parameter is required.
         */
        public Builder iamServiceRoleArn(final java.lang.String iamServiceRoleArn) {
            this.config.iamServiceRoleArn(iamServiceRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#id AmplifyApp#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#id AmplifyApp#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#oauth_token AmplifyApp#oauth_token}.
         * <p>
         * @return {@code this}
         * @param oauthToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#oauth_token AmplifyApp#oauth_token}. This parameter is required.
         */
        public Builder oauthToken(final java.lang.String oauthToken) {
            this.config.oauthToken(oauthToken);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#platform AmplifyApp#platform}.
         * <p>
         * @return {@code this}
         * @param platform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#platform AmplifyApp#platform}. This parameter is required.
         */
        public Builder platform(final java.lang.String platform) {
            this.config.platform(platform);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#repository AmplifyApp#repository}.
         * <p>
         * @return {@code this}
         * @param repository Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#repository AmplifyApp#repository}. This parameter is required.
         */
        public Builder repository(final java.lang.String repository) {
            this.config.repository(repository);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags AmplifyApp#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags AmplifyApp#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags_all AmplifyApp#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_app#tags_all AmplifyApp#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.amplify_app.AmplifyApp}.
         */
        @Override
        public imports.aws.amplify_app.AmplifyApp build() {
            return new imports.aws.amplify_app.AmplifyApp(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
