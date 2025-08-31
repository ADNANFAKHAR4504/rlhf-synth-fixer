package imports.aws.data_aws_elasticache_reserved_cache_node_offering;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.647Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsElasticacheReservedCacheNodeOffering.DataAwsElasticacheReservedCacheNodeOfferingConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsElasticacheReservedCacheNodeOfferingConfig.Jsii$Proxy.class)
public interface DataAwsElasticacheReservedCacheNodeOfferingConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#cache_node_type DataAwsElasticacheReservedCacheNodeOffering#cache_node_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCacheNodeType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#duration DataAwsElasticacheReservedCacheNodeOffering#duration}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#offering_type DataAwsElasticacheReservedCacheNodeOffering#offering_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOfferingType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#product_description DataAwsElasticacheReservedCacheNodeOffering#product_description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProductDescription();

    /**
     * @return a {@link Builder} of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsElasticacheReservedCacheNodeOfferingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsElasticacheReservedCacheNodeOfferingConfig> {
        java.lang.String cacheNodeType;
        java.lang.String duration;
        java.lang.String offeringType;
        java.lang.String productDescription;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getCacheNodeType}
         * @param cacheNodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#cache_node_type DataAwsElasticacheReservedCacheNodeOffering#cache_node_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder cacheNodeType(java.lang.String cacheNodeType) {
            this.cacheNodeType = cacheNodeType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getDuration}
         * @param duration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#duration DataAwsElasticacheReservedCacheNodeOffering#duration}. This parameter is required.
         * @return {@code this}
         */
        public Builder duration(java.lang.String duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getOfferingType}
         * @param offeringType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#offering_type DataAwsElasticacheReservedCacheNodeOffering#offering_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder offeringType(java.lang.String offeringType) {
            this.offeringType = offeringType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getProductDescription}
         * @param productDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_reserved_cache_node_offering#product_description DataAwsElasticacheReservedCacheNodeOffering#product_description}. This parameter is required.
         * @return {@code this}
         */
        public Builder productDescription(java.lang.String productDescription) {
            this.productDescription = productDescription;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsElasticacheReservedCacheNodeOfferingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsElasticacheReservedCacheNodeOfferingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsElasticacheReservedCacheNodeOfferingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsElasticacheReservedCacheNodeOfferingConfig {
        private final java.lang.String cacheNodeType;
        private final java.lang.String duration;
        private final java.lang.String offeringType;
        private final java.lang.String productDescription;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cacheNodeType = software.amazon.jsii.Kernel.get(this, "cacheNodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.offeringType = software.amazon.jsii.Kernel.get(this, "offeringType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.productDescription = software.amazon.jsii.Kernel.get(this, "productDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cacheNodeType = java.util.Objects.requireNonNull(builder.cacheNodeType, "cacheNodeType is required");
            this.duration = java.util.Objects.requireNonNull(builder.duration, "duration is required");
            this.offeringType = java.util.Objects.requireNonNull(builder.offeringType, "offeringType is required");
            this.productDescription = java.util.Objects.requireNonNull(builder.productDescription, "productDescription is required");
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCacheNodeType() {
            return this.cacheNodeType;
        }

        @Override
        public final java.lang.String getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.String getOfferingType() {
            return this.offeringType;
        }

        @Override
        public final java.lang.String getProductDescription() {
            return this.productDescription;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cacheNodeType", om.valueToTree(this.getCacheNodeType()));
            data.set("duration", om.valueToTree(this.getDuration()));
            data.set("offeringType", om.valueToTree(this.getOfferingType()));
            data.set("productDescription", om.valueToTree(this.getProductDescription()));
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsElasticacheReservedCacheNodeOffering.DataAwsElasticacheReservedCacheNodeOfferingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsElasticacheReservedCacheNodeOfferingConfig.Jsii$Proxy that = (DataAwsElasticacheReservedCacheNodeOfferingConfig.Jsii$Proxy) o;

            if (!cacheNodeType.equals(that.cacheNodeType)) return false;
            if (!duration.equals(that.duration)) return false;
            if (!offeringType.equals(that.offeringType)) return false;
            if (!productDescription.equals(that.productDescription)) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cacheNodeType.hashCode();
            result = 31 * result + (this.duration.hashCode());
            result = 31 * result + (this.offeringType.hashCode());
            result = 31 * result + (this.productDescription.hashCode());
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
