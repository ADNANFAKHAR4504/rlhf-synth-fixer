package imports.aws.amplify_branch;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch aws_amplify_branch}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.934Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyBranch.AmplifyBranch")
public class AmplifyBranch extends com.hashicorp.cdktf.TerraformResource {

    protected AmplifyBranch(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AmplifyBranch(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.amplify_branch.AmplifyBranch.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch aws_amplify_branch} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AmplifyBranch(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.amplify_branch.AmplifyBranchConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AmplifyBranch resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AmplifyBranch to import. This parameter is required.
     * @param importFromId The id of the existing AmplifyBranch that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AmplifyBranch to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.amplify_branch.AmplifyBranch.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AmplifyBranch resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AmplifyBranch to import. This parameter is required.
     * @param importFromId The id of the existing AmplifyBranch that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.amplify_branch.AmplifyBranch.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetBackendEnvironmentArn() {
        software.amazon.jsii.Kernel.call(this, "resetBackendEnvironmentArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBasicAuthCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetBasicAuthCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisplayName() {
        software.amazon.jsii.Kernel.call(this, "resetDisplayName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableAutoBuild() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAutoBuild", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableBasicAuth() {
        software.amazon.jsii.Kernel.call(this, "resetEnableBasicAuth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableNotification() {
        software.amazon.jsii.Kernel.call(this, "resetEnableNotification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePerformanceMode() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePerformanceMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePullRequestPreview() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePullRequestPreview", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironmentVariables() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironmentVariables", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFramework() {
        software.amazon.jsii.Kernel.call(this, "resetFramework", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPullRequestEnvironmentName() {
        software.amazon.jsii.Kernel.call(this, "resetPullRequestEnvironmentName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStage() {
        software.amazon.jsii.Kernel.call(this, "resetStage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTtl() {
        software.amazon.jsii.Kernel.call(this, "resetTtl", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAssociatedResources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "associatedResources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCustomDomains() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "customDomains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationBranch() {
        return software.amazon.jsii.Kernel.get(this, "destinationBranch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceBranch() {
        return software.amazon.jsii.Kernel.get(this, "sourceBranch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppIdInput() {
        return software.amazon.jsii.Kernel.get(this, "appIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBackendEnvironmentArnInput() {
        return software.amazon.jsii.Kernel.get(this, "backendEnvironmentArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthCredentialsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBranchNameInput() {
        return software.amazon.jsii.Kernel.get(this, "branchNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "displayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoBuildInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoBuildInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableBasicAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "enableBasicAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableNotificationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableNotificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePerformanceModeInput() {
        return software.amazon.jsii.Kernel.get(this, "enablePerformanceModeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePullRequestPreviewInput() {
        return software.amazon.jsii.Kernel.get(this, "enablePullRequestPreviewInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariablesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "environmentVariablesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFrameworkInput() {
        return software.amazon.jsii.Kernel.get(this, "frameworkInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPullRequestEnvironmentNameInput() {
        return software.amazon.jsii.Kernel.get(this, "pullRequestEnvironmentNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStageInput() {
        return software.amazon.jsii.Kernel.get(this, "stageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "ttlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppId() {
        return software.amazon.jsii.Kernel.get(this, "appId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appId", java.util.Objects.requireNonNull(value, "appId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBackendEnvironmentArn() {
        return software.amazon.jsii.Kernel.get(this, "backendEnvironmentArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBackendEnvironmentArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "backendEnvironmentArn", java.util.Objects.requireNonNull(value, "backendEnvironmentArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBasicAuthCredentials() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthCredentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBasicAuthCredentials(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "basicAuthCredentials", java.util.Objects.requireNonNull(value, "basicAuthCredentials is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBranchName() {
        return software.amazon.jsii.Kernel.get(this, "branchName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBranchName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "branchName", java.util.Objects.requireNonNull(value, "branchName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayName", java.util.Objects.requireNonNull(value, "displayName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableAutoBuild() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableAutoBuild(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableAutoBuild", java.util.Objects.requireNonNull(value, "enableAutoBuild is required"));
    }

    public void setEnableAutoBuild(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableAutoBuild", java.util.Objects.requireNonNull(value, "enableAutoBuild is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableNotification() {
        return software.amazon.jsii.Kernel.get(this, "enableNotification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableNotification(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableNotification", java.util.Objects.requireNonNull(value, "enableNotification is required"));
    }

    public void setEnableNotification(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableNotification", java.util.Objects.requireNonNull(value, "enableNotification is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePerformanceMode() {
        return software.amazon.jsii.Kernel.get(this, "enablePerformanceMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePerformanceMode(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePerformanceMode", java.util.Objects.requireNonNull(value, "enablePerformanceMode is required"));
    }

    public void setEnablePerformanceMode(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePerformanceMode", java.util.Objects.requireNonNull(value, "enablePerformanceMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePullRequestPreview() {
        return software.amazon.jsii.Kernel.get(this, "enablePullRequestPreview", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePullRequestPreview(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePullRequestPreview", java.util.Objects.requireNonNull(value, "enablePullRequestPreview is required"));
    }

    public void setEnablePullRequestPreview(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePullRequestPreview", java.util.Objects.requireNonNull(value, "enablePullRequestPreview is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getEnvironmentVariables() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "environmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEnvironmentVariables(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "environmentVariables", java.util.Objects.requireNonNull(value, "environmentVariables is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFramework() {
        return software.amazon.jsii.Kernel.get(this, "framework", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFramework(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "framework", java.util.Objects.requireNonNull(value, "framework is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPullRequestEnvironmentName() {
        return software.amazon.jsii.Kernel.get(this, "pullRequestEnvironmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPullRequestEnvironmentName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pullRequestEnvironmentName", java.util.Objects.requireNonNull(value, "pullRequestEnvironmentName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStage() {
        return software.amazon.jsii.Kernel.get(this, "stage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stage", java.util.Objects.requireNonNull(value, "stage is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTtl() {
        return software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTtl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ttl", java.util.Objects.requireNonNull(value, "ttl is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.amplify_branch.AmplifyBranch}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.amplify_branch.AmplifyBranch> {
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
        private final imports.aws.amplify_branch.AmplifyBranchConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.amplify_branch.AmplifyBranchConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#app_id AmplifyBranch#app_id}.
         * <p>
         * @return {@code this}
         * @param appId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#app_id AmplifyBranch#app_id}. This parameter is required.
         */
        public Builder appId(final java.lang.String appId) {
            this.config.appId(appId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#branch_name AmplifyBranch#branch_name}.
         * <p>
         * @return {@code this}
         * @param branchName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#branch_name AmplifyBranch#branch_name}. This parameter is required.
         */
        public Builder branchName(final java.lang.String branchName) {
            this.config.branchName(branchName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#backend_environment_arn AmplifyBranch#backend_environment_arn}.
         * <p>
         * @return {@code this}
         * @param backendEnvironmentArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#backend_environment_arn AmplifyBranch#backend_environment_arn}. This parameter is required.
         */
        public Builder backendEnvironmentArn(final java.lang.String backendEnvironmentArn) {
            this.config.backendEnvironmentArn(backendEnvironmentArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#basic_auth_credentials AmplifyBranch#basic_auth_credentials}.
         * <p>
         * @return {@code this}
         * @param basicAuthCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#basic_auth_credentials AmplifyBranch#basic_auth_credentials}. This parameter is required.
         */
        public Builder basicAuthCredentials(final java.lang.String basicAuthCredentials) {
            this.config.basicAuthCredentials(basicAuthCredentials);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#description AmplifyBranch#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#description AmplifyBranch#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#display_name AmplifyBranch#display_name}.
         * <p>
         * @return {@code this}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#display_name AmplifyBranch#display_name}. This parameter is required.
         */
        public Builder displayName(final java.lang.String displayName) {
            this.config.displayName(displayName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}.
         * <p>
         * @return {@code this}
         * @param enableAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}. This parameter is required.
         */
        public Builder enableAutoBuild(final java.lang.Boolean enableAutoBuild) {
            this.config.enableAutoBuild(enableAutoBuild);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}.
         * <p>
         * @return {@code this}
         * @param enableAutoBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_auto_build AmplifyBranch#enable_auto_build}. This parameter is required.
         */
        public Builder enableAutoBuild(final com.hashicorp.cdktf.IResolvable enableAutoBuild) {
            this.config.enableAutoBuild(enableAutoBuild);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}.
         * <p>
         * @return {@code this}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}. This parameter is required.
         */
        public Builder enableBasicAuth(final java.lang.Boolean enableBasicAuth) {
            this.config.enableBasicAuth(enableBasicAuth);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}.
         * <p>
         * @return {@code this}
         * @param enableBasicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_basic_auth AmplifyBranch#enable_basic_auth}. This parameter is required.
         */
        public Builder enableBasicAuth(final com.hashicorp.cdktf.IResolvable enableBasicAuth) {
            this.config.enableBasicAuth(enableBasicAuth);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}.
         * <p>
         * @return {@code this}
         * @param enableNotification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}. This parameter is required.
         */
        public Builder enableNotification(final java.lang.Boolean enableNotification) {
            this.config.enableNotification(enableNotification);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}.
         * <p>
         * @return {@code this}
         * @param enableNotification Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_notification AmplifyBranch#enable_notification}. This parameter is required.
         */
        public Builder enableNotification(final com.hashicorp.cdktf.IResolvable enableNotification) {
            this.config.enableNotification(enableNotification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}.
         * <p>
         * @return {@code this}
         * @param enablePerformanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}. This parameter is required.
         */
        public Builder enablePerformanceMode(final java.lang.Boolean enablePerformanceMode) {
            this.config.enablePerformanceMode(enablePerformanceMode);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}.
         * <p>
         * @return {@code this}
         * @param enablePerformanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_performance_mode AmplifyBranch#enable_performance_mode}. This parameter is required.
         */
        public Builder enablePerformanceMode(final com.hashicorp.cdktf.IResolvable enablePerformanceMode) {
            this.config.enablePerformanceMode(enablePerformanceMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}.
         * <p>
         * @return {@code this}
         * @param enablePullRequestPreview Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}. This parameter is required.
         */
        public Builder enablePullRequestPreview(final java.lang.Boolean enablePullRequestPreview) {
            this.config.enablePullRequestPreview(enablePullRequestPreview);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}.
         * <p>
         * @return {@code this}
         * @param enablePullRequestPreview Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#enable_pull_request_preview AmplifyBranch#enable_pull_request_preview}. This parameter is required.
         */
        public Builder enablePullRequestPreview(final com.hashicorp.cdktf.IResolvable enablePullRequestPreview) {
            this.config.enablePullRequestPreview(enablePullRequestPreview);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#environment_variables AmplifyBranch#environment_variables}.
         * <p>
         * @return {@code this}
         * @param environmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#environment_variables AmplifyBranch#environment_variables}. This parameter is required.
         */
        public Builder environmentVariables(final java.util.Map<java.lang.String, java.lang.String> environmentVariables) {
            this.config.environmentVariables(environmentVariables);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#framework AmplifyBranch#framework}.
         * <p>
         * @return {@code this}
         * @param framework Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#framework AmplifyBranch#framework}. This parameter is required.
         */
        public Builder framework(final java.lang.String framework) {
            this.config.framework(framework);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#id AmplifyBranch#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#id AmplifyBranch#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#pull_request_environment_name AmplifyBranch#pull_request_environment_name}.
         * <p>
         * @return {@code this}
         * @param pullRequestEnvironmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#pull_request_environment_name AmplifyBranch#pull_request_environment_name}. This parameter is required.
         */
        public Builder pullRequestEnvironmentName(final java.lang.String pullRequestEnvironmentName) {
            this.config.pullRequestEnvironmentName(pullRequestEnvironmentName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#stage AmplifyBranch#stage}.
         * <p>
         * @return {@code this}
         * @param stage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#stage AmplifyBranch#stage}. This parameter is required.
         */
        public Builder stage(final java.lang.String stage) {
            this.config.stage(stage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags AmplifyBranch#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags AmplifyBranch#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags_all AmplifyBranch#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#tags_all AmplifyBranch#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#ttl AmplifyBranch#ttl}.
         * <p>
         * @return {@code this}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/amplify_branch#ttl AmplifyBranch#ttl}. This parameter is required.
         */
        public Builder ttl(final java.lang.String ttl) {
            this.config.ttl(ttl);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.amplify_branch.AmplifyBranch}.
         */
        @Override
        public imports.aws.amplify_branch.AmplifyBranch build() {
            return new imports.aws.amplify_branch.AmplifyBranch(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
