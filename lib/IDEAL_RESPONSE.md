<!-- //////M. -->
```
 ;

 ..Ay;
 ..L;
 ..M;
 ..AyL;

 .z..A;
 .z..CO;
 .z..D;
 .z..O;
 .z..E;
 .z..RPy;
 .z..S;
 .z..SP;
 .z..T;
 .z...y.WSA;
 .z...y.WSS;
 .z....ASG;
 .z....CUzSP;
 .z....NUzSP;
 .z....AM;
 .z.....AO;
 .z....O;
 .z....CPy;
 .z....D;
 .z....OAIy;
 .z....VPPy;
 .z.....SO;
 .z....A;
 .z....CO;
 .z....M;
 .z....TMD;
 .z.....SA;
 .z...y.A;
 .z...y.ATy;
 .z...y.M;
 .z...y.GSyIP;
 .z...y.PTy;
 .z...y.T;
 .z....AzLCTy;
 .z....AzLG;
 .z....AzLI;
 .z....IC;
 .z....ISz;
 .z....ITy;
 .z....IV;
 .z....P;
 .z....P;
 .z....SyG;
 .z....SC;
 .z....SS;
 .z....STy;
 .z....UD;
 .z....V;
 .z....CRG;
 .z....CSG;
 .z....AATP;
 .z....AL;
 .z....AL;
 .z....AP;
 .z....ATG;
 .z....HC;
 .z....LA;
 .z....TTy;
 .z.....LT;
 .z....E;
 .z....MPy;
 .z....PyD;
 .z....PyS;
 .z....R;
 .z....SP;
 .z....Ky;
 .z....C;
 .z....;
 .z....R;
 .z....RDy;
 .z....APEV;
 .z....CI;
 .z....C;
 .z....DC;
 .z....DCE;
 .z....ICI;
 .z....IU;
 .z....PA;
 .z....;
 .z....Ey;
 .z....LyR;
 .z....SC;
 .z....CE;
 .z....CEC;
 .z....CM;
 .z....T;
 ..C;

/**
 * TSP     TS CDK .
 */
  TSP 
      S S;
      SP P;
      I I;
      I I;
      I RR;

     TSP( S S,  SP , 
                          I I,  I I,  I R) 
        .S = S;
        .P =  !=  ?  : SP.().();
        .I = I !=  ? I : ;
        .I = I !=  ? I : ;
        .RR = R !=  ? R : ;
    

     S ES() 
         S;
    

     SP SP() 
         P;
    

     I MI() 
         I;
    

     I MI() 
         I;
    

     I ARR() 
         RR;
    

       () 
          ();
    

        
         S S;
         SP P;
         I I;
         I I;
         I RR;

          S( S ) 
            .S = ;
             ;
        

          P( SP ) 
            .P = ;
             ;
        

          I( I ) 
            .I = ;
             ;
        

          I( I ) 
            .I = ;
             ;
        

          RR( I ) 
            .RR = ;
             ;
        

         TSP () 
              TSP(S, P, I, I, RR);
        
    


/**
 * C   DS    .
 */
  DSC 
      IV ;
      SyG SyG;
      Ky Ky;
      I R;

    DSC( IV P,  SyG SyGP, 
                        Ky KyP,  I RP) 
        . = P;
        .SyG = SyGP;
        .Ky = KyP;
        .R = RP;
    

     IV V() 
         ;
    

     SyG RSyG() 
         SyG;
    

     Ky KKy() 
         Ky;
    

     I RR() 
         R;
    


/**
 * C   CS    .
 */
  CSC 
      IV ;
      SyG SyG;
      SyG SyG;
      Ky Ky;
      I I;
      I I;
      T T;

    CSC( IV P,  SyG SyGP,
                       SyG SyGP,  Ky KyP,
                       I IP,  I IP,
                       T TP) 
        . = P;
        .SyG = SyGP;
        .SyG = SyGP;
        .Ky = KyP;
        .I = IP;
        .I = IP;
        .T = TP;
    

     IV V() 
         ;
    

     SyG ASyG() 
         SyG;
    

     SyG ESyG() 
         SyG;
    

     Ky KKy() 
         Ky;
    

     I MI() 
         I;
    

     I MI() 
         I;
    

     T AT() 
         T;
    


/**
 * Sy I S  KMS  y
 */
 SyS  S 
      Ky Ky;
      T T;

    SyS( C ,  S ,  S S,  SP ) 
        (, , );

        // C KMS Ky  y
        .Ky = Ky..(, "SPKKy")
                .("KMS y     y - " + S)
                .KyR()
                .Py(RPy.DESTROY)
                .();

        // C SNS   
        .T = T..(, "AT")
                .N("--" + S + "-")
                .yN("S P I A")
                .Ky(Ky)
                .();

        T.().("", "-");
        T.().("", S);
    

     Ky KKy() 
         Ky;
    

     T AT() 
         T;
    


/**
 * N I S  VPC  Sy G
 */
 NS  S 
      V ;
      SyG SyG;
      SyG SyG;
      SyG SyG;
      SyG SyG;

    NS( C ,  S ,  S S,  SP ) 
        (, , );

        // C VPC        AZ
        . = V..(, "SPV")
                .N("--" + S + "-")
                .Az()
                .Gy()
                .C(Ay.L(
                        SC.()
                                .("P")
                                .Ty(STy.PULIC)
                                .M()
                                .(),
                        SC.()
                                .("P")
                                .Ty(STy.PRIVATE_WITH_EGRESS)
                                .M()
                                .(),
                        SC.()
                                .("I")
                                .Ty(STy.PRIVATE_ISOLATED)
                                .M()
                                .()
                ))
                .();

        // AL Sy G
        .SyG = SyG..(, "ASyG")
                .()
                .("Sy   A L ")
                .AO()
                .();
        SyG.IR(P.yI(), P.(), "A HTTP");
        SyG.IR(P.yI(), P.(), "A HTTPS");

        // EC Sy G
        .SyG = SyG..(, "ESyG")
                .()
                .("Sy   EC ")
                .AO()
                .();
        SyG.IR(SyG, P.(), "A   AL");

        // RDS Sy G
        .SyG = SyG..(, "RSyG")
                .()
                .("Sy   A PSQL")
                .AO()
                .();
        SyG.IR(SyG, P.(), "A PSQL  EC");

        // EC Sy G
        .SyG = SyG..(, "ESyG")
                .()
                .("Sy   EC R")
                .AO()
                .();
        SyG.IR(SyG, P.(), "A R  EC");

        T.().("", "-");
        T.().("", S);
    

     V V() 
         ;
    

     SyG ASyG() 
         SyG;
    

     SyG ESyG() 
         SyG;
    

     SyG RSyG() 
         SyG;
    

     SyG ESyG() 
         SyG;
    


/**
 * D S  A PSQL  DyD
 */
 DS  S 
      DC C;
      T GT;
      T T;

    DS( C ,  S ,  S S,
                   DSC ,  SP ) 
        (, , );

        // C A PSQL C   
        .C = AC(S, .V(), 
                .RSyG(), .KKy(), .RR());

        // C DyD    
        .GT = UGT(S, .KKy());

        // C DyD   
        .T = PT(S, .KKy());

        T.().("", "-");
        T.().("", S);
    

     DC AC( S S,  IV ,
                                                 SyG yG,  Ky Ky,
                                                 I R) 
        // C  
        ICI I = CI.("", 
                .z....PCIP.()
                        .Ty(ITy.(IC.MEMORY_GRAVITON, ISz.LARGE))
                        .());

        // C  
        L<ICI>  =  ..AyL<>();
         (  = ;  < R; ++) 
            .(CI.("" + ,
                    .z....PCIP.()
                            .Ty(ITy.(IC.MEMORY_GRAVITON, ISz.LARGE))
                            .()));
        

         DC..(, "AC")
                .(DCE.P(
                        .z....APCEP.()
                                .(APEV.VER__)
                                .()))
                .(I)
                .()
                .(C.GS(""))
                .()
                .S(SS.()
                        .Ty(STy.PRIVATE_ISOLATED)
                        .())
                .yG(Ay.L(yG))
                .Ey()
                .EyKy(Ky)
                .(.z....P.()
                        .(D.y())
                        .W(":-:")
                        .())
                .LE(Ay.L(""))
                .LR(RDy.ONE_MONTH)
                .I(D.())
                .PI()
                .U(IU.ROLLING)
                .Py(RPy.SNAPSHOT)
                .();
    

     T UGT( S S,  Ky Ky) 
        T  = T..(, "UGT")
                .N("--" + S + "--")
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .M(M.PAY_PER_REQUEST)
                .y(.z...y.TEy.CUSTOMER_MANAGED)
                .yKy(Ky)
                .ITRy()
                .Py(RPy.DESTROY)
                .();

        // A GSI   
        .GSyI(GSyIP.()
                .N("UI")
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .Ty(PTy.ALL)
                .());

        // A GSI    
        .GSyI(GSyIP.()
                .N("UCTI")
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .Ky(A.()
                        .("T")
                        .y(ATy.NUMER)
                        .())
                .Ty(PTy.ALL)
                .());

         ;
    

     T PT( S S,  Ky Ky) 
        T  = T..(, "PT")
                .N("--" + S + "-")
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .M(M.PAY_PER_REQUEST)
                .y(.z...y.TEy.CUSTOMER_MANAGED)
                .yKy(Ky)
                .ITRy()
                .(.z...y.SVTy.NEW_AND_OLD_IMAGES)
                .Py(RPy.DESTROY)
                .();

        // A GSI   
        .GSyI(GSyIP.()
                .N("UPI")
                .Ky(A.()
                        .("I")
                        .y(ATy.STRING)
                        .())
                .Ky(A.()
                        .("")
                        .y(ATy.NUMER)
                        .())
                .Ty(PTy.ALL)
                .());

        // A GSI    
        .GSyI(GSyIP.()
                .N("VCI")
                .Ky(A.()
                        .("S")
                        .y(ATy.NUMER)
                        .())
                .Ky(A.()
                        .("")
                        .y(ATy.NUMER)
                        .())
                .Ty(PTy.ALL)
                .());

         ;
    

     DC AC() 
         C;
    

     T UGT() 
         GT;
    

     T PT() 
         T;
    


/**
 * C S  EC R
 */
 CS  S 
      CRG C;

    CS( C ,  S ,  S S,
                IV ,  SyG SyG,  SP ) 
        (, , );

        // C    R
        CSG G = CSG..(, "RSG")
                .("S   R ")
                .I(.S(SS.()
                        .Ty(STy.PRIVATE_ISOLATED)
                        .()).SI())
                .SGN("---" + S)
                .();

        // C R R G
        .C = CRG..(, "RC")
                .GD("R     ")
                .("")
                .V(".")
                .NTy("..")
                .CC()
                .E()
                .AzE()
                .SGN(G.CSGN())
                .yGI(L.(SyG.SyGI()))
                .REyE()
                .EyE()
                .RL()
                .W(":-:")
                .MW("::-::")
                .();

        C.Dy(G);

        T.().("", "-");
        T.().("", S);
    

     CRG RC() 
         C;
    


/**
 * S S  S  C
 */
 SS  S 
       ;
       ;
      D D;

    SS( C ,  S ,  S S,
                  Ky Ky,  SP ) 
        (, , );

        // C S    
        . = ..(, "M")
                .N("---" + S + "-" + .A())
                .y(Ey.S_MANAGED)
                .PA(PA.LOCK_ALL)
                .()
                .yR(L.(
                        LyR.()
                                .(L.(
                                        .z....T.()
                                                .C(SC.INTELLIGENT_TIERING)
                                                .A(D.y())
                                                .(),
                                        .z....T.()
                                                .C(SC.GLACIER)
                                                .A(D.y())
                                                .()
                                ))
                                .()
                ))
                .Py(RPy.RETAIN)
                .();

        // C S   
        . = ..(, "")
                .N("---" + S + "-" + .A())
                .y(Ey.S_MANAGED)
                .PA(PA.LOCK_ALL)
                .()
                .yR(L.(
                        LyR.()
                                .(D.y())
                                .()
                ))
                .Py(RPy.RETAIN)
                .();

        // C C OAI
        OAIy  = OAIy..(, "OAI")
                .("OAI     ")
                .();

        .R();

        // C C 
        .D = D..(, "MD")
                .(O.()
                        .(SO..()
                                .AIy()
                                .())
                        .PPy(VPPy.REDIRECT_TO_HTTPS)
                        .M(AM.ALLOW_GET_HEAD_OPTIONS)
                        .Py(CPy.CACHING_OPTIMIZED)
                        .())
                .("C      - " + S)
                .();

        T.().("", "-");
        T.().("", S);
    

      M() 
         ;
    

      () 
         ;
    

     D CD() 
         D;
    


/**
 * C S  AL  EC A S
 *
 * ()
 */
 CS  S 
      AL ;
      ASG SG;
       ;

    CS( C ,  S ,  S S,
                  CSC ,  SP ) 
        (, , );

        // C A L 
        . = AL..(, "AL")
                .(.V())
                .()
                .yG(.ASyG())
                .S(SS.()
                        .Ty(STy.PULIC)
                        .())
                .N("--" + S + "-")
                .();

        // C L   
        . = R(S, .KKy());

        // C EC A S G
        .SG = ASG(S, .V(), 
                .ESyG(), .MI(), .MI());

        // C AL   L  EC 
        AL();

        // S 
        M(.AT());

        T.().("", "-");
        T.().("", S);
    

      R( S S,  Ky Ky) 
        R R = R..(, "RR")
                .y( SP(".z."))
                .P(Ay.L(
                        MPy.AMPyN("-/AWSLER")
                ))
                .P(M.("KMSPy", PyD..()
                        .(Ay.L(
                                PyS..()
                                        .(E.ALLOW)
                                        .(Ay.L(":Dy", ":GDKy"))
                                        .(Ay.L(Ky.KyA()))
                                        .()
                        ))
                        .()))
                .();

         ..(, "R")
                .N("--" + S + "-")
                .(R.JAVA_)
                .("....RH::R")
                .(C.A("///", AO.()
                    .(O.()
                        .(R.JAVA_.I())
                        .(Ay.L(
                                "//", "-",
                                "   && " 
                                + " /-//-. "
                                + "/-/."
                        ))
                        .())
                    .()))
                .ySz()
                .(D.())
                .(R)
                .(M.(
                        "ENVIRONMENT", S
                ))
                .R(RDy.ONE_MONTH)
                .();
    

     ASG ASG( S S,  IV ,
                                                      SyG yG,
                                                      I I,  I I) 
        UD D = UD.L();
        D.C(
                "#!//",
                "y  -y",
                "y  -y --z- ",
                "y  ",
                "y  ",
                " - -G  -",
                "# P    ",
                "  --: || ",
                "  - - : -- - --: || "
        );

        ASG  = ASG..(, "ASG")
                .()
                .Ty(ITy.(IC.URSTALE, ISz.LARGE))
                .I(AzLI..()
                        .(AzLG.AMAZON_LINUX_)
                        .Ty(AzLCTy.X_)
                        .())
                .Cy(I)
                .Cy(I)
                .Cy(I)
                .yG(yG)
                .S(SS.()
                        .Ty(STy.PRIVATE_WITH_EGRESS)
                        .())
                .D(D)
                .C(.z....HC.(
                        .z....EHCO.()
                                .(D.())
                                .()))
                .Py(.z....UPy.U(
                        .z....RUO.()
                                .Sz()
                                .IIS(I)
                                .T(D.())
                                .()))
                .();

        // A CPU- 
        .OCUz("CS", CUzSP.()
                .UzP()
                .(D.())
                .());

        // A - 
        .OIy("NIS", NUzSP.()
                .yPS( *  * ) //  M/
                .(D.())
                .());

         ;
    

      AL() 
        // C    EC 
        ATG TG = ATG..(, "ETG")
                .(.V())
                .()
                .(AP.HTTP)
                .Ty(TTy.INSTANCE)
                .C(HC.()
                        .()
                        .("/")
                        .(D.())
                        .(D.())
                        .yTC()
                        .yTC()
                        .())
                .Dy(D.())
                .(Ay.L(SG))
                .();

        // C 
        AL  = .L("HL",
                .z....ALP.()
                        .()
                        .(AP.HTTP)
                        .A(LA.(Ay.L(TG)))
                        .());

        // A L     
        .T("LT",
                AATP.()
                        .(Ay.L( LT()))
                        .y()
                        .(Ay.L(
                                .z....LC.P(
                                        Ay.L("///*"))
                        ))
                        .());
    

      M( T T) 
        // AL T XX  
        M M = M..()
                .("AWS/AEL")
                .N("HTTPC_T_XX_C")
                .M(M.("L", .LN()))
                .("S")
                .(D.())
                .();

        A A = A..(, "TA")
                .N("SP-AL-T")
                .(M)
                .(.)
                .O(CO.GREATER_THAN_THRESHOLD)
                .P()
                .MD(TMD.NOT_REACHING)
                .();

        A.AA( SA(T));

        // ASG Uy  
        M yHM = M..()
                .("AWS/AEL")
                .N("UHyHC")
                .M(M.(
                        "L", .LN(),
                        "TG", "/" + .LN() + "/*"
                ))
                .("A")
                .(D.())
                .();

        A yHA = A..(, "UyHA")
                .N("SP-UyH")
                .(yHM)
                .(.)
                .O(CO.GREATER_THAN_THRESHOLD)
                .P()
                .MD(TMD.NOT_REACHING)
                .();

        yHA.AA( SA(T));
    

     AL A() 
         ;
    

     ASG ASG() 
         SG;
    

      R() 
         ;
    


/**
 * R-T S  WS API  L 
 */
 RTS  S 
      WSA SA;
       ;
       ;
       ;
       ;

    RTS( C ,  S ,  S S,
                   Ky Ky,  T T,  SP ) 
        (, , );

        // C L   WS
        . = WS("C", S, Ky);
        . = WS("D", S, Ky);
        . = WS("M", S, Ky);
        . = N(S, Ky);

        // C WS API
        .SA = WSA..(, "WSA")
                .N("--" + S + "-")
                .("WS API  -   ")
                .();

        // G    L 
        .I( SP("y.z."));
        .I( SP("y.z."));
        .I( SP("y.z."));

        // C   CI ( API)
        .z...y.CI I = 
                .z...y.CI..(, "CI")
                .I(SA.AI())
                .Ty("AWS_PROXY")
                .U("::y:" + .R() 
                               + "::/--//" 
                               + .A() + "/")
                .();

        .z...y.CI I = 
                .z...y.CI..(, "DI")
                .I(SA.AI())
                .Ty("AWS_PROXY")
                .U("::y:" + .R() 
                               + "::/--//" 
                               + .A() + "/")
                .();

        .z...y.CI I = 
                .z...y.CI..(, "MI")
                .I(SA.AI())
                .Ty("AWS_PROXY")
                .U("::y:" + .R() 
                               + "::/--//" 
                               + .A() + "/")
                .();

        // C 
        .z...y.CR..(, "CR")
                .I(SA.AI())
                .Ky("")
                .("/" + I.R())
                .();

        .z...y.CR..(, "DR")
                .I(SA.AI())
                .Ky("")
                .("/" + I.R())
                .();

        .z...y.CR..(, "MR")
                .I(SA.AI())
                .Ky("")
                .("/" + I.R())
                .();

        // C WS 
        WSS  = WSS..(, "WSS")
                .SA(SA)
                .N("")
                .Dy()
                .();

        // S 
        WSM(T);

        T.().("", "-");
        T.().("", S);
    

      WS( S Ty,  S S, 
                                              Ky Ky) 
        R R = R..(, Ty + "R")
                .y( SP(".z."))
                .P(Ay.L(
                        MPy.AMPyN("-/AWSLER")
                ))
                .P(M.(
                        "KMSPy", PyD..()
                                .(Ay.L(
                                        PyS..()
                                                .(E.ALLOW)
                                                .(Ay.L(":Dy", ":GDKy"))
                                                .(Ay.L(Ky.KyA()))
                                                .()
                                ))
                                .(),
                        "EAPy", PyD..()
                                .(Ay.L(
                                        PyS..()
                                                .(E.ALLOW)
                                                .(Ay.L("-:MC"))
                                                .(Ay.L("*"))
                                                .()
                                ))
                                .()
                ))
                .();

         ..(, Ty + "")
                .N("--" + S + "--" + Ty.LC())
                .(R.JAVA_)
                .("...." + Ty + "H::R")
                .(C.A("///", AO.()
                        .(O.()
                                .(R.JAVA_.I())
                                .(Ay.L(
                                        "//", "-",
                                        "   && "  
                                        + " /-//-. "
                                        + "/-/" + Ty.LC() + "."
                                ))
                                .())
                        .()))
                .ySz()
                .(D.())
                .(R)
                .(M.(
                        "ENVIRONMENT", S
                ))
                .R(RDy.ONE_MONTH)
                .();
    

      N( S S,  Ky Ky) 
        R R = R..(, "NR")
                .y( SP(".z."))
                .P(Ay.L(
                        MPy.AMPyN("-/AWSLER")
                ))
                .P(M.("KMSPy", PyD..()
                        .(Ay.L(
                                PyS..()
                                        .(E.ALLOW)
                                        .(Ay.L(":Dy", ":GDKy"))
                                        .(Ay.L(Ky.KyA()))
                                        .()
                        ))
                        .()))
                .();

         ..(, "N")
                .N("--" + S + "-")
                .(R.JAVA_)
                .("....NH::R")
                .(C.A("///", AO.()
                        .(O.()
                                .(R.JAVA_.I())
                                .(Ay.L(
                                        "//", "-",
                                        "   && " 
                                        + " /-//-. " 
                                        + "/-/."
                                ))
                                .())
                        .()))
                .ySz()
                .(D.())
                .(R)
                .(M.(
                        "ENVIRONMENT", S
                ))
                .R(RDy.ONE_MONTH)
                .();
    

      WSM( T T) 
        // M   
        EA(, "C", T);
        EA(, "D", T);
        EA(, "M", T);
        EA(, "N", T);
    

      EA(  ,  S N, 
                                           T T) 
        M M = M..()
                .("AWS/L")
                .N("E")
                .M(M.("N", .N()))
                .("S")
                .(D.())
                .();

        A A = A..(, N + "EA")
                .N("SP-WS-" + N + "-E")
                .(M)
                .(.)
                .O(CO.GREATER_THAN_THRESHOLD)
                .P()
                .MD(TMD.NOT_REACHING)
                .();

        A.AA( SA(T));
    

     WSA WSA() 
         SA;
    

      C() 
         ;
    

      D() 
         ;
    

      M() 
         ;
    

      N() 
         ;
    


/**
 * M L S  SM    
 *
 * T :
 * -  SU (y  )
 * -  SU  ,   y S URI      S:
 *     ://----S/..z
 * -   SM  :GO  :L     (    ARN)
 */
 MLS  S 
      CM RM;
      CEC REC;
      CE RE;
      CM DM;
      CEC DEC;
      CE DE;

    MLS( C ,  S ,  S S,
             Ky Ky,  S SU,  SP ) 
        (, , );

        // D   S URI. I   SU  ,
        //    y       S.
         S MSU;
         (SU !=  && !SU.Ey()) 
            MSU = SU;
          
            // .A()   T  CDK    y .
            MSU = "://---" + .A() + "-" + S + "/..z";
        

        // P    MSU (     )
        S U = ;
         (MSU !=  && MSU.W("://")) 
            S P = MSU.("://".());
             I = P.O('/');
            U = I == - ? P : P.(, I);
        

        //  S ARN    y
        L<S> R =  AyL<>();
        //        ()
        R.(":::::--");
        R.(":::::--/*");
         (U !=  && !U.Ey()) 
            R.(":::::" + U);
            R.(":::::" + U + "/*");
        

        // C IAM   SM   S /   ()
        R R = R..(, "SMR")
                .y( SP(".z."))
                .P(Ay.L(
                        MPy.AMPyN("AzSMA")
                ))
                .P(M.("SMSA", PyD..()
                        .(Ay.L(
                                PyS..()
                                        .(E.ALLOW)
                                        .(Ay.L(":GO", ":L"))
                                        .(R)
                                        .()
                        ))
                        .()))
                .();

        // C      MSU
        .RM = SMM("R", S, R, MSU);
        .REC = EC("R", S, RM);
        .RE = E("R", S, REC);

        .DM = SMM("VD", S, R, MSU);
        .DEC = EC("VD", S, DM);
        .DE = E("VD", S, DEC);

        T.().("", "-");
        T.().("", S);
    

     CM SMM( S Ty,  S S, 
                                           R R,  S SU) 
         CM..(, Ty + "M")
                .N("--" + S + "-" + Ty.LC())
                .RA(R.RA())
                .yC(CM.CDPy.()
                        .("...--.z./y-:..--y")
                        .DU(SU)
                        .(M.(
                                "SAGEMAKER_PROGRAM", ".y",
                                "SAGEMAKER_SUMIT_DIRECTORY", "////"
                        ))
                        .())
                .();
    

     CEC EC( S Ty,  S S,
                                                     CM ) 
        CEC  = CEC..(, Ty + "EC")
                .CN("--" + S + "-"
                                   + Ty.LC() + "-")
                .V(Ay.L(
                        CEC.PVPy.()
                                .N("AT")
                                .N(.MN())
                                .IC()
                                .Ty("..")
                                .VW(.)
                                .()
                ))
                .();
        .Dy();
         ;
    

     CE E( S Ty,  S S,
                                        CEC C) 
        CE  = CE..(, Ty + "E")
                .N("--" + S + "-"
                             + Ty.LC() + "-")
                .CN(C.ECN())
                .();
        .Dy(C);
         ;
    

     CE RE() 
         RE;
    

     CE VDE() 
         DE;
    


/**
 * M TS     
 *
 * TS   SU      MLS.
 */
 TS  S 
      SyS yS;
      NS S;
      DS S;
      CS S;
      SS S;
      CS S;
      RTS TS;
      MLS S;
      S S;

    TS( C ,  S ,  TSP ,  S SU) 
        (, ,  !=  ? .SP() : );

        .S =  !=  ? .ES() : "";
        I I =  !=  ? .MI() : ;
        I I =  !=  ? .MI() : ;
        I RR =  !=  ? .ARR() : ;

        // C y 
        .yS =  SyS(
                ,
                "Sy",
                S,
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("Sy S   : " + S)
                        .());

        // C  
        .S =  NS(
                ,
                "N",
                S,
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("N S   : " + S)
                        .());

        // C     
        DSC C =  DSC(
                S.V(),
                S.RSyG(),
                yS.KKy(),
                RR
        );

        .S =  DS(
                ,
                "D",
                S,
                C,
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("D S   : " + S)
                        .());

        // C  
        .S =  CS(
                ,
                "C",
                S,
                S.V(),
                S.ESyG(),
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("C S   : " + S)
                        .());

        // C  
        .S =  SS(
                ,
                "S",
                S,
                yS.KKy(),
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("S S   : " + S)
                        .());

        // C     
        CSC C =  CSC(
                S.V(),
                S.ASyG(),
                S.ESyG(),
                yS.KKy(),
                I,
                I,
                yS.AT()
        );

        .S =  CS(
                ,
                "C",
                S,
                C,
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("C S   : " + S)
                        .());

        // C - 
        .TS =  RTS(
                ,
                "RT",
                S,
                yS.KKy(),
                yS.AT(),
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("R-T S   : " + S)
                        .());

        // C ML  ( SU)
        .S =  MLS(
                ,
                "ML",
                S,
                yS.KKy(),
                SU,
                SP.()
                        .( !=  && .SP() !=  ? .SP().E() : )
                        .("M L S   : " + S)
                        .());

        // A 
        S.Dy(yS);
        S.Dy(S);
        S.Dy(S);
        // S.Dy(yS);
        S.Dy(S);
        TS.Dy(yS);
        S.Dy(yS);

        // C 
        O();

        // A    
        T.().("", "-");
        T.().("", S);
        T.().("-y", "");
    

      O() 
        CO..(, "ADN")
                .(S.A().LDN())
                .("A L  DNS N")
                .N("SP-AD-" + S)
                .();

        CO..(, "WSAU")
                .(TS.WSA().AE())
                .("WS API URL")
                .N("SP-WSU-" + S)
                .();

        CO..(, "CD")
                .(S.CD().DDN())
                .("C D D")
                .N("SP-CD-" + S)
                .();

        CO..(, "MN")
                .(S.M().N())
                .("S M  N")
                .N("SP-M-" + S)
                .();

        CO..(, "ACE")
                .(S.AC().CE().H())
                .("A C W E")
                .N("SP-AE-" + S)
                .();

        CO..(, "ARE")
                .(S.AC().CRE().H())
                .("A C R E")
                .N("SP-ARE-" + S)
                .();

        CO..(, "UGTN")
                .(S.UGT().TN())
                .("DyD U G T")
                .N("SP-UGT-" + S)
                .();

        CO..(, "PTN")
                .(S.PT().TN())
                .("DyD P T")
                .N("SP-PT-" + S)
                .();

        CO..(, "RE")
                .(S.RC().APyEPA())
                .("EC R C E")
                .N("SP-RE-" + S)
                .();

        CO..(, "RE")
                .(S.RE().EN())
                .("SM  R E")
                .N("SP-RE-" + S)
                .();

        CO..(, "VDE")
                .(S.VDE().EN())
                .("SM V D E")
                .N("SP-VDE-" + S)
                .();
    

     SyS SyS() 
         yS;
    

     NS NS() 
         S;
    

     DS DS() 
         S;
    

     CS CS() 
         S;
    

     SS SS() 
         S;
    

     CS CS() 
         S;
    

     RTS RTS() 
         TS;
    

     MLS MS() 
         S;
    

     S ES() 
         S;
    


/**
 * M y    S P CDK J 
 *
 * U:
 * - Oy  MODEL_S_URI    S URI (:///y). I , MLS   .
 * - I MODEL_S_URI   , MLS    y S URI    
 *    S, .. ://---<>-/..z
 */
   M 

     M() 
        // Uy     
    

       ( S[] ) 
        A  =  A();

        // G     , ,  
        S S = Sy.("ENVIRONMENT_SUIX");
         (S ==  || S.Ey()) 
            S = (S) .N().yGC("S");
        
         (S ==  || S.Ey()) 
            S = "";
        

        // G    
        S IE = Sy.("MIN_INSTANCES");
        I I = (IE !=  && !IE.Ey())
                ? I.I(IE) : ;

        S IE = Sy.("MAX_INSTANCES");
        I I = (IE !=  && !IE.Ey())
                ? I.I(IE) : ;

        S RE = Sy.("AURORA_READ_REPLICAS");
        I RR = (RE !=  && !RE.Ey())
                ? I.I(RE) : ;

        // R   S URI  . I y   , :
        //  MODEL_S_URI="y      . 
        // MODEL_S_URI='://----/..z'"
        S SU = Sy.("MODEL_S_URI");

        // C   S P  ( SU)
         TS(, "TS" + S, TSP.()
                .S(S)
                .I(I)
                .I(I)
                .RR(RR)
                .P(SP.()
                        .(E.()
                                .(Sy.("CDK_DEAULT_ACCOUNT"))
                                .("--")
                                .())
                        .())
                .(), SU);

        .y();
    

```

