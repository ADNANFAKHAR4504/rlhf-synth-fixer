package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.112Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceInputColumns")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetPhysicalTableMapS3SourceInputColumns.Jsii$Proxy.class)
public interface QuicksightDataSetPhysicalTableMapS3SourceInputColumns extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetPhysicalTableMapS3SourceInputColumns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetPhysicalTableMapS3SourceInputColumns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetPhysicalTableMapS3SourceInputColumns> {
        java.lang.String name;
        java.lang.String type;

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceInputColumns#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetPhysicalTableMapS3SourceInputColumns#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#type QuicksightDataSet#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetPhysicalTableMapS3SourceInputColumns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetPhysicalTableMapS3SourceInputColumns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetPhysicalTableMapS3SourceInputColumns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetPhysicalTableMapS3SourceInputColumns {
        private final java.lang.String name;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetPhysicalTableMapS3SourceInputColumns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetPhysicalTableMapS3SourceInputColumns.Jsii$Proxy that = (QuicksightDataSetPhysicalTableMapS3SourceInputColumns.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
