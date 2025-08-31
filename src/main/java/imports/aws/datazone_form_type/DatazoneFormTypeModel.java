package imports.aws.datazone_form_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.958Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneFormType.DatazoneFormTypeModel")
@software.amazon.jsii.Jsii.Proxy(DatazoneFormTypeModel.Jsii$Proxy.class)
public interface DatazoneFormTypeModel extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_form_type#smithy DatazoneFormType#smithy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSmithy();

    /**
     * @return a {@link Builder} of {@link DatazoneFormTypeModel}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneFormTypeModel}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneFormTypeModel> {
        java.lang.String smithy;

        /**
         * Sets the value of {@link DatazoneFormTypeModel#getSmithy}
         * @param smithy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_form_type#smithy DatazoneFormType#smithy}. This parameter is required.
         * @return {@code this}
         */
        public Builder smithy(java.lang.String smithy) {
            this.smithy = smithy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatazoneFormTypeModel}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneFormTypeModel build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneFormTypeModel}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneFormTypeModel {
        private final java.lang.String smithy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.smithy = software.amazon.jsii.Kernel.get(this, "smithy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.smithy = java.util.Objects.requireNonNull(builder.smithy, "smithy is required");
        }

        @Override
        public final java.lang.String getSmithy() {
            return this.smithy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("smithy", om.valueToTree(this.getSmithy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datazoneFormType.DatazoneFormTypeModel"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneFormTypeModel.Jsii$Proxy that = (DatazoneFormTypeModel.Jsii$Proxy) o;

            return this.smithy.equals(that.smithy);
        }

        @Override
        public final int hashCode() {
            int result = this.smithy.hashCode();
            return result;
        }
    }
}
