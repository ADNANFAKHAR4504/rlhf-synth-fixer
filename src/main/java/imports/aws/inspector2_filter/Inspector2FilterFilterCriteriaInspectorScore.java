package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.377Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaInspectorScore")
@software.amazon.jsii.Jsii.Proxy(Inspector2FilterFilterCriteriaInspectorScore.Jsii$Proxy.class)
public interface Inspector2FilterFilterCriteriaInspectorScore extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getLowerInclusive();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getUpperInclusive();

    /**
     * @return a {@link Builder} of {@link Inspector2FilterFilterCriteriaInspectorScore}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Inspector2FilterFilterCriteriaInspectorScore}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Inspector2FilterFilterCriteriaInspectorScore> {
        java.lang.Number lowerInclusive;
        java.lang.Number upperInclusive;

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaInspectorScore#getLowerInclusive}
         * @param lowerInclusive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#lower_inclusive Inspector2Filter#lower_inclusive}. This parameter is required.
         * @return {@code this}
         */
        public Builder lowerInclusive(java.lang.Number lowerInclusive) {
            this.lowerInclusive = lowerInclusive;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaInspectorScore#getUpperInclusive}
         * @param upperInclusive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#upper_inclusive Inspector2Filter#upper_inclusive}. This parameter is required.
         * @return {@code this}
         */
        public Builder upperInclusive(java.lang.Number upperInclusive) {
            this.upperInclusive = upperInclusive;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Inspector2FilterFilterCriteriaInspectorScore}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Inspector2FilterFilterCriteriaInspectorScore build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Inspector2FilterFilterCriteriaInspectorScore}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Inspector2FilterFilterCriteriaInspectorScore {
        private final java.lang.Number lowerInclusive;
        private final java.lang.Number upperInclusive;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.lowerInclusive = software.amazon.jsii.Kernel.get(this, "lowerInclusive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.upperInclusive = software.amazon.jsii.Kernel.get(this, "upperInclusive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.lowerInclusive = java.util.Objects.requireNonNull(builder.lowerInclusive, "lowerInclusive is required");
            this.upperInclusive = java.util.Objects.requireNonNull(builder.upperInclusive, "upperInclusive is required");
        }

        @Override
        public final java.lang.Number getLowerInclusive() {
            return this.lowerInclusive;
        }

        @Override
        public final java.lang.Number getUpperInclusive() {
            return this.upperInclusive;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("lowerInclusive", om.valueToTree(this.getLowerInclusive()));
            data.set("upperInclusive", om.valueToTree(this.getUpperInclusive()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.inspector2Filter.Inspector2FilterFilterCriteriaInspectorScore"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Inspector2FilterFilterCriteriaInspectorScore.Jsii$Proxy that = (Inspector2FilterFilterCriteriaInspectorScore.Jsii$Proxy) o;

            if (!lowerInclusive.equals(that.lowerInclusive)) return false;
            return this.upperInclusive.equals(that.upperInclusive);
        }

        @Override
        public final int hashCode() {
            int result = this.lowerInclusive.hashCode();
            result = 31 * result + (this.upperInclusive.hashCode());
            return result;
        }
    }
}
