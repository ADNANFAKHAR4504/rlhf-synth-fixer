package imports.aws.signer_signing_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.468Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.signerSigningJob.SignerSigningJobConfig")
@software.amazon.jsii.Jsii.Proxy(SignerSigningJobConfig.Jsii$Proxy.class)
public interface SignerSigningJobConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#destination SignerSigningJob#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobDestination getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#profile_name SignerSigningJob#profile_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProfileName();

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#source SignerSigningJob#source}
     */
    @org.jetbrains.annotations.NotNull imports.aws.signer_signing_job.SignerSigningJobSource getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#id SignerSigningJob#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIgnoreSigningJobFailure() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SignerSigningJobConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SignerSigningJobConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SignerSigningJobConfig> {
        imports.aws.signer_signing_job.SignerSigningJobDestination destination;
        java.lang.String profileName;
        imports.aws.signer_signing_job.SignerSigningJobSource source;
        java.lang.String id;
        java.lang.Object ignoreSigningJobFailure;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SignerSigningJobConfig#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#destination SignerSigningJob#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.signer_signing_job.SignerSigningJobDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getProfileName}
         * @param profileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#profile_name SignerSigningJob#profile_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder profileName(java.lang.String profileName) {
            this.profileName = profileName;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getSource}
         * @param source source block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#source SignerSigningJob#source}
         * @return {@code this}
         */
        public Builder source(imports.aws.signer_signing_job.SignerSigningJobSource source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#id SignerSigningJob#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getIgnoreSigningJobFailure}
         * @param ignoreSigningJobFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}.
         * @return {@code this}
         */
        public Builder ignoreSigningJobFailure(java.lang.Boolean ignoreSigningJobFailure) {
            this.ignoreSigningJobFailure = ignoreSigningJobFailure;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getIgnoreSigningJobFailure}
         * @param ignoreSigningJobFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/signer_signing_job#ignore_signing_job_failure SignerSigningJob#ignore_signing_job_failure}.
         * @return {@code this}
         */
        public Builder ignoreSigningJobFailure(com.hashicorp.cdktf.IResolvable ignoreSigningJobFailure) {
            this.ignoreSigningJobFailure = ignoreSigningJobFailure;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getDependsOn}
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
         * Sets the value of {@link SignerSigningJobConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SignerSigningJobConfig#getProvisioners}
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
         * @return a new instance of {@link SignerSigningJobConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SignerSigningJobConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SignerSigningJobConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SignerSigningJobConfig {
        private final imports.aws.signer_signing_job.SignerSigningJobDestination destination;
        private final java.lang.String profileName;
        private final imports.aws.signer_signing_job.SignerSigningJobSource source;
        private final java.lang.String id;
        private final java.lang.Object ignoreSigningJobFailure;
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
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobDestination.class));
            this.profileName = software.amazon.jsii.Kernel.get(this, "profileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(imports.aws.signer_signing_job.SignerSigningJobSource.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ignoreSigningJobFailure = software.amazon.jsii.Kernel.get(this, "ignoreSigningJobFailure", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.profileName = java.util.Objects.requireNonNull(builder.profileName, "profileName is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.id = builder.id;
            this.ignoreSigningJobFailure = builder.ignoreSigningJobFailure;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.signer_signing_job.SignerSigningJobDestination getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getProfileName() {
            return this.profileName;
        }

        @Override
        public final imports.aws.signer_signing_job.SignerSigningJobSource getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIgnoreSigningJobFailure() {
            return this.ignoreSigningJobFailure;
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

            data.set("destination", om.valueToTree(this.getDestination()));
            data.set("profileName", om.valueToTree(this.getProfileName()));
            data.set("source", om.valueToTree(this.getSource()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIgnoreSigningJobFailure() != null) {
                data.set("ignoreSigningJobFailure", om.valueToTree(this.getIgnoreSigningJobFailure()));
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
            struct.set("fqn", om.valueToTree("aws.signerSigningJob.SignerSigningJobConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SignerSigningJobConfig.Jsii$Proxy that = (SignerSigningJobConfig.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (!profileName.equals(that.profileName)) return false;
            if (!source.equals(that.source)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ignoreSigningJobFailure != null ? !this.ignoreSigningJobFailure.equals(that.ignoreSigningJobFailure) : that.ignoreSigningJobFailure != null) return false;
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
            int result = this.destination.hashCode();
            result = 31 * result + (this.profileName.hashCode());
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ignoreSigningJobFailure != null ? this.ignoreSigningJobFailure.hashCode() : 0);
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
