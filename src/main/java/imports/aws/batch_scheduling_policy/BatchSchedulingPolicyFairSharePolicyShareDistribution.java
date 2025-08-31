package imports.aws.batch_scheduling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchSchedulingPolicy.BatchSchedulingPolicyFairSharePolicyShareDistribution")
@software.amazon.jsii.Jsii.Proxy(BatchSchedulingPolicyFairSharePolicyShareDistribution.Jsii$Proxy.class)
public interface BatchSchedulingPolicyFairSharePolicyShareDistribution extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_identifier BatchSchedulingPolicy#share_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getShareIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#weight_factor BatchSchedulingPolicy#weight_factor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeightFactor() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchSchedulingPolicyFairSharePolicyShareDistribution}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchSchedulingPolicyFairSharePolicyShareDistribution}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchSchedulingPolicyFairSharePolicyShareDistribution> {
        java.lang.String shareIdentifier;
        java.lang.Number weightFactor;

        /**
         * Sets the value of {@link BatchSchedulingPolicyFairSharePolicyShareDistribution#getShareIdentifier}
         * @param shareIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_identifier BatchSchedulingPolicy#share_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder shareIdentifier(java.lang.String shareIdentifier) {
            this.shareIdentifier = shareIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link BatchSchedulingPolicyFairSharePolicyShareDistribution#getWeightFactor}
         * @param weightFactor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#weight_factor BatchSchedulingPolicy#weight_factor}.
         * @return {@code this}
         */
        public Builder weightFactor(java.lang.Number weightFactor) {
            this.weightFactor = weightFactor;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchSchedulingPolicyFairSharePolicyShareDistribution}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchSchedulingPolicyFairSharePolicyShareDistribution build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchSchedulingPolicyFairSharePolicyShareDistribution}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchSchedulingPolicyFairSharePolicyShareDistribution {
        private final java.lang.String shareIdentifier;
        private final java.lang.Number weightFactor;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.shareIdentifier = software.amazon.jsii.Kernel.get(this, "shareIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weightFactor = software.amazon.jsii.Kernel.get(this, "weightFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.shareIdentifier = java.util.Objects.requireNonNull(builder.shareIdentifier, "shareIdentifier is required");
            this.weightFactor = builder.weightFactor;
        }

        @Override
        public final java.lang.String getShareIdentifier() {
            return this.shareIdentifier;
        }

        @Override
        public final java.lang.Number getWeightFactor() {
            return this.weightFactor;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("shareIdentifier", om.valueToTree(this.getShareIdentifier()));
            if (this.getWeightFactor() != null) {
                data.set("weightFactor", om.valueToTree(this.getWeightFactor()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchSchedulingPolicy.BatchSchedulingPolicyFairSharePolicyShareDistribution"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchSchedulingPolicyFairSharePolicyShareDistribution.Jsii$Proxy that = (BatchSchedulingPolicyFairSharePolicyShareDistribution.Jsii$Proxy) o;

            if (!shareIdentifier.equals(that.shareIdentifier)) return false;
            return this.weightFactor != null ? this.weightFactor.equals(that.weightFactor) : that.weightFactor == null;
        }

        @Override
        public final int hashCode() {
            int result = this.shareIdentifier.hashCode();
            result = 31 * result + (this.weightFactor != null ? this.weightFactor.hashCode() : 0);
            return result;
        }
    }
}
