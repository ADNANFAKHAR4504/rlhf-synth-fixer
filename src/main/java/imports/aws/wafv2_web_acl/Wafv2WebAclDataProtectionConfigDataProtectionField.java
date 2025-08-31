package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.671Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionField")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclDataProtectionConfigDataProtectionField.Jsii$Proxy.class)
public interface Wafv2WebAclDataProtectionConfigDataProtectionField extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_type Wafv2WebAcl#field_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFieldType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_keys Wafv2WebAcl#field_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFieldKeys() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclDataProtectionConfigDataProtectionField}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclDataProtectionConfigDataProtectionField}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclDataProtectionConfigDataProtectionField> {
        java.lang.String fieldType;
        java.util.List<java.lang.String> fieldKeys;

        /**
         * Sets the value of {@link Wafv2WebAclDataProtectionConfigDataProtectionField#getFieldType}
         * @param fieldType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_type Wafv2WebAcl#field_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder fieldType(java.lang.String fieldType) {
            this.fieldType = fieldType;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclDataProtectionConfigDataProtectionField#getFieldKeys}
         * @param fieldKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#field_keys Wafv2WebAcl#field_keys}.
         * @return {@code this}
         */
        public Builder fieldKeys(java.util.List<java.lang.String> fieldKeys) {
            this.fieldKeys = fieldKeys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclDataProtectionConfigDataProtectionField}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclDataProtectionConfigDataProtectionField build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclDataProtectionConfigDataProtectionField}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclDataProtectionConfigDataProtectionField {
        private final java.lang.String fieldType;
        private final java.util.List<java.lang.String> fieldKeys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fieldType = software.amazon.jsii.Kernel.get(this, "fieldType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldKeys = software.amazon.jsii.Kernel.get(this, "fieldKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fieldType = java.util.Objects.requireNonNull(builder.fieldType, "fieldType is required");
            this.fieldKeys = builder.fieldKeys;
        }

        @Override
        public final java.lang.String getFieldType() {
            return this.fieldType;
        }

        @Override
        public final java.util.List<java.lang.String> getFieldKeys() {
            return this.fieldKeys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fieldType", om.valueToTree(this.getFieldType()));
            if (this.getFieldKeys() != null) {
                data.set("fieldKeys", om.valueToTree(this.getFieldKeys()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigDataProtectionField"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclDataProtectionConfigDataProtectionField.Jsii$Proxy that = (Wafv2WebAclDataProtectionConfigDataProtectionField.Jsii$Proxy) o;

            if (!fieldType.equals(that.fieldType)) return false;
            return this.fieldKeys != null ? this.fieldKeys.equals(that.fieldKeys) : that.fieldKeys == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fieldType.hashCode();
            result = 31 * result + (this.fieldKeys != null ? this.fieldKeys.hashCode() : 0);
            return result;
        }
    }
}
