package imports.aws.waf_rate_based_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.639Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafRateBasedRule.WafRateBasedRulePredicates")
@software.amazon.jsii.Jsii.Proxy(WafRateBasedRulePredicates.Jsii$Proxy.class)
public interface WafRateBasedRulePredicates extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#data_id WafRateBasedRule#data_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#negated WafRateBasedRule#negated}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getNegated();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#type WafRateBasedRule#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link WafRateBasedRulePredicates}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafRateBasedRulePredicates}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafRateBasedRulePredicates> {
        java.lang.String dataId;
        java.lang.Object negated;
        java.lang.String type;

        /**
         * Sets the value of {@link WafRateBasedRulePredicates#getDataId}
         * @param dataId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#data_id WafRateBasedRule#data_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataId(java.lang.String dataId) {
            this.dataId = dataId;
            return this;
        }

        /**
         * Sets the value of {@link WafRateBasedRulePredicates#getNegated}
         * @param negated Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#negated WafRateBasedRule#negated}. This parameter is required.
         * @return {@code this}
         */
        public Builder negated(java.lang.Boolean negated) {
            this.negated = negated;
            return this;
        }

        /**
         * Sets the value of {@link WafRateBasedRulePredicates#getNegated}
         * @param negated Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#negated WafRateBasedRule#negated}. This parameter is required.
         * @return {@code this}
         */
        public Builder negated(com.hashicorp.cdktf.IResolvable negated) {
            this.negated = negated;
            return this;
        }

        /**
         * Sets the value of {@link WafRateBasedRulePredicates#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/waf_rate_based_rule#type WafRateBasedRule#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafRateBasedRulePredicates}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafRateBasedRulePredicates build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafRateBasedRulePredicates}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafRateBasedRulePredicates {
        private final java.lang.String dataId;
        private final java.lang.Object negated;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataId = software.amazon.jsii.Kernel.get(this, "dataId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.negated = software.amazon.jsii.Kernel.get(this, "negated", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataId = java.util.Objects.requireNonNull(builder.dataId, "dataId is required");
            this.negated = java.util.Objects.requireNonNull(builder.negated, "negated is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getDataId() {
            return this.dataId;
        }

        @Override
        public final java.lang.Object getNegated() {
            return this.negated;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataId", om.valueToTree(this.getDataId()));
            data.set("negated", om.valueToTree(this.getNegated()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafRateBasedRule.WafRateBasedRulePredicates"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafRateBasedRulePredicates.Jsii$Proxy that = (WafRateBasedRulePredicates.Jsii$Proxy) o;

            if (!dataId.equals(that.dataId)) return false;
            if (!negated.equals(that.negated)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.dataId.hashCode();
            result = 31 * result + (this.negated.hashCode());
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
