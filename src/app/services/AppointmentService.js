import * as Yup from 'yup';
import ptBR, {
  startOfHour, parseISO, isBefore, format, subHours,
} from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

class AppointmentService {
  async list(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['data'],
      attributes: ['id', 'data'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'name'],
        include: [{
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        }],
      }],
    });
    return res.json(appointments);
  }

  async save(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      data: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, data } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res.status(401).json({ error: 'You can only create appointments with provider' });
    }

    const hourStart = startOfHour(parseISO(data));
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const isAvaliability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        data: hourStart,
      },
    });

    if (isAvaliability) {
      return res.status(400).json({ error: 'Appointment date is not avaliable' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      data: hourStart,
    });

    const user = await User.findByPk(req.userId);
    const formattedDate = format(hourStart, "'dia' dd 'de' MMMM', às' H:mm'h'", {
      locale: ptBR,
    });

    await Notification.create({
      content: `Novo agendamento para ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);
    if (appointment.user_id !== req.userId) {
      return res.status(401).json({ error: "You don't have permission to cancel this appointment" });
    }

    const dateWithSub = subHours(appointment.data, 2);
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({ error: 'You can only cancel appointment 2 hours in advance.' });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    return res.json(appointment);
  }
}

export default new AppointmentService();
