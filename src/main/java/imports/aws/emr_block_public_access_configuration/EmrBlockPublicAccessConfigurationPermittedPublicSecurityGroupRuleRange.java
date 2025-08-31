package imports.aws.emr_block_public_access_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.191Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrBlockPublicAccessConfiguration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange")
@software.amazon.jsii.Jsii.Proxy(EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange.Jsii$Proxy.class)
public interface EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#max_range EmrBlockPublicAccessConfiguration#max_range}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxRange();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#min_range EmrBlockPublicAccessConfiguration#min_range}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinRange();

    /**
     * @return a {@link Builder} of {@link EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange> {
        java.lang.Number maxRange;
        java.lang.Number minRange;

        /**
         * Sets the value of {@link EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange#getMaxRange}
         * @param maxRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#max_range EmrBlockPublicAccessConfiguration#max_range}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxRange(java.lang.Number maxRange) {
            this.maxRange = maxRange;
            return this;
        }

        /**
         * Sets the value of {@link EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange#getMinRange}
         * @param minRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_block_public_access_configuration#min_range EmrBlockPublicAccessConfiguration#min_range}. This parameter is required.
         * @return {@code this}
         */
        public Builder minRange(java.lang.Number minRange) {
            this.minRange = minRange;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange {
        private final java.lang.Number maxRange;
        private final java.lang.Number minRange;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxRange = software.amazon.jsii.Kernel.get(this, "maxRange", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minRange = software.amazon.jsii.Kernel.get(this, "minRange", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxRange = java.util.Objects.requireNonNull(builder.maxRange, "maxRange is required");
            this.minRange = java.util.Objects.requireNonNull(builder.minRange, "minRange is required");
        }

        @Override
        public final java.lang.Number getMaxRange() {
            return this.maxRange;
        }

        @Override
        public final java.lang.Number getMinRange() {
            return this.minRange;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxRange", om.valueToTree(this.getMaxRange()));
            data.set("minRange", om.valueToTree(this.getMinRange()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrBlockPublicAccessConfiguration.EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange.Jsii$Proxy that = (EmrBlockPublicAccessConfigurationPermittedPublicSecurityGroupRuleRange.Jsii$Proxy) o;

            if (!maxRange.equals(that.maxRange)) return false;
            return this.minRange.equals(that.minRange);
        }

        @Override
        public final int hashCode() {
            int result = this.maxRange.hashCode();
            result = 31 * result + (this.minRange.hashCode());
            return result;
        }
    }
}
