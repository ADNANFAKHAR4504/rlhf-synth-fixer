package imports.aws.data_aws_elasticache_reserved_cache_node_offering;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering aws_elasticache_reserved_cache_node_offering}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.647Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsElasticacheReservedCacheNodeOffering.DataAwsElasticacheReservedCacheNodeOffering")
public class DataAwsElasticacheReservedCacheNodeOffering extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsElasticacheReservedCacheNodeOffering(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsElasticacheReservedCacheNodeOffering(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering aws_elasticache_reserved_cache_node_offering} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsElasticacheReservedCacheNodeOffering(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOfferingConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsElasticacheReservedCacheNodeOffering resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsElasticacheReservedCacheNodeOffering to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsElasticacheReservedCacheNodeOffering that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsElasticacheReservedCacheNodeOffering to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsElasticacheReservedCacheNodeOffering resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsElasticacheReservedCacheNodeOffering to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsElasticacheReservedCacheNodeOffering that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getFixedPrice() {
        return software.amazon.jsii.Kernel.get(this, "fixedPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOfferingId() {
        return software.amazon.jsii.Kernel.get(this, "offeringId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCacheNodeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheNodeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "durationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOfferingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "offeringTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProductDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "productDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCacheNodeType() {
        return software.amazon.jsii.Kernel.get(this, "cacheNodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCacheNodeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cacheNodeType", java.util.Objects.requireNonNull(value, "cacheNodeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDuration() {
        return software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDuration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "duration", java.util.Objects.requireNonNull(value, "duration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOfferingType() {
        return software.amazon.jsii.Kernel.get(this, "offeringType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOfferingType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "offeringType", java.util.Objects.requireNonNull(value, "offeringType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProductDescription() {
        return software.amazon.jsii.Kernel.get(this, "productDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProductDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "productDescription", java.util.Objects.requireNonNull(value, "productDescription is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering> {
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
        private final imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOfferingConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOfferingConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#cache_node_type DataAwsElasticacheReservedCacheNodeOffering#cache_node_type}.
         * <p>
         * @return {@code this}
         * @param cacheNodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#cache_node_type DataAwsElasticacheReservedCacheNodeOffering#cache_node_type}. This parameter is required.
         */
        public Builder cacheNodeType(final java.lang.String cacheNodeType) {
            this.config.cacheNodeType(cacheNodeType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#duration DataAwsElasticacheReservedCacheNodeOffering#duration}.
         * <p>
         * @return {@code this}
         * @param duration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#duration DataAwsElasticacheReservedCacheNodeOffering#duration}. This parameter is required.
         */
        public Builder duration(final java.lang.String duration) {
            this.config.duration(duration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#offering_type DataAwsElasticacheReservedCacheNodeOffering#offering_type}.
         * <p>
         * @return {@code this}
         * @param offeringType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#offering_type DataAwsElasticacheReservedCacheNodeOffering#offering_type}. This parameter is required.
         */
        public Builder offeringType(final java.lang.String offeringType) {
            this.config.offeringType(offeringType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#product_description DataAwsElasticacheReservedCacheNodeOffering#product_description}.
         * <p>
         * @return {@code this}
         * @param productDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#product_description DataAwsElasticacheReservedCacheNodeOffering#product_description}. This parameter is required.
         */
        public Builder productDescription(final java.lang.String productDescription) {
            this.config.productDescription(productDescription);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering}.
         */
        @Override
        public imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering build() {
            return new imports.aws.data_aws_elasticache_reserved_cache_node_offering.DataAwsElasticacheReservedCacheNodeOffering(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
