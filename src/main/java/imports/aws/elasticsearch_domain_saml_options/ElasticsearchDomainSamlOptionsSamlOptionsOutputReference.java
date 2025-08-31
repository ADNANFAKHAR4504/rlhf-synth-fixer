package imports.aws.elasticsearch_domain_saml_options;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomainSamlOptions.ElasticsearchDomainSamlOptionsSamlOptionsOutputReference")
public class ElasticsearchDomainSamlOptionsSamlOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainSamlOptionsSamlOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainSamlOptionsSamlOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainSamlOptionsSamlOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIdp(final @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp value) {
        software.amazon.jsii.Kernel.call(this, "putIdp", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdp() {
        software.amazon.jsii.Kernel.call(this, "resetIdp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterBackendRole() {
        software.amazon.jsii.Kernel.call(this, "resetMasterBackendRole", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMasterUserName() {
        software.amazon.jsii.Kernel.call(this, "resetMasterUserName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRolesKey() {
        software.amazon.jsii.Kernel.call(this, "resetRolesKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionTimeoutMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetSessionTimeoutMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubjectKey() {
        software.amazon.jsii.Kernel.call(this, "resetSubjectKey", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdpOutputReference getIdp() {
        return software.amazon.jsii.Kernel.get(this, "idp", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdpOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp getIdpInput() {
        return software.amazon.jsii.Kernel.get(this, "idpInput", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterBackendRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "masterBackendRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMasterUserNameInput() {
        return software.amazon.jsii.Kernel.get(this, "masterUserNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRolesKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "rolesKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeoutMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeoutMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubjectKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "subjectKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterBackendRole() {
        return software.amazon.jsii.Kernel.get(this, "masterBackendRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterBackendRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterBackendRole", java.util.Objects.requireNonNull(value, "masterBackendRole is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMasterUserName() {
        return software.amazon.jsii.Kernel.get(this, "masterUserName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMasterUserName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "masterUserName", java.util.Objects.requireNonNull(value, "masterUserName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRolesKey() {
        return software.amazon.jsii.Kernel.get(this, "rolesKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRolesKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rolesKey", java.util.Objects.requireNonNull(value, "rolesKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSessionTimeoutMinutes() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSessionTimeoutMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sessionTimeoutMinutes", java.util.Objects.requireNonNull(value, "sessionTimeoutMinutes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubjectKey() {
        return software.amazon.jsii.Kernel.get(this, "subjectKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubjectKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subjectKey", java.util.Objects.requireNonNull(value, "subjectKey is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
