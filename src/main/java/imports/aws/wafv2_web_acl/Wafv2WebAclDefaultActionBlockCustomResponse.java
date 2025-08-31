package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.672Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponse")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclDefaultActionBlockCustomResponse.Jsii$Proxy.class)
public interface Wafv2WebAclDefaultActionBlockCustomResponse extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getResponseCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomResponseBodyKey() {
        return null;
    }

    /**
     * response_header block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResponseHeader() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclDefaultActionBlockCustomResponse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclDefaultActionBlockCustomResponse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclDefaultActionBlockCustomResponse> {
        java.lang.Number responseCode;
        java.lang.String customResponseBodyKey;
        java.lang.Object responseHeader;

        /**
         * Sets the value of {@link Wafv2WebAclDefaultActionBlockCustomResponse#getResponseCode}
         * @param responseCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_code Wafv2WebAcl#response_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder responseCode(java.lang.Number responseCode) {
            this.responseCode = responseCode;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclDefaultActionBlockCustomResponse#getCustomResponseBodyKey}
         * @param customResponseBodyKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_response_body_key Wafv2WebAcl#custom_response_body_key}.
         * @return {@code this}
         */
        public Builder customResponseBodyKey(java.lang.String customResponseBodyKey) {
            this.customResponseBodyKey = customResponseBodyKey;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclDefaultActionBlockCustomResponse#getResponseHeader}
         * @param responseHeader response_header block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
         * @return {@code this}
         */
        public Builder responseHeader(com.hashicorp.cdktf.IResolvable responseHeader) {
            this.responseHeader = responseHeader;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclDefaultActionBlockCustomResponse#getResponseHeader}
         * @param responseHeader response_header block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#response_header Wafv2WebAcl#response_header}
         * @return {@code this}
         */
        public Builder responseHeader(java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionBlockCustomResponseResponseHeader> responseHeader) {
            this.responseHeader = responseHeader;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclDefaultActionBlockCustomResponse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclDefaultActionBlockCustomResponse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclDefaultActionBlockCustomResponse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclDefaultActionBlockCustomResponse {
        private final java.lang.Number responseCode;
        private final java.lang.String customResponseBodyKey;
        private final java.lang.Object responseHeader;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.responseCode = software.amazon.jsii.Kernel.get(this, "responseCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.customResponseBodyKey = software.amazon.jsii.Kernel.get(this, "customResponseBodyKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseHeader = software.amazon.jsii.Kernel.get(this, "responseHeader", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.responseCode = java.util.Objects.requireNonNull(builder.responseCode, "responseCode is required");
            this.customResponseBodyKey = builder.customResponseBodyKey;
            this.responseHeader = builder.responseHeader;
        }

        @Override
        public final java.lang.Number getResponseCode() {
            return this.responseCode;
        }

        @Override
        public final java.lang.String getCustomResponseBodyKey() {
            return this.customResponseBodyKey;
        }

        @Override
        public final java.lang.Object getResponseHeader() {
            return this.responseHeader;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("responseCode", om.valueToTree(this.getResponseCode()));
            if (this.getCustomResponseBodyKey() != null) {
                data.set("customResponseBodyKey", om.valueToTree(this.getCustomResponseBodyKey()));
            }
            if (this.getResponseHeader() != null) {
                data.set("responseHeader", om.valueToTree(this.getResponseHeader()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclDefaultActionBlockCustomResponse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclDefaultActionBlockCustomResponse.Jsii$Proxy that = (Wafv2WebAclDefaultActionBlockCustomResponse.Jsii$Proxy) o;

            if (!responseCode.equals(that.responseCode)) return false;
            if (this.customResponseBodyKey != null ? !this.customResponseBodyKey.equals(that.customResponseBodyKey) : that.customResponseBodyKey != null) return false;
            return this.responseHeader != null ? this.responseHeader.equals(that.responseHeader) : that.responseHeader == null;
        }

        @Override
        public final int hashCode() {
            int result = this.responseCode.hashCode();
            result = 31 * result + (this.customResponseBodyKey != null ? this.customResponseBodyKey.hashCode() : 0);
            result = 31 * result + (this.responseHeader != null ? this.responseHeader.hashCode() : 0);
            return result;
        }
    }
}
