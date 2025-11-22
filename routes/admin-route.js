const router = require('express').Router();
const userController = require('../controllers/user-controller');
const teamController = require('../controllers/team-controller');
const upload = require('../services/file-upload-service');
const asyncMiddleware = require('../middlewares/async-middleware');
const expenseController = require('../controllers/expenseController');
const payslipController = require("../controllers/payslip-controller");

router.post("/payslip/send-email", asyncMiddleware(payslipController.sendPayslipEmail));



// existing imports at top
router.post('/view-employee-attendance',asyncMiddleware(userController.viewEmployeeAttendance));
router.post('/view-leave-applications',asyncMiddleware(userController.viewLeaveApplications));
router.post('/update-leave/:id', asyncMiddleware(userController.updateLeaveApplication)); // <-- ADD THIS
router.post('/assign-employee-salary',asyncMiddleware(userController.assignEmployeeSalary));
router.post('/user',upload.single('profile'),asyncMiddleware(userController.createUser));           // Create User
router.patch('/user/:id', upload.single('profile'), asyncMiddleware(userController.updateUser));   // Update User
router.get('/employees',asyncMiddleware(userController.getUsers));                                  // Employees
router.get('/employees/free',asyncMiddleware(userController.getFreeEmployees));                     // Free Employees
router.get('/employee/:id',asyncMiddleware(userController.getUser));                                // Employee
router.get('/user/:id',asyncMiddleware(userController.getUserNoFilter));                            // User - No Filter (Admin,Leader,Employee)
router.get('/admins',asyncMiddleware(userController.getUsers));                                     // Admins
router.get('/admin/:id',asyncMiddleware(userController.getUser));                                   // Admin
router.get('/leaders/free',asyncMiddleware(userController.getFreeLeaders));                         // Free Leaders
router.get('/leaders',asyncMiddleware(userController.getLeaders));                                  // Leaders
router.get('/leader/:id',asyncMiddleware(userController.getUser));                                  // Leader
router.post('/team',upload.single('profile'),asyncMiddleware(teamController.createTeam));             // Create Team
router.patch('/team/:id',upload.single('profile'),asyncMiddleware(teamController.updateTeam));        // Update Team
router.get('/teams',asyncMiddleware(teamController.getTeams));                                      // Teams
router.get('/team/:id',asyncMiddleware(teamController.getTeam));                                    // Team
router.get('/team/:id/members',asyncMiddleware(teamController.getTeamMembers));                     // Team Members
router.patch('/team/member/add',asyncMiddleware(teamController.addMember));                         // Add Team Member
router.patch('/team/member/remove',asyncMiddleware(teamController.removeMember));                   // Remove Team Member
router.patch('/team/leader/add',asyncMiddleware(teamController.addRemoveLeader));                   // Add Team Leader
router.patch('/team/leader/remove',asyncMiddleware(teamController.addRemoveLeader));                // Remove Team Leader
router.get('/counts',asyncMiddleware(teamController.getCounts));  
router.get('/all-users',asyncMiddleware(userController.getAllUsers));
router.post('/update-employee-salary/',asyncMiddleware(userController.updateEmployeeSalary));
router.post('/view-all-salary',asyncMiddleware(userController.viewSalary));
router.post('/generate-monthly-salaries',asyncMiddleware(userController.generateMonthlySalaries));
router.get('/user-salaries', asyncMiddleware(userController.viewUserSalaries));
router.delete('/user/:id', asyncMiddleware(userController.deleteUser)); // ✅ keep after other user routes
router.delete('/team/:id', asyncMiddleware(teamController.deleteTeam)); // ✅ keep after other team routes
router.patch('/update-team/:id', asyncMiddleware(teamController.updateTeamData)); // <-- ADD THIS
router.patch('/update-salary/:id', asyncMiddleware(userController.updateEmployeeSalary));
router.post('/update-employee-attendance', asyncMiddleware(userController.updateEmployeeAttendance));
router.patch('/update-leave/:id', asyncMiddleware(userController.updateLeaveApplication)); // <-- ADD THIS
// 💰 Employee Expense APIs
router.get("/expenses", asyncMiddleware(expenseController.getExpenses));
router.get("/expenses/:id", asyncMiddleware(expenseController.getExpenseById));
router.patch("/expenses/:id", asyncMiddleware(expenseController.updateExpense));
router.get("/calculate-current-month-salaries", asyncMiddleware(userController.calculateCurrentMonthSalaries));



module.exports = router;
