package imports.aws.m2_deployment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.841Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.m2Deployment.M2DeploymentConfig")
@software.amazon.jsii.Jsii.Proxy(M2DeploymentConfig.Jsii$Proxy.class)
public interface M2DeploymentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#application_id M2Deployment#application_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplicationId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#application_version M2Deployment#application_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getApplicationVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#environment_id M2Deployment#environment_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#start M2Deployment#start}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getStart();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#force_stop M2Deployment#force_stop}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceStop() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#timeouts M2Deployment#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.m2_deployment.M2DeploymentTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link M2DeploymentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link M2DeploymentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<M2DeploymentConfig> {
        java.lang.String applicationId;
        java.lang.Number applicationVersion;
        java.lang.String environmentId;
        java.lang.Object start;
        java.lang.Object forceStop;
        imports.aws.m2_deployment.M2DeploymentTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link M2DeploymentConfig#getApplicationId}
         * @param applicationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#application_id M2Deployment#application_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationId(java.lang.String applicationId) {
            this.applicationId = applicationId;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getApplicationVersion}
         * @param applicationVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#application_version M2Deployment#application_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationVersion(java.lang.Number applicationVersion) {
            this.applicationVersion = applicationVersion;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getEnvironmentId}
         * @param environmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#environment_id M2Deployment#environment_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder environmentId(java.lang.String environmentId) {
            this.environmentId = environmentId;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getStart}
         * @param start Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#start M2Deployment#start}. This parameter is required.
         * @return {@code this}
         */
        public Builder start(java.lang.Boolean start) {
            this.start = start;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getStart}
         * @param start Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#start M2Deployment#start}. This parameter is required.
         * @return {@code this}
         */
        public Builder start(com.hashicorp.cdktf.IResolvable start) {
            this.start = start;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getForceStop}
         * @param forceStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#force_stop M2Deployment#force_stop}.
         * @return {@code this}
         */
        public Builder forceStop(java.lang.Boolean forceStop) {
            this.forceStop = forceStop;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getForceStop}
         * @param forceStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#force_stop M2Deployment#force_stop}.
         * @return {@code this}
         */
        public Builder forceStop(com.hashicorp.cdktf.IResolvable forceStop) {
            this.forceStop = forceStop;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_deployment#timeouts M2Deployment#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.m2_deployment.M2DeploymentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getDependsOn}
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
         * Sets the value of {@link M2DeploymentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link M2DeploymentConfig#getProvisioners}
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
         * @return a new instance of {@link M2DeploymentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public M2DeploymentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link M2DeploymentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements M2DeploymentConfig {
        private final java.lang.String applicationId;
        private final java.lang.Number applicationVersion;
        private final java.lang.String environmentId;
        private final java.lang.Object start;
        private final java.lang.Object forceStop;
        private final imports.aws.m2_deployment.M2DeploymentTimeouts timeouts;
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
            this.applicationId = software.amazon.jsii.Kernel.get(this, "applicationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applicationVersion = software.amazon.jsii.Kernel.get(this, "applicationVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.environmentId = software.amazon.jsii.Kernel.get(this, "environmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.start = software.amazon.jsii.Kernel.get(this, "start", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceStop = software.amazon.jsii.Kernel.get(this, "forceStop", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.m2_deployment.M2DeploymentTimeouts.class));
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
            this.applicationId = java.util.Objects.requireNonNull(builder.applicationId, "applicationId is required");
            this.applicationVersion = java.util.Objects.requireNonNull(builder.applicationVersion, "applicationVersion is required");
            this.environmentId = java.util.Objects.requireNonNull(builder.environmentId, "environmentId is required");
            this.start = java.util.Objects.requireNonNull(builder.start, "start is required");
            this.forceStop = builder.forceStop;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApplicationId() {
            return this.applicationId;
        }

        @Override
        public final java.lang.Number getApplicationVersion() {
            return this.applicationVersion;
        }

        @Override
        public final java.lang.String getEnvironmentId() {
            return this.environmentId;
        }

        @Override
        public final java.lang.Object getStart() {
            return this.start;
        }

        @Override
        public final java.lang.Object getForceStop() {
            return this.forceStop;
        }

        @Override
        public final imports.aws.m2_deployment.M2DeploymentTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("applicationId", om.valueToTree(this.getApplicationId()));
            data.set("applicationVersion", om.valueToTree(this.getApplicationVersion()));
            data.set("environmentId", om.valueToTree(this.getEnvironmentId()));
            data.set("start", om.valueToTree(this.getStart()));
            if (this.getForceStop() != null) {
                data.set("forceStop", om.valueToTree(this.getForceStop()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.m2Deployment.M2DeploymentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            M2DeploymentConfig.Jsii$Proxy that = (M2DeploymentConfig.Jsii$Proxy) o;

            if (!applicationId.equals(that.applicationId)) return false;
            if (!applicationVersion.equals(that.applicationVersion)) return false;
            if (!environmentId.equals(that.environmentId)) return false;
            if (!start.equals(that.start)) return false;
            if (this.forceStop != null ? !this.forceStop.equals(that.forceStop) : that.forceStop != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.applicationId.hashCode();
            result = 31 * result + (this.applicationVersion.hashCode());
            result = 31 * result + (this.environmentId.hashCode());
            result = 31 * result + (this.start.hashCode());
            result = 31 * result + (this.forceStop != null ? this.forceStop.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
