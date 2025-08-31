package imports.aws.batch_job_queue;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.136Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobQueue.BatchJobQueueJobStateTimeLimitAction")
@software.amazon.jsii.Jsii.Proxy(BatchJobQueueJobStateTimeLimitAction.Jsii$Proxy.class)
public interface BatchJobQueueJobStateTimeLimitAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#action BatchJobQueue#action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#max_time_seconds BatchJobQueue#max_time_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxTimeSeconds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#reason BatchJobQueue#reason}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReason();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#state BatchJobQueue#state}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getState();

    /**
     * @return a {@link Builder} of {@link BatchJobQueueJobStateTimeLimitAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobQueueJobStateTimeLimitAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobQueueJobStateTimeLimitAction> {
        java.lang.String action;
        java.lang.Number maxTimeSeconds;
        java.lang.String reason;
        java.lang.String state;

        /**
         * Sets the value of {@link BatchJobQueueJobStateTimeLimitAction#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#action BatchJobQueue#action}. This parameter is required.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueJobStateTimeLimitAction#getMaxTimeSeconds}
         * @param maxTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#max_time_seconds BatchJobQueue#max_time_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxTimeSeconds(java.lang.Number maxTimeSeconds) {
            this.maxTimeSeconds = maxTimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueJobStateTimeLimitAction#getReason}
         * @param reason Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#reason BatchJobQueue#reason}. This parameter is required.
         * @return {@code this}
         */
        public Builder reason(java.lang.String reason) {
            this.reason = reason;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobQueueJobStateTimeLimitAction#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_queue#state BatchJobQueue#state}. This parameter is required.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobQueueJobStateTimeLimitAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobQueueJobStateTimeLimitAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobQueueJobStateTimeLimitAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobQueueJobStateTimeLimitAction {
        private final java.lang.String action;
        private final java.lang.Number maxTimeSeconds;
        private final java.lang.String reason;
        private final java.lang.String state;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxTimeSeconds = software.amazon.jsii.Kernel.get(this, "maxTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.reason = software.amazon.jsii.Kernel.get(this, "reason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.maxTimeSeconds = java.util.Objects.requireNonNull(builder.maxTimeSeconds, "maxTimeSeconds is required");
            this.reason = java.util.Objects.requireNonNull(builder.reason, "reason is required");
            this.state = java.util.Objects.requireNonNull(builder.state, "state is required");
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final java.lang.Number getMaxTimeSeconds() {
            return this.maxTimeSeconds;
        }

        @Override
        public final java.lang.String getReason() {
            return this.reason;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("maxTimeSeconds", om.valueToTree(this.getMaxTimeSeconds()));
            data.set("reason", om.valueToTree(this.getReason()));
            data.set("state", om.valueToTree(this.getState()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobQueue.BatchJobQueueJobStateTimeLimitAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobQueueJobStateTimeLimitAction.Jsii$Proxy that = (BatchJobQueueJobStateTimeLimitAction.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!maxTimeSeconds.equals(that.maxTimeSeconds)) return false;
            if (!reason.equals(that.reason)) return false;
            return this.state.equals(that.state);
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.maxTimeSeconds.hashCode());
            result = 31 * result + (this.reason.hashCode());
            result = 31 * result + (this.state.hashCode());
            return result;
        }
    }
}
