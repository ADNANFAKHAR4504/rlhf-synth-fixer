package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceInstanceConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceInstanceConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceInstanceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#cpu ApprunnerService#cpu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCpu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#instance_role_arn ApprunnerService#instance_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#memory ApprunnerService#memory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMemory() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceInstanceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceInstanceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceInstanceConfiguration> {
        java.lang.String cpu;
        java.lang.String instanceRoleArn;
        java.lang.String memory;

        /**
         * Sets the value of {@link ApprunnerServiceInstanceConfiguration#getCpu}
         * @param cpu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#cpu ApprunnerService#cpu}.
         * @return {@code this}
         */
        public Builder cpu(java.lang.String cpu) {
            this.cpu = cpu;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceInstanceConfiguration#getInstanceRoleArn}
         * @param instanceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#instance_role_arn ApprunnerService#instance_role_arn}.
         * @return {@code this}
         */
        public Builder instanceRoleArn(java.lang.String instanceRoleArn) {
            this.instanceRoleArn = instanceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceInstanceConfiguration#getMemory}
         * @param memory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#memory ApprunnerService#memory}.
         * @return {@code this}
         */
        public Builder memory(java.lang.String memory) {
            this.memory = memory;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceInstanceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceInstanceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceInstanceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceInstanceConfiguration {
        private final java.lang.String cpu;
        private final java.lang.String instanceRoleArn;
        private final java.lang.String memory;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cpu = software.amazon.jsii.Kernel.get(this, "cpu", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceRoleArn = software.amazon.jsii.Kernel.get(this, "instanceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.memory = software.amazon.jsii.Kernel.get(this, "memory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cpu = builder.cpu;
            this.instanceRoleArn = builder.instanceRoleArn;
            this.memory = builder.memory;
        }

        @Override
        public final java.lang.String getCpu() {
            return this.cpu;
        }

        @Override
        public final java.lang.String getInstanceRoleArn() {
            return this.instanceRoleArn;
        }

        @Override
        public final java.lang.String getMemory() {
            return this.memory;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCpu() != null) {
                data.set("cpu", om.valueToTree(this.getCpu()));
            }
            if (this.getInstanceRoleArn() != null) {
                data.set("instanceRoleArn", om.valueToTree(this.getInstanceRoleArn()));
            }
            if (this.getMemory() != null) {
                data.set("memory", om.valueToTree(this.getMemory()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceInstanceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceInstanceConfiguration.Jsii$Proxy that = (ApprunnerServiceInstanceConfiguration.Jsii$Proxy) o;

            if (this.cpu != null ? !this.cpu.equals(that.cpu) : that.cpu != null) return false;
            if (this.instanceRoleArn != null ? !this.instanceRoleArn.equals(that.instanceRoleArn) : that.instanceRoleArn != null) return false;
            return this.memory != null ? this.memory.equals(that.memory) : that.memory == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cpu != null ? this.cpu.hashCode() : 0;
            result = 31 * result + (this.instanceRoleArn != null ? this.instanceRoleArn.hashCode() : 0);
            result = 31 * result + (this.memory != null ? this.memory.hashCode() : 0);
            return result;
        }
    }
}
