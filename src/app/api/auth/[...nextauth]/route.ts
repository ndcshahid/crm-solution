import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
            company: true,
          },
        })
        if (!user) throw new Error('Invalid email or password')
        if (user.status !== 'active') throw new Error('Account is deactivated. Contact your administrator.')

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) throw new Error('Invalid email or password')

        // Update last login
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          companyId: user.companyId,
          companyName: user.company.name,
          permissions: user.role.permissions.map((rp: any) => rp.permission.name),
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = (user as any).id
        token.role        = (user as any).role
        token.companyId   = (user as any).companyId
        token.companyName = (user as any).companyName
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id          = token.id
        ;(session.user as any).role        = token.role
        ;(session.user as any).companyId   = token.companyId
        ;(session.user as any).companyName = token.companyName
        ;(session.user as any).permissions = token.permissions
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
