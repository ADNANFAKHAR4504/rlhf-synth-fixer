package imports.aws.cloudfrontkeyvaluestore_keys_exclusive;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfrontkeyvaluestore_keys_exclusive aws_cloudfrontkeyvaluestore_keys_exclusive}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.255Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontkeyvaluestoreKeysExclusive.CloudfrontkeyvaluestoreKeysExclusive")
public class CloudfrontkeyvaluestoreKeysExclusive extends com.hashicorp.cdktf.TerraformResource {

    protected CloudfrontkeyvaluestoreKeysExclusive(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontkeyvaluestoreKeysExclusive(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfrontkeyvaluestore_keys_exclusive aws_cloudfrontkeyvaluestore_keys_exclusive} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudfrontkeyvaluestoreKeysExclusive(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontkeyvaluestoreKeysExclusive resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontkeyvaluestoreKeysExclusive to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontkeyvaluestoreKeysExclusive that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudfrontkeyvaluestoreKeysExclusive to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontkeyvaluestoreKeysExclusive resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontkeyvaluestoreKeysExclusive to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontkeyvaluestoreKeysExclusive that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putResourceKeyValuePair(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePair>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePair> __cast_cd4240 = (java.util.List<imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePair>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePair __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceKeyValuePair", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetMaxBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceKeyValuePair() {
        software.amazon.jsii.Kernel.call(this, "resetResourceKeyValuePair", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePairList getResourceKeyValuePair() {
        return software.amazon.jsii.Kernel.get(this, "resourceKeyValuePair", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePairList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalSizeInBytes() {
        return software.amazon.jsii.Kernel.get(this, "totalSizeInBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyValueStoreArnInput() {
        return software.amazon.jsii.Kernel.get(this, "keyValueStoreArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxBatchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceKeyValuePairInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceKeyValuePairInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyValueStoreArn() {
        return software.amazon.jsii.Kernel.get(this, "keyValueStoreArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyValueStoreArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyValueStoreArn", java.util.Objects.requireNonNull(value, "keyValueStoreArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "maxBatchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxBatchSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxBatchSize", java.util.Objects.requireNonNull(value, "maxBatchSize is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive> {
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
        private final imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveConfig.Builder();
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
         * The Amazon Resource Name (ARN) of the Key Value Store.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfrontkeyvaluestore_keys_exclusive#key_value_store_arn CloudfrontkeyvaluestoreKeysExclusive#key_value_store_arn}
         * <p>
         * @return {@code this}
         * @param keyValueStoreArn The Amazon Resource Name (ARN) of the Key Value Store. This parameter is required.
         */
        public Builder keyValueStoreArn(final java.lang.String keyValueStoreArn) {
            this.config.keyValueStoreArn(keyValueStoreArn);
            return this;
        }

        /**
         * Maximum resource key values pairs that you wills update in a single API request.
         * <p>
         * AWS has a default quota of 50 keys or a 3 MB payload, whichever is reached first
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfrontkeyvaluestore_keys_exclusive#max_batch_size CloudfrontkeyvaluestoreKeysExclusive#max_batch_size}
         * <p>
         * @return {@code this}
         * @param maxBatchSize Maximum resource key values pairs that you wills update in a single API request. This parameter is required.
         */
        public Builder maxBatchSize(final java.lang.Number maxBatchSize) {
            this.config.maxBatchSize(maxBatchSize);
            return this;
        }

        /**
         * resource_key_value_pair block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfrontkeyvaluestore_keys_exclusive#resource_key_value_pair CloudfrontkeyvaluestoreKeysExclusive#resource_key_value_pair}
         * <p>
         * @return {@code this}
         * @param resourceKeyValuePair resource_key_value_pair block. This parameter is required.
         */
        public Builder resourceKeyValuePair(final com.hashicorp.cdktf.IResolvable resourceKeyValuePair) {
            this.config.resourceKeyValuePair(resourceKeyValuePair);
            return this;
        }
        /**
         * resource_key_value_pair block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfrontkeyvaluestore_keys_exclusive#resource_key_value_pair CloudfrontkeyvaluestoreKeysExclusive#resource_key_value_pair}
         * <p>
         * @return {@code this}
         * @param resourceKeyValuePair resource_key_value_pair block. This parameter is required.
         */
        public Builder resourceKeyValuePair(final java.util.List<? extends imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusiveResourceKeyValuePair> resourceKeyValuePair) {
            this.config.resourceKeyValuePair(resourceKeyValuePair);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive}.
         */
        @Override
        public imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive build() {
            return new imports.aws.cloudfrontkeyvaluestore_keys_exclusive.CloudfrontkeyvaluestoreKeysExclusive(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
