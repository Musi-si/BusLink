// import { Router } from 'express';
// import { UserController } from './controller';
// import { authenticateToken, authorize } from '../../middleware/auth';
// import { validate } from '../../middleware/validate';
// import { inviteUserSchema } from './validation';
// import upload from '@/middleware/upload'; 

// const router = Router();
// const userController = new UserController();

// /**
//  * @openapi
//  * tags:
//  *   name: Users
//  *   description: Administrative operations for managing users and staff invitations.
//  */

// router.use(authenticateToken);

// /**
//  * @openapi
//  * /users/invite-hospital-admin:
//  *   post:
//  *     summary: Invite a new Hospital Admin
//  *     tags: [Users]
//  *     security: [{ bearerAuth: [] }]
//  *     description: Allows a System Admin to invite a new user who will be granted the Hospital Admin role.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [email, fullName, phone]
//  *             properties:
//  *               email: { type: string, format: email, example: "new.hadmin@hospital.rw" }
//  *               fullName: { type: string, example: "John Smith" }
//  *               phone: { type: string, example: "0789999999" }
//  *     responses:
//  *       200: { description: "Invitation sent successfully." }
//  *       403: { description: "Forbidden. User is not a System Admin." }
//  *       409: { description: "A user with this email already exists." }
//  */
// router.post('/invite-hospital-admin', authorize(['ADMIN']), validate(inviteUserSchema), userController.inviteHospitalAdmin);

// /**
//  * @openapi
//  * /users/invite-staff:
//  *   post:
//  *     summary: Invite a staff member (Doctor or Receptionist)
//  *     tags: [Users]
//  *     security: [{ bearerAuth: [] }]
//  *     description: Allows a Hospital Admin to invite a new Doctor or Receptionist to their hospital.
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [email, fullName, phone, role]
//  *             properties:
//  *               email: { type: string, format: email }
//  *               fullName: { type: string }
//  *               phone: { type: string }
//  *               role: { type: string, enum: [DOCTOR, RECEPTIONIST] }
//  *     responses:
//  *       200: { description: "Invitation sent successfully." }
//  *       400: { description: "Invalid role specified." }
//  *       403: { description: "User is not a Hospital Admin." }
//  */
// router.post('/invite-staff', authorize(['HOSPITAL_ADMIN']), userController.inviteStaff);

// /**
//  * @openapi
//  * /users/{id}/avatar:
//  *   post:
//  *     summary: Upload a user's avatar
//  *     tags: [Users]
//  *     security: [{ bearerAuth: [] }]
//  *     consumes:
//  *       - multipart/form-data
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema: { type: string, format: uuid }
//  *     requestBody:
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               avatar:
//  *                 type: string
//  *                 format: binary
//  *     responses:
//  *       '200': { description: "Avatar uploaded successfully." }
//  *       '403': { description: "Forbidden." }
//  */
// router.post('/:id/avatar', upload.single('avatar'), userController.uploadAvatar);

// /**
//  * @openapi
//  * /users/resend-invite:
//  *   post:
//  *     summary: Resend an invitation email
//  *     tags: [Users]
//  *     security: [{ bearerAuth: [] }]
//  *     requestBody:
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email: { type: string, format: email }
//  *     responses:
//  *       '200': { description: "Invitation resent successfully." }
//  *       '400': { description: "User is already verified." }
//  */
// router.post('/resend-invite', authorize(['ADMIN', 'HOSPITAL_ADMIN']), userController.resendInvite);

// export default router;