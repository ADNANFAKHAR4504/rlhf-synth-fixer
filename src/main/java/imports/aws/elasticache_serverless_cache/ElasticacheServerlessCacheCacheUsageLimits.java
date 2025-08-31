package imports.aws.elasticache_serverless_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.171Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheServerlessCache.ElasticacheServerlessCacheCacheUsageLimits")
@software.amazon.jsii.Jsii.Proxy(ElasticacheServerlessCacheCacheUsageLimits.Jsii$Proxy.class)
public interface ElasticacheServerlessCacheCacheUsageLimits extends software.amazon.jsii.JsiiSerializable {

    /**
     * data_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#data_storage ElasticacheServerlessCache#data_storage}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataStorage() {
        return null;
    }

    /**
     * ecpu_per_second block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#ecpu_per_second ElasticacheServerlessCache#ecpu_per_second}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEcpuPerSecond() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheServerlessCacheCacheUsageLimits}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheServerlessCacheCacheUsageLimits}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheServerlessCacheCacheUsageLimits> {
        java.lang.Object dataStorage;
        java.lang.Object ecpuPerSecond;

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimits#getDataStorage}
         * @param dataStorage data_storage block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#data_storage ElasticacheServerlessCache#data_storage}
         * @return {@code this}
         */
        public Builder dataStorage(com.hashicorp.cdktf.IResolvable dataStorage) {
            this.dataStorage = dataStorage;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimits#getDataStorage}
         * @param dataStorage data_storage block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#data_storage ElasticacheServerlessCache#data_storage}
         * @return {@code this}
         */
        public Builder dataStorage(java.util.List<? extends imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimitsDataStorage> dataStorage) {
            this.dataStorage = dataStorage;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimits#getEcpuPerSecond}
         * @param ecpuPerSecond ecpu_per_second block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#ecpu_per_second ElasticacheServerlessCache#ecpu_per_second}
         * @return {@code this}
         */
        public Builder ecpuPerSecond(com.hashicorp.cdktf.IResolvable ecpuPerSecond) {
            this.ecpuPerSecond = ecpuPerSecond;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheServerlessCacheCacheUsageLimits#getEcpuPerSecond}
         * @param ecpuPerSecond ecpu_per_second block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_serverless_cache#ecpu_per_second ElasticacheServerlessCache#ecpu_per_second}
         * @return {@code this}
         */
        public Builder ecpuPerSecond(java.util.List<? extends imports.aws.elasticache_serverless_cache.ElasticacheServerlessCacheCacheUsageLimitsEcpuPerSecond> ecpuPerSecond) {
            this.ecpuPerSecond = ecpuPerSecond;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticacheServerlessCacheCacheUsageLimits}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheServerlessCacheCacheUsageLimits build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheServerlessCacheCacheUsageLimits}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheServerlessCacheCacheUsageLimits {
        private final java.lang.Object dataStorage;
        private final java.lang.Object ecpuPerSecond;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataStorage = software.amazon.jsii.Kernel.get(this, "dataStorage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ecpuPerSecond = software.amazon.jsii.Kernel.get(this, "ecpuPerSecond", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataStorage = builder.dataStorage;
            this.ecpuPerSecond = builder.ecpuPerSecond;
        }

        @Override
        public final java.lang.Object getDataStorage() {
            return this.dataStorage;
        }

        @Override
        public final java.lang.Object getEcpuPerSecond() {
            return this.ecpuPerSecond;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataStorage() != null) {
                data.set("dataStorage", om.valueToTree(this.getDataStorage()));
            }
            if (this.getEcpuPerSecond() != null) {
                data.set("ecpuPerSecond", om.valueToTree(this.getEcpuPerSecond()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticacheServerlessCache.ElasticacheServerlessCacheCacheUsageLimits"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheServerlessCacheCacheUsageLimits.Jsii$Proxy that = (ElasticacheServerlessCacheCacheUsageLimits.Jsii$Proxy) o;

            if (this.dataStorage != null ? !this.dataStorage.equals(that.dataStorage) : that.dataStorage != null) return false;
            return this.ecpuPerSecond != null ? this.ecpuPerSecond.equals(that.ecpuPerSecond) : that.ecpuPerSecond == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataStorage != null ? this.dataStorage.hashCode() : 0;
            result = 31 * result + (this.ecpuPerSecond != null ? this.ecpuPerSecond.hashCode() : 0);
            return result;
        }
    }
}
