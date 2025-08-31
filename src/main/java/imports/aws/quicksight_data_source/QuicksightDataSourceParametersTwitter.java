package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersTwitter")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceParametersTwitter.Jsii$Proxy.class)
public interface QuicksightDataSourceParametersTwitter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#max_rows QuicksightDataSource#max_rows}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxRows();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#query QuicksightDataSource#query}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQuery();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceParametersTwitter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceParametersTwitter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceParametersTwitter> {
        java.lang.Number maxRows;
        java.lang.String query;

        /**
         * Sets the value of {@link QuicksightDataSourceParametersTwitter#getMaxRows}
         * @param maxRows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#max_rows QuicksightDataSource#max_rows}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxRows(java.lang.Number maxRows) {
            this.maxRows = maxRows;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceParametersTwitter#getQuery}
         * @param query Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#query QuicksightDataSource#query}. This parameter is required.
         * @return {@code this}
         */
        public Builder query(java.lang.String query) {
            this.query = query;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceParametersTwitter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceParametersTwitter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceParametersTwitter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceParametersTwitter {
        private final java.lang.Number maxRows;
        private final java.lang.String query;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxRows = software.amazon.jsii.Kernel.get(this, "maxRows", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.query = software.amazon.jsii.Kernel.get(this, "query", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxRows = java.util.Objects.requireNonNull(builder.maxRows, "maxRows is required");
            this.query = java.util.Objects.requireNonNull(builder.query, "query is required");
        }

        @Override
        public final java.lang.Number getMaxRows() {
            return this.maxRows;
        }

        @Override
        public final java.lang.String getQuery() {
            return this.query;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxRows", om.valueToTree(this.getMaxRows()));
            data.set("query", om.valueToTree(this.getQuery()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceParametersTwitter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceParametersTwitter.Jsii$Proxy that = (QuicksightDataSourceParametersTwitter.Jsii$Proxy) o;

            if (!maxRows.equals(that.maxRows)) return false;
            return this.query.equals(that.query);
        }

        @Override
        public final int hashCode() {
            int result = this.maxRows.hashCode();
            result = 31 * result + (this.query.hashCode());
            return result;
        }
    }
}
