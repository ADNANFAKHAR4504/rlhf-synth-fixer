package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersKinesisStreamParameters.Jsii$Proxy.class)
public interface PipesPipeSourceParametersKinesisStreamParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStartingPosition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBatchSize() {
        return null;
    }

    /**
     * dead_letter_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig getDeadLetterConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumRecordAgeInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumRetryAttempts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOnPartialBatchItemFailure() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getParallelizationFactor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position_timestamp PipesPipe#starting_position_timestamp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartingPositionTimestamp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersKinesisStreamParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersKinesisStreamParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersKinesisStreamParameters> {
        java.lang.String startingPosition;
        java.lang.Number batchSize;
        imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig deadLetterConfig;
        java.lang.Number maximumBatchingWindowInSeconds;
        java.lang.Number maximumRecordAgeInSeconds;
        java.lang.Number maximumRetryAttempts;
        java.lang.String onPartialBatchItemFailure;
        java.lang.Number parallelizationFactor;
        java.lang.String startingPositionTimestamp;

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getStartingPosition}
         * @param startingPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position PipesPipe#starting_position}. This parameter is required.
         * @return {@code this}
         */
        public Builder startingPosition(java.lang.String startingPosition) {
            this.startingPosition = startingPosition;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getBatchSize}
         * @param batchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#batch_size PipesPipe#batch_size}.
         * @return {@code this}
         */
        public Builder batchSize(java.lang.Number batchSize) {
            this.batchSize = batchSize;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getDeadLetterConfig}
         * @param deadLetterConfig dead_letter_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dead_letter_config PipesPipe#dead_letter_config}
         * @return {@code this}
         */
        public Builder deadLetterConfig(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig deadLetterConfig) {
            this.deadLetterConfig = deadLetterConfig;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getMaximumBatchingWindowInSeconds}
         * @param maximumBatchingWindowInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_batching_window_in_seconds PipesPipe#maximum_batching_window_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumBatchingWindowInSeconds(java.lang.Number maximumBatchingWindowInSeconds) {
            this.maximumBatchingWindowInSeconds = maximumBatchingWindowInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getMaximumRecordAgeInSeconds}
         * @param maximumRecordAgeInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_record_age_in_seconds PipesPipe#maximum_record_age_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumRecordAgeInSeconds(java.lang.Number maximumRecordAgeInSeconds) {
            this.maximumRecordAgeInSeconds = maximumRecordAgeInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getMaximumRetryAttempts}
         * @param maximumRetryAttempts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#maximum_retry_attempts PipesPipe#maximum_retry_attempts}.
         * @return {@code this}
         */
        public Builder maximumRetryAttempts(java.lang.Number maximumRetryAttempts) {
            this.maximumRetryAttempts = maximumRetryAttempts;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getOnPartialBatchItemFailure}
         * @param onPartialBatchItemFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#on_partial_batch_item_failure PipesPipe#on_partial_batch_item_failure}.
         * @return {@code this}
         */
        public Builder onPartialBatchItemFailure(java.lang.String onPartialBatchItemFailure) {
            this.onPartialBatchItemFailure = onPartialBatchItemFailure;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getParallelizationFactor}
         * @param parallelizationFactor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parallelization_factor PipesPipe#parallelization_factor}.
         * @return {@code this}
         */
        public Builder parallelizationFactor(java.lang.Number parallelizationFactor) {
            this.parallelizationFactor = parallelizationFactor;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParametersKinesisStreamParameters#getStartingPositionTimestamp}
         * @param startingPositionTimestamp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#starting_position_timestamp PipesPipe#starting_position_timestamp}.
         * @return {@code this}
         */
        public Builder startingPositionTimestamp(java.lang.String startingPositionTimestamp) {
            this.startingPositionTimestamp = startingPositionTimestamp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersKinesisStreamParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersKinesisStreamParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersKinesisStreamParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersKinesisStreamParameters {
        private final java.lang.String startingPosition;
        private final java.lang.Number batchSize;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig deadLetterConfig;
        private final java.lang.Number maximumBatchingWindowInSeconds;
        private final java.lang.Number maximumRecordAgeInSeconds;
        private final java.lang.Number maximumRetryAttempts;
        private final java.lang.String onPartialBatchItemFailure;
        private final java.lang.Number parallelizationFactor;
        private final java.lang.String startingPositionTimestamp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.startingPosition = software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.batchSize = software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.deadLetterConfig = software.amazon.jsii.Kernel.get(this, "deadLetterConfig", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig.class));
            this.maximumBatchingWindowInSeconds = software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumRecordAgeInSeconds = software.amazon.jsii.Kernel.get(this, "maximumRecordAgeInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumRetryAttempts = software.amazon.jsii.Kernel.get(this, "maximumRetryAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.onPartialBatchItemFailure = software.amazon.jsii.Kernel.get(this, "onPartialBatchItemFailure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parallelizationFactor = software.amazon.jsii.Kernel.get(this, "parallelizationFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.startingPositionTimestamp = software.amazon.jsii.Kernel.get(this, "startingPositionTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.startingPosition = java.util.Objects.requireNonNull(builder.startingPosition, "startingPosition is required");
            this.batchSize = builder.batchSize;
            this.deadLetterConfig = builder.deadLetterConfig;
            this.maximumBatchingWindowInSeconds = builder.maximumBatchingWindowInSeconds;
            this.maximumRecordAgeInSeconds = builder.maximumRecordAgeInSeconds;
            this.maximumRetryAttempts = builder.maximumRetryAttempts;
            this.onPartialBatchItemFailure = builder.onPartialBatchItemFailure;
            this.parallelizationFactor = builder.parallelizationFactor;
            this.startingPositionTimestamp = builder.startingPositionTimestamp;
        }

        @Override
        public final java.lang.String getStartingPosition() {
            return this.startingPosition;
        }

        @Override
        public final java.lang.Number getBatchSize() {
            return this.batchSize;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersDeadLetterConfig getDeadLetterConfig() {
            return this.deadLetterConfig;
        }

        @Override
        public final java.lang.Number getMaximumBatchingWindowInSeconds() {
            return this.maximumBatchingWindowInSeconds;
        }

        @Override
        public final java.lang.Number getMaximumRecordAgeInSeconds() {
            return this.maximumRecordAgeInSeconds;
        }

        @Override
        public final java.lang.Number getMaximumRetryAttempts() {
            return this.maximumRetryAttempts;
        }

        @Override
        public final java.lang.String getOnPartialBatchItemFailure() {
            return this.onPartialBatchItemFailure;
        }

        @Override
        public final java.lang.Number getParallelizationFactor() {
            return this.parallelizationFactor;
        }

        @Override
        public final java.lang.String getStartingPositionTimestamp() {
            return this.startingPositionTimestamp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("startingPosition", om.valueToTree(this.getStartingPosition()));
            if (this.getBatchSize() != null) {
                data.set("batchSize", om.valueToTree(this.getBatchSize()));
            }
            if (this.getDeadLetterConfig() != null) {
                data.set("deadLetterConfig", om.valueToTree(this.getDeadLetterConfig()));
            }
            if (this.getMaximumBatchingWindowInSeconds() != null) {
                data.set("maximumBatchingWindowInSeconds", om.valueToTree(this.getMaximumBatchingWindowInSeconds()));
            }
            if (this.getMaximumRecordAgeInSeconds() != null) {
                data.set("maximumRecordAgeInSeconds", om.valueToTree(this.getMaximumRecordAgeInSeconds()));
            }
            if (this.getMaximumRetryAttempts() != null) {
                data.set("maximumRetryAttempts", om.valueToTree(this.getMaximumRetryAttempts()));
            }
            if (this.getOnPartialBatchItemFailure() != null) {
                data.set("onPartialBatchItemFailure", om.valueToTree(this.getOnPartialBatchItemFailure()));
            }
            if (this.getParallelizationFactor() != null) {
                data.set("parallelizationFactor", om.valueToTree(this.getParallelizationFactor()));
            }
            if (this.getStartingPositionTimestamp() != null) {
                data.set("startingPositionTimestamp", om.valueToTree(this.getStartingPositionTimestamp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersKinesisStreamParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersKinesisStreamParameters.Jsii$Proxy that = (PipesPipeSourceParametersKinesisStreamParameters.Jsii$Proxy) o;

            if (!startingPosition.equals(that.startingPosition)) return false;
            if (this.batchSize != null ? !this.batchSize.equals(that.batchSize) : that.batchSize != null) return false;
            if (this.deadLetterConfig != null ? !this.deadLetterConfig.equals(that.deadLetterConfig) : that.deadLetterConfig != null) return false;
            if (this.maximumBatchingWindowInSeconds != null ? !this.maximumBatchingWindowInSeconds.equals(that.maximumBatchingWindowInSeconds) : that.maximumBatchingWindowInSeconds != null) return false;
            if (this.maximumRecordAgeInSeconds != null ? !this.maximumRecordAgeInSeconds.equals(that.maximumRecordAgeInSeconds) : that.maximumRecordAgeInSeconds != null) return false;
            if (this.maximumRetryAttempts != null ? !this.maximumRetryAttempts.equals(that.maximumRetryAttempts) : that.maximumRetryAttempts != null) return false;
            if (this.onPartialBatchItemFailure != null ? !this.onPartialBatchItemFailure.equals(that.onPartialBatchItemFailure) : that.onPartialBatchItemFailure != null) return false;
            if (this.parallelizationFactor != null ? !this.parallelizationFactor.equals(that.parallelizationFactor) : that.parallelizationFactor != null) return false;
            return this.startingPositionTimestamp != null ? this.startingPositionTimestamp.equals(that.startingPositionTimestamp) : that.startingPositionTimestamp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.startingPosition.hashCode();
            result = 31 * result + (this.batchSize != null ? this.batchSize.hashCode() : 0);
            result = 31 * result + (this.deadLetterConfig != null ? this.deadLetterConfig.hashCode() : 0);
            result = 31 * result + (this.maximumBatchingWindowInSeconds != null ? this.maximumBatchingWindowInSeconds.hashCode() : 0);
            result = 31 * result + (this.maximumRecordAgeInSeconds != null ? this.maximumRecordAgeInSeconds.hashCode() : 0);
            result = 31 * result + (this.maximumRetryAttempts != null ? this.maximumRetryAttempts.hashCode() : 0);
            result = 31 * result + (this.onPartialBatchItemFailure != null ? this.onPartialBatchItemFailure.hashCode() : 0);
            result = 31 * result + (this.parallelizationFactor != null ? this.parallelizationFactor.hashCode() : 0);
            result = 31 * result + (this.startingPositionTimestamp != null ? this.startingPositionTimestamp.hashCode() : 0);
            return result;
        }
    }
}
