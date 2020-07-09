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

  availableProvider(req, res) {
    return UserService.availableProvider(req, res);
  }
}

export default new UserController();
