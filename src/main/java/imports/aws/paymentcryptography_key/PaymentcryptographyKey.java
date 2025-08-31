package imports.aws.paymentcryptography_key;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key aws_paymentcryptography_key}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.paymentcryptographyKey.PaymentcryptographyKey")
public class PaymentcryptographyKey extends com.hashicorp.cdktf.TerraformResource {

    protected PaymentcryptographyKey(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PaymentcryptographyKey(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.paymentcryptography_key.PaymentcryptographyKey.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key aws_paymentcryptography_key} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public PaymentcryptographyKey(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a PaymentcryptographyKey resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the PaymentcryptographyKey to import. This parameter is required.
     * @param importFromId The id of the existing PaymentcryptographyKey that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the PaymentcryptographyKey to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.paymentcryptography_key.PaymentcryptographyKey.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a PaymentcryptographyKey resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the PaymentcryptographyKey to import. This parameter is required.
     * @param importFromId The id of the existing PaymentcryptographyKey that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.paymentcryptography_key.PaymentcryptographyKey.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putKeyAttributes(final @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes value) {
        software.amazon.jsii.Kernel.call(this, "putKeyAttributes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeletionWindowInDays() {
        software.amazon.jsii.Kernel.call(this, "resetDeletionWindowInDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetKeyAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyCheckValueAlgorithm() {
        software.amazon.jsii.Kernel.call(this, "resetKeyCheckValueAlgorithm", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesOutputReference getKeyAttributes() {
        return software.amazon.jsii.Kernel.get(this, "keyAttributes", software.amazon.jsii.NativeType.forClass(imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyCheckValue() {
        return software.amazon.jsii.Kernel.get(this, "keyCheckValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyOrigin() {
        return software.amazon.jsii.Kernel.get(this, "keyOrigin", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyState() {
        return software.amazon.jsii.Kernel.get(this, "keyState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDeletionWindowInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "deletionWindowInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExportableInput() {
        return software.amazon.jsii.Kernel.get(this, "exportableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKeyAttributesInput() {
        return software.amazon.jsii.Kernel.get(this, "keyAttributesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyCheckValueAlgorithmInput() {
        return software.amazon.jsii.Kernel.get(this, "keyCheckValueAlgorithmInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDeletionWindowInDays() {
        return software.amazon.jsii.Kernel.get(this, "deletionWindowInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDeletionWindowInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "deletionWindowInDays", java.util.Objects.requireNonNull(value, "deletionWindowInDays is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getExportable() {
        return software.amazon.jsii.Kernel.get(this, "exportable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExportable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "exportable", java.util.Objects.requireNonNull(value, "exportable is required"));
    }

    public void setExportable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "exportable", java.util.Objects.requireNonNull(value, "exportable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyCheckValueAlgorithm() {
        return software.amazon.jsii.Kernel.get(this, "keyCheckValueAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyCheckValueAlgorithm(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyCheckValueAlgorithm", java.util.Objects.requireNonNull(value, "keyCheckValueAlgorithm is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.paymentcryptography_key.PaymentcryptographyKey}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.paymentcryptography_key.PaymentcryptographyKey> {
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
        private final imports.aws.paymentcryptography_key.PaymentcryptographyKeyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.paymentcryptography_key.PaymentcryptographyKeyConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}.
         * <p>
         * @return {@code this}
         * @param exportable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}. This parameter is required.
         */
        public Builder exportable(final java.lang.Boolean exportable) {
            this.config.exportable(exportable);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}.
         * <p>
         * @return {@code this}
         * @param exportable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#exportable PaymentcryptographyKey#exportable}. This parameter is required.
         */
        public Builder exportable(final com.hashicorp.cdktf.IResolvable exportable) {
            this.config.exportable(exportable);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#deletion_window_in_days PaymentcryptographyKey#deletion_window_in_days}.
         * <p>
         * @return {@code this}
         * @param deletionWindowInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#deletion_window_in_days PaymentcryptographyKey#deletion_window_in_days}. This parameter is required.
         */
        public Builder deletionWindowInDays(final java.lang.Number deletionWindowInDays) {
            this.config.deletionWindowInDays(deletionWindowInDays);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#enabled PaymentcryptographyKey#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * key_attributes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_attributes PaymentcryptographyKey#key_attributes}
         * <p>
         * @return {@code this}
         * @param keyAttributes key_attributes block. This parameter is required.
         */
        public Builder keyAttributes(final imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributes keyAttributes) {
            this.config.keyAttributes(keyAttributes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_check_value_algorithm PaymentcryptographyKey#key_check_value_algorithm}.
         * <p>
         * @return {@code this}
         * @param keyCheckValueAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_check_value_algorithm PaymentcryptographyKey#key_check_value_algorithm}. This parameter is required.
         */
        public Builder keyCheckValueAlgorithm(final java.lang.String keyCheckValueAlgorithm) {
            this.config.keyCheckValueAlgorithm(keyCheckValueAlgorithm);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#tags PaymentcryptographyKey#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#tags PaymentcryptographyKey#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#timeouts PaymentcryptographyKey#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.paymentcryptography_key.PaymentcryptographyKeyTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.paymentcryptography_key.PaymentcryptographyKey}.
         */
        @Override
        public imports.aws.paymentcryptography_key.PaymentcryptographyKey build() {
            return new imports.aws.paymentcryptography_key.PaymentcryptographyKey(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
