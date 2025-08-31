package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionRetryStrategyEvaluateOnExit")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionRetryStrategyEvaluateOnExit.Jsii$Proxy.class)
public interface BatchJobDefinitionRetryStrategyEvaluateOnExit extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#action BatchJobDefinition#action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_exit_code BatchJobDefinition#on_exit_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnExitCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_reason BatchJobDefinition#on_reason}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnReason() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_status_reason BatchJobDefinition#on_status_reason}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnStatusReason() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionRetryStrategyEvaluateOnExit}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionRetryStrategyEvaluateOnExit}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionRetryStrategyEvaluateOnExit> {
        java.lang.String action;
        java.lang.String onExitCode;
        java.lang.String onReason;
        java.lang.String onStatusReason;

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategyEvaluateOnExit#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#action BatchJobDefinition#action}. This parameter is required.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategyEvaluateOnExit#getOnExitCode}
         * @param onExitCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_exit_code BatchJobDefinition#on_exit_code}.
         * @return {@code this}
         */
        public Builder onExitCode(java.lang.String onExitCode) {
            this.onExitCode = onExitCode;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategyEvaluateOnExit#getOnReason}
         * @param onReason Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_reason BatchJobDefinition#on_reason}.
         * @return {@code this}
         */
        public Builder onReason(java.lang.String onReason) {
            this.onReason = onReason;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionRetryStrategyEvaluateOnExit#getOnStatusReason}
         * @param onStatusReason Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#on_status_reason BatchJobDefinition#on_status_reason}.
         * @return {@code this}
         */
        public Builder onStatusReason(java.lang.String onStatusReason) {
            this.onStatusReason = onStatusReason;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionRetryStrategyEvaluateOnExit}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionRetryStrategyEvaluateOnExit build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionRetryStrategyEvaluateOnExit}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionRetryStrategyEvaluateOnExit {
        private final java.lang.String action;
        private final java.lang.String onExitCode;
        private final java.lang.String onReason;
        private final java.lang.String onStatusReason;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onExitCode = software.amazon.jsii.Kernel.get(this, "onExitCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onReason = software.amazon.jsii.Kernel.get(this, "onReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onStatusReason = software.amazon.jsii.Kernel.get(this, "onStatusReason", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.onExitCode = builder.onExitCode;
            this.onReason = builder.onReason;
            this.onStatusReason = builder.onStatusReason;
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getOnExitCode() {
            return this.onExitCode;
        }

        @Override
        public final java.lang.String getOnReason() {
            return this.onReason;
        }

        @Override
        public final java.lang.String getOnStatusReason() {
            return this.onStatusReason;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            if (this.getOnExitCode() != null) {
                data.set("onExitCode", om.valueToTree(this.getOnExitCode()));
            }
            if (this.getOnReason() != null) {
                data.set("onReason", om.valueToTree(this.getOnReason()));
            }
            if (this.getOnStatusReason() != null) {
                data.set("onStatusReason", om.valueToTree(this.getOnStatusReason()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionRetryStrategyEvaluateOnExit"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionRetryStrategyEvaluateOnExit.Jsii$Proxy that = (BatchJobDefinitionRetryStrategyEvaluateOnExit.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (this.onExitCode != null ? !this.onExitCode.equals(that.onExitCode) : that.onExitCode != null) return false;
            if (this.onReason != null ? !this.onReason.equals(that.onReason) : that.onReason != null) return false;
            return this.onStatusReason != null ? this.onStatusReason.equals(that.onStatusReason) : that.onStatusReason == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.onExitCode != null ? this.onExitCode.hashCode() : 0);
            result = 31 * result + (this.onReason != null ? this.onReason.hashCode() : 0);
            result = 31 * result + (this.onStatusReason != null ? this.onStatusReason.hashCode() : 0);
            return result;
        }
    }
}
