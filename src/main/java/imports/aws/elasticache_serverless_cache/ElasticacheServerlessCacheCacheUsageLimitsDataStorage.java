package imports.aws.elasticache_serverless_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.171Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheServerlessCache.ElasticacheServerlessCacheCacheUsageLimitsDataStorage")
@software.amazon.jsii.Jsii.Proxy(ElasticacheServerlessCacheCacheUsageLimitsDataStorage.Jsii$Proxy.class)
public interface ElasticacheServerlessCacheCacheUsageLimitsDataStorage extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#unit ElasticacheServerlessCache#unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUnit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#maximum ElasticacheServerlessCache#maximum}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximum() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#minimum ElasticacheServerlessCache#minimum}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimum() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheServerlessCacheCacheUsageLimitsDataStorage> {
        java.lang.String unit;
        java.lang.Number maximum;
        java.lang.Number minimum;

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#unit ElasticacheServerlessCache#unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage#getMaximum}
         * @param maximum Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#maximum ElasticacheServerlessCache#maximum}.
         * @return {@code this}
         */
        public Builder maximum(java.lang.Number maximum) {
            this.maximum = maximum;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage#getMinimum}
         * @param minimum Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#minimum ElasticacheServerlessCache#minimum}.
         * @return {@code this}
         */
        public Builder minimum(java.lang.Number minimum) {
            this.minimum = minimum;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheServerlessCacheCacheUsageLimitsDataStorage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheServerlessCacheCacheUsageLimitsDataStorage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheServerlessCacheCacheUsageLimitsDataStorage {
        private final java.lang.String unit;
        private final java.lang.Number maximum;
        private final java.lang.Number minimum;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximum = software.amazon.jsii.Kernel.get(this, "maximum", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimum = software.amazon.jsii.Kernel.get(this, "minimum", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.unit = java.util.Objects.requireNonNull(builder.unit, "unit is required");
            this.maximum = builder.maximum;
            this.minimum = builder.minimum;
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        public final java.lang.Number getMaximum() {
            return this.maximum;
        }

        @Override
        public final java.lang.Number getMinimum() {
            return this.minimum;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("unit", om.valueToTree(this.getUnit()));
            if (this.getMaximum() != null) {
                data.set("maximum", om.valueToTree(this.getMaximum()));
            }
            if (this.getMinimum() != null) {
                data.set("minimum", om.valueToTree(this.getMinimum()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticacheServerlessCache.ElasticacheServerlessCacheCacheUsageLimitsDataStorage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheServerlessCacheCacheUsageLimitsDataStorage.Jsii$Proxy that = (ElasticacheServerlessCacheCacheUsageLimitsDataStorage.Jsii$Proxy) o;

            if (!unit.equals(that.unit)) return false;
            if (this.maximum != null ? !this.maximum.equals(that.maximum) : that.maximum != null) return false;
            return this.minimum != null ? this.minimum.equals(that.minimum) : that.minimum == null;
        }

        @Override
        public final int hashCode() {
            int result = this.unit.hashCode();
            result = 31 * result + (this.maximum != null ? this.maximum.hashCode() : 0);
            result = 31 * result + (this.minimum != null ? this.minimum.hashCode() : 0);
            return result;
        }
    }
}
