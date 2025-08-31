package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatch")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleMatchHttpMatch.Jsii$Proxy.class)
public interface VpclatticeListenerRuleMatchHttpMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * header_matches block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#header_matches VpclatticeListenerRule#header_matches}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeaderMatches() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#method VpclatticeListenerRule#method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMethod() {
        return null;
    }

    /**
     * path_match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#path_match VpclatticeListenerRule#path_match}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch getPathMatch() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleMatchHttpMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleMatchHttpMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleMatchHttpMatch> {
        java.lang.Object headerMatches;
        java.lang.String method;
        imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch pathMatch;

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatch#getHeaderMatches}
         * @param headerMatches header_matches block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#header_matches VpclatticeListenerRule#header_matches}
         * @return {@code this}
         */
        public Builder headerMatches(com.hashicorp.cdktf.IResolvable headerMatches) {
            this.headerMatches = headerMatches;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatch#getHeaderMatches}
         * @param headerMatches header_matches block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#header_matches VpclatticeListenerRule#header_matches}
         * @return {@code this}
         */
        public Builder headerMatches(java.util.List<? extends imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchHeaderMatches> headerMatches) {
            this.headerMatches = headerMatches;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatch#getMethod}
         * @param method Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#method VpclatticeListenerRule#method}.
         * @return {@code this}
         */
        public Builder method(java.lang.String method) {
            this.method = method;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleMatchHttpMatch#getPathMatch}
         * @param pathMatch path_match block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#path_match VpclatticeListenerRule#path_match}
         * @return {@code this}
         */
        public Builder pathMatch(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch pathMatch) {
            this.pathMatch = pathMatch;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleMatchHttpMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleMatchHttpMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleMatchHttpMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleMatchHttpMatch {
        private final java.lang.Object headerMatches;
        private final java.lang.String method;
        private final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch pathMatch;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.headerMatches = software.amazon.jsii.Kernel.get(this, "headerMatches", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.method = software.amazon.jsii.Kernel.get(this, "method", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pathMatch = software.amazon.jsii.Kernel.get(this, "pathMatch", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.headerMatches = builder.headerMatches;
            this.method = builder.method;
            this.pathMatch = builder.pathMatch;
        }

        @Override
        public final java.lang.Object getHeaderMatches() {
            return this.headerMatches;
        }

        @Override
        public final java.lang.String getMethod() {
            return this.method;
        }

        @Override
        public final imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleMatchHttpMatchPathMatch getPathMatch() {
            return this.pathMatch;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeaderMatches() != null) {
                data.set("headerMatches", om.valueToTree(this.getHeaderMatches()));
            }
            if (this.getMethod() != null) {
                data.set("method", om.valueToTree(this.getMethod()));
            }
            if (this.getPathMatch() != null) {
                data.set("pathMatch", om.valueToTree(this.getPathMatch()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleMatchHttpMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleMatchHttpMatch.Jsii$Proxy that = (VpclatticeListenerRuleMatchHttpMatch.Jsii$Proxy) o;

            if (this.headerMatches != null ? !this.headerMatches.equals(that.headerMatches) : that.headerMatches != null) return false;
            if (this.method != null ? !this.method.equals(that.method) : that.method != null) return false;
            return this.pathMatch != null ? this.pathMatch.equals(that.pathMatch) : that.pathMatch == null;
        }

        @Override
        public final int hashCode() {
            int result = this.headerMatches != null ? this.headerMatches.hashCode() : 0;
            result = 31 * result + (this.method != null ? this.method.hashCode() : 0);
            result = 31 * result + (this.pathMatch != null ? this.pathMatch.hashCode() : 0);
            return result;
        }
    }
}
