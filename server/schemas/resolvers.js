const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {

    // Query to return a user

    Query: {

        me: async(parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                return userData;
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    },

    // Mutation to add sign up / add user functionality

    Mutation: {

        addUser: async ( parent, args ) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        
        login: async ( parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
              throw new AuthenticationError('No user with this email found!');
            }

            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
              throw new AuthenticationError('Incorrect username or password');
            }

            const token = signToken(user);
            
            return { token, user };
        },
        
        saveBook: async ( parent, args, context ) => {
            if(context.user){
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {$push: { savedBooks: args }},
                    { new: true, runValidators: true }
                );
                return updatedUser;
            }
            throw new Error('Could not add this book!');
        },
        
        removeBook: async ( parent, { bookId }, context ) => {
            if(context.user){
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId }}},
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Could not delete this book!');
        }
    }
};

module.exports = resolvers;