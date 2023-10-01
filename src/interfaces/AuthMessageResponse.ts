import {UserLogin} from './User';

interface AuthMessageResponse {
  message: string;
  data: UserLogin;
}

export default AuthMessageResponse;
