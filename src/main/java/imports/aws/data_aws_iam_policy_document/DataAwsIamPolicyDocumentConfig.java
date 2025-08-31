package imports.aws.data_aws_iam_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.672Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsIamPolicyDocumentConfig.Jsii$Proxy.class)
public interface DataAwsIamPolicyDocumentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#id DataAwsIamPolicyDocument#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_json DataAwsIamPolicyDocument#override_json}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOverrideJson() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_policy_documents DataAwsIamPolicyDocument#override_policy_documents}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOverridePolicyDocuments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#policy_id DataAwsIamPolicyDocument#policy_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_json DataAwsIamPolicyDocument#source_json}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceJson() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_policy_documents DataAwsIamPolicyDocument#source_policy_documents}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSourcePolicyDocuments() {
        return null;
    }

    /**
     * statement block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#statement DataAwsIamPolicyDocument#statement}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatement() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#version DataAwsIamPolicyDocument#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsIamPolicyDocumentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIamPolicyDocumentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIamPolicyDocumentConfig> {
        java.lang.String id;
        java.lang.String overrideJson;
        java.util.List<java.lang.String> overridePolicyDocuments;
        java.lang.String policyId;
        java.lang.String sourceJson;
        java.util.List<java.lang.String> sourcePolicyDocuments;
        java.lang.Object statement;
        java.lang.String version;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#id DataAwsIamPolicyDocument#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getOverrideJson}
         * @param overrideJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_json DataAwsIamPolicyDocument#override_json}.
         * @return {@code this}
         */
        public Builder overrideJson(java.lang.String overrideJson) {
            this.overrideJson = overrideJson;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getOverridePolicyDocuments}
         * @param overridePolicyDocuments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#override_policy_documents DataAwsIamPolicyDocument#override_policy_documents}.
         * @return {@code this}
         */
        public Builder overridePolicyDocuments(java.util.List<java.lang.String> overridePolicyDocuments) {
            this.overridePolicyDocuments = overridePolicyDocuments;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getPolicyId}
         * @param policyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#policy_id DataAwsIamPolicyDocument#policy_id}.
         * @return {@code this}
         */
        public Builder policyId(java.lang.String policyId) {
            this.policyId = policyId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getSourceJson}
         * @param sourceJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_json DataAwsIamPolicyDocument#source_json}.
         * @return {@code this}
         */
        public Builder sourceJson(java.lang.String sourceJson) {
            this.sourceJson = sourceJson;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getSourcePolicyDocuments}
         * @param sourcePolicyDocuments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#source_policy_documents DataAwsIamPolicyDocument#source_policy_documents}.
         * @return {@code this}
         */
        public Builder sourcePolicyDocuments(java.util.List<java.lang.String> sourcePolicyDocuments) {
            this.sourcePolicyDocuments = sourcePolicyDocuments;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getStatement}
         * @param statement statement block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#statement DataAwsIamPolicyDocument#statement}
         * @return {@code this}
         */
        public Builder statement(com.hashicorp.cdktf.IResolvable statement) {
            this.statement = statement;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getStatement}
         * @param statement statement block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#statement DataAwsIamPolicyDocument#statement}
         * @return {@code this}
         */
        public Builder statement(java.util.List<? extends imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement> statement) {
            this.statement = statement;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/iam_policy_document#version DataAwsIamPolicyDocument#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIamPolicyDocumentConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsIamPolicyDocumentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIamPolicyDocumentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIamPolicyDocumentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIamPolicyDocumentConfig {
        private final java.lang.String id;
        private final java.lang.String overrideJson;
        private final java.util.List<java.lang.String> overridePolicyDocuments;
        private final java.lang.String policyId;
        private final java.lang.String sourceJson;
        private final java.util.List<java.lang.String> sourcePolicyDocuments;
        private final java.lang.Object statement;
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
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overrideJson = software.amazon.jsii.Kernel.get(this, "overrideJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overridePolicyDocuments = software.amazon.jsii.Kernel.get(this, "overridePolicyDocuments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.policyId = software.amazon.jsii.Kernel.get(this, "policyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceJson = software.amazon.jsii.Kernel.get(this, "sourceJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourcePolicyDocuments = software.amazon.jsii.Kernel.get(this, "sourcePolicyDocuments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.statement = software.amazon.jsii.Kernel.get(this, "statement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.id = builder.id;
            this.overrideJson = builder.overrideJson;
            this.overridePolicyDocuments = builder.overridePolicyDocuments;
            this.policyId = builder.policyId;
            this.sourceJson = builder.sourceJson;
            this.sourcePolicyDocuments = builder.sourcePolicyDocuments;
            this.statement = builder.statement;
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
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getOverrideJson() {
            return this.overrideJson;
        }

        @Override
        public final java.util.List<java.lang.String> getOverridePolicyDocuments() {
            return this.overridePolicyDocuments;
        }

        @Override
        public final java.lang.String getPolicyId() {
            return this.policyId;
        }

        @Override
        public final java.lang.String getSourceJson() {
            return this.sourceJson;
        }

        @Override
        public final java.util.List<java.lang.String> getSourcePolicyDocuments() {
            return this.sourcePolicyDocuments;
        }

        @Override
        public final java.lang.Object getStatement() {
            return this.statement;
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

            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOverrideJson() != null) {
                data.set("overrideJson", om.valueToTree(this.getOverrideJson()));
            }
            if (this.getOverridePolicyDocuments() != null) {
                data.set("overridePolicyDocuments", om.valueToTree(this.getOverridePolicyDocuments()));
            }
            if (this.getPolicyId() != null) {
                data.set("policyId", om.valueToTree(this.getPolicyId()));
            }
            if (this.getSourceJson() != null) {
                data.set("sourceJson", om.valueToTree(this.getSourceJson()));
            }
            if (this.getSourcePolicyDocuments() != null) {
                data.set("sourcePolicyDocuments", om.valueToTree(this.getSourcePolicyDocuments()));
            }
            if (this.getStatement() != null) {
                data.set("statement", om.valueToTree(this.getStatement()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIamPolicyDocumentConfig.Jsii$Proxy that = (DataAwsIamPolicyDocumentConfig.Jsii$Proxy) o;

            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.overrideJson != null ? !this.overrideJson.equals(that.overrideJson) : that.overrideJson != null) return false;
            if (this.overridePolicyDocuments != null ? !this.overridePolicyDocuments.equals(that.overridePolicyDocuments) : that.overridePolicyDocuments != null) return false;
            if (this.policyId != null ? !this.policyId.equals(that.policyId) : that.policyId != null) return false;
            if (this.sourceJson != null ? !this.sourceJson.equals(that.sourceJson) : that.sourceJson != null) return false;
            if (this.sourcePolicyDocuments != null ? !this.sourcePolicyDocuments.equals(that.sourcePolicyDocuments) : that.sourcePolicyDocuments != null) return false;
            if (this.statement != null ? !this.statement.equals(that.statement) : that.statement != null) return false;
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
            int result = this.id != null ? this.id.hashCode() : 0;
            result = 31 * result + (this.overrideJson != null ? this.overrideJson.hashCode() : 0);
            result = 31 * result + (this.overridePolicyDocuments != null ? this.overridePolicyDocuments.hashCode() : 0);
            result = 31 * result + (this.policyId != null ? this.policyId.hashCode() : 0);
            result = 31 * result + (this.sourceJson != null ? this.sourceJson.hashCode() : 0);
            result = 31 * result + (this.sourcePolicyDocuments != null ? this.sourcePolicyDocuments.hashCode() : 0);
            result = 31 * result + (this.statement != null ? this.statement.hashCode() : 0);
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
