package imports.aws.lambda_function_event_invoke_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.505Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunctionEventInvokeConfig.LambdaFunctionEventInvokeConfigConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaFunctionEventInvokeConfigConfig.Jsii$Proxy.class)
public interface LambdaFunctionEventInvokeConfigConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#function_name LambdaFunctionEventInvokeConfig#function_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFunctionName();

    /**
     * destination_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#destination_config LambdaFunctionEventInvokeConfig#destination_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfig getDestinationConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#id LambdaFunctionEventInvokeConfig#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#maximum_event_age_in_seconds LambdaFunctionEventInvokeConfig#maximum_event_age_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumEventAgeInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#maximum_retry_attempts LambdaFunctionEventInvokeConfig#maximum_retry_attempts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumRetryAttempts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#qualifier LambdaFunctionEventInvokeConfig#qualifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getQualifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaFunctionEventInvokeConfigConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaFunctionEventInvokeConfigConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaFunctionEventInvokeConfigConfig> {
        java.lang.String functionName;
        imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfig destinationConfig;
        java.lang.String id;
        java.lang.Number maximumEventAgeInSeconds;
        java.lang.Number maximumRetryAttempts;
        java.lang.String qualifier;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getFunctionName}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#function_name LambdaFunctionEventInvokeConfig#function_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder functionName(java.lang.String functionName) {
            this.functionName = functionName;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getDestinationConfig}
         * @param destinationConfig destination_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#destination_config LambdaFunctionEventInvokeConfig#destination_config}
         * @return {@code this}
         */
        public Builder destinationConfig(imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfig destinationConfig) {
            this.destinationConfig = destinationConfig;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#id LambdaFunctionEventInvokeConfig#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getMaximumEventAgeInSeconds}
         * @param maximumEventAgeInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#maximum_event_age_in_seconds LambdaFunctionEventInvokeConfig#maximum_event_age_in_seconds}.
         * @return {@code this}
         */
        public Builder maximumEventAgeInSeconds(java.lang.Number maximumEventAgeInSeconds) {
            this.maximumEventAgeInSeconds = maximumEventAgeInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getMaximumRetryAttempts}
         * @param maximumRetryAttempts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#maximum_retry_attempts LambdaFunctionEventInvokeConfig#maximum_retry_attempts}.
         * @return {@code this}
         */
        public Builder maximumRetryAttempts(java.lang.Number maximumRetryAttempts) {
            this.maximumRetryAttempts = maximumRetryAttempts;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getQualifier}
         * @param qualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_function_event_invoke_config#qualifier LambdaFunctionEventInvokeConfig#qualifier}.
         * @return {@code this}
         */
        public Builder qualifier(java.lang.String qualifier) {
            this.qualifier = qualifier;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getDependsOn}
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
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LambdaFunctionEventInvokeConfigConfig#getProvisioners}
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
         * @return a new instance of {@link LambdaFunctionEventInvokeConfigConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaFunctionEventInvokeConfigConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaFunctionEventInvokeConfigConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaFunctionEventInvokeConfigConfig {
        private final java.lang.String functionName;
        private final imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfig destinationConfig;
        private final java.lang.String id;
        private final java.lang.Number maximumEventAgeInSeconds;
        private final java.lang.Number maximumRetryAttempts;
        private final java.lang.String qualifier;
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
            this.functionName = software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationConfig = software.amazon.jsii.Kernel.get(this, "destinationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfig.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximumEventAgeInSeconds = software.amazon.jsii.Kernel.get(this, "maximumEventAgeInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumRetryAttempts = software.amazon.jsii.Kernel.get(this, "maximumRetryAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.qualifier = software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.functionName = java.util.Objects.requireNonNull(builder.functionName, "functionName is required");
            this.destinationConfig = builder.destinationConfig;
            this.id = builder.id;
            this.maximumEventAgeInSeconds = builder.maximumEventAgeInSeconds;
            this.maximumRetryAttempts = builder.maximumRetryAttempts;
            this.qualifier = builder.qualifier;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getFunctionName() {
            return this.functionName;
        }

        @Override
        public final imports.aws.lambda_function_event_invoke_config.LambdaFunctionEventInvokeConfigDestinationConfig getDestinationConfig() {
            return this.destinationConfig;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaximumEventAgeInSeconds() {
            return this.maximumEventAgeInSeconds;
        }

        @Override
        public final java.lang.Number getMaximumRetryAttempts() {
            return this.maximumRetryAttempts;
        }

        @Override
        public final java.lang.String getQualifier() {
            return this.qualifier;
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

            data.set("functionName", om.valueToTree(this.getFunctionName()));
            if (this.getDestinationConfig() != null) {
                data.set("destinationConfig", om.valueToTree(this.getDestinationConfig()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaximumEventAgeInSeconds() != null) {
                data.set("maximumEventAgeInSeconds", om.valueToTree(this.getMaximumEventAgeInSeconds()));
            }
            if (this.getMaximumRetryAttempts() != null) {
                data.set("maximumRetryAttempts", om.valueToTree(this.getMaximumRetryAttempts()));
            }
            if (this.getQualifier() != null) {
                data.set("qualifier", om.valueToTree(this.getQualifier()));
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
            struct.set("fqn", om.valueToTree("aws.lambdaFunctionEventInvokeConfig.LambdaFunctionEventInvokeConfigConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaFunctionEventInvokeConfigConfig.Jsii$Proxy that = (LambdaFunctionEventInvokeConfigConfig.Jsii$Proxy) o;

            if (!functionName.equals(that.functionName)) return false;
            if (this.destinationConfig != null ? !this.destinationConfig.equals(that.destinationConfig) : that.destinationConfig != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maximumEventAgeInSeconds != null ? !this.maximumEventAgeInSeconds.equals(that.maximumEventAgeInSeconds) : that.maximumEventAgeInSeconds != null) return false;
            if (this.maximumRetryAttempts != null ? !this.maximumRetryAttempts.equals(that.maximumRetryAttempts) : that.maximumRetryAttempts != null) return false;
            if (this.qualifier != null ? !this.qualifier.equals(that.qualifier) : that.qualifier != null) return false;
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
            int result = this.functionName.hashCode();
            result = 31 * result + (this.destinationConfig != null ? this.destinationConfig.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maximumEventAgeInSeconds != null ? this.maximumEventAgeInSeconds.hashCode() : 0);
            result = 31 * result + (this.maximumRetryAttempts != null ? this.maximumRetryAttempts.hashCode() : 0);
            result = 31 * result + (this.qualifier != null ? this.qualifier.hashCode() : 0);
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
