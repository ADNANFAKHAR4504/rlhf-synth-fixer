package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersSnowflake")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceParametersSnowflake.Jsii$Proxy.class)
public interface QuicksightDataSourceParametersSnowflake extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#database QuicksightDataSource#database}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabase();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#host QuicksightDataSource#host}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHost();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#warehouse QuicksightDataSource#warehouse}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWarehouse();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceParametersSnowflake}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceParametersSnowflake}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceParametersSnowflake> {
        java.lang.String database;
        java.lang.String host;
        java.lang.String warehouse;

        /**
         * Sets the value of {@link QuicksightDataSourceParametersSnowflake#getDatabase}
         * @param database Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#database QuicksightDataSource#database}. This parameter is required.
         * @return {@code this}
         */
        public Builder database(java.lang.String database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceParametersSnowflake#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#host QuicksightDataSource#host}. This parameter is required.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceParametersSnowflake#getWarehouse}
         * @param warehouse Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#warehouse QuicksightDataSource#warehouse}. This parameter is required.
         * @return {@code this}
         */
        public Builder warehouse(java.lang.String warehouse) {
            this.warehouse = warehouse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceParametersSnowflake}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceParametersSnowflake build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceParametersSnowflake}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceParametersSnowflake {
        private final java.lang.String database;
        private final java.lang.String host;
        private final java.lang.String warehouse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.warehouse = software.amazon.jsii.Kernel.get(this, "warehouse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.database = java.util.Objects.requireNonNull(builder.database, "database is required");
            this.host = java.util.Objects.requireNonNull(builder.host, "host is required");
            this.warehouse = java.util.Objects.requireNonNull(builder.warehouse, "warehouse is required");
        }

        @Override
        public final java.lang.String getDatabase() {
            return this.database;
        }

        @Override
        public final java.lang.String getHost() {
            return this.host;
        }

        @Override
        public final java.lang.String getWarehouse() {
            return this.warehouse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("database", om.valueToTree(this.getDatabase()));
            data.set("host", om.valueToTree(this.getHost()));
            data.set("warehouse", om.valueToTree(this.getWarehouse()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceParametersSnowflake"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceParametersSnowflake.Jsii$Proxy that = (QuicksightDataSourceParametersSnowflake.Jsii$Proxy) o;

            if (!database.equals(that.database)) return false;
            if (!host.equals(that.host)) return false;
            return this.warehouse.equals(that.warehouse);
        }

        @Override
        public final int hashCode() {
            int result = this.database.hashCode();
            result = 31 * result + (this.host.hashCode());
            result = 31 * result + (this.warehouse.hashCode());
            return result;
        }
    }
}
