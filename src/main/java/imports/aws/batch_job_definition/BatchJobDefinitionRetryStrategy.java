package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionRetryStrategy")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionRetryStrategy.Jsii$Proxy.class)
public interface BatchJobDefinitionRetryStrategy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempts BatchJobDefinition#attempts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAttempts() {
        return null;
    }

    /**
     * evaluate_on_exit block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#evaluate_on_exit BatchJobDefinition#evaluate_on_exit}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEvaluateOnExit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionRetryStrategy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionRetryStrategy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionRetryStrategy> {
        java.lang.Number attempts;
        java.lang.Object evaluateOnExit;

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategy#getAttempts}
         * @param attempts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#attempts BatchJobDefinition#attempts}.
         * @return {@code this}
         */
        public Builder attempts(java.lang.Number attempts) {
            this.attempts = attempts;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategy#getEvaluateOnExit}
         * @param evaluateOnExit evaluate_on_exit block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#evaluate_on_exit BatchJobDefinition#evaluate_on_exit}
         * @return {@code this}
         */
        public Builder evaluateOnExit(com.hashicorp.cdktf.IResolvable evaluateOnExit) {
            this.evaluateOnExit = evaluateOnExit;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategy#getEvaluateOnExit}
         * @param evaluateOnExit evaluate_on_exit block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#evaluate_on_exit BatchJobDefinition#evaluate_on_exit}
         * @return {@code this}
         */
        public Builder evaluateOnExit(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionRetryStrategyEvaluateOnExit> evaluateOnExit) {
            this.evaluateOnExit = evaluateOnExit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionRetryStrategy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionRetryStrategy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionRetryStrategy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionRetryStrategy {
        private final java.lang.Number attempts;
        private final java.lang.Object evaluateOnExit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attempts = software.amazon.jsii.Kernel.get(this, "attempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.evaluateOnExit = software.amazon.jsii.Kernel.get(this, "evaluateOnExit", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attempts = builder.attempts;
            this.evaluateOnExit = builder.evaluateOnExit;
        }

        @Override
        public final java.lang.Number getAttempts() {
            return this.attempts;
        }

        @Override
        public final java.lang.Object getEvaluateOnExit() {
            return this.evaluateOnExit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAttempts() != null) {
                data.set("attempts", om.valueToTree(this.getAttempts()));
            }
            if (this.getEvaluateOnExit() != null) {
                data.set("evaluateOnExit", om.valueToTree(this.getEvaluateOnExit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionRetryStrategy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionRetryStrategy.Jsii$Proxy that = (BatchJobDefinitionRetryStrategy.Jsii$Proxy) o;

            if (this.attempts != null ? !this.attempts.equals(that.attempts) : that.attempts != null) return false;
            return this.evaluateOnExit != null ? this.evaluateOnExit.equals(that.evaluateOnExit) : that.evaluateOnExit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.attempts != null ? this.attempts.hashCode() : 0;
            result = 31 * result + (this.evaluateOnExit != null ? this.evaluateOnExit.hashCode() : 0);
            return result;
        }
    }
}
