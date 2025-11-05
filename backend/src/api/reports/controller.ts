import { Response, NextFunction } from 'express'
import prisma from '@/config/prisma'
import AppError from '@/utils/AppError'
import { AuthRequest } from '@/types'
import { AppointmentStatus, PaymentStatus } from '@prisma/client' // Import enums

export class ReportController {
  // Generate a high-level summary report for a specific hospital (Hospital Admin/System Admin)
  async getHospitalReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params // hospitalId
      const user = req.user!

      // Basic Authorization: Only ADMIN or the specific HOSPITAL_ADMIN can view
      if (user.role === 'HOSPITAL_ADMIN' && user.id !== (await prisma.hospital.findUnique({ where: { id } }))?.adminId) {
        return next(new AppError('You are not authorized to view this hospital report.', 403))
      } else if (user.role !== 'ADMIN' && user.role !== 'HOSPITAL_ADMIN') {
        return next(new AppError('Forbidden.', 403))
      }

      // Aggregate counts and sums
      const totalAppointments = await prisma.appointment.count({ where: { hospitalId: id } })
      const completedAppointments = await prisma.appointment.count({ where: { hospitalId: id, status: AppointmentStatus.COMPLETED } })
      const pendingAppointments = await prisma.appointment.count({ where: { hospitalId: id, status: AppointmentStatus.PENDING } })
      const cancelledAppointments = await prisma.appointment.count({ where: { hospitalId: id, status: AppointmentStatus.CANCELLED } })

      const totalDoctors = await prisma.doctor.count({ where: { hospitalId: id } })
      const totalPatients = await prisma.patient.count({ where: { hospitalId: id } })
      const totalReceptionists = await prisma.receptionist.count({ where: { hospitalId: id } })

      const earnings = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { appointment: { hospitalId: id }, status: PaymentStatus.PAID }
      })
      
      res.status(200).json({ status: 'success', data: {
          hospitalId: id,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          cancelledAppointments,
          totalDoctors,
          totalPatients,
          totalReceptionists,
          totalEarnings: earnings._sum.amount ? parseFloat(earnings._sum.amount.toString()) : 0, // Convert Decimal to number
      }})
    } catch (error) {
      next(error)
    }
  }

  // Generate a system-wide summary report (System Admin only)
  async getSystemReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Authorization is handled by router.authorize(['ADMIN'])

      const totalUsers = await prisma.user.count()
      const totalHospitals = await prisma.hospital.count()
      const totalDoctors = await prisma.doctor.count()
      const totalPatients = await prisma.patient.count()
      const totalReceptionists = await prisma.receptionist.count()
      const totalAppointments = await prisma.appointment.count()
      const completedAppointments = await prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } })
      const pendingAppointments = await prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } })
      const cancelledAppointments = await prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } })

      const totalEarnings = await prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: PaymentStatus.PAID }
      })

      res.status(200).json({ status: 'success', data: {
          totalUsers,
          totalHospitals,
          totalDoctors,
          totalPatients,
          totalReceptionists,
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          cancelledAppointments,
          totalEarnings: totalEarnings._sum.amount ? parseFloat(totalEarnings._sum.amount.toString()) : 0,
      }})
    } catch (error) {
      next(error)
    }
  }

  // NEW: Generate a personalized report for the authenticated Patient
  async getPatientReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const patientProfile = await prisma.patient.findUnique({ where: { userId } })

      if (!patientProfile) {
        return next(new AppError('Patient profile not found.', 404))
      }

      const totalAppointments = await prisma.appointment.count({ where: { patientId: patientProfile.id } })
      const completedAppointments = await prisma.appointment.count({ where: { patientId: patientProfile.id, status: AppointmentStatus.COMPLETED } })
      const upcomingAppointments = await prisma.appointment.count({ where: { patientId: patientProfile.id, status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] } } })
      const totalConsultations = await prisma.consultation.count({ where: { appointment: { patientId: patientProfile.id } } })
      const totalPayments = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { patientId: patientProfile.id, status: PaymentStatus.PAID }
      })

      res.status(200).json({ status: 'success', data: {
        patientId: patientProfile.id,
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        totalConsultations,
        totalPayments: totalPayments._sum.amount ? parseFloat(totalPayments._sum.amount.toString()) : 0,
      }})
    } catch (error) {
      next(error)
    }
  }

  // NEW: Generate a personalized report for the authenticated Doctor
  async getDoctorReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id
      const doctorProfile = await prisma.doctor.findUnique({ where: { userId } })

      if (!doctorProfile) {
        return next(new AppError('Doctor profile not found.', 404))
      }

      const totalAppointments = await prisma.appointment.count({ where: { doctorId: doctorProfile.id } })
      const completedAppointments = await prisma.appointment.count({ where: { doctorId: doctorProfile.id, status: AppointmentStatus.COMPLETED } })
      const upcomingAppointments = await prisma.appointment.count({ where: { doctorId: doctorProfile.id, status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] } } })
      const totalConsultations = await prisma.consultation.count({ where: { appointment: { doctorId: doctorProfile.id } } })
      const totalEarnings = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { appointment: { doctorId: doctorProfile.id }, status: PaymentStatus.PAID }
      })

      res.status(200).json({ status: 'success', data: {
        doctorId: doctorProfile.id,
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        totalConsultations,
        totalEarnings: totalEarnings._sum.amount ? parseFloat(totalEarnings._sum.amount.toString()) : 0,
      }})
    } catch (error) {
      next(error)
    }
  }
}