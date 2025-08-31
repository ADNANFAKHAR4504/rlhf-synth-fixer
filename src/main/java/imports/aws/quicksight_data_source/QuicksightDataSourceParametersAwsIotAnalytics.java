package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.115Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersAwsIotAnalytics")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceParametersAwsIotAnalytics.Jsii$Proxy.class)
public interface QuicksightDataSourceParametersAwsIotAnalytics extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#data_set_name QuicksightDataSource#data_set_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSetName();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceParametersAwsIotAnalytics}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceParametersAwsIotAnalytics}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceParametersAwsIotAnalytics> {
        java.lang.String dataSetName;

        /**
         * Sets the value of {@link QuicksightDataSourceParametersAwsIotAnalytics#getDataSetName}
         * @param dataSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#data_set_name QuicksightDataSource#data_set_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSetName(java.lang.String dataSetName) {
            this.dataSetName = dataSetName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceParametersAwsIotAnalytics}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceParametersAwsIotAnalytics build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceParametersAwsIotAnalytics}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceParametersAwsIotAnalytics {
        private final java.lang.String dataSetName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSetName = software.amazon.jsii.Kernel.get(this, "dataSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSetName = java.util.Objects.requireNonNull(builder.dataSetName, "dataSetName is required");
        }

        @Override
        public final java.lang.String getDataSetName() {
            return this.dataSetName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataSetName", om.valueToTree(this.getDataSetName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceParametersAwsIotAnalytics"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceParametersAwsIotAnalytics.Jsii$Proxy that = (QuicksightDataSourceParametersAwsIotAnalytics.Jsii$Proxy) o;

            return this.dataSetName.equals(that.dataSetName);
        }

        @Override
        public final int hashCode() {
            int result = this.dataSetName.hashCode();
            return result;
        }
    }
}
