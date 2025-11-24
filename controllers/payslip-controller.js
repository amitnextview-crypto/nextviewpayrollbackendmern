const chromium = require("chrome-aws-lambda");
const nodemailer = require("nodemailer");
const User = require("../models/user-model");

exports.sendPayslipEmail = async (req, res) => {
  try {
    const { employeeID, month, year, html } = req.body;

    const employee = await User.findById(employeeID);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Launch Chromium
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: employee.email,
      subject: `Payslip - ${month}/${year}`,
      text: "Attached is your payslip.",
      attachments: [
        { filename: `Payslip_${month}_${year}.pdf`, content: pdfBuffer }
      ]
    });

    res.json({ message: "Payslip email sent!" });

  } catch (err) {
    console.log("Puppeteer Error:", err);
    res.status(500).json({ message: err.message });
  }
};
