package imports.aws.cloudformation_stack_instances;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.219Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackInstances.CloudformationStackInstancesDeploymentTargetsOutputReference")
public class CloudformationStackInstancesDeploymentTargetsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudformationStackInstancesDeploymentTargetsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudformationStackInstancesDeploymentTargetsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudformationStackInstancesDeploymentTargetsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccountFilterType() {
        software.amazon.jsii.Kernel.call(this, "resetAccountFilterType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAccountsUrl() {
        software.amazon.jsii.Kernel.call(this, "resetAccountsUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationalUnitIds() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationalUnitIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountFilterTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "accountFilterTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "accountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountsUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "accountsUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrganizationalUnitIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "organizationalUnitIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountFilterType() {
        return software.amazon.jsii.Kernel.get(this, "accountFilterType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountFilterType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountFilterType", java.util.Objects.requireNonNull(value, "accountFilterType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "accounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "accounts", java.util.Objects.requireNonNull(value, "accounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountsUrl() {
        return software.amazon.jsii.Kernel.get(this, "accountsUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountsUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountsUrl", java.util.Objects.requireNonNull(value, "accountsUrl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOrganizationalUnitIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "organizationalUnitIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOrganizationalUnitIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "organizationalUnitIds", java.util.Objects.requireNonNull(value, "organizationalUnitIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_instances.CloudformationStackInstancesDeploymentTargets value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
