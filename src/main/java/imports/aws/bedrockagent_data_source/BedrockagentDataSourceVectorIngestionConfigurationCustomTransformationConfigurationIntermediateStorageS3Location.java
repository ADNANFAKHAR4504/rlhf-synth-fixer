package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.168Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#uri BedrockagentDataSource#uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUri();

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location> {
        java.lang.String uri;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#uri BedrockagentDataSource#uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location {
        private final java.lang.String uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.uri = java.util.Objects.requireNonNull(builder.uri, "uri is required");
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("uri", om.valueToTree(this.getUri()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationIntermediateStorageS3Location.Jsii$Proxy) o;

            return this.uri.equals(that.uri);
        }

        @Override
        public final int hashCode() {
            int result = this.uri.hashCode();
            return result;
        }
    }
}
