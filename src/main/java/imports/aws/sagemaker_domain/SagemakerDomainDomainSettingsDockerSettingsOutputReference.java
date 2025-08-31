package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDomainSettingsDockerSettingsOutputReference")
public class SagemakerDomainDomainSettingsDockerSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDomainSettingsDockerSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDomainSettingsDockerSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDomainSettingsDockerSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnableDockerAccess() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDockerAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcOnlyTrustedAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetVpcOnlyTrustedAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnableDockerAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDockerAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcOnlyTrustedAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcOnlyTrustedAccountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnableDockerAccess() {
        return software.amazon.jsii.Kernel.get(this, "enableDockerAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnableDockerAccess(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "enableDockerAccess", java.util.Objects.requireNonNull(value, "enableDockerAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcOnlyTrustedAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcOnlyTrustedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcOnlyTrustedAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcOnlyTrustedAccounts", java.util.Objects.requireNonNull(value, "vpcOnlyTrustedAccounts is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettingsDockerSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
