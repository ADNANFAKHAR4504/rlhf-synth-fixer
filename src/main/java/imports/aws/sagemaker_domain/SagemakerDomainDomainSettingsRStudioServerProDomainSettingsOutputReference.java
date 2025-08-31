package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference")
public class SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDomainSettingsRStudioServerProDomainSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDefaultResourceSpec(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultResourceSpec", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultResourceSpec() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultResourceSpec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRStudioConnectUrl() {
        software.amazon.jsii.Kernel.call(this, "resetRStudioConnectUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRStudioPackageManagerUrl() {
        software.amazon.jsii.Kernel.call(this, "resetRStudioPackageManagerUrl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpecOutputReference getDefaultResourceSpec() {
        return software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpecOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec getDefaultResourceSpecInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultResourceSpecInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettingsDefaultResourceSpec.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainExecutionRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "domainExecutionRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRStudioConnectUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "rStudioConnectUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRStudioPackageManagerUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "rStudioPackageManagerUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainExecutionRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "domainExecutionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainExecutionRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainExecutionRoleArn", java.util.Objects.requireNonNull(value, "domainExecutionRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRStudioConnectUrl() {
        return software.amazon.jsii.Kernel.get(this, "rStudioConnectUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRStudioConnectUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rStudioConnectUrl", java.util.Objects.requireNonNull(value, "rStudioConnectUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRStudioPackageManagerUrl() {
        return software.amazon.jsii.Kernel.get(this, "rStudioPackageManagerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRStudioPackageManagerUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rStudioPackageManagerUrl", java.util.Objects.requireNonNull(value, "rStudioPackageManagerUrl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsRStudioServerProDomainSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
