package imports.aws.finspace_kx_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.224Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxEnvironment.FinspaceKxEnvironmentCustomDnsConfigurationOutputReference")
public class FinspaceKxEnvironmentCustomDnsConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxEnvironmentCustomDnsConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxEnvironmentCustomDnsConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public FinspaceKxEnvironmentCustomDnsConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomDnsServerIpInput() {
        return software.amazon.jsii.Kernel.get(this, "customDnsServerIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomDnsServerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "customDnsServerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomDnsServerIp() {
        return software.amazon.jsii.Kernel.get(this, "customDnsServerIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomDnsServerIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customDnsServerIp", java.util.Objects.requireNonNull(value, "customDnsServerIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomDnsServerName() {
        return software.amazon.jsii.Kernel.get(this, "customDnsServerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomDnsServerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customDnsServerName", java.util.Objects.requireNonNull(value, "customDnsServerName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_environment.FinspaceKxEnvironmentCustomDnsConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
