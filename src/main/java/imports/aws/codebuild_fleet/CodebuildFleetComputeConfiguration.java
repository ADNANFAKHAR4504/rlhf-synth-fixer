package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetComputeConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodebuildFleetComputeConfiguration.Jsii$Proxy.class)
public interface CodebuildFleetComputeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#disk CodebuildFleet#disk}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDisk() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#machine_type CodebuildFleet#machine_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMachineType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#memory CodebuildFleet#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vcpu CodebuildFleet#vcpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVcpu() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildFleetComputeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildFleetComputeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildFleetComputeConfiguration> {
        java.lang.Number disk;
        java.lang.String machineType;
        java.lang.Number memory;
        java.lang.Number vcpu;

        /**
         * Sets the value of {@link CodebuildFleetComputeConfiguration#getDisk}
         * @param disk Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#disk CodebuildFleet#disk}.
         * @return {@code this}
         */
        public Builder disk(java.lang.Number disk) {
            this.disk = disk;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetComputeConfiguration#getMachineType}
         * @param machineType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#machine_type CodebuildFleet#machine_type}.
         * @return {@code this}
         */
        public Builder machineType(java.lang.String machineType) {
            this.machineType = machineType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetComputeConfiguration#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#memory CodebuildFleet#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.Number memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetComputeConfiguration#getVcpu}
         * @param vcpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vcpu CodebuildFleet#vcpu}.
         * @return {@code this}
         */
        public Builder vcpu(java.lang.Number vcpu) {
            this.vcpu = vcpu;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildFleetComputeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildFleetComputeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildFleetComputeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildFleetComputeConfiguration {
        private final java.lang.Number disk;
        private final java.lang.String machineType;
        private final java.lang.Number memory;
        private final java.lang.Number vcpu;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.disk = software.amazon.jsii.Kernel.get(this, "disk", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.machineType = software.amazon.jsii.Kernel.get(this, "machineType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.vcpu = software.amazon.jsii.Kernel.get(this, "vcpu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.disk = builder.disk;
            this.machineType = builder.machineType;
            this.memory = builder.memory;
            this.vcpu = builder.vcpu;
        }

        @Override
        public final java.lang.Number getDisk() {
            return this.disk;
        }

        @Override
        public final java.lang.String getMachineType() {
            return this.machineType;
        }

        @Override
        public final java.lang.Number getMemory() {
            return this.memory;
        }

        @Override
        public final java.lang.Number getVcpu() {
            return this.vcpu;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDisk() != null) {
                data.set("disk", om.valueToTree(this.getDisk()));
            }
            if (this.getMachineType() != null) {
                data.set("machineType", om.valueToTree(this.getMachineType()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }
            if (this.getVcpu() != null) {
                data.set("vcpu", om.valueToTree(this.getVcpu()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildFleet.CodebuildFleetComputeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildFleetComputeConfiguration.Jsii$Proxy that = (CodebuildFleetComputeConfiguration.Jsii$Proxy) o;

            if (this.disk != null ? !this.disk.equals(that.disk) : that.disk != null) return false;
            if (this.machineType != null ? !this.machineType.equals(that.machineType) : that.machineType != null) return false;
            if (this.memory != null ? !this.memory.equals(that.memory) : that.memory != null) return false;
            return this.vcpu != null ? this.vcpu.equals(that.vcpu) : that.vcpu == null;
        }

        @Override
        public final int hashCode() {
            int result = this.disk != null ? this.disk.hashCode() : 0;
            result = 31 * result + (this.machineType != null ? this.machineType.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            result = 31 * result + (this.vcpu != null ? this.vcpu.hashCode() : 0);
            return result;
        }
    }
}
