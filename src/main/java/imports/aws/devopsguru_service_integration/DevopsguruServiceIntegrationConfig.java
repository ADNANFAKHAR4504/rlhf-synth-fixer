package imports.aws.devopsguru_service_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationConfig")
@software.amazon.jsii.Jsii.Proxy(DevopsguruServiceIntegrationConfig.Jsii$Proxy.class)
public interface DevopsguruServiceIntegrationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * kms_server_side_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKmsServerSideEncryption() {
        return null;
    }

    /**
     * logs_anomaly_detection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogsAnomalyDetection() {
        return null;
    }

    /**
     * ops_center block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOpsCenter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevopsguruServiceIntegrationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruServiceIntegrationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruServiceIntegrationConfig> {
        java.lang.Object kmsServerSideEncryption;
        java.lang.Object logsAnomalyDetection;
        java.lang.Object opsCenter;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getKmsServerSideEncryption}
         * @param kmsServerSideEncryption kms_server_side_encryption block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
         * @return {@code this}
         */
        public Builder kmsServerSideEncryption(com.hashicorp.cdktf.IResolvable kmsServerSideEncryption) {
            this.kmsServerSideEncryption = kmsServerSideEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getKmsServerSideEncryption}
         * @param kmsServerSideEncryption kms_server_side_encryption block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_server_side_encryption DevopsguruServiceIntegration#kms_server_side_encryption}
         * @return {@code this}
         */
        public Builder kmsServerSideEncryption(java.util.List<? extends imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationKmsServerSideEncryption> kmsServerSideEncryption) {
            this.kmsServerSideEncryption = kmsServerSideEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getLogsAnomalyDetection}
         * @param logsAnomalyDetection logs_anomaly_detection block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
         * @return {@code this}
         */
        public Builder logsAnomalyDetection(com.hashicorp.cdktf.IResolvable logsAnomalyDetection) {
            this.logsAnomalyDetection = logsAnomalyDetection;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getLogsAnomalyDetection}
         * @param logsAnomalyDetection logs_anomaly_detection block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#logs_anomaly_detection DevopsguruServiceIntegration#logs_anomaly_detection}
         * @return {@code this}
         */
        public Builder logsAnomalyDetection(java.util.List<? extends imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationLogsAnomalyDetection> logsAnomalyDetection) {
            this.logsAnomalyDetection = logsAnomalyDetection;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getOpsCenter}
         * @param opsCenter ops_center block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
         * @return {@code this}
         */
        public Builder opsCenter(com.hashicorp.cdktf.IResolvable opsCenter) {
            this.opsCenter = opsCenter;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getOpsCenter}
         * @param opsCenter ops_center block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#ops_center DevopsguruServiceIntegration#ops_center}
         * @return {@code this}
         */
        public Builder opsCenter(java.util.List<? extends imports.aws.devopsguru_service_integration.DevopsguruServiceIntegrationOpsCenter> opsCenter) {
            this.opsCenter = opsCenter;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruServiceIntegrationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruServiceIntegrationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruServiceIntegrationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruServiceIntegrationConfig {
        private final java.lang.Object kmsServerSideEncryption;
        private final java.lang.Object logsAnomalyDetection;
        private final java.lang.Object opsCenter;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsServerSideEncryption = software.amazon.jsii.Kernel.get(this, "kmsServerSideEncryption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logsAnomalyDetection = software.amazon.jsii.Kernel.get(this, "logsAnomalyDetection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.opsCenter = software.amazon.jsii.Kernel.get(this, "opsCenter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsServerSideEncryption = builder.kmsServerSideEncryption;
            this.logsAnomalyDetection = builder.logsAnomalyDetection;
            this.opsCenter = builder.opsCenter;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getKmsServerSideEncryption() {
            return this.kmsServerSideEncryption;
        }

        @Override
        public final java.lang.Object getLogsAnomalyDetection() {
            return this.logsAnomalyDetection;
        }

        @Override
        public final java.lang.Object getOpsCenter() {
            return this.opsCenter;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsServerSideEncryption() != null) {
                data.set("kmsServerSideEncryption", om.valueToTree(this.getKmsServerSideEncryption()));
            }
            if (this.getLogsAnomalyDetection() != null) {
                data.set("logsAnomalyDetection", om.valueToTree(this.getLogsAnomalyDetection()));
            }
            if (this.getOpsCenter() != null) {
                data.set("opsCenter", om.valueToTree(this.getOpsCenter()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruServiceIntegrationConfig.Jsii$Proxy that = (DevopsguruServiceIntegrationConfig.Jsii$Proxy) o;

            if (this.kmsServerSideEncryption != null ? !this.kmsServerSideEncryption.equals(that.kmsServerSideEncryption) : that.kmsServerSideEncryption != null) return false;
            if (this.logsAnomalyDetection != null ? !this.logsAnomalyDetection.equals(that.logsAnomalyDetection) : that.logsAnomalyDetection != null) return false;
            if (this.opsCenter != null ? !this.opsCenter.equals(that.opsCenter) : that.opsCenter != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsServerSideEncryption != null ? this.kmsServerSideEncryption.hashCode() : 0;
            result = 31 * result + (this.logsAnomalyDetection != null ? this.logsAnomalyDetection.hashCode() : 0);
            result = 31 * result + (this.opsCenter != null ? this.opsCenter.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
