const nodemailer = require("nodemailer");
const { SmtpModel } = require("../models/smtp/smpt-modal");


const SendMail = async ({ template, subject, emailTo, mysmtp, attachments=[] }) => {
    return new Promise(async (resolve, reject) => {
        try {
            var smtp;
            smtp = await SmtpModel.findOne({$and: [{ userId: mysmtp }, { isVerify: true }, { isUsing: true }] });

            if (!smtp) {
                smtp = await SmtpModel.findOne({ smtpname: "testing" }); // testing
            }

            // console.log(smtp, "smtp");

            // const smtp = await Smtp.findOne({ for: 'Human Resourses' });
            const smtpConfig = {
                host: smtp.host,
                port: smtp.port,
                secure: false,
                auth: {
                    user: smtp.username,
                    pass: smtp.password,
                },
            };

            // console.log("SMTP Config:", smtpConfig);

            const transporter = nodemailer.createTransport(smtpConfig);

            const mailOptions = {
                from: smtp.address,
                to: emailTo || "",
                subject: subject,
                html: template,
                attachments,
            };


            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("error", error);
                reject({ message: error.message, status: false });
            } else {
                console.log("success");
                resolve({ message: "mail sent.", data: info.response, status: true });
            }
            });
        } catch (error) {
            reject({ message: error.message, status: false });
        }
    });
};

module.exports = { SendMail };