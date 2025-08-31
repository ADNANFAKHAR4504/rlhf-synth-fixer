package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupBlueGreenDeploymentConfig")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupBlueGreenDeploymentConfig.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupBlueGreenDeploymentConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * deployment_ready_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_ready_option CodedeployDeploymentGroup#deployment_ready_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption getDeploymentReadyOption() {
        return null;
    }

    /**
     * green_fleet_provisioning_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#green_fleet_provisioning_option CodedeployDeploymentGroup#green_fleet_provisioning_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption getGreenFleetProvisioningOption() {
        return null;
    }

    /**
     * terminate_blue_instances_on_deployment_success block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#terminate_blue_instances_on_deployment_success CodedeployDeploymentGroup#terminate_blue_instances_on_deployment_success}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess getTerminateBlueInstancesOnDeploymentSuccess() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupBlueGreenDeploymentConfig> {
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption deploymentReadyOption;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption greenFleetProvisioningOption;
        imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess terminateBlueInstancesOnDeploymentSuccess;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig#getDeploymentReadyOption}
         * @param deploymentReadyOption deployment_ready_option block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#deployment_ready_option CodedeployDeploymentGroup#deployment_ready_option}
         * @return {@code this}
         */
        public Builder deploymentReadyOption(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption deploymentReadyOption) {
            this.deploymentReadyOption = deploymentReadyOption;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig#getGreenFleetProvisioningOption}
         * @param greenFleetProvisioningOption green_fleet_provisioning_option block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#green_fleet_provisioning_option CodedeployDeploymentGroup#green_fleet_provisioning_option}
         * @return {@code this}
         */
        public Builder greenFleetProvisioningOption(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption greenFleetProvisioningOption) {
            this.greenFleetProvisioningOption = greenFleetProvisioningOption;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig#getTerminateBlueInstancesOnDeploymentSuccess}
         * @param terminateBlueInstancesOnDeploymentSuccess terminate_blue_instances_on_deployment_success block.
         *                                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#terminate_blue_instances_on_deployment_success CodedeployDeploymentGroup#terminate_blue_instances_on_deployment_success}
         * @return {@code this}
         */
        public Builder terminateBlueInstancesOnDeploymentSuccess(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess terminateBlueInstancesOnDeploymentSuccess) {
            this.terminateBlueInstancesOnDeploymentSuccess = terminateBlueInstancesOnDeploymentSuccess;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupBlueGreenDeploymentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupBlueGreenDeploymentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupBlueGreenDeploymentConfig {
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption deploymentReadyOption;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption greenFleetProvisioningOption;
        private final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess terminateBlueInstancesOnDeploymentSuccess;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deploymentReadyOption = software.amazon.jsii.Kernel.get(this, "deploymentReadyOption", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption.class));
            this.greenFleetProvisioningOption = software.amazon.jsii.Kernel.get(this, "greenFleetProvisioningOption", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption.class));
            this.terminateBlueInstancesOnDeploymentSuccess = software.amazon.jsii.Kernel.get(this, "terminateBlueInstancesOnDeploymentSuccess", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deploymentReadyOption = builder.deploymentReadyOption;
            this.greenFleetProvisioningOption = builder.greenFleetProvisioningOption;
            this.terminateBlueInstancesOnDeploymentSuccess = builder.terminateBlueInstancesOnDeploymentSuccess;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigDeploymentReadyOption getDeploymentReadyOption() {
            return this.deploymentReadyOption;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigGreenFleetProvisioningOption getGreenFleetProvisioningOption() {
            return this.greenFleetProvisioningOption;
        }

        @Override
        public final imports.aws.codedeploy_deployment_group.CodedeployDeploymentGroupBlueGreenDeploymentConfigTerminateBlueInstancesOnDeploymentSuccess getTerminateBlueInstancesOnDeploymentSuccess() {
            return this.terminateBlueInstancesOnDeploymentSuccess;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeploymentReadyOption() != null) {
                data.set("deploymentReadyOption", om.valueToTree(this.getDeploymentReadyOption()));
            }
            if (this.getGreenFleetProvisioningOption() != null) {
                data.set("greenFleetProvisioningOption", om.valueToTree(this.getGreenFleetProvisioningOption()));
            }
            if (this.getTerminateBlueInstancesOnDeploymentSuccess() != null) {
                data.set("terminateBlueInstancesOnDeploymentSuccess", om.valueToTree(this.getTerminateBlueInstancesOnDeploymentSuccess()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupBlueGreenDeploymentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupBlueGreenDeploymentConfig.Jsii$Proxy that = (CodedeployDeploymentGroupBlueGreenDeploymentConfig.Jsii$Proxy) o;

            if (this.deploymentReadyOption != null ? !this.deploymentReadyOption.equals(that.deploymentReadyOption) : that.deploymentReadyOption != null) return false;
            if (this.greenFleetProvisioningOption != null ? !this.greenFleetProvisioningOption.equals(that.greenFleetProvisioningOption) : that.greenFleetProvisioningOption != null) return false;
            return this.terminateBlueInstancesOnDeploymentSuccess != null ? this.terminateBlueInstancesOnDeploymentSuccess.equals(that.terminateBlueInstancesOnDeploymentSuccess) : that.terminateBlueInstancesOnDeploymentSuccess == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deploymentReadyOption != null ? this.deploymentReadyOption.hashCode() : 0;
            result = 31 * result + (this.greenFleetProvisioningOption != null ? this.greenFleetProvisioningOption.hashCode() : 0);
            result = 31 * result + (this.terminateBlueInstancesOnDeploymentSuccess != null ? this.terminateBlueInstancesOnDeploymentSuccess.hashCode() : 0);
            return result;
        }
    }
}
