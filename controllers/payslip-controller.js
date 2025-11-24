import nodemailer from "nodemailer";

export const sendPayslipEmail = async (req, res) => {
  try {
    const { email, subject, html } = req.body;

    if (!email || !html) {
      return res.status(400).json({ message: "Email or HTML missing" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"NextView Payroll" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject || "Employee Payslip",
      html,
    });

    return res.json({ message: "Payslip email sent successfully!" });
  } catch (error) {
    console.log("Email error:", error);
    return res.status(500).json({ message: "Server error sending email" });
  }
};
