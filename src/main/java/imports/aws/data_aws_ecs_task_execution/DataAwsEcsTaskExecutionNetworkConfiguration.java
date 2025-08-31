package imports.aws.data_aws_ecs_task_execution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.630Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionNetworkConfiguration")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcsTaskExecutionNetworkConfiguration.Jsii$Proxy.class)
public interface DataAwsEcsTaskExecutionNetworkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#subnets DataAwsEcsTaskExecution#subnets}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnets();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#assign_public_ip DataAwsEcsTaskExecution#assign_public_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssignPublicIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#security_groups DataAwsEcsTaskExecution#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcsTaskExecutionNetworkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcsTaskExecutionNetworkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcsTaskExecutionNetworkConfiguration> {
        java.util.List<java.lang.String> subnets;
        java.lang.Object assignPublicIp;
        java.util.List<java.lang.String> securityGroups;

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionNetworkConfiguration#getSubnets}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#subnets DataAwsEcsTaskExecution#subnets}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnets(java.util.List<java.lang.String> subnets) {
            this.subnets = subnets;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionNetworkConfiguration#getAssignPublicIp}
         * @param assignPublicIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#assign_public_ip DataAwsEcsTaskExecution#assign_public_ip}.
         * @return {@code this}
         */
        public Builder assignPublicIp(java.lang.Boolean assignPublicIp) {
            this.assignPublicIp = assignPublicIp;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionNetworkConfiguration#getAssignPublicIp}
         * @param assignPublicIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#assign_public_ip DataAwsEcsTaskExecution#assign_public_ip}.
         * @return {@code this}
         */
        public Builder assignPublicIp(com.hashicorp.cdktf.IResolvable assignPublicIp) {
            this.assignPublicIp = assignPublicIp;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionNetworkConfiguration#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#security_groups DataAwsEcsTaskExecution#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcsTaskExecutionNetworkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcsTaskExecutionNetworkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcsTaskExecutionNetworkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcsTaskExecutionNetworkConfiguration {
        private final java.util.List<java.lang.String> subnets;
        private final java.lang.Object assignPublicIp;
        private final java.util.List<java.lang.String> securityGroups;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnets = software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.assignPublicIp = software.amazon.jsii.Kernel.get(this, "assignPublicIp", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnets = java.util.Objects.requireNonNull(builder.subnets, "subnets is required");
            this.assignPublicIp = builder.assignPublicIp;
            this.securityGroups = builder.securityGroups;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnets() {
            return this.subnets;
        }

        @Override
        public final java.lang.Object getAssignPublicIp() {
            return this.assignPublicIp;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("subnets", om.valueToTree(this.getSubnets()));
            if (this.getAssignPublicIp() != null) {
                data.set("assignPublicIp", om.valueToTree(this.getAssignPublicIp()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionNetworkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcsTaskExecutionNetworkConfiguration.Jsii$Proxy that = (DataAwsEcsTaskExecutionNetworkConfiguration.Jsii$Proxy) o;

            if (!subnets.equals(that.subnets)) return false;
            if (this.assignPublicIp != null ? !this.assignPublicIp.equals(that.assignPublicIp) : that.assignPublicIp != null) return false;
            return this.securityGroups != null ? this.securityGroups.equals(that.securityGroups) : that.securityGroups == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subnets.hashCode();
            result = 31 * result + (this.assignPublicIp != null ? this.assignPublicIp.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            return result;
        }
    }
}
