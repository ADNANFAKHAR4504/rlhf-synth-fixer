package imports.aws.timestreamwrite_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.556Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamwriteTable.TimestreamwriteTableMagneticStoreWriteProperties")
@software.amazon.jsii.Jsii.Proxy(TimestreamwriteTableMagneticStoreWriteProperties.Jsii$Proxy.class)
public interface TimestreamwriteTableMagneticStoreWriteProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#enable_magnetic_store_writes TimestreamwriteTable#enable_magnetic_store_writes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableMagneticStoreWrites() {
        return null;
    }

    /**
     * magnetic_store_rejected_data_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#magnetic_store_rejected_data_location TimestreamwriteTable#magnetic_store_rejected_data_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation getMagneticStoreRejectedDataLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamwriteTableMagneticStoreWriteProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamwriteTableMagneticStoreWriteProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamwriteTableMagneticStoreWriteProperties> {
        java.lang.Object enableMagneticStoreWrites;
        imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation magneticStoreRejectedDataLocation;

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWriteProperties#getEnableMagneticStoreWrites}
         * @param enableMagneticStoreWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#enable_magnetic_store_writes TimestreamwriteTable#enable_magnetic_store_writes}.
         * @return {@code this}
         */
        public Builder enableMagneticStoreWrites(java.lang.Boolean enableMagneticStoreWrites) {
            this.enableMagneticStoreWrites = enableMagneticStoreWrites;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWriteProperties#getEnableMagneticStoreWrites}
         * @param enableMagneticStoreWrites Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#enable_magnetic_store_writes TimestreamwriteTable#enable_magnetic_store_writes}.
         * @return {@code this}
         */
        public Builder enableMagneticStoreWrites(com.hashicorp.cdktf.IResolvable enableMagneticStoreWrites) {
            this.enableMagneticStoreWrites = enableMagneticStoreWrites;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamwriteTableMagneticStoreWriteProperties#getMagneticStoreRejectedDataLocation}
         * @param magneticStoreRejectedDataLocation magnetic_store_rejected_data_location block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamwrite_table#magnetic_store_rejected_data_location TimestreamwriteTable#magnetic_store_rejected_data_location}
         * @return {@code this}
         */
        public Builder magneticStoreRejectedDataLocation(imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation magneticStoreRejectedDataLocation) {
            this.magneticStoreRejectedDataLocation = magneticStoreRejectedDataLocation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamwriteTableMagneticStoreWriteProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamwriteTableMagneticStoreWriteProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamwriteTableMagneticStoreWriteProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamwriteTableMagneticStoreWriteProperties {
        private final java.lang.Object enableMagneticStoreWrites;
        private final imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation magneticStoreRejectedDataLocation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableMagneticStoreWrites = software.amazon.jsii.Kernel.get(this, "enableMagneticStoreWrites", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.magneticStoreRejectedDataLocation = software.amazon.jsii.Kernel.get(this, "magneticStoreRejectedDataLocation", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableMagneticStoreWrites = builder.enableMagneticStoreWrites;
            this.magneticStoreRejectedDataLocation = builder.magneticStoreRejectedDataLocation;
        }

        @Override
        public final java.lang.Object getEnableMagneticStoreWrites() {
            return this.enableMagneticStoreWrites;
        }

        @Override
        public final imports.aws.timestreamwrite_table.TimestreamwriteTableMagneticStoreWritePropertiesMagneticStoreRejectedDataLocation getMagneticStoreRejectedDataLocation() {
            return this.magneticStoreRejectedDataLocation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableMagneticStoreWrites() != null) {
                data.set("enableMagneticStoreWrites", om.valueToTree(this.getEnableMagneticStoreWrites()));
            }
            if (this.getMagneticStoreRejectedDataLocation() != null) {
                data.set("magneticStoreRejectedDataLocation", om.valueToTree(this.getMagneticStoreRejectedDataLocation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamwriteTable.TimestreamwriteTableMagneticStoreWriteProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamwriteTableMagneticStoreWriteProperties.Jsii$Proxy that = (TimestreamwriteTableMagneticStoreWriteProperties.Jsii$Proxy) o;

            if (this.enableMagneticStoreWrites != null ? !this.enableMagneticStoreWrites.equals(that.enableMagneticStoreWrites) : that.enableMagneticStoreWrites != null) return false;
            return this.magneticStoreRejectedDataLocation != null ? this.magneticStoreRejectedDataLocation.equals(that.magneticStoreRejectedDataLocation) : that.magneticStoreRejectedDataLocation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableMagneticStoreWrites != null ? this.enableMagneticStoreWrites.hashCode() : 0;
            result = 31 * result + (this.magneticStoreRejectedDataLocation != null ? this.magneticStoreRejectedDataLocation.hashCode() : 0);
            return result;
        }
    }
}
