import Mailgen from "mailgen";
import nodemailer from "nodemailer";

// methods for sending the email
const sendEmail = async (options) => {
  // default branding
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanager.com",
    },
  });

  const eamilTextual = mailGenerator.generatePlaintext(options.mailgenContent); // plain text
  const emailHtml = mailGenerator.generate(options.mailgenContent); // html text

  // now sending the email
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: eamilTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error(
      "Email Service failed silenlty. Make sure that you have provided your mailtrap credentials in the env file",
    );
    console.error("Error:", error);
  }
};

// now we learn how can we gen the email not sending the email
const emailVerificationMailGenContent = (username, verificationURL) => {
  return {
    //Returns a JavaScript object
    body: {
      name: username,
      intro: "Welcome to our app we are excited to have u on board!!",
      action: {
        instructions:
          "To verify your email please click on this following button",
        button: {
          color: "#1aae5aff",
          text: "Verify your email",
          link: verificationURL,
        },
      },
      outro:
        "Need help, or have question? just reply to this mail, we'd love to help.",
    },
  };
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset the password of your account",
      action: {
        instructions:
          "To reset the password click on this following button or link",
        button: {
          color: "#22bc66",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have question? just reply to this mail, we'd love to help.",
    },
  };
};

export {
  forgotPasswordMailGenContent,
  emailVerificationMailGenContent,
  sendEmail,
};
