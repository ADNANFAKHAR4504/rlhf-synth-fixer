package imports.aws.codedeploy_deployment_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfig")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentConfigZonalConfig.Jsii$Proxy.class)
public interface CodedeployDeploymentConfigZonalConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#first_zone_monitor_duration_in_seconds CodedeployDeploymentConfig#first_zone_monitor_duration_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFirstZoneMonitorDurationInSeconds() {
        return null;
    }

    /**
     * minimum_healthy_hosts_per_zone block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts_per_zone CodedeployDeploymentConfig#minimum_healthy_hosts_per_zone}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone getMinimumHealthyHostsPerZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#monitor_duration_in_seconds CodedeployDeploymentConfig#monitor_duration_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMonitorDurationInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentConfigZonalConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentConfigZonalConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentConfigZonalConfig> {
        java.lang.Number firstZoneMonitorDurationInSeconds;
        imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone minimumHealthyHostsPerZone;
        java.lang.Number monitorDurationInSeconds;

        /**
         * Sets the value of {@link CodedeployDeploymentConfigZonalConfig#getFirstZoneMonitorDurationInSeconds}
         * @param firstZoneMonitorDurationInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#first_zone_monitor_duration_in_seconds CodedeployDeploymentConfig#first_zone_monitor_duration_in_seconds}.
         * @return {@code this}
         */
        public Builder firstZoneMonitorDurationInSeconds(java.lang.Number firstZoneMonitorDurationInSeconds) {
            this.firstZoneMonitorDurationInSeconds = firstZoneMonitorDurationInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigZonalConfig#getMinimumHealthyHostsPerZone}
         * @param minimumHealthyHostsPerZone minimum_healthy_hosts_per_zone block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#minimum_healthy_hosts_per_zone CodedeployDeploymentConfig#minimum_healthy_hosts_per_zone}
         * @return {@code this}
         */
        public Builder minimumHealthyHostsPerZone(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone minimumHealthyHostsPerZone) {
            this.minimumHealthyHostsPerZone = minimumHealthyHostsPerZone;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentConfigZonalConfig#getMonitorDurationInSeconds}
         * @param monitorDurationInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_config#monitor_duration_in_seconds CodedeployDeploymentConfig#monitor_duration_in_seconds}.
         * @return {@code this}
         */
        public Builder monitorDurationInSeconds(java.lang.Number monitorDurationInSeconds) {
            this.monitorDurationInSeconds = monitorDurationInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentConfigZonalConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentConfigZonalConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentConfigZonalConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentConfigZonalConfig {
        private final java.lang.Number firstZoneMonitorDurationInSeconds;
        private final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone minimumHealthyHostsPerZone;
        private final java.lang.Number monitorDurationInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.firstZoneMonitorDurationInSeconds = software.amazon.jsii.Kernel.get(this, "firstZoneMonitorDurationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumHealthyHostsPerZone = software.amazon.jsii.Kernel.get(this, "minimumHealthyHostsPerZone", software.amazon.jsii.NativeType.forClass(imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone.class));
            this.monitorDurationInSeconds = software.amazon.jsii.Kernel.get(this, "monitorDurationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.firstZoneMonitorDurationInSeconds = builder.firstZoneMonitorDurationInSeconds;
            this.minimumHealthyHostsPerZone = builder.minimumHealthyHostsPerZone;
            this.monitorDurationInSeconds = builder.monitorDurationInSeconds;
        }

        @Override
        public final java.lang.Number getFirstZoneMonitorDurationInSeconds() {
            return this.firstZoneMonitorDurationInSeconds;
        }

        @Override
        public final imports.aws.codedeploy_deployment_config.CodedeployDeploymentConfigZonalConfigMinimumHealthyHostsPerZone getMinimumHealthyHostsPerZone() {
            return this.minimumHealthyHostsPerZone;
        }

        @Override
        public final java.lang.Number getMonitorDurationInSeconds() {
            return this.monitorDurationInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFirstZoneMonitorDurationInSeconds() != null) {
                data.set("firstZoneMonitorDurationInSeconds", om.valueToTree(this.getFirstZoneMonitorDurationInSeconds()));
            }
            if (this.getMinimumHealthyHostsPerZone() != null) {
                data.set("minimumHealthyHostsPerZone", om.valueToTree(this.getMinimumHealthyHostsPerZone()));
            }
            if (this.getMonitorDurationInSeconds() != null) {
                data.set("monitorDurationInSeconds", om.valueToTree(this.getMonitorDurationInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentConfig.CodedeployDeploymentConfigZonalConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentConfigZonalConfig.Jsii$Proxy that = (CodedeployDeploymentConfigZonalConfig.Jsii$Proxy) o;

            if (this.firstZoneMonitorDurationInSeconds != null ? !this.firstZoneMonitorDurationInSeconds.equals(that.firstZoneMonitorDurationInSeconds) : that.firstZoneMonitorDurationInSeconds != null) return false;
            if (this.minimumHealthyHostsPerZone != null ? !this.minimumHealthyHostsPerZone.equals(that.minimumHealthyHostsPerZone) : that.minimumHealthyHostsPerZone != null) return false;
            return this.monitorDurationInSeconds != null ? this.monitorDurationInSeconds.equals(that.monitorDurationInSeconds) : that.monitorDurationInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.firstZoneMonitorDurationInSeconds != null ? this.firstZoneMonitorDurationInSeconds.hashCode() : 0;
            result = 31 * result + (this.minimumHealthyHostsPerZone != null ? this.minimumHealthyHostsPerZone.hashCode() : 0);
            result = 31 * result + (this.monitorDurationInSeconds != null ? this.monitorDurationInSeconds.hashCode() : 0);
            return result;
        }
    }
}
