package imports.aws.wafv2_web_acl;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl aws_wafv2_web_acl}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.669Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAcl")
public class Wafv2WebAcl extends com.hashicorp.cdktf.TerraformResource {

    protected Wafv2WebAcl(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAcl(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.wafv2_web_acl.Wafv2WebAcl.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl aws_wafv2_web_acl} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Wafv2WebAcl(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Wafv2WebAcl resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Wafv2WebAcl to import. This parameter is required.
     * @param importFromId The id of the existing Wafv2WebAcl that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Wafv2WebAcl to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.wafv2_web_acl.Wafv2WebAcl.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Wafv2WebAcl resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Wafv2WebAcl to import. This parameter is required.
     * @param importFromId The id of the existing Wafv2WebAcl that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.wafv2_web_acl.Wafv2WebAcl.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAssociationConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAssociationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCaptchaConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCaptchaConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putChallengeConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig value) {
        software.amazon.jsii.Kernel.call(this, "putChallengeConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCustomResponseBody(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBody>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBody> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBody>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBody __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCustomResponseBody", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataProtectionConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig value) {
        software.amazon.jsii.Kernel.call(this, "putDataProtectionConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDefaultAction(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRule> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl.Wafv2WebAclRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVisibilityConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVisibilityConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssociationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAssociationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptchaConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCaptchaConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChallengeConfig() {
        software.amazon.jsii.Kernel.call(this, "resetChallengeConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomResponseBody() {
        software.amazon.jsii.Kernel.call(this, "resetCustomResponseBody", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataProtectionConfig() {
        software.amazon.jsii.Kernel.call(this, "resetDataProtectionConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRule() {
        software.amazon.jsii.Kernel.call(this, "resetRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuleJson() {
        software.amazon.jsii.Kernel.call(this, "resetRuleJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTokenDomains() {
        software.amazon.jsii.Kernel.call(this, "resetTokenDomains", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationIntegrationUrl() {
        return software.amazon.jsii.Kernel.get(this, "applicationIntegrationUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigOutputReference getAssociationConfig() {
        return software.amazon.jsii.Kernel.get(this, "associationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCapacity() {
        return software.amazon.jsii.Kernel.get(this, "capacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigOutputReference getCaptchaConfig() {
        return software.amazon.jsii.Kernel.get(this, "captchaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfigOutputReference getChallengeConfig() {
        return software.amazon.jsii.Kernel.get(this, "challengeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBodyList getCustomResponseBody() {
        return software.amazon.jsii.Kernel.get(this, "customResponseBody", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBodyList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigOutputReference getDataProtectionConfig() {
        return software.amazon.jsii.Kernel.get(this, "dataProtectionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionOutputReference getDefaultAction() {
        return software.amazon.jsii.Kernel.get(this, "defaultAction", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLockToken() {
        return software.amazon.jsii.Kernel.get(this, "lockToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleList getRule() {
        return software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfigOutputReference getVisibilityConfig() {
        return software.amazon.jsii.Kernel.get(this, "visibilityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig getAssociationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "associationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig getCaptchaConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "captchaConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig getChallengeConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "challengeConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomResponseBodyInput() {
        return software.amazon.jsii.Kernel.get(this, "customResponseBodyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig getDataProtectionConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "dataProtectionConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction getDefaultActionInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultActionInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "scopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTokenDomainsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tokenDomainsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig getVisibilityConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "visibilityConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleJson() {
        return software.amazon.jsii.Kernel.get(this, "ruleJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleJson", java.util.Objects.requireNonNull(value, "ruleJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScope() {
        return software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scope", java.util.Objects.requireNonNull(value, "scope is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTokenDomains() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tokenDomains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTokenDomains(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tokenDomains", java.util.Objects.requireNonNull(value, "tokenDomains is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.wafv2_web_acl.Wafv2WebAcl}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.wafv2_web_acl.Wafv2WebAcl> {
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
        private final imports.aws.wafv2_web_acl.Wafv2WebAclConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.wafv2_web_acl.Wafv2WebAclConfig.Builder();
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
         * default_action block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_action Wafv2WebAcl#default_action}
         * <p>
         * @return {@code this}
         * @param defaultAction default_action block. This parameter is required.
         */
        public Builder defaultAction(final imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction defaultAction) {
            this.config.defaultAction(defaultAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}.
         * <p>
         * @return {@code this}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#scope Wafv2WebAcl#scope}. This parameter is required.
         */
        public Builder scope(final java.lang.String scope) {
            this.config.scope(scope);
            return this;
        }

        /**
         * visibility_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#visibility_config Wafv2WebAcl#visibility_config}
         * <p>
         * @return {@code this}
         * @param visibilityConfig visibility_config block. This parameter is required.
         */
        public Builder visibilityConfig(final imports.aws.wafv2_web_acl.Wafv2WebAclVisibilityConfig visibilityConfig) {
            this.config.visibilityConfig(visibilityConfig);
            return this;
        }

        /**
         * association_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#association_config Wafv2WebAcl#association_config}
         * <p>
         * @return {@code this}
         * @param associationConfig association_config block. This parameter is required.
         */
        public Builder associationConfig(final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfig associationConfig) {
            this.config.associationConfig(associationConfig);
            return this;
        }

        /**
         * captcha_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#captcha_config Wafv2WebAcl#captcha_config}
         * <p>
         * @return {@code this}
         * @param captchaConfig captcha_config block. This parameter is required.
         */
        public Builder captchaConfig(final imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig captchaConfig) {
            this.config.captchaConfig(captchaConfig);
            return this;
        }

        /**
         * challenge_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#challenge_config Wafv2WebAcl#challenge_config}
         * <p>
         * @return {@code this}
         * @param challengeConfig challenge_config block. This parameter is required.
         */
        public Builder challengeConfig(final imports.aws.wafv2_web_acl.Wafv2WebAclChallengeConfig challengeConfig) {
            this.config.challengeConfig(challengeConfig);
            return this;
        }

        /**
         * custom_response_body block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
         * <p>
         * @return {@code this}
         * @param customResponseBody custom_response_body block. This parameter is required.
         */
        public Builder customResponseBody(final com.hashicorp.cdktf.IResolvable customResponseBody) {
            this.config.customResponseBody(customResponseBody);
            return this;
        }
        /**
         * custom_response_body block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body Wafv2WebAcl#custom_response_body}
         * <p>
         * @return {@code this}
         * @param customResponseBody custom_response_body block. This parameter is required.
         */
        public Builder customResponseBody(final java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclCustomResponseBody> customResponseBody) {
            this.config.customResponseBody(customResponseBody);
            return this;
        }

        /**
         * data_protection_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection_config Wafv2WebAcl#data_protection_config}
         * <p>
         * @return {@code this}
         * @param dataProtectionConfig data_protection_config block. This parameter is required.
         */
        public Builder dataProtectionConfig(final imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig dataProtectionConfig) {
            this.config.dataProtectionConfig(dataProtectionConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#description Wafv2WebAcl#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#id Wafv2WebAcl#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name Wafv2WebAcl#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#name_prefix Wafv2WebAcl#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
         * <p>
         * @return {@code this}
         * @param rule rule block. This parameter is required.
         */
        public Builder rule(final com.hashicorp.cdktf.IResolvable rule) {
            this.config.rule(rule);
            return this;
        }
        /**
         * rule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule Wafv2WebAcl#rule}
         * <p>
         * @return {@code this}
         * @param rule rule block. This parameter is required.
         */
        public Builder rule(final java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclRule> rule) {
            this.config.rule(rule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}.
         * <p>
         * @return {@code this}
         * @param ruleJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#rule_json Wafv2WebAcl#rule_json}. This parameter is required.
         */
        public Builder ruleJson(final java.lang.String ruleJson) {
            this.config.ruleJson(ruleJson);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags Wafv2WebAcl#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#tags_all Wafv2WebAcl#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}.
         * <p>
         * @return {@code this}
         * @param tokenDomains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#token_domains Wafv2WebAcl#token_domains}. This parameter is required.
         */
        public Builder tokenDomains(final java.util.List<java.lang.String> tokenDomains) {
            this.config.tokenDomains(tokenDomains);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.wafv2_web_acl.Wafv2WebAcl}.
         */
        @Override
        public imports.aws.wafv2_web_acl.Wafv2WebAcl build() {
            return new imports.aws.wafv2_web_acl.Wafv2WebAcl(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
