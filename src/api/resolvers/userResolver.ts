import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
import fetchData from '../../functions/fetchData';
import AuthMessageResponse from '../../interfaces/AuthMessageResponse';
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Cat: {
    owner: async (parent: Cat) => {
      const response = await fetch(
        `${process.env.AUTH_URL}/users/${parent.owner}`
      );
      if (!response.ok) {
        throw new GraphQLError('User not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
  },
  Query: {
    users: async () => {
      const users = await fetchData<AuthMessageResponse>(
        `${process.env.AUTH_URL}/users`
      );
      console.log(users);
      return users;
    },
    userById: async (_: undefined, args: {id: string}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`);
      if (!response.ok) {
        throw new GraphQLError('User not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
    checkToken: async (_: undefined, args: UserIdWithToken) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
        headers: {
          Authorization: `Bearer ${args.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError('Token not valid', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      const userFromAuthServer = (await response.json()) as User;
      return userFromAuthServer;
    },
  },
  Mutation: {
    login: async (
      _: undefined,
      args: {credentials: {username: string; password: string}}
    ) => {
      const options: RequestInit = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(args.credentials),
      };
      const user = await fetchData<LoginMessageResponse>(
        `${process.env.AUTH_URL}/auth/login`,
        options
      );
      return user;
    },

    register: async (_parent: undefined, args: {user: User}) => {
      const options: RequestInit = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(args.user),
      };
      const response = await fetchData<LoginMessageResponse>(
        `${process.env.AUTH_URL}/users`,
        options
      );

      return response;
    },
    //when updating or deleting a user don't send id to the auth server, it will get it from the token
    updateUser: async (
      _: undefined,
      args: {user: User}, //input
      user: UserIdWithToken //context
    ) => {
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(args.user),
      };
      const response = await fetchData<User>(
        `${process.env.AUTH_URL}/users`,
        options
      );
      return response;
    },

    deleteUser: async (
      _: undefined,
      __: undefined, //input
      user: UserIdWithToken //context
    ) => {
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await fetchData<User>(
        `${process.env.AUTH_URL}/users`,
        options
      );
      return response;
    },

    //In this method we need to check if the user is an admin by checking the role from the user object
    updateUserAsAdmin: async (
      _: undefined,
      args: User,
      user: UserIdWithToken
    ) => {
      if (!user.token || !user.role.includes('admin')) {
        return null;
      }
      const options: RequestInit = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
          role: user.role,
        },
        body: JSON.stringify(args),
      };
      const response = await fetchData<User>(
        `${process.env.AUTH_URL}/users`,
        options
      );
      return response;
    },

    deleteUserAsAdmin: async (
      _: undefined,
      args: User,
      user: UserIdWithToken
    ) => {
      if (!user.token || !user.role.includes('admin')) {
        return null;
      }
      const options: RequestInit = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
          role: user.role,
        },
      };
      const response = await fetchData<User>(
        `${process.env.AUTH_URL}/users/${args.id}`,
        options
      );
      return response;
    },
  },
};
