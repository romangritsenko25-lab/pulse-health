import NavBar from '@/components/NavBar'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <div>{children}</div>
    </>
  )
}
