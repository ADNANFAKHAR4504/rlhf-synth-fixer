package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterDatabaseCacheConfigurations")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterDatabaseCacheConfigurations.Jsii$Proxy.class)
public interface FinspaceKxClusterDatabaseCacheConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_type FinspaceKxCluster#cache_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCacheType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#db_paths FinspaceKxCluster#db_paths}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDbPaths() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterDatabaseCacheConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterDatabaseCacheConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterDatabaseCacheConfigurations> {
        java.lang.String cacheType;
        java.util.List<java.lang.String> dbPaths;

        /**
         * Sets the value of {@link FinspaceKxClusterDatabaseCacheConfigurations#getCacheType}
         * @param cacheType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_type FinspaceKxCluster#cache_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder cacheType(java.lang.String cacheType) {
            this.cacheType = cacheType;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterDatabaseCacheConfigurations#getDbPaths}
         * @param dbPaths Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#db_paths FinspaceKxCluster#db_paths}.
         * @return {@code this}
         */
        public Builder dbPaths(java.util.List<java.lang.String> dbPaths) {
            this.dbPaths = dbPaths;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterDatabaseCacheConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterDatabaseCacheConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterDatabaseCacheConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterDatabaseCacheConfigurations {
        private final java.lang.String cacheType;
        private final java.util.List<java.lang.String> dbPaths;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cacheType = software.amazon.jsii.Kernel.get(this, "cacheType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dbPaths = software.amazon.jsii.Kernel.get(this, "dbPaths", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cacheType = java.util.Objects.requireNonNull(builder.cacheType, "cacheType is required");
            this.dbPaths = builder.dbPaths;
        }

        @Override
        public final java.lang.String getCacheType() {
            return this.cacheType;
        }

        @Override
        public final java.util.List<java.lang.String> getDbPaths() {
            return this.dbPaths;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cacheType", om.valueToTree(this.getCacheType()));
            if (this.getDbPaths() != null) {
                data.set("dbPaths", om.valueToTree(this.getDbPaths()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterDatabaseCacheConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterDatabaseCacheConfigurations.Jsii$Proxy that = (FinspaceKxClusterDatabaseCacheConfigurations.Jsii$Proxy) o;

            if (!cacheType.equals(that.cacheType)) return false;
            return this.dbPaths != null ? this.dbPaths.equals(that.dbPaths) : that.dbPaths == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cacheType.hashCode();
            result = 31 * result + (this.dbPaths != null ? this.dbPaths.hashCode() : 0);
            return result;
        }
    }
}
