package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAdvancedSecurityOptionsOutputReference")
public class ElasticsearchDomainAdvancedSecurityOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainAdvancedSecurityOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainAdvancedSecurityOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainAdvancedSecurityOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMasterUserOptions(final @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMasterUserOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInternalUserDatabaseEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetInternalUserDatabaseEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUserOptions() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUserOptions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference getMasterUserOptions() {
        return software.amazon.jsii.Kernel.get(this, "masterUserOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalUserDatabaseEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "internalUserDatabaseEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions getMasterUserOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUserOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInternalUserDatabaseEnabled() {
        return software.amazon.jsii.Kernel.get(this, "internalUserDatabaseEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalUserDatabaseEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "internalUserDatabaseEnabled", java.util.Objects.requireNonNull(value, "internalUserDatabaseEnabled is required"));
    }

    public void setInternalUserDatabaseEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalUserDatabaseEnabled", java.util.Objects.requireNonNull(value, "internalUserDatabaseEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
