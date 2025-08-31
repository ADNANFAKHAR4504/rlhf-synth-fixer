package imports.aws.route53_domains_registered_domain;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain aws_route53domains_registered_domain}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.204Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsRegisteredDomain.Route53DomainsRegisteredDomain")
public class Route53DomainsRegisteredDomain extends com.hashicorp.cdktf.TerraformResource {

    protected Route53DomainsRegisteredDomain(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53DomainsRegisteredDomain(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain aws_route53domains_registered_domain} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Route53DomainsRegisteredDomain(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Route53DomainsRegisteredDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53DomainsRegisteredDomain to import. This parameter is required.
     * @param importFromId The id of the existing Route53DomainsRegisteredDomain that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Route53DomainsRegisteredDomain to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Route53DomainsRegisteredDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53DomainsRegisteredDomain to import. This parameter is required.
     * @param importFromId The id of the existing Route53DomainsRegisteredDomain that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAdminContact(final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact value) {
        software.amazon.jsii.Kernel.call(this, "putAdminContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBillingContact(final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact value) {
        software.amazon.jsii.Kernel.call(this, "putBillingContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNameServer(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServer>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServer> __cast_cd4240 = (java.util.List<imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServer>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServer __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNameServer", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRegistrantContact(final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact value) {
        software.amazon.jsii.Kernel.call(this, "putRegistrantContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTechContact(final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact value) {
        software.amazon.jsii.Kernel.call(this, "putTechContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdminContact() {
        software.amazon.jsii.Kernel.call(this, "resetAdminContact", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAdminPrivacy() {
        software.amazon.jsii.Kernel.call(this, "resetAdminPrivacy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoRenew() {
        software.amazon.jsii.Kernel.call(this, "resetAutoRenew", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBillingContact() {
        software.amazon.jsii.Kernel.call(this, "resetBillingContact", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBillingPrivacy() {
        software.amazon.jsii.Kernel.call(this, "resetBillingPrivacy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNameServer() {
        software.amazon.jsii.Kernel.call(this, "resetNameServer", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegistrantContact() {
        software.amazon.jsii.Kernel.call(this, "resetRegistrantContact", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegistrantPrivacy() {
        software.amazon.jsii.Kernel.call(this, "resetRegistrantPrivacy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTechContact() {
        software.amazon.jsii.Kernel.call(this, "resetTechContact", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTechPrivacy() {
        software.amazon.jsii.Kernel.call(this, "resetTechPrivacy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransferLock() {
        software.amazon.jsii.Kernel.call(this, "resetTransferLock", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getAbuseContactEmail() {
        return software.amazon.jsii.Kernel.get(this, "abuseContactEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAbuseContactPhone() {
        return software.amazon.jsii.Kernel.get(this, "abuseContactPhone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContactOutputReference getAdminContact() {
        return software.amazon.jsii.Kernel.get(this, "adminContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContactOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContactOutputReference getBillingContact() {
        return software.amazon.jsii.Kernel.get(this, "billingContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContactOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreationDate() {
        return software.amazon.jsii.Kernel.get(this, "creationDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpirationDate() {
        return software.amazon.jsii.Kernel.get(this, "expirationDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServerList getNameServer() {
        return software.amazon.jsii.Kernel.get(this, "nameServer", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServerList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContactOutputReference getRegistrantContact() {
        return software.amazon.jsii.Kernel.get(this, "registrantContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContactOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistrarName() {
        return software.amazon.jsii.Kernel.get(this, "registrarName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistrarUrl() {
        return software.amazon.jsii.Kernel.get(this, "registrarUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReseller() {
        return software.amazon.jsii.Kernel.get(this, "reseller", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatusList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statusList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContactOutputReference getTechContact() {
        return software.amazon.jsii.Kernel.get(this, "techContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContactOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdatedDate() {
        return software.amazon.jsii.Kernel.get(this, "updatedDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWhoisServer() {
        return software.amazon.jsii.Kernel.get(this, "whoisServer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact getAdminContactInput() {
        return software.amazon.jsii.Kernel.get(this, "adminContactInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAdminPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "adminPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoRenewInput() {
        return software.amazon.jsii.Kernel.get(this, "autoRenewInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact getBillingContactInput() {
        return software.amazon.jsii.Kernel.get(this, "billingContactInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBillingPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "billingPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNameServerInput() {
        return software.amazon.jsii.Kernel.get(this, "nameServerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact getRegistrantContactInput() {
        return software.amazon.jsii.Kernel.get(this, "registrantContactInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegistrantPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "registrantPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact getTechContactInput() {
        return software.amazon.jsii.Kernel.get(this, "techContactInput", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTechPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "techPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransferLockInput() {
        return software.amazon.jsii.Kernel.get(this, "transferLockInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAdminPrivacy() {
        return software.amazon.jsii.Kernel.get(this, "adminPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAdminPrivacy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "adminPrivacy", java.util.Objects.requireNonNull(value, "adminPrivacy is required"));
    }

    public void setAdminPrivacy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "adminPrivacy", java.util.Objects.requireNonNull(value, "adminPrivacy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoRenew() {
        return software.amazon.jsii.Kernel.get(this, "autoRenew", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoRenew(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoRenew", java.util.Objects.requireNonNull(value, "autoRenew is required"));
    }

    public void setAutoRenew(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoRenew", java.util.Objects.requireNonNull(value, "autoRenew is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBillingPrivacy() {
        return software.amazon.jsii.Kernel.get(this, "billingPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBillingPrivacy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "billingPrivacy", java.util.Objects.requireNonNull(value, "billingPrivacy is required"));
    }

    public void setBillingPrivacy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "billingPrivacy", java.util.Objects.requireNonNull(value, "billingPrivacy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainName() {
        return software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDomainName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "domainName", java.util.Objects.requireNonNull(value, "domainName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRegistrantPrivacy() {
        return software.amazon.jsii.Kernel.get(this, "registrantPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRegistrantPrivacy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "registrantPrivacy", java.util.Objects.requireNonNull(value, "registrantPrivacy is required"));
    }

    public void setRegistrantPrivacy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "registrantPrivacy", java.util.Objects.requireNonNull(value, "registrantPrivacy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTechPrivacy() {
        return software.amazon.jsii.Kernel.get(this, "techPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTechPrivacy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "techPrivacy", java.util.Objects.requireNonNull(value, "techPrivacy is required"));
    }

    public void setTechPrivacy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "techPrivacy", java.util.Objects.requireNonNull(value, "techPrivacy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTransferLock() {
        return software.amazon.jsii.Kernel.get(this, "transferLock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTransferLock(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "transferLock", java.util.Objects.requireNonNull(value, "transferLock is required"));
    }

    public void setTransferLock(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "transferLock", java.util.Objects.requireNonNull(value, "transferLock is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#domain_name Route53DomainsRegisteredDomain#domain_name}.
         * <p>
         * @return {@code this}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#domain_name Route53DomainsRegisteredDomain#domain_name}. This parameter is required.
         */
        public Builder domainName(final java.lang.String domainName) {
            this.config.domainName(domainName);
            return this;
        }

        /**
         * admin_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_contact Route53DomainsRegisteredDomain#admin_contact}
         * <p>
         * @return {@code this}
         * @param adminContact admin_contact block. This parameter is required.
         */
        public Builder adminContact(final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact adminContact) {
            this.config.adminContact(adminContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}.
         * <p>
         * @return {@code this}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}. This parameter is required.
         */
        public Builder adminPrivacy(final java.lang.Boolean adminPrivacy) {
            this.config.adminPrivacy(adminPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}.
         * <p>
         * @return {@code this}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}. This parameter is required.
         */
        public Builder adminPrivacy(final com.hashicorp.cdktf.IResolvable adminPrivacy) {
            this.config.adminPrivacy(adminPrivacy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}.
         * <p>
         * @return {@code this}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}. This parameter is required.
         */
        public Builder autoRenew(final java.lang.Boolean autoRenew) {
            this.config.autoRenew(autoRenew);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}.
         * <p>
         * @return {@code this}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}. This parameter is required.
         */
        public Builder autoRenew(final com.hashicorp.cdktf.IResolvable autoRenew) {
            this.config.autoRenew(autoRenew);
            return this;
        }

        /**
         * billing_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_contact Route53DomainsRegisteredDomain#billing_contact}
         * <p>
         * @return {@code this}
         * @param billingContact billing_contact block. This parameter is required.
         */
        public Builder billingContact(final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact billingContact) {
            this.config.billingContact(billingContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}.
         * <p>
         * @return {@code this}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}. This parameter is required.
         */
        public Builder billingPrivacy(final java.lang.Boolean billingPrivacy) {
            this.config.billingPrivacy(billingPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}.
         * <p>
         * @return {@code this}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}. This parameter is required.
         */
        public Builder billingPrivacy(final com.hashicorp.cdktf.IResolvable billingPrivacy) {
            this.config.billingPrivacy(billingPrivacy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#id Route53DomainsRegisteredDomain#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#id Route53DomainsRegisteredDomain#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * name_server block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name_server Route53DomainsRegisteredDomain#name_server}
         * <p>
         * @return {@code this}
         * @param nameServer name_server block. This parameter is required.
         */
        public Builder nameServer(final com.hashicorp.cdktf.IResolvable nameServer) {
            this.config.nameServer(nameServer);
            return this;
        }
        /**
         * name_server block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name_server Route53DomainsRegisteredDomain#name_server}
         * <p>
         * @return {@code this}
         * @param nameServer name_server block. This parameter is required.
         */
        public Builder nameServer(final java.util.List<? extends imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServer> nameServer) {
            this.config.nameServer(nameServer);
            return this;
        }

        /**
         * registrant_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_contact Route53DomainsRegisteredDomain#registrant_contact}
         * <p>
         * @return {@code this}
         * @param registrantContact registrant_contact block. This parameter is required.
         */
        public Builder registrantContact(final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact registrantContact) {
            this.config.registrantContact(registrantContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}.
         * <p>
         * @return {@code this}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}. This parameter is required.
         */
        public Builder registrantPrivacy(final java.lang.Boolean registrantPrivacy) {
            this.config.registrantPrivacy(registrantPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}.
         * <p>
         * @return {@code this}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}. This parameter is required.
         */
        public Builder registrantPrivacy(final com.hashicorp.cdktf.IResolvable registrantPrivacy) {
            this.config.registrantPrivacy(registrantPrivacy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags Route53DomainsRegisteredDomain#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags Route53DomainsRegisteredDomain#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags_all Route53DomainsRegisteredDomain#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags_all Route53DomainsRegisteredDomain#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * tech_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_contact Route53DomainsRegisteredDomain#tech_contact}
         * <p>
         * @return {@code this}
         * @param techContact tech_contact block. This parameter is required.
         */
        public Builder techContact(final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact techContact) {
            this.config.techContact(techContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}.
         * <p>
         * @return {@code this}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}. This parameter is required.
         */
        public Builder techPrivacy(final java.lang.Boolean techPrivacy) {
            this.config.techPrivacy(techPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}.
         * <p>
         * @return {@code this}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}. This parameter is required.
         */
        public Builder techPrivacy(final com.hashicorp.cdktf.IResolvable techPrivacy) {
            this.config.techPrivacy(techPrivacy);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#timeouts Route53DomainsRegisteredDomain#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}.
         * <p>
         * @return {@code this}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}. This parameter is required.
         */
        public Builder transferLock(final java.lang.Boolean transferLock) {
            this.config.transferLock(transferLock);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}.
         * <p>
         * @return {@code this}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}. This parameter is required.
         */
        public Builder transferLock(final com.hashicorp.cdktf.IResolvable transferLock) {
            this.config.transferLock(transferLock);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain}.
         */
        @Override
        public imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain build() {
            return new imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomain(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
