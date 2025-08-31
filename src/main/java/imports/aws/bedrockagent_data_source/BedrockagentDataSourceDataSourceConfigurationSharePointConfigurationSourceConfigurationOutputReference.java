package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.165Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfigurationOutputReference")
public class BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetTenantId() {
        software.amazon.jsii.Kernel.call(this, "resetTenantId", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "authTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialsSecretArnInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsSecretArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "domainInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "hostTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSiteUrlsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "siteUrlsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTenantIdInput() {
        return software.amazon.jsii.Kernel.get(this, "tenantIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthType() {
        return software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authType", java.util.Objects.requireNonNull(value, "authType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredentialsSecretArn() {
        return software.amazon.jsii.Kernel.get(this, "credentialsSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredentialsSecretArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credentialsSecretArn", java.util.Objects.requireNonNull(value, "credentialsSecretArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomain() {
        return software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomain(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domain", java.util.Objects.requireNonNull(value, "domain is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostType() {
        return software.amazon.jsii.Kernel.get(this, "hostType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostType", java.util.Objects.requireNonNull(value, "hostType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSiteUrls() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "siteUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSiteUrls(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "siteUrls", java.util.Objects.requireNonNull(value, "siteUrls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTenantId() {
        return software.amazon.jsii.Kernel.get(this, "tenantId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTenantId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tenantId", java.util.Objects.requireNonNull(value, "tenantId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
