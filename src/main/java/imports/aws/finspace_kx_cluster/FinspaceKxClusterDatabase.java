package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterDatabase")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterDatabase.Jsii$Proxy.class)
public interface FinspaceKxClusterDatabase extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database_name FinspaceKxCluster#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * cache_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_configurations FinspaceKxCluster#cache_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCacheConfigurations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#changeset_id FinspaceKxCluster#changeset_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getChangesetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#dataview_name FinspaceKxCluster#dataview_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataviewName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterDatabase}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterDatabase}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterDatabase> {
        java.lang.String databaseName;
        java.lang.Object cacheConfigurations;
        java.lang.String changesetId;
        java.lang.String dataviewName;

        /**
         * Sets the value of {@link FinspaceKxClusterDatabase#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database_name FinspaceKxCluster#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterDatabase#getCacheConfigurations}
         * @param cacheConfigurations cache_configurations block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_configurations FinspaceKxCluster#cache_configurations}
         * @return {@code this}
         */
        public Builder cacheConfigurations(com.hashicorp.cdktf.IResolvable cacheConfigurations) {
            this.cacheConfigurations = cacheConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterDatabase#getCacheConfigurations}
         * @param cacheConfigurations cache_configurations block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_configurations FinspaceKxCluster#cache_configurations}
         * @return {@code this}
         */
        public Builder cacheConfigurations(java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabaseCacheConfigurations> cacheConfigurations) {
            this.cacheConfigurations = cacheConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterDatabase#getChangesetId}
         * @param changesetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#changeset_id FinspaceKxCluster#changeset_id}.
         * @return {@code this}
         */
        public Builder changesetId(java.lang.String changesetId) {
            this.changesetId = changesetId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterDatabase#getDataviewName}
         * @param dataviewName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#dataview_name FinspaceKxCluster#dataview_name}.
         * @return {@code this}
         */
        public Builder dataviewName(java.lang.String dataviewName) {
            this.dataviewName = dataviewName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterDatabase}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterDatabase build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterDatabase}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterDatabase {
        private final java.lang.String databaseName;
        private final java.lang.Object cacheConfigurations;
        private final java.lang.String changesetId;
        private final java.lang.String dataviewName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheConfigurations = software.amazon.jsii.Kernel.get(this, "cacheConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.changesetId = software.amazon.jsii.Kernel.get(this, "changesetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataviewName = software.amazon.jsii.Kernel.get(this, "dataviewName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.cacheConfigurations = builder.cacheConfigurations;
            this.changesetId = builder.changesetId;
            this.dataviewName = builder.dataviewName;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.Object getCacheConfigurations() {
            return this.cacheConfigurations;
        }

        @Override
        public final java.lang.String getChangesetId() {
            return this.changesetId;
        }

        @Override
        public final java.lang.String getDataviewName() {
            return this.dataviewName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            if (this.getCacheConfigurations() != null) {
                data.set("cacheConfigurations", om.valueToTree(this.getCacheConfigurations()));
            }
            if (this.getChangesetId() != null) {
                data.set("changesetId", om.valueToTree(this.getChangesetId()));
            }
            if (this.getDataviewName() != null) {
                data.set("dataviewName", om.valueToTree(this.getDataviewName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterDatabase"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterDatabase.Jsii$Proxy that = (FinspaceKxClusterDatabase.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (this.cacheConfigurations != null ? !this.cacheConfigurations.equals(that.cacheConfigurations) : that.cacheConfigurations != null) return false;
            if (this.changesetId != null ? !this.changesetId.equals(that.changesetId) : that.changesetId != null) return false;
            return this.dataviewName != null ? this.dataviewName.equals(that.dataviewName) : that.dataviewName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.cacheConfigurations != null ? this.cacheConfigurations.hashCode() : 0);
            result = 31 * result + (this.changesetId != null ? this.changesetId.hashCode() : 0);
            result = 31 * result + (this.dataviewName != null ? this.dataviewName.hashCode() : 0);
            return result;
        }
    }
}
