package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference")
public class ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMasterUserArn() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUserArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUserName() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUserName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUserPassword() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUserPassword", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUserArnInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUserArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUserNameInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUserNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUserPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUserPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUserArn() {
        return software.amazon.jsii.Kernel.get(this, "masterUserArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUserArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUserArn", java.util.Objects.requireNonNull(value, "masterUserArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUserName() {
        return software.amazon.jsii.Kernel.get(this, "masterUserName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUserName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUserName", java.util.Objects.requireNonNull(value, "masterUserName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUserPassword() {
        return software.amazon.jsii.Kernel.get(this, "masterUserPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUserPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUserPassword", java.util.Objects.requireNonNull(value, "masterUserPassword is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
