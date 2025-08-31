package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceDynamodbConfigDeltaSyncConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceDynamodbConfigDeltaSyncConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#delta_sync_table_name AppsyncDatasource#delta_sync_table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeltaSyncTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#base_table_ttl AppsyncDatasource#base_table_ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBaseTableTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#delta_sync_table_ttl AppsyncDatasource#delta_sync_table_ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDeltaSyncTableTtl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceDynamodbConfigDeltaSyncConfig> {
        java.lang.String deltaSyncTableName;
        java.lang.Number baseTableTtl;
        java.lang.Number deltaSyncTableTtl;

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig#getDeltaSyncTableName}
         * @param deltaSyncTableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#delta_sync_table_name AppsyncDatasource#delta_sync_table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder deltaSyncTableName(java.lang.String deltaSyncTableName) {
            this.deltaSyncTableName = deltaSyncTableName;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig#getBaseTableTtl}
         * @param baseTableTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#base_table_ttl AppsyncDatasource#base_table_ttl}.
         * @return {@code this}
         */
        public Builder baseTableTtl(java.lang.Number baseTableTtl) {
            this.baseTableTtl = baseTableTtl;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig#getDeltaSyncTableTtl}
         * @param deltaSyncTableTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#delta_sync_table_ttl AppsyncDatasource#delta_sync_table_ttl}.
         * @return {@code this}
         */
        public Builder deltaSyncTableTtl(java.lang.Number deltaSyncTableTtl) {
            this.deltaSyncTableTtl = deltaSyncTableTtl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceDynamodbConfigDeltaSyncConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceDynamodbConfigDeltaSyncConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceDynamodbConfigDeltaSyncConfig {
        private final java.lang.String deltaSyncTableName;
        private final java.lang.Number baseTableTtl;
        private final java.lang.Number deltaSyncTableTtl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deltaSyncTableName = software.amazon.jsii.Kernel.get(this, "deltaSyncTableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.baseTableTtl = software.amazon.jsii.Kernel.get(this, "baseTableTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.deltaSyncTableTtl = software.amazon.jsii.Kernel.get(this, "deltaSyncTableTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deltaSyncTableName = java.util.Objects.requireNonNull(builder.deltaSyncTableName, "deltaSyncTableName is required");
            this.baseTableTtl = builder.baseTableTtl;
            this.deltaSyncTableTtl = builder.deltaSyncTableTtl;
        }

        @Override
        public final java.lang.String getDeltaSyncTableName() {
            return this.deltaSyncTableName;
        }

        @Override
        public final java.lang.Number getBaseTableTtl() {
            return this.baseTableTtl;
        }

        @Override
        public final java.lang.Number getDeltaSyncTableTtl() {
            return this.deltaSyncTableTtl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deltaSyncTableName", om.valueToTree(this.getDeltaSyncTableName()));
            if (this.getBaseTableTtl() != null) {
                data.set("baseTableTtl", om.valueToTree(this.getBaseTableTtl()));
            }
            if (this.getDeltaSyncTableTtl() != null) {
                data.set("deltaSyncTableTtl", om.valueToTree(this.getDeltaSyncTableTtl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceDynamodbConfigDeltaSyncConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceDynamodbConfigDeltaSyncConfig.Jsii$Proxy that = (AppsyncDatasourceDynamodbConfigDeltaSyncConfig.Jsii$Proxy) o;

            if (!deltaSyncTableName.equals(that.deltaSyncTableName)) return false;
            if (this.baseTableTtl != null ? !this.baseTableTtl.equals(that.baseTableTtl) : that.baseTableTtl != null) return false;
            return this.deltaSyncTableTtl != null ? this.deltaSyncTableTtl.equals(that.deltaSyncTableTtl) : that.deltaSyncTableTtl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deltaSyncTableName.hashCode();
            result = 31 * result + (this.baseTableTtl != null ? this.baseTableTtl.hashCode() : 0);
            result = 31 * result + (this.deltaSyncTableTtl != null ? this.deltaSyncTableTtl.hashCode() : 0);
            return result;
        }
    }
}
