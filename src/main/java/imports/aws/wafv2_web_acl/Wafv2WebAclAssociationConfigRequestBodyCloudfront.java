package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyCloudfront")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclAssociationConfigRequestBodyCloudfront.Jsii$Proxy.class)
public interface Wafv2WebAclAssociationConfigRequestBodyCloudfront extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultSizeInspectionLimit();

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclAssociationConfigRequestBodyCloudfront}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclAssociationConfigRequestBodyCloudfront}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclAssociationConfigRequestBodyCloudfront> {
        java.lang.String defaultSizeInspectionLimit;

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfigRequestBodyCloudfront#getDefaultSizeInspectionLimit}
         * @param defaultSizeInspectionLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#default_size_inspection_limit Wafv2WebAcl#default_size_inspection_limit}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultSizeInspectionLimit(java.lang.String defaultSizeInspectionLimit) {
            this.defaultSizeInspectionLimit = defaultSizeInspectionLimit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclAssociationConfigRequestBodyCloudfront}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclAssociationConfigRequestBodyCloudfront build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclAssociationConfigRequestBodyCloudfront}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclAssociationConfigRequestBodyCloudfront {
        private final java.lang.String defaultSizeInspectionLimit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultSizeInspectionLimit = software.amazon.jsii.Kernel.get(this, "defaultSizeInspectionLimit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultSizeInspectionLimit = java.util.Objects.requireNonNull(builder.defaultSizeInspectionLimit, "defaultSizeInspectionLimit is required");
        }

        @Override
        public final java.lang.String getDefaultSizeInspectionLimit() {
            return this.defaultSizeInspectionLimit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultSizeInspectionLimit", om.valueToTree(this.getDefaultSizeInspectionLimit()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBodyCloudfront"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclAssociationConfigRequestBodyCloudfront.Jsii$Proxy that = (Wafv2WebAclAssociationConfigRequestBodyCloudfront.Jsii$Proxy) o;

            return this.defaultSizeInspectionLimit.equals(that.defaultSizeInspectionLimit);
        }

        @Override
        public final int hashCode() {
            int result = this.defaultSizeInspectionLimit.hashCode();
            return result;
        }
    }
}
