package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference")
public class ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCodeConfigurationValues(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues value) {
        software.amazon.jsii.Kernel.call(this, "putCodeConfigurationValues", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCodeConfigurationValues() {
        software.amazon.jsii.Kernel.call(this, "resetCodeConfigurationValues", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValuesOutputReference getCodeConfigurationValues() {
        return software.amazon.jsii.Kernel.get(this, "codeConfigurationValues", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValuesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues getCodeConfigurationValuesInput() {
        return software.amazon.jsii.Kernel.get(this, "codeConfigurationValuesInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfigurationCodeConfigurationValues.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSource() {
        return software.amazon.jsii.Kernel.get(this, "configurationSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationSource", java.util.Objects.requireNonNull(value, "configurationSource is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceSourceConfigurationCodeRepositoryCodeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
