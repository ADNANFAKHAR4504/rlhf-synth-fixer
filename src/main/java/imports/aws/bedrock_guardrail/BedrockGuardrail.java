package imports.aws.bedrock_guardrail;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail aws_bedrock_guardrail}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.140Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockGuardrail.BedrockGuardrail")
public class BedrockGuardrail extends com.hashicorp.cdktf.TerraformResource {

    protected BedrockGuardrail(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockGuardrail(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.bedrock_guardrail.BedrockGuardrail.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail aws_bedrock_guardrail} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BedrockGuardrail(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BedrockGuardrail resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockGuardrail to import. This parameter is required.
     * @param importFromId The id of the existing BedrockGuardrail that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BedrockGuardrail to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrock_guardrail.BedrockGuardrail.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BedrockGuardrail resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BedrockGuardrail to import. This parameter is required.
     * @param importFromId The id of the existing BedrockGuardrail that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.bedrock_guardrail.BedrockGuardrail.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putContentPolicyConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putContentPolicyConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putContextualGroundingPolicyConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putContextualGroundingPolicyConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSensitiveInformationPolicyConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSensitiveInformationPolicyConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTopicPolicyConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTopicPolicyConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWordPolicyConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfig> __cast_cd4240 = (java.util.List<imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWordPolicyConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContentPolicyConfig() {
        software.amazon.jsii.Kernel.call(this, "resetContentPolicyConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContextualGroundingPolicyConfig() {
        software.amazon.jsii.Kernel.call(this, "resetContextualGroundingPolicyConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSensitiveInformationPolicyConfig() {
        software.amazon.jsii.Kernel.call(this, "resetSensitiveInformationPolicyConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTopicPolicyConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTopicPolicyConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWordPolicyConfig() {
        software.amazon.jsii.Kernel.call(this, "resetWordPolicyConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfigList getContentPolicyConfig() {
        return software.amazon.jsii.Kernel.get(this, "contentPolicyConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfigList getContextualGroundingPolicyConfig() {
        return software.amazon.jsii.Kernel.get(this, "contextualGroundingPolicyConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGuardrailArn() {
        return software.amazon.jsii.Kernel.get(this, "guardrailArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGuardrailId() {
        return software.amazon.jsii.Kernel.get(this, "guardrailId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfigList getSensitiveInformationPolicyConfig() {
        return software.amazon.jsii.Kernel.get(this, "sensitiveInformationPolicyConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfigList getTopicPolicyConfig() {
        return software.amazon.jsii.Kernel.get(this, "topicPolicyConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfigList getWordPolicyConfig() {
        return software.amazon.jsii.Kernel.get(this, "wordPolicyConfig", software.amazon.jsii.NativeType.forClass(imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBlockedInputMessagingInput() {
        return software.amazon.jsii.Kernel.get(this, "blockedInputMessagingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBlockedOutputsMessagingInput() {
        return software.amazon.jsii.Kernel.get(this, "blockedOutputsMessagingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContentPolicyConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "contentPolicyConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContextualGroundingPolicyConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "contextualGroundingPolicyConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSensitiveInformationPolicyConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "sensitiveInformationPolicyConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTopicPolicyConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "topicPolicyConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWordPolicyConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "wordPolicyConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBlockedInputMessaging() {
        return software.amazon.jsii.Kernel.get(this, "blockedInputMessaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBlockedInputMessaging(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "blockedInputMessaging", java.util.Objects.requireNonNull(value, "blockedInputMessaging is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBlockedOutputsMessaging() {
        return software.amazon.jsii.Kernel.get(this, "blockedOutputsMessaging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBlockedOutputsMessaging(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "blockedOutputsMessaging", java.util.Objects.requireNonNull(value, "blockedOutputsMessaging is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyArn", java.util.Objects.requireNonNull(value, "kmsKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.bedrock_guardrail.BedrockGuardrail}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.bedrock_guardrail.BedrockGuardrail> {
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
        private final imports.aws.bedrock_guardrail.BedrockGuardrailConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.bedrock_guardrail.BedrockGuardrailConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_input_messaging BedrockGuardrail#blocked_input_messaging}.
         * <p>
         * @return {@code this}
         * @param blockedInputMessaging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_input_messaging BedrockGuardrail#blocked_input_messaging}. This parameter is required.
         */
        public Builder blockedInputMessaging(final java.lang.String blockedInputMessaging) {
            this.config.blockedInputMessaging(blockedInputMessaging);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_outputs_messaging BedrockGuardrail#blocked_outputs_messaging}.
         * <p>
         * @return {@code this}
         * @param blockedOutputsMessaging Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#blocked_outputs_messaging BedrockGuardrail#blocked_outputs_messaging}. This parameter is required.
         */
        public Builder blockedOutputsMessaging(final java.lang.String blockedOutputsMessaging) {
            this.config.blockedOutputsMessaging(blockedOutputsMessaging);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#name BedrockGuardrail#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#name BedrockGuardrail#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * content_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#content_policy_config BedrockGuardrail#content_policy_config}
         * <p>
         * @return {@code this}
         * @param contentPolicyConfig content_policy_config block. This parameter is required.
         */
        public Builder contentPolicyConfig(final com.hashicorp.cdktf.IResolvable contentPolicyConfig) {
            this.config.contentPolicyConfig(contentPolicyConfig);
            return this;
        }
        /**
         * content_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#content_policy_config BedrockGuardrail#content_policy_config}
         * <p>
         * @return {@code this}
         * @param contentPolicyConfig content_policy_config block. This parameter is required.
         */
        public Builder contentPolicyConfig(final java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailContentPolicyConfig> contentPolicyConfig) {
            this.config.contentPolicyConfig(contentPolicyConfig);
            return this;
        }

        /**
         * contextual_grounding_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#contextual_grounding_policy_config BedrockGuardrail#contextual_grounding_policy_config}
         * <p>
         * @return {@code this}
         * @param contextualGroundingPolicyConfig contextual_grounding_policy_config block. This parameter is required.
         */
        public Builder contextualGroundingPolicyConfig(final com.hashicorp.cdktf.IResolvable contextualGroundingPolicyConfig) {
            this.config.contextualGroundingPolicyConfig(contextualGroundingPolicyConfig);
            return this;
        }
        /**
         * contextual_grounding_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#contextual_grounding_policy_config BedrockGuardrail#contextual_grounding_policy_config}
         * <p>
         * @return {@code this}
         * @param contextualGroundingPolicyConfig contextual_grounding_policy_config block. This parameter is required.
         */
        public Builder contextualGroundingPolicyConfig(final java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailContextualGroundingPolicyConfig> contextualGroundingPolicyConfig) {
            this.config.contextualGroundingPolicyConfig(contextualGroundingPolicyConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#description BedrockGuardrail#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#description BedrockGuardrail#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#kms_key_arn BedrockGuardrail#kms_key_arn}.
         * <p>
         * @return {@code this}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#kms_key_arn BedrockGuardrail#kms_key_arn}. This parameter is required.
         */
        public Builder kmsKeyArn(final java.lang.String kmsKeyArn) {
            this.config.kmsKeyArn(kmsKeyArn);
            return this;
        }

        /**
         * sensitive_information_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#sensitive_information_policy_config BedrockGuardrail#sensitive_information_policy_config}
         * <p>
         * @return {@code this}
         * @param sensitiveInformationPolicyConfig sensitive_information_policy_config block. This parameter is required.
         */
        public Builder sensitiveInformationPolicyConfig(final com.hashicorp.cdktf.IResolvable sensitiveInformationPolicyConfig) {
            this.config.sensitiveInformationPolicyConfig(sensitiveInformationPolicyConfig);
            return this;
        }
        /**
         * sensitive_information_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#sensitive_information_policy_config BedrockGuardrail#sensitive_information_policy_config}
         * <p>
         * @return {@code this}
         * @param sensitiveInformationPolicyConfig sensitive_information_policy_config block. This parameter is required.
         */
        public Builder sensitiveInformationPolicyConfig(final java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailSensitiveInformationPolicyConfig> sensitiveInformationPolicyConfig) {
            this.config.sensitiveInformationPolicyConfig(sensitiveInformationPolicyConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#tags BedrockGuardrail#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#tags BedrockGuardrail#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#timeouts BedrockGuardrail#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.bedrock_guardrail.BedrockGuardrailTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * topic_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topic_policy_config BedrockGuardrail#topic_policy_config}
         * <p>
         * @return {@code this}
         * @param topicPolicyConfig topic_policy_config block. This parameter is required.
         */
        public Builder topicPolicyConfig(final com.hashicorp.cdktf.IResolvable topicPolicyConfig) {
            this.config.topicPolicyConfig(topicPolicyConfig);
            return this;
        }
        /**
         * topic_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#topic_policy_config BedrockGuardrail#topic_policy_config}
         * <p>
         * @return {@code this}
         * @param topicPolicyConfig topic_policy_config block. This parameter is required.
         */
        public Builder topicPolicyConfig(final java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailTopicPolicyConfig> topicPolicyConfig) {
            this.config.topicPolicyConfig(topicPolicyConfig);
            return this;
        }

        /**
         * word_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#word_policy_config BedrockGuardrail#word_policy_config}
         * <p>
         * @return {@code this}
         * @param wordPolicyConfig word_policy_config block. This parameter is required.
         */
        public Builder wordPolicyConfig(final com.hashicorp.cdktf.IResolvable wordPolicyConfig) {
            this.config.wordPolicyConfig(wordPolicyConfig);
            return this;
        }
        /**
         * word_policy_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_guardrail#word_policy_config BedrockGuardrail#word_policy_config}
         * <p>
         * @return {@code this}
         * @param wordPolicyConfig word_policy_config block. This parameter is required.
         */
        public Builder wordPolicyConfig(final java.util.List<? extends imports.aws.bedrock_guardrail.BedrockGuardrailWordPolicyConfig> wordPolicyConfig) {
            this.config.wordPolicyConfig(wordPolicyConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.bedrock_guardrail.BedrockGuardrail}.
         */
        @Override
        public imports.aws.bedrock_guardrail.BedrockGuardrail build() {
            return new imports.aws.bedrock_guardrail.BedrockGuardrail(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
