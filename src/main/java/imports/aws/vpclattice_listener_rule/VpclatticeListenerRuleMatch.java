package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatch")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleMatch.Jsii$Proxy.class)
public interface VpclatticeListenerRuleMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * http_match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#http_match VpclatticeListenerRule#http_match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch getHttpMatch();

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleMatch> {
        imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch httpMatch;

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatch#getHttpMatch}
         * @param httpMatch http_match block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#http_match VpclatticeListenerRule#http_match}
         * @return {@code this}
         */
        public Builder httpMatch(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch httpMatch) {
            this.httpMatch = httpMatch;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleMatch {
        private final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch httpMatch;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpMatch = software.amazon.jsii.Kernel.get(this, "httpMatch", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpMatch = java.util.Objects.requireNonNull(builder.httpMatch, "httpMatch is required");
        }

        @Override
        public final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatch getHttpMatch() {
            return this.httpMatch;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("httpMatch", om.valueToTree(this.getHttpMatch()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleMatch.Jsii$Proxy that = (VpclatticeListenerRuleMatch.Jsii$Proxy) o;

            return this.httpMatch.equals(that.httpMatch);
        }

        @Override
        public final int hashCode() {
            int result = this.httpMatch.hashCode();
            return result;
        }
    }
}
