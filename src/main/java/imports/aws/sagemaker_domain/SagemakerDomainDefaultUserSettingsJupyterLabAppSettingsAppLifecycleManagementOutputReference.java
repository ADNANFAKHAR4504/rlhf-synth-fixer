package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.312Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference")
public class SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIdleSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings value) {
        software.amazon.jsii.Kernel.call(this, "putIdleSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIdleSettings() {
        software.amazon.jsii.Kernel.call(this, "resetIdleSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference getIdleSettings() {
        return software.amazon.jsii.Kernel.get(this, "idleSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings getIdleSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "idleSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagement getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagement.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsJupyterLabAppSettingsAppLifecycleManagement value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
