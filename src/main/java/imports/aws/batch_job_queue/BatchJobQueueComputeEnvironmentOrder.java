package imports.aws.batch_job_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.135Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobQueue.BatchJobQueueComputeEnvironmentOrder")
@software.amazon.jsii.Jsii.Proxy(BatchJobQueueComputeEnvironmentOrder.Jsii$Proxy.class)
public interface BatchJobQueueComputeEnvironmentOrder extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environment BatchJobQueue#compute_environment}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComputeEnvironment();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#order BatchJobQueue#order}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getOrder();

    /**
     * @return a {@link Builder} of {@link BatchJobQueueComputeEnvironmentOrder}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobQueueComputeEnvironmentOrder}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobQueueComputeEnvironmentOrder> {
        java.lang.String computeEnvironment;
        java.lang.Number order;

        /**
         * Sets the value of {@link BatchJobQueueComputeEnvironmentOrder#getComputeEnvironment}
         * @param computeEnvironment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#compute_environment BatchJobQueue#compute_environment}. This parameter is required.
         * @return {@code this}
         */
        public Builder computeEnvironment(java.lang.String computeEnvironment) {
            this.computeEnvironment = computeEnvironment;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueComputeEnvironmentOrder#getOrder}
         * @param order Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#order BatchJobQueue#order}. This parameter is required.
         * @return {@code this}
         */
        public Builder order(java.lang.Number order) {
            this.order = order;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobQueueComputeEnvironmentOrder}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobQueueComputeEnvironmentOrder build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobQueueComputeEnvironmentOrder}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobQueueComputeEnvironmentOrder {
        private final java.lang.String computeEnvironment;
        private final java.lang.Number order;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.computeEnvironment = software.amazon.jsii.Kernel.get(this, "computeEnvironment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.order = software.amazon.jsii.Kernel.get(this, "order", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.computeEnvironment = java.util.Objects.requireNonNull(builder.computeEnvironment, "computeEnvironment is required");
            this.order = java.util.Objects.requireNonNull(builder.order, "order is required");
        }

        @Override
        public final java.lang.String getComputeEnvironment() {
            return this.computeEnvironment;
        }

        @Override
        public final java.lang.Number getOrder() {
            return this.order;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("computeEnvironment", om.valueToTree(this.getComputeEnvironment()));
            data.set("order", om.valueToTree(this.getOrder()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobQueue.BatchJobQueueComputeEnvironmentOrder"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobQueueComputeEnvironmentOrder.Jsii$Proxy that = (BatchJobQueueComputeEnvironmentOrder.Jsii$Proxy) o;

            if (!computeEnvironment.equals(that.computeEnvironment)) return false;
            return this.order.equals(that.order);
        }

        @Override
        public final int hashCode() {
            int result = this.computeEnvironment.hashCode();
            result = 31 * result + (this.order.hashCode());
            return result;
        }
    }
}
