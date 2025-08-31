package imports.aws.data_aws_ecs_task_execution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.631Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionOverridesContainerOverrides")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcsTaskExecutionOverridesContainerOverrides.Jsii$Proxy.class)
public interface DataAwsEcsTaskExecutionOverridesContainerOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#name DataAwsEcsTaskExecution#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#command DataAwsEcsTaskExecution#command}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommand() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cpu DataAwsEcsTaskExecution#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpu() {
        return null;
    }

    /**
     * environment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#environment DataAwsEcsTaskExecution#environment}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnvironment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#memory DataAwsEcsTaskExecution#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#memory_reservation DataAwsEcsTaskExecution#memory_reservation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemoryReservation() {
        return null;
    }

    /**
     * resource_requirements block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#resource_requirements DataAwsEcsTaskExecution#resource_requirements}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResourceRequirements() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcsTaskExecutionOverridesContainerOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcsTaskExecutionOverridesContainerOverrides> {
        java.lang.String name;
        java.util.List<java.lang.String> command;
        java.lang.Number cpu;
        java.lang.Object environment;
        java.lang.Number memory;
        java.lang.Number memoryReservation;
        java.lang.Object resourceRequirements;

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#name DataAwsEcsTaskExecution#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getCommand}
         * @param command Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#command DataAwsEcsTaskExecution#command}.
         * @return {@code this}
         */
        public Builder command(java.util.List<java.lang.String> command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#cpu DataAwsEcsTaskExecution#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.Number cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#environment DataAwsEcsTaskExecution#environment}
         * @return {@code this}
         */
        public Builder environment(com.hashicorp.cdktf.IResolvable environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#environment DataAwsEcsTaskExecution#environment}
         * @return {@code this}
         */
        public Builder environment(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverridesContainerOverridesEnvironment> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#memory DataAwsEcsTaskExecution#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.Number memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getMemoryReservation}
         * @param memoryReservation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#memory_reservation DataAwsEcsTaskExecution#memory_reservation}.
         * @return {@code this}
         */
        public Builder memoryReservation(java.lang.Number memoryReservation) {
            this.memoryReservation = memoryReservation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getResourceRequirements}
         * @param resourceRequirements resource_requirements block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#resource_requirements DataAwsEcsTaskExecution#resource_requirements}
         * @return {@code this}
         */
        public Builder resourceRequirements(com.hashicorp.cdktf.IResolvable resourceRequirements) {
            this.resourceRequirements = resourceRequirements;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides#getResourceRequirements}
         * @param resourceRequirements resource_requirements block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#resource_requirements DataAwsEcsTaskExecution#resource_requirements}
         * @return {@code this}
         */
        public Builder resourceRequirements(java.util.List<? extends imports.aws.data_aws_ecs_task_execution.DataAwsEcsTaskExecutionOverridesContainerOverridesResourceRequirements> resourceRequirements) {
            this.resourceRequirements = resourceRequirements;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcsTaskExecutionOverridesContainerOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcsTaskExecutionOverridesContainerOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcsTaskExecutionOverridesContainerOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcsTaskExecutionOverridesContainerOverrides {
        private final java.lang.String name;
        private final java.util.List<java.lang.String> command;
        private final java.lang.Number cpu;
        private final java.lang.Object environment;
        private final java.lang.Number memory;
        private final java.lang.Number memoryReservation;
        private final java.lang.Object resourceRequirements;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memoryReservation = software.amazon.jsii.Kernel.get(this, "memoryReservation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.resourceRequirements = software.amazon.jsii.Kernel.get(this, "resourceRequirements", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.command = builder.command;
            this.cpu = builder.cpu;
            this.environment = builder.environment;
            this.memory = builder.memory;
            this.memoryReservation = builder.memoryReservation;
            this.resourceRequirements = builder.resourceRequirements;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getCommand() {
            return this.command;
        }

        @Override
        public final java.lang.Number getCpu() {
            return this.cpu;
        }

        @Override
        public final java.lang.Object getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.lang.Number getMemory() {
            return this.memory;
        }

        @Override
        public final java.lang.Number getMemoryReservation() {
            return this.memoryReservation;
        }

        @Override
        public final java.lang.Object getResourceRequirements() {
            return this.resourceRequirements;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getCommand() != null) {
                data.set("command", om.valueToTree(this.getCommand()));
            }
            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }
            if (this.getMemoryReservation() != null) {
                data.set("memoryReservation", om.valueToTree(this.getMemoryReservation()));
            }
            if (this.getResourceRequirements() != null) {
                data.set("resourceRequirements", om.valueToTree(this.getResourceRequirements()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionOverridesContainerOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcsTaskExecutionOverridesContainerOverrides.Jsii$Proxy that = (DataAwsEcsTaskExecutionOverridesContainerOverrides.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.command != null ? !this.command.equals(that.command) : that.command != null) return false;
            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.memory != null ? !this.memory.equals(that.memory) : that.memory != null) return false;
            if (this.memoryReservation != null ? !this.memoryReservation.equals(that.memoryReservation) : that.memoryReservation != null) return false;
            return this.resourceRequirements != null ? this.resourceRequirements.equals(that.resourceRequirements) : that.resourceRequirements == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.command != null ? this.command.hashCode() : 0);
            result = 31 * result + (this.cpu != null ? this.cpu.hashCode() : 0);
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            result = 31 * result + (this.memoryReservation != null ? this.memoryReservation.hashCode() : 0);
            result = 31 * result + (this.resourceRequirements != null ? this.resourceRequirements.hashCode() : 0);
            return result;
        }
    }
}
