package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.836Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsRoute53TrafficPolicyDocumentConfig.Jsii$Proxy.class)
public interface DataAwsRoute53TrafficPolicyDocumentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * endpoint block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint DataAwsRoute53TrafficPolicyDocument#endpoint}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#id DataAwsRoute53TrafficPolicyDocument#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#record_type DataAwsRoute53TrafficPolicyDocument#record_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRecordType() {
        return null;
    }

    /**
     * rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule DataAwsRoute53TrafficPolicyDocument#rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_endpoint DataAwsRoute53TrafficPolicyDocument#start_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_rule DataAwsRoute53TrafficPolicyDocument#start_rule}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#version DataAwsRoute53TrafficPolicyDocument#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRoute53TrafficPolicyDocumentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRoute53TrafficPolicyDocumentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRoute53TrafficPolicyDocumentConfig> {
        java.lang.Object endpoint;
        java.lang.String id;
        java.lang.String recordType;
        java.lang.Object rule;
        java.lang.String startEndpoint;
        java.lang.String startRule;
        java.lang.String version;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getEndpoint}
         * @param endpoint endpoint block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint DataAwsRoute53TrafficPolicyDocument#endpoint}
         * @return {@code this}
         */
        public Builder endpoint(com.hashicorp.cdktf.IResolvable endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getEndpoint}
         * @param endpoint endpoint block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#endpoint DataAwsRoute53TrafficPolicyDocument#endpoint}
         * @return {@code this}
         */
        public Builder endpoint(java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentEndpoint> endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#id DataAwsRoute53TrafficPolicyDocument#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getRecordType}
         * @param recordType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#record_type DataAwsRoute53TrafficPolicyDocument#record_type}.
         * @return {@code this}
         */
        public Builder recordType(java.lang.String recordType) {
            this.recordType = recordType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getRule}
         * @param rule rule block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule DataAwsRoute53TrafficPolicyDocument#rule}
         * @return {@code this}
         */
        public Builder rule(com.hashicorp.cdktf.IResolvable rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getRule}
         * @param rule rule block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#rule DataAwsRoute53TrafficPolicyDocument#rule}
         * @return {@code this}
         */
        public Builder rule(java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRule> rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getStartEndpoint}
         * @param startEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_endpoint DataAwsRoute53TrafficPolicyDocument#start_endpoint}.
         * @return {@code this}
         */
        public Builder startEndpoint(java.lang.String startEndpoint) {
            this.startEndpoint = startEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getStartRule}
         * @param startRule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#start_rule DataAwsRoute53TrafficPolicyDocument#start_rule}.
         * @return {@code this}
         */
        public Builder startRule(java.lang.String startRule) {
            this.startRule = startRule;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#version DataAwsRoute53TrafficPolicyDocument#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsRoute53TrafficPolicyDocumentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRoute53TrafficPolicyDocumentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRoute53TrafficPolicyDocumentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRoute53TrafficPolicyDocumentConfig {
        private final java.lang.Object endpoint;
        private final java.lang.String id;
        private final java.lang.String recordType;
        private final java.lang.Object rule;
        private final java.lang.String startEndpoint;
        private final java.lang.String startRule;
        private final java.lang.String version;
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
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordType = software.amazon.jsii.Kernel.get(this, "recordType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.startEndpoint = software.amazon.jsii.Kernel.get(this, "startEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startRule = software.amazon.jsii.Kernel.get(this, "startRule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.endpoint = builder.endpoint;
            this.id = builder.id;
            this.recordType = builder.recordType;
            this.rule = builder.rule;
            this.startEndpoint = builder.startEndpoint;
            this.startRule = builder.startRule;
            this.version = builder.version;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getRecordType() {
            return this.recordType;
        }

        @Override
        public final java.lang.Object getRule() {
            return this.rule;
        }

        @Override
        public final java.lang.String getStartEndpoint() {
            return this.startEndpoint;
        }

        @Override
        public final java.lang.String getStartRule() {
            return this.startRule;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
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

            if (this.getEndpoint() != null) {
                data.set("endpoint", om.valueToTree(this.getEndpoint()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRecordType() != null) {
                data.set("recordType", om.valueToTree(this.getRecordType()));
            }
            if (this.getRule() != null) {
                data.set("rule", om.valueToTree(this.getRule()));
            }
            if (this.getStartEndpoint() != null) {
                data.set("startEndpoint", om.valueToTree(this.getStartEndpoint()));
            }
            if (this.getStartRule() != null) {
                data.set("startRule", om.valueToTree(this.getStartRule()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRoute53TrafficPolicyDocumentConfig.Jsii$Proxy that = (DataAwsRoute53TrafficPolicyDocumentConfig.Jsii$Proxy) o;

            if (this.endpoint != null ? !this.endpoint.equals(that.endpoint) : that.endpoint != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.recordType != null ? !this.recordType.equals(that.recordType) : that.recordType != null) return false;
            if (this.rule != null ? !this.rule.equals(that.rule) : that.rule != null) return false;
            if (this.startEndpoint != null ? !this.startEndpoint.equals(that.startEndpoint) : that.startEndpoint != null) return false;
            if (this.startRule != null ? !this.startRule.equals(that.startRule) : that.startRule != null) return false;
            if (this.version != null ? !this.version.equals(that.version) : that.version != null) return false;
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
            int result = this.endpoint != null ? this.endpoint.hashCode() : 0;
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.recordType != null ? this.recordType.hashCode() : 0);
            result = 31 * result + (this.rule != null ? this.rule.hashCode() : 0);
            result = 31 * result + (this.startEndpoint != null ? this.startEndpoint.hashCode() : 0);
            result = 31 * result + (this.startRule != null ? this.startRule.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
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
