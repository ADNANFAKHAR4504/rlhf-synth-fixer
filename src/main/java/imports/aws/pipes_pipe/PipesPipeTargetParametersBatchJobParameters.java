package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersBatchJobParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersBatchJobParameters.Jsii$Proxy.class)
public interface PipesPipeTargetParametersBatchJobParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_definition PipesPipe#job_definition}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJobDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_name PipesPipe#job_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJobName();

    /**
     * array_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#array_properties PipesPipe#array_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties getArrayProperties() {
        return null;
    }

    /**
     * container_overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_overrides PipesPipe#container_overrides}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides getContainerOverrides() {
        return null;
    }

    /**
     * depends_on block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#depends_on PipesPipe#depends_on}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDependsOn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parameters PipesPipe#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * retry_strategy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#retry_strategy PipesPipe#retry_strategy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy getRetryStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersBatchJobParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersBatchJobParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersBatchJobParameters> {
        java.lang.String jobDefinition;
        java.lang.String jobName;
        imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties arrayProperties;
        imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides containerOverrides;
        java.lang.Object dependsOn;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy retryStrategy;

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getJobDefinition}
         * @param jobDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_definition PipesPipe#job_definition}. This parameter is required.
         * @return {@code this}
         */
        public Builder jobDefinition(java.lang.String jobDefinition) {
            this.jobDefinition = jobDefinition;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getJobName}
         * @param jobName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#job_name PipesPipe#job_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder jobName(java.lang.String jobName) {
            this.jobName = jobName;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getArrayProperties}
         * @param arrayProperties array_properties block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#array_properties PipesPipe#array_properties}
         * @return {@code this}
         */
        public Builder arrayProperties(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties arrayProperties) {
            this.arrayProperties = arrayProperties;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getContainerOverrides}
         * @param containerOverrides container_overrides block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_overrides PipesPipe#container_overrides}
         * @return {@code this}
         */
        public Builder containerOverrides(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides containerOverrides) {
            this.containerOverrides = containerOverrides;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getDependsOn}
         * @param dependsOn depends_on block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#depends_on PipesPipe#depends_on}
         * @return {@code this}
         */
        public Builder dependsOn(com.hashicorp.cdktf.IResolvable dependsOn) {
            this.dependsOn = dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getDependsOn}
         * @param dependsOn depends_on block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#depends_on PipesPipe#depends_on}
         * @return {@code this}
         */
        public Builder dependsOn(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersDependsOn> dependsOn) {
            this.dependsOn = dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#parameters PipesPipe#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParameters#getRetryStrategy}
         * @param retryStrategy retry_strategy block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#retry_strategy PipesPipe#retry_strategy}
         * @return {@code this}
         */
        public Builder retryStrategy(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy retryStrategy) {
            this.retryStrategy = retryStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersBatchJobParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersBatchJobParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersBatchJobParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersBatchJobParameters {
        private final java.lang.String jobDefinition;
        private final java.lang.String jobName;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties arrayProperties;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides containerOverrides;
        private final java.lang.Object dependsOn;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy retryStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.jobDefinition = software.amazon.jsii.Kernel.get(this, "jobDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobName = software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.arrayProperties = software.amazon.jsii.Kernel.get(this, "arrayProperties", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties.class));
            this.containerOverrides = software.amazon.jsii.Kernel.get(this, "containerOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.retryStrategy = software.amazon.jsii.Kernel.get(this, "retryStrategy", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.jobDefinition = java.util.Objects.requireNonNull(builder.jobDefinition, "jobDefinition is required");
            this.jobName = java.util.Objects.requireNonNull(builder.jobName, "jobName is required");
            this.arrayProperties = builder.arrayProperties;
            this.containerOverrides = builder.containerOverrides;
            this.dependsOn = builder.dependsOn;
            this.parameters = builder.parameters;
            this.retryStrategy = builder.retryStrategy;
        }

        @Override
        public final java.lang.String getJobDefinition() {
            return this.jobDefinition;
        }

        @Override
        public final java.lang.String getJobName() {
            return this.jobName;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersArrayProperties getArrayProperties() {
            return this.arrayProperties;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides getContainerOverrides() {
            return this.containerOverrides;
        }

        @Override
        public final java.lang.Object getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersRetryStrategy getRetryStrategy() {
            return this.retryStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("jobDefinition", om.valueToTree(this.getJobDefinition()));
            data.set("jobName", om.valueToTree(this.getJobName()));
            if (this.getArrayProperties() != null) {
                data.set("arrayProperties", om.valueToTree(this.getArrayProperties()));
            }
            if (this.getContainerOverrides() != null) {
                data.set("containerOverrides", om.valueToTree(this.getContainerOverrides()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getRetryStrategy() != null) {
                data.set("retryStrategy", om.valueToTree(this.getRetryStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersBatchJobParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersBatchJobParameters.Jsii$Proxy that = (PipesPipeTargetParametersBatchJobParameters.Jsii$Proxy) o;

            if (!jobDefinition.equals(that.jobDefinition)) return false;
            if (!jobName.equals(that.jobName)) return false;
            if (this.arrayProperties != null ? !this.arrayProperties.equals(that.arrayProperties) : that.arrayProperties != null) return false;
            if (this.containerOverrides != null ? !this.containerOverrides.equals(that.containerOverrides) : that.containerOverrides != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            return this.retryStrategy != null ? this.retryStrategy.equals(that.retryStrategy) : that.retryStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.jobDefinition.hashCode();
            result = 31 * result + (this.jobName.hashCode());
            result = 31 * result + (this.arrayProperties != null ? this.arrayProperties.hashCode() : 0);
            result = 31 * result + (this.containerOverrides != null ? this.containerOverrides.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.retryStrategy != null ? this.retryStrategy.hashCode() : 0);
            return result;
        }
    }
}
