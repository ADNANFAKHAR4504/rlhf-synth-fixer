package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.671Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfig")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclDataProtectionConfig.Jsii$Proxy.class)
public interface Wafv2WebAclDataProtectionConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * data_protection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection Wafv2WebAcl#data_protection}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataProtection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclDataProtectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclDataProtectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclDataProtectionConfig> {
        java.lang.Object dataProtection;

        /**
         * Sets the value of {@link Wafv2WebAclDataProtectionConfig#getDataProtection}
         * @param dataProtection data_protection block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection Wafv2WebAcl#data_protection}
         * @return {@code this}
         */
        public Builder dataProtection(com.hashicorp.cdktf.IResolvable dataProtection) {
            this.dataProtection = dataProtection;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclDataProtectionConfig#getDataProtection}
         * @param dataProtection data_protection block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#data_protection Wafv2WebAcl#data_protection}
         * @return {@code this}
         */
        public Builder dataProtection(java.util.List<? extends imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtection> dataProtection) {
            this.dataProtection = dataProtection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclDataProtectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclDataProtectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclDataProtectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclDataProtectionConfig {
        private final java.lang.Object dataProtection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataProtection = software.amazon.jsii.Kernel.get(this, "dataProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataProtection = builder.dataProtection;
        }

        @Override
        public final java.lang.Object getDataProtection() {
            return this.dataProtection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDataProtection() != null) {
                data.set("dataProtection", om.valueToTree(this.getDataProtection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclDataProtectionConfig.Jsii$Proxy that = (Wafv2WebAclDataProtectionConfig.Jsii$Proxy) o;

            return this.dataProtection != null ? this.dataProtection.equals(that.dataProtection) : that.dataProtection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataProtection != null ? this.dataProtection.hashCode() : 0;
            return result;
        }
    }
}
