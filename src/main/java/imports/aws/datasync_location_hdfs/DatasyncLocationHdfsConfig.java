package imports.aws.datasync_location_hdfs;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.947Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationHdfs.DatasyncLocationHdfsConfig")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationHdfsConfig.Jsii$Proxy.class)
public interface DatasyncLocationHdfsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#agent_arns DatasyncLocationHdfs#agent_arns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAgentArns();

    /**
     * name_node block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#name_node DatasyncLocationHdfs#name_node}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getNameNode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#authentication_type DatasyncLocationHdfs#authentication_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#block_size DatasyncLocationHdfs#block_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBlockSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#id DatasyncLocationHdfs#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab DatasyncLocationHdfs#kerberos_keytab}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKerberosKeytab() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab_base64 DatasyncLocationHdfs#kerberos_keytab_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKerberosKeytabBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf DatasyncLocationHdfs#kerberos_krb5_conf}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKerberosKrb5Conf() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf_base64 DatasyncLocationHdfs#kerberos_krb5_conf_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKerberosKrb5ConfBase64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_principal DatasyncLocationHdfs#kerberos_principal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKerberosPrincipal() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kms_key_provider_uri DatasyncLocationHdfs#kms_key_provider_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyProviderUri() {
        return null;
    }

    /**
     * qop_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#qop_configuration DatasyncLocationHdfs#qop_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration getQopConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#replication_factor DatasyncLocationHdfs#replication_factor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReplicationFactor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#simple_user DatasyncLocationHdfs#simple_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSimpleUser() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#subdirectory DatasyncLocationHdfs#subdirectory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdirectory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags DatasyncLocationHdfs#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags_all DatasyncLocationHdfs#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationHdfsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationHdfsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationHdfsConfig> {
        java.util.List<java.lang.String> agentArns;
        java.lang.Object nameNode;
        java.lang.String authenticationType;
        java.lang.Number blockSize;
        java.lang.String id;
        java.lang.String kerberosKeytab;
        java.lang.String kerberosKeytabBase64;
        java.lang.String kerberosKrb5Conf;
        java.lang.String kerberosKrb5ConfBase64;
        java.lang.String kerberosPrincipal;
        java.lang.String kmsKeyProviderUri;
        imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration qopConfiguration;
        java.lang.Number replicationFactor;
        java.lang.String simpleUser;
        java.lang.String subdirectory;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getAgentArns}
         * @param agentArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#agent_arns DatasyncLocationHdfs#agent_arns}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentArns(java.util.List<java.lang.String> agentArns) {
            this.agentArns = agentArns;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getNameNode}
         * @param nameNode name_node block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#name_node DatasyncLocationHdfs#name_node}
         * @return {@code this}
         */
        public Builder nameNode(com.hashicorp.cdktf.IResolvable nameNode) {
            this.nameNode = nameNode;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getNameNode}
         * @param nameNode name_node block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#name_node DatasyncLocationHdfs#name_node}
         * @return {@code this}
         */
        public Builder nameNode(java.util.List<? extends imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNode> nameNode) {
            this.nameNode = nameNode;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getAuthenticationType}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#authentication_type DatasyncLocationHdfs#authentication_type}.
         * @return {@code this}
         */
        public Builder authenticationType(java.lang.String authenticationType) {
            this.authenticationType = authenticationType;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getBlockSize}
         * @param blockSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#block_size DatasyncLocationHdfs#block_size}.
         * @return {@code this}
         */
        public Builder blockSize(java.lang.Number blockSize) {
            this.blockSize = blockSize;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#id DatasyncLocationHdfs#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getKerberosKeytab}
         * @param kerberosKeytab Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab DatasyncLocationHdfs#kerberos_keytab}.
         * @return {@code this}
         */
        public Builder kerberosKeytab(java.lang.String kerberosKeytab) {
            this.kerberosKeytab = kerberosKeytab;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getKerberosKeytabBase64}
         * @param kerberosKeytabBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab_base64 DatasyncLocationHdfs#kerberos_keytab_base64}.
         * @return {@code this}
         */
        public Builder kerberosKeytabBase64(java.lang.String kerberosKeytabBase64) {
            this.kerberosKeytabBase64 = kerberosKeytabBase64;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getKerberosKrb5Conf}
         * @param kerberosKrb5Conf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf DatasyncLocationHdfs#kerberos_krb5_conf}.
         * @return {@code this}
         */
        public Builder kerberosKrb5Conf(java.lang.String kerberosKrb5Conf) {
            this.kerberosKrb5Conf = kerberosKrb5Conf;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getKerberosKrb5ConfBase64}
         * @param kerberosKrb5ConfBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf_base64 DatasyncLocationHdfs#kerberos_krb5_conf_base64}.
         * @return {@code this}
         */
        public Builder kerberosKrb5ConfBase64(java.lang.String kerberosKrb5ConfBase64) {
            this.kerberosKrb5ConfBase64 = kerberosKrb5ConfBase64;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getKerberosPrincipal}
         * @param kerberosPrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_principal DatasyncLocationHdfs#kerberos_principal}.
         * @return {@code this}
         */
        public Builder kerberosPrincipal(java.lang.String kerberosPrincipal) {
            this.kerberosPrincipal = kerberosPrincipal;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getKmsKeyProviderUri}
         * @param kmsKeyProviderUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kms_key_provider_uri DatasyncLocationHdfs#kms_key_provider_uri}.
         * @return {@code this}
         */
        public Builder kmsKeyProviderUri(java.lang.String kmsKeyProviderUri) {
            this.kmsKeyProviderUri = kmsKeyProviderUri;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getQopConfiguration}
         * @param qopConfiguration qop_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#qop_configuration DatasyncLocationHdfs#qop_configuration}
         * @return {@code this}
         */
        public Builder qopConfiguration(imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration qopConfiguration) {
            this.qopConfiguration = qopConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getReplicationFactor}
         * @param replicationFactor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#replication_factor DatasyncLocationHdfs#replication_factor}.
         * @return {@code this}
         */
        public Builder replicationFactor(java.lang.Number replicationFactor) {
            this.replicationFactor = replicationFactor;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getSimpleUser}
         * @param simpleUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#simple_user DatasyncLocationHdfs#simple_user}.
         * @return {@code this}
         */
        public Builder simpleUser(java.lang.String simpleUser) {
            this.simpleUser = simpleUser;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getSubdirectory}
         * @param subdirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#subdirectory DatasyncLocationHdfs#subdirectory}.
         * @return {@code this}
         */
        public Builder subdirectory(java.lang.String subdirectory) {
            this.subdirectory = subdirectory;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags DatasyncLocationHdfs#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags_all DatasyncLocationHdfs#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getDependsOn}
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
         * Sets the value of {@link DatasyncLocationHdfsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationHdfsConfig#getProvisioners}
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
         * @return a new instance of {@link DatasyncLocationHdfsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationHdfsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationHdfsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationHdfsConfig {
        private final java.util.List<java.lang.String> agentArns;
        private final java.lang.Object nameNode;
        private final java.lang.String authenticationType;
        private final java.lang.Number blockSize;
        private final java.lang.String id;
        private final java.lang.String kerberosKeytab;
        private final java.lang.String kerberosKeytabBase64;
        private final java.lang.String kerberosKrb5Conf;
        private final java.lang.String kerberosKrb5ConfBase64;
        private final java.lang.String kerberosPrincipal;
        private final java.lang.String kmsKeyProviderUri;
        private final imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration qopConfiguration;
        private final java.lang.Number replicationFactor;
        private final java.lang.String simpleUser;
        private final java.lang.String subdirectory;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.agentArns = software.amazon.jsii.Kernel.get(this, "agentArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.nameNode = software.amazon.jsii.Kernel.get(this, "nameNode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.authenticationType = software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blockSize = software.amazon.jsii.Kernel.get(this, "blockSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kerberosKeytab = software.amazon.jsii.Kernel.get(this, "kerberosKeytab", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kerberosKeytabBase64 = software.amazon.jsii.Kernel.get(this, "kerberosKeytabBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kerberosKrb5Conf = software.amazon.jsii.Kernel.get(this, "kerberosKrb5Conf", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kerberosKrb5ConfBase64 = software.amazon.jsii.Kernel.get(this, "kerberosKrb5ConfBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kerberosPrincipal = software.amazon.jsii.Kernel.get(this, "kerberosPrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyProviderUri = software.amazon.jsii.Kernel.get(this, "kmsKeyProviderUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.qopConfiguration = software.amazon.jsii.Kernel.get(this, "qopConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration.class));
            this.replicationFactor = software.amazon.jsii.Kernel.get(this, "replicationFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.simpleUser = software.amazon.jsii.Kernel.get(this, "simpleUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subdirectory = software.amazon.jsii.Kernel.get(this, "subdirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.agentArns = java.util.Objects.requireNonNull(builder.agentArns, "agentArns is required");
            this.nameNode = java.util.Objects.requireNonNull(builder.nameNode, "nameNode is required");
            this.authenticationType = builder.authenticationType;
            this.blockSize = builder.blockSize;
            this.id = builder.id;
            this.kerberosKeytab = builder.kerberosKeytab;
            this.kerberosKeytabBase64 = builder.kerberosKeytabBase64;
            this.kerberosKrb5Conf = builder.kerberosKrb5Conf;
            this.kerberosKrb5ConfBase64 = builder.kerberosKrb5ConfBase64;
            this.kerberosPrincipal = builder.kerberosPrincipal;
            this.kmsKeyProviderUri = builder.kmsKeyProviderUri;
            this.qopConfiguration = builder.qopConfiguration;
            this.replicationFactor = builder.replicationFactor;
            this.simpleUser = builder.simpleUser;
            this.subdirectory = builder.subdirectory;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getAgentArns() {
            return this.agentArns;
        }

        @Override
        public final java.lang.Object getNameNode() {
            return this.nameNode;
        }

        @Override
        public final java.lang.String getAuthenticationType() {
            return this.authenticationType;
        }

        @Override
        public final java.lang.Number getBlockSize() {
            return this.blockSize;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKerberosKeytab() {
            return this.kerberosKeytab;
        }

        @Override
        public final java.lang.String getKerberosKeytabBase64() {
            return this.kerberosKeytabBase64;
        }

        @Override
        public final java.lang.String getKerberosKrb5Conf() {
            return this.kerberosKrb5Conf;
        }

        @Override
        public final java.lang.String getKerberosKrb5ConfBase64() {
            return this.kerberosKrb5ConfBase64;
        }

        @Override
        public final java.lang.String getKerberosPrincipal() {
            return this.kerberosPrincipal;
        }

        @Override
        public final java.lang.String getKmsKeyProviderUri() {
            return this.kmsKeyProviderUri;
        }

        @Override
        public final imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration getQopConfiguration() {
            return this.qopConfiguration;
        }

        @Override
        public final java.lang.Number getReplicationFactor() {
            return this.replicationFactor;
        }

        @Override
        public final java.lang.String getSimpleUser() {
            return this.simpleUser;
        }

        @Override
        public final java.lang.String getSubdirectory() {
            return this.subdirectory;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("agentArns", om.valueToTree(this.getAgentArns()));
            data.set("nameNode", om.valueToTree(this.getNameNode()));
            if (this.getAuthenticationType() != null) {
                data.set("authenticationType", om.valueToTree(this.getAuthenticationType()));
            }
            if (this.getBlockSize() != null) {
                data.set("blockSize", om.valueToTree(this.getBlockSize()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKerberosKeytab() != null) {
                data.set("kerberosKeytab", om.valueToTree(this.getKerberosKeytab()));
            }
            if (this.getKerberosKeytabBase64() != null) {
                data.set("kerberosKeytabBase64", om.valueToTree(this.getKerberosKeytabBase64()));
            }
            if (this.getKerberosKrb5Conf() != null) {
                data.set("kerberosKrb5Conf", om.valueToTree(this.getKerberosKrb5Conf()));
            }
            if (this.getKerberosKrb5ConfBase64() != null) {
                data.set("kerberosKrb5ConfBase64", om.valueToTree(this.getKerberosKrb5ConfBase64()));
            }
            if (this.getKerberosPrincipal() != null) {
                data.set("kerberosPrincipal", om.valueToTree(this.getKerberosPrincipal()));
            }
            if (this.getKmsKeyProviderUri() != null) {
                data.set("kmsKeyProviderUri", om.valueToTree(this.getKmsKeyProviderUri()));
            }
            if (this.getQopConfiguration() != null) {
                data.set("qopConfiguration", om.valueToTree(this.getQopConfiguration()));
            }
            if (this.getReplicationFactor() != null) {
                data.set("replicationFactor", om.valueToTree(this.getReplicationFactor()));
            }
            if (this.getSimpleUser() != null) {
                data.set("simpleUser", om.valueToTree(this.getSimpleUser()));
            }
            if (this.getSubdirectory() != null) {
                data.set("subdirectory", om.valueToTree(this.getSubdirectory()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.datasyncLocationHdfs.DatasyncLocationHdfsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationHdfsConfig.Jsii$Proxy that = (DatasyncLocationHdfsConfig.Jsii$Proxy) o;

            if (!agentArns.equals(that.agentArns)) return false;
            if (!nameNode.equals(that.nameNode)) return false;
            if (this.authenticationType != null ? !this.authenticationType.equals(that.authenticationType) : that.authenticationType != null) return false;
            if (this.blockSize != null ? !this.blockSize.equals(that.blockSize) : that.blockSize != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kerberosKeytab != null ? !this.kerberosKeytab.equals(that.kerberosKeytab) : that.kerberosKeytab != null) return false;
            if (this.kerberosKeytabBase64 != null ? !this.kerberosKeytabBase64.equals(that.kerberosKeytabBase64) : that.kerberosKeytabBase64 != null) return false;
            if (this.kerberosKrb5Conf != null ? !this.kerberosKrb5Conf.equals(that.kerberosKrb5Conf) : that.kerberosKrb5Conf != null) return false;
            if (this.kerberosKrb5ConfBase64 != null ? !this.kerberosKrb5ConfBase64.equals(that.kerberosKrb5ConfBase64) : that.kerberosKrb5ConfBase64 != null) return false;
            if (this.kerberosPrincipal != null ? !this.kerberosPrincipal.equals(that.kerberosPrincipal) : that.kerberosPrincipal != null) return false;
            if (this.kmsKeyProviderUri != null ? !this.kmsKeyProviderUri.equals(that.kmsKeyProviderUri) : that.kmsKeyProviderUri != null) return false;
            if (this.qopConfiguration != null ? !this.qopConfiguration.equals(that.qopConfiguration) : that.qopConfiguration != null) return false;
            if (this.replicationFactor != null ? !this.replicationFactor.equals(that.replicationFactor) : that.replicationFactor != null) return false;
            if (this.simpleUser != null ? !this.simpleUser.equals(that.simpleUser) : that.simpleUser != null) return false;
            if (this.subdirectory != null ? !this.subdirectory.equals(that.subdirectory) : that.subdirectory != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.agentArns.hashCode();
            result = 31 * result + (this.nameNode.hashCode());
            result = 31 * result + (this.authenticationType != null ? this.authenticationType.hashCode() : 0);
            result = 31 * result + (this.blockSize != null ? this.blockSize.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kerberosKeytab != null ? this.kerberosKeytab.hashCode() : 0);
            result = 31 * result + (this.kerberosKeytabBase64 != null ? this.kerberosKeytabBase64.hashCode() : 0);
            result = 31 * result + (this.kerberosKrb5Conf != null ? this.kerberosKrb5Conf.hashCode() : 0);
            result = 31 * result + (this.kerberosKrb5ConfBase64 != null ? this.kerberosKrb5ConfBase64.hashCode() : 0);
            result = 31 * result + (this.kerberosPrincipal != null ? this.kerberosPrincipal.hashCode() : 0);
            result = 31 * result + (this.kmsKeyProviderUri != null ? this.kmsKeyProviderUri.hashCode() : 0);
            result = 31 * result + (this.qopConfiguration != null ? this.qopConfiguration.hashCode() : 0);
            result = 31 * result + (this.replicationFactor != null ? this.replicationFactor.hashCode() : 0);
            result = 31 * result + (this.simpleUser != null ? this.simpleUser.hashCode() : 0);
            result = 31 * result + (this.subdirectory != null ? this.subdirectory.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
