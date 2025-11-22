const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const User = require("../models/user-model");
const UserSalaries = require("../models/user-salary");
const Attendance = require("../models/attendance-model");
const Expense = require("../models/expense-model");

exports.sendPayslipEmail = async (req, res) => {
  try {
    const { employeeID, month, year } = req.body;

    const employee = await User.findById(employeeID);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const salary = await UserSalaries.findOne({ employeeID });
    if (!salary) return res.status(404).json({ message: "Salary not assigned" });

    const attendance = await Attendance.find({ employeeID, month, year });
    let presentDays = 0;
    let tillDateSalary = 0;
    const perDaySalary = salary.netPay / 26;
    attendance.forEach(a => {
      if (a.present) {
        presentDays++;
        tillDateSalary += perDaySalary;
      }
    });

    const expenses = await Expense.find({ employeeID, adminResponse: "Approved", month, year });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPay = tillDateSalary + totalExpenses;

    // ✅ Generate PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(buffers);

      // ✅ Send email with PDF attachment
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: employee.email,
        subject: `Payslip - ${month}/${year}`,
        text: "Please find your payslip attached.",
        attachments: [
          { filename: `Payslip-${month}-${year}.pdf`, content: pdfData }
        ]
      });

      res.json({ success: true, message: "Payslip PDF sent to employee email!" });
    });

    // PDF Content
    doc.fontSize(18).text("Payslip", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Employee: ${employee.name}`);
    doc.text(`Email: ${employee.email}`);
    doc.text(`Month/Year: ${month}/${year}`);
    doc.moveDown();

    doc.text(`Gross Salary: ₹${salary.earnings.gross}`);
    doc.text(`Per Day Salary: ₹${perDaySalary.toFixed(2)}`);
    doc.text(`Present Days: ${presentDays}`);
    doc.text(`Till Date Salary: ₹${tillDateSalary.toFixed(2)}`);
    doc.text(`Approved Expenses: ₹${totalExpenses}`);
    doc.moveDown();
    doc.fontSize(14).text(`Net Pay: ₹${totalPay.toFixed(2)}`, { align: "right" });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
