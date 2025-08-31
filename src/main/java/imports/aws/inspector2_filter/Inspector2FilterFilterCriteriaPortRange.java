package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.379Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaPortRange")
@software.amazon.jsii.Jsii.Proxy(Inspector2FilterFilterCriteriaPortRange.Jsii$Proxy.class)
public interface Inspector2FilterFilterCriteriaPortRange extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#begin_inclusive Inspector2Filter#begin_inclusive}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBeginInclusive();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getEndInclusive();

    /**
     * @return a {@link Builder} of {@link Inspector2FilterFilterCriteriaPortRange}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Inspector2FilterFilterCriteriaPortRange}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Inspector2FilterFilterCriteriaPortRange> {
        java.lang.Number beginInclusive;
        java.lang.Number endInclusive;

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaPortRange#getBeginInclusive}
         * @param beginInclusive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#begin_inclusive Inspector2Filter#begin_inclusive}. This parameter is required.
         * @return {@code this}
         */
        public Builder beginInclusive(java.lang.Number beginInclusive) {
            this.beginInclusive = beginInclusive;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaPortRange#getEndInclusive}
         * @param endInclusive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#end_inclusive Inspector2Filter#end_inclusive}. This parameter is required.
         * @return {@code this}
         */
        public Builder endInclusive(java.lang.Number endInclusive) {
            this.endInclusive = endInclusive;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Inspector2FilterFilterCriteriaPortRange}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Inspector2FilterFilterCriteriaPortRange build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Inspector2FilterFilterCriteriaPortRange}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Inspector2FilterFilterCriteriaPortRange {
        private final java.lang.Number beginInclusive;
        private final java.lang.Number endInclusive;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.beginInclusive = software.amazon.jsii.Kernel.get(this, "beginInclusive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.endInclusive = software.amazon.jsii.Kernel.get(this, "endInclusive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.beginInclusive = java.util.Objects.requireNonNull(builder.beginInclusive, "beginInclusive is required");
            this.endInclusive = java.util.Objects.requireNonNull(builder.endInclusive, "endInclusive is required");
        }

        @Override
        public final java.lang.Number getBeginInclusive() {
            return this.beginInclusive;
        }

        @Override
        public final java.lang.Number getEndInclusive() {
            return this.endInclusive;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("beginInclusive", om.valueToTree(this.getBeginInclusive()));
            data.set("endInclusive", om.valueToTree(this.getEndInclusive()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.inspector2Filter.Inspector2FilterFilterCriteriaPortRange"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Inspector2FilterFilterCriteriaPortRange.Jsii$Proxy that = (Inspector2FilterFilterCriteriaPortRange.Jsii$Proxy) o;

            if (!beginInclusive.equals(that.beginInclusive)) return false;
            return this.endInclusive.equals(that.endInclusive);
        }

        @Override
        public final int hashCode() {
            int result = this.beginInclusive.hashCode();
            result = 31 * result + (this.endInclusive.hashCode());
            return result;
        }
    }
}
