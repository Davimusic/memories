/*import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import admin from '../../../lib/firebaseAdmin'; // Adjust path to your firebaseAdmin.js

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Firebase',
      credentials: {
        idToken: { label: 'ID Token', type: 'text' },
      },
      async authorize(credentials) {
        try {
          // Verify Firebase ID token using Admin SDK
          const decodedToken = await admin.auth().verifyIdToken(credentials.idToken);
          const user = await admin.auth().getUser(decodedToken.uid);
          if (user) {
            return {
              id: user.uid,
              email: user.email,
              name: user.displayName || user.email,
            };
          }
          return null;
        } catch (error) {
          console.error('Authorize error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id; // Store Firebase UID
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.uid = token.uid; // Add Firebase UID to session
      session.user.email = token.email;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});*/