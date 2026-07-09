import nodemailer from "nodemailer";

export const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
}) => {

  console.log("EMAIL:", process.env.EMAIL);
  console.log("PASSWORD:", process.env.PASSWORD);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Event Management System" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  });

  return info;
};