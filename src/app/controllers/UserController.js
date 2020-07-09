import UserService from '../services/UserService';

class UserController {
  store(req, res) {
    return UserService.save(req, res);
  }

  update(req, res) {
    return UserService.update(req, res);
  }

  allProviders(req, res) {
    return UserService.allProviders(req, res);
  }
}

export default new UserController();
