package imports.aws.amplify_app;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.932Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.amplifyApp.AmplifyAppAutoBranchCreationConfigOutputReference")
public class AmplifyAppAutoBranchCreationConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AmplifyAppAutoBranchCreationConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AmplifyAppAutoBranchCreationConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AmplifyAppAutoBranchCreationConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBasicAuthCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetBasicAuthCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBuildSpec() {
        software.amazon.jsii.Kernel.call(this, "resetBuildSpec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableAutoBuild() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAutoBuild", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableBasicAuth() {
        software.amazon.jsii.Kernel.call(this, "resetEnableBasicAuth", software.amazon.jsii.NativeType.VOID);
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

    public void resetPullRequestEnvironmentName() {
        software.amazon.jsii.Kernel.call(this, "resetPullRequestEnvironmentName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStage() {
        software.amazon.jsii.Kernel.call(this, "resetStage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBasicAuthCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "basicAuthCredentialsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBuildSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "buildSpecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAutoBuildInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAutoBuildInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableBasicAuthInput() {
        return software.amazon.jsii.Kernel.get(this, "enableBasicAuthInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getPullRequestEnvironmentNameInput() {
        return software.amazon.jsii.Kernel.get(this, "pullRequestEnvironmentNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStageInput() {
        return software.amazon.jsii.Kernel.get(this, "stageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.amplify_app.AmplifyAppAutoBranchCreationConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
