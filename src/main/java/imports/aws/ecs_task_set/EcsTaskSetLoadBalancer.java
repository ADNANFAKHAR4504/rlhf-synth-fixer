package imports.aws.ecs_task_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsTaskSet.EcsTaskSetLoadBalancer")
@software.amazon.jsii.Jsii.Proxy(EcsTaskSetLoadBalancer.Jsii$Proxy.class)
public interface EcsTaskSetLoadBalancer extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_name EcsTaskSet#container_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_port EcsTaskSet#container_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getContainerPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer_name EcsTaskSet#load_balancer_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancerName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#target_group_arn EcsTaskSet#target_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetGroupArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcsTaskSetLoadBalancer}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcsTaskSetLoadBalancer}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcsTaskSetLoadBalancer> {
        java.lang.String containerName;
        java.lang.Number containerPort;
        java.lang.String loadBalancerName;
        java.lang.String targetGroupArn;

        /**
         * Sets the value of {@link EcsTaskSetLoadBalancer#getContainerName}
         * @param containerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_name EcsTaskSet#container_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerName(java.lang.String containerName) {
            this.containerName = containerName;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetLoadBalancer#getContainerPort}
         * @param containerPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#container_port EcsTaskSet#container_port}.
         * @return {@code this}
         */
        public Builder containerPort(java.lang.Number containerPort) {
            this.containerPort = containerPort;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetLoadBalancer#getLoadBalancerName}
         * @param loadBalancerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#load_balancer_name EcsTaskSet#load_balancer_name}.
         * @return {@code this}
         */
        public Builder loadBalancerName(java.lang.String loadBalancerName) {
            this.loadBalancerName = loadBalancerName;
            return this;
        }

        /**
         * Sets the value of {@link EcsTaskSetLoadBalancer#getTargetGroupArn}
         * @param targetGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecs_task_set#target_group_arn EcsTaskSet#target_group_arn}.
         * @return {@code this}
         */
        public Builder targetGroupArn(java.lang.String targetGroupArn) {
            this.targetGroupArn = targetGroupArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcsTaskSetLoadBalancer}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcsTaskSetLoadBalancer build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcsTaskSetLoadBalancer}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcsTaskSetLoadBalancer {
        private final java.lang.String containerName;
        private final java.lang.Number containerPort;
        private final java.lang.String loadBalancerName;
        private final java.lang.String targetGroupArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerName = software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerPort = software.amazon.jsii.Kernel.get(this, "containerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.loadBalancerName = software.amazon.jsii.Kernel.get(this, "loadBalancerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetGroupArn = software.amazon.jsii.Kernel.get(this, "targetGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerName = java.util.Objects.requireNonNull(builder.containerName, "containerName is required");
            this.containerPort = builder.containerPort;
            this.loadBalancerName = builder.loadBalancerName;
            this.targetGroupArn = builder.targetGroupArn;
        }

        @Override
        public final java.lang.String getContainerName() {
            return this.containerName;
        }

        @Override
        public final java.lang.Number getContainerPort() {
            return this.containerPort;
        }

        @Override
        public final java.lang.String getLoadBalancerName() {
            return this.loadBalancerName;
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

            data.set("containerName", om.valueToTree(this.getContainerName()));
            if (this.getContainerPort() != null) {
                data.set("containerPort", om.valueToTree(this.getContainerPort()));
            }
            if (this.getLoadBalancerName() != null) {
                data.set("loadBalancerName", om.valueToTree(this.getLoadBalancerName()));
            }
            if (this.getTargetGroupArn() != null) {
                data.set("targetGroupArn", om.valueToTree(this.getTargetGroupArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecsTaskSet.EcsTaskSetLoadBalancer"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcsTaskSetLoadBalancer.Jsii$Proxy that = (EcsTaskSetLoadBalancer.Jsii$Proxy) o;

            if (!containerName.equals(that.containerName)) return false;
            if (this.containerPort != null ? !this.containerPort.equals(that.containerPort) : that.containerPort != null) return false;
            if (this.loadBalancerName != null ? !this.loadBalancerName.equals(that.loadBalancerName) : that.loadBalancerName != null) return false;
            return this.targetGroupArn != null ? this.targetGroupArn.equals(that.targetGroupArn) : that.targetGroupArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerName.hashCode();
            result = 31 * result + (this.containerPort != null ? this.containerPort.hashCode() : 0);
            result = 31 * result + (this.loadBalancerName != null ? this.loadBalancerName.hashCode() : 0);
            result = 31 * result + (this.targetGroupArn != null ? this.targetGroupArn.hashCode() : 0);
            return result;
        }
    }
}
