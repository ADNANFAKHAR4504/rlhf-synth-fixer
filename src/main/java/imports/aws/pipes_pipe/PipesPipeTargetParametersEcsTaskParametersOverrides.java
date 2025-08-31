package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverrides")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersEcsTaskParametersOverrides.Jsii$Proxy.class)
public interface PipesPipeTargetParametersEcsTaskParametersOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * container_override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_override PipesPipe#container_override}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContainerOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCpu() {
        return null;
    }

    /**
     * ephemeral_storage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ephemeral_storage PipesPipe#ephemeral_storage}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage getEphemeralStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#execution_role_arn PipesPipe#execution_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArn() {
        return null;
    }

    /**
     * inference_accelerator_override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#inference_accelerator_override PipesPipe#inference_accelerator_override}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInferenceAcceleratorOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMemory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_role_arn PipesPipe#task_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaskRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersEcsTaskParametersOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersEcsTaskParametersOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersEcsTaskParametersOverrides> {
        java.lang.Object containerOverride;
        java.lang.String cpu;
        imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage ephemeralStorage;
        java.lang.String executionRoleArn;
        java.lang.Object inferenceAcceleratorOverride;
        java.lang.String memory;
        java.lang.String taskRoleArn;

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getContainerOverride}
         * @param containerOverride container_override block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_override PipesPipe#container_override}
         * @return {@code this}
         */
        public Builder containerOverride(com.hashicorp.cdktf.IResolvable containerOverride) {
            this.containerOverride = containerOverride;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getContainerOverride}
         * @param containerOverride container_override block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#container_override PipesPipe#container_override}
         * @return {@code this}
         */
        public Builder containerOverride(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride> containerOverride) {
            this.containerOverride = containerOverride;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.String cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getEphemeralStorage}
         * @param ephemeralStorage ephemeral_storage block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#ephemeral_storage PipesPipe#ephemeral_storage}
         * @return {@code this}
         */
        public Builder ephemeralStorage(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage ephemeralStorage) {
            this.ephemeralStorage = ephemeralStorage;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#execution_role_arn PipesPipe#execution_role_arn}.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getInferenceAcceleratorOverride}
         * @param inferenceAcceleratorOverride inference_accelerator_override block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#inference_accelerator_override PipesPipe#inference_accelerator_override}
         * @return {@code this}
         */
        public Builder inferenceAcceleratorOverride(com.hashicorp.cdktf.IResolvable inferenceAcceleratorOverride) {
            this.inferenceAcceleratorOverride = inferenceAcceleratorOverride;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getInferenceAcceleratorOverride}
         * @param inferenceAcceleratorOverride inference_accelerator_override block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#inference_accelerator_override PipesPipe#inference_accelerator_override}
         * @return {@code this}
         */
        public Builder inferenceAcceleratorOverride(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesInferenceAcceleratorOverride> inferenceAcceleratorOverride) {
            this.inferenceAcceleratorOverride = inferenceAcceleratorOverride;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.String memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverrides#getTaskRoleArn}
         * @param taskRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#task_role_arn PipesPipe#task_role_arn}.
         * @return {@code this}
         */
        public Builder taskRoleArn(java.lang.String taskRoleArn) {
            this.taskRoleArn = taskRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersEcsTaskParametersOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersEcsTaskParametersOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersEcsTaskParametersOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersEcsTaskParametersOverrides {
        private final java.lang.Object containerOverride;
        private final java.lang.String cpu;
        private final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage ephemeralStorage;
        private final java.lang.String executionRoleArn;
        private final java.lang.Object inferenceAcceleratorOverride;
        private final java.lang.String memory;
        private final java.lang.String taskRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerOverride = software.amazon.jsii.Kernel.get(this, "containerOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ephemeralStorage = software.amazon.jsii.Kernel.get(this, "ephemeralStorage", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage.class));
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inferenceAcceleratorOverride = software.amazon.jsii.Kernel.get(this, "inferenceAcceleratorOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskRoleArn = software.amazon.jsii.Kernel.get(this, "taskRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerOverride = builder.containerOverride;
            this.cpu = builder.cpu;
            this.ephemeralStorage = builder.ephemeralStorage;
            this.executionRoleArn = builder.executionRoleArn;
            this.inferenceAcceleratorOverride = builder.inferenceAcceleratorOverride;
            this.memory = builder.memory;
            this.taskRoleArn = builder.taskRoleArn;
        }

        @Override
        public final java.lang.Object getContainerOverride() {
            return this.containerOverride;
        }

        @Override
        public final java.lang.String getCpu() {
            return this.cpu;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesEphemeralStorage getEphemeralStorage() {
            return this.ephemeralStorage;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.Object getInferenceAcceleratorOverride() {
            return this.inferenceAcceleratorOverride;
        }

        @Override
        public final java.lang.String getMemory() {
            return this.memory;
        }

        @Override
        public final java.lang.String getTaskRoleArn() {
            return this.taskRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainerOverride() != null) {
                data.set("containerOverride", om.valueToTree(this.getContainerOverride()));
            }
            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getEphemeralStorage() != null) {
                data.set("ephemeralStorage", om.valueToTree(this.getEphemeralStorage()));
            }
            if (this.getExecutionRoleArn() != null) {
                data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            }
            if (this.getInferenceAcceleratorOverride() != null) {
                data.set("inferenceAcceleratorOverride", om.valueToTree(this.getInferenceAcceleratorOverride()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }
            if (this.getTaskRoleArn() != null) {
                data.set("taskRoleArn", om.valueToTree(this.getTaskRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersEcsTaskParametersOverrides.Jsii$Proxy that = (PipesPipeTargetParametersEcsTaskParametersOverrides.Jsii$Proxy) o;

            if (this.containerOverride != null ? !this.containerOverride.equals(that.containerOverride) : that.containerOverride != null) return false;
            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            if (this.ephemeralStorage != null ? !this.ephemeralStorage.equals(that.ephemeralStorage) : that.ephemeralStorage != null) return false;
            if (this.executionRoleArn != null ? !this.executionRoleArn.equals(that.executionRoleArn) : that.executionRoleArn != null) return false;
            if (this.inferenceAcceleratorOverride != null ? !this.inferenceAcceleratorOverride.equals(that.inferenceAcceleratorOverride) : that.inferenceAcceleratorOverride != null) return false;
            if (this.memory != null ? !this.memory.equals(that.memory) : that.memory != null) return false;
            return this.taskRoleArn != null ? this.taskRoleArn.equals(that.taskRoleArn) : that.taskRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerOverride != null ? this.containerOverride.hashCode() : 0;
            result = 31 * result + (this.cpu != null ? this.cpu.hashCode() : 0);
            result = 31 * result + (this.ephemeralStorage != null ? this.ephemeralStorage.hashCode() : 0);
            result = 31 * result + (this.executionRoleArn != null ? this.executionRoleArn.hashCode() : 0);
            result = 31 * result + (this.inferenceAcceleratorOverride != null ? this.inferenceAcceleratorOverride.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            result = 31 * result + (this.taskRoleArn != null ? this.taskRoleArn.hashCode() : 0);
            return result;
        }
    }
}