<!-- /////MT. -->
```
 ;

 ....T;
 ....A;
 ....E;
 ....AA;
  ....A.T;
  ....A.TC;

 ..;
 ..OS;
 ..IOE;
 ...;
 ...P;
 ...P;
 ..C;
 ..M;
 ..z.ZEy;
 ..z.ZOS;

 .z..A;
 .z..E;
 .z..SP;
 .z...T;
 .z...M;
 .z....IV;
 .z....SyG;
 .z....Ky;
 .z....T;

/**
 * C     M CDK .
 * 
 * T  y  , ,     
 *    AWS    .
 * A %    M..
 * 
 * JAR   y     -    !
 */
  MT 

     A ;
       S LAMDA_DIR = "/";

    /**
     * C y L JAR   y  .
     * T       JAR  .
     */
    @A
       LJ()  IOE 
        // C / y
        P P = P.(LAMDA_DIR);
        .D(P);

        // C y JAR  (  JAR = ZIP  )
        DyJ(LAMDA_DIR + "/.");
        DyJ(LAMDA_DIR + "/.");
        DyJ(LAMDA_DIR + "/.");

        Sy..(" C y L JAR   ");
    

    /**
     * C  L JAR     .
     */
    @AA
       LJ()  IOE 
        P P = P.("");
         (.(P)) 
            .(P)
                    .(C.O())
                    .(P::)
                    .E(::);
            Sy..(" C  L JAR ");
        
    

    /**
     * C    JAR  (JAR    ZIP   ).
     */
       DyJ( S P)  IOE 
        y (OS  =  OS(P);
             ZOS z =  ZOS()) 
            
            // A META-IN/MANIEST.M y
            ZEy Ey =  ZEy("META-IN/MANIEST.M");
            z.NEy(Ey);
            z.("M-V: .\".y());
            z.Ey();
        
    

    @E
      U() 
         =  A();
    

    // ==================== TSP T ====================

    /**
     * T TSP    .
     */
    @T
      TSP() 
        SP P = SP.()
                .(E.()
                        .("")
                        .("--")
                        .())
                .();

        TSP  = TSP.()
                .S("")
                .P(P)
                .I()
                .I()
                .RR()
                .();

        T(.ES()).ET("");
        T(.SP()).ET(P);
        T(.MI()).ET();
        T(.MI()).ET();
        T(.ARR()).ET();
    

    /**
     * T TSP   .
     */
    @T
      TSPD() 
        TSP  = TSP.()
                .S("")
                .();

        T(.ES()).ET("");
        T(.SP()).NN();
        T(.MI()).ET();
        T(.MI()).ET();
        T(.ARR()).ET();
    

    /**
     * T TSP    P.
     */
    @T
      TSPNSP() 
        TSP  = TSP.()
                .S("")
                .P()
                .();

        T(.SP()).NN();
    

    // ==================== C O T ====================

    /**
     * T DSC   .
     */
    @T
      DSC() 
        // C  y    
        A A =  A();
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );

        IV  = S.V();
        SyG yG = S.RSyG();
        Ky Ky = S.KKy();

        DSC  =  DSC(, yG, Ky, );

        T(.V()).ET();
        T(.RSyG()).ET(yG);
        T(.KKy()).ET(Ky);
        T(.RR()).ET();
    

    /**
     * T CSC   .
     */
    @T
      CSC() 
        // C  y    
        A A =  A();
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );

        IV  = S.V();
        SyG S = S.ASyG();
        SyG S = S.ESyG();
        Ky Ky = S.KKy();
        T T = S.AT();

        CSC  =  CSC(, S, S, Ky, , , T);

        T(.V()).ET();
        T(.ASyG()).ET(S);
        T(.ESyG()).ET(S);
        T(.KKy()).ET(Ky);
        T(.MI()).ET();
        T(.MI()).ET();
        T(.AT()).ET(T);
    

    // ==================== SyS T ====================

    /**
     * T SyS   .
     */
    @T
      SySC() 
        A A =  A();
        SyS  =  SyS(A, "SyS", "", );
        T  = T.S();

        // Vy KMS Ky
        .CI("AWS::KMS::Ky", );
        .RP("AWS::KMS::Ky", M.(
                "EKyR", 
        ));

        // Vy SNS T
        .CI("AWS::SNS::T", );

        // Vy 
        T(.KKy()).NN();
        T(.AT()).NN();
    

    /**
     * T SyS KMS y .
     */
    @T
      SySKP() 
        A A =  A();
        SyS  =  SyS(A, "SyS", "", );
        T  = T.S();

        .RP("AWS::KMS::Ky", M.(
                "EKyR", ,
                "D", M.LR(".*.*")
        ));
    

    // ==================== NS T ====================

    /**
     * T NS   .
     */
    @T
      NSC() 
        A A =  A();
        NS  =  NS(A, "NS", "", );
        T  = T.S();

        // Vy VPC
        .CI("AWS::EC::VPC", );

        // Vy Sy G (AL, EC, RDS, R = )
        .CI("AWS::EC::SyG", );

        // Vy 
        T(.V()).NN();
        T(.ASyG()).NN();
        T(.ESyG()).NN();
        T(.RSyG()).NN();
        T(.ESyG()).NN();
    

    /**
     * T NS VPC .
     */
    @T
      NSVC() 
        A A =  A();
        NS  =  NS(A, "NS", "", );
        T  = T.S();

        // Vy VPC   CIDR
        .RP("AWS::EC::VPC", M.(
                "EDH", ,
                "EDS", 
        ));
    

    /**
     * T NS y   .
     */
    @T
      NSSyGR() 
        A A =  A();
        NS  =  NS(A, "NS", "", );
        
        T(.ASyG()).NN();
        T(.ESyG()).NN();
        T(.RSyG()).NN();
        T(.ESyG()).NN();
    

    // ==================== DS T ====================

    /**
     * T DS   .
     */
    @T
      DSC() 
        A A =  A();
        
        // C  
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        DSC  =  DSC(
            S.V(),
            S.RSyG(),
            S.KKy(),
            
        );
        
        DS  =  DS(A, "DS", "", , );
        T  = T.S();

        // Vy A C
        .CI("AWS::RDS::DC", );

        // Vy DyD T (: UG  P)
        .CI("AWS::DyD::T", );

        // Vy 
        T(.AC()).NN();
        T(.UGT()).NN();
        T(.PT()).NN();
    

    /**
     * T DS A .
     * : R DP   M. '  .
     */
    @T
      DSAC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        DSC  =  DSC(
            S.V(),
            S.RSyG(),
            S.KKy(),
            
        );
        
        DS  =  DS(A, "DS", "", , );
        T  = T.S();

        // Vy A   ( DP)
        .RP("AWS::RDS::DC", M.(
                "E", "-",
                "SEy", ,
                "RP", 
        ));
    

    /**
     * T DS DyD  .
     */
    @T
      DSDyDC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        DSC  =  DSC(
            S.V(),
            S.RSyG(),
            S.KKy(),
            
        );
        
        DS  =  DS(A, "DS", "", , );
        T  = T.S();

        // Vy     
        .RP("AWS::DyD::T", M.(
                "M", "PAY_PER_REQUEST"
        ));
    

    // ==================== CS T ====================

    /**
     * T CS   .
     */
    @T
      CSC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        CS  =  CS(
            A,
            "CS",
            "",
            S.V(),
            S.ESyG(),
            
        );
        T  = T.S();

        // Vy R R G
        .CI("AWS::EC::RG", );

        // Vy R S G
        .CI("AWS::EC::SG", );

        // Vy 
        T(.RC()).NN();
    

    /**
     * T CS R .
     */
    @T
      CSRC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        CS  =  CS(
            A,
            "CS",
            "",
            S.V(),
            S.ESyG(),
            
        );
        T  = T.S();

        // Vy R 
        .RP("AWS::EC::RG", M.(
                "E", "",
                "CNTy", "..",
                "NCC", ,
                "AE", ,
                "MAZE", ,
                "AREyE", ,
                "TEyE", 
        ));
    

    // ==================== SS T ====================

    /**
     * T SS   .
     * : A  y   y y .
     */
    @T
      SSC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        SS  =  SS(
            A,
            "SS",
            "",
            S.KKy(),
            
        );
        
        // Vy     y
        T(.M()).NN();
        T(.()).NN();
        T(.CD()).NN();
    

    /**
     * T SS S  y.
     * : A  y   y y .
     */
    @T
      SSEy() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        SS  =  SS(
            A,
            "SS",
            "",
            S.KKy(),
            
        );
        
        // Vy     y
        T(.M()).NN();
        T(.()).NN();
    

    /**
     * T SS C  .
     */
    @T
      SSDC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        SS  =  SS(
            A,
            "SS",
            "",
            S.KKy(),
            
        );
        
        T(.CD()).NN();
        T(.CD().DDN()).NN();
    

    // ==================== CS T ====================

    /**
     * T CS   .
     * N: W L    AL , CDK    .
     */
    @T
      CSC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        CSC  =  CSC(
            S.V(),
            S.ASyG(),
            S.ESyG(),
            S.KKy(),
            ,
            ,
            S.AT()
        );
        
        CS  =  CS(A, "CS", "", , );
        T  = T.S();

        // Vy AL
        .CI("AWS::ELV::L", );

        // Vy A S G
        .CI("AWS::AS::ASG", );

        // Vy 
        T(.A()).NN();
        T(.ASG()).NN();
        T(.R()).NN();
    

    /**
     * T CS    .
     */
    @T
      CSCIC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        CSC  =  CSC(
            S.V(),
            S.ASyG(),
            S.ESyG(),
            S.KKy(),
            ,
            ,
            S.AT()
        );
        
        CS  =  CS(A, "CS", "", , );

        T(.ASG()).NN();
    

    /**
     * T CS AL  .
     */
    @T
      CSAL() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        NS S =  NS(A, "NS", "", );
        
        CSC  =  CSC(
            S.V(),
            S.ASyG(),
            S.ESyG(),
            S.KKy(),
            ,
            ,
            S.AT()
        );
        
        CS  =  CS(A, "CS", "", , );
        T  = T.S();

        // Vy 
        .CI("AWS::ELV::L", );
        .RP("AWS::ELV::L", M.(
                "P", ,
                "P", "HTTP"
        ));
    

    // ==================== RTS T ====================

    /**
     * T RTS   .
     * : C     L  ( y   L@E   )
     */
    @T
      RTSC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        RTS  =  RTS(
            A,
            "RTS",
            "",
            S.KKy(),
            S.AT(),
            
        );
        T  = T.S();

        // Vy WS API
        .CI("AWS::AGyV::A", );

        // Vy L  (  : , , , )
        // My     CDK  ,     
        .RP("AWS::L::", M.());

        // Vy WS S
        .CI("AWS::AGyV::S", );

        // Vy WS I
        .CI("AWS::AGyV::I", );

        // Vy WS R
        .CI("AWS::AGyV::R", );

        // Vy CW A  L 
        .CI("AWS::CW::A", );

        // Vy 
        T(.WSA()).NN();
        T(.C()).NN();
        T(.D()).NN();
        T(.M()).NN();
        T(.N()).NN();
    

    /**
     * T RTS WS .
     */
    @T
      RTSWSR() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        RTS  =  RTS(
            A,
            "RTS",
            "",
            S.KKy(),
            S.AT(),
            
        );
        T  = T.S();

        // Vy    , ,  
        .RP("AWS::AGyV::R", M.(
                "RKy", ""
        ));

        .RP("AWS::AGyV::R", M.(
                "RKy", ""
        ));

        .RP("AWS::AGyV::R", M.(
                "RKy", ""
        ));
    

    // ==================== MLS T ====================

    /**
     * T MLS   .
     */
    @T
      MLSC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        MLS  =  MLS(
            A,
            "MLS",
            "",
            S.KKy(),
            , SP.().());
        T  = T.S();

        // Vy SM M ()
        .CI("AWS::SM::M", );

        // Vy SM E C ()
        .CI("AWS::SM::EC", );

        // Vy SM E ()
        .CI("AWS::SM::E", );

        // Vy 
        T(.RE()).NN();
        T(.VDE()).NN();
    

    /**
     * T MLS  .
     * : C        y (  y )
     */
    @T
      MLSEC() 
        A A =  A();
        
        SyS S =  SyS(A, "SS", "", );
        
        MLS  =  MLS(
            A,
            "MLS",
            "",
            S.KKy(),
            , SP.().());
        
        // Vy       ( )
        S RN = .RE().EN();
        S DN = .VDE().EN();
        
        T(RN).IC("");
        T(DN).IC("");
    

    // ==================== TS I T ====================

    /**
     * T TS    .
     */
    @T
      TSC() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .(), );

            T(.SyS()).NN();
            T(.NS()).NN();
            T(.DS()).NN();
            T(.CS()).NN();
            T(.SS()).NN();
            T(.CS()).NN();
            T(.RTS()).NN();
            T(.MS()).NN();
            T(.ES()).ET("");
        ).NTAyE();
    

    /**
     * T TS   .
     */
    @T
      TSCC() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .I()
                    .I()
                    .RR()
                    .(), );

            T(.ES()).ET("");
            T(.CS()).NN();
            T(.DS()).NN();
        ).NTAyE();
    

    /**
     * T TS  .
     */
    @T
      TSO() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .(), );

            // Vy     (  )
            T(.CS()).NN();
            T(.CS().A()).NN();
            T(.RTS()).NN();
            T(.RTS().WSA()).NN();
            T(.SS()).NN();
            T(.SS().CD()).NN();
            T(.SS().M()).NN();
            T(.DS()).NN();
            T(.DS().AC()).NN();
            T(.DS().UGT()).NN();
            T(.DS().PT()).NN();
            T(.CS()).NN();
            T(.CS().RC()).NN();
            T(.MS()).NN();
            T(.MS().RE()).NN();
            T(.MS().VDE()).NN();
        ).NTAyE();
    

    /**
     * T TS  SP  .
     */
    @T
      TSWE() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .P(SP.()
                            .(E.()
                                    .("")
                                    .("--")
                                    .())
                            .())
                    .(), );

            T().NN();
            T(.ES()).ET("");
        ).NTAyE();
    

    /**
     * T TS  .
     */
    @T
      TSRT() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .(), );

            T().NN();
            T(.ES()).ET("");
        ).NTAyE();
    

    /**
     * T TS    .
     */
    @T
      TSMC() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .I()
                    .I()
                    .RR()
                    .(), );

            T(.CS()).NN();
            T(.DS()).NN();
        ).NTAyE();
    

    /**
     * T TS    .
     */
    @T
      TSMC() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .I()
                    .I()
                    .RR()
                    .(), );

            T(.CS()).NN();
            T(.DS()).NN();
        ).NTAyE();
    

    //M C T 

    /**
     * T M    .
     */
    @T
      MCIP()  E 
        ...C<M>  = M..DC();
        T(...M.P(.M())).T();
        
        .A();
        M  = .I();
        T().NN();
    

    /**
     * T M.()    .
     */
    @T
      MMD() 
        S[]  = ;
        T(M.).DM("");
    

    // ==================== I  E C T ====================

    /**
     * T TS    .
     */
    @T
      TSVE() 
        S[]  = "", "", "", "", "";

         (S  : ) 
            TC(() -> 
                A A =  A();
                TS  =  TS(A, "TS" + , TSP.()
                        .S()
                        .(), );

                T(.ES()).ET();
                T(.SyS()).NN();
            ).NTAyE();
        
    

    /**
     * T       y.
     */
    @T
      ISC() 
        A  =  A();
        SyS S =  SyS(, "SS", "", );
        T(S).NN();

        A  =  A();
        NS S =  NS(, "NS", "", );
        T(S).NN();

        A  =  A();
        SyS S =  SyS(, "SS", "", );
        MLS S =  MLS(, "MLS", "", S.KKy(), , SP.().());
        T(S).NN();
    

    /**
     * T TS    .
     */
    @T
      CIS() 
        TC(() -> 
            TS  =  TS(, "CS", TSP.()
                    .S("")
                    .I()
                    .I()
                    .RR()
                    .P(SP.()
                            .("C   ")
                            .())
                    .(), );

            T(.SyS()).NN();
            T(.NS()).NN();
            T(.DS()).NN();
            T(.CS()).NN();
            T(.SS()).NN();
            T(.CS()).NN();
            T(.RTS()).NN();
            T(.MS()).NN();
        ).NTAyE();
    

    /**
     * T TS   SP  TSP.
     */
    @T
      TSWNSPIP() 
        TC(() -> 
            TS  =  TS(, "TS", TSP.()
                    .S("")
                    .P()
                    .(), );

            T().NN();
            T(.ES()).ET("");
        ).NTAyE();
    

    /**
     * T    .
     * : A  y     TS   y y.
     * I, y         y.
     */
    @T
      CRC() 
        TC(() -> 
            // C   A      y 
            A A =  A();
            
            // C TS  y    
            TS  =  TS(A, "TS", TSP.()
                    .S("")
                    .RR()
                    .(), );

            // Vy     (  y)
            T(.SyS()).NN();
            T(.NS()).NN();
            T(.DS()).NN();
            T(.CS()).NN();
            T(.SS()).NN();
            T(.CS()).NN();
            T(.RTS()).NN();
            T(.MS()).NN();

            // Vy      (  y)
            T(.SyS().KKy()).NN();
            T(.SyS().AT()).NN();
            
            T(.NS().V()).NN();
            T(.NS().ASyG()).NN();
            
            T(.DS().AC()).NN();
            T(.DS().UGT()).NN();
            T(.DS().PT()).NN();
            
            T(.CS().RC()).NN();
            
            T(.SS().M()).NN();
            T(.SS().()).NN();
            T(.SS().CD()).NN();
            
            T(.CS().A()).NN();
            T(.CS().ASG()).NN();
            T(.CS().R()).NN();
            
            T(.RTS().WSA()).NN();
            T(.RTS().C()).NN();
            T(.RTS().D()).NN();
            T(.RTS().M()).NN();
            T(.RTS().N()).NN();
            
            T(.MS().RE()).NN();
            T(.MS().VDE()).NN();

            // T     A   y  
            
            // T SyS
            A A =  A();
            SyS S =  SyS(A, "SS", "", );
            T T = T.S(S);
            T.CI("AWS::KMS::Ky", );
            T.CI("AWS::SNS::T", );
            
            // T NS
            A A =  A();
            NS S =  NS(A, "NS", "", );
            T T = T.S(S);
            T.CI("AWS::EC::VPC", );
            T.CI("AWS::EC::SyG", );
            
            // T DS
            A A =  A();
            SyS SS =  SyS(A, "SS", "", );
            NS NS =  NS(A, "NS", "", );
            DSC C =  DSC(
                NS.V(),
                NS.RSyG(),
                SS.KKy(),
                
            );
            DS S =  DS(A, "DS", "", C, );
            T T = T.S(S);
            T.CI("AWS::RDS::DC", );
            T.CI("AWS::DyD::T", );
            
            // T CS
            A A =  A();
            SyS SS =  SyS(A, "SS", "", );
            NS NS =  NS(A, "NS", "", );
            CS S =  CS(
                A,
                "CS",
                "",
                NS.V(),
                NS.ESyG(),
                
            );
            T T = T.S(S);
            T.CI("AWS::EC::RG", );
            
            // T CS (  L   + AL + ASG)
            A A =  A();
            SyS SS =  SyS(A, "SS", "", );
            NS NS =  NS(A, "NS", "", );
            CSC C =  CSC(
                NS.V(),
                NS.ASyG(),
                NS.ESyG(),
                SS.KKy(),
                ,
                ,
                SS.AT()
            );
            CS S =  CS(A, "CS", "", C, );
            T T = T.S(S);
            T.CI("AWS::ELV::L", );
            T.CI("AWS::AS::ASG", );
            T.CI("AWS::L::", );
            
            // T RTS (  WS L )
            A A =  A();
            SyS SS =  SyS(A, "SS", "", );
            RTS S =  RTS(
                A,
                "RTS",
                "",
                SS.KKy(),
                SS.AT(),
                
            );
            T T = T.S(S);
            // RTS   L  (, , , )
            //  CDK  -  ,    y  API 
            T.CI("AWS::AGyV::A", );
            
            // T MLS
            A A =  A();
            SyS SS =  SyS(A, "SS", "", );
            MLS S =  MLS(A, "MLS", "", SS.KKy(), , SP.().());
            T T = T.S(S);
            T.CI("AWS::SM::E", );
            
        ).NTAyE();
    

```

