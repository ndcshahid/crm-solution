export type UserRole = 'super_admin' | 'admin' | 'sales_manager' | 'sales_executive' | 'viewer'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: UserRole
  companyId: string
  companyName: string
  permissions: string[]
}

declare module 'next-auth' {
  interface Session {
    user: SessionUser & { image?: string | null }
  }
}
