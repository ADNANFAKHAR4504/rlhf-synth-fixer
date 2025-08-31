package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.069Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides")
@software.amazon.jsii.Jsii.Proxy(PipesPipeTargetParametersBatchJobParametersContainerOverrides.Jsii$Proxy.class)
public interface PipesPipeTargetParametersBatchJobParametersContainerOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCommand() {
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
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#instance_type PipesPipe#instance_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceType() {
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
     * @return a {@link Builder} of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeTargetParametersBatchJobParametersContainerOverrides> {
        java.util.List<java.lang.String> command;
        java.lang.Object environment;
        java.lang.String instanceType;
        java.lang.Object resourceRequirement;

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides#getCommand}
         * @param command Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#command PipesPipe#command}.
         * @return {@code this}
         */
        public Builder command(java.util.List<java.lang.String> command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
         * @return {@code this}
         */
        public Builder environment(com.hashicorp.cdktf.IResolvable environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#environment PipesPipe#environment}
         * @return {@code this}
         */
        public Builder environment(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesEnvironment> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#instance_type PipesPipe#instance_type}.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides#getResourceRequirement}
         * @param resourceRequirement resource_requirement block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
         * @return {@code this}
         */
        public Builder resourceRequirement(com.hashicorp.cdktf.IResolvable resourceRequirement) {
            this.resourceRequirement = resourceRequirement;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides#getResourceRequirement}
         * @param resourceRequirement resource_requirement block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#resource_requirement PipesPipe#resource_requirement}
         * @return {@code this}
         */
        public Builder resourceRequirement(java.util.List<? extends imports.aws.pipes_pipe.PipesPipeTargetParametersBatchJobParametersContainerOverridesResourceRequirement> resourceRequirement) {
            this.resourceRequirement = resourceRequirement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeTargetParametersBatchJobParametersContainerOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeTargetParametersBatchJobParametersContainerOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeTargetParametersBatchJobParametersContainerOverrides {
        private final java.util.List<java.lang.String> command;
        private final java.lang.Object environment;
        private final java.lang.String instanceType;
        private final java.lang.Object resourceRequirement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceRequirement = software.amazon.jsii.Kernel.get(this, "resourceRequirement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.command = builder.command;
            this.environment = builder.environment;
            this.instanceType = builder.instanceType;
            this.resourceRequirement = builder.resourceRequirement;
        }

        @Override
        public final java.util.List<java.lang.String> getCommand() {
            return this.command;
        }

        @Override
        public final java.lang.Object getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
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
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getInstanceType() != null) {
                data.set("instanceType", om.valueToTree(this.getInstanceType()));
            }
            if (this.getResourceRequirement() != null) {
                data.set("resourceRequirement", om.valueToTree(this.getResourceRequirement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeTargetParametersBatchJobParametersContainerOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeTargetParametersBatchJobParametersContainerOverrides.Jsii$Proxy that = (PipesPipeTargetParametersBatchJobParametersContainerOverrides.Jsii$Proxy) o;

            if (this.command != null ? !this.command.equals(that.command) : that.command != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.instanceType != null ? !this.instanceType.equals(that.instanceType) : that.instanceType != null) return false;
            return this.resourceRequirement != null ? this.resourceRequirement.equals(that.resourceRequirement) : that.resourceRequirement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.command != null ? this.command.hashCode() : 0;
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.instanceType != null ? this.instanceType.hashCode() : 0);
            result = 31 * result + (this.resourceRequirement != null ? this.resourceRequirement.hashCode() : 0);
            return result;
        }
    }
}
