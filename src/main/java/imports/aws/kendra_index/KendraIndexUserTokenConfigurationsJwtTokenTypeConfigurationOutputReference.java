package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.435Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference")
public class KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraIndexUserTokenConfigurationsJwtTokenTypeConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetClaimRegex() {
        software.amazon.jsii.Kernel.call(this, "resetClaimRegex", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGroupAttributeField() {
        software.amazon.jsii.Kernel.call(this, "resetGroupAttributeField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIssuer() {
        software.amazon.jsii.Kernel.call(this, "resetIssuer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecretsManagerArn() {
        software.amazon.jsii.Kernel.call(this, "resetSecretsManagerArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUrl() {
        software.amazon.jsii.Kernel.call(this, "resetUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserNameAttributeField() {
        software.amazon.jsii.Kernel.call(this, "resetUserNameAttributeField", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClaimRegexInput() {
        return software.amazon.jsii.Kernel.get(this, "claimRegexInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGroupAttributeFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "groupAttributeFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIssuerInput() {
        return software.amazon.jsii.Kernel.get(this, "issuerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "keyLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecretsManagerArnInput() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "urlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserNameAttributeFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "userNameAttributeFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClaimRegex() {
        return software.amazon.jsii.Kernel.get(this, "claimRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClaimRegex(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "claimRegex", java.util.Objects.requireNonNull(value, "claimRegex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGroupAttributeField() {
        return software.amazon.jsii.Kernel.get(this, "groupAttributeField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGroupAttributeField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "groupAttributeField", java.util.Objects.requireNonNull(value, "groupAttributeField is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIssuer() {
        return software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIssuer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "issuer", java.util.Objects.requireNonNull(value, "issuer is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyLocation() {
        return software.amazon.jsii.Kernel.get(this, "keyLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyLocation", java.util.Objects.requireNonNull(value, "keyLocation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecretsManagerArn() {
        return software.amazon.jsii.Kernel.get(this, "secretsManagerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecretsManagerArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secretsManagerArn", java.util.Objects.requireNonNull(value, "secretsManagerArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "url", java.util.Objects.requireNonNull(value, "url is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserNameAttributeField() {
        return software.amazon.jsii.Kernel.get(this, "userNameAttributeField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserNameAttributeField(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userNameAttributeField", java.util.Objects.requireNonNull(value, "userNameAttributeField is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_index.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
