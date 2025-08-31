package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.070Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride.Jsii$Proxy.class)
public interface PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommand() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpu() {
        return null;
    }

    /**
     * environment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnvironment() {
        return null;
    }

    /**
     * environment_file block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment_file PipesPipe#environment_file}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnvironmentFile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory_reservation PipesPipe#memory_reservation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemoryReservation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * resource_requirement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResourceRequirement() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride> {
        java.util.List<java.lang.String> command;
        java.lang.Number cpu;
        java.lang.Object environment;
        java.lang.Object environmentFile;
        java.lang.Number memory;
        java.lang.Number memoryReservation;
        java.lang.String name;
        java.lang.Object resourceRequirement;

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getCommand}
         * @param command Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
         * @return {@code this}
         */
        public Builder command(java.util.List<java.lang.String> command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#cpu PipesPipe#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.Number cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
         * @return {@code this}
         */
        public Builder environment(com.hashicorp.cdktf.IResolvable environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
         * @return {@code this}
         */
        public Builder environment(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironment> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getEnvironmentFile}
         * @param environmentFile environment_file block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment_file PipesPipe#environment_file}
         * @return {@code this}
         */
        public Builder environmentFile(com.hashicorp.cdktf.IResolvable environmentFile) {
            this.environmentFile = environmentFile;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getEnvironmentFile}
         * @param environmentFile environment_file block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment_file PipesPipe#environment_file}
         * @return {@code this}
         */
        public Builder environmentFile(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideEnvironmentFile> environmentFile) {
            this.environmentFile = environmentFile;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory PipesPipe#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.Number memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getMemoryReservation}
         * @param memoryReservation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#memory_reservation PipesPipe#memory_reservation}.
         * @return {@code this}
         */
        public Builder memoryReservation(java.lang.Number memoryReservation) {
            this.memoryReservation = memoryReservation;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#name PipesPipe#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getResourceRequirement}
         * @param resourceRequirement resource_requirement block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
         * @return {@code this}
         */
        public Builder resourceRequirement(com.hashicorp.cdktf.IResolvable resourceRequirement) {
            this.resourceRequirement = resourceRequirement;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride#getResourceRequirement}
         * @param resourceRequirement resource_requirement block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
         * @return {@code this}
         */
        public Builder resourceRequirement(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverrideResourceRequirement> resourceRequirement) {
            this.resourceRequirement = resourceRequirement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride {
        private final java.util.List<java.lang.String> command;
        private final java.lang.Number cpu;
        private final java.lang.Object environment;
        private final java.lang.Object environmentFile;
        private final java.lang.Number memory;
        private final java.lang.Number memoryReservation;
        private final java.lang.String name;
        private final java.lang.Object resourceRequirement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.environmentFile = software.amazon.jsii.Kernel.get(this, "environmentFile", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memoryReservation = software.amazon.jsii.Kernel.get(this, "memoryReservation", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceRequirement = software.amazon.jsii.Kernel.get(this, "resourceRequirement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.command = builder.command;
            this.cpu = builder.cpu;
            this.environment = builder.environment;
            this.environmentFile = builder.environmentFile;
            this.memory = builder.memory;
            this.memoryReservation = builder.memoryReservation;
            this.name = builder.name;
            this.resourceRequirement = builder.resourceRequirement;
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
        public final java.lang.Object getEnvironmentFile() {
            return this.environmentFile;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getResourceRequirement() {
            return this.resourceRequirement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCommand() != null) {
                data.set("command", om.valueToTree(this.getCommand()));
            }
            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getEnvironmentFile() != null) {
                data.set("environmentFile", om.valueToTree(this.getEnvironmentFile()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }
            if (this.getMemoryReservation() != null) {
                data.set("memoryReservation", om.valueToTree(this.getMemoryReservation()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getResourceRequirement() != null) {
                data.set("resourceRequirement", om.valueToTree(this.getResourceRequirement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride.Jsii$Proxy that = (PipesPipeTargetParametersEcsTaskParametersOverridesContainerOverride.Jsii$Proxy) o;

            if (this.command != null ? !this.command.equals(that.command) : that.command != null) return false;
            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.environmentFile != null ? !this.environmentFile.equals(that.environmentFile) : that.environmentFile != null) return false;
            if (this.memory != null ? !this.memory.equals(that.memory) : that.memory != null) return false;
            if (this.memoryReservation != null ? !this.memoryReservation.equals(that.memoryReservation) : that.memoryReservation != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            return this.resourceRequirement != null ? this.resourceRequirement.equals(that.resourceRequirement) : that.resourceRequirement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.command != null ? this.command.hashCode() : 0;
            result = 31 * result + (this.cpu != null ? this.cpu.hashCode() : 0);
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.environmentFile != null ? this.environmentFile.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            result = 31 * result + (this.memoryReservation != null ? this.memoryReservation.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.resourceRequirement != null ? this.resourceRequirement.hashCode() : 0);
            return result;
        }
    }
}
