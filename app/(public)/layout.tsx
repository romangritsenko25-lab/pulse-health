import NavBar from '@/components/NavBar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="pt-14">{children}</main>
    </>
  )
}
