import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
}) => {
  const info = await transporter.sendMail({
    from: `"Event Management System" <${process.env.EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  });

  return info;
};