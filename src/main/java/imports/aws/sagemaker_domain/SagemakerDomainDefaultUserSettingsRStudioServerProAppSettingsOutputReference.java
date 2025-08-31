package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.314Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettingsOutputReference")
public class SagemakerDomainDefaultUserSettingsRStudioServerProAppSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultUserSettingsRStudioServerProAppSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultUserSettingsRStudioServerProAppSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultUserSettingsRStudioServerProAppSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccessStatus() {
        software.amazon.jsii.Kernel.call(this, "resetAccessStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserGroup() {
        software.amazon.jsii.Kernel.call(this, "resetUserGroup", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccessStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "accessStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "userGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccessStatus() {
        return software.amazon.jsii.Kernel.get(this, "accessStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccessStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accessStatus", java.util.Objects.requireNonNull(value, "accessStatus is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserGroup() {
        return software.amazon.jsii.Kernel.get(this, "userGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userGroup", java.util.Objects.requireNonNull(value, "userGroup is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsRStudioServerProAppSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
