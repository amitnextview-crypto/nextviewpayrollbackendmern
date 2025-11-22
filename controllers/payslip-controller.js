const nodemailer = require("nodemailer");
const User = require("../models/user-model");
const UserSalaries = require("../models/UserSalaries");
const Attendance = require("../models/Attendance");
const Expense = require("../models/Expense");

exports.sendPayslipEmail = async (req, res) => {
  try {
    const { employeeID, month, year } = req.body;

    // 1️⃣ Employee find
    const employee = await User.findById(employeeID);
    if (!employee)
      return res.status(404).json({ success: false, message: "Employee not found" });

    // 2️⃣ Salary
    const salary = await UserSalaries.findOne({ employeeID });
    if (!salary)
      return res.status(404).json({ message: "Salary not assigned" });

    // 3️⃣ Attendance
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

    // 4️⃣ Approved expenses
    const expenses = await Expense.find({
      employeeID,
      adminResponse: "Approved",
      month,
      year,
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPay = tillDateSalary + totalExpenses;

    // 5️⃣ Email HTML Body
    const html = `
      <h2>Payslip for ${month}/${year}</h2>
      <p><strong>Name:</strong> ${employee.name}</p>
      <p><strong>Email:</strong> ${employee.email}</p>
      <hr />
      <p><strong>Gross Salary:</strong> ₹${salary.earnings.gross}</p>
      <p><strong>Present Days:</strong> ${presentDays}</p>
      <p><strong>Per Day:</strong> ₹${perDaySalary.toFixed(2)}</p>
      <p><strong>Till Date Salary:</strong> ₹${tillDateSalary.toFixed(2)}</p>
      <p><strong>Approved Expenses:</strong> ₹${totalExpenses}</p>
      <h3>Total Pay (Net): ₹${totalPay.toFixed(2)}</h3>
      <br />
      <p>This is an auto-generated payslip email.</p>
    `;

    // 6️⃣ Email Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,   // your email
        pass: process.env.EMAIL_PASS,   // app password
      },
    });

    // 7️⃣ Send Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: employee.email,
      subject: `Payslip - ${month}/${year}`,
      html,
    });

    res.json({ success: true, message: "Payslip sent to employee email!" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
