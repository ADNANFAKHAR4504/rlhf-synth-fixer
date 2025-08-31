package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.321Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupEcsService")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupEcsService.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupEcsService extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#cluster_name CodedeployDeploymentGroup#cluster_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#service_name CodedeployDeploymentGroup#service_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceName();

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupEcsService}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupEcsService}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupEcsService> {
        java.lang.String clusterName;
        java.lang.String serviceName;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupEcsService#getClusterName}
         * @param clusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#cluster_name CodedeployDeploymentGroup#cluster_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterName(java.lang.String clusterName) {
            this.clusterName = clusterName;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupEcsService#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#service_name CodedeployDeploymentGroup#service_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupEcsService}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupEcsService build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupEcsService}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupEcsService {
        private final java.lang.String clusterName;
        private final java.lang.String serviceName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterName = software.amazon.jsii.Kernel.get(this, "clusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterName = java.util.Objects.requireNonNull(builder.clusterName, "clusterName is required");
            this.serviceName = java.util.Objects.requireNonNull(builder.serviceName, "serviceName is required");
        }

        @Override
        public final java.lang.String getClusterName() {
            return this.clusterName;
        }

        @Override
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clusterName", om.valueToTree(this.getClusterName()));
            data.set("serviceName", om.valueToTree(this.getServiceName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupEcsService"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupEcsService.Jsii$Proxy that = (CodedeployDeploymentGroupEcsService.Jsii$Proxy) o;

            if (!clusterName.equals(that.clusterName)) return false;
            return this.serviceName.equals(that.serviceName);
        }

        @Override
        public final int hashCode() {
            int result = this.clusterName.hashCode();
            result = 31 * result + (this.serviceName.hashCode());
            return result;
        }
    }
}
