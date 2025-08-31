package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.329Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageAction")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageAction.Jsii$Proxy.class)
public interface CodepipelineStageAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCategory();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwner();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProvider();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInputArtifacts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#namespace Codepipeline#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#output_artifacts Codepipeline#output_artifacts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOutputArtifacts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#run_order Codepipeline#run_order}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRunOrder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStageAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageAction> {
        java.lang.String category;
        java.lang.String name;
        java.lang.String owner;
        java.lang.String provider;
        java.lang.String version;
        java.util.Map<java.lang.String, java.lang.String> configuration;
        java.util.List<java.lang.String> inputArtifacts;
        java.lang.String namespace;
        java.util.List<java.lang.String> outputArtifacts;
        java.lang.String region;
        java.lang.String roleArn;
        java.lang.Number runOrder;
        java.lang.Number timeoutInMinutes;

        /**
         * Sets the value of {@link CodepipelineStageAction#getCategory}
         * @param category Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}. This parameter is required.
         * @return {@code this}
         */
        public Builder category(java.lang.String category) {
            this.category = category;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}. This parameter is required.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getProvider}
         * @param provider Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}. This parameter is required.
         * @return {@code this}
         */
        public Builder provider(java.lang.String provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}. This parameter is required.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getConfiguration}
         * @param configuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#configuration Codepipeline#configuration}.
         * @return {@code this}
         */
        public Builder configuration(java.util.Map<java.lang.String, java.lang.String> configuration) {
            this.configuration = configuration;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getInputArtifacts}
         * @param inputArtifacts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#input_artifacts Codepipeline#input_artifacts}.
         * @return {@code this}
         */
        public Builder inputArtifacts(java.util.List<java.lang.String> inputArtifacts) {
            this.inputArtifacts = inputArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#namespace Codepipeline#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getOutputArtifacts}
         * @param outputArtifacts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#output_artifacts Codepipeline#output_artifacts}.
         * @return {@code this}
         */
        public Builder outputArtifacts(java.util.List<java.lang.String> outputArtifacts) {
            this.outputArtifacts = outputArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#region Codepipeline#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#role_arn Codepipeline#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getRunOrder}
         * @param runOrder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#run_order Codepipeline#run_order}.
         * @return {@code this}
         */
        public Builder runOrder(java.lang.Number runOrder) {
            this.runOrder = runOrder;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageAction#getTimeoutInMinutes}
         * @param timeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#timeout_in_minutes Codepipeline#timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder timeoutInMinutes(java.lang.Number timeoutInMinutes) {
            this.timeoutInMinutes = timeoutInMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageAction {
        private final java.lang.String category;
        private final java.lang.String name;
        private final java.lang.String owner;
        private final java.lang.String provider;
        private final java.lang.String version;
        private final java.util.Map<java.lang.String, java.lang.String> configuration;
        private final java.util.List<java.lang.String> inputArtifacts;
        private final java.lang.String namespace;
        private final java.util.List<java.lang.String> outputArtifacts;
        private final java.lang.String region;
        private final java.lang.String roleArn;
        private final java.lang.Number runOrder;
        private final java.lang.Number timeoutInMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.category = software.amazon.jsii.Kernel.get(this, "category", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configuration = software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inputArtifacts = software.amazon.jsii.Kernel.get(this, "inputArtifacts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputArtifacts = software.amazon.jsii.Kernel.get(this, "outputArtifacts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runOrder = software.amazon.jsii.Kernel.get(this, "runOrder", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeoutInMinutes = software.amazon.jsii.Kernel.get(this, "timeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.category = java.util.Objects.requireNonNull(builder.category, "category is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.owner = java.util.Objects.requireNonNull(builder.owner, "owner is required");
            this.provider = java.util.Objects.requireNonNull(builder.provider, "provider is required");
            this.version = java.util.Objects.requireNonNull(builder.version, "version is required");
            this.configuration = builder.configuration;
            this.inputArtifacts = builder.inputArtifacts;
            this.namespace = builder.namespace;
            this.outputArtifacts = builder.outputArtifacts;
            this.region = builder.region;
            this.roleArn = builder.roleArn;
            this.runOrder = builder.runOrder;
            this.timeoutInMinutes = builder.timeoutInMinutes;
        }

        @Override
        public final java.lang.String getCategory() {
            return this.category;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        public final java.lang.String getProvider() {
            return this.provider;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getConfiguration() {
            return this.configuration;
        }

        @Override
        public final java.util.List<java.lang.String> getInputArtifacts() {
            return this.inputArtifacts;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.util.List<java.lang.String> getOutputArtifacts() {
            return this.outputArtifacts;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Number getRunOrder() {
            return this.runOrder;
        }

        @Override
        public final java.lang.Number getTimeoutInMinutes() {
            return this.timeoutInMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("category", om.valueToTree(this.getCategory()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("owner", om.valueToTree(this.getOwner()));
            data.set("provider", om.valueToTree(this.getProvider()));
            data.set("version", om.valueToTree(this.getVersion()));
            if (this.getConfiguration() != null) {
                data.set("configuration", om.valueToTree(this.getConfiguration()));
            }
            if (this.getInputArtifacts() != null) {
                data.set("inputArtifacts", om.valueToTree(this.getInputArtifacts()));
            }
            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }
            if (this.getOutputArtifacts() != null) {
                data.set("outputArtifacts", om.valueToTree(this.getOutputArtifacts()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getRunOrder() != null) {
                data.set("runOrder", om.valueToTree(this.getRunOrder()));
            }
            if (this.getTimeoutInMinutes() != null) {
                data.set("timeoutInMinutes", om.valueToTree(this.getTimeoutInMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageAction.Jsii$Proxy that = (CodepipelineStageAction.Jsii$Proxy) o;

            if (!category.equals(that.category)) return false;
            if (!name.equals(that.name)) return false;
            if (!owner.equals(that.owner)) return false;
            if (!provider.equals(that.provider)) return false;
            if (!version.equals(that.version)) return false;
            if (this.configuration != null ? !this.configuration.equals(that.configuration) : that.configuration != null) return false;
            if (this.inputArtifacts != null ? !this.inputArtifacts.equals(that.inputArtifacts) : that.inputArtifacts != null) return false;
            if (this.namespace != null ? !this.namespace.equals(that.namespace) : that.namespace != null) return false;
            if (this.outputArtifacts != null ? !this.outputArtifacts.equals(that.outputArtifacts) : that.outputArtifacts != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.runOrder != null ? !this.runOrder.equals(that.runOrder) : that.runOrder != null) return false;
            return this.timeoutInMinutes != null ? this.timeoutInMinutes.equals(that.timeoutInMinutes) : that.timeoutInMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.category.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.owner.hashCode());
            result = 31 * result + (this.provider.hashCode());
            result = 31 * result + (this.version.hashCode());
            result = 31 * result + (this.configuration != null ? this.configuration.hashCode() : 0);
            result = 31 * result + (this.inputArtifacts != null ? this.inputArtifacts.hashCode() : 0);
            result = 31 * result + (this.namespace != null ? this.namespace.hashCode() : 0);
            result = 31 * result + (this.outputArtifacts != null ? this.outputArtifacts.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.runOrder != null ? this.runOrder.hashCode() : 0);
            result = 31 * result + (this.timeoutInMinutes != null ? this.timeoutInMinutes.hashCode() : 0);
            return result;
        }
    }
}
