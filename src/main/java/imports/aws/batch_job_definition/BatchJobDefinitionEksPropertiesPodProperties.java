package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.130Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodProperties")
@software.amazon.jsii.Jsii.Proxy(BatchJobDefinitionEksPropertiesPodProperties.Jsii$Proxy.class)
public interface BatchJobDefinitionEksPropertiesPodProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * containers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#containers BatchJobDefinition#containers}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getContainers();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#dns_policy BatchJobDefinition#dns_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDnsPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_network BatchJobDefinition#host_network}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHostNetwork() {
        return null;
    }

    /**
     * image_pull_secret block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_secret BatchJobDefinition#image_pull_secret}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImagePullSecret() {
        return null;
    }

    /**
     * init_containers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#init_containers BatchJobDefinition#init_containers}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInitContainers() {
        return null;
    }

    /**
     * metadata block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#metadata BatchJobDefinition#metadata}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata getMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#service_account_name BatchJobDefinition#service_account_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#share_process_namespace BatchJobDefinition#share_process_namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getShareProcessNamespace() {
        return null;
    }

    /**
     * volumes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volumes BatchJobDefinition#volumes}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVolumes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchJobDefinitionEksPropertiesPodProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchJobDefinitionEksPropertiesPodProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchJobDefinitionEksPropertiesPodProperties> {
        java.lang.Object containers;
        java.lang.String dnsPolicy;
        java.lang.Object hostNetwork;
        java.lang.Object imagePullSecret;
        java.lang.Object initContainers;
        imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata metadata;
        java.lang.String serviceAccountName;
        java.lang.Object shareProcessNamespace;
        java.lang.Object volumes;

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getContainers}
         * @param containers containers block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#containers BatchJobDefinition#containers}
         * @return {@code this}
         */
        public Builder containers(com.hashicorp.cdktf.IResolvable containers) {
            this.containers = containers;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getContainers}
         * @param containers containers block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#containers BatchJobDefinition#containers}
         * @return {@code this}
         */
        public Builder containers(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesContainers> containers) {
            this.containers = containers;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getDnsPolicy}
         * @param dnsPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#dns_policy BatchJobDefinition#dns_policy}.
         * @return {@code this}
         */
        public Builder dnsPolicy(java.lang.String dnsPolicy) {
            this.dnsPolicy = dnsPolicy;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getHostNetwork}
         * @param hostNetwork Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_network BatchJobDefinition#host_network}.
         * @return {@code this}
         */
        public Builder hostNetwork(java.lang.Boolean hostNetwork) {
            this.hostNetwork = hostNetwork;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getHostNetwork}
         * @param hostNetwork Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#host_network BatchJobDefinition#host_network}.
         * @return {@code this}
         */
        public Builder hostNetwork(com.hashicorp.cdktf.IResolvable hostNetwork) {
            this.hostNetwork = hostNetwork;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getImagePullSecret}
         * @param imagePullSecret image_pull_secret block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_secret BatchJobDefinition#image_pull_secret}
         * @return {@code this}
         */
        public Builder imagePullSecret(com.hashicorp.cdktf.IResolvable imagePullSecret) {
            this.imagePullSecret = imagePullSecret;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getImagePullSecret}
         * @param imagePullSecret image_pull_secret block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#image_pull_secret BatchJobDefinition#image_pull_secret}
         * @return {@code this}
         */
        public Builder imagePullSecret(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesImagePullSecret> imagePullSecret) {
            this.imagePullSecret = imagePullSecret;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getInitContainers}
         * @param initContainers init_containers block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#init_containers BatchJobDefinition#init_containers}
         * @return {@code this}
         */
        public Builder initContainers(com.hashicorp.cdktf.IResolvable initContainers) {
            this.initContainers = initContainers;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getInitContainers}
         * @param initContainers init_containers block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#init_containers BatchJobDefinition#init_containers}
         * @return {@code this}
         */
        public Builder initContainers(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainers> initContainers) {
            this.initContainers = initContainers;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getMetadata}
         * @param metadata metadata block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#metadata BatchJobDefinition#metadata}
         * @return {@code this}
         */
        public Builder metadata(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getServiceAccountName}
         * @param serviceAccountName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#service_account_name BatchJobDefinition#service_account_name}.
         * @return {@code this}
         */
        public Builder serviceAccountName(java.lang.String serviceAccountName) {
            this.serviceAccountName = serviceAccountName;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getShareProcessNamespace}
         * @param shareProcessNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#share_process_namespace BatchJobDefinition#share_process_namespace}.
         * @return {@code this}
         */
        public Builder shareProcessNamespace(java.lang.Boolean shareProcessNamespace) {
            this.shareProcessNamespace = shareProcessNamespace;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getShareProcessNamespace}
         * @param shareProcessNamespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#share_process_namespace BatchJobDefinition#share_process_namespace}.
         * @return {@code this}
         */
        public Builder shareProcessNamespace(com.hashicorp.cdktf.IResolvable shareProcessNamespace) {
            this.shareProcessNamespace = shareProcessNamespace;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getVolumes}
         * @param volumes volumes block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volumes BatchJobDefinition#volumes}
         * @return {@code this}
         */
        public Builder volumes(com.hashicorp.cdktf.IResolvable volumes) {
            this.volumes = volumes;
            return this;
        }

        /**
         * Sets the value of {@link BatchJobDefinitionEksPropertiesPodProperties#getVolumes}
         * @param volumes volumes block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_job_definition#volumes BatchJobDefinition#volumes}
         * @return {@code this}
         */
        public Builder volumes(java.util.List<? extends imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesVolumes> volumes) {
            this.volumes = volumes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchJobDefinitionEksPropertiesPodProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchJobDefinitionEksPropertiesPodProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchJobDefinitionEksPropertiesPodProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchJobDefinitionEksPropertiesPodProperties {
        private final java.lang.Object containers;
        private final java.lang.String dnsPolicy;
        private final java.lang.Object hostNetwork;
        private final java.lang.Object imagePullSecret;
        private final java.lang.Object initContainers;
        private final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata metadata;
        private final java.lang.String serviceAccountName;
        private final java.lang.Object shareProcessNamespace;
        private final java.lang.Object volumes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containers = software.amazon.jsii.Kernel.get(this, "containers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dnsPolicy = software.amazon.jsii.Kernel.get(this, "dnsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostNetwork = software.amazon.jsii.Kernel.get(this, "hostNetwork", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.imagePullSecret = software.amazon.jsii.Kernel.get(this, "imagePullSecret", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.initContainers = software.amazon.jsii.Kernel.get(this, "initContainers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.metadata = software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata.class));
            this.serviceAccountName = software.amazon.jsii.Kernel.get(this, "serviceAccountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shareProcessNamespace = software.amazon.jsii.Kernel.get(this, "shareProcessNamespace", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.volumes = software.amazon.jsii.Kernel.get(this, "volumes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containers = java.util.Objects.requireNonNull(builder.containers, "containers is required");
            this.dnsPolicy = builder.dnsPolicy;
            this.hostNetwork = builder.hostNetwork;
            this.imagePullSecret = builder.imagePullSecret;
            this.initContainers = builder.initContainers;
            this.metadata = builder.metadata;
            this.serviceAccountName = builder.serviceAccountName;
            this.shareProcessNamespace = builder.shareProcessNamespace;
            this.volumes = builder.volumes;
        }

        @Override
        public final java.lang.Object getContainers() {
            return this.containers;
        }

        @Override
        public final java.lang.String getDnsPolicy() {
            return this.dnsPolicy;
        }

        @Override
        public final java.lang.Object getHostNetwork() {
            return this.hostNetwork;
        }

        @Override
        public final java.lang.Object getImagePullSecret() {
            return this.imagePullSecret;
        }

        @Override
        public final java.lang.Object getInitContainers() {
            return this.initContainers;
        }

        @Override
        public final imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesMetadata getMetadata() {
            return this.metadata;
        }

        @Override
        public final java.lang.String getServiceAccountName() {
            return this.serviceAccountName;
        }

        @Override
        public final java.lang.Object getShareProcessNamespace() {
            return this.shareProcessNamespace;
        }

        @Override
        public final java.lang.Object getVolumes() {
            return this.volumes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("containers", om.valueToTree(this.getContainers()));
            if (this.getDnsPolicy() != null) {
                data.set("dnsPolicy", om.valueToTree(this.getDnsPolicy()));
            }
            if (this.getHostNetwork() != null) {
                data.set("hostNetwork", om.valueToTree(this.getHostNetwork()));
            }
            if (this.getImagePullSecret() != null) {
                data.set("imagePullSecret", om.valueToTree(this.getImagePullSecret()));
            }
            if (this.getInitContainers() != null) {
                data.set("initContainers", om.valueToTree(this.getInitContainers()));
            }
            if (this.getMetadata() != null) {
                data.set("metadata", om.valueToTree(this.getMetadata()));
            }
            if (this.getServiceAccountName() != null) {
                data.set("serviceAccountName", om.valueToTree(this.getServiceAccountName()));
            }
            if (this.getShareProcessNamespace() != null) {
                data.set("shareProcessNamespace", om.valueToTree(this.getShareProcessNamespace()));
            }
            if (this.getVolumes() != null) {
                data.set("volumes", om.valueToTree(this.getVolumes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchJobDefinitionEksPropertiesPodProperties.Jsii$Proxy that = (BatchJobDefinitionEksPropertiesPodProperties.Jsii$Proxy) o;

            if (!containers.equals(that.containers)) return false;
            if (this.dnsPolicy != null ? !this.dnsPolicy.equals(that.dnsPolicy) : that.dnsPolicy != null) return false;
            if (this.hostNetwork != null ? !this.hostNetwork.equals(that.hostNetwork) : that.hostNetwork != null) return false;
            if (this.imagePullSecret != null ? !this.imagePullSecret.equals(that.imagePullSecret) : that.imagePullSecret != null) return false;
            if (this.initContainers != null ? !this.initContainers.equals(that.initContainers) : that.initContainers != null) return false;
            if (this.metadata != null ? !this.metadata.equals(that.metadata) : that.metadata != null) return false;
            if (this.serviceAccountName != null ? !this.serviceAccountName.equals(that.serviceAccountName) : that.serviceAccountName != null) return false;
            if (this.shareProcessNamespace != null ? !this.shareProcessNamespace.equals(that.shareProcessNamespace) : that.shareProcessNamespace != null) return false;
            return this.volumes != null ? this.volumes.equals(that.volumes) : that.volumes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containers.hashCode();
            result = 31 * result + (this.dnsPolicy != null ? this.dnsPolicy.hashCode() : 0);
            result = 31 * result + (this.hostNetwork != null ? this.hostNetwork.hashCode() : 0);
            result = 31 * result + (this.imagePullSecret != null ? this.imagePullSecret.hashCode() : 0);
            result = 31 * result + (this.initContainers != null ? this.initContainers.hashCode() : 0);
            result = 31 * result + (this.metadata != null ? this.metadata.hashCode() : 0);
            result = 31 * result + (this.serviceAccountName != null ? this.serviceAccountName.hashCode() : 0);
            result = 31 * result + (this.shareProcessNamespace != null ? this.shareProcessNamespace.hashCode() : 0);
            result = 31 * result + (this.volumes != null ? this.volumes.hashCode() : 0);
            return result;
        }
    }
}
