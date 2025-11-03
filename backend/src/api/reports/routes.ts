import { Router } from 'express';
import { ReportController } from './controller';
import { authenticateToken, authorize } from '../../middleware/auth';

const router = Router();
const reportController = new ReportController();

/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: Endpoints for generating analytics and summary reports.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /reports/hospital/{id}:
 *   get:
 *     summary: Get a report for a specific hospital
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves key performance indicators for a single hospital, such as total appointments and earnings. Accessible by System Admins and the hospital's own Admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the hospital.
 *     responses:
 *       '200': { description: "Hospital performance report." }
 *       '403': { description: "Forbidden." }
 *       '404': { description: "Hospital not found." }
 */
router.get('/hospital/:id', authorize(['ADMIN', 'HOSPITAL_ADMIN']), reportController.getHospitalReport);

/**
 * @openapi
 * /reports/system:
 *   get:
 *     summary: Get a system-wide report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves platform-wide analytics. Accessible by System Admins only.
 *     responses:
 *       '200': { description: "System-wide analytics report." }
 *       '403': { description: "Forbidden." }
 */
router.get('/system', authorize(['ADMIN']), reportController.getSystemReport);

/**
 * @openapi
 * /reports/patient/me:
 *   get:
 *     summary: Get current patient's personalized report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves a high-level summary of a patient's activities, including appointment counts and total payments.
 *     responses:
 *       '200': { description: "Patient's personalized report." }
 *       '403': { description: "Forbidden." }
 *       '404': { description: "Patient profile not found." }
 */
router.get('/patient/me', authorize(['PATIENT']), reportController.getPatientReport);

/**
 * @openapi
 * /reports/doctor/me:
 *   get:
 *     summary: Get current doctor's personalized report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves a high-level summary of a doctor's activities, including appointment counts and total earnings.
 *     responses:
 *       '200': { description: "Doctor's personalized report." }
 *       '403': { description: "Forbidden." }
 *       '404': { description: "Doctor profile not found." }
 */
router.get('/doctor/me', authorize(['DOCTOR']), reportController.getDoctorReport);

export default router;