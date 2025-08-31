package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceVpcLatticeConfigurations")
@software.amazon.jsii.Jsii.Proxy(EcsServiceVpcLatticeConfigurations.Jsii$Proxy.class)
public interface EcsServiceVpcLatticeConfigurations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#port_name EcsService#port_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPortName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#role_arn EcsService#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#target_group_arn EcsService#target_group_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetGroupArn();

    /**
     * @return a {@link Builder} of {@link EcsServiceVpcLatticeConfigurations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsServiceVpcLatticeConfigurations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsServiceVpcLatticeConfigurations> {
        java.lang.String portName;
        java.lang.String roleArn;
        java.lang.String targetGroupArn;

        /**
         * Sets the value of {@link EcsServiceVpcLatticeConfigurations#getPortName}
         * @param portName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#port_name EcsService#port_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder portName(java.lang.String portName) {
            this.portName = portName;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVpcLatticeConfigurations#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#role_arn EcsService#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link EcsServiceVpcLatticeConfigurations#getTargetGroupArn}
         * @param targetGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_service#target_group_arn EcsService#target_group_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetGroupArn(java.lang.String targetGroupArn) {
            this.targetGroupArn = targetGroupArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsServiceVpcLatticeConfigurations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsServiceVpcLatticeConfigurations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsServiceVpcLatticeConfigurations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsServiceVpcLatticeConfigurations {
        private final java.lang.String portName;
        private final java.lang.String roleArn;
        private final java.lang.String targetGroupArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.portName = software.amazon.jsii.Kernel.get(this, "portName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetGroupArn = software.amazon.jsii.Kernel.get(this, "targetGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.portName = java.util.Objects.requireNonNull(builder.portName, "portName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.targetGroupArn = java.util.Objects.requireNonNull(builder.targetGroupArn, "targetGroupArn is required");
        }

        @Override
        public final java.lang.String getPortName() {
            return this.portName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getTargetGroupArn() {
            return this.targetGroupArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("portName", om.valueToTree(this.getPortName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("targetGroupArn", om.valueToTree(this.getTargetGroupArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsService.EcsServiceVpcLatticeConfigurations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsServiceVpcLatticeConfigurations.Jsii$Proxy that = (EcsServiceVpcLatticeConfigurations.Jsii$Proxy) o;

            if (!portName.equals(that.portName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            return this.targetGroupArn.equals(that.targetGroupArn);
        }

        @Override
        public final int hashCode() {
            int result = this.portName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.targetGroupArn.hashCode());
            return result;
        }
    }
}
