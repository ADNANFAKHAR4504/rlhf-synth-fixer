package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclAssociationConfig.Jsii$Proxy.class)
public interface Wafv2WebAclAssociationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * request_body block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#request_body Wafv2WebAcl#request_body}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequestBody() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclAssociationConfig> {
        java.lang.Object requestBody;

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfig#getRequestBody}
         * @param requestBody request_body block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#request_body Wafv2WebAcl#request_body}
         * @return {@code this}
         */
        public Builder requestBody(com.hashicorp.cdktf.IResolvable requestBody) {
            this.requestBody = requestBody;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfig#getRequestBody}
         * @param requestBody request_body block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#request_body Wafv2WebAcl#request_body}
         * @return {@code this}
         */
        public Builder requestBody(java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBody> requestBody) {
            this.requestBody = requestBody;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclAssociationConfig {
        private final java.lang.Object requestBody;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.requestBody = software.amazon.jsii.Kernel.get(this, "requestBody", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.requestBody = builder.requestBody;
        }

        @Override
        public final java.lang.Object getRequestBody() {
            return this.requestBody;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRequestBody() != null) {
                data.set("requestBody", om.valueToTree(this.getRequestBody()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclAssociationConfig.Jsii$Proxy that = (Wafv2WebAclAssociationConfig.Jsii$Proxy) o;

            return this.requestBody != null ? this.requestBody.equals(that.requestBody) : that.requestBody == null;
        }

        @Override
        public final int hashCode() {
            int result = this.requestBody != null ? this.requestBody.hashCode() : 0;
            return result;
        }
    }
}
