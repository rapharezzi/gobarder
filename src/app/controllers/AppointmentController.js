import AppointmentService from '../services/AppointmentService';

class AppointmentController {
  index(req, res) {
    return AppointmentService.list(req, res);
  }

  store(req, res) {
    return AppointmentService.save(req, res);
  }

  delete(req, res) {
    return AppointmentService.delete(req, res);
  }
}

export default new AppointmentController();
