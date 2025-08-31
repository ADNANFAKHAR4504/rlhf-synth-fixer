package imports.aws.kms_key;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key aws_kms_key}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.478Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsKey.KmsKey")
public class KmsKey extends com.hashicorp.cdktf.TerraformResource {

    protected KmsKey(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KmsKey(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.kms_key.KmsKey.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key aws_kms_key} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public KmsKey(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.kms_key.KmsKeyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key aws_kms_key} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public KmsKey(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a KmsKey resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KmsKey to import. This parameter is required.
     * @param importFromId The id of the existing KmsKey that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the KmsKey to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kms_key.KmsKey.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a KmsKey resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the KmsKey to import. This parameter is required.
     * @param importFromId The id of the existing KmsKey that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.kms_key.KmsKey.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.kms_key.KmsKeyTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBypassPolicyLockoutSafetyCheck() {
        software.amazon.jsii.Kernel.call(this, "resetBypassPolicyLockoutSafetyCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerMasterKeySpec() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerMasterKeySpec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomKeyStoreId() {
        software.amazon.jsii.Kernel.call(this, "resetCustomKeyStoreId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeletionWindowInDays() {
        software.amazon.jsii.Kernel.call(this, "resetDeletionWindowInDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableKeyRotation() {
        software.amazon.jsii.Kernel.call(this, "resetEnableKeyRotation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetIsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyUsage() {
        software.amazon.jsii.Kernel.call(this, "resetKeyUsage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiRegion() {
        software.amazon.jsii.Kernel.call(this, "resetMultiRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRotationPeriodInDays() {
        software.amazon.jsii.Kernel.call(this, "resetRotationPeriodInDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXksKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetXksKeyId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyId() {
        return software.amazon.jsii.Kernel.get(this, "keyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kms_key.KmsKeyTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.kms_key.KmsKeyTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getBypassPolicyLockoutSafetyCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "bypassPolicyLockoutSafetyCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerMasterKeySpecInput() {
        return software.amazon.jsii.Kernel.get(this, "customerMasterKeySpecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomKeyStoreIdInput() {
        return software.amazon.jsii.Kernel.get(this, "customKeyStoreIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDeletionWindowInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "deletionWindowInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableKeyRotationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableKeyRotationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "isEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyUsageInput() {
        return software.amazon.jsii.Kernel.get(this, "keyUsageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "multiRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "policyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRotationPeriodInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "rotationPeriodInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getXksKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "xksKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getBypassPolicyLockoutSafetyCheck() {
        return software.amazon.jsii.Kernel.get(this, "bypassPolicyLockoutSafetyCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setBypassPolicyLockoutSafetyCheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "bypassPolicyLockoutSafetyCheck", java.util.Objects.requireNonNull(value, "bypassPolicyLockoutSafetyCheck is required"));
    }

    public void setBypassPolicyLockoutSafetyCheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "bypassPolicyLockoutSafetyCheck", java.util.Objects.requireNonNull(value, "bypassPolicyLockoutSafetyCheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerMasterKeySpec() {
        return software.amazon.jsii.Kernel.get(this, "customerMasterKeySpec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerMasterKeySpec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerMasterKeySpec", java.util.Objects.requireNonNull(value, "customerMasterKeySpec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomKeyStoreId() {
        return software.amazon.jsii.Kernel.get(this, "customKeyStoreId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomKeyStoreId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customKeyStoreId", java.util.Objects.requireNonNull(value, "customKeyStoreId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDeletionWindowInDays() {
        return software.amazon.jsii.Kernel.get(this, "deletionWindowInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDeletionWindowInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "deletionWindowInDays", java.util.Objects.requireNonNull(value, "deletionWindowInDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableKeyRotation() {
        return software.amazon.jsii.Kernel.get(this, "enableKeyRotation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableKeyRotation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableKeyRotation", java.util.Objects.requireNonNull(value, "enableKeyRotation is required"));
    }

    public void setEnableKeyRotation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableKeyRotation", java.util.Objects.requireNonNull(value, "enableKeyRotation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "isEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isEnabled", java.util.Objects.requireNonNull(value, "isEnabled is required"));
    }

    public void setIsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isEnabled", java.util.Objects.requireNonNull(value, "isEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyUsage() {
        return software.amazon.jsii.Kernel.get(this, "keyUsage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyUsage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyUsage", java.util.Objects.requireNonNull(value, "keyUsage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiRegion() {
        return software.amazon.jsii.Kernel.get(this, "multiRegion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiRegion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiRegion", java.util.Objects.requireNonNull(value, "multiRegion is required"));
    }

    public void setMultiRegion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiRegion", java.util.Objects.requireNonNull(value, "multiRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policy", java.util.Objects.requireNonNull(value, "policy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRotationPeriodInDays() {
        return software.amazon.jsii.Kernel.get(this, "rotationPeriodInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRotationPeriodInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rotationPeriodInDays", java.util.Objects.requireNonNull(value, "rotationPeriodInDays is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getXksKeyId() {
        return software.amazon.jsii.Kernel.get(this, "xksKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setXksKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "xksKeyId", java.util.Objects.requireNonNull(value, "xksKeyId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.kms_key.KmsKey}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.kms_key.KmsKey> {
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
        private imports.aws.kms_key.KmsKeyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#bypass_policy_lockout_safety_check KmsKey#bypass_policy_lockout_safety_check}.
         * <p>
         * @return {@code this}
         * @param bypassPolicyLockoutSafetyCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#bypass_policy_lockout_safety_check KmsKey#bypass_policy_lockout_safety_check}. This parameter is required.
         */
        public Builder bypassPolicyLockoutSafetyCheck(final java.lang.Boolean bypassPolicyLockoutSafetyCheck) {
            this.config().bypassPolicyLockoutSafetyCheck(bypassPolicyLockoutSafetyCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#bypass_policy_lockout_safety_check KmsKey#bypass_policy_lockout_safety_check}.
         * <p>
         * @return {@code this}
         * @param bypassPolicyLockoutSafetyCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#bypass_policy_lockout_safety_check KmsKey#bypass_policy_lockout_safety_check}. This parameter is required.
         */
        public Builder bypassPolicyLockoutSafetyCheck(final com.hashicorp.cdktf.IResolvable bypassPolicyLockoutSafetyCheck) {
            this.config().bypassPolicyLockoutSafetyCheck(bypassPolicyLockoutSafetyCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#customer_master_key_spec KmsKey#customer_master_key_spec}.
         * <p>
         * @return {@code this}
         * @param customerMasterKeySpec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#customer_master_key_spec KmsKey#customer_master_key_spec}. This parameter is required.
         */
        public Builder customerMasterKeySpec(final java.lang.String customerMasterKeySpec) {
            this.config().customerMasterKeySpec(customerMasterKeySpec);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#custom_key_store_id KmsKey#custom_key_store_id}.
         * <p>
         * @return {@code this}
         * @param customKeyStoreId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#custom_key_store_id KmsKey#custom_key_store_id}. This parameter is required.
         */
        public Builder customKeyStoreId(final java.lang.String customKeyStoreId) {
            this.config().customKeyStoreId(customKeyStoreId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#deletion_window_in_days KmsKey#deletion_window_in_days}.
         * <p>
         * @return {@code this}
         * @param deletionWindowInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#deletion_window_in_days KmsKey#deletion_window_in_days}. This parameter is required.
         */
        public Builder deletionWindowInDays(final java.lang.Number deletionWindowInDays) {
            this.config().deletionWindowInDays(deletionWindowInDays);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#description KmsKey#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#description KmsKey#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config().description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#enable_key_rotation KmsKey#enable_key_rotation}.
         * <p>
         * @return {@code this}
         * @param enableKeyRotation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#enable_key_rotation KmsKey#enable_key_rotation}. This parameter is required.
         */
        public Builder enableKeyRotation(final java.lang.Boolean enableKeyRotation) {
            this.config().enableKeyRotation(enableKeyRotation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#enable_key_rotation KmsKey#enable_key_rotation}.
         * <p>
         * @return {@code this}
         * @param enableKeyRotation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#enable_key_rotation KmsKey#enable_key_rotation}. This parameter is required.
         */
        public Builder enableKeyRotation(final com.hashicorp.cdktf.IResolvable enableKeyRotation) {
            this.config().enableKeyRotation(enableKeyRotation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#id KmsKey#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#id KmsKey#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#is_enabled KmsKey#is_enabled}.
         * <p>
         * @return {@code this}
         * @param isEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#is_enabled KmsKey#is_enabled}. This parameter is required.
         */
        public Builder isEnabled(final java.lang.Boolean isEnabled) {
            this.config().isEnabled(isEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#is_enabled KmsKey#is_enabled}.
         * <p>
         * @return {@code this}
         * @param isEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#is_enabled KmsKey#is_enabled}. This parameter is required.
         */
        public Builder isEnabled(final com.hashicorp.cdktf.IResolvable isEnabled) {
            this.config().isEnabled(isEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#key_usage KmsKey#key_usage}.
         * <p>
         * @return {@code this}
         * @param keyUsage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#key_usage KmsKey#key_usage}. This parameter is required.
         */
        public Builder keyUsage(final java.lang.String keyUsage) {
            this.config().keyUsage(keyUsage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#multi_region KmsKey#multi_region}.
         * <p>
         * @return {@code this}
         * @param multiRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#multi_region KmsKey#multi_region}. This parameter is required.
         */
        public Builder multiRegion(final java.lang.Boolean multiRegion) {
            this.config().multiRegion(multiRegion);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#multi_region KmsKey#multi_region}.
         * <p>
         * @return {@code this}
         * @param multiRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#multi_region KmsKey#multi_region}. This parameter is required.
         */
        public Builder multiRegion(final com.hashicorp.cdktf.IResolvable multiRegion) {
            this.config().multiRegion(multiRegion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#policy KmsKey#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#policy KmsKey#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config().policy(policy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#rotation_period_in_days KmsKey#rotation_period_in_days}.
         * <p>
         * @return {@code this}
         * @param rotationPeriodInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#rotation_period_in_days KmsKey#rotation_period_in_days}. This parameter is required.
         */
        public Builder rotationPeriodInDays(final java.lang.Number rotationPeriodInDays) {
            this.config().rotationPeriodInDays(rotationPeriodInDays);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#tags KmsKey#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#tags KmsKey#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#tags_all KmsKey#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#tags_all KmsKey#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#timeouts KmsKey#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.kms_key.KmsKeyTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#xks_key_id KmsKey#xks_key_id}.
         * <p>
         * @return {@code this}
         * @param xksKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_key#xks_key_id KmsKey#xks_key_id}. This parameter is required.
         */
        public Builder xksKeyId(final java.lang.String xksKeyId) {
            this.config().xksKeyId(xksKeyId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.kms_key.KmsKey}.
         */
        @Override
        public imports.aws.kms_key.KmsKey build() {
            return new imports.aws.kms_key.KmsKey(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.kms_key.KmsKeyConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.kms_key.KmsKeyConfig.Builder();
            }
            return this.config;
        }
    }
}
