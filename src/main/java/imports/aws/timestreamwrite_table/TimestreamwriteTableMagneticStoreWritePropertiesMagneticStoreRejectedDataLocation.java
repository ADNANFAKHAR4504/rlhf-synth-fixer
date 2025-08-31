package imports.aws.timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.556Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamwriteTable.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation")
@software.amazon.jsii.Jsii.Proxy(TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation.Jsii$Proxy.class)
public interface TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#s3_configuration TimestreamwriteTable#s3_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration getS3Configuration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation> {
        imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration s3Configuration;

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#s3_configuration TimestreamwriteTable#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation {
        private final imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration s3Configuration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Configuration = builder.s3Configuration;
        }

        @Override
        public final imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocationS3Configuration getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Configuration() != null) {
                data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamwriteTable.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation.Jsii$Proxy that = (TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation.Jsii$Proxy) o;

            return this.s3Configuration != null ? this.s3Configuration.equals(that.s3Configuration) : that.s3Configuration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Configuration != null ? this.s3Configuration.hashCode() : 0;
            return result;
        }
    }
}
