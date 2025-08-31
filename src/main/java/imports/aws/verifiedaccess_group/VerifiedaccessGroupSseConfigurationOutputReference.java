package imports.aws.verifiedaccess_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.574Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessGroup.VerifiedaccessGroupSseConfigurationOutputReference")
public class VerifiedaccessGroupSseConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedaccessGroupSseConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedaccessGroupSseConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public VerifiedaccessGroupSseConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomerManagedKeyEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerManagedKeyEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomerManagedKeyEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedKeyEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCustomerManagedKeyEnabled() {
        return software.amazon.jsii.Kernel.get(this, "customerManagedKeyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCustomerManagedKeyEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "customerManagedKeyEnabled", java.util.Objects.requireNonNull(value, "customerManagedKeyEnabled is required"));
    }

    public void setCustomerManagedKeyEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "customerManagedKeyEnabled", java.util.Objects.requireNonNull(value, "customerManagedKeyEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_group.VerifiedaccessGroupSseConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedaccess_group.VerifiedaccessGroupSseConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedaccess_group.VerifiedaccessGroupSseConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
