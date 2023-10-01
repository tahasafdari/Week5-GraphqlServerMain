import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Query: {
    catById: async (_: undefined, args: {id: string}) => {
      const cat = await catModel.findById(args.id);
      if (!cat) {
        throw new GraphQLError('Cat not found');
      }
      return cat;
    },
    cats: async () => {
      const cats = await catModel.find();
      return cats;
    },
    catsByArea: async (_parent: undefined, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
    catsByOwner: async (_: undefined, args: {ownerId: string}) => {
      console.log(args.ownerId);
      const cats = await catModel.find({owner: args.ownerId});
      console.log(cats);
      return cats;
    },
  },

  Mutation: {
    createCat: async (_: undefined, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        return null;
      }
      args.owner = user.id;
      const cat = (await catModel.create(args)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not created', {
          extensions: {code: 'NOT_CREATED'},
        });
      }
      return cat;
    },

    updateCat: async (_: undefined, args: Cat, user: UserIdWithToken) => {
      const cat = (await catModel.findById(args.id)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.id !== cat.owner.toString() && user.role !== 'admin') {
        throw new GraphQLError('Unauthorized!', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      const updatedCat = (await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      })) as Cat;
      return updatedCat;
    },

    deleteCat: async (
      _: undefined,
      args: {id: string},
      user: UserIdWithToken
    ) => {
      const cat = (await catModel.findById(args.id)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.id !== cat.owner.toString() && user.role !== 'admin') {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      const deletedCat = (await catModel.findByIdAndDelete(args.id)) as Cat;
      return deletedCat;
    },
    updateCatAsAdmin: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      const cat = (await catModel.findById(args.id)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.role !== 'admin' || !user.token) {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      const updatedCat = (await catModel.findByIdAndUpdate(args.id, args, {
        new: true,
      })) as Cat;
      return updatedCat;
    },
    deleteCatAsAdmin: async (
      _parent: undefined,
      args: Cat,
      user: UserIdWithToken
    ) => {
      const cat = (await catModel.findById(args.id)) as Cat;
      if (!cat) {
        throw new GraphQLError('Cat not found', {
          extensions: {code: 'NOT_FOUND'},
        });
      }
      if (user.role !== 'admin' || !user.token) {
        throw new GraphQLError('Unauthorized', {
          extensions: {code: 'UNAUTHORIZED'},
        });
      }
      const deletedCat = (await catModel.findByIdAndDelete(args.id)) as Cat;
      return deletedCat;
    },
  },
};
