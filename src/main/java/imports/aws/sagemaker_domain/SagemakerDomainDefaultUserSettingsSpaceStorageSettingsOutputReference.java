package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsOutputReference")
public class SagemakerDomainDefaultUserSettingsSpaceStorageSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultUserSettingsSpaceStorageSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultUserSettingsSpaceStorageSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultUserSettingsSpaceStorageSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDefaultEbsStorageSettings(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultEbsStorageSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultEbsStorageSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultEbsStorageSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference getDefaultEbsStorageSettings() {
        return software.amazon.jsii.Kernel.get(this, "defaultEbsStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings getDefaultEbsStorageSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultEbsStorageSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsSpaceStorageSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
