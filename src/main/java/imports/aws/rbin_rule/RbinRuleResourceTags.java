package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleResourceTags")
@software.amazon.jsii.Jsii.Proxy(RbinRuleResourceTags.Jsii$Proxy.class)
public interface RbinRuleResourceTags extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_key RbinRule#resource_tag_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceTagKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_value RbinRule#resource_tag_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceTagValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RbinRuleResourceTags}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RbinRuleResourceTags}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RbinRuleResourceTags> {
        java.lang.String resourceTagKey;
        java.lang.String resourceTagValue;

        /**
         * Sets the value of {@link RbinRuleResourceTags#getResourceTagKey}
         * @param resourceTagKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_key RbinRule#resource_tag_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceTagKey(java.lang.String resourceTagKey) {
            this.resourceTagKey = resourceTagKey;
            return this;
        }

        /**
         * Sets the value of {@link RbinRuleResourceTags#getResourceTagValue}
         * @param resourceTagValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#resource_tag_value RbinRule#resource_tag_value}.
         * @return {@code this}
         */
        public Builder resourceTagValue(java.lang.String resourceTagValue) {
            this.resourceTagValue = resourceTagValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RbinRuleResourceTags}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RbinRuleResourceTags build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RbinRuleResourceTags}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RbinRuleResourceTags {
        private final java.lang.String resourceTagKey;
        private final java.lang.String resourceTagValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceTagKey = software.amazon.jsii.Kernel.get(this, "resourceTagKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceTagValue = software.amazon.jsii.Kernel.get(this, "resourceTagValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceTagKey = java.util.Objects.requireNonNull(builder.resourceTagKey, "resourceTagKey is required");
            this.resourceTagValue = builder.resourceTagValue;
        }

        @Override
        public final java.lang.String getResourceTagKey() {
            return this.resourceTagKey;
        }

        @Override
        public final java.lang.String getResourceTagValue() {
            return this.resourceTagValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceTagKey", om.valueToTree(this.getResourceTagKey()));
            if (this.getResourceTagValue() != null) {
                data.set("resourceTagValue", om.valueToTree(this.getResourceTagValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rbinRule.RbinRuleResourceTags"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RbinRuleResourceTags.Jsii$Proxy that = (RbinRuleResourceTags.Jsii$Proxy) o;

            if (!resourceTagKey.equals(that.resourceTagKey)) return false;
            return this.resourceTagValue != null ? this.resourceTagValue.equals(that.resourceTagValue) : that.resourceTagValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resourceTagKey.hashCode();
            result = 31 * result + (this.resourceTagValue != null ? this.resourceTagValue.hashCode() : 0);
            return result;
        }
    }
}
