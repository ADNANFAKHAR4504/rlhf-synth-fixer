package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationOutputReference")
public class ApprunnerServiceSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerServiceSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerServiceSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerServiceSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuthenticationConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAuthenticationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCodeRepository(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository value) {
        software.amazon.jsii.Kernel.call(this, "putCodeRepository", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImageRepository(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository value) {
        software.amazon.jsii.Kernel.call(this, "putImageRepository", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuthenticationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoDeploymentsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetAutoDeploymentsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodeRepository() {
        software.amazon.jsii.Kernel.call(this, "resetCodeRepository", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageRepository() {
        software.amazon.jsii.Kernel.call(this, "resetImageRepository", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference getAuthenticationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "authenticationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference getCodeRepository() {
        return software.amazon.jsii.Kernel.get(this, "codeRepository", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryOutputReference getImageRepository() {
        return software.amazon.jsii.Kernel.get(this, "imageRepository", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepositoryOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration getAuthenticationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationAuthenticationConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoDeploymentsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "autoDeploymentsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository getCodeRepositoryInput() {
        return software.amazon.jsii.Kernel.get(this, "codeRepositoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository getImageRepositoryInput() {
        return software.amazon.jsii.Kernel.get(this, "imageRepositoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationImageRepository.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoDeploymentsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "autoDeploymentsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoDeploymentsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoDeploymentsEnabled", java.util.Objects.requireNonNull(value, "autoDeploymentsEnabled is required"));
    }

    public void setAutoDeploymentsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoDeploymentsEnabled", java.util.Objects.requireNonNull(value, "autoDeploymentsEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
