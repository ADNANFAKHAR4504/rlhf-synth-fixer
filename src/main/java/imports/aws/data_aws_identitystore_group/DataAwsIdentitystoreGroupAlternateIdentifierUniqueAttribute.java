package imports.aws.data_aws_identitystore_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute")
@software.amazon.jsii.Jsii.Proxy(DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute.Jsii$Proxy.class)
public interface DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#attribute_path DataAwsIdentitystoreGroup#attribute_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttributePath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#attribute_value DataAwsIdentitystoreGroup#attribute_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttributeValue();

    /**
     * @return a {@link Builder} of {@link DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute> {
        java.lang.String attributePath;
        java.lang.String attributeValue;

        /**
         * Sets the value of {@link DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute#getAttributePath}
         * @param attributePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#attribute_path DataAwsIdentitystoreGroup#attribute_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributePath(java.lang.String attributePath) {
            this.attributePath = attributePath;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute#getAttributeValue}
         * @param attributeValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#attribute_value DataAwsIdentitystoreGroup#attribute_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder attributeValue(java.lang.String attributeValue) {
            this.attributeValue = attributeValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute {
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
            struct.set("fqn", om.valueToTree("aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute.Jsii$Proxy that = (DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute.Jsii$Proxy) o;

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
