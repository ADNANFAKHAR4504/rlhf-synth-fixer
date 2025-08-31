package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference")
public class ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerServiceSourceConfigurationCodeRepositoryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCodeConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putCodeConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceCodeVersion(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion value) {
        software.amazon.jsii.Kernel.call(this, "putSourceCodeVersion", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCodeConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetCodeConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDirectory() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDirectory", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference getCodeConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "codeConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersionOutputReference getSourceCodeVersion() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeVersion", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration getCodeConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "codeConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion getSourceCodeVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceCodeVersionInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositorySourceCodeVersion.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceDirectoryInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDirectoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepositoryUrl() {
        return software.amazon.jsii.Kernel.get(this, "repositoryUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepositoryUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repositoryUrl", java.util.Objects.requireNonNull(value, "repositoryUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceDirectory() {
        return software.amazon.jsii.Kernel.get(this, "sourceDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceDirectory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceDirectory", java.util.Objects.requireNonNull(value, "sourceDirectory is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepository value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
