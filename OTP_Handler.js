const sendOTPVerification = async({_id, email}, res) =>{
    try{
        // OTP Generation
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log(otp);

        // mail options
        const mailOption = {
            from: ProcessingInstruction.env.AUTH_EMAIL,
            to: email,
            subject: "Verify your Account",
            html: `<p> Enter <b>${otp}</b> and verify your account</p>
                    <p>This code <b>expires in 5 mins</b></p>`
        };

        // Storing in database
        const newOTPVerification = await new UserOTPVerification({
            userId: _id,
            otp: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 300000,
        })
        // Saving OTP Reacord 
        await newOTPVerification.save();
        await transporter.sendMail(mailOption);
        res.json({
            message : "successfull"
        });
    }
    catch(error){
        console.log(error);
    }
};

const verifyOTP = async(req,res) =>{
    try{
        let{userId, otp} = req.body;
        if(!userId || !otp){
            throw new Error("Empty details");
        } else {
            const UserOTPVerificationRecords = UserOTPVerification.find({
                userId
            })
            if(UserOTPVerificationRecors.length <= 0){
                throw new Error("Account doesn't exist or has been verified already");
            } else {
                const { expiresAt } = UserOTPVerificationRecords[0];
                const OTP = UserOTPVerificationRecords[0].otp;

                // check expired otp record
                if(expiresAt < Date.now()){
                    await UserOTPVerification.daleteMany({userId});
                    throw new Error("Code is expired");
                }
                else{
                    const validateOTP = (OTP == otp);
                    
                    if(!validateOTP){
                        throw new Error("Invalid code");
                    }
                    else{
                        await UserOTPVerificationRecords.updateOne({_id: userId},{verified: true});
                        await UserOTPVerification.daleteMany({userId});
                        res.json({
                            status: "Verified",
                        });
                    }
                }
            }
        }
    }
    catch(error){
        console.log(error);
    }
}

const resendOTP = async(req,res) =>{
    try{
        let{userId, otp} = req.body;
        if(!userId || !otp){
            throw new Error("Empty details");
        }
        else{
            await UserOTPVerification.daleteMany({userId});
            sendOTPVerification({_id: userId, email}, res);
        } 
    }
    catch(error){
        console.log(error);
    }
}