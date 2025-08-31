package imports.aws.data_aws_ecs_task_execution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.630Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionOverrides")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcsTaskExecutionOverrides.Jsii$Proxy.class)
public interface DataAwsEcsTaskExecutionOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * container_overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#container_overrides DataAwsEcsTaskExecution#container_overrides}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContainerOverrides() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cpu DataAwsEcsTaskExecution#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCpu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#execution_role_arn DataAwsEcsTaskExecution#execution_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArn() {
        return null;
    }

    /**
     * inference_accelerator_overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#inference_accelerator_overrides DataAwsEcsTaskExecution#inference_accelerator_overrides}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInferenceAcceleratorOverrides() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#memory DataAwsEcsTaskExecution#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMemory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#task_role_arn DataAwsEcsTaskExecution#task_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaskRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcsTaskExecutionOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcsTaskExecutionOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcsTaskExecutionOverrides> {
        java.lang.Object containerOverrides;
        java.lang.String cpu;
        java.lang.String executionRoleArn;
        java.lang.Object inferenceAcceleratorOverrides;
        java.lang.String memory;
        java.lang.String taskRoleArn;

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getContainerOverrides}
         * @param containerOverrides container_overrides block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#container_overrides DataAwsEcsTaskExecution#container_overrides}
         * @return {@code this}
         */
        public Builder containerOverrides(com.hashicorp.cdktf.IResolvable containerOverrides) {
            this.containerOverrides = containerOverrides;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getContainerOverrides}
         * @param containerOverrides container_overrides block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#container_overrides DataAwsEcsTaskExecution#container_overrides}
         * @return {@code this}
         */
        public Builder containerOverrides(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverridesContainerOverrides> containerOverrides) {
            this.containerOverrides = containerOverrides;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cpu DataAwsEcsTaskExecution#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.String cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#execution_role_arn DataAwsEcsTaskExecution#execution_role_arn}.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getInferenceAcceleratorOverrides}
         * @param inferenceAcceleratorOverrides inference_accelerator_overrides block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#inference_accelerator_overrides DataAwsEcsTaskExecution#inference_accelerator_overrides}
         * @return {@code this}
         */
        public Builder inferenceAcceleratorOverrides(com.hashicorp.cdktf.IResolvable inferenceAcceleratorOverrides) {
            this.inferenceAcceleratorOverrides = inferenceAcceleratorOverrides;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getInferenceAcceleratorOverrides}
         * @param inferenceAcceleratorOverrides inference_accelerator_overrides block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#inference_accelerator_overrides DataAwsEcsTaskExecution#inference_accelerator_overrides}
         * @return {@code this}
         */
        public Builder inferenceAcceleratorOverrides(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverridesInferenceAcceleratorOverrides> inferenceAcceleratorOverrides) {
            this.inferenceAcceleratorOverrides = inferenceAcceleratorOverrides;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#memory DataAwsEcsTaskExecution#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.String memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverrides#getTaskRoleArn}
         * @param taskRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#task_role_arn DataAwsEcsTaskExecution#task_role_arn}.
         * @return {@code this}
         */
        public Builder taskRoleArn(java.lang.String taskRoleArn) {
            this.taskRoleArn = taskRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcsTaskExecutionOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcsTaskExecutionOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcsTaskExecutionOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcsTaskExecutionOverrides {
        private final java.lang.Object containerOverrides;
        private final java.lang.String cpu;
        private final java.lang.String executionRoleArn;
        private final java.lang.Object inferenceAcceleratorOverrides;
        private final java.lang.String memory;
        private final java.lang.String taskRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerOverrides = software.amazon.jsii.Kernel.get(this, "containerOverrides", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inferenceAcceleratorOverrides = software.amazon.jsii.Kernel.get(this, "inferenceAcceleratorOverrides", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskRoleArn = software.amazon.jsii.Kernel.get(this, "taskRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerOverrides = builder.containerOverrides;
            this.cpu = builder.cpu;
            this.executionRoleArn = builder.executionRoleArn;
            this.inferenceAcceleratorOverrides = builder.inferenceAcceleratorOverrides;
            this.memory = builder.memory;
            this.taskRoleArn = builder.taskRoleArn;
        }

        @Override
        public final java.lang.Object getContainerOverrides() {
            return this.containerOverrides;
        }

        @Override
        public final java.lang.String getCpu() {
            return this.cpu;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.Object getInferenceAcceleratorOverrides() {
            return this.inferenceAcceleratorOverrides;
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

            if (this.getContainerOverrides() != null) {
                data.set("containerOverrides", om.valueToTree(this.getContainerOverrides()));
            }
            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getExecutionRoleArn() != null) {
                data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            }
            if (this.getInferenceAcceleratorOverrides() != null) {
                data.set("inferenceAcceleratorOverrides", om.valueToTree(this.getInferenceAcceleratorOverrides()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }
            if (this.getTaskRoleArn() != null) {
                data.set("taskRoleArn", om.valueToTree(this.getTaskRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcsTaskExecutionOverrides.Jsii$Proxy that = (DataAwsEcsTaskExecutionOverrides.Jsii$Proxy) o;

            if (this.containerOverrides != null ? !this.containerOverrides.equals(that.containerOverrides) : that.containerOverrides != null) return false;
            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            if (this.executionRoleArn != null ? !this.executionRoleArn.equals(that.executionRoleArn) : that.executionRoleArn != null) return false;
            if (this.inferenceAcceleratorOverrides != null ? !this.inferenceAcceleratorOverrides.equals(that.inferenceAcceleratorOverrides) : that.inferenceAcceleratorOverrides != null) return false;
            if (this.memory != null ? !this.memory.equals(that.memory) : that.memory != null) return false;
            return this.taskRoleArn != null ? this.taskRoleArn.equals(that.taskRoleArn) : that.taskRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerOverrides != null ? this.containerOverrides.hashCode() : 0;
            result = 31 * result + (this.cpu != null ? this.cpu.hashCode() : 0);
            result = 31 * result + (this.executionRoleArn != null ? this.executionRoleArn.hashCode() : 0);
            result = 31 * result + (this.inferenceAcceleratorOverrides != null ? this.inferenceAcceleratorOverrides.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            result = 31 * result + (this.taskRoleArn != null ? this.taskRoleArn.hashCode() : 0);
            return result;
        }
    }
}