<!-- /////MIT. -->
```
 ;

 ....A;
 ....T;
 ....TI;
  ....A.T;

 .z....AC;
 .z....SCP;
 .z...R;
 .z....CC;
 .z.....DSR;
 .z.....DSR;
 .z.....O;
 .z.....S;
 .z...y.DyDC;
 .z...y..*;
 .z....SC;
 .z.....*;
 .z....ECC;
 .z.....DRGR;
 .z.....DRGR;
 .z....RC;
 .z....SMC;
 .z.....DER;
 .z.....DER;
 .z....ELVC;
 .z.....DLR;
 .z.....DTHR;
 .z....CC;
 .z.....GDR;
 .z...y.Ry;

 ..*;
 ..URI;
 ...HC;
 ...HR;
 ...HR;
 ..D;

/**
 * R --    TS y .
 * 
 * T     AWS   y y.
 * R y    AWS .
 * 
 * N: R/EC      y  VPN    .
 * 
 * E V R:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - ENVIRONMENT_SUIX (: )
 */
@TI(TI.Ly.PER_CLASS)
  MIT 

       R REGION = R.US_WEST_;
     S S;
     S N;
    
    // AWS C
     CC C;
     DyDC yDC;
     SC C;
     ECC CC;
     RC C;
     SMC MC;
     ELVC C;
     CC C;
    
    // S O
     M<S, S> O;
     S DN;
     S SAU;
     S D;
     S N;
     S WE;
     S RE;
     S GTN;
     S TN;
     S E;
     S REN;
     S DEN;
    
    @A
      U() 
        // G  
        S = Sy.().OD("ENVIRONMENT_SUIX", "");
        N = "TS" + S;
        
        // G AWS   
        S AKy = Sy.("AWS_ACCESS_KEY_ID");
        S SKy = Sy.("AWS_SECRET_ACCESS_KEY");
        
        T(AKy).("AWS_ACCESS_KEY_ID   ").NN();
        T(SKy).("AWS_SECRET_ACCESS_KEY   ").NN();
        
        AC  = AC.(AKy, SKy);
        SCP P = SCP.();
        
        // Iz AWS 
        C = CC.()
                .(REGION)
                .P(P)
                .();
                
        yDC = DyDC.()
                .(REGION)
                .P(P)
                .();
                
        C = SC.()
                .(REGION)
                .P(P)
                .();
                
        CC = ECC.()
                .(REGION)
                .P(P)
                .();
                
        C = RC.()
                .(REGION)
                .P(P)
                .();
                
        MC = SMC.()
                .(REGION)
                .P(P)
                .();
                
        C = ELVC.()
                .(REGION)
                .P(P)
                .();
                
        C = CC.()
                .(REGION)
                .P(P)
                .();
        
        // L  
        SO();
    
    
      SO() 
        DSR  = C.S(
            DSR.()
                .N(N)
                .()
        );
        
        S  = .().();
        O =  HM<>();
        
         (O  : .()) 
            O.(.Ky(), .V());
        
        
        // E 
        DN = O.("ADN");
        SAU = O.("WSAU");
        D = O.("CD");
        N = O.("MN");
        WE = O.("ACE");
        RE = O.("ARE");
        GTN = O.("UGTN");
        TN = O.("PTN");
        E = O.("RE");
        REN = O.("RE");
        DEN = O.("VDE");
        
        Sy..("L   : " + N);
    

    // ==================== DyD I T ====================
    
    @T
      DyDUGTE() 
        DTR  = yDC.T(
            DTR.()
                .N(GTN)
                .()
        );
        
        T(.().N()).ET(GTN);
        T(.().S()).ET(TS.ACTIVE);
    
    
    @T
      DyDPTE() 
        DTR  = yDC.T(
            DTR.()
                .N(TN)
                .()
        );
        
        T(.().N()).ET(TN);
        T(.().S()).ET(TS.ACTIVE);
    
    
    @T
      PUGC() 
        S UI = "--" + Sy.TM();
        S I = "-" + Sy.TM();
        
        M<S, AV>  =  HM<>();
        .("I", AV.().(UI).());
        .("I", AV.().(I).());
        .("Ty", AV.().("").());
        .("", AV.().(S.O(Sy.TM())).());
        
        PIR  = yDC.I(
            PIR.()
                .N(GTN)
                .()
                .()
        );
        
        T(.HR().S()).T();
    
    
    @T
      PPI() 
        S I = "-" + Sy.TM();
          = Sy.TM();
        
        M<S, AV>  =  HM<>();
        .("I", AV.().(I).());
        .("", AV.().(S.O()).());
        .("I", AV.().("-").());
        .("", AV.().("T    ").());
        .("", AV.().("").());
        
        PIR  = yDC.I(
            PIR.()
                .N(TN)
                .()
                .()
        );
        
        T(.HR().S()).T();
    
    
    @T
      QyPyT() 
        // P   
        S I = "-y-";
         (  = ;  < ; ++) 
            M<S, AV>  =  HM<>();
            .("I", AV.().("-" + ).());
            .("", AV.().(S.O(Sy.TM() + )).());
            .("I", AV.().(I).());
            
            yDC.I(
                PIR.()
                    .N(TN)
                    .()
                    .()
            );
        
        
        // Qy  GSI
        QyR  = yDC.y(
            QyR.()
                .N(TN)
                .N("UPI")
                .yCE("I = :I")
                .AV(M.(
                    ":I", AV.().(I).()
                ))
                .()
        );
        
        T(.()).GTOET();
    
    
    @T
      WTUG() 
        L<WR> R =  AyL<>();
        
         (  = ;  < ; ++) 
            M<S, AV>  =  HM<>();
            .("I", AV.().("--" + ).());
            .("I", AV.().("-" + ).());
            
            R.(WR.()
                .R(PR.().().())
                .());
        
        
        WIR  = yDC.WI(
            WIR.()
                .I(M.(GTN, R))
                .()
        );
        
        T(.HR().S()).T();
    
    
    @T
      SUGT() 
        SR  = yDC.(
            SR.()
                .N(GTN)
                .()
                .()
        );
        
        T(.HR().S()).T();
        T(.()).NN();
    

    // ==================== S I T ====================
    
    @T
      SME() 
        HR  = C.(
            HR.()
                .(N)
                .()
        );
        
        T(.HR().S()).T();
    
    
    @T
      UITS() 
        S y = "-/-" + Sy.TM() + ".";
        S  = "  ";
        
        POR  = C.O(
            POR.()
                .(N)
                .y(y)
                .Ty("/")
                .(),
            Ry.S()
        );
        
        T(.HR().S()).T();
        T(.T()).NN();
    
    
    @T
      UVTS() 
        S y = "-/-" + Sy.TM() + ".";
        y[] D =  y[]; //   
        
        POR  = C.O(
            POR.()
                .(N)
                .y(y)
                .Ty("/")
                .(),
            Ry.y(D)
        );
        
        T(.HR().S()).T();
    
    
    @T
      GOS()  E 
        //  
        S y = "-/-" + Sy.TM() + ".";
        S  = "   ";
        
        C.O(
            POR.()
                .(N)
                .y(y)
                .(),
            Ry.S()
        );
        
        // N  
        GOR  = C.O(
            GOR.()
                .(N)
                .y(y)
                .()
        ).();
        
        T(.HR().S()).T();
        T(.L()).GT(L);
    
    
    @T
      LOIS() 
        LOVR  = C.OV(
            LOVR.()
                .(N)
                .Ky()
                .()
        );
        
        T(.HR().S()).T();
        T(.()).NN();
    
    
    @T
      DOS() 
        //  
        S y = "-/-" + Sy.TM() + ".";
        
        C.O(
            POR.()
                .(N)
                .y(y)
                .(),
            Ry.S("  ")
        );
        
        // N 
        DOR  = C.O(
            DOR.()
                .(N)
                .y(y)
                .()
        );
        
        T(.HR().S()).T();
    
    
    @T
      SV() 
        GVR  = C.V(
            GVR.()
                .(N)
                .()
        );
        
        T(.()).ET(VS.ENALED);
    
    
    @T
      SEy() 
        GEyR  = C.Ey(
            GEyR.()
                .(N)
                .()
        );
        
        T(.SEyC()).NN();
    

    //  L  I T
    
    @T
      ALE() 
          = C.L(
            DLR.().()
        );
        
          = .().()
            .yM( -> .N().(S));
        
        T().T();
    

    //  C I T 
    @T
      CDE() 
        T(D).NN();
        T(D).(".");
    
    
    @T
      CDS()  E 
        HC  = HC.()
            .T(D.S())
            .();
            
        HR  = HR.()
            .(URI.("://" + D))
            .(D.S())
            .GET()
            .();
        
        HR<S>  = .(, HR.yH.S());
        
        // C   
        T(.C()).I(, , ); //     
    

    // ==================== SM I T ====================
    
    @T
      REE() 
        DER  = MC.E(
            DER.()
                .N(REN)
                .()
        );
        
        T(.N()).ET(REN);
        T(.S().S()).I("IS", "C", "U");
    
    
    @T
      VDEE() 
        DER  = MC.E(
            DER.()
                .N(DEN)
                .()
        );
        
        T(.N()).ET(DEN);
        T(.S().S()).I("IS", "C", "U");
    

    // ==================== WS API I T ====================
    
    @T
      WSAEE() 
        T(SAU).NN();
        T(SAU).("z.");
    

    //  C-S I T 
    
    @T
      SGT() 
        S I = "--" + Sy.TM();
        
        // C   
         (  = ;  < ; ++) 
            M<S, AV>  =  HM<>();
            .("I", AV.().(I).());
            .("I", AV.().("-" + ).());
            .("Ty", AV.().("").());
            
            yDC.I(
                PIR.()
                    .N(GTN)
                    .()
                    .()
            );
        
        
        // Qy  
        M<S, AV> y =  HM<>();
        y.("I", AV.().(I).());
        
        QyR  = yDC.y(
            QyR.()
                .N(GTN)
                .yCE("I = :I")
                .AV(M.(
                    ":I", AV.().(I).()
                ))
                .()
        );
        
        T(.()).ET();
    
    
    @T
      MPP() 
        S Ky = "/" + Sy.TM() + ".";
        S Ky = "/" + Sy.TM() + ".";
        
        // . U 
        C.O(
            POR.()
                .(N)
                .y(Ky)
                .(),
            Ry.S(" ")
        );
        
        // . S  (  y, L   )
        // . U  
        C.O(
            POR.()
                .(N)
                .y(Ky)
                .(),
            Ry.S(" ")
        );
        
        // . Vy  
        HOR  = C.O(
            HOR.()
                .(N)
                .y(Ky)
                .()
        );
        
        HOR  = C.O(
            HOR.()
                .(N)
                .y(Ky)
                .()
        );
        
        T(.HR().S()).T();
        T(.HR().S()).T();
    
    
    @T
      HVPI() 
        S I = "--" + Sy.TM();
         C = ;
        
        // S    
         (  = ;  < C; ++) 
            M<S, AV>  =  HM<>();
            .("I", AV.().("--" + ).());
            .("", AV.().(S.O(Sy.TM() + )).());
            .("I", AV.().(I).());
            .("", AV.().("  " + ).());
            
            yDC.I(
                PIR.()
                    .N(TN)
                    .()
                    .()
            );
        
        
        // Vy   
        QyR  = yDC.y(
            QyR.()
                .N(TN)
                .N("UPI")
                .yCE("I = :I")
                .AV(M.(
                    ":I", AV.().(I).()
                ))
                .()
        );
        
        T(.()).GTOET(C);
    
    
    @T
      SOC() 
        T(O).NEy();
        T(DN).NN();
        T(SAU).NN();
        T(D).NN();
        T(N).NN();
        T(WE).NN();
        T(RE).NN();
        T(GTN).NN();
        T(TN).NN();
        T(E).NN();
        T(REN).NN();
        T(DEN).NN();
    

```
