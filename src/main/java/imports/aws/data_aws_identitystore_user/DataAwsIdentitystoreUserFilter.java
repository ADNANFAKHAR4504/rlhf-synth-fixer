package imports.aws.data_aws_identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.682Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUserFilter")
@software.amazon.jsii.Jsii.Proxy(DataAwsIdentitystoreUserFilter.Jsii$Proxy.class)
public interface DataAwsIdentitystoreUserFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#attribute_path DataAwsIdentitystoreUser#attribute_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttributePath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#attribute_value DataAwsIdentitystoreUser#attribute_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttributeValue();

    /**
     * @return a {@link Builder} of {@link DataAwsIdentitystoreUserFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIdentitystoreUserFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIdentitystoreUserFilter> {
        java.lang.String attributePath;
        java.lang.String attributeValue;

        /**
         * Sets the value of {@link DataAwsIdentitystoreUserFilter#getAttributePath}
         * @param attributePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#attribute_path DataAwsIdentitystoreUser#attribute_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributePath(java.lang.String attributePath) {
            this.attributePath = attributePath;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIdentitystoreUserFilter#getAttributeValue}
         * @param attributeValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#attribute_value DataAwsIdentitystoreUser#attribute_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributeValue(java.lang.String attributeValue) {
            this.attributeValue = attributeValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIdentitystoreUserFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIdentitystoreUserFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIdentitystoreUserFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIdentitystoreUserFilter {
        private final java.lang.String attributePath;
        private final java.lang.String attributeValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attributePath = software.amazon.jsii.Kernel.get(this, "attributePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attributeValue = software.amazon.jsii.Kernel.get(this, "attributeValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attributePath = java.util.Objects.requireNonNull(builder.attributePath, "attributePath is required");
            this.attributeValue = java.util.Objects.requireNonNull(builder.attributeValue, "attributeValue is required");
        }

        @Override
        public final java.lang.String getAttributePath() {
            return this.attributePath;
        }

        @Override
        public final java.lang.String getAttributeValue() {
            return this.attributeValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("attributePath", om.valueToTree(this.getAttributePath()));
            data.set("attributeValue", om.valueToTree(this.getAttributeValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUserFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIdentitystoreUserFilter.Jsii$Proxy that = (DataAwsIdentitystoreUserFilter.Jsii$Proxy) o;

            if (!attributePath.equals(that.attributePath)) return false;
            return this.attributeValue.equals(that.attributeValue);
        }

        @Override
        public final int hashCode() {
            int result = this.attributePath.hashCode();
            result = 31 * result + (this.attributeValue.hashCode());
            return result;
        }
    }
}
