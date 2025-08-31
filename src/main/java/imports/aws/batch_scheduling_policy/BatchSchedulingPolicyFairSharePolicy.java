package imports.aws.batch_scheduling_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.136Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchSchedulingPolicy.BatchSchedulingPolicyFairSharePolicy")
@software.amazon.jsii.Jsii.Proxy(BatchSchedulingPolicyFairSharePolicy.Jsii$Proxy.class)
public interface BatchSchedulingPolicyFairSharePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#compute_reservation BatchSchedulingPolicy#compute_reservation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getComputeReservation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_decay_seconds BatchSchedulingPolicy#share_decay_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getShareDecaySeconds() {
        return null;
    }

    /**
     * share_distribution block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_distribution BatchSchedulingPolicy#share_distribution}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getShareDistribution() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchSchedulingPolicyFairSharePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchSchedulingPolicyFairSharePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchSchedulingPolicyFairSharePolicy> {
        java.lang.Number computeReservation;
        java.lang.Number shareDecaySeconds;
        java.lang.Object shareDistribution;

        /**
         * Sets the value of {@link BatchSchedulingPolicyFairSharePolicy#getComputeReservation}
         * @param computeReservation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#compute_reservation BatchSchedulingPolicy#compute_reservation}.
         * @return {@code this}
         */
        public Builder computeReservation(java.lang.Number computeReservation) {
            this.computeReservation = computeReservation;
            return this;
        }

        /**
         * Sets the value of {@link BatchSchedulingPolicyFairSharePolicy#getShareDecaySeconds}
         * @param shareDecaySeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_decay_seconds BatchSchedulingPolicy#share_decay_seconds}.
         * @return {@code this}
         */
        public Builder shareDecaySeconds(java.lang.Number shareDecaySeconds) {
            this.shareDecaySeconds = shareDecaySeconds;
            return this;
        }

        /**
         * Sets the value of {@link BatchSchedulingPolicyFairSharePolicy#getShareDistribution}
         * @param shareDistribution share_distribution block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_distribution BatchSchedulingPolicy#share_distribution}
         * @return {@code this}
         */
        public Builder shareDistribution(com.hashicorp.cdktf.IResolvable shareDistribution) {
            this.shareDistribution = shareDistribution;
            return this;
        }

        /**
         * Sets the value of {@link BatchSchedulingPolicyFairSharePolicy#getShareDistribution}
         * @param shareDistribution share_distribution block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_scheduling_policy#share_distribution BatchSchedulingPolicy#share_distribution}
         * @return {@code this}
         */
        public Builder shareDistribution(java.util.List<? extends imports.aws.batch_scheduling_policy.BatchSchedulingPolicyFairSharePolicyShareDistribution> shareDistribution) {
            this.shareDistribution = shareDistribution;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchSchedulingPolicyFairSharePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchSchedulingPolicyFairSharePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchSchedulingPolicyFairSharePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchSchedulingPolicyFairSharePolicy {
        private final java.lang.Number computeReservation;
        private final java.lang.Number shareDecaySeconds;
        private final java.lang.Object shareDistribution;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.computeReservation = software.amazon.jsii.Kernel.get(this, "computeReservation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.shareDecaySeconds = software.amazon.jsii.Kernel.get(this, "shareDecaySeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.shareDistribution = software.amazon.jsii.Kernel.get(this, "shareDistribution", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.computeReservation = builder.computeReservation;
            this.shareDecaySeconds = builder.shareDecaySeconds;
            this.shareDistribution = builder.shareDistribution;
        }

        @Override
        public final java.lang.Number getComputeReservation() {
            return this.computeReservation;
        }

        @Override
        public final java.lang.Number getShareDecaySeconds() {
            return this.shareDecaySeconds;
        }

        @Override
        public final java.lang.Object getShareDistribution() {
            return this.shareDistribution;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getComputeReservation() != null) {
                data.set("computeReservation", om.valueToTree(this.getComputeReservation()));
            }
            if (this.getShareDecaySeconds() != null) {
                data.set("shareDecaySeconds", om.valueToTree(this.getShareDecaySeconds()));
            }
            if (this.getShareDistribution() != null) {
                data.set("shareDistribution", om.valueToTree(this.getShareDistribution()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchSchedulingPolicy.BatchSchedulingPolicyFairSharePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchSchedulingPolicyFairSharePolicy.Jsii$Proxy that = (BatchSchedulingPolicyFairSharePolicy.Jsii$Proxy) o;

            if (this.computeReservation != null ? !this.computeReservation.equals(that.computeReservation) : that.computeReservation != null) return false;
            if (this.shareDecaySeconds != null ? !this.shareDecaySeconds.equals(that.shareDecaySeconds) : that.shareDecaySeconds != null) return false;
            return this.shareDistribution != null ? this.shareDistribution.equals(that.shareDistribution) : that.shareDistribution == null;
        }

        @Override
        public final int hashCode() {
            int result = this.computeReservation != null ? this.computeReservation.hashCode() : 0;
            result = 31 * result + (this.shareDecaySeconds != null ? this.shareDecaySeconds.hashCode() : 0);
            result = 31 * result + (this.shareDistribution != null ? this.shareDistribution.hashCode() : 0);
            return result;
        }
    }
}
