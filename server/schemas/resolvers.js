const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {

    // Query to return a user

    Query: {

        me: async ( parent, args, context ) => {
            if (context.user) {
                const userData = await User.findOne({ })
                    .select('-__v -password')
                    .populate('books')
                    
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
                    {$addToSet: { savedBooks: args.input }},
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Could not add this book!');
        },
        
        removeBook: async ( parent, args, context ) => {
            if(context.user){
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: args.bookId } } },
                    { new: true }
                );
                return updatedUser;
            }
            throw new AuthenticationError('Could not delete this book!');
        }
    }
};

module.exports = resolvers;