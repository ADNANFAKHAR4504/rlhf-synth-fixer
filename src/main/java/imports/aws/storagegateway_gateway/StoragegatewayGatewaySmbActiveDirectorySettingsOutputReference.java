package imports.aws.storagegateway_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.533Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayGateway.StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference")
public class StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDomainControllers() {
        software.amazon.jsii.Kernel.call(this, "resetDomainControllers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationalUnit() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationalUnit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActiveDirectoryStatus() {
        return software.amazon.jsii.Kernel.get(this, "activeDirectoryStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomainControllersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "domainControllersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationalUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "passwordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsernameInput() {
        return software.amazon.jsii.Kernel.get(this, "usernameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDomainControllers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "domainControllers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDomainControllers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "domainControllers", java.util.Objects.requireNonNull(value, "domainControllers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationalUnit() {
        return software.amazon.jsii.Kernel.get(this, "organizationalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganizationalUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organizationalUnit", java.util.Objects.requireNonNull(value, "organizationalUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassword() {
        return software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "password", java.util.Objects.requireNonNull(value, "password is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutInSeconds", java.util.Objects.requireNonNull(value, "timeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsername() {
        return software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsername(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "username", java.util.Objects.requireNonNull(value, "username is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
