package imports.aws.data_aws_timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.900Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsTimestreamwriteTable.DataAwsTimestreamwriteTableMagneticStoreWriteProperties")
@software.amazon.jsii.Jsii.Proxy(DataAwsTimestreamwriteTableMagneticStoreWriteProperties.Jsii$Proxy.class)
public interface DataAwsTimestreamwriteTableMagneticStoreWriteProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * @return a {@link Builder} of {@link DataAwsTimestreamwriteTableMagneticStoreWriteProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsTimestreamwriteTableMagneticStoreWriteProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsTimestreamwriteTableMagneticStoreWriteProperties> {

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsTimestreamwriteTableMagneticStoreWriteProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsTimestreamwriteTableMagneticStoreWriteProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsTimestreamwriteTableMagneticStoreWriteProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsTimestreamwriteTableMagneticStoreWriteProperties {

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();


            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsTimestreamwriteTable.DataAwsTimestreamwriteTableMagneticStoreWriteProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }
    }
}
