package imports.aws.route53_domains_domain;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain aws_route53domains_domain}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.196Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsDomain.Route53DomainsDomain")
public class Route53DomainsDomain extends com.hashicorp.cdktf.TerraformResource {

    protected Route53DomainsDomain(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Route53DomainsDomain(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.route53_domains_domain.Route53DomainsDomain.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain aws_route53domains_domain} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Route53DomainsDomain(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Route53DomainsDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53DomainsDomain to import. This parameter is required.
     * @param importFromId The id of the existing Route53DomainsDomain that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Route53DomainsDomain to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_domains_domain.Route53DomainsDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Route53DomainsDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Route53DomainsDomain to import. This parameter is required.
     * @param importFromId The id of the existing Route53DomainsDomain that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.route53_domains_domain.Route53DomainsDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAdminContact(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainAdminContact>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainAdminContact> __cast_cd4240 = (java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainAdminContact>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_domains_domain.Route53DomainsDomainAdminContact __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAdminContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBillingContact(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainBillingContact>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainBillingContact> __cast_cd4240 = (java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainBillingContact>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_domains_domain.Route53DomainsDomainBillingContact __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainNameServer>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainNameServer> __cast_cd4240 = (java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainNameServer>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_domains_domain.Route53DomainsDomainNameServer __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNameServer", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRegistrantContact(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContact>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContact> __cast_cd4240 = (java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContact>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContact __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRegistrantContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTechContact(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainTechContact>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainTechContact> __cast_cd4240 = (java.util.List<imports.aws.route53_domains_domain.Route53DomainsDomainTechContact>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.route53_domains_domain.Route53DomainsDomainTechContact __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTechContact", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts value) {
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

    public void resetDurationInYears() {
        software.amazon.jsii.Kernel.call(this, "resetDurationInYears", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainAdminContactList getAdminContact() {
        return software.amazon.jsii.Kernel.get(this, "adminContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainAdminContactList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainBillingContactList getBillingContact() {
        return software.amazon.jsii.Kernel.get(this, "billingContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainBillingContactList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreationDate() {
        return software.amazon.jsii.Kernel.get(this, "creationDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExpirationDate() {
        return software.amazon.jsii.Kernel.get(this, "expirationDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostedZoneId() {
        return software.amazon.jsii.Kernel.get(this, "hostedZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainNameServerList getNameServer() {
        return software.amazon.jsii.Kernel.get(this, "nameServer", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainNameServerList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContactList getRegistrantContact() {
        return software.amazon.jsii.Kernel.get(this, "registrantContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContactList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistrarName() {
        return software.amazon.jsii.Kernel.get(this, "registrarName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistrarUrl() {
        return software.amazon.jsii.Kernel.get(this, "registrarUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatusList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statusList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainTechContactList getTechContact() {
        return software.amazon.jsii.Kernel.get(this, "techContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainTechContactList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.route53_domains_domain.Route53DomainsDomainTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdatedDate() {
        return software.amazon.jsii.Kernel.get(this, "updatedDate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWhoisServer() {
        return software.amazon.jsii.Kernel.get(this, "whoisServer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAdminContactInput() {
        return software.amazon.jsii.Kernel.get(this, "adminContactInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAdminPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "adminPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoRenewInput() {
        return software.amazon.jsii.Kernel.get(this, "autoRenewInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBillingContactInput() {
        return software.amazon.jsii.Kernel.get(this, "billingContactInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBillingPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "billingPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDomainNameInput() {
        return software.amazon.jsii.Kernel.get(this, "domainNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDurationInYearsInput() {
        return software.amazon.jsii.Kernel.get(this, "durationInYearsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNameServerInput() {
        return software.amazon.jsii.Kernel.get(this, "nameServerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegistrantContactInput() {
        return software.amazon.jsii.Kernel.get(this, "registrantContactInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegistrantPrivacyInput() {
        return software.amazon.jsii.Kernel.get(this, "registrantPrivacyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTechContactInput() {
        return software.amazon.jsii.Kernel.get(this, "techContactInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getDurationInYears() {
        return software.amazon.jsii.Kernel.get(this, "durationInYears", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDurationInYears(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "durationInYears", java.util.Objects.requireNonNull(value, "durationInYears is required"));
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
     * A fluent builder for {@link imports.aws.route53_domains_domain.Route53DomainsDomain}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.route53_domains_domain.Route53DomainsDomain> {
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
        private final imports.aws.route53_domains_domain.Route53DomainsDomainConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.route53_domains_domain.Route53DomainsDomainConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}.
         * <p>
         * @return {@code this}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}. This parameter is required.
         */
        public Builder domainName(final java.lang.String domainName) {
            this.config.domainName(domainName);
            return this;
        }

        /**
         * admin_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
         * <p>
         * @return {@code this}
         * @param adminContact admin_contact block. This parameter is required.
         */
        public Builder adminContact(final com.hashicorp.cdktf.IResolvable adminContact) {
            this.config.adminContact(adminContact);
            return this;
        }
        /**
         * admin_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
         * <p>
         * @return {@code this}
         * @param adminContact admin_contact block. This parameter is required.
         */
        public Builder adminContact(final java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainAdminContact> adminContact) {
            this.config.adminContact(adminContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
         * <p>
         * @return {@code this}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}. This parameter is required.
         */
        public Builder adminPrivacy(final java.lang.Boolean adminPrivacy) {
            this.config.adminPrivacy(adminPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
         * <p>
         * @return {@code this}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}. This parameter is required.
         */
        public Builder adminPrivacy(final com.hashicorp.cdktf.IResolvable adminPrivacy) {
            this.config.adminPrivacy(adminPrivacy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
         * <p>
         * @return {@code this}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}. This parameter is required.
         */
        public Builder autoRenew(final java.lang.Boolean autoRenew) {
            this.config.autoRenew(autoRenew);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
         * <p>
         * @return {@code this}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}. This parameter is required.
         */
        public Builder autoRenew(final com.hashicorp.cdktf.IResolvable autoRenew) {
            this.config.autoRenew(autoRenew);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
         * <p>
         * @return {@code this}
         * @param billingContact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}. This parameter is required.
         */
        public Builder billingContact(final com.hashicorp.cdktf.IResolvable billingContact) {
            this.config.billingContact(billingContact);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
         * <p>
         * @return {@code this}
         * @param billingContact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}. This parameter is required.
         */
        public Builder billingContact(final java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainBillingContact> billingContact) {
            this.config.billingContact(billingContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
         * <p>
         * @return {@code this}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}. This parameter is required.
         */
        public Builder billingPrivacy(final java.lang.Boolean billingPrivacy) {
            this.config.billingPrivacy(billingPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
         * <p>
         * @return {@code this}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}. This parameter is required.
         */
        public Builder billingPrivacy(final com.hashicorp.cdktf.IResolvable billingPrivacy) {
            this.config.billingPrivacy(billingPrivacy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}.
         * <p>
         * @return {@code this}
         * @param durationInYears Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}. This parameter is required.
         */
        public Builder durationInYears(final java.lang.Number durationInYears) {
            this.config.durationInYears(durationInYears);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
         * <p>
         * @return {@code this}
         * @param nameServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}. This parameter is required.
         */
        public Builder nameServer(final com.hashicorp.cdktf.IResolvable nameServer) {
            this.config.nameServer(nameServer);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
         * <p>
         * @return {@code this}
         * @param nameServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}. This parameter is required.
         */
        public Builder nameServer(final java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainNameServer> nameServer) {
            this.config.nameServer(nameServer);
            return this;
        }

        /**
         * registrant_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
         * <p>
         * @return {@code this}
         * @param registrantContact registrant_contact block. This parameter is required.
         */
        public Builder registrantContact(final com.hashicorp.cdktf.IResolvable registrantContact) {
            this.config.registrantContact(registrantContact);
            return this;
        }
        /**
         * registrant_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
         * <p>
         * @return {@code this}
         * @param registrantContact registrant_contact block. This parameter is required.
         */
        public Builder registrantContact(final java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContact> registrantContact) {
            this.config.registrantContact(registrantContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
         * <p>
         * @return {@code this}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}. This parameter is required.
         */
        public Builder registrantPrivacy(final java.lang.Boolean registrantPrivacy) {
            this.config.registrantPrivacy(registrantPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
         * <p>
         * @return {@code this}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}. This parameter is required.
         */
        public Builder registrantPrivacy(final com.hashicorp.cdktf.IResolvable registrantPrivacy) {
            this.config.registrantPrivacy(registrantPrivacy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * tech_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
         * <p>
         * @return {@code this}
         * @param techContact tech_contact block. This parameter is required.
         */
        public Builder techContact(final com.hashicorp.cdktf.IResolvable techContact) {
            this.config.techContact(techContact);
            return this;
        }
        /**
         * tech_contact block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
         * <p>
         * @return {@code this}
         * @param techContact tech_contact block. This parameter is required.
         */
        public Builder techContact(final java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainTechContact> techContact) {
            this.config.techContact(techContact);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
         * <p>
         * @return {@code this}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}. This parameter is required.
         */
        public Builder techPrivacy(final java.lang.Boolean techPrivacy) {
            this.config.techPrivacy(techPrivacy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
         * <p>
         * @return {@code this}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}. This parameter is required.
         */
        public Builder techPrivacy(final com.hashicorp.cdktf.IResolvable techPrivacy) {
            this.config.techPrivacy(techPrivacy);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#timeouts Route53DomainsDomain#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
         * <p>
         * @return {@code this}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}. This parameter is required.
         */
        public Builder transferLock(final java.lang.Boolean transferLock) {
            this.config.transferLock(transferLock);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
         * <p>
         * @return {@code this}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}. This parameter is required.
         */
        public Builder transferLock(final com.hashicorp.cdktf.IResolvable transferLock) {
            this.config.transferLock(transferLock);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.route53_domains_domain.Route53DomainsDomain}.
         */
        @Override
        public imports.aws.route53_domains_domain.Route53DomainsDomain build() {
            return new imports.aws.route53_domains_domain.Route53DomainsDomain(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
