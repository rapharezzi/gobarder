import * as Yup from 'yup';
import pt, {
  startOfHour, parseISO, isBefore, format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
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

  async store(req, res) {
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
}

export default new AppointmentController();
