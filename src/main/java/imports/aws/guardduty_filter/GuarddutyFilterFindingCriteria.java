package imports.aws.guardduty_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.317Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyFilter.GuarddutyFilterFindingCriteria")
@software.amazon.jsii.Jsii.Proxy(GuarddutyFilterFindingCriteria.Jsii$Proxy.class)
public interface GuarddutyFilterFindingCriteria extends software.amazon.jsii.JsiiSerializable {

    /**
     * criterion block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#criterion GuarddutyFilter#criterion}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getCriterion();

    /**
     * @return a {@link Builder} of {@link GuarddutyFilterFindingCriteria}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GuarddutyFilterFindingCriteria}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GuarddutyFilterFindingCriteria> {
        java.lang.Object criterion;

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteria#getCriterion}
         * @param criterion criterion block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#criterion GuarddutyFilter#criterion}
         * @return {@code this}
         */
        public Builder criterion(com.hashicorp.cdktf.IResolvable criterion) {
            this.criterion = criterion;
            return this;
        }

        /**
         * Sets the value of {@link GuarddutyFilterFindingCriteria#getCriterion}
         * @param criterion criterion block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/guardduty_filter#criterion GuarddutyFilter#criterion}
         * @return {@code this}
         */
        public Builder criterion(java.util.List<? extends imports.aws.guardduty_filter.GuarddutyFilterFindingCriteriaCriterion> criterion) {
            this.criterion = criterion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GuarddutyFilterFindingCriteria}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GuarddutyFilterFindingCriteria build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GuarddutyFilterFindingCriteria}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GuarddutyFilterFindingCriteria {
        private final java.lang.Object criterion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.criterion = software.amazon.jsii.Kernel.get(this, "criterion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.criterion = java.util.Objects.requireNonNull(builder.criterion, "criterion is required");
        }

        @Override
        public final java.lang.Object getCriterion() {
            return this.criterion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("criterion", om.valueToTree(this.getCriterion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.guarddutyFilter.GuarddutyFilterFindingCriteria"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GuarddutyFilterFindingCriteria.Jsii$Proxy that = (GuarddutyFilterFindingCriteria.Jsii$Proxy) o;

            return this.criterion.equals(that.criterion);
        }

        @Override
        public final int hashCode() {
            int result = this.criterion.hashCode();
            return result;
        }
    }
}
