package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.678Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleActionChallenge")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclRuleActionChallenge.Jsii$Proxy.class)
public interface Wafv2WebAclRuleActionChallenge extends software.amazon.jsii.JsiiSerializable {

    /**
     * custom_request_handling block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeCustomRequestHandling getCustomRequestHandling() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclRuleActionChallenge}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclRuleActionChallenge}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclRuleActionChallenge> {
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeCustomRequestHandling customRequestHandling;

        /**
         * Sets the value of {@link Wafv2WebAclRuleActionChallenge#getCustomRequestHandling}
         * @param customRequestHandling custom_request_handling block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#custom_request_handling Wafv2WebAcl#custom_request_handling}
         * @return {@code this}
         */
        public Builder customRequestHandling(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeCustomRequestHandling customRequestHandling) {
            this.customRequestHandling = customRequestHandling;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclRuleActionChallenge}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclRuleActionChallenge build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclRuleActionChallenge}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclRuleActionChallenge {
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeCustomRequestHandling customRequestHandling;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customRequestHandling = software.amazon.jsii.Kernel.get(this, "customRequestHandling", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeCustomRequestHandling.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customRequestHandling = builder.customRequestHandling;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeCustomRequestHandling getCustomRequestHandling() {
            return this.customRequestHandling;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomRequestHandling() != null) {
                data.set("customRequestHandling", om.valueToTree(this.getCustomRequestHandling()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclRuleActionChallenge"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclRuleActionChallenge.Jsii$Proxy that = (Wafv2WebAclRuleActionChallenge.Jsii$Proxy) o;

            return this.customRequestHandling != null ? this.customRequestHandling.equals(that.customRequestHandling) : that.customRequestHandling == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customRequestHandling != null ? this.customRequestHandling.hashCode() : 0;
            return result;
        }
    }
}
