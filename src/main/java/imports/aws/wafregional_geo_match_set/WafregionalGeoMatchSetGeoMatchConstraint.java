package imports.aws.wafregional_geo_match_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.650Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafregionalGeoMatchSet.WafregionalGeoMatchSetGeoMatchConstraint")
@software.amazon.jsii.Jsii.Proxy(WafregionalGeoMatchSetGeoMatchConstraint.Jsii$Proxy.class)
public interface WafregionalGeoMatchSetGeoMatchConstraint extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_geo_match_set#type WafregionalGeoMatchSet#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_geo_match_set#value WafregionalGeoMatchSet#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * @return a {@link Builder} of {@link WafregionalGeoMatchSetGeoMatchConstraint}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafregionalGeoMatchSetGeoMatchConstraint}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafregionalGeoMatchSetGeoMatchConstraint> {
        java.lang.String type;
        java.lang.String value;

        /**
         * Sets the value of {@link WafregionalGeoMatchSetGeoMatchConstraint#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_geo_match_set#type WafregionalGeoMatchSet#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalGeoMatchSetGeoMatchConstraint#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_geo_match_set#value WafregionalGeoMatchSet#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafregionalGeoMatchSetGeoMatchConstraint}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafregionalGeoMatchSetGeoMatchConstraint build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafregionalGeoMatchSetGeoMatchConstraint}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafregionalGeoMatchSetGeoMatchConstraint {
        private final java.lang.String type;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafregionalGeoMatchSet.WafregionalGeoMatchSetGeoMatchConstraint"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafregionalGeoMatchSetGeoMatchConstraint.Jsii$Proxy that = (WafregionalGeoMatchSetGeoMatchConstraint.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.value.hashCode());
            return result;
        }
    }
}
